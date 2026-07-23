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

const SPECIALTY_EVIDENCE_COMMON = Object.freeze([
    {
        title: "Referral interventions from primary to specialist care: a systematic review",
        detail: "Blank et al., British Journal of General Practice, 2014 (abstract PubMed)",
        url: "https://pubmed.ncbi.nlm.nih.gov/25452541/"
    },
    {
        title: "Defining a framework for a quality referral: systematic scoping review",
        detail: "Osman et al., British Journal of General Practice, 2026 (abstract PubMed)",
        url: "https://pubmed.ncbi.nlm.nih.gov/41494776/"
    }
]);

const SPECIALTY_EVIDENCE_CATALOG = Object.freeze([
    { match: /pielonefrit|upper uti|infezione urinaria alta|infezione renale|febbre 39|brividi[^.!?]{0,80}(?:urin|fianco)/i, source: { title: "Pyelonephritis - acute", detail: "NICE Clinical Knowledge Summary", url: "https://cks.nice.org.uk/topics/pyelonephritis-acute/" } },
    { match: /cistit|lower uti|infezione urinaria bassa|sintomi urinari bassi|bruciore (?:quando )?urin|aumento della frequenza urinaria|devo andare spesso in bagno/i, source: { title: "Urinary tract infection (lower) - women", detail: "NICE Clinical Knowledge Summary", url: "https://cks.nice.org.uk/topics/urinary-tract-infection-lower-women/" } },
    { match: /neurolog|neurochirurg/i, source: { title: "Suspected neurological conditions: recognition and referral", detail: "NICE guideline NG127", url: "https://www.nice.org.uk/guidance/ng127" } },
    { match: /cardiolog/i, source: { title: "Recent-onset chest pain of suspected cardiac origin", detail: "NICE clinical guideline CG95", url: "https://www.nice.org.uk/guidance/cg95" } },
    { match: /neo|lesion[ei] pigmentat|dermatoscop|melanom|asimmetri|bordi irregolari|colori diversi|marrone scuro|nero/i, source: { title: "Melanoma: assessment and management", detail: "NICE guideline NG14", url: "https://www.nice.org.uk/guidance/ng14" } },
    { match: /dermatite|eczema|chiazze rosse|detergenti|guanti|screpolat|hand eczema|patch test/i, source: { title: "Dermatitis - contact", detail: "NICE Clinical Knowledge Summary", url: "https://cks.nice.org.uk/topics/dermatitis-contact/" } },
    { match: /cellulit|erisipel|infezione cutanea|zona rossa|calda|gonfia|dolorosa|allargars|brividi/i, source: { title: "Cellulitis - acute", detail: "NICE Clinical Knowledge Summary", url: "https://cks.nice.org.uk/topics/cellulitis-acute/" } },
    { match: /anafil|orticaria|angioedema|frutta secca|gola che si chiude|respiro difficile|gonfiore (?:alle )?(?:labbra|lingua)/i, source: { title: "Angio-oedema and anaphylaxis", detail: "NICE Clinical Knowledge Summary", url: "https://cks.nice.org.uk/topics/angio-oedema-anaphylaxis/" } },
    { match: /impetig|crosticine|croste giallastre|giallastre|perioral|perinasal|naso e alla bocca|contatti scolastici/i, source: { title: "Impetigo", detail: "NICE Clinical Knowledge Summary", url: "https://cks.nice.org.uk/topics/impetigo/" } },
    { match: /lombalg|lombar|rachide|sciatalg|sciatica|schiena/i, source: { title: "Low back pain and sciatica: assessment and management", detail: "NICE guideline NG59", url: "https://www.nice.org.uk/guidance/ng59" } },
    { match: /cavigl|frattur|lussazion|compromissione neurovascolare|dita fredde|pallide/i, source: { title: "Fractures (non-complex): assessment and management", detail: "NICE guideline NG38", url: "https://www.nice.org.uk/guidance/ng38" } },
    { match: /ginocch|menisc|legament|crociat|distorsion|traumatologia sportiva|crack/i, source: { title: "Knee Pain in Adults and Adolescents: The Initial Evaluation", detail: "American Family Physician, 2018", url: "https://www.aafp.org/pubs/afp/issues/2018/1101/p576.html" } },
    { match: /spalla|cuffia|rotator|impingement|tendinopatia/i, source: { title: "Shoulder pain: Management", detail: "NICE Clinical Knowledge Summary", url: "https://cks.nice.org.uk/topics/shoulder-pain/management/" } },
    { match: /ortoped|fisiatr|reumatolog/i, source: { title: "Fractures (non-complex): assessment and management", detail: "NICE guideline NG38", url: "https://www.nice.org.uk/guidance/ng38" } },
    { match: /dermatolog/i, source: { title: "Skin conditions: general dermatology referral context", detail: "NICE Clinical Knowledge Summaries", url: "https://cks.nice.org.uk/specialities/skin-and-nail/" } },
    { match: /oculist|oftalmolog/i, source: { title: "Glaucoma: diagnosis and management", detail: "NICE guideline NG81", url: "https://www.nice.org.uk/guidance/ng81" } },
    { match: /ginecolog|ostetric/i, source: { title: "Heavy menstrual bleeding: assessment and management", detail: "NICE guideline NG88", url: "https://www.nice.org.uk/guidance/ng88" } },
    { match: /celiach|coeliac|gastroenterolog.*pediatr|pediatr.*gastroenterolog/i, source: { title: "Coeliac disease: recognition, assessment and management", detail: "NICE guideline NG20", url: "https://www.nice.org.uk/guidance/ng20" } },
    { match: /pediatr/i, source: { title: "Fever in under 5s: assessment and initial management", detail: "NICE guideline NG143", url: "https://www.nice.org.uk/guidance/ng143" } },
    { match: /gastroenterolog/i, source: { title: "Gastro-oesophageal reflux disease and dyspepsia in adults", detail: "NICE clinical guideline CG184", url: "https://www.nice.org.uk/guidance/cg184" } },
    { match: /pneumolog/i, source: { title: "Chronic obstructive pulmonary disease in over 16s", detail: "NICE guideline NG115", url: "https://www.nice.org.uk/guidance/ng115" } },
    { match: /psicolog|psicoterap|psichiatr/i, source: { title: "Common mental health problems: identification and pathways to care", detail: "NICE clinical guideline CG123", url: "https://www.nice.org.uk/guidance/cg123" } },
    { match: /urolog|androlog/i, source: { title: "Lower urinary tract symptoms in men: management", detail: "NICE clinical guideline CG97", url: "https://www.nice.org.uk/guidance/cg97" } },
    { match: /endocrinolog|diabetolog/i, source: { title: "Type 2 diabetes in adults: management", detail: "NICE guideline NG28", url: "https://www.nice.org.uk/guidance/ng28" }, italianSource: { title: "Linea guida della Società Italiana di Diabetologia e AMD", detail: "Linea guida SNLG validata dall’Istituto Superiore di Sanità — fonte in italiano", url: "https://www.iss.it/documents/20126/8331678/LG_379_diabete_tipo2_ed2022.pdf/9193e1fd-5d16-6baa-6513-ac385467ec64?t=167880775394886&version=1.1" } },
    { match: /nefrolog/i, source: { title: "Chronic kidney disease: assessment and management", detail: "NICE guideline NG203", url: "https://www.nice.org.uk/guidance/ng203" } },
    { match: /otorino|otorinolaringoiatr/i, source: { title: "Hearing loss in adults: assessment and management", detail: "NICE guideline NG98", url: "https://www.nice.org.uk/guidance/ng98" } },
    { match: /oncolog|ematolog/i, source: { title: "Suspected cancer: recognition and referral", detail: "NICE guideline NG12", url: "https://www.nice.org.uk/guidance/ng12" }, italianSource: { title: "Terapia del dolore in oncologia", detail: "Linea guida AIOM pubblicata nel SNLG dell’Istituto Superiore di Sanità — fonte in italiano", url: "https://www.iss.it/-/snlg-terapia-dolore-oncologia" } },
    { match: /medico di medicina generale|medico general|internist/i, source: { title: "Multimorbidity: clinical assessment and management", detail: "NICE guideline NG56", url: "https://www.nice.org.uk/guidance/ng56" } }
]);

function buildSpecialtyEvidenceHTML(specialty, clinicalContext = "") {
    if (typeof CONFIG !== "undefined" && CONFIG.SHOW_SPECIALTY_EVIDENCE === false) return "";

    const normalizedSpecialty = normalizeMedicalText(`${specialty || ""} ${clinicalContext || ""}`);
    const matched = SPECIALTY_EVIDENCE_CATALOG.find((entry) => entry.match.test(normalizedSpecialty));
    const sources = matched
        ? [matched.source, ...(matched.italianSource ? [matched.italianSource] : []), ...SPECIALTY_EVIDENCE_COMMON]
        : SPECIALTY_EVIDENCE_COMMON;

    const items = sources.slice(0, 4).map((source) => `
        <li>
            <a href="${escapeHTML(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(source.title)}</a>
            <span>${escapeHTML(source.detail)}</span>
        </li>`).join("");

    return `
        <section class="specialty-evidence" data-testid="orientation-sources" aria-label="Fonti scientifiche dell'orientamento">
            <h4>Fonti a supporto dell’orientamento</h4>
            <p>${matched
                ? "Riferimenti clinici e metodologici consultabili, pertinenti alla branca indicata."
                : "Riferimenti metodologici sulla qualità dell’invio allo specialista; il catalogo specifico per questa branca è in aggiornamento."}</p>
            <ul>${items}</ul>
            <small>Le fonti sostengono i criteri generali di orientamento, non confermano una diagnosi né sostituiscono la valutazione del medico.</small>
        </section>`;
}

function buildNewSearchActionsHTML() {
    return `
        <section class="new-search-actions" aria-label="Azioni al termine della ricerca">
            <p>Vuoi effettuare un altro orientamento?</p>
            <button type="button" class="new-search-button new-search-inline restart-orientation-btn" data-restart-orientation>
                <span aria-hidden="true">↻</span> Fai una nuova ricerca
            </button>
        </section>
        <button type="button" class="new-search-button new-search-floating restart-orientation-btn" data-restart-orientation aria-label="Fai una nuova ricerca e torna all'inizio">
            <span aria-hidden="true">↻</span> Fai una nuova ricerca
        </button>`;
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

function normalizeMedicalText(value) {
    let text = String(value ?? "");
    if (!text) return "";

    // Repair text that was UTF-8-decoded as Windows-1252 one or more times.
    const cp1252Bytes = {
        "\u20ac": 0x80, "\u201a": 0x82, "\u0192": 0x83, "\u201e": 0x84, "\u2026": 0x85,
        "\u2020": 0x86, "\u2021": 0x87, "\u02c6": 0x88, "\u2030": 0x89, "\u0160": 0x8a,
        "\u2039": 0x8b, "\u0152": 0x8c, "\u017d": 0x8e, "\u2018": 0x91, "\u2019": 0x92,
        "\u201c": 0x93, "\u201d": 0x94, "\u2022": 0x95, "\u2013": 0x96, "\u2014": 0x97,
        "\u02dc": 0x98, "\u2122": 0x99, "\u0161": 0x9a, "\u203a": 0x9b, "\u0153": 0x9c,
        "\u017e": 0x9e, "\u0178": 0x9f
    };
    const mojibakeMarker = /(?:Ã|Â|â|Æ|ƒ)/g;
    const markerCount = (input) => (input.match(mojibakeMarker) || []).length;
    const decodeCp1252AsUtf8 = (input) => {
        const bytes = [];
        for (const char of input) {
            const code = char.charCodeAt(0);
            if (code <= 0xff) bytes.push(code);
            else if (Object.prototype.hasOwnProperty.call(cp1252Bytes, char)) bytes.push(cp1252Bytes[char]);
            else return input;
        }
        return new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes));
    };

    for (let attempt = 0; attempt < 4 && markerCount(text); attempt += 1) {
        try {
            const repaired = decodeCp1252AsUtf8(text);
            if (repaired === text || markerCount(repaired) >= markerCount(text)) break;
            text = repaired;
        } catch (_) {
            break;
        }
    }

    // A sentence can contain both valid accented text and a damaged word. Repair
    // those words independently when decoding the complete sentence is not possible.
    for (let attempt = 0; attempt < 4 && markerCount(text); attempt += 1) {
        let changed = false;
        text = text.replace(/[^\t\r\n <>&]*[ÃÂâÆƒ][^\t\r\n <>&]*/g, (token) => {
            try {
                const repaired = decodeCp1252AsUtf8(token);
                if (repaired !== token && markerCount(repaired) < markerCount(token)) {
                    changed = true;
                    return repaired;
                }
            } catch (_) {
                // Keep the original token when it is not a valid encoded byte sequence.
            }
            return token;
        });
        if (!changed) break;
    }

    // Avoid showing serialized HTML entities in plain-text answer choices.
    text = text.replace(/&nbsp;|&#160;|&#xA0;/gi, " ");

    return text.replace(/\s{2,}/g, " ").trim();
}

let GoogleGenerativeAI = true; // Placeholder per indicare che il motore è pronto (non usiamo più l'SDK esterno)

let db = null;
const AI_FINAL_NOTICE = "Questa è un'indicazione informativa. Confermala sempre con il tuo medico curante.";
const APP_CONSENT_VERSION = "2026-07-02-compliance-v1";
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
const CLINICAL_URGENCY_WARNING = "Le informazioni inserite contengono possibili segnali di urgenza: contatta subito il 112/118 o recati al Pronto Soccorso. Questo avviso non è una diagnosi.";

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
