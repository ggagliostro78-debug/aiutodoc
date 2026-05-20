const fs = require("fs");
const http = require("http");
const path = require("path");
const { handleGeminiProxy } = require("../server/gemini_proxy");
const { handleSpecialistSearch } = require("../server/specialist_search");

const root = path.resolve(__dirname, "..");
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4173);

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
        if (!process.env[key]) {
            process.env[key] = value;
        }
    }
}

loadDotEnv();

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
    res.writeHead(statusCode, headers);
    res.end(body);
}

async function handleApi(req, res) {
    const body = await readBody(req);

    if (req.url === "/api/gemini") {
        const result = await handleGeminiProxy({
            method: req.method,
            body
        });
        send(res, result.statusCode, result.headers, result.body);
        return true;
    }

    if (req.url === "/api/specialist-search") {
        const result = await handleSpecialistSearch({
            method: req.method,
            body
        });
        send(res, result.statusCode, result.headers, result.body);
        return true;
    }

    if (req.url === "/api/enrich") {
        const { handleEnrichEntity } = require("../server/enrich");
        const result = await handleEnrichEntity({
            method: req.method,
            body,
            fetchImpl: fetch
        });
        send(res, result.statusCode, result.headers, result.body);
        return true;
    }

    if (req.url === "/api/places") {
        const { handlePlacesSearch } = require("../server/places");
        const result = await handlePlacesSearch({
            method: req.method,
            body,
            fetchImpl: fetch
        });
        send(res, result.statusCode, result.headers, result.body);
        return true;
    }

    if (req.url === "/api/firebase-config") {
        send(res, 200, {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store"
        }, JSON.stringify({
            apiKey: process.env.FIREBASE_API_KEY || "",
            authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
            projectId: process.env.FIREBASE_PROJECT_ID || "",
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
            appId: process.env.FIREBASE_APP_ID || "",
            measurementId: process.env.FIREBASE_MEASUREMENT_ID || ""
        }));
        return true;
    }

    return false;
}

function safeFilePath(url) {
    const pathname = decodeURIComponent(new URL(url, `http://${host}:${port}`).pathname);
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const filePath = path.resolve(root, relative);
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
            error: error instanceof Error ? error.message : String(error)
        }));
    }
});

server.listen(port, host, () => {
    const hasSearch = process.env.GOOGLE_CSE_API_KEY && process.env.GOOGLE_CSE_ID;
    const mode = `${process.env.GEMINI_API_KEY ? "con proxy Gemini" : "senza GEMINI_API_KEY"}; ${hasSearch ? "con ricerca Google" : "senza ricerca Google configurata"}`;
    console.log(`AIutoDoc locale: http://${host}:${port} (${mode})`);
});
