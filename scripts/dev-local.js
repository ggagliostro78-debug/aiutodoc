const fs = require("fs");
const http = require("http");
const path = require("path");
const { handleAdminLogin } = require("../server/admin_auth");
const { handleGeminiProxy } = require("../server/gemini_proxy");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";

const mimeTypes = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webmanifest": "application/manifest+json; charset=utf-8",
    ".txt": "text/plain; charset=utf-8"
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
    if (req.url === "/api/admin-login") {
        const result = await handleAdminLogin({ method: req.method, body });
        send(res, result.statusCode, result.headers, result.body);
        return true;
    }

    if (req.url === "/api/gemini") {
        const result = await handleGeminiProxy({ method: req.method, body });
        send(res, result.statusCode, result.headers, result.body);
        return true;
    }

    if (req.url === "/api/firebase-config") {
        send(res, 200, {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store"
        }, JSON.stringify({
            apiKey: "",
            authDomain: "",
            projectId: "",
            storageBucket: "",
            messagingSenderId: "",
            appId: "",
            measurementId: ""
        }));
        return true;
    }

    return false;
}

function safeFilePath(url) {
    const cleanPath = decodeURIComponent(new URL(url, `http://${host}:${port}`).pathname);
    const relative = cleanPath === "/" ? "index.html" : cleanPath.replace(/^\/+/, "");
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
    console.log(`AIutoDoc dev locale: http://${host}:${port}`);
});
