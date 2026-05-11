const CONFIG = {
    // Endpoint backend che custodisce la chiave AI lato server.
    // Su Netlify il redirect in netlify.toml inoltra /api/gemini alla funzione.
    GEMINI_API_URL: "/api/gemini",
    FIREBASE_CONFIG_URL: "/api/firebase-config",

    // Firebase e' opzionale. Lasciarlo vuoto evita che Netlify blocchi il deploy
    // con il secrets scanner. Il recupero locale degli ID continua a funzionare.
    FIREBASE_CONFIG: {
        apiKey: "",
        authDomain: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: "",
        appId: "",
        measurementId: ""
    }
};
