const crypto = require("crypto");

let tokenCache = null;

function base64Url(value) {
    return Buffer.from(value)
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
}

function parseServiceAccount() {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw) {
        const error = new Error("Firebase Admin non configurato. Imposta FIREBASE_SERVICE_ACCOUNT_JSON.");
        error.code = "FIREBASE_ADMIN_CONFIG_MISSING";
        throw error;
    }

    const account = JSON.parse(raw);
    if (!account.client_email || !account.private_key || !account.project_id) {
        const error = new Error("FIREBASE_SERVICE_ACCOUNT_JSON incompleto.");
        error.code = "FIREBASE_ADMIN_CONFIG_INVALID";
        throw error;
    }
    account.private_key = account.private_key.replace(/\\n/g, "\n");
    return account;
}

async function getAccessToken(account, fetchImpl = fetch) {
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (tokenCache && tokenCache.expiresAt > nowSeconds + 60) {
        return tokenCache.token;
    }

    const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const payload = base64Url(JSON.stringify({
        iss: account.client_email,
        scope: "https://www.googleapis.com/auth/datastore",
        aud: "https://oauth2.googleapis.com/token",
        iat: nowSeconds,
        exp: nowSeconds + 3600
    }));
    const unsigned = `${header}.${payload}`;
    const signature = crypto
        .createSign("RSA-SHA256")
        .update(unsigned)
        .sign(account.private_key, "base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

    const response = await fetchImpl("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: `${unsigned}.${signature}`
        }).toString()
    });

    if (!response.ok) {
        const detail = await response.text();
        const error = new Error(`OAuth service account error (${response.status}): ${detail}`);
        error.code = "FIREBASE_ADMIN_AUTH_FAILED";
        throw error;
    }

    const data = await response.json();
    tokenCache = {
        token: data.access_token,
        expiresAt: nowSeconds + Number(data.expires_in || 3600)
    };
    return tokenCache.token;
}

function documentUrl(account, collectionName, documentId) {
    const projectId = encodeURIComponent(account.project_id);
    const collection = encodeURIComponent(collectionName);
    const doc = encodeURIComponent(documentId);
    return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${doc}`;
}

function getFirestoreAdmin(fetchImpl = fetch) {
    const account = parseServiceAccount();

    return {
        collection(collectionName) {
            return {
                doc(documentId) {
                    return {
                        async set(data) {
                            const token = await getAccessToken(account, fetchImpl);
                            const response = await fetchImpl(documentUrl(account, collectionName, documentId), {
                                method: "PATCH",
                                headers: {
                                    "Authorization": `Bearer ${token}`,
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    fields: {
                                        payloadJson: { stringValue: JSON.stringify(data) },
                                        expiresAt: { timestampValue: data.expiresAt || new Date(Date.now() + 86400000).toISOString() }
                                    }
                                })
                            });
                            if (!response.ok) {
                                const detail = await response.text();
                                const error = new Error(`Firestore write error (${response.status}): ${detail}`);
                                error.code = "FIRESTORE_WRITE_FAILED";
                                throw error;
                            }
                        },
                        async get() {
                            const token = await getAccessToken(account, fetchImpl);
                            const response = await fetchImpl(documentUrl(account, collectionName, documentId), {
                                headers: { "Authorization": `Bearer ${token}` }
                            });
                            if (response.status === 404) return { exists: false, data: () => null };
                            if (!response.ok) {
                                const detail = await response.text();
                                const error = new Error(`Firestore read error (${response.status}): ${detail}`);
                                error.code = "FIRESTORE_READ_FAILED";
                                throw error;
                            }
                            const document = await response.json();
                            const payloadJson = document?.fields?.payloadJson?.stringValue;
                            return {
                                exists: Boolean(payloadJson),
                                data: () => JSON.parse(payloadJson || "null")
                            };
                        }
                    };
                }
            };
        }
    };
}

module.exports = {
    getFirestoreAdmin
};
