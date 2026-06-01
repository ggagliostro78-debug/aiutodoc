const PLACES_API_URL = "https://places.googleapis.com/v1/places:searchText";
const NOMINATIM_API_URL = "https://nominatim.openstreetmap.org/search";
const {
    enforceRateLimit,
    truncateText,
    validateBodySize
} = require("./request_guard");

const MAX_QUERY_FIELD_LENGTH = 120;

function buildCorsHeaders() {
    const allowedOrigin = process.env.GEMINI_ALLOWED_ORIGIN || process.env.SEARCH_ALLOWED_ORIGIN;
    if (!allowedOrigin) return {};

    return {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400"
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

function cleanField(value) {
    return truncateText(value, MAX_QUERY_FIELD_LENGTH);
}

async function fetchPlaces(query, apiKey, fetchImpl) {
    try {
        const response = await fetchImpl(PLACES_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": apiKey,
                "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.types,places.websiteUri"
            },
            body: JSON.stringify({
                textQuery: query,
                languageCode: "it",
                maxResultCount: 20
            })
        });

        if (!response.ok) {
            console.error(`Google Places API Error for query "${query}":`, response.status);
            return [];
        }

        const data = await response.json();
        return data.places || [];
    } catch (e) {
        console.error(`Error searching Places for query "${query}":`, e);
        return [];
    }
}

function pickLocationLabel(address, fallbackName) {
    return address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.hamlet ||
        address.suburb ||
        fallbackName ||
        "";
}

async function validateItalianLocation(query, fetchImpl) {
    const params = new URLSearchParams({
        format: "json",
        addressdetails: "1",
        countrycodes: "it",
        limit: "5",
        q: query
    });

    const response = await fetchImpl(`${NOMINATIM_API_URL}?${params.toString()}`, {
        headers: {
            "Accept": "application/json",
            "User-Agent": "AiutoDoc/1.0 location-validation"
        }
    });

    if (!response.ok) {
        throw new Error(`Nominatim validation failed with status ${response.status}`);
    }

    const places = await response.json();
    const match = (places || []).find((place) => {
        const address = place.address || {};
        return String(address.country_code || "").toLowerCase() === "it";
    });

    if (!match) return null;

    const address = match.address || {};
    const fallbackName = String(match.display_name || "").split(",")[0].trim();
    const comune = pickLocationLabel(address, fallbackName);
    const provincia = address.county ||
        address.province ||
        address.state_district ||
        comune;
    const regione = address.state || address.region || provincia;

    if (!comune) return null;

    return {
        comune,
        provincia,
        regione,
        displayName: match.display_name || comune
    };
}

const filterOutKeywords = /\b(sanitaria|sanitari|officina ortopedica|articoli ortopedici|articoli sanitari|calzature ortopediche|negozio|vendita|calzature|ausili|farmacia|parafarmacia|para-farmacia|noleggio ausili|medical store|medical systems)\b/i;

function isValidPlace(p) {
    const name = p.displayName?.text || "";
    if (filterOutKeywords.test(name)) {
        return false;
    }
    
    // Check types
    const types = p.types || [];
    const excludedTypes = ["pharmacy", "drugstore", "store", "home_goods_store", "shopping_mall", "beauty_salon"];
    if (types.some(t => excludedTypes.includes(t))) {
        return false;
    }
    
    // Exclude competitors from name
    const lowerName = name.toLowerCase();
    if (lowerName.includes("miodottore") || 
        lowerName.includes("topdoctors") || 
        lowerName.includes("dottori") || 
        lowerName.includes("guidapsicologi") || 
        lowerName.includes("idoctors") || 
        lowerName.includes("doctolib") || 
        lowerName.includes("cupsolidale") || 
        lowerName.includes("docplanner")) {
        return false;
    }
    
    return true;
}

function classifyPlace(name, types = []) {
    const nameLower = (name || "").toLowerCase();
    
    // SSN keywords (public hospitals, local health authorities, or accredited clinical institutes)
    const ssnKeywords = [
        "ospedale", "ospedaliero", "ospedaliera", "policlinico", "asl", "asp", "usl", "ssn", 
        "presidio", "asst", "ats", "a.o.", "a.o.u.", "pubblic", "sanitaria locale", "sanitario locale",
        "istituto", "iomi", "clinica", "casa di cura", "irccs", "fondazione", 
        "don calabria", "humanitas", "auxologico", "galeazzi", "rizzoli", "sacco", "niguarda",
        "fatebenefratelli", "gemelli", "umberto i", "san raffaele", "careggi", "spallanzani", 
        "sant'orsola", "cardarelli", "monaldi", "cotugno"
    ];
    
    if (ssnKeywords.some(kw => nameLower.includes(kw))) {
        return "SSN";
    }

    if (types.includes("hospital")) {
        return "SSN";
    }
    
    return "Privato";
}

function formatPlace(p) {
    const name = p.displayName ? p.displayName.text : "Centro Medico / Specialista";
    const address = p.formattedAddress || "Indirizzo non disponibile";
    const phone = p.nationalPhoneNumber || "";
    let website = p.websiteUri || "";
    
    // Competitor strip
    if (website.toLowerCase().includes("miodottore") || 
        website.toLowerCase().includes("topdoctors") || 
        website.toLowerCase().includes("dottori") || 
        website.toLowerCase().includes("guidapsicologi") || 
        website.toLowerCase().includes("idoctors") || 
        website.toLowerCase().includes("doctolib") || 
        website.toLowerCase().includes("cupsolidale") || 
        website.toLowerCase().includes("docplanner")) {
        website = "";
    }

    let contatti = [];
    if (phone) contatti.push(`Telefono: ${phone}`);
    if (website) contatti.push(`Sito web: ${website}`);

    const classifiedType = classifyPlace(name, p.types || []);
    const infoLabel = classifiedType === "SSN"
        ? "Struttura o specialista operante in regime SSN (pubblico o convenzionato)."
        : "Specialista o struttura sanitaria privata in regime di libera professione.";

    return {
        nome: name,
        specializzazione: "", // Frontend will fill this
        tipo: classifiedType,
        indirizzo_modalita: address,
        contatti: contatti.join(" | ") || "Contatta la struttura per informazioni",
        info: infoLabel,
        telefono: phone
    };
}


async function handlePlacesSearch({ method, body, fetchImpl = fetch, context = {} }) {
    const corsHeaders = buildCorsHeaders();

    if (method === "OPTIONS") {
        return { statusCode: 204, headers: corsHeaders, body: "" };
    }

    if (method !== "POST") {
        return buildResponse(405, { error: "Metodo non consentito." }, corsHeaders);
    }

    const rateLimit = enforceRateLimit(context.ip || "anonymous", {
        scope: "places",
        limit: Number(process.env.SEARCH_RATE_LIMIT_PER_MINUTE || 30)
    });
    const rateLimitResponse = buildGuardResponse(rateLimit, corsHeaders);
    if (rateLimitResponse) return rateLimitResponse;

    const bodySize = validateBodySize(body);
    const bodySizeResponse = buildGuardResponse(bodySize, corsHeaders);
    if (bodySizeResponse) return bodySizeResponse;

    const payload = parseBody(body);
    const action = cleanField(payload.action);
    const specialista = cleanField(payload.specialista);
    const comune = cleanField(payload.comune);
    const provincia = cleanField(payload.provincia);
    const regione = cleanField(payload.regione);
    const fallbackQuery = cleanField(payload.query);
    const locationQuery = cleanField(payload.location || payload.localita || fallbackQuery);

    if (action === "validateLocation") {
        if (!locationQuery) {
            return buildResponse(400, { error: "Localita mancante." }, corsHeaders);
        }

        try {
            const location = await validateItalianLocation(locationQuery, fetchImpl);
            return buildResponse(200, {
                found: Boolean(location),
                location
            }, corsHeaders);
        } catch (error) {
            console.error("Errore validazione localita:", error);
            return buildResponse(502, {
                error: "Errore durante la verifica della localita.",
                detail: error instanceof Error ? error.message : String(error)
            }, corsHeaders);
        }
    }

    // Fallback to simple query if structured params not provided
    if (!specialista && !fallbackQuery) {
        return buildResponse(400, { error: "Parametri di ricerca mancanti." }, corsHeaders);
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_CSE_API_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return buildResponse(500, { error: "Chiave Google API non configurata." }, corsHeaders);
    }

    try {
        let localRaw = [];
        let regionalRaw = [];
        let nationalRaw = [];

        if (specialista) {
            const regionName = regione || "";
            const provinceName = provincia || comune || "";

            const localQuery = `${specialista} ${provinceName}`.trim();
            const regionalQuery = `${specialista} eccellenza ${regionName}`.trim();
            const nationalQuery = `${specialista} eccellenza Milano Roma Bologna`.trim();

            const [resLocal, resRegional, resNational] = await Promise.all([
                fetchPlaces(localQuery, apiKey, fetchImpl),
                fetchPlaces(regionalQuery, apiKey, fetchImpl),
                fetchPlaces(nationalQuery, apiKey, fetchImpl)
            ]);

            localRaw = resLocal;
            regionalRaw = resRegional;
            nationalRaw = resNational;
        } else {
            // Fallback
            localRaw = await fetchPlaces(fallbackQuery, apiKey, fetchImpl);
        }

        const localList = [];
        const regionalList = [];
        const nationalList = [];
        const seenNames = new Set();

        const regionLabel = regione || "Regione";
        const provinceLabel = provincia || comune || "Provincia";

        // 1. Local
        for (const p of localRaw) {
            if (!isValidPlace(p)) continue;
            const nameKey = p.displayName?.text?.toLowerCase().trim();
            if (!nameKey || seenNames.has(nameKey)) continue;
            seenNames.add(nameKey);
            localList.push(formatPlace(p));
        }

        // 2. Regional
        for (const p of regionalRaw) {
            if (!isValidPlace(p)) continue;
            const nameKey = p.displayName?.text?.toLowerCase().trim();
            if (!nameKey || seenNames.has(nameKey)) continue;
            seenNames.add(nameKey);
            regionalList.push(formatPlace(p));
        }

        // 3. National
        for (const p of nationalRaw) {
            if (!isValidPlace(p)) continue;
            const nameKey = p.displayName?.text?.toLowerCase().trim();
            if (!nameKey || seenNames.has(nameKey)) continue;
            seenNames.add(nameKey);
            nationalList.push(formatPlace(p));
        }

        // Assemble with 50% / 30% / 20% distribution
        const finalResults = [];

        // 8 Local (50%)
        const localToTake = localList.slice(0, 8);
        finalResults.push(...localToTake);

        // 5 Regional (30%)
        const regionalToTake = regionalList.slice(0, 5);
        finalResults.push(...regionalToTake);

        // 3 National (20%)
        const nationalToTake = nationalList.slice(0, 3);
        finalResults.push(...nationalToTake);

        // Fill up to 16 if not enough
        let remainingLocal = localList.slice(8);
        let remainingRegional = regionalList.slice(5);
        let remainingNational = nationalList.slice(3);

        while (finalResults.length < 16 && (remainingLocal.length > 0 || remainingRegional.length > 0 || remainingNational.length > 0)) {
            if (remainingLocal.length > 0) {
                finalResults.push(remainingLocal.shift());
            } else if (remainingRegional.length > 0) {
                finalResults.push(remainingRegional.shift());
            } else if (remainingNational.length > 0) {
                finalResults.push(remainingNational.shift());
            }
        }

        return buildResponse(200, { risultati: finalResults }, corsHeaders);

    } catch (error) {
        return buildResponse(502, {
            error: "Errore durante la ricerca strutturata su Google Places.",
            detail: error instanceof Error ? error.message : String(error)
        }, corsHeaders);
    }
}

module.exports = {
    handlePlacesSearch
};
