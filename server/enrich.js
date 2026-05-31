const SERPAPI_SEARCH_URL = "https://serpapi.com/search.json";
const {
    enforceRateLimit,
    truncateText,
    validateBodySize
} = require("./request_guard");

const MAX_QUERY_LENGTH = 180;

function buildCorsHeaders() {
    const allowedOrigin = process.env.GEMINI_ALLOWED_ORIGIN || process.env.SEARCH_ALLOWED_ORIGIN;
    if (!allowedOrigin) return {};

    return {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    };
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

function parseBody(body) {
    if (!body) return {};
    if (typeof body === "string") {
        try { return JSON.parse(body); } catch (e) { return {}; }
    }
    return body;
}

function buildGuardResponse(guardResult, corsHeaders) {
    if (!guardResult) return null;
    return buildResponse(guardResult.statusCode, guardResult.payload, {
        ...corsHeaders,
        ...(guardResult.headers || {})
    });
}

async function handleEnrichEntity({ method, body, fetchImpl = fetch, context = {} }) {
    const corsHeaders = buildCorsHeaders();

    if (method === "OPTIONS") {
        return {
            statusCode: 204,
            headers: corsHeaders,
            body: ""
        };
    }

    if (method !== "POST") {
        return buildResponse(405, { error: "Metodo non consentito. Usa POST." }, corsHeaders);
    }

    const rateLimit = enforceRateLimit(context.ip || "anonymous", {
        scope: "enrich",
        limit: Number(process.env.SEARCH_RATE_LIMIT_PER_MINUTE || 30)
    });
    const rateLimitResponse = buildGuardResponse(rateLimit, corsHeaders);
    if (rateLimitResponse) return rateLimitResponse;

    const bodySize = validateBodySize(body);
    const bodySizeResponse = buildGuardResponse(bodySize, corsHeaders);
    if (bodySizeResponse) return bodySizeResponse;

    const { query: rawQuery } = parseBody(body);
    const query = truncateText(rawQuery, MAX_QUERY_LENGTH);
    if (!query) {
        return buildResponse(400, { error: "Manca il parametro query." }, corsHeaders);
    }

    const serpApiKey = process.env.SERPAPI_API_KEY;
    if (!serpApiKey) {
        return buildResponse(500, { error: "SERPAPI_API_KEY mancante nel backend." }, corsHeaders);
    }

    try {
        const url = new URL(SERPAPI_SEARCH_URL);
        url.searchParams.set("engine", "google");
        url.searchParams.set("api_key", serpApiKey);
        url.searchParams.set("q", query);
        url.searchParams.set("hl", "it");
        url.searchParams.set("gl", "it");
        url.searchParams.set("google_domain", "google.it");

        const response = await fetchImpl(url.toString(), {
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) {
            throw new Error(`SerpApi responded with ${response.status}`);
        }

        const data = await response.json();
        
        // Priority 1: Knowledge Graph
        if (data.knowledge_graph) {
            const kg = data.knowledge_graph;
            if (kg.indirizzo || kg.telefono) {
                return buildResponse(200, {
                    telefono: kg.telefono || "",
                    indirizzo: kg.indirizzo || "",
                    fonte: "Google Knowledge Graph"
                }, corsHeaders);
            }
        }
        
        // Priority 2: Local Results (Maps)
        if (data.local_results && data.local_results.length > 0) {
            const loc = data.local_results[0];
            return buildResponse(200, {
                telefono: loc.phone || "",
                indirizzo: loc.address || "",
                fonte: "Google Maps"
            }, corsHeaders);
        }

        // Priority 3: Fallback (nothing found)
        return buildResponse(200, {
            telefono: "",
            indirizzo: "",
            fonte: "Nessun dato strutturato trovato"
        }, corsHeaders);

    } catch (error) {
        console.error("Enrichment Error:", error);
        return buildResponse(500, { error: error.message }, corsHeaders);
    }
}

module.exports = { handleEnrichEntity };
