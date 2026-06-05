const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const {
    enforceRateLimit,
    truncateText,
    validateBodySize
} = require("./request_guard");

const MAX_PROMPT_LENGTH = 12000;

const TRIAGE_RESPONSE_SCHEMA = {
    type: "OBJECT",
    required: ["sintesi_anamnestica", "specialista_indicato", "preparazione_visita", "impegnativa_medico"],
    properties: {
        sintesi_anamnestica: { type: "STRING" },
        specialista_indicato: { type: "STRING" },
        preparazione_visita: { type: "STRING" },
        impegnativa_medico: { type: "STRING" }
    }
};

function parseBody(body) {
    if (!body) return {};
    if (typeof body === "string") {
        try {
            return JSON.parse(body);
        } catch (error) {
            return {};
        }
    }
    if (typeof body === "object") {
        return body;
    }
    return {};
}

function stripMarkdownFence(text) {
    const value = String(text || "").trim();
    if (value.startsWith("```json")) {
        return value.slice(7).replace(/```$/, "").trim();
    }
    if (value.startsWith("```")) {
        return value.slice(3).replace(/```$/, "").trim();
    }
    return value;
}

function extractJsonObjectText(text) {
    const cleanText = stripMarkdownFence(text);
    if (!cleanText) return "";

    try {
        JSON.parse(cleanText);
        return cleanText;
    } catch (error) {
        const start = cleanText.indexOf("{");
        const end = cleanText.lastIndexOf("}");
        if (start >= 0 && end > start) {
            return cleanText.slice(start, end + 1);
        }
        return cleanText;
    }
}

function extractText(payload) {
    const parts = payload?.candidates?.[0]?.content?.parts;
    if (!Array.isArray(parts)) return "";
    return parts
        .map((part) => (typeof part?.text === "string" ? part.text : ""))
        .join("\n")
        .trim();
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
    const allowedOrigin = process.env.GEMINI_ALLOWED_ORIGIN;
    if (!allowedOrigin) return {};

    return {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    };
}

function buildGuardResponse(guardResult, corsHeaders) {
    if (!guardResult) return null;
    return buildResponse(guardResult.statusCode, guardResult.payload, {
        ...corsHeaders,
        ...(guardResult.headers || {})
    });
}

async function callGemini(prompt, fetchImpl) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        const error = new Error("Variabile d'ambiente GEMINI_API_KEY non configurata.");
        error.code = "GEMINI_API_KEY_MISSING";
        throw error;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
        const response = await fetchImpl(`${GOOGLE_API_URL}?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: prompt }]
                    }
                ],
                generationConfig: {
                    temperature: 0.2,
                    responseMimeType: "application/json",
                    responseSchema: TRIAGE_RESPONSE_SCHEMA
                }
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini upstream error (${response.status}): ${errorText}`);
        }

        const payload = await response.json();
        const rawText = extractText(payload);
        const cleanText = extractJsonObjectText(rawText);

        if (!cleanText) {
            throw new Error("Gemini ha restituito una risposta vuota.");
        }

        return {
            rawText: cleanText,
            result: JSON.parse(cleanText)
        };
    } finally {
        clearTimeout(timeoutId);
    }
}

async function callGeminiWithRetry(prompt, fetchImpl, retries = 3, delayMs = 3000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await callGemini(prompt, fetchImpl);
        } catch (err) {
            const errStr = String(err.message || err);
            const isRateLimit = errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED");
            const isServiceUnavailable = errStr.includes("503");
            
            if ((isRateLimit || isServiceUnavailable) && attempt < retries) {
                console.warn(`Gemini API returned rate limit/unavailable. Retrying attempt ${attempt}/${retries} in ${delayMs}ms...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
                delayMs *= 1.5;
                continue;
            }
            throw err;
        }
    }
}

function generateMockTriageResponse(prompt) {
    const promptLower = prompt.toLowerCase();
    
    let specialista = "Medico di Medicina Generale";
    let sintesi = "Sintomi aspecifici riferiti. Si consiglia una prima valutazione con il medico di medicina generale per inquadrare il quadro clinico.";
    let esami = "Esami del sangue di routine.";
    let impegnativa = "Sì, per visita medica generale.";
    let preparazione = "Nessuna preparazione specifica richiesta.";

    if (promptLower.includes("ortoped") || promptLower.includes("spalla") || promptLower.includes("ginocchio") || promptLower.includes("anca") || promptLower.includes("osso") || promptLower.includes("articolazione") || promptLower.includes("caduta") || promptLower.includes("trauma")) {
        specialista = "Ortopedico";
        sintesi = "Sintomatologia dolorosa a carico dell'apparato muscolo-scheletrico. Si consiglia una valutazione specialistica ortopedica per escludere lesioni strutturali o infiammatorie.";
        esami = "Radiografia (RX) del distretto interessato, Ecografia muscolo-tendinea o Risonanza Magnetica (RM).";
        impegnativa = "Sì, per visita specialistica ortopedica.";
        preparazione = "Portare in visione eventuali esami radiografici o risonanze eseguiti in precedenza.";
    } else if (promptLower.includes("cardi") || promptLower.includes("cuore") || promptLower.includes("pressione") || promptLower.includes("aritmia") || promptLower.includes("palpitazion") || promptLower.includes("torac")) {
        specialista = "Cardiologo";
        sintesi = "Sintomi riferiti potenzialmente riconducibili all'apparato cardio-vascolare. Consigliato consulto cardiologico per un controllo elettrocardiografico e pressorio.";
        esami = "Elettrocardiogramma (ECG), Ecocardiogramma color-doppler.";
        impegnativa = "Sì, per visita cardiologica con elettrocardiogramma.";
        preparazione = "Evitare sforzi intensi o assunzione eccessiva di caffeina nelle ore precedenti la visita.";
    } else if (promptLower.includes("dermatol") || promptLower.includes("pelle") || promptLower.includes("nei") || promptLower.includes("macchie") || promptLower.includes("eruzione") || promptLower.includes("prurito")) {
        specialista = "Dermatologo";
        sintesi = "Manifestazione cutanea o alterazione dermatologica meritevole di approfondimento clinico per via dermatoscopica.";
        esami = "Mappatura dei nei (se applicabile), esame obiettivo dermatologico.";
        impegnativa = "Sì, per visita dermatologica.";
        preparazione = "Non applicare creme, cosmetici o farmaci topici sulla zona interessata prima della visita.";
    } else if (promptLower.includes("neurol") || promptLower.includes("testa") || promptLower.includes("emicrania") || promptLower.includes("cefalea") || promptLower.includes("vertigin") || promptLower.includes("formicol")) {
        specialista = "Neurologo";
        sintesi = "Sintomi neurologici o cefalalgici che richiedono un inquadramento diagnostico per escludere cause organiche o neuropatiche.";
        esami = "Risonanza Magnetica (RM) del cervello o elettromiografia (a seconda del distretto).";
        impegnativa = "Sì, per visita neurologica.";
        preparazione = "Annotare la frequenza e la durata degli episodi dolorosi o dei sintomi riferiti.";
    } else if (promptLower.includes("psicol") || promptLower.includes("ansia") || promptLower.includes("depression") || promptLower.includes("panico") || promptLower.includes("stress")) {
        specialista = "Psicologo";
        sintesi = "Stato di sofferenza emotiva o psicologica riferito. Si consiglia un colloquio clinico di supporto per valutare un percorso terapeutico.";
        esami = "Colloquio clinico conoscitivo.";
        impegnativa = "No, accesso diretto (consigliata comunque impegnativa per strutture pubbliche).";
        preparazione = "Nessuna preparazione richiesta. Si consiglia massima apertura al colloquio.";
    } else if (promptLower.includes("ocul") || promptLower.includes("vist") || promptLower.includes("occhi") || promptLower.includes("bruciore")) {
        specialista = "Oculista";
        sintesi = "Disturbo della funzione visiva o infiammazione oculare che necessita di esame della vista ed esame con lampada a fessura.";
        esami = "Misurazione del visus, misurazione della pressione oculare, esame del fondo oculare.";
        impegnativa = "Sì, per visita oculistica completa.";
        preparazione = "Rimuovere le lenti a contatto almeno 24 ore prima dell'esame se si deve effettuare la misurazione della vista.";
    } else if (promptLower.includes("ginec") || promptLower.includes("gravidanz") || promptLower.includes("ciclo")) {
        specialista = "Ginecologo";
        sintesi = "Consulto programmato o sintomatologia a carico dell'apparato genitale femminile.";
        esami = "Ecografia pelvica o transvaginale, Pap-test.";
        impegnativa = "Sì, per visita ginecologica ed eventuale ecografia.";
        preparazione = "Evitare lavande vaginali o rapporti nelle 24 ore precedenti se si effettua il Pap-test.";
    } else if (promptLower.includes("pediatr") || promptLower.includes("bambin") || promptLower.includes("neonat")) {
        specialista = "Pediatra";
        sintesi = "Sintomatologia riferita in paziente in età pediatrica. Consigliato controllo specialistico accrescitivo o sintomatico.";
        esami = "Esame obiettivo pediatrico.";
        impegnativa = "Sì, per visita pediatrica.";
        preparazione = "Portare il libretto pediatrico delle vaccinazioni e dello sviluppo.";
    }

    const resObj = {
        specialista_indicato: specialista,
        sintesi_anamnestica: sintesi,
        preparazione_visita: `${preparazione} Esami orientativi da discutere con il medico: ${esami}`,
        impegnativa_medico: impegnativa
    };

    return {
        rawText: JSON.stringify(resObj),
        result: resObj,
        isMock: true
    };
}

async function handleGeminiProxy({ method, body, fetchImpl = fetch, context = {} }) {
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

    const rateLimit = enforceRateLimit(context.ip || "anonymous", {
        scope: "gemini",
        limit: Number(process.env.GEMINI_RATE_LIMIT_PER_MINUTE || 20)
    });
    const rateLimitResponse = buildGuardResponse(rateLimit, corsHeaders);
    if (rateLimitResponse) return rateLimitResponse;

    const bodySize = validateBodySize(body);
    const bodySizeResponse = buildGuardResponse(bodySize, corsHeaders);
    if (bodySizeResponse) return bodySizeResponse;

    const payload = parseBody(body);
    const prompt = typeof payload.prompt === "string" ? truncateText(payload.prompt, MAX_PROMPT_LENGTH) : "";

    if (!prompt) {
        return buildResponse(400, { error: "Prompt mancante." }, corsHeaders);
    }

    try {
        const geminiResponse = await callGeminiWithRetry(prompt, fetchImpl);
        return buildResponse(200, geminiResponse, corsHeaders);
    } catch (error) {
        console.warn("Gemini API call failed:", error.message || error);
        if (process.env.ALLOW_LOCAL_TRIAGE_FALLBACK !== "true") {
            return buildResponse(503, {
                error: "Servizio AI temporaneamente non disponibile.",
                code: error && error.code ? error.code : "GEMINI_UNAVAILABLE"
            }, corsHeaders);
        }

        console.warn("Falling back to local clinical rule engine because ALLOW_LOCAL_TRIAGE_FALLBACK=true...");
        const mockResponse = generateMockTriageResponse(prompt);
        return buildResponse(200, mockResponse, corsHeaders);
    }
}

module.exports = {
    handleGeminiProxy
};
