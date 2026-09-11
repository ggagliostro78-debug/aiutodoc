const fs = require("fs");
const http = require("http");
const path = require("path");
const { handleGeminiProxy } = require("../server/gemini_proxy");
const { handleSpecialistSearch } = require("../server/specialist_search");
const { createRequestContext } = require("../server/request_guard");

const root = path.resolve(__dirname, "..");
const host = "127.0.0.1";
const LOCAL_ENV_KEYS = new Set([
    "AIUTODOC_PORT", "AIUTODOC_EXTERNAL_SERVICES", "AIUTODOC_SIGNING_SECRET", "AIUTODOC_ALLOWED_ORIGIN",
    "FIREBASE_PROJECT_ID", "FIREBASE_SERVICE_ACCOUNT_JSON", "GEMINI_API_KEY", "GOOGLE_PLACES_API_KEY",
    "GOOGLE_CSE_API_KEY", "GOOGLE_CSE_ID", "SERPAPI_API_KEY", "TRIAGE_RETENTION_DAYS", "PROVIDER_CALLS_PER_DAY"
]);
process.env.AIUTODOC_LOCAL_MODE = "true";
if (process.env.NETLIFY || process.env.NODE_ENV === "production") throw new Error("Ambiente locale solo per sviluppo.");

function loadDotEnv() {
    const envPath = path.join(root, ".env");
    if (!fs.existsSync(envPath)) return;

    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const separator = trimmed.indexOf("=");
        if (separator < 1) continue;
        const key = trimmed.slice(0, separator).trim();
        let value = trimmed.slice(separator + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if ((LOCAL_ENV_KEYS.has(key) || key.startsWith("BETA_")) && !process.env[key]) {
            process.env[key] = value;
        }
    }
}

loadDotEnv();
const port = Number(process.env.AIUTODOC_PORT || process.env.BETA_PORT || 4284);

const mimeTypes = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".txt": "text/plain; charset=utf-8",
    ".webmanifest": "application/manifest+json; charset=utf-8"
};

function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk;
            if (body.length > 1024 * 1024) {
                req.destroy();
                reject(new Error("Payload troppo grande."));
            }
        });
        req.on("end", () => resolve(body));
        req.on("error", reject);
    });
}

function send(res, statusCode, headers, body) {
    res.writeHead(statusCode, { "X-Content-Type-Options":"nosniff", "Referrer-Policy":"no-referrer", "X-Robots-Tag":"noindex, nofollow", ...headers });
    res.end(body);
}

async function handleApi(req, res) {
    const body = await readBody(req);

    if (req.url === "/api/gemini") {
        const result = await handleGeminiProxy({
            method: req.method,
            body,
            context: createRequestContext(req)
        });
        send(res, result.statusCode, result.headers, result.body);
        return true;
    }

    if (req.url === "/api/specialist-search") {
        const result = await handleSpecialistSearch({
            method: req.method,
            body,
            context: createRequestContext(req)
        });
        send(res, result.statusCode, result.headers, result.body);
        return true;
    }

    if (req.url === "/api/enrich") {
        const { handleEnrichEntity } = require("../server/enrich");
        const result = await handleEnrichEntity({
            method: req.method,
            body,
            fetchImpl: fetch,
            context: createRequestContext(req)
        });
        send(res, result.statusCode, result.headers, result.body);
        return true;
    }

    if (req.url === "/api/places") {
        const { handlePlacesSearch } = require("../server/places");
        const result = await handlePlacesSearch({
            method: req.method,
            body,
            fetchImpl: fetch,
            context: createRequestContext(req)
        });
        send(res, result.statusCode, result.headers, result.body);
        return true;
    }

    if (req.url === "/api/triage-save") {
        const { handleTriageSave } = require("../server/triage_store");
        const result = await handleTriageSave({
            method: req.method,
            body,
            context: createRequestContext(req)
        });
        send(res, result.statusCode, result.headers, result.body);
        return true;
    }

    if (req.url === "/api/triage-delete") {
        const { handleTriageDelete } = require("../server/triage_store");
        const result = await handleTriageDelete({method:req.method,body,context:createRequestContext(req)});
        send(res,result.statusCode,result.headers,result.body);return true;
    }

    if (req.url === "/api/triage-recover") {
        const { handleTriageRecover } = require("../server/triage_store");
        const result = await handleTriageRecover({
            method: req.method,
            body,
            context: createRequestContext(req)
        });
        send(res, result.statusCode, result.headers, result.body);
        return true;
    }

    if (req.url === "/api/consent-logs") {
        const { handleConsentLogs } = require("../server/consent_logs");
        const result = await handleConsentLogs({
            method: req.method,
            body,
            context: createRequestContext(req)
        });
        send(res, result.statusCode, result.headers, result.body);
        return true;
    }

    if (req.url === "/api/firebase-config") {
        send(res, 200, {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store"
        }, '{}');
        return true;
    }

    return false;
}

function safeFilePath(url) {
    const pathname = decodeURIComponent(new URL(url, `http://${host}:${port}`).pathname);
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    let filePath = path.resolve(root, relative);
    if (!filePath.startsWith(root + path.sep)) return null;
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, "index.html");
    }
    if (!/^(?:index\.html|service-worker\.js|manifest\.webmanifest|robots\.txt|sitemap\.xml|logo\.jpg|src[\/\\]|assets[\/\\]|(?:chi-siamo|privacy-policy|cookie-policy|disclaimer-medico|termini-condizioni|glossario|per-gli-specialisti|recupera-ricerca|specializzazioni)[\/\\])/.test(path.relative(root,filePath))) return null;
    return filePath.startsWith(root) ? filePath : null;
}

const server = http.createServer(async (req, res) => {
    try {
        if (req.url.startsWith("/api/")) {
            const handled = await handleApi(req, res);
            if (handled) return;
        }

        const filePath = safeFilePath(req.url);
        if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
            send(res, 404, { "Content-Type": "text/plain; charset=utf-8" }, "Not found");
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        send(res, 200, {
            "Content-Type": mimeTypes[ext] || "application/octet-stream",
            "Cache-Control": "no-store"
        }, fs.readFileSync(filePath));
    } catch (error) {
        send(res, 500, { "Content-Type": "application/json; charset=utf-8" }, JSON.stringify({
            error: "Richiesta non disponibile."
        }));
    }
});

server.listen(port, host, () => {
    const hasSearch = process.env.GOOGLE_PLACES_API_KEY || process.env.BETA_GOOGLE_PLACES_API_KEY || process.env.SERPAPI_API_KEY || process.env.BETA_SERPAPI_API_KEY || ((process.env.GOOGLE_CSE_API_KEY || process.env.BETA_GOOGLE_CSE_API_KEY) && (process.env.GOOGLE_CSE_ID || process.env.BETA_GOOGLE_CSE_ID));
    const mode = `${process.env.GEMINI_API_KEY || process.env.BETA_GEMINI_API_KEY ? "con proxy Gemini" : "senza GEMINI_API_KEY"}; ${hasSearch ? "con ricerca Google" : "senza ricerca Google configurata"}`;
    console.log(`AIutoDoc locale: http://${host}:${port} (${mode})`);
});
