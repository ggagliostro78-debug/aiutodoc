exports.handler = async function handler(event) {
    if (event.httpMethod !== "GET") {
        return {
            statusCode: 405,
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({ error: "Metodo non consentito." })
        };
    }

    const config = {
        apiKey: process.env.FIREBASE_API_KEY || "",
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
        projectId: process.env.FIREBASE_PROJECT_ID || "",
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
        appId: process.env.FIREBASE_APP_ID || "",
        measurementId: process.env.FIREBASE_MEASUREMENT_ID || ""
    };

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "public, max-age=300"
        },
        body: JSON.stringify(config)
    };
};
