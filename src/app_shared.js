// Shared helpers, globals, analytics and Firebase bootstrap.
console.log("App shared loading...");

window.addEventListener('error', (event) => {
    console.error("GLOBAL APP ERROR:", event.message, "at", event.filename, ":", event.lineno);
    if (event.filename && event.filename.includes('app_v3_standalone.js')) {
        alert("Errore caricamento AIutoDoc: " + event.message + ". Prova a fare un Hard Refresh (Ctrl+F5).");
    }
});

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function sanitizeHTML(html) {
    const template = document.createElement('template');
    template.innerHTML = String(html ?? "");

    template.content.querySelectorAll('script, iframe, object, embed, style, img, svg, math, video, audio').forEach((el) => el.remove());

    template.content.querySelectorAll('*').forEach((el) => {
        [...el.attributes].forEach((attr) => {
            const name = attr.name.toLowerCase();
            const value = attr.value.trim().toLowerCase();

            if (name.startsWith('on')) {
                el.removeAttribute(attr.name);
                return;
            }

            if ((name === 'href' || name === 'src') && value.startsWith('javascript:')) {
                el.removeAttribute(attr.name);
            }
        });
    });

    return template.innerHTML;
}

let GoogleGenerativeAI = true; // Placeholder per indicare che il motore è pronto (non usiamo più l'SDK esterno)

let db = null;
async function resolveFirebaseConfig() {
    if (typeof CONFIG === 'undefined') return null;
    if (CONFIG.FIREBASE_CONFIG && CONFIG.FIREBASE_CONFIG.apiKey) {
        return CONFIG.FIREBASE_CONFIG;
    }

    if (!CONFIG.FIREBASE_CONFIG_URL || typeof fetch !== 'function') return null;

    try {
        const response = await fetch(CONFIG.FIREBASE_CONFIG_URL, { cache: 'no-store' });
        if (!response.ok) return null;
        const config = await response.json();
        return config && config.apiKey ? config : null;
    } catch (error) {
        console.warn("Firebase config non disponibile:", error);
        return null;
    }
}

async function initFirebase() {
    const firebaseConfig = await resolveFirebaseConfig();

    if (typeof firebase !== 'undefined' && firebaseConfig && firebaseConfig.apiKey !== "") {
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
                if (firebaseConfig.measurementId && typeof firebase.analytics === 'function') {
                    firebase.analytics();
                }
            }
            db = firebase.firestore();
            console.log("Firebase initialized successfully (Firestore + Analytics).");
        } catch (e) {
            console.error("Firebase init failed:", e);
        }
    } else {
        console.log("Firebase non configurato o SDK non caricato: persistenza solo locale.");
    }
}
window.firebaseReady = initFirebase();

async function loadSDK() {
    console.log("Standalone mode: Dynamic SDK loading disabled for file:// compatibility.");
}

function trackEvent(eventName, params = {}) {
    if (typeof gtag === 'function') {
        gtag('event', eventName, params);
    }
}

const DISCLAIMER = "Questo servizio fornisce esclusivamente supporto informativo per l'orientamento sanitario e non costituisce diagnosi medica né sostituisce il parere di un professionista sanitario.";
const URGENCY_WARNING = "In presenza di sintomi gravi o improvvisi contatta il 118 o recati immediatamente al Pronto Soccorso.";

const DOMANDE_CONOSCITIVE = [
    "Da quanto tempo è presente il disturbo?\n<br><i>A) Da qualche ora/giorno<br>B) Da alcune settimane<br>C) Da mesi/anni</i>",
    "La comparsa del sintomo è stata improvvisa o graduale?\n<br><i>A) Improvvisa e acuta<br>B) Graduale ma in peggioramento<br>C) Alterna momenti buoni e cattivi</i>",
    "Hai altre patologie note o assumi farmaci regolarmente?\n<br><i>A) Nessuna patologia/farmaco<br>B) Assumo farmaci di base (es. pressione, sciroppi)<br>C) Patologie croniche note</i>"
];

const DOMANDE_ANAMNESTICHE = [
    "Il dolore o fastidio peggiora con il movimento o in determinate posizioni?\n<br><i>A) Sì<br>B) No<br>C) A volte</i>",
    "Il riposo notturno è disturbato da questo problema?\n<br><i>A) Sì, spesso mi sveglia<br>B) No, dormo bene<br>C) Difficoltà solo nell'addormentamento</i>",
    "Senti che questo disturbo sta impattando significativamente la tua vita quotidiana o il tuo benessere emotivo?\n<br><i>A) Moltissimo<br>B) Abbastanza<br>C) Poco o nulla</i>"
];
