const crypto = require("crypto");
const { getFirestoreAdmin } = require("./firebase_admin");
const {
    enforceRateLimit,
    truncateText,
    validateBodySize
} = require("./request_guard");

const COLLECTION_NAME = "consent_logs";
const MAX_BODY_BYTES = 16 * 1024;

function parseBody(body) {
    if (!body) return {};
    if (typeof body === "string") {
        try {
            return JSON.parse(body);
        } catch (error) {
            return {};
        }
    }
    return typeof body === "object" ? body : {};
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

function anonymizeIp(ip) {
    const value = String(ip || "").trim();
    if (!value || value === "anonymous") return "anonymous";

    if (value.includes(":")) {
        return value.split(":").slice(0, 4).join(":") + "::";
    }

    const parts = value.split(".");
    if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }

    return "unknown";
}

function hashIp(ip) {
    return crypto
        .createHash("sha256")
        .update(String(ip || "anonymous"), "utf8")
        .digest("hex");
}

function normalizeConsents(consents) {
    const source = consents && typeof consents === "object" ? consents : {};
    return Object.fromEntries(
        Object.entries(source)
            .slice(0, 30)
            .map(([key, value]) => [truncateText(key, 80), value === true])
    );
}

async function handleConsentLogs({ method, body, context = {} }) {
    const corsHeaders = buildCorsHeaders();
    if (method === "OPTIONS") return { statusCode: 204, headers: corsHeaders, body: "" };
    if (method !== "POST") return buildResponse(405, { error: "Metodo non consentito." }, corsHeaders);

    const rateLimit = enforceRateLimit(context.ip || "anonymous", {
        scope: "consent-logs",
        limit: Number(process.env.CONSENT_LOG_RATE_LIMIT_PER_MINUTE || 20)
    });
    if (rateLimit) {
        return buildResponse(rateLimit.statusCode, rateLimit.payload, {
            ...corsHeaders,
            ...(rateLimit.headers || {})
        });
    }

    const bodySize = validateBodySize(body, MAX_BODY_BYTES);
    if (bodySize) {
        return buildResponse(bodySize.statusCode, bodySize.payload, corsHeaders);
    }

    const payload = parseBody(body);
    const scope = truncateText(payload.scope || "generic_consent", 80);
    const consents = normalizeConsents(payload.consents);

    if (!Object.keys(consents).length) {
        return buildResponse(400, { error: "Nessun consenso da registrare." }, corsHeaders);
    }

    const now = new Date();
    const logEntry = {
        scope,
        consents,
        consentVersion: truncateText(payload.consentVersion || "", 80),
        documentVersions: payload.documentVersions && typeof payload.documentVersions === "object"
            ? Object.fromEntries(Object.entries(payload.documentVersions).map(([key, value]) => [truncateText(key, 80), truncateText(value, 120)]))
            : {},
        textSnapshot: truncateText(payload.textSnapshot || "", 2000),
        source: truncateText(payload.source || "web", 80),
        userAgent: truncateText(context.headers?.["user-agent"] || context.headers?.["User-Agent"] || "", 300),
        ipAnonymized: anonymizeIp(context.ip),
        ipHash: hashIp(context.ip),
        createdAt: now.toISOString(),
        schemaVersion: 1
    };

    try {
        const db = getFirestoreAdmin();
        const doc = await db.collection(COLLECTION_NAME).add(logEntry);
        return buildResponse(200, { ok: true, id: doc.id }, corsHeaders);
    } catch (error) {
        console.error("Consent log write failed:", error);
        return buildResponse(503, {
            error: "Registro consensi temporaneamente non disponibile.",
            code: error && error.code ? error.code : "CONSENT_LOG_UNAVAILABLE"
        }, corsHeaders);
    }
}

module.exports = {
    handleConsentLogs
};
