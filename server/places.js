const PLACES_API_URL = "https://places.googleapis.com/v1/places:searchText";

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

function formatPlace(p, typeLabel, infoLabel) {
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

    return {
        nome: name,
        specializzazione: "", // Frontend will fill this
        tipo: typeLabel,
        indirizzo_modalita: address,
        contatti: contatti.join(" | ") || "Contatta la struttura per informazioni",
        info: infoLabel,
        telefono: phone
    };
}

async function handlePlacesSearch({ method, body, fetchImpl = fetch }) {
    const corsHeaders = buildCorsHeaders();

    if (method === "OPTIONS") {
        return { statusCode: 204, headers: corsHeaders, body: "" };
    }

    if (method !== "POST") {
        return buildResponse(405, { error: "Metodo non consentito." }, corsHeaders);
    }

    const payload = parseBody(body);
    const { specialista, comune, provincia, regione, query: fallbackQuery } = payload;

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
            localList.push(formatPlace(p, `Territoriale (${provinceLabel})`, "Struttura o specialista individuato sul territorio provinciale."));
        }

        // 2. Regional
        for (const p of regionalRaw) {
            if (!isValidPlace(p)) continue;
            const nameKey = p.displayName?.text?.toLowerCase().trim();
            if (!nameKey || seenNames.has(nameKey)) continue;
            seenNames.add(nameKey);
            regionalList.push(formatPlace(p, `Regionale (${regionLabel})`, "Centro di eccellenza o specialista individuato a livello regionale."));
        }

        // 3. National
        for (const p of nationalRaw) {
            if (!isValidPlace(p)) continue;
            const nameKey = p.displayName?.text?.toLowerCase().trim();
            if (!nameKey || seenNames.has(nameKey)) continue;
            seenNames.add(nameKey);
            nationalList.push(formatPlace(p, "Nazionale (Eccellenza)", "Centro o specialista di rilievo nazionale riconosciuto per l'eccellenza."));
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
