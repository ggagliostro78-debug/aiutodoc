const GOOGLE_SEARCH_URL = "https://www.googleapis.com/customsearch/v1";
const SERPAPI_SEARCH_URL = "https://serpapi.com/search.json";

const DEFAULT_RESULT_COUNT = 16;
const LOCAL_COUNT = 8;
const REGIONAL_COUNT = 5;
const NATIONAL_COUNT = 3;
const EXTRA_COUNT = 10;

function parseBody(body) {
    if (!body) return {};
    if (typeof body === "string") {
        try {
            return JSON.parse(body);
        } catch (error) {
            return {};
        }
    }
    if (typeof body === "object") return body;
    return {};
}

function buildResponse(statusCode, payload, extraHeaders = {}) {
    return {
        statusCode,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
            ...extraHeaders
        },
        body: JSON.stringify(payload)
    };
}

function buildCorsHeaders() {
    const allowedOrigin = process.env.GEMINI_ALLOWED_ORIGIN || process.env.SEARCH_ALLOWED_ORIGIN;
    if (!allowedOrigin) return {};

    return {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    };
}

function cleanText(value, fallback = "") {
    return String(value || fallback).replace(/\s+/g, " ").trim();
}

function getSearchConfig() {
    const apiKey = process.env.GOOGLE_CSE_API_KEY || process.env.GOOGLE_SEARCH_API_KEY || "";
    const searchEngineId = process.env.GOOGLE_CSE_ID || process.env.GOOGLE_SEARCH_ENGINE_ID || "";
    const serpApiKey = process.env.SERPAPI_API_KEY || "";
    return { apiKey, searchEngineId, serpApiKey };
}

function normalizeSearchItem({ title, link, snippet, query, scope, source }) {
    return {
        nome: cleanText(title, "Risultato Google verificabile"),
        specializzazione: "",
        tipo: scope,
        indirizzo_modalita: cleanText(query),
        contatti: "Verifica recapiti, sede e disponibilita sulla pagina ufficiale collegata.",
        fonte: source,
        info: cleanText(snippet, "Risultato individuato tramite ricerca Google."),
        url: link
    };
}

async function fetchGoogleCseResults({ query, scope, apiKey, searchEngineId, fetchImpl, count = 10 }) {
    if (!apiKey || !searchEngineId) return [];

    const url = new URL(GOOGLE_SEARCH_URL);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("cx", searchEngineId);
    url.searchParams.set("q", query);
    url.searchParams.set("num", String(Math.min(Math.max(count, 1), 10)));
    url.searchParams.set("hl", "it");
    url.searchParams.set("gl", "it");
    url.searchParams.set("safe", "active");

    const response = await fetchImpl(url.toString(), {
        headers: { "Accept": "application/json" }
    });

    if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`Google Search API error (${response.status}): ${errorText}`);
        error.code = "GOOGLE_CSE_ERROR";
        throw error;
    }

    const payload = await response.json();
    const items = Array.isArray(payload.items) ? payload.items : [];

    return items
        .filter((item) => /^https:\/\//i.test(item.link || ""))
        .map((item) => normalizeSearchItem({
            title: item.title,
            link: item.link,
            snippet: item.snippet,
            query,
            scope,
            source: "Google Custom Search"
        }));
}

async function fetchSerpApiResults({ query, scope, serpApiKey, fetchImpl, count = 10 }) {
    if (!serpApiKey) return [];

    const url = new URL(SERPAPI_SEARCH_URL);
    url.searchParams.set("engine", "google");
    url.searchParams.set("api_key", serpApiKey);
    url.searchParams.set("q", query);
    url.searchParams.set("hl", "it");
    url.searchParams.set("gl", "it");
    url.searchParams.set("google_domain", "google.it");
    url.searchParams.set("num", String(Math.min(Math.max(count, 1), 20)));

    const response = await fetchImpl(url.toString(), {
        headers: { "Accept": "application/json" }
    });

    if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`SerpApi error (${response.status}): ${errorText}`);
        error.code = "SERPAPI_ERROR";
        throw error;
    }

    const payload = await response.json();
    if (payload.error) {
        const error = new Error(`SerpApi error: ${payload.error}`);
        error.code = "SERPAPI_ERROR";
        throw error;
    }

    const items = Array.isArray(payload.organic_results) ? payload.organic_results : [];

    return items
        .filter((item) => /^https:\/\//i.test(item.link || ""))
        .map((item) => normalizeSearchItem({
            title: item.title,
            link: item.link,
            snippet: item.snippet,
            query,
            scope,
            source: "SerpApi Google"
        }));
}

async function fetchGoogleResults({ query, scope, fetchImpl, count = 10 }) {
    const { apiKey, searchEngineId, serpApiKey } = getSearchConfig();
    if (!apiKey && !serpApiKey) {
        const error = new Error("Ricerca Google non configurata: imposta GOOGLE_CSE_API_KEY/GOOGLE_CSE_ID oppure SERPAPI_API_KEY.");
        error.code = "GOOGLE_SEARCH_CONFIG_MISSING";
        throw error;
    }

    if (apiKey && searchEngineId) {
        try {
            return await fetchGoogleCseResults({ query, scope, apiKey, searchEngineId, fetchImpl, count });
        } catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            const cseUnavailable = /does not have the access to Custom Search JSON API|PERMISSION_DENIED/i.test(detail);
            if (!cseUnavailable || !serpApiKey) {
                throw error;
            }
        }
    }

    return fetchSerpApiResults({ query, scope, serpApiKey, fetchImpl, count });
}

function dedupeResults(results) {
    const seen = new Set();
    return results.filter((result) => {
        const key = cleanText(result.url || `${result.nome}|${result.indirizzo_modalita}`).toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

async function searchSpecialists(payload, fetchImpl) {
    const specialista = cleanText(payload.specialista, "medico specialista");
    const disturbo = cleanText(payload.disturbo);
    const zona = cleanText(payload.zona, "Italia");
    const provincia = cleanText(payload.provincia, zona);
    const regione = cleanText(payload.regione, zona);

    const clinicalTerms = [specialista, disturbo].filter(Boolean).join(" ");
    const localQuery = `${clinicalTerms} specialista studio medico ${provincia}`.trim();
    const regionalQuery = `${clinicalTerms} centro specialistico ${regione}`.trim();
    const nationalQuery = `${clinicalTerms} eccellenza specialistica Italia`.trim();
    const extraRegionalQuery = `${clinicalTerms} ortopedia ginocchio clinica ospedale ${regione}`.trim();
    const extraNationalQuery = `${clinicalTerms} migliori specialisti ospedali Italia`.trim();

    const [localRaw, regionalRaw, nationalRaw] = await Promise.all([
        fetchGoogleResults({ query: localQuery, scope: "Provincia", fetchImpl }),
        fetchGoogleResults({ query: regionalQuery, scope: "Regione", fetchImpl }),
        fetchGoogleResults({ query: nationalQuery, scope: "Nazionale", fetchImpl })
    ]);

    const local = dedupeResults(localRaw);
    const regional = dedupeResults(regionalRaw);
    const national = dedupeResults(nationalRaw);

    let results = dedupeResults([
        ...local.slice(0, LOCAL_COUNT),
        ...regional.slice(0, REGIONAL_COUNT),
        ...national.slice(0, NATIONAL_COUNT)
    ]).slice(0, DEFAULT_RESULT_COUNT);

    if (results.length < DEFAULT_RESULT_COUNT) {
        const [extraRegionalRaw, extraNationalRaw] = await Promise.all([
            fetchGoogleResults({ query: extraRegionalQuery, scope: "Regione", fetchImpl, count: EXTRA_COUNT }),
            fetchGoogleResults({ query: extraNationalQuery, scope: "Nazionale", fetchImpl, count: EXTRA_COUNT })
        ]);

        results = dedupeResults([
            ...results,
            ...extraRegionalRaw,
            ...extraNationalRaw
        ]).slice(0, DEFAULT_RESULT_COUNT);
    }

    return {
        distribution: {
            provincia: LOCAL_COUNT,
            regione: REGIONAL_COUNT,
            nazionale: NATIONAL_COUNT
        },
        queries: {
            provincia: localQuery,
            regione: regionalQuery,
            nazionale: nationalQuery,
            regione_extra: extraRegionalQuery,
            nazionale_extra: extraNationalQuery
        },
        results
    };
}

async function handleSpecialistSearch({ method, body, fetchImpl = fetch }) {
    const corsHeaders = buildCorsHeaders();

    if (method === "OPTIONS") {
        return {
            statusCode: 204,
            headers: corsHeaders,
            body: ""
        };
    }

    if (method !== "POST") {
        return buildResponse(405, { error: "Metodo non consentito." }, corsHeaders);
    }

    const payload = parseBody(body);
    if (!cleanText(payload.specialista)) {
        return buildResponse(400, { error: "Specialista mancante." }, corsHeaders);
    }

    try {
        const searchResponse = await searchSpecialists(payload, fetchImpl);
        return buildResponse(200, searchResponse, corsHeaders);
    } catch (error) {
        const isMissingConfig = error && error.code === "GOOGLE_SEARCH_CONFIG_MISSING";
        return buildResponse(502, {
            error: "Errore ricerca specialisti.",
            code: isMissingConfig ? "GOOGLE_SEARCH_CONFIG_MISSING" : "GOOGLE_SEARCH_ERROR",
            detail: error instanceof Error ? error.message : String(error)
        }, corsHeaders);
    }
}

module.exports = {
    handleSpecialistSearch,
    searchSpecialists
};
