const crypto = require("crypto");

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

function buildResponse(statusCode, payload) {
    return {
        statusCode,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store"
        },
        body: JSON.stringify(payload)
    };
}

function constantTimeEquals(a, b) {
    const left = Buffer.from(String(a || ""));
    const right = Buffer.from(String(b || ""));
    if (left.length !== right.length) return false;
    return crypto.timingSafeEqual(left, right);
}

async function handleAdminLogin({ method, body }) {
    if (method !== "POST") {
        return buildResponse(405, { ok: false, error: "Metodo non consentito." });
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
        return buildResponse(503, {
            ok: false,
            error: "Autenticazione admin non configurata."
        });
    }

    const payload = parseBody(body);
    const password = typeof payload.password === "string" ? payload.password : "";
    const ok = constantTimeEquals(password, adminPassword);

    if (!ok) {
        return buildResponse(401, { ok: false, error: "Credenziali non valide." });
    }

    return buildResponse(200, {
        ok: true,
        role: "admin",
        issuedAt: new Date().toISOString()
    });
}

module.exports = {
    handleAdminLogin
};
