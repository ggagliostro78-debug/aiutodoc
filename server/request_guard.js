const DEFAULT_MAX_BODY_BYTES = 64 * 1024;
const DEFAULT_MAX_FIELD_LENGTH = 4000;
const DEFAULT_RATE_LIMIT = 30;
const DEFAULT_RATE_WINDOW_MS = 60 * 1000;

const buckets = new Map();

function getClientKey(event = {}) {
    const headers = event.headers || {};
    const forwardedFor = headers["x-forwarded-for"] || headers["X-Forwarded-For"] || "";
    const firstForwarded = String(forwardedFor).split(",")[0].trim();
    return firstForwarded || headers["client-ip"] || headers["Client-Ip"] || event.ip || "anonymous";
}

function createRequestContext(event = {}) {
    return {
        headers: event.headers || {},
        ip: getClientKey(event)
    };
}

function estimateBodyBytes(body) {
    if (!body) return 0;
    if (typeof body === "string") return Buffer.byteLength(body, "utf8");
    return Buffer.byteLength(JSON.stringify(body), "utf8");
}

function validateBodySize(body, maxBytes = DEFAULT_MAX_BODY_BYTES) {
    if (estimateBodyBytes(body) <= maxBytes) return null;
    return {
        statusCode: 413,
        payload: { error: "Payload troppo grande." }
    };
}

function truncateText(value, maxLength = DEFAULT_MAX_FIELD_LENGTH) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function enforceRateLimit(key, options = {}) {
    const limit = Number(options.limit || DEFAULT_RATE_LIMIT);
    const windowMs = Number(options.windowMs || DEFAULT_RATE_WINDOW_MS);
    const now = Date.now();
    const bucketKey = `${options.scope || "default"}:${key || "anonymous"}`;
    const current = buckets.get(bucketKey);

    if (!current || now > current.resetAt) {
        buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
        return null;
    }

    current.count += 1;
    if (current.count <= limit) return null;

    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return {
        statusCode: 429,
        payload: { error: "Troppe richieste. Riprova tra poco." },
        headers: { "Retry-After": String(retryAfter) }
    };
}

module.exports = {
    createRequestContext,
    enforceRateLimit,
    truncateText,
    validateBodySize
};
