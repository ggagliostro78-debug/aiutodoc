const GOOGLE_SEARCH_URL = "https://www.googleapis.com/customsearch/v1";

const DEFAULT_RESULT_COUNT = 16;
const LOCAL_COUNT = 8;
const REGIONAL_COUNT = 5;
const NATIONAL_COUNT = 3;

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
    return { apiKey, searchEngineId };
}

async function fetchGoogleResults({ query, scope, fetchImpl }) {
    const { apiKey, searchEngineId } = getSearchConfig();
    if (!apiKey || !searchEngineId) {
        const error = new Error("Ricerca Google non configurata: imposta GOOGLE_CSE_API_KEY e GOOGLE_CSE_ID.");
        error.code = "GOOGLE_SEARCH_CONFIG_MISSING";
        throw error;
    }

    const url = new URL(GOOGLE_SEARCH_URL);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("cx", searchEngineId);
    url.searchParams.set("q", query);
    url.searchParams.set("num", "10");
    url.searchParams.set("hl", "it");
    url.searchParams.set("gl", "it");
    url.searchParams.set("safe", "active");

    const response = await fetchImpl(url.toString(), {
        headers: { "Accept": "application/json" }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google Search API error (${response.status}): ${errorText}`);
    }

    const payload = await response.json();
    const items = Array.isArray(payload.items) ? payload.items : [];

    return items
        .filter((item) => /^https:\/\//i.test(item.link || ""))
        .map((item) => ({
            nome: cleanText(item.title, "Risultato Google verificabile"),
            specializzazione: "",
            tipo: scope,
            indirizzo_modalita: cleanText(query),
            contatti: "Verifica recapiti, sede e disponibilita sulla pagina ufficiale collegata.",
            fonte: "Google Custom Search",
            info: cleanText(item.snippet, "Risultato individuato tramite ricerca Google."),
            url: item.link
        }));
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

    const [localRaw, regionalRaw, nationalRaw] = await Promise.all([
        fetchGoogleResults({ query: localQuery, scope: "Provincia", fetchImpl }),
        fetchGoogleResults({ query: regionalQuery, scope: "Regione", fetchImpl }),
        fetchGoogleResults({ query: nationalQuery, scope: "Nazionale", fetchImpl })
    ]);

    const local = dedupeResults(localRaw);
    const regional = dedupeResults(regionalRaw);
    const national = dedupeResults(nationalRaw);

    const results = dedupeResults([
        ...local.slice(0, LOCAL_COUNT),
        ...regional.slice(0, REGIONAL_COUNT),
        ...national.slice(0, NATIONAL_COUNT)
    ]).slice(0, DEFAULT_RESULT_COUNT);

    return {
        distribution: {
            provincia: LOCAL_COUNT,
            regione: REGIONAL_COUNT,
            nazionale: NATIONAL_COUNT
        },
        queries: {
            provincia: localQuery,
            regione: regionalQuery,
            nazionale: nationalQuery
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
