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

function formatPlace(p, searchScope = "") {
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
        telefono: phone,
        search_scope: searchScope
    };
}

function takeUnique(target, source, limit, seenNames) {
    for (const item of source) {
        if (target.length >= limit) break;
        const key = String(item.nome || "").toLowerCase().trim();
        if (!key || seenNames.has(key)) continue;
        seenNames.add(key);
        target.push(item);
    }
}

function splitByCareType(list) {
    return {
        publicOrAccredited: list.filter((item) => item.tipo === "SSN"),
        privateCare: list.filter((item) => item.tipo !== "SSN")
    };
}

function formatPlaceList(rawPlaces, seenNames, searchScope = "") {
    const list = [];
    for (const p of rawPlaces) {
        if (!isValidPlace(p)) continue;
        const nameKey = p.displayName?.text?.toLowerCase().trim();
        if (!nameKey || seenNames.has(nameKey)) continue;
        seenNames.add(nameKey);
        list.push(formatPlace(p, searchScope));
    }
    return list;
}

function normalizeForArea(value) {
    return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function isOutsideUserArea(result, { comune, provincia, regione }) {
    const address = normalizeForArea(result.indirizzo_modalita);
    const localTerms = [comune, provincia, regione].map(normalizeForArea).filter(Boolean);
    return !localTerms.some((term) => term && address.includes(term));
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

    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        return buildResponse(503, {
            error: "Ricerca Google Places non configurata.",
            code: "GOOGLE_PLACES_CONFIG_MISSING",
            detail: "Imposta GOOGLE_PLACES_API_KEY oppure GOOGLE_MAPS_API_KEY."
        }, corsHeaders);
    }

    try {
        let localPublicRaw = [];
        let localClinicRaw = [];
        let localPrivateRaw = [];
        let regionalPublicRaw = [];
        let regionalPrivateRaw = [];
        let nationalRaw = [];

        if (specialista) {
            const regionName = regione || "";
            const provinceName = provincia || comune || "";

            const localPublicQuery = `${specialista} ospedale pubblico ${provinceName}`.trim();
            const localClinicQuery = `${specialista} clinica privata convenzionata ${provinceName}`.trim();
            const localPrivateQuery = `${specialista} specialista privato studio ${provinceName}`.trim();
            const regionalPublicQuery = `${specialista} ospedale pubblico clinica convenzionata ${regionName}`.trim();
            const regionalPrivateQuery = `${specialista} specialista privato studio ${regionName}`.trim();
            const nationalQuery = `${specialista} centro di eccellenza ospedale clinica Italia Milano Roma Bologna`.trim();

            const [resLocalPublic, resLocalClinic, resLocalPrivate, resRegionalPublic, resRegionalPrivate, resNational] = await Promise.all([
                fetchPlaces(localPublicQuery, apiKey, fetchImpl),
                fetchPlaces(localClinicQuery, apiKey, fetchImpl),
                fetchPlaces(localPrivateQuery, apiKey, fetchImpl),
                fetchPlaces(regionalPublicQuery, apiKey, fetchImpl),
                fetchPlaces(regionalPrivateQuery, apiKey, fetchImpl),
                fetchPlaces(nationalQuery, apiKey, fetchImpl)
            ]);

            localPublicRaw = resLocalPublic;
            localClinicRaw = resLocalClinic;
            localPrivateRaw = resLocalPrivate;
            regionalPublicRaw = resRegionalPublic;
            regionalPrivateRaw = resRegionalPrivate;
            nationalRaw = resNational;
        } else {
            // Fallback
            localPrivateRaw = await fetchPlaces(fallbackQuery, apiKey, fetchImpl);
        }

        const seenNames = new Set();

        const localPublicList = formatPlaceList(localPublicRaw, seenNames, "Provincia");
        const localClinicList = formatPlaceList(localClinicRaw, seenNames, "Provincia");
        const localPrivateList = formatPlaceList(localPrivateRaw, seenNames, "Provincia");
        const regionalPublicList = formatPlaceList(regionalPublicRaw, seenNames, "Regione");
        const regionalPrivateList = formatPlaceList(regionalPrivateRaw, seenNames, "Regione");
        const nationalList = formatPlaceList(nationalRaw, seenNames, "Nazionale")
            .filter((item) => isOutsideUserArea(item, { comune, provincia, regione }));

        const localFallback = [
            ...localPublicList,
            ...localClinicList,
            ...localPrivateList
        ];
        const regionalFallback = [
            ...regionalPublicList,
            ...regionalPrivateList
        ];

        // Assemble 20 results: 10 province, 6 region, 4 national.
        // Province: include public hospitals, accredited/private clinics, and private specialists where available.
        const finalResults = [];
        const outputSeen = new Set();

        const localBucket = [];
        takeUnique(localBucket, localPublicList, 3, outputSeen);
        takeUnique(localBucket, localClinicList, 6, outputSeen);
        takeUnique(localBucket, localPrivateList, 10, outputSeen);
        takeUnique(localBucket, localFallback, 10, outputSeen);
        finalResults.push(...localBucket.slice(0, 10));

        const regionalBucket = [];
        takeUnique(regionalBucket, regionalPublicList, 3, outputSeen);
        takeUnique(regionalBucket, regionalPrivateList, 6, outputSeen);
        takeUnique(regionalBucket, regionalFallback, 6, outputSeen);
        finalResults.push(...regionalBucket.slice(0, 6));

        takeUnique(finalResults, nationalList, 20, outputSeen);

        if (specialista && finalResults.length < 20) {
            const extraQueries = [
                `${specialista} Italia IRCCS policlinico centro specialistico clinica`.trim()
            ];
            const extraRawGroups = await Promise.all(extraQueries.map((query) => fetchPlaces(query, apiKey, fetchImpl)));
            for (const rawGroup of extraRawGroups) {
                const extraList = formatPlaceList(rawGroup, seenNames, "Nazionale")
                    .filter((item) => isOutsideUserArea(item, { comune, provincia, regione }));
                takeUnique(finalResults, extraList, 20, outputSeen);
                if (finalResults.length >= 20) break;
            }
        }
        finalResults.splice(20);

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
