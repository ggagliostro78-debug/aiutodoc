const CONFIG = {
    // Endpoint backend che custodisce la chiave AI lato server.
    // In locale o su hosting compatibili con Vercel usa /api/gemini.
    // Su Netlify il redirect in netlify.toml inoltra automaticamente lo stesso path.
    GEMINI_API_URL: "/api/gemini",

    // --- FIREBASE CONFIG (Per persistenza universale ID da qualsiasi dispositivo) ---
    // La configurazione Firebase client non è un segreto: la sicurezza dipende dalle regole del progetto.
    FIREBASE_CONFIG: {
        apiKey: "AIzaSyDqMzTPGriVLB4170ogLzIj5mpjyHxydmw",
        authDomain: "aiutodoc.firebaseapp.com",
        projectId: "aiutodoc",
        storageBucket: "aiutodoc.firebasestorage.app",
        messagingSenderId: "443868635785",
        appId: "1:443868635785:web:f4be9f99f4fe3213399c58",
        measurementId: "G-ZD00VGB0V9"
    }
};
