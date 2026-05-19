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

function extractEmail(text) {
    const match = cleanText(text).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    return match ? match[0] : "";
}

function extractPhone(text) {
    const value = cleanText(text);
    const matches = value.match(/(?:\+39\s*)?(?:0\d{1,4}[\s./-]?\d{5,8}|3\d{2}[\s./-]?\d{6,7})/g) || [];
    return matches
        .map((match) => cleanText(match).replace(/\s{2,}/g, " "))
        .filter((match) => match.replace(/\D/g, "").length >= 8)
        .slice(0, 2)
        .join(" | ");
}

function extractAddress(text) {
    const value = cleanText(text);
    const match = value.match(/\b(?:Via|Viale|Piazza|Piazzale|Corso|Largo|Strada|Contrada|Localita|Località)\s+[^.;|·]{3,80}/i);
    return match ? cleanText(match[0]).replace(/\s*,?\s*(?:Dott\.|Dr\.|Prof\.).*$/i, "") : "";
}

function htmlToText(html) {
    return cleanText(String(html || "")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&#39;/gi, "'")
        .replace(/&quot;/gi, '"'));
}

async function fetchPublicPageText(url, fetchImpl) {
    if (!/^https:\/\//i.test(url || "")) return "";

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    try {
        const response = await fetchImpl(url, {
            headers: {
                "Accept": "text/html,application/xhtml+xml",
                "User-Agent": "AIutoDocBot/1.0 (+https://aiutodoc.it)"
            },
            signal: controller.signal
        });
        if (!response.ok) return "";
        const contentType = response.headers.get("content-type") || "";
        if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) return "";
        return htmlToText(await response.text());
    } catch (error) {
        return "";
    } finally {
        clearTimeout(timer);
    }
}

async function enrichResult(result, fetchImpl) {
    if (result.telefono && result.email && !/^Area\s/i.test(result.indirizzo_modalita || "")) {
        return result;
    }

    const pageText = await fetchPublicPageText(result.url, fetchImpl);
    if (!pageText) return result;

    const phone = result.telefono || extractPhone(pageText);
    const email = result.email || extractEmail(pageText);
    const address = /^Area\s/i.test(result.indirizzo_modalita || "")
        ? extractAddress(pageText) || result.indirizzo_modalita
        : result.indirizzo_modalita;

    return {
        ...result,
        telefono: phone,
        email,
        indirizzo_modalita: address,
        contatti: [
            phone ? `Telefono: ${phone}` : "Telefono non disponibile nella scheda pubblica",
            email ? `Email: ${email}` : "Email non disponibile nella scheda pubblica"
        ].join(" | ")
    };
}

async function enrichResults(results, fetchImpl) {
    return Promise.all(results.map((result) => enrichResult(result, fetchImpl)));
}

function extractDisplayName(title, snippet) {
    const combined = `${cleanText(title)} ${cleanText(snippet)}`;
    const doctorMatch = combined.match(/\b(?:Dott\.ssa|Dott\.|Dr\.ssa|Dr\.|Prof\.ssa|Prof\.|Dottore|Dottoressa)\s+[A-ZÀ-Ý][A-Za-zÀ-ÿ'’-]+(?:\s+[A-ZÀ-Ý][A-Za-zÀ-ÿ'’-]+){0,3}/);
    if (doctorMatch) return cleanText(doctorMatch[0]);

    const facilityMatch = combined.match(/\b(?:Ospedale|Policlinico|Clinica|Casa di Cura|Centro Medico|Centro Specialistico|Istituto|Humanitas|Auxologico|GVM|San Raffaele|Gemelli|Niguarda)\s+[^.;|·]{2,70}/i);
    if (facilityMatch) return cleanText(facilityMatch[0]);

    const cleanTitle = cleanText(title);
    const genericTitle = /(?:^\d+\s+|migliori|prenota online|prenota la tua|reparti|servizi|visita specialistica|visita ortopedica|ortopedici\s+a|ortopedici\s+e|ginocchio\s+a|specialisti\s+a)/i.test(cleanTitle);
    return genericTitle ? "" : cleanTitle;
}

function getSearchConfig() {
    const apiKey = process.env.GOOGLE_CSE_API_KEY || process.env.GOOGLE_SEARCH_API_KEY || "";
    const searchEngineId = process.env.GOOGLE_CSE_ID || process.env.GOOGLE_SEARCH_ENGINE_ID || "";
    const serpApiKey = process.env.SERPAPI_API_KEY || "";
    return { apiKey, searchEngineId, serpApiKey };
}

function normalizeSearchItem({ title, link, snippet, query, scope, source }) {
    const fullText = `${cleanText(title)} ${cleanText(snippet)}`;
    const phone = extractPhone(fullText);
    const email = extractEmail(fullText);
    const address = extractAddress(fullText);
    const displayName = extractDisplayName(title, snippet);

    if (!displayName) return null;

    return {
        nome: displayName,
        specializzazione: "",
        tipo: scope,
        indirizzo_modalita: address || `Area ${scope.toLowerCase()}`,
        telefono: phone,
        email,
        contatti: [
            phone ? `Telefono: ${phone}` : "Telefono non disponibile nella scheda pubblica",
            email ? `Email: ${email}` : "Email non disponibile nella scheda pubblica"
        ].join(" | "),
        fonte: source,
        info: cleanText(snippet, "Scheda pubblica rilevata in rete."),
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
        }))
        .filter(Boolean);
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
        }))
        .filter(Boolean);
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
    const localQuery = `${clinicalTerms} ${provincia} dottore clinica ospedale telefono indirizzo email`.trim();
    const regionalQuery = `${clinicalTerms} ${regione} centro specialistico clinica ospedale telefono indirizzo`.trim();
    const nationalQuery = `${clinicalTerms} eccellenza specialistica Italia clinica ospedale telefono indirizzo`.trim();
    const extraRegionalQuery = `${clinicalTerms} ${regione} contatti prenotazioni studio medico`.trim();
    const extraNationalQuery = `${clinicalTerms} Italia contatti prenotazioni ospedale specialista`.trim();

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

    results = await enrichResults(results, fetchImpl);

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
