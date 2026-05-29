const crypto = require("crypto");
const { getFirestoreAdmin } = require("./firebase_admin");
const {
    enforceRateLimit,
    truncateText,
    validateBodySize
} = require("./request_guard");

const COLLECTION_NAME = "anonymous_triages";
const MAX_TRIAGE_BODY_BYTES = 80 * 1024;
const RECOVERY_CODE_BYTES = 16;

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

function buildGuardResponse(guardResult, corsHeaders) {
    if (!guardResult) return null;
    return buildResponse(guardResult.statusCode, guardResult.payload, {
        ...corsHeaders,
        ...(guardResult.headers || {})
    });
}

function normalizeRecoveryCode(code) {
    return String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function formatRecoveryCode(rawCode) {
    const clean = normalizeRecoveryCode(rawCode);
    return clean.match(/.{1,4}/g).join("-");
}

function generateRecoveryCode() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = crypto.randomBytes(RECOVERY_CODE_BYTES);
    let code = "AD";
    for (const byte of bytes) {
        code += alphabet[byte % alphabet.length];
    }
    return formatRecoveryCode(code);
}

function hashRecoveryCode(code) {
    return crypto
        .createHash("sha256")
        .update(normalizeRecoveryCode(code), "utf8")
        .digest("hex");
}

function retentionDays() {
    const value = Number(process.env.TRIAGE_RETENTION_DAYS || 30);
    return Number.isFinite(value) && value > 0 ? Math.min(value, 365) : 30;
}

function compactTriageData(input) {
    const result = input.result && typeof input.result === "object" ? input.result : {};
    const userData = input.userData && typeof input.userData === "object" ? input.userData : {};

    return {
        date: input.date || new Date().toISOString(),
        source: truncateText(input.source || "api", 40),
        userData: {
            age: userData.age ?? null,
            sex_at_birth: truncateText(userData.sex_at_birth || "", 40),
            zona: truncateText(userData.zona || "", 200),
            zonaDettagli: userData.zonaDettagli || null,
            disturbo: truncateText(userData.disturbo || "", 600),
            conoscitiveResp: Array.isArray(userData.conoscitiveResp) ? userData.conoscitiveResp.slice(0, 10) : [],
            anamnesticheResp: Array.isArray(userData.anamnesticheResp) ? userData.anamnesticheResp.slice(0, 10) : [],
            notaAnamnestica: truncateText(userData.notaAnamnestica || "", 1200)
        },
        result: {
            sintesi_anamnestica: truncateText(result.sintesi_anamnestica || "", 3000),
            specialista_indicato: truncateText(result.specialista_indicato || "", 160),
            preparazione_visita: truncateText(result.preparazione_visita || "", 2000),
            impegnativa_medico: truncateText(result.impegnativa_medico || "", 2000),
            risultati: Array.isArray(result.risultati) ? result.risultati.slice(0, 20) : []
        }
    };
}

async function handleTriageSave({ method, body, context = {} }) {
    const corsHeaders = buildCorsHeaders();
    if (method === "OPTIONS") return { statusCode: 204, headers: corsHeaders, body: "" };
    if (method !== "POST") return buildResponse(405, { error: "Metodo non consentito." }, corsHeaders);

    const rateLimit = enforceRateLimit(context.ip || "anonymous", {
        scope: "triage-save",
        limit: Number(process.env.TRIAGE_RATE_LIMIT_PER_MINUTE || 10)
    });
    const rateLimitResponse = buildGuardResponse(rateLimit, corsHeaders);
    if (rateLimitResponse) return rateLimitResponse;

    const bodySize = validateBodySize(body, MAX_TRIAGE_BODY_BYTES);
    const bodySizeResponse = buildGuardResponse(bodySize, corsHeaders);
    if (bodySizeResponse) return bodySizeResponse;

    const payload = parseBody(body);
    const triage = compactTriageData(payload.triage || payload);
    if (!triage.result.specialista_indicato || !triage.result.sintesi_anamnestica) {
        return buildResponse(400, { error: "Dati triage incompleti." }, corsHeaders);
    }

    const recoveryCode = generateRecoveryCode();
    const codeHash = hashRecoveryCode(recoveryCode);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + retentionDays() * 24 * 60 * 60 * 1000);

    try {
        const db = getFirestoreAdmin();
        await db.collection(COLLECTION_NAME).doc(codeHash).set({
            ...triage,
            id: recoveryCode,
            codeHash,
            createdAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            schemaVersion: 1
        });
    } catch (error) {
        console.error("Anonymous triage save failed:", error);
        return buildResponse(503, {
            error: "Archivio anonimo temporaneamente non disponibile.",
            code: error && error.code ? error.code : "TRIAGE_STORE_UNAVAILABLE"
        }, corsHeaders);
    }

    return buildResponse(200, {
        id: recoveryCode,
        recoveryCode,
        expiresAt: expiresAt.toISOString()
    }, corsHeaders);
}

async function handleTriageRecover({ method, body, context = {} }) {
    const corsHeaders = buildCorsHeaders();
    if (method === "OPTIONS") return { statusCode: 204, headers: corsHeaders, body: "" };
    if (method !== "POST") return buildResponse(405, { error: "Metodo non consentito." }, corsHeaders);

    const rateLimit = enforceRateLimit(context.ip || "anonymous", {
        scope: "triage-recover",
        limit: Number(process.env.TRIAGE_RATE_LIMIT_PER_MINUTE || 10)
    });
    const rateLimitResponse = buildGuardResponse(rateLimit, corsHeaders);
    if (rateLimitResponse) return rateLimitResponse;

    const bodySize = validateBodySize(body, 8 * 1024);
    const bodySizeResponse = buildGuardResponse(bodySize, corsHeaders);
    if (bodySizeResponse) return bodySizeResponse;

    const payload = parseBody(body);
    const recoveryCode = normalizeRecoveryCode(payload.id || payload.recoveryCode);
    if (recoveryCode.length < 12 || recoveryCode.length > 40) {
        return buildResponse(400, { error: "Codice recupero non valido." }, corsHeaders);
    }

    let snapshot;
    try {
        const db = getFirestoreAdmin();
        snapshot = await db.collection(COLLECTION_NAME).doc(hashRecoveryCode(recoveryCode)).get();
    } catch (error) {
        console.error("Anonymous triage recover failed:", error);
        return buildResponse(503, {
            error: "Archivio anonimo temporaneamente non disponibile.",
            code: error && error.code ? error.code : "TRIAGE_STORE_UNAVAILABLE"
        }, corsHeaders);
    }
    if (!snapshot.exists) {
        return buildResponse(404, { error: "ID non trovato." }, corsHeaders);
    }

    const data = snapshot.data();
    if (Date.parse(data.expiresAt || "") <= Date.now()) {
        return buildResponse(410, { error: "Codice scaduto." }, corsHeaders);
    }

    delete data.codeHash;
    return buildResponse(200, {
        triage: data
    }, corsHeaders);
}

module.exports = {
    handleTriageRecover,
    handleTriageSave,
    normalizeRecoveryCode
};
