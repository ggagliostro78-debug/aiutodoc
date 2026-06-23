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
const AI_FINAL_NOTICE = "Questa è un'indicazione informativa. Confermala sempre con il tuo medico curante.";
const APP_CONSENT_VERSION = "2026-05-gdpr-v1";
const REGISTERED_USER_KEY = "aiutodoc_registered_user";
const ENTRY_CONSENT_KEY = "aiutodoc_entry_consents";
const TRIAGE_STORAGE_KEY = "aiutodoc_triages";
const TRIAGE_STORAGE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const TRIAGE_STORAGE_MAX_ITEMS = 20;

function getStoredJson(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || "null");
    } catch (error) {
        console.warn("Dato locale non leggibile:", key, error);
        return null;
    }
}

function getRegisteredUser() {
    return getStoredJson(REGISTERED_USER_KEY);
}

function normalizeTriageID(id) {
    return String(id || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function buildCloudTriageDocId(userId, triageId) {
    const cleanUserId = String(userId || "").replace(/[^a-zA-Z0-9_-]/g, "");
    const cleanTriageId = normalizeTriageID(triageId);
    if (!cleanUserId || !cleanTriageId) return "";
    return `${cleanUserId}_${cleanTriageId}`;
}

function getStoredTriages() {
    const saved = getStoredJson(TRIAGE_STORAGE_KEY) || {};
    const now = Date.now();
    const entries = Object.entries(saved)
        .filter(([, value]) => {
            const dateMs = Date.parse(value?.date || "");
            return Number.isFinite(dateMs) && now - dateMs <= TRIAGE_STORAGE_TTL_MS;
        })
        .sort(([, a], [, b]) => Date.parse(b?.date || "") - Date.parse(a?.date || ""));

    const pruned = Object.fromEntries(entries.slice(0, TRIAGE_STORAGE_MAX_ITEMS));
    if (entries.length !== Object.keys(saved).length) {
        localStorage.setItem(TRIAGE_STORAGE_KEY, JSON.stringify(pruned));
    }
    return pruned;
}

function saveStoredTriage(dataToSave) {
    const id = normalizeTriageID(dataToSave?.id);
    if (!id) return;
    const allResults = getStoredTriages();
    allResults[id] = dataToSave;
    const entries = Object.entries(allResults)
        .sort(([, a], [, b]) => Date.parse(b?.date || "") - Date.parse(a?.date || ""))
        .slice(0, TRIAGE_STORAGE_MAX_ITEMS);
    localStorage.setItem(TRIAGE_STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)));
}

function maskEmail(email) {
    const [name, domain] = String(email || "").split("@");
    if (!name || !domain) return "";
    const visible = name.slice(0, 2);
    return `${visible}${"*".repeat(Math.max(2, name.length - 2))}@${domain}`;
}

async function sha256Hex(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
        const bytes = new TextEncoder().encode(normalized);
        const hashBuffer = await window.crypto.subtle.digest("SHA-256", bytes);
        return Array.from(new Uint8Array(hashBuffer))
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join("");
    }

    return btoa(unescape(encodeURIComponent(normalized))).replace(/=+$/g, "");
}

async function registerUserForRecovery(email, consentFlags = {}) {
    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        throw new Error("Inserisci un indirizzo email valido.");
    }

    const required = ["terms", "privacy", "healthData"];
    if (!required.every((key) => consentFlags[key] === true)) {
        throw new Error("Per generare il codice devi confermare tutti i consensi richiesti.");
    }

    const emailHash = await sha256Hex(cleanEmail);
    const registeredUser = {
        userId: `usr_${emailHash.slice(0, 16)}`,
        emailHash,
        emailMasked: maskEmail(cleanEmail),
        registeredAt: new Date().toISOString(),
        consentVersion: APP_CONSENT_VERSION,
        consents: {
            terms: true,
            privacy: true,
            healthData: true
        }
    };

    localStorage.setItem(REGISTERED_USER_KEY, JSON.stringify(registeredUser));

    return registeredUser;
}

async function resolveFirebaseConfig() {
    return null;
}

async function initFirebase() {
    console.log("Firebase client disabilitato: archivio recupero gestito solo dal backend.");
}
window.firebaseReady = Promise.resolve();

async function loadSDK() {
    console.log("Standalone mode: Dynamic SDK loading disabled for file:// compatibility.");
}

function trackEvent(eventName, params = {}) {
    if (typeof gtag === 'function') {
        const reservedParamMap = {
            source: 'event_source',
            medium: 'event_medium',
            campaign: 'event_campaign',
            term: 'event_term',
            content: 'event_content'
        };
        const safeParams = {};

        Object.entries(params || {}).forEach(([key, value]) => {
            const safeKey = reservedParamMap[key] || key;
            safeParams[safeKey] = value;
        });

        gtag('event', eventName, safeParams);
    }
}

const DISCLAIMER = "Questo servizio fornisce informazioni di orientamento sanitario e supporto alla ricerca dello specialista. Non sostituisce il parere di un professionista sanitario.";
const URGENCY_WARNING = "In presenza di sintomi gravi o improvvisi contatta il 112 o recati immediatamente al Pronto Soccorso.";

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
