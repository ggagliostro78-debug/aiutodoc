const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

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

async function callGemini(prompt, fetchImpl) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Variabile d'ambiente GEMINI_API_KEY non configurata.");
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
                ]
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini upstream error (${response.status}): ${errorText}`);
        }

        const payload = await response.json();
        const rawText = extractText(payload);
        const cleanText = stripMarkdownFence(rawText);

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

async function handleGeminiProxy({ method, body, fetchImpl = fetch }) {
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
    const prompt = typeof payload.prompt === "string" ? payload.prompt.trim() : "";

    if (!prompt) {
        return buildResponse(400, { error: "Prompt mancante." }, corsHeaders);
    }

    try {
        const geminiResponse = await callGemini(prompt, fetchImpl);
        return buildResponse(200, geminiResponse, corsHeaders);
    } catch (error) {
        return buildResponse(502, {
            error: "Errore del proxy Gemini.",
            detail: error instanceof Error ? error.message : String(error)
        }, corsHeaders);
    }
}

module.exports = {
    handleGeminiProxy
};
