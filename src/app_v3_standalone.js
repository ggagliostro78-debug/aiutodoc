// src/app_v3.js
    // No user input, medical text, recovery codes or raw errors in browser logs.


class TriageEngine {
    constructor(onMessage) {
        this.state = '1_SESSO_ETA';
        this.userData = {
            age: null,
            age_range: null,
            exact_age: null,
            weight_kg: null,
            height_cm: null,
            sex_at_birth: null,
            initialMedicalData: null,
            sessoEta: null,
            zona: null,
            zonaDettagli: null,
            disturbo: null,
            conoscitiveResp: [],
            anamnesticheResp: []
        };
        this.currentConoscitiva = 0;
        this.currentAnamnestica = 0;
        this.conditionalDetailsQueue = [];
        this.currentConditionalDetail = null;
        this.onMessage = onMessage;
        this._updatePlaceholder();
        this._initUIListeners();
    }

    _initUIListeners() {
        // Recovery Button (Menu)
        const recBtn = document.getElementById('recovery-btn');
        const recInput = document.getElementById('recovery-id-input');
        if (recBtn && recInput) {
            recBtn.onclick = () => this.retrieveFromCloud(recInput.value);
        }

        const initialForm = document.getElementById('initial-medical-form');
        if (initialForm) {
            initialForm.addEventListener('submit', (event) => {
                event.preventDefault();
                const formData = new FormData(initialForm);
                const ageRange = formData.get('age_range');
                const sexAtBirth = formData.get('sex_at_birth');
                const validation = this._validateInitialMedicalSearch({
                    age_range: ageRange ? String(ageRange) : "",
                    sex_at_birth: sexAtBirth ? String(sexAtBirth) : ""
                });

                this._renderInitialMedicalErrors(validation.errors);
                if (!validation.valid) return;

                this.acceptInitialMedicalData({
                    age_range: String(ageRange),
                    sex_at_birth: String(sexAtBirth)
                }, { echoUserMessage: true });
            });
        }
    }

    _updatePlaceholder() {
        const inputEl = document.getElementById('user-input');
        if (!inputEl) return;

        let placeholder = "Scrivi qui...";
        switch (this.state) {
            case '1_SESSO_ETA':
                placeholder = "Completa prima la card iniziale";
                break;
            case '2_ZONA':
                placeholder = "Inserisci Comune o Provincia. Es. Milano, Roma, RC oppure Italia";
                break;
            case '3_DISTURBO':
                placeholder = "Descrivi in parole semplici il motivo della ricerca. Es. dolore al ginocchio, mal di testa frequente, difficoltà a dormire...";
                break;
            case '4_CONOSCITIVE':
            case '5_ANAMNESTICHE':
                placeholder = "Rispondi indicando la lettera (A, B, C o D)";
                break;
            case '4B_NOTA_CONOSCITIVA_SCELTA':
            case '5B_NOTA_ANAMNESTICA_SCELTA':
                placeholder = "Scegli Si o No";
                break;
            case '5C_DETTAGLIO_CONDIZIONATO':
                if (this.currentConditionalDetail === "weight_kg") {
                    placeholder = "Inserisci il peso in kg. Es. 72";
                } else if (this.currentConditionalDetail === "height_cm") {
                    placeholder = "Inserisci l'altezza in cm. Es. 170";
                } else {
                    placeholder = "Inserisci l'età precisa. Es. 47";
                }
                break;
            case '4B_NOTA_CONOSCITIVA':
            case '5B_NOTA_ANAMNESTICA':
                placeholder = "inserisci il testo che desideri e clicca il tasto a lato per continuare";
                break;
            case '7_ERRORE':
                placeholder = "Ricerca non completata. Avvia una nuova ricerca.";
                break;
            case '7_FINE':
                placeholder = "Orientamento completato.";
                break;
        }
        inputEl.placeholder = normalizeMedicalText(placeholder);
    }

    _sexAtBirthLabel(value) {
        const labels = {
            female: "Femmina",
            male: "Maschio",
            not_specified: "Preferisco non specificare"
        };
        return labels[value] || labels.not_specified;
    }

    _ageRangeLabel(value) {
        const labels = {
            "0_2": "0-2 anni",
            "3_5": "3-5 anni",
            "6_12": "6-12 anni",
            "13_17": "13-17 anni",
            "18_39": "18-39 anni",
            "40_64": "40-64 anni",
            "65_74": "65-74 anni",
            "75_plus": "75 anni o più"
        };
        return normalizeMedicalText(labels[value] || "");
    }

    _ageRangeFromExactAge(age) {
        if (!Number.isInteger(age) || age < 0 || age > 120) return "";
        if (age <= 2) return "0_2";
        if (age <= 5) return "3_5";
        if (age <= 12) return "6_12";
        if (age <= 17) return "13_17";
        if (age <= 39) return "18_39";
        if (age <= 64) return "40_64";
        if (age <= 74) return "65_74";
        return "75_plus";
    }

    _validateInitialMedicalSearch(data) {
        const errors = {};
        const allowedSexAtBirth = ["female", "male", "not_specified"];
        const allowedAgeRanges = ["0_2", "3_5", "6_12", "13_17", "18_39", "40_64", "65_74", "75_plus"];

        if (!data.age_range || !allowedAgeRanges.includes(data.age_range)) {
            errors.age = "Seleziona una fascia di età per continuare.";
        }

        if (!data.sex_at_birth || !allowedSexAtBirth.includes(data.sex_at_birth)) {
            errors.sex_at_birth = "Seleziona un'opzione oppure scegli 'Preferisco non specificare'.";
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors
        };
    }

    _renderInitialMedicalErrors(errors = {}) {
        const ageError = document.getElementById('initial-age-error');
        const sexError = document.getElementById('initial-sex-error');
        if (ageError) ageError.textContent = errors.age || "";
        if (sexError) sexError.textContent = errors.sex_at_birth || "";
    }

    acceptInitialMedicalData(data, options = {}) {
        const validation = this._validateInitialMedicalSearch(data);
        this._renderInitialMedicalErrors(validation.errors);
        if (!validation.valid) return false;

        const sexLabel = this._sexAtBirthLabel(data.sex_at_birth);
        const ageRangeLabel = this._ageRangeLabel(data.age_range);
        this.userData.age = null;
        this.userData.age_range = data.age_range;
        this.userData.sex_at_birth = data.sex_at_birth;
        this.userData.initialMedicalData = {
            age_range: data.age_range,
            age_range_label: ageRangeLabel,
            sex_at_birth: data.sex_at_birth,
            created_at: new Date().toISOString()
        };
        this.userData.sessoEta = `${sexLabel}, ${ageRangeLabel}`;

        const initialForm = document.getElementById('initial-medical-form');
        if (initialForm) {
            initialForm.classList.add('completed');
            initialForm.querySelectorAll('input, button').forEach((el) => {
                el.disabled = true;
            });
        }

        const chatInputBar = document.querySelector('.chat-input-area');
        const inputEl = document.getElementById('user-input');
        if (chatInputBar) {
            chatInputBar.classList.remove('onboarding-hidden');
            chatInputBar.removeAttribute('aria-hidden');
        }

        if (options.echoUserMessage && window.chatUI) {
            window.chatUI.addMessage(`Fascia di età: ${ageRangeLabel}. Sesso biologico: ${sexLabel}.`, 'user-msg');
        }

        trackEvent('triage_started', {
            entry_point: 'initial_medical_form'
        });

        this.state = '2_ZONA';
        this.onMessage(`<strong>Qual è la tua zona geografica?</strong><br>Puoi indicare Comune, Provincia o scrivere <strong>Italia</strong> per una ricerca nazionale.`);
        this._updatePlaceholder();
        if (inputEl) {
            inputEl.focus();
        }
        return true;
    }

    _parseInitialMedicalFreeText(input) {
        const text = String(input || "").toLowerCase();
        const ageMatch = text.match(/(-?\d+)/);
        const age = ageMatch ? parseInt(ageMatch[0], 10) : null;

        let sex_at_birth = "";
        if (/\b(preferisco non specificare|non specifico|non voglio specificare|non specificare|n\/d|nd)\b/i.test(text)) {
            sex_at_birth = "not_specified";
        } else if (/\b(femmina|donna|ragazza|bambina|f)\b/i.test(text)) {
            sex_at_birth = "female";
        } else if (/\b(maschio|uomo|ragazzo|bambino|m)\b/i.test(text)) {
            sex_at_birth = "male";
        }

        return { age_range: this._ageRangeFromExactAge(age), sex_at_birth };
    }

    _clinicalContextText() {
        return [
            this.userData.disturbo,
            this.userData.zona,
            this.userData.notaConoscitiva,
            this.userData.notaAnamnestica,
            ...(this.userData.conoscitiveResp || []),
            ...(this.userData.anamnesticheResp || [])
        ].join(" ").toLowerCase();
    }

    _needsPreciseAge() {
        const text = this._clinicalContextText();
        const pediatricRanges = ["0_2", "3_5", "6_12", "13_17"];
        const geriatricRanges = ["65_74", "75_plus"];
        return pediatricRanges.includes(this.userData.age_range)
            || geriatricRanges.includes(this.userData.age_range)
            || /\b(pediatr|bambin|neonat|lattant|adolescent|gravid|fertilit|concep|screening|urg|emerg|dolore torac|sveniment|sincope|cardio|cuore|pressione|aritm|palpit|geriatr|anzian)\w*/i.test(text);
    }

    _needsWeight() {
        const text = this._clinicalContextText();
        const pediatricRanges = ["0_2", "3_5", "6_12", "13_17"];
        return pediatricRanges.includes(this.userData.age_range)
            || /\b(peso|bmi|massa corporea|nutriz|diet|obes|sovrappeso|sottopeso|endocrin|diabet|glicem|metabolic|cardiometabolic|cardio metabol|disidrata|vomit|diarrea|farmac|dosagg|dose)\w*/i.test(text);
    }

    _needsHeight() {
        const text = this._clinicalContextText();
        const pediatricRanges = ["0_2", "3_5", "6_12", "13_17"];
        return this._needsWeight() && (
            pediatricRanges.includes(this.userData.age_range)
            || /\b(altezza|bmi|imc|indice di massa corporea|crescita|nutriz|diet|obes|sovrappeso|sottopeso|endocrin|diabet|metabolic|cardiometabolic|cardio metabol)\w*/i.test(text)
        );
    }

    _prepareConditionalDetailsQueue() {
        const queue = [];
        if (this._needsPreciseAge() && !this.userData.exact_age) queue.push("exact_age");
        if (this._needsWeight() && !this.userData.weight_kg) queue.push("weight_kg");
        if (this._needsHeight() && !this.userData.height_cm) queue.push("height_cm");
        this.conditionalDetailsQueue = queue;
        this.currentConditionalDetail = null;
        return queue;
    }

    _askNextConditionalDetailOrFinalNote() {
        const next = this.conditionalDetailsQueue.shift();
        if (!next) {
            this.currentConditionalDetail = null;
            this.state = '5B_NOTA_ANAMNESTICA_SCELTA';
            this.onMessage(this._buildAdditionalDetailsPrompt('anamnestica'));
            this._updatePlaceholder();
            return;
        }

        this.currentConditionalDetail = next;
        this.state = '5C_DETTAGLIO_CONDIZIONATO';
        let message = "Per questo percorso serve anche l'età puntuale. Indica l'età precisa in anni, ad esempio <strong>47</strong>.";
        if (next === "weight_kg") {
            message = "Per questo percorso il peso può essere clinicamente rilevante. Se lo conosci, indica il peso in kg, ad esempio <strong>72</strong>. Puoi anche scrivere <strong>non lo so</strong> per proseguire senza questo dato.";
        } else if (next === "height_cm") {
            message = "Per questo percorso anche l'altezza può essere clinicamente rilevante. Se la conosci, indicala in centimetri, ad esempio <strong>170</strong>. Puoi anche scrivere <strong>non lo so</strong> per proseguire senza questo dato.";
        }
        this.onMessage(message);
        this._updatePlaceholder();
    }

    _handleConditionalDetailInput(input) {
        const rawValue = String(input || "").trim().replace(",", ".");
        const skipped = /^(?:non lo so|non so|non disponibile|preferisco non indicarlo|preferisco non indicarla)$/i.test(rawValue);
        if (skipped && ["weight_kg", "height_cm"].includes(this.currentConditionalDetail)) {
            this._askNextConditionalDetailOrFinalNote();
            return;
        }
        const unitPatterns = {
            exact_age: /^(\d+(?:\.\d+)?)\s*(?:anni?|years?)?$/i,
            weight_kg: /^(\d+(?:\.\d+)?)\s*(?:kg|chilogrammi?)?$/i,
            height_cm: /^(\d+(?:\.\d+)?)\s*(?:cm|centimetri?)?$/i
        };
        const valueMatch = unitPatterns[this.currentConditionalDetail]
            ? rawValue.match(unitPatterns[this.currentConditionalDetail])
            : null;
        const numberValue = valueMatch ? Number(valueMatch[1]) : NaN;

        if (this.currentConditionalDetail === "exact_age") {
            if (!Number.isInteger(numberValue) || numberValue < 0 || numberValue > 120) {
                this.onMessage("Errore: inserisci un'età valida compresa tra 0 e 120 anni.", "system-msg danger");
                return;
            }
            this.userData.exact_age = numberValue;
            this.userData.age = numberValue;
            this.userData.age_range = this.userData.age_range || this._ageRangeFromExactAge(numberValue);
        } else if (this.currentConditionalDetail === "weight_kg") {
            if (!Number.isFinite(numberValue) || numberValue < 0.5 || numberValue > 350) {
                this.onMessage("Errore: inserisci un peso valido in kg.", "system-msg danger");
                return;
            }
            this.userData.weight_kg = Math.round(numberValue * 10) / 10;
        } else if (this.currentConditionalDetail === "height_cm") {
            if (!Number.isFinite(numberValue) || numberValue < 30 || numberValue > 250) {
                this.onMessage("Errore: inserisci un'altezza valida in centimetri, compresa tra 30 e 250.", "system-msg danger");
                return;
            }
            this.userData.height_cm = Math.round(numberValue * 10) / 10;
        }

        this._askNextConditionalDetailOrFinalNote();
    }

    _buildAdditionalDetailsPrompt(scope) {
        const text = scope === 'conoscitiva'
            ? 'Hai altre informazioni o dettagli che vorresti aggiungere riguardo a questi aspetti generali?'
            : 'Vorresti aggiungere qualche dettaglio sui tuoi sintomi prima che elabori i dati?';

        return `
            <div class="detail-choice-prompt">
                <p>${text}</p>
                <div class="detail-choice-actions" role="group" aria-label="Aggiunta dettagli">
                    <button type="button" class="detail-choice-btn" data-reply="Si">Si</button>
                    <button type="button" class="detail-choice-btn" data-reply="No">No</button>
                </div>
            </div>
        `;
    }

    _formatQuestionWithNoneOption(question) {
        const text = String(question || "");
        if (/\bD\)/i.test(text)) return text;
        if (text.includes("</i>")) {
            return text.replace("</i>", "<br>D) Nessuna delle precedenti</i>");
        }
        return `${text}<br><i>D) Nessuna delle precedenti</i>`;
    }

    _addNoneOptionToQuestions(questions) {
        return Array.isArray(questions)
            ? questions.map((question) => this._formatQuestionWithNoneOption(question))
            : [];
    }

    _isAffirmativeChoice(input) {
        return /^(si|s\u00EC|ok|certo|aggiungo|voglio aggiungere)(?:\s|[.!?,;:]|$)/i.test(normalizeMedicalText(input).toLowerCase());
    }

    _isNegativeChoice(input) {
        return /^(no|nessuna|nessuno|niente)\b/i.test(String(input || "").trim());
    }

    _askConoscitivaFreeText() {
        this.state = '4B_NOTA_CONOSCITIVA';
        this.onMessage('Inserisci il testo che desideri e clicca il tasto a lato per continuare.');
        this._updatePlaceholder();
    }

    _askAnamnesticaFreeText() {
        this.state = '5B_NOTA_ANAMNESTICA';
        this.onMessage('Inserisci il testo che desideri e clicca il tasto a lato per continuare.');
        this._updatePlaceholder();
    }

    _startAnamnesisQuestions() {
        this.state = '5_ANAMNESTICHE';
        this.onMessage(`Molto bene. Ora passiamo alla seconda fase con <strong>${this.userData.domandeAnamnesticheDinamiche.length} domande anamnestiche</strong> più specifiche sul disturbo per migliorare l'orientamento (rispondi con <strong>A, B, C o D</strong>).<br><br>1. ` + this.userData.domandeAnamnesticheDinamiche[0]);
        this._updatePlaceholder();
    }

    _startScientificResearch() {
        this.state = '6_RICERCA_SCIENTIFICA';

        const chatInputBar = document.querySelector('.chat-input-area');
        if (chatInputBar) chatInputBar.style.display = 'none';

        const loadingHTML = `
            <div id="ai-loading-box" style="display:flex; flex-direction:column; align-items:center; margin-top:10px; width: 100%;">
                <p>Dati raccolti con successo. <br><br><em>Elaborazione orientamento e preparazione percorsi verificabili...</em></p>

                <div style="width: 100%; max-width: 300px; background-color: #e0e9e9; border-radius: 10px; margin: 15px 0; overflow: hidden; height: 12px; position:relative;">
                    <div id="ai-progress-bar" style="width: 0%; height: 100%; background-color: var(--primary, #0F5464); transition: width 1s linear;"></div>
                </div>
                <p id="ai-countdown-text" style="font-size: 0.85rem; color: #6f899e; margin-bottom: 10px;">Tempo stimato: 45 secondi</p>

                <h3 id="ai-loading-title" style="color:var(--primary, #0F5464); animation: blink 1.5s infinite;"><strong>ATTENDERE...</strong></h3>
                <style>
                    @keyframes blink { 0% {opacity:1;} 50% {opacity:0.4;} 100% {opacity:1;} }
                </style>
            </div>
        `;

        this.onMessage(loadingHTML);

        let progressSeconds = 0;
        this.searchStartedAt = Date.now();

        setTimeout(() => {
            this.progressInterval = setInterval(() => {
                progressSeconds++;
                const bar = document.getElementById('ai-progress-bar');
                const text = document.getElementById('ai-countdown-text');
                if (bar && text) {
                    const percentage = Math.min((progressSeconds / 45) * 100, 100);
                    bar.style.width = percentage + '%';
                    const tRimasti = Math.max(45 - progressSeconds, 0);
                    text.innerText = `Tempo residuo stimato: ${tRimasti} secondi`;
                }
            }, 1000);
        }, 100);

        this.researchTimeout = setTimeout(() => {
            window.betaAbortRequests?.();
            this._showResearchFailure("La ricerca reale non ha risposto entro il tempo previsto. Riprova tra poco: nessun risultato simulato viene mostrato.");
        }, 55000);

        this._eseguiRicercaAI();
    }

    _generateTriageID() {
        const bytes = new Uint8Array(24);
        window.crypto.getRandomValues(bytes);
        return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    }

    _saveTriageResult(resultObj, source = 'api', options = {}) {
        const triageID = this._generateTriageID();
        const storedUserData = JSON.parse(JSON.stringify(this.userData));
        // L'altezza serve solo all'elaborazione corrente e non viene resa persistente.
        delete storedUserData.height_cm;
        const dataToSave = {
            id: triageID,
            date: new Date().toISOString(),
            userData: storedUserData,
            result: resultObj,
            source: source,
            userRegistration: null
        };

        if (options.deferUntilRegistration) {
            return dataToSave;
        }

        this._persistTriageResult(dataToSave);

        return dataToSave;
    }

    _persistTriageResult(dataToSave) {
        try {
            saveStoredTriage(dataToSave);
        } catch (e) {
    // No user input, medical text, recovery codes or raw errors in browser logs.
        }

        if (dataToSave.saveToCloud === true) {
            this._saveToCloud(dataToSave).catch((error) => {
    // No user input, medical text, recovery codes or raw errors in browser logs.
            });
        }
    }

    _buildRegistrationGate(pendingData) {
        window._pendingTriageSave = pendingData;
        return `
        <div class="registration-gate">
            <p><strong>Vuoi il codice per recuperare questa ricerca?</strong></p>
            <p>Il recupero resta anonimo: non serve registrarti. Conserva il codice con cura, perche chiunque lo possieda puo recuperare questa ricerca.</p>
            <label class="consent-row">
                <input type="checkbox" class="registration-consent" data-consent="terms">
                <span>Accetto i <a href="/termini-condizioni/" target="_blank" rel="noopener">Termini e Condizioni d'uso</a>.</span>
            </label>
            <label class="consent-row">
                <input type="checkbox" class="registration-consent" data-consent="privacy">
                <span>Dichiaro di aver letto l'<a href="/privacy-policy/" target="_blank" rel="noopener">Informativa Privacy</a>.</span>
            </label>
            <label class="consent-row">
                <input type="checkbox" class="registration-consent" data-consent="healthData">
                <span>Presto consenso esplicito al trattamento dei dati sanitari inseriti per il salvataggio facoltativo e il recupero per massimo 30 giorni. Nell’ambiente locale l'archivio e temporaneo e si azzera al riavvio del server. Posso cancellare la ricerca con il codice.</span>
            </label>
            <button type="button" class="btn-primary-wide register-and-save-triage">Genera codice anonimo</button>
            <p class="registration-note">Per tutelare la tua privacy, il codice e' l'unica chiave di recupero. Non condividerlo.</p>
        </div>`;
    }

    async registerAndSavePendingTriage(formEl) {
        const gate = formEl.closest('.registration-gate') || formEl;
        const pendingData = window._pendingTriageSave;
        if (!pendingData) {
            alert("Nessun risultato in attesa di salvataggio.");
            return;
        }

        const consentFlags = {};
        gate.querySelectorAll('.registration-consent').forEach((input) => {
            consentFlags[input.dataset.consent] = input.checked;
        });
        if (!["terms", "privacy", "healthData"].every((key) => consentFlags[key] === true)) {
            throw new Error("Per generare il codice devi confermare tutti i consensi richiesti.");
        }

        const userCodePrefix = '';
        pendingData.userRegistration = null;
        pendingData.userCodePrefix = userCodePrefix;
        pendingData.consents = {
            terms: true,
            privacy: true,
            healthData: true,
            consentVersion: APP_CONSENT_VERSION,
            consentedAt: new Date().toISOString()
        };

        const consent = await window.betaRegisterConsent('archive', consentFlags);
        pendingData.consentReceipt = consent.receipt;
        const saved = await this._saveToCloud(pendingData);
        pendingData.id = saved.id;
        pendingData.expiresAt = saved.expiresAt;
        delete pendingData.consentReceipt;
        const storageMode = saved.storageMode;
        saveStoredTriage(pendingData);
        window._currentTriageData = pendingData;
        window._pendingTriageSave = null;

        trackEvent('recovery_code_generated', {
            storage_mode: storageMode
        });

        const copyHint = storageMode === "cloud"
            ? "Usa questo codice per tornare ai risultati senza rifare le domande. Non condividerlo."
            : "Archivio temporaneo del server locale: il codice scade al riavvio e comunque entro 30 giorni. Non condividerlo.";
        const saveNote = storageMode === "cloud"
            ? "Ricerca salvata con <strong>codice univoco</strong>:"
            : "Ricerca salvata nell’<strong>archivio temporaneo</strong> con codice univoco:";

        gate.outerHTML = `
        <div class="id-copy-box" data-triage-id="${escapeHTML(pendingData.id)}" title="Clicca per copiare l'ID">
            <p style="margin: 0 0 8px 0; font-size: 0.9rem; opacity: 0.9;">${saveNote}</p>
            <div class="id-number">${escapeHTML(pendingData.id)}</div>
            <p class="copy-hint">${copyHint}</p>
        </div>`;

        const newBox = document.querySelector(`.id-copy-box[data-triage-id="${pendingData.id}"]`);
        if (newBox) {
            newBox.addEventListener('click', () => copyTriageID(pendingData.id, newBox));
            newBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    async _saveToCloud(data) {
        const API_URL = (typeof CONFIG !== 'undefined' && CONFIG.TRIAGE_SAVE_API_URL)
            ? CONFIG.TRIAGE_SAVE_API_URL
            : "/api/triage-save";

        if (window.location.protocol === 'file:' && API_URL.startsWith('/')) {
            throw new Error("Il salvataggio del codice richiede un server locale o un deploy serverless.");
        }

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                triage: data,
                consentReceipt: data.consentReceipt,
                userCodePrefix: data.userCodePrefix || ""
            })
        });

        if (!response.ok) {
            const detail = await response.text();
            throw new Error(`Salvataggio codice non riuscito (${response.status}): ${detail}`);
        }

        return response.json();
    }

    async retrieveFromCloud(id) {
        if (!id) {
            alert("Inserisci un codice ID valido.");
            return;
        }
        const cleanID = normalizeTriageID(id);

        trackEvent('recovery_requested', {
            recovery_source: 'engine_direct'
        });

        this.onMessage("Recupero: Recupero ricerca in corso per ID: " + cleanID + "...", "system-msg");

        try {
            const response = await fetch((typeof CONFIG !== 'undefined' && CONFIG.TRIAGE_RECOVER_API_URL) ? CONFIG.TRIAGE_RECOVER_API_URL : "/api/triage-recover", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            if (response.status === 404 || response.status === 410) {
                this.onMessage("Codice non trovato o scaduto. Verifica il codice e riprova.", "system-msg danger");
                return;
            }

            if (!response.ok) {
                const detail = await response.text();
                throw new Error(`Recupero codice non riuscito (${response.status}): ${detail}`);
            }

            const payload = await response.json();
            const data = payload.triage;
            saveStoredTriage(data);
            window._currentTriageData = data;
            trackEvent('recovery_success', {
                retrieval_mode: 'cloud'
            });
            this.onMessage("OK: Ricerca recuperata con successo!", "system-msg success");

            // Switch alla tab chat se necessario
            const chatBtn = document.querySelector('[data-target="chat-section"]');
            if (chatBtn) chatBtn.click();

            // Rendering dei risultati recuperati
            this.userData = data.userData;
            this.currentTriageID = data.id;
            this._renderCloudResults(data.result);

        } catch (err) {
    // No user input, medical text, recovery codes or raw errors in browser logs.
            trackEvent('recovery_failed', {
                retrieval_mode: 'cloud'
            });
            this.onMessage("Attenzione: Errore durante il recupero. Riprova.", "system-msg danger");
        }
    }

    _renderCloudResults(resultObj) {
        // Usa la logica esistente di rendering ma partendo dai dati caricati
        // Simile a quanto fatto in _getGeminiConsultation dopo il parsing JSON
        this._displayFinalResults(resultObj);
    }

    _displayFinalResults(resultObj) {
        const saved = window._currentTriageData;
        if (saved && window.chatUI) window.chatUI.displaySavedTriage(saved);
    }

    async _fetchWithTimeout(url, options = {}, timeoutMs = 4500) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
            return await fetch(url, {
                ...options,
                signal: controller.signal
            });
        } finally {
            clearTimeout(timer);
        }
    }

    async _validateSymptomWithBackend(symptom) {
        const cleanSymptom = String(symptom || "").trim();
        if (cleanSymptom.length < 3) {
            throw new Error("Descrizione del sintomo mancante o troppo breve.");
        }

        const API_URL = (typeof CONFIG !== 'undefined' && CONFIG.GEMINI_API_URL)
            ? CONFIG.GEMINI_API_URL
            : "/api/gemini";
        if (window.location.protocol === 'file:' && API_URL.startsWith('/')) {
            throw new Error("La validazione automatica richiede un server locale o un deploy serverless.");
        }

        const response = await this._fetchWithTimeout(
            API_URL,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'validate_symptom',
                    symptom: cleanSymptom
                })
            },
            15000
        );

        if (!response.ok) {
            throw new Error(`Validazione automatica non disponibile (${response.status}).`);
        }

        const payload = await response.json();
        const result = payload && payload.result;
        if (!result
            || typeof result.is_medical_request !== 'boolean'
            || typeof result.is_possible_emergency !== 'boolean') {
            throw new Error("Risposta di validazione automatica non valida.");
        }

        return {
            is_medical_request: result.is_medical_request,
            is_possible_emergency: result.is_possible_emergency
        };
    }

    async processUserInput(text) {
        const input = text.trim();
    // No user input, medical text, recovery codes or raw errors in browser logs.
        if (!input) return;

        const urgencySignals = this._detectUrgencySignals(input);
        if (urgencySignals.length > 0) {
    // No user input, medical text, recovery codes or raw errors in browser logs.
            const structured = this._sanitizeResultForUser(this._buildLocalEmergencyStructuredData(input, urgencySignals));
            const visibleSignals = structured.red_flags_rilevate.length ? structured.red_flags_rilevate : urgencySignals;
            const signalsHTML = visibleSignals.map((signal) => `<li>${escapeHTML(signal)}</li>`).join("");
            const structuredHTML = `<span data-testid="specialist-output" hidden>${escapeHTML(structured.specialista_indicato)}</span>
                <span data-testid="specialization-area-output" hidden>${escapeHTML(JSON.stringify(structured.area_specialistica_piu_adatta))}</span>
                <span data-testid="structured-urgency-output" hidden>${escapeHTML(structured.livello_urgenza)}</span>`;
            this.onMessage(`${CLINICAL_URGENCY_WARNING}<br><strong>Motivazione dell'urgenza:</strong><ul>${signalsHTML}</ul>${structuredHTML}`, 'system-msg danger clinical-emergency');
            return;
        }

        switch (this.state) {
            case '1_SESSO_ETA':
                {
                    const initialData = this._parseInitialMedicalFreeText(input);
                    const validation = this._validateInitialMedicalSearch(initialData);

                    if (!validation.valid) {
                        const message = validation.errors.age || validation.errors.sex_at_birth || "Controlla le informazioni inserite.";
                        this.onMessage(`Errore: ${escapeHTML(message)}`, "system-msg danger");
                        return;
                    }

                    this.acceptInitialMedicalData(initialData);
                    return;
                }
                const strSessoEta = input.toLowerCase();
    // No user input, medical text, recovery codes or raw errors in browser logs.

                // Regex molto permissiva: cerca un numero e parole chiave
                const sexMatch = strSessoEta.match(/(uomo|donna|maschio|femmina|ragazzo|ragazza|bambino|bambina| m | f | u | d |^m$|^f$|^u$|^d$| m$| f$| u$| d$|^m |^f |^u |^d )/i);
                const ageMatch = strSessoEta.match(/(-?\d+)/);

                // Se non troviamo nulla di utile
                if (!sexMatch && !ageMatch) {
                   this.onMessage("Errore: Dati non chiari. Per favore inserisci età e sesso biologico, oppure scegli 'Preferisco non specificare'.", "system-msg danger");
                   return;
                }

                // Fallback intelligenti
                let sesso = "Non specificato";
                if (sexMatch) {
                    const s = sexMatch[0].trim().toLowerCase();
                    if (['uomo', 'maschio', 'ragazzo', 'bambino', 'm', 'u'].includes(s)) sesso = "Uomo";
                    else if (['donna', 'femmina', 'ragazza', 'bambina', 'f', 'd'].includes(s)) sesso = "Donna";
                }

                const ageNum = ageMatch ? parseInt(ageMatch[0], 10) : null;

                if (ageNum === null || ageNum < 0 || ageNum > 120) {
                    this.onMessage("Errore: inserita non è valida. Per procedere è necessario inserire un'età reale compresa tra 0 e 120 anni (es: Maschio, 47).", "system-msg danger");
                    return;
                }

                this.userData.sessoEta = `${sesso}, ${ageNum} anni`;
    // No user input, medical text, recovery codes or raw errors in browser logs.
                this.state = '2_ZONA';
                this.onMessage(`<strong>Qual è la tua zona geografica?</strong><br>Puoi indicare Comune, Provincia o scrivere <strong>Italia</strong> per una ricerca nazionale.`);
                this._updatePlaceholder();
                break;

            case '2_ZONA':
                let cleanZona = input.trim().toUpperCase();

                // Mappatura delle 107 sigle provinciali italiane
                const provinceIt = {
                    "AG": "Agrigento", "AL": "Alessandria", "AN": "Ancona", "AO": "Aosta", "AR": "Arezzo", "AP": "Ascoli Piceno", "AT": "Asti", "AV": "Avellino", "BA": "Bari", "BT": "Barletta-Andria-Trani", "BL": "Belluno", "BN": "Benevento", "BG": "Bergamo", "BI": "Biella", "BO": "Bologna", "BZ": "Bolzano", "BS": "Brescia", "BR": "Brindisi", "CA": "Cagliari", "CL": "Caltanissetta", "CB": "Campobasso", "SU": "Sud Sardegna", "CE": "Caserta", "CT": "Catania", "CZ": "Catanzaro", "CH": "Chieti", "CO": "Como", "CS": "Cosenza", "CR": "Cremona", "KR": "Crotone", "CN": "Cuneo", "EN": "Enna", "FM": "Fermo", "FE": "Ferrara", "FI": "Firenze", "FG": "Foggia", "FC": "Forlì-Cesena", "FR": "Frosinone", "GE": "Genova", "GO": "Gorizia", "GR": "Grosseto", "IM": "Imperia", "IS": "Isernia", "SP": "La Spezia", "AQ": "L'Aquila", "LT": "Latina", "LE": "Lecce", "LC": "Lecco", "LI": "Livorno", "LO": "Lodi", "LU": "Lucca", "MC": "Macerata", "MN": "Mantova", "MS": "Massa-Carrara", "MT": "Matera", "ME": "Messina", "MI": "Milano", "MO": "Modena", "MB": "Monza e della Brianza", "NA": "Napoli", "NO": "Novara", "NU": "Nuoro", "OR": "Oristano", "PD": "Padova", "PA": "Palermo", "PR": "Parma", "PV": "Pavia", "PG": "Perugia", "PU": "Pesaro e Urbino", "PE": "Pescara", "PC": "Piacenza", "PI": "Pisa", "PT": "Pistoia", "PN": "Pordenone", "PZ": "Potenza", "PO": "Prato", "RG": "Ragusa", "RA": "Ravenna", "RC": "Reggio Calabria", "RE": "Reggio Emilia", "RI": "Rieti", "RN": "Rimini", "RM": "Roma", "RO": "Rovigo", "SA": "Salerno", "SS": "Sassari", "SV": "Savona", "SI": "Siena", "SR": "Siracusa", "SO": "Sondrio", "TA": "Taranto", "TE": "Teramo", "TR": "Terni", "TO": "Torino", "TP": "Trapani", "TN": "Trento", "TV": "Treviso", "TS": "Trieste", "UD": "Udine", "VA": "Varese", "VE": "Venezia", "VB": "Verbano-Cusio-Ossola", "VC": "Vercelli", "VR": "Verona", "VV": "Vibo Valentia", "VI": "Vicenza", "VT": "Viterbo"
                };

                const normalizeProvinceText = (value) => String(value || "")
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/\b(provincia|prov\.?|citta metropolitana|metropolitana|di|del|della)\b/gi, " ")
                    .replace(/[^a-z0-9]+/gi, " ")
                    .replace(/\s+/g, " ")
                    .trim()
                    .toUpperCase();

                const acceptProvince = (sigla, provinceName) => {
                    this.userData.zona = provinceName;
                    this.userData.zonaDettagli = {
                        comune: provinceName,
                        provincia: provinceName,
                        provinciaSigla: sigla,
                        regione: provinceName
                    };
                    this.state = '3_DISTURBO';
                    this.onMessage(`OK: impostata: <strong>${escapeHTML(provinceName)} (${escapeHTML(sigla)})</strong>.<br><br>Grazie. Ora descrivimi più nel dettaglio: <strong>qual è il tuo disturbo o sintomo principale?</strong>`);
                    this._updatePlaceholder();
                };

                const rawZona = input.trim();
                const provinceCodeFromInput = rawZona.toUpperCase().match(/(?:^|[\s,()/-])([A-Z]{2})(?:$|[\s,()/-])/);
                const directProvinceCode = cleanZona.length === 2 && /^[A-Z]{2}$/.test(cleanZona)
                    ? cleanZona
                    : (provinceCodeFromInput ? provinceCodeFromInput[1] : "");
                const normalizedZona = normalizeProvinceText(rawZona);
                const matchedProvince = Object.entries(provinceIt).find(([code, name]) =>
                    normalizedZona === normalizeProvinceText(name) ||
                    normalizedZona === normalizeProvinceText(`${name} ${code}`) ||
                    normalizedZona === normalizeProvinceText(`${code} ${name}`)
                );

                const regionsIt = [
                    "Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna",
                    "Friuli Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche",
                    "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana",
                    "Trentino-Alto Adige", "Umbria", "Valle d'Aosta", "Veneto"
                ];
                const regionAliases = {
                    "EMILIA ROMAGNA": "Emilia-Romagna",
                    "FRIULI": "Friuli Venezia Giulia",
                    "FRIULI VENEZIA GIULIA": "Friuli Venezia Giulia",
                    "TRENTINO": "Trentino-Alto Adige",
                    "TRENTINO ALTO ADIGE": "Trentino-Alto Adige",
                    "ALTO ADIGE": "Trentino-Alto Adige",
                    "SUDTIROL": "Trentino-Alto Adige",
                    "SUD TIROL": "Trentino-Alto Adige",
                    "VALLE AOSTA": "Valle d'Aosta",
                    "VAL D AOSTA": "Valle d'Aosta"
                };
                const matchedRegion = regionsIt.find((regionName) =>
                    normalizedZona === normalizeProvinceText(regionName) ||
                    normalizedZona === normalizeProvinceText(`regione ${regionName}`)
                ) || regionAliases[normalizedZona];

                const acceptRegion = (regionName) => {
                    this.userData.zona = regionName;
                    this.userData.zonaDettagli = {
                        comune: regionName,
                        provincia: regionName,
                        regione: regionName,
                        scope: "regione"
                    };
                    this.state = '3_DISTURBO';
                    this.onMessage(`OK: impostata: <strong>${escapeHTML(regionName)}</strong>.<br><br>Grazie. Ora descrivimi più nel dettaglio: <strong>qual è il tuo disturbo o sintomo principale?</strong>`);
                    this._updatePlaceholder();
                };

                const knownCityAliases = {
                    "GIOIA TAURO": {
                        comune: "Gioia Tauro",
                        provincia: "Reggio Calabria",
                        provinciaSigla: "RC",
                        regione: "Calabria"
                    }
                };

                const acceptKnownLocation = (location) => {
                    this.userData.zona = location.comune;
                    this.userData.zonaDettagli = {
                        comune: location.comune,
                        provincia: location.provincia,
                        provinciaSigla: location.provinciaSigla,
                        regione: location.regione
                    };
                    this.state = '3_DISTURBO';
                    this.onMessage(`OK: verificata sul territorio: <strong>${escapeHTML(location.comune)}</strong>.<br><br>Grazie. Ora descrivimi più nel dettaglio: <strong>qual è il tuo disturbo o sintomo principale?</strong>`);
                    this._updatePlaceholder();
                };

                // Identifica se l'utente sta descrivendo un sintomo (es. "dolore", "problemi", "comunicazione", "socio")
                const symptomKeywords = ['dolore', 'problema', 'disturbo', 'comunicazione', 'socio', 'paura', 'ansia', 'stress', 'sintomo', 'male'];
                const seemsLikeSymptom = symptomKeywords.some(w => input.toLowerCase().includes(w));

                // Se l'utente digita solo 2 lettere (es. 'RM' o 'rm'), cerchiamo di tradurlo in nome esteso
                if (directProvinceCode) {
                    if (provinceIt[directProvinceCode]) {
                        acceptProvince(directProvinceCode, provinceIt[directProvinceCode]);
                        return;
                    } else if (!seemsLikeSymptom) {
                        this.onMessage(`Errore: La sigla "<strong>${escapeHTML(directProvinceCode)}</strong>" non corrisponde a nessuna provincia italiana valida.`, "system-msg danger");
                        return;
                    }
                }

                if (matchedProvince) {
                    acceptProvince(matchedProvince[0], matchedProvince[1]);
                    return;
                }

                if (matchedRegion) {
                    acceptRegion(matchedRegion);
                    return;
                }

                const knownLocation = knownCityAliases[normalizedZona];
                if (knownLocation) {
                    acceptKnownLocation(knownLocation);
                    return;
                }

                // Se la stringa è molto lunga e contiene parole legate ai sintomi, o se è "salta" o "non so"
                const skipKeywords = ['salta', 'skip', 'niente', 'non so', 'nessuna', 'generale', 'tutta italia', 'italia'];
                const isSkip = skipKeywords.includes(input.toLowerCase().trim());

                if (isSkip) {
                    this.userData.zona = "Italia (Generale)";
                    this.userData.zonaDettagli = {
                        comune: "Italia",
                        provincia: "Italia",
                        regione: "Italia"
                    };
                    this.state = '3_DISTURBO';
                    this.onMessage(`OK: impostata: <strong>Italia (Generale)</strong>.<br><br>Ora descrivimi il tuo disturbo o problema principale.`);
                    this._updatePlaceholder();
                    return;
                }

                if (seemsLikeSymptom && cleanZona.length > 10) {
                    this.onMessage(`Attenzione: Sembra che tu stia descrivendo il tuo disturbo. Per aiutarti a trovare lo specialista più vicino, ho bisogno di conoscere prima il tuo <strong>Comune o Provincia</strong> attuale. <br><br>Se preferisci non specificarlo, rispondi semplicemente con <strong>'ITALIA'</strong>.`, "system-msg danger");
                    return;
                }

                if (!seemsLikeSymptom && (cleanZona.length < 3 || /^\d+$/.test(cleanZona) || /^(.)\1+$/.test(cleanZona))) {
                    this.onMessage("Errore: L'area inserita non sembra valida. Per procedere è necessario inserire una provincia o comune (es. Roma, MI) o scrivi <strong>'Italia'</strong>.", "system-msg danger");
                    return;
                }

                try {
                    const response = await this._fetchWithTimeout(
                        '/api/places',
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                action: 'validateLocation',
                                location: cleanZona
                            })
                        },
                        4500
                    );
                    if (!response.ok) throw new Error(`Location validation failed: ${response.status}`);

                    const data = await response.json();
                    const location = data && data.location;

                    if (data && data.found && location) {
                        const validatedCity = location.comune || cleanZona;
                        const province = location.provincia || validatedCity;
                        const region = location.regione || province;
                        this.userData.zona = validatedCity;
                        this.userData.zonaDettagli = {
                            comune: validatedCity,
                            provincia: province,
                            regione: region
                        };
                        this.state = '3_DISTURBO';
                        this.onMessage(`OK: verificata sul territorio: <strong>${validatedCity}</strong>.<br><br>Grazie. Ora descrivimi più nel dettaglio: <strong>qual è il tuo disturbo o sintomo principale?</strong>`);
                        this._updatePlaceholder();
                    } else {
                        this.onMessage(`Errore: Non siamo riusciti a trovare "<strong>${cleanZona}</strong>" sul territorio italiano. Riprova inserendo un Comune o una Provincia in modo più preciso.`, "system-msg danger");
                        return;
                    }
                } catch (error) {
    // No user input, medical text, recovery codes or raw errors in browser logs.
                    this.onMessage("Attenzione: Non riesco a verificare la località sul territorio italiano in questo momento. Riprova tra poco o scrivi <strong>Italia</strong> per una ricerca nazionale.", "system-msg danger");
                    return;
                }
                break;

            case '3_DISTURBO':
                const cleanDisturbo = input.trim();
                const dtl = cleanDisturbo.toLowerCase();

                // Do not let a generic symptom term validate a non-anatomical target.
                // The user must provide a real body area before clinical triage can start.
                if (/\bfinocchi(?:o|a|i)?\b/i.test(cleanDisturbo)) {
                    this.onMessage("Errore: <strong>finocchio</strong> non indica una parte del corpo. Verifica la sede del dolore e descrivila con un termine anatomico corretto, ad esempio <strong>ginocchio</strong> se intendevi quello.", "system-msg danger");
                    return;
                }

                // 1) Funzione Euristica Anti-Gibberish e Blacklist
                const dHasNoVowels = !/[aeiouy]/.test(dtl);
                const dHasKeyboardPatterns = /(asd|qwe|zxc|fgh|jkl|123)+/.test(dtl);

                // Blacklist di stringhe inappropriate
                const badWordsPattern = /\b(caca\b|cacca|merda|stronz|cazzo\b|cazzi\b|figa\b|puttan|mignot|culo\b|piscia\b|piscio\b|pisciat|fott|scemo\b|scema\b|scemi\b|sceme\b|stupid|idiot|deficent|coglion|bastard|troia\b|troie\b|zoccola\b|zoccole\b|sborr|fifi\b|fuffa\b|blabla|prova\b|test\b|blah|porcod|diocan|diop|porcam|madonn|bestemm|dio c|dio p|dio s|cristo\b)/;
                const hasBadWords = badWordsPattern.test(dtl);

                // Esamina stringhe composite (es: "dolore caca", "dolore asdasd")
                const normalizedWords = dtl
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .split(/[^a-z0-9]+/)
                    .filter(Boolean);
                const hasGibberishWord = normalizedWords.some((word) => {
                    if (/^\d+(?:\d+)?$/.test(word) || word.length <= 2) return false;
                    if (/^(?:bpco|hiv|hcv|tac|rmn|psa|pcr|ves|covid)$/.test(word)) return false;
                    return /^(.)\1{2,}$/.test(word) || (!/[aeiouy]/.test(word) && word.length >= 6);
                });

                if (dtl.length < 3 ||
                    !this._isValidFreeText(cleanDisturbo) ||
                    /^(.)\1+$/.test(dtl) ||
                    (dHasNoVowels && cleanDisturbo.length > 3) ||
                    dHasKeyboardPatterns ||
                    hasBadWords ||
                    hasGibberishWord) {

                    this.onMessage("Errore: La descrizione inserita non è valida, troppo breve o sembra digitata casualmente. Ti prego di descrivere un sintomo reale con parole di senso compiuto.", "system-msg danger");
                    return;
                }

                try {
                    // 2) Whitelist diretta per Supporto Psicologico e Sintomatico Generale (bypassa la validità testuale enciclopedica Wikipedia garantendo l'accesso)
                    const directValidationWhitelist = [
                        // --- Psicologia & Relazioni ---
                        'ansia', 'stress', 'depress', 'panico', 'dialogo', 'parlare', 'sfogo', 'tristezza', 'paura', 'angoscia', 'trauma', 'lutto', 'ossession', 'solitudine', 'mentale', 'psicolog', 'psichiatr', 'umore', 'emozion', 'mente',
                        'partner', 'coppia', 'socio', 'relazione', 'conflitto', 'comunicazione', 'sessual', 'erezi', 'eiacula', 'libido', 'desiderio', 'intimità', 'lavoro', 'genitori', 'figli', 'scuola', 'bullismo', 'autostima', 'personalità', 'fobia', 'attacchi', 'delir', 'allucin', 'pensier', 'comportament', 'terapia', 'psicotera',
                        // --- Sintomi Generali & Branche ---
                        'dolor', 'brucior', 'prurit', 'fastidi', 'febbre', 'tosse', 'macchi', 'neo', 'nevo', 'nei', 'lesion cutanea', 'melanom', 'verruca', 'brufol', 'foruncol', 'orticaria', 'ponfo', 'nausea', 'vomit', 'vertigin', 'capogir', 'debolezz', 'stanch', 'sangue', 'visita', 'mal di', 'male', 'gonfior', 'occhi', 'testa', 'schiena', 'pancia', 'gamba', 'braccio', 'mano', 'piede', 'ginocchi', 'spalla', 'fiato', 'respiro', 'battito', 'formicol', 'udito', 'vista', 'memoria', 'peso', 'diabete', 'tiroid',
                        'ortoped', 'neurol', 'cardiol', 'gastro', 'dermatol', 'ginecol', 'urol', 'androl', 'prostat', 'pene', 'testicol', 'vescica', 'otorino', 'oculist', 'chirurg', 'dentist', 'odontoi', 'endocr', 'diabet', 'pneumo', 'emato', 'infettiv', 'reumatol', 'geriatr', 'dietol', 'nutriz', 'pediatr',
                        // --- Glossario Esteso (A-Z) ---
                        'acufen', 'otite', 'rinite', 'ipoacusia', 'faringite', 'epistassi', 'sinusite', 'disfonia', 'laringite', 'raucedine', 'otalgia', 'labirintite', 'meniere', 'colesteatoma',
                        'miodesopsie', 'mosche volanti', 'fosfeni', 'glaucoma', 'cataratta', 'fotofobia', 'congiuntivite', 'astigmatismo', 'miopia', 'presbiopia', 'maculopatia', 'uveite', 'dacriocistite', 'neurite ottica',
                        'ernia', 'laparocele', 'ascesso', 'biopsia', 'cisti', 'fistola', 'aderenze', 'stomia', 'pneumotorace', 'drenaggio',
                        'carie', 'gengivite', 'parodontite', 'piorrea', 'endodonzia', 'ortodonzia', 'implantologia', 'bruxismo', 'afta', 'tartaro', 'pulpite', 'granuloma',
                        'glicemia', 'insulinoresistenza', 'ipotiroidismo', 'ipertiroidismo', 'polidipsia', 'poliuria', 'tiroidite', 'chetoacidosi', 'irsutismo', 'morbo di basedow', 'cushing', 'addison',
                        'dispnea', 'affanno', 'apnea', 'apnee', 'russamento', 'sonno', 'insonnia', 'dormire', 'addorment', 'risvegli', 'sonnolenza', 'narcolessia', 'emottisi', 'cianosi', 'bpco', 'spirometria', 'saturimetria', 'asma', 'bronchite', 'enfisema', 'bronchiectasia',
                        'anemia', 'leucocitosi', 'piastrinopenia', 'adenopatia', 'linfoadenopatia', 'emocromo', 'talassemia', 'leucemia', 'mieloma', 'emofilia', 'splenomegalia', 'leucopenia', 'mielodisplasia',
                        'sepsi', 'setticemia', 'esantema', 'mialgia', 'gonalgia', 'lombalgia', 'cervicalgia', 'sciatalgia', 'brachialgia', 'algia', 'antigene', 'anticorpo', 'autoimmunit', 'immunosoppressione', 'meningite', 'linfociti',
                        'artrite', 'reumatismi', 'erite', 'lupus', 'raynaud', 'fibromialgia', 'sclerodermia', 'gotta', 'iperuricemia', 'ves', 'pcr', 'proteina c reattiva', 'artropatia', 'vasculite', 'sjogren', 'entesite',
                        'colica renale', 'ematuria', 'oliguria', 'calcolosi', 'nefrolitiasi', 'insufficienza renale', 'dialisi', 'creatininemia', 'proteinuria', 'psa', 'disuria', 'pollachiuria', 'stranguria', 'emospermia', 'piuria', 'anuria', 'varicocele', 'idrocele', 'fimosi',
                        'angina', 'valvulopat', 'aneurisma', 'aterosclerosi', 'sincope', 'edema', 'pericardite', 'endocardite',
                        'paresi', 'paralisi', 'atassia', 'afasia', 'disartria', 'diplopia', 'scotoma', 'neuropatia', 'miastenia', 'tia', 'ictus', 'parkinson', 'alzheimer', 'epilessia',
                        'amenorrea', 'dismenorrea', 'dispareunia', 'vaginismo', 'endometriosi', 'vulvite', 'vaginite',
                        'bmi', 'obesit', 'anoressia', 'disfagia', 'metabolismo', 'celiachia', 'glutine', 'lattosio', 'bulimia', 'lassativi', 'colesterolo', 'ldl', 'hdl', 'glicazione', 'dca', 'binge eating', 'abbuff', 'restrizion', 'restrittiv', 'dismorfismo', 'vomito autoindotto',
                        'scarlattina', 'enuresi', 'bronchiolite', 'morbillo', 'crosta latta', 'bocca-mani-piedi', 'sesta malattia', 'roseola', 'sids', 'apcar', 'neonato', 'bebè'
                    ];
                    const isDirectValid = directValidationWhitelist.some(word => dtl.includes(word));

                    let isValidMedicalTerm = false;
                    let validationUnavailable = false;

                    // La validazione resta server-side: nessun testo sanitario viene inviato a Wikipedia dal client.
                    try {
                        const validation = await this._validateSymptomWithBackend(cleanDisturbo);
                        if (validation.is_possible_emergency) {
                            this.onMessage(`${CLINICAL_URGENCY_WARNING}<br><strong>Motivazione dell'urgenza:</strong> il controllo server-side ha rilevato possibili segnali urgenti nel testo inserito.`, 'system-msg danger clinical-emergency');
                            return;
                        }
                        isValidMedicalTerm = validation.is_medical_request;
                    } catch (validationError) {
                        validationUnavailable = true;
                        isValidMedicalTerm = isDirectValid || this._isValidFreeText(cleanDisturbo);
    // No user input, medical text, recovery codes or raw errors in browser logs.
                    }

                    if (isValidMedicalTerm) {
                        this.userData.disturbo = cleanDisturbo;
                        this.userData.domandeAnamnesticheDinamiche = this._addNoneOptionToQuestions(this._generaDomandeAnamnestiche(cleanDisturbo));
                        this.state = '4_CONOSCITIVE';
                        const validationNotice = validationUnavailable
                            ? "<strong>Nota:</strong> la validazione automatica non è disponibile in questo momento; puoi comunque proseguire con l'orientamento informativo.<br><br>"
                            : "";
                        this.onMessage(`${validationNotice}<strong>Descrizione acquisita.</strong><br><br>Ho preso nota del disturbo riferito. Per comprenderne meglio il contesto, ti porrò ora <strong>3 domande conoscitive.</strong><br><br>1. ${this._formatQuestionWithNoneOption(DOMANDE_CONOSCITIVE[0])}`);
                        this._updatePlaceholder();
                    } else {
                        this.onMessage(`Errore: Il testo "<strong>${cleanDisturbo}</strong>" non sembra descrivere un disturbo riconoscibile. Inserisci un problema reale o una necessità sanitaria concreta (es. "cefalea", "vertigini", "dolore alla schiena") e riprova.`, "system-msg danger");
                        return;
                    }
                } catch (error) {
    // No user input, medical text, recovery codes or raw errors in browser logs.
                    this.onMessage("Attenzione: Non riesco a elaborare la descrizione in questo momento. Riprova tra poco.", "system-msg danger");
                    return;
                }
                break;

            case '4_CONOSCITIVE':
                const cleanConosc = input.trim().toUpperCase();

                // Transizione a Test a Scelta Multipla Chiusa (A, B, C, D) per massima aderenza
                const isValidMCQ = /^[A-D](?:\)|\.| -|:|\s|$)/.test(cleanConosc) || /\b(?:RISPOSTA|OPZIONE|LETTERA|SCELGO|LA)\s+[A-D]\b/.test(cleanConosc);

                if (!isValidMCQ) {
                    this.onMessage("Errore: Risposta non valida. Per proseguire scegli una delle opzioni disponibili: <strong>A, B, C o D</strong>.", "system-msg danger");
                    return;
                }

                this.userData.conoscitiveResp.push(cleanConosc);
                this.currentConoscitiva++;

                if (this.currentConoscitiva < DOMANDE_CONOSCITIVE.length) {
                    this.onMessage(`${this.currentConoscitiva + 1}. ` + this._formatQuestionWithNoneOption(DOMANDE_CONOSCITIVE[this.currentConoscitiva]));
                } else {
                    this.state = '4B_NOTA_CONOSCITIVA_SCELTA';
                    this.onMessage(this._buildAdditionalDetailsPrompt('conoscitiva'));
                    this._updatePlaceholder();
                }
                break;

            case '4B_NOTA_CONOSCITIVA_SCELTA':
                if (this._isAffirmativeChoice(input)) {
                    this._askConoscitivaFreeText();
                    break;
                }
                if (this._isNegativeChoice(input)) {
                    this.userData.notaConoscitiva = "Nessun dettaglio aggiuntivo fornito.";
                    this._startAnamnesisQuestions();
                    break;
                }
                this.onMessage("Errore: scegli <strong>Si</strong> oppure <strong>No</strong> per proseguire.", "system-msg danger");
                break;

            case '4B_NOTA_CONOSCITIVA':
                const notaConosc = input.trim();
                const ncLower = notaConosc.toLowerCase();
                if (ncLower !== 'no' && ncLower !== 'nessuna' && ncLower !== 'nessuno') {
                    // Controlli Anti-gibberish / Blacklist
                    const badWordsPattern = /\\b(caca\\b|cacca|merda|stronz|cazzo\\b|cazzi\\b|figa\\b|puttan|mignot|culo\\b|piscia\\b|piscio\\b|pisciat|fott|scemo\\b|scema\\b|scemi\\b|sceme\\b|stupid|idiot|deficent|coglion|bastard|troia\\b|troie\\b|zoccola\\b|zoccole\\b|sborr|fifi\\b|fuffa\\b|blabla|prova\\b|test\\b|blah|porcod|diocan|diop|porcam|madonn|bestemm|dio c|dio p|dio s|cristo\\b)/;
                    const hasBadWord = badWordsPattern.test(ncLower);

                    const wordsNc = ncLower.split(/\s+/);
                    let hasGibberish = false;
                    for (let w of wordsNc) {
                        if (w.length > 2 && (!/[aeiouy]/.test(w) || /[bcdfghjklmnpqrstvwxz]{4,}/.test(w) || /^(.)\1{2,}$/.test(w))) {
                            hasGibberish = true;
                            break;
                        }
                    }

                    if (hasBadWord || hasGibberish || /^(.)\1+$/.test(ncLower) || !this._isValidFreeText(notaConosc)) {
                        this.onMessage("Errore: Il testo inserito non è valido, troppo breve o contiene termini inappropriati. Inserisci informazioni valide o scrivi 'NO'.", "system-msg danger");
                        return;
                    }
                    this.userData.notaConoscitiva = notaConosc;
                } else {
                    this.userData.notaConoscitiva = "Nessun dettaglio aggiuntivo fornito.";
                }

                this._startAnamnesisQuestions();
                break;

            case '5_ANAMNESTICHE':
                const cleanAnamn = input.trim().toUpperCase();

                // Validazione strutturata: pretendiamo la lettera A, B, C o D
                const isValidChoiceAnam = /^[A-D](?:\)|\.| -|:|\s|$)/.test(cleanAnamn) || /\b(?:RISPOSTA|OPZIONE|LETTERA|SCELGO|LA)\s+[A-D]\b/.test(cleanAnamn);

                if (!isValidChoiceAnam) {
                    this.onMessage("Errore: Formato risposta non riconosciuto. Per essere precisi è necessario rispondere in modo netto con una delle lettere indicate (es. <strong>A, B, C o D</strong>).", "system-msg danger");
                    return;
                }

                this.userData.anamnesticheResp.push(cleanAnamn);
                this.currentAnamnestica++;
                if (this.currentAnamnestica < this.userData.domandeAnamnesticheDinamiche.length) {
                    this.onMessage(`${this.currentAnamnestica + 1}. ` + this.userData.domandeAnamnesticheDinamiche[this.currentAnamnestica]);
                } else {
                    this._prepareConditionalDetailsQueue();
                    this._askNextConditionalDetailOrFinalNote();
                }
                break;

            case '5C_DETTAGLIO_CONDIZIONATO':
                this._handleConditionalDetailInput(input);
                break;

            case '5B_NOTA_ANAMNESTICA_SCELTA':
                if (this._isAffirmativeChoice(input)) {
                    this._askAnamnesticaFreeText();
                    break;
                }
                if (this._isNegativeChoice(input)) {
                    this.userData.notaAnamnestica = "Nessun dettaglio aggiuntivo anamnestico fornito.";
                    this._startScientificResearch();
                    break;
                }
                this.onMessage("Errore: scegli <strong>Si</strong> oppure <strong>No</strong> per proseguire.", "system-msg danger");
                break;

            case '5B_NOTA_ANAMNESTICA':
                const notaAnam = input.trim();
                const naLower = notaAnam.toLowerCase();
                if (naLower !== 'no' && naLower !== 'nessuna' && naLower !== 'nessuno') {
                    // Controlli Anti-gibberish / Blacklist
                    const badWordsPattern = /\\b(caca\\b|cacca|merda|stronz|cazzo\\b|cazzi\\b|figa\\b|puttan|mignot|culo\\b|piscia\\b|piscio\\b|pisciat|fott|scemo\\b|scema\\b|scemi\\b|sceme\\b|stupid|idiot|deficent|coglion|bastard|troia\\b|troie\\b|zoccola\\b|zoccole\\b|sborr|fifi\\b|fuffa\\b|blabla|prova\\b|test\\b|blah|porcod|diocan|diop|porcam|madonn|bestemm|dio c|dio p|dio s|cristo\\b)/;
                    const hasBadWord = badWordsPattern.test(naLower);

                    const wordsNa = naLower.split(/\s+/);
                    let hasGibberish = false;
                    for (let w of wordsNa) {
                        if (w.length > 2 && (!/[aeiouy]/.test(w) || /[bcdfghjklmnpqrstvwxz]{4,}/.test(w) || /^(.)\1{2,}$/.test(w))) {
                            hasGibberish = true;
                            break;
                        }
                    }

                    if (hasBadWord || hasGibberish || /^(.)\1+$/.test(naLower) || !this._isValidFreeText(notaAnam)) {
                        this.onMessage("Errore: Il testo inserito non è valido, troppo breve o contiene termini inappropriati. Inserisci informazioni valide o scrivi 'NO'.", "system-msg danger");
                        return;
                    }
                    this.userData.notaAnamnestica = notaAnam;
                } else {
                    this.userData.notaAnamnestica = "Nessun dettaglio aggiuntivo anamnestico fornito.";
                }

                this._startScientificResearch();
                break;

            case '6_RICERCA_SCIENTIFICA':
                this._startScientificResearch();
                break;

            case '7_FINE':
                break;
            default:
    // No user input, medical text, recovery codes or raw errors in browser logs.
                this.onMessage("Attenzione: Si è verificato un imprevisto nel flusso. Per favore, clicca su 'Nuova Ricerca' per ricominciare.");
        }
    }

    async _eseguiRicercaAI() {
        try {
            let resultObj = this._normalizeGeminiResult(await this._getGeminiConsultation());
            if (this.state !== '6_RICERCA_SCIENTIFICA') return;

            await this._waitForMinimumResearchTime(45000);

            if (this.researchTimeout) clearTimeout(this.researchTimeout);
            if (this.progressInterval) clearInterval(this.progressInterval);

            // Pulizia UI di caricamento
            const boxLoadingDOM = document.getElementById('ai-loading-box');
            if (boxLoadingDOM) boxLoadingDOM.remove();

            // --- GOOGLE PLACES RETRIEVAL ---
            let places = [];
            const searchWarnings = [];
            const userZonaStr = String(this.userData.zona || "").trim();
            try {
                const response = await fetch('/api/places', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        specialista: resultObj.specialista_indicato,
                        comune: this.userData.zonaDettagli?.comune || userZonaStr,
                        provincia: this.userData.zonaDettagli?.provincia || "",
                        regione: this.userData.zonaDettagli?.regione || ""
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    places = data.risultati || [];
                } else {
                    const detail = await response.text();
                    searchWarnings.push(`Places: ${response.status} ${detail}`);
                }
            } catch (e) {
    // No user input, medical text, recovery codes or raw errors in browser logs.
                searchWarnings.push(`Places: ${e instanceof Error ? e.message : String(e)}`);
            }

            const isSameDoctor = (nameA, nameB) => {
                const clean = (name) => {
                    return String(name || "").toLowerCase()
                        .replace(/^(dr\.ssa|dr\.|dr|dott\.ssa|dott\.|dott|dottoressa|prof\.|prof)\b/g, "")
                        .replace(/[^a-z\s]/g, "")
                        .split(/\s+/)
                        .filter(w => w.length > 2);
                };
                const wordsA = clean(nameA);
                const wordsB = clean(nameB);
                if (wordsA.length === 0 || wordsB.length === 0) return false;
                const matchesA = wordsA.every(w => wordsB.includes(w));
                const matchesB = wordsB.every(w => wordsA.includes(w));
                return matchesA || matchesB;
            };

            const curated = this._buildCuratedSearchResults(resultObj.specialista_indicato) || [];
            const isRCOrVibo = userZonaStr.toLowerCase().includes("reggio") || userZonaStr.toLowerCase().includes("vibo");
            const isOrthopedic = resultObj.specialista_indicato && /ortoped|traumatolog/i.test(resultObj.specialista_indicato);

            // Raccogli nomi dei medici indicizzati
            const curatedNames = curated.map(c => c.nome);
            const attendedSpecialistNames = [
                "Dott. Vincenzo Calafiore",
                "Dott. Carmelo Pecora",
                "Dr.ssa Greta Devoli"
            ];
            const isBlockedAttendedSpecialist = (entry) => {
                const name = entry && entry.nome;
                if (!name) return false;
                const isAttended = attendedSpecialistNames.some(attendedName => isSameDoctor(name, attendedName));
                if (!isAttended) return false;
                return !curatedNames.some(curatedName => isSameDoctor(name, curatedName));
            };
            if (isRCOrVibo && isOrthopedic) {
                curatedNames.push("Dott. Vincenzo Calafiore");
            }

            // Filtra duplicati dei medici indicizzati dai risultati di Google Places
            let filteredPlaces = places.filter(p => {
                const isDup = curatedNames.some(cName => isSameDoctor(p.nome, cName));
                return !isDup && !isBlockedAttendedSpecialist(p);
            });

            let finalPlaces = [...filteredPlaces];
            if (finalPlaces.length < 20) {
                for (const c of curated) {
                    if (finalPlaces.length >= 20) break;
                    const isDup = finalPlaces.some(p => isSameDoctor(p.nome, c.nome));
                    if (!isDup) {
                        const nameLower = (c.nome || "").toLowerCase();
                        const isSSN = /ospedale|ospedaliero|ospedaliera|policlinico|asl|asp|usl|ssn|presidio|asst|ats|a.o.|a.o.u.|pubblic|sanitaria locale|sanitario locale|istituto|iomi|clinica|casa di cura|irccs|fondazione|don calabria|humanitas|auxologico|galeazzi|rizzoli|sacco|niguarda|fatebenefratelli|gemelli|umberto i|san raffaele|careggi|spallanzani|sant'orsola|cardarelli|monaldi|cotugno/i.test(nameLower);
                        c.tipo = c.tipo || (isSSN ? "SSN" : "Privato");
                        c.info = c.info || (isSSN ? "Struttura o specialista operante in regime SSN (pubblico o convenzionato)." : "Specialista o struttura sanitaria privata in regime di libera professione.");
                        finalPlaces.push(c);
                    }
                }
            }

            if (finalPlaces.length < 20) {
                try {
                    const fallbackPlaces = await this._getSpecialistSearchResults(resultObj.specialista_indicato);
                    const nationalFallback = fallbackPlaces.filter((place) =>
                        String(place.search_scope || "").toLowerCase().includes("nazional")
                    );
                    const otherFallback = fallbackPlaces.filter((place) =>
                        !String(place.search_scope || "").toLowerCase().includes("nazional")
                    );
                    for (const fallbackPlace of [...nationalFallback, ...otherFallback]) {
                        if (finalPlaces.length >= 20) break;
                        const isDup = finalPlaces.some(p => isSameDoctor(p.nome, fallbackPlace.nome));
                        if (!isDup && !isBlockedAttendedSpecialist(fallbackPlace)) finalPlaces.push(fallbackPlace);
                    }
                } catch (fallbackError) {
    // No user input, medical text, recovery codes or raw errors in browser logs.
                    searchWarnings.push(`Specialist search: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
                }
            }
            finalPlaces = finalPlaces.slice(0, 20);
            resultObj.risultati = finalPlaces;

            // Pulisci i nomi dei medici specialisti e sposta la specializzazione estesa in "info"
            const prefixRegex = /\b(dottoressa|professoressa|dott\.ssa|dr\.ssa|dottore|dott\.|dr\.|prof\.|dott\b|dr\b|prof\b)/i;
            const stopWords = /^(ortopedico|ortopedica|ortopedia|specialista|specializzazione|chirurgo|chirurgia|oculista|oftalmologo|oftalmologia|cardiologo|cardiologia|ginecologo|ginecologia|ostetrico|ostetricia|pediatra|pediatria|neurologo|neurologia|neurochirurgo|neurochirurgia|psicologo|psicologa|psicoterapeuta|psicoterapia|psichiatra|psichiatria|medico|medicina|dermatologo|dermatologia|urologo|urologia|fisioterapista|fisioterapia|fisiatra|fisiatria|reumatologo|reumatologia|endocrinologo|endocrinologia|gastroenterologo|gastroenterologia|otorino|otorinolaringoiatra|otorinolaringoiatria|allergologo|allergologia|nutrizionista|dietista|dentista|odontoiatra|odontoiatria|senologo|senologia|oncologo|oncologia|pneumologo|pneumologia|angiologo|angiologia|logopedista|logopedia|podologo|podologia|terapista|terapia|dottore|dottoressa|studio|clinica|poliambulatorio|ambulatorio|centro|istituto|ospedale|in|per|della|dello|del|dei|degli|di|da|con|e|ed|a|colonna|protesi|robotica|mininvasiva|spalla|ginocchio|anca|mano|piede|schiena|articolazioni|cuore|vasi|pelle|cervello|nervi)\b/i;

            resultObj.risultati.forEach(r => {
                if (!r.specializzazione) {
                    r.specializzazione = resultObj.specialista_indicato;
                }

                if (prefixRegex.test(r.nome)) {
                    const matchPrefix = r.nome.match(prefixRegex);
                    if (matchPrefix) {
                        const prefix = matchPrefix[0];
                        const idx = r.nome.indexOf(prefix);
                        const before = r.nome.slice(0, idx).trim();
                        const rest = r.nome.slice(idx + prefix.length).trim();

                        const tokens = rest.split(/\s+/);
                        const nameParts = [];
                        let extraParts = [];

                        for (let i = 0; i < tokens.length; i++) {
                            const token = tokens[i];
                            const cleanToken = token.replace(/[^a-zA-Z]/g, '');
                            const nextToken = tokens[i + 1] || "";
                            const cleanNextToken = nextToken.replace(/[^a-zA-Z]/g, '');
                            if (!cleanToken && /^[---|,]+$/.test(token) && /^[A-Z]/.test(cleanNextToken)) {
                                continue;
                            }
                            if (stopWords.test(cleanToken) || (!/^[A-Z]/.test(token) && !/^(di|de|da|del|della|d')$/i.test(token))) {
                                extraParts = tokens.slice(i);
                                break;
                            }
                            nameParts.push(token);
                        }

                        if (nameParts.length > 0) {
                            const cleanName = `${prefix.trim()} ${nameParts.join(" ")}`.trim();
                            const extraText = extraParts.join(" ").replace(/^[-,\s|]+/, "").trim();

                            r.nome = cleanName;

                            // Unisci testo prima (es. Studio Ortopedico) e dopo per le info
                            const cleanBefore = before.replace(/^[-,\s|]+/, "").replace(/[-,\s|]+$/, "").trim();
                            let combinedExtra = "";
                            if (cleanBefore && extraText) {
                                combinedExtra = `${cleanBefore} | ${extraText}`;
                            } else {
                                combinedExtra = cleanBefore || extraText;
                            }

                            if (combinedExtra) {
                                r.info = r.info ? `${r.info} | ${combinedExtra}` : combinedExtra;
                            }
                        }
                    }
                }
            });

            resultObj.risultati = resultObj.risultati.filter(r => this._isDisplayableResultName(r.nome));
            resultObj.risultati = resultObj.risultati.filter(r => !isBlockedAttendedSpecialist(r));

            const priorityCurated = this._buildCuratedSearchResults(resultObj.specialista_indicato);
            priorityCurated.forEach((curatedEntry) => {
                resultObj.risultati = resultObj.risultati.filter(r => !isSameDoctor(r.nome, curatedEntry.nome));
            });
            resultObj.risultati = resultObj.risultati.filter(r => this._isDisplayableResultName(r.nome));
            // Mantiene le schede curate pertinenti entro le 20 senza trasformarle in un ranking clinico.
            resultObj.risultati = this._includeCuratedResults(resultObj.risultati, priorityCurated, isSameDoctor);

            // Mostriamo i risultati
            let outInitial = `
            <div id="printable-area" data-testid="aiutodoc-output">
            <div id="medical-disclaimer-start" data-testid="medical-disclaimer" class="result-start" style="background: var(--danger-bg); border: 1px solid #fecaca; color: var(--danger); padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; font-weight: 500;">
              Attenzione: ${escapeHTML(DISCLAIMER)}
            </div>

            <div class="result-card-main" style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); margin-bottom: 25px;">
                <h3 style="color: var(--primary); margin-top: 0; display: flex; align-items: center; gap: 8px;">
                    Sintesi Anamnestica
                </h3>
                <p style="line-height: 1.6; color: #4a5568;">${escapeHTML(resultObj.sintesi_anamnestica)}</p>
                <div data-testid="red-flags-output" style="line-height: 1.6; color: #4a5568;">
                    <strong>Segnali rilevanti da riferire al medico:</strong>
                    ${resultObj.red_flags_rilevate.length
                        ? `<ul>${resultObj.red_flags_rilevate.map((flag) => `<li>${escapeHTML(flag)}</li>`).join("")}</ul>`
                        : "<span> Nessuno esplicitamente rilevato nell'output.</span>"}
                </div>

                <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 20px 0;">

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div style="background: #f0f7f7; padding: 15px; border-radius: 10px;">
                        <span style="display: flex; align-items: center; gap: 5px; font-size: 0.8rem; text-transform: uppercase; color: #0F5464; font-weight: bold; margin-bottom: 5px;">
                            SPECIALISTA CONSIGLIATO
                        </span>
                        <strong data-testid="specialist-output" style="font-size: 1.1rem; color: #2d3748;">${escapeHTML(resultObj.specialista_indicato)}</strong>
                        <span data-testid="specialization-area-output" hidden>${escapeHTML(JSON.stringify(resultObj.area_specialistica_piu_adatta))}</span>
                        ${buildSpecialtyEvidenceHTML(resultObj.specialista_indicato, this.userData.disturbo)}
                    </div>
                    <div style="background: #fff9e6; padding: 15px; border-radius: 10px;">
                        <span style="display: flex; align-items: center; gap: 5px; font-size: 0.8rem; text-transform: uppercase; color: #d48806; font-weight: bold; margin-bottom: 5px;">
                            GUIDA AL COMPORTAMENTO
                        </span>
                        <p data-testid="urgency-output" style="margin: 0; font-size: 0.9rem; color: #2d3748;">${escapeHTML(resultObj.livello_urgenza)}<br>${escapeHTML(resultObj.preparazione_visita)}</p>
                    </div>
                </div>

                <div style="margin-top: 20px; background: #fef2f2; padding: 15px; border-radius: 10px; border: 1px dashed #f87171;">
                    <span style="display: flex; align-items: center; gap: 5px; font-size: 0.8rem; text-transform: uppercase; color: #b91c1c; font-weight: bold; margin-bottom: 5px;">
                        PROPOSTA DI DICITURA PER L'IMPEGNATIVA (DA VALUTARE CON IL MMG)
                    </span>
                    <p style="margin: 0 0 8px; color: #374151;">Il medico curante decide se usarla e come formularla.</p>
                    <p style="margin: 0; font-style: italic; color: #374151;">"${escapeHTML(resultObj.impegnativa_medico)}"</p>
                </div>
            </div>
            `;

            const pendingTriage = this._saveTriageResult(resultObj, 'api', { deferUntilRegistration: true });

            // Memorizza i dati correnti per riferimento sessione
            window._currentTriageData = {
                ...this.userData,
                id: null,
                date: pendingTriage.date,
                result: resultObj
            };

            let out = outInitial +
            this._buildRegistrationGate(pendingTriage) +
            `<p class="ai-final-notice">${escapeHTML(AI_FINAL_NOTICE)}</p>` +
            `<p class="ai-final-notice"><strong>Specialisti e strutture individuati:</strong> i dati mostrati derivano da schede pubbliche disponibili al momento della ricerca. L’ordine non indica qualita clinica o una raccomandazione; le schede del catalogo sono aggiunte in coda.</p>`;

            let resultsHTML = "";
            const seenNames = new Set();
            resultObj.risultati.forEach(r => {
                const nameKey = String(r.nome || "").trim().toLowerCase();
                if (!seenNames.has(nameKey)) {
                    seenNames.add(nameKey);
                    resultsHTML += this._buildCard(r);
                }
            });
            if (!resultsHTML) {
                const searchConfigMissing = searchWarnings.some((warning) =>
                    /CONFIG_MISSING|non configurat|Chiave Google API|GOOGLE_PLACES_CONFIG_MISSING|GOOGLE_SEARCH_CONFIG_MISSING/i.test(warning)
                );
                resultsHTML = `
                <div class="triage-result">
                  <div class="triage-result-header">
                    ${searchConfigMissing ? "Ricerca specialisti non configurata" : "Nessuna scheda specialistica disponibile"} <span class="tag-badge">Ricerca</span>
                  </div>
                  <div class="triage-result-body">
                    ${searchConfigMissing
                        ? `<p>Il motore di ricerca degli specialisti non è configurato in questo ambiente. L’orientamento è disponibile; la ricerca delle schede pubbliche richiede l’attivazione dei servizi.</p>
                           <p>Riprovare non risolve finché la configurazione non è completata. Puoi rivolgerti al tuo medico curante.</p>`
                        : `<p>Non sono state trovate schede pubbliche verificabili per questa combinazione di specialista e zona al momento della ricerca.</p>
                           <p>Puoi riprovare ampliando la zona geografica, ad esempio indicando la Provincia, la Regione o Italia.</p>`}
                  </div>
                </div>`;
            }
            out += resultsHTML + `</div>` + buildNewSearchActionsHTML();
            this.onMessage(out);

            trackEvent('specialist_search_result_shown', {
                results_count: resultObj.risultati.length
            });

            this.state = '7_FINE';
            this._updatePlaceholder();
            trackEvent('triage_completed', {
                method: 'api',
                results_count: resultObj.risultati.length,
                recovery_code_offered: true
            });

        } catch (err) {
    // No user input, medical text, recovery codes or raw errors in browser logs.
            if (this.researchTimeout) clearTimeout(this.researchTimeout);
            if (this.progressInterval) clearInterval(this.progressInterval);
            const errDetail = err && err.message ? err.message : String(err);
    // No user input, medical text, recovery codes or raw errors in browser logs.
            const messages = {
                BETA_EXTERNAL_DISABLED: 'I servizi di orientamento non sono ancora attivi in questo ambiente. Riprovare non risolve: occorre completarne l’attivazione.',
                BETA_CONFIG_REQUIRED: 'L’orientamento non è ancora configurato in questo ambiente. Riprovare non risolve: occorre completare la configurazione.',
                CONSENT_REQUIRED: 'Conferma nuovamente il consenso e avvia una nuova ricerca.'
            };
            this._showResearchFailure(messages[err.code] || 'Il servizio non ha completato la ricerca. Puoi avviare una nuova ricerca; per assistenza sanitaria rivolgiti al medico.');
        }
    }

    _waitForMinimumResearchTime(durationMs) {
        const startedAt = this.searchStartedAt || Date.now();
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(durationMs - elapsed, 0);
        return new Promise((resolve) => setTimeout(resolve, remaining));
    }

    _showResearchFailure(message) {
        if (this.state !== '6_RICERCA_SCIENTIFICA') return;
        if (this.researchTimeout) clearTimeout(this.researchTimeout);
        if (this.progressInterval) clearInterval(this.progressInterval);

        const boxLoadingDOM = document.getElementById('ai-loading-box');
        if (boxLoadingDOM) boxLoadingDOM.remove();

        const chatInputBar = document.querySelector('.chat-input-area');
        if (chatInputBar) chatInputBar.style.display = '';

        this.state = '7_ERRORE';
        this._updatePlaceholder();
        this.onMessage(`
            <div class="system-msg danger">
                <strong>Ricerca non completata.</strong><br><br>
                ${escapeHTML(message)}
            </div>
        ` + buildNewSearchActionsHTML(), "system-msg danger");
    }

    _curatedContextText() {
        const details = this.userData.zonaDettagli || {};
        return [
            this.userData.zona,
            details.comune,
            details.provincia,
            details.provinciaSigla,
            details.regione,
            this.userData.disturbo
        ].filter(Boolean).join(" ").toLowerCase();
    }

    _isOrthopedicTraumaContext(specialista) {
        const text = [
            specialista,
            this.userData.disturbo,
            ...(this.userData.conoscitiveResp || []),
            ...(this.userData.anamnesticheResp || [])
        ].filter(Boolean).join(" ").toLowerCase();
        return /ortoped|traumatolog|ginocch|spalla|anca|menisc|legament|crociat|cuffia|achille|tendin|frattur|distorsion|articolazion|osso|ossa/.test(text);
    }

    _buildCuratedSearchResults(specialista) {
        const spec = String(specialista || "medico specialista").trim();
        const specLower = spec.toLowerCase();
        const contextLower = this._curatedContextText();
        const results = [];

        const add = (entry) => {
            const key = `${entry.nome}|${entry.indirizzo_modalita}`.toLowerCase();
            if (!results.some((item) => `${item.nome}|${item.indirizzo_modalita}`.toLowerCase() === key)) {
                results.push(entry);
            }
        };

        if (specLower.includes("psicolog") || specLower.includes("psicotera")) {
            add({
                nome: "Dr.ssa Greta Devoli",
                specializzazione: "Psicologa ad orientamento Sistemico-Relazionale",
                tipo: "Privato",
                indirizzo_modalita: "Online in tutta Italia",
                contatti: "3479847838 | gretadevoli@gmail.com",
                fonte: "Scheda curata",
                info: "Disponibile online a livello nazionale per le specialità e sotto-specialità indicate."
            });
        }

        const isReggioOrVibo = /\b(reggio|rc|vibo|vv|villa san giovanni|palmi|gioia tauro)\b/i.test(contextLower);
        if (this._isOrthopedicTraumaContext(specLower) && isReggioOrVibo) {
            add({
                nome: "Dott. Vincenzo Calafiore",
                specializzazione: "Ortopedico (Chirurgia Anca, Ginocchio, Spalla)",
                tipo: "Privato",
                indirizzo_modalita: "IOMI (RC) | Studio Torrione (RC) | Centro Gima (VV)",
                contatti: "3294255444 | Dottorecalafiore@libero.it",
                fonte: "Scheda curata",
                info: "Chirurgo specializzato in ricostruzione cuffia, Achille, crociato e lesioni meniscali."
            });
        }

        if (specLower.includes("neurochir") && /\b(messina|milazzo|reggio|rc|villa)\b/i.test(contextLower)) {
            add({
                nome: "Dott. Carmelo Pecora",
                specializzazione: "Neurochirurgo",
                tipo: "Privato",
                indirizzo_modalita: "Messina | Milazzo | Reggio Calabria",
                contatti: "3339690197 | carmelopecora77@gmail.com",
                fonte: "Scheda curata",
                info: "Specialista in regime di libera professione."
            });
        }

        return results;
    }

    _includeCuratedResults(results, curated, isSameDoctor) {
        const applicable = Array.isArray(curated) ? curated : [];
        const visible = (Array.isArray(results) ? results : []).filter((result) =>
            !applicable.some((entry) => isSameDoctor(result.nome, entry.nome))
        );
        const availableSlots = Math.max(0, 20 - applicable.length);
        // Le schede curate pertinenti compaiono entro le prime cinque senza indicare qualità clinica.
        const beforeCurated = visible.slice(0, Math.min(4, availableSlots));
        const afterCurated = visible.slice(beforeCurated.length, availableSlots);
        return [...beforeCurated, ...applicable, ...afterCurated];
    }

    async _getSpecialistSearchResults(specialista) {
        const API_URL = (typeof CONFIG !== 'undefined' && CONFIG.SPECIALIST_SEARCH_API_URL)
            ? CONFIG.SPECIALIST_SEARCH_API_URL
            : "/api/specialist-search";
        const fallbackApiUrl = "/api/places";

        if (window.location.protocol === 'file:' && API_URL.startsWith('/')) {
            throw new Error("La ricerca reale richiede un server locale o un deploy serverless.");
        }

        const details = this.userData.zonaDettagli || {};
        const requestBody = JSON.stringify({
            specialista,
            disturbo: this.userData.disturbo,
            zona: this.userData.zona,
            comune: details.comune || this.userData.zona,
            provincia: details.provincia || this.userData.zona,
            regione: details.regione || this.userData.zona
        });
        const endpoints = API_URL === fallbackApiUrl ? [API_URL] : [API_URL, fallbackApiUrl];
        let data = null;
        let lastError = null;

        for (const endpoint of endpoints) {
            const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
                body: requestBody
            });

            if (response.ok) {
                data = await response.json();
                break;
            }

            lastError = `Specialist Search Error (${response.status}): ${await response.text()}`;
        }

        if (!data) throw new Error(lastError || "Ricerca specialisti non disponibile.");
        const curated = this._buildCuratedSearchResults(specialista);
        const webResults = Array.isArray(data.results) ? data.results : (Array.isArray(data.risultati) ? data.risultati : []);
        const cleanSpec = String(specialista || "medico specialista")
            .replace(/\s*\/\s*/g, " ")
            .replace(/\bmedico\b/gi, "")
            .replace(/\s+/g, " ")
            .trim() || "medico specialista";

        const merged = [];
        const seen = new Set();
        [...curated, ...webResults].forEach((entry) => {
            const key = String(entry.url || `${entry.nome}|${entry.indirizzo_modalita}`).trim().toLowerCase();
            if (!key || seen.has(key)) return;
            seen.add(key);
            merged.push({
                nome: entry.nome || "Risultato Google verificabile",
                specializzazione: entry.specializzazione || cleanSpec,
                tipo: entry.tipo || "Google",
                indirizzo_modalita: entry.indirizzo_modalita || this.userData.zona,
                telefono: entry.telefono || "",
                email: entry.email || "",
                contatti: entry.contatti || "Verifica recapiti sulla fonte ufficiale.",
                fonte: entry.fonte || "Google",
                info: entry.info || "Risultato reale individuato in rete.",
                url: entry.url || ""
            });
        });

        if (!merged.length) {
            throw new Error("La ricerca reale non ha restituito risultati verificabili.");
        }

        return merged.slice(0, 20);
    }

    async _getGeminiConsultation() {
        const API_URL = (typeof CONFIG !== 'undefined' && CONFIG.GEMINI_API_URL)
            ? CONFIG.GEMINI_API_URL
            : "/api/gemini";

        if (!API_URL) {
            throw new Error("Endpoint Gemini non configurato. Imposta CONFIG.GEMINI_API_URL.");
        }

        if (window.location.protocol === 'file:' && API_URL.startsWith('/')) {
            throw new Error("Il proxy Gemini richiede un server locale o un deploy serverless: non usare il solo file index.html aperto da disco.");
        }

        try {
            const userData = { ...this.userData, domandeConoscitive: DOMANDE_CONOSCITIVE.map(q => this._formatQuestionWithNoneOption(q)), domandeAnamnestiche: this.userData.domandeAnamnesticheDinamiche || [] };

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'orientation', userData })
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                const error = new Error('Orientamento non disponibile.');
                error.code = payload.code;
                throw error;
            }

            const data = await response.json();

            if (!data || !data.result) {
                throw new Error("Il proxy Gemini non ha restituito un risultato valido.");
            }

            return data.result;
        } catch (err) {
    // No user input, medical text, recovery codes or raw errors in browser logs.
            throw err;
        }
    }

    _isDisplayableResultName(name) {
        const value = String(name || "").trim();
        if (!value) return false;

        const doctorPrefix = /^(?:Dott\.ssa|Dott\.|Dr\.ssa|Dr\.|Prof\.ssa|Prof\.|Dottore|Dottoressa|Dott|Dr|Prof)(?=\s|$)/i;
        const genericDoctorTerms = /^(specialisti?|medici?|dottori?|ortopedico|ortopedica|ortopedia|cardiologo|cardiologa|cardiologia|neurologo|neurologa|neurologia|chirurgo|chirurga|chirurgia|psicologo|psicologa|psicologia|dermatologo|dermatologa|dermatologia|urologo|urologa|urologia|ginecologo|ginecologa|ginecologia|pediatra|pediatria|studio|centro|clinica|ambulatorio|poliambulatorio)$/i;
        const facilityTerms = /\b(ospedale|policlinico|clinica|casa di cura|centro medico|centro specialistico|istituto|irccs|fondazione|ambulatorio|poliambulatorio|asl|asp|asst|presidio)\b/i;

        if (doctorPrefix.test(value)) {
            const tokens = value
                .replace(doctorPrefix, "")
                .replace(/[^A-Za-zÀ-ÿ'’\-\s]/g, " ")
                .split(/\s+/)
                .filter(Boolean)
                .filter((token) => !/^(di|de|del|della|da|d'|de')$/i.test(token));

            const firstGenericIndex = tokens.findIndex((token) => genericDoctorTerms.test(token));
            const nameTokens = firstGenericIndex >= 0 ? tokens.slice(0, firstGenericIndex) : tokens;
            return nameTokens.length >= 2;
        }

        if (/^(?:dottori|medici|specialisti)(?:\b|$)/i.test(value)) return false;
        if (/\b(?:prenota|migliori|elenco|lista|trova|cerca|visita specialistica)\b/i.test(value)) return false;

        return facilityTerms.test(value) && value.replace(/[^A-Za-zÀ-ÿ\s]/g, " ").trim().split(/\s+/).filter(Boolean).length >= 2;
    }

    _normalizeDisplayResultName(name) {
        const value = String(name || "").trim();
        const doctorPrefix = /^(Dott\.ssa|Dott\.|Dr\.ssa|Dr\.|Prof\.ssa|Prof\.|Dottore|Dottoressa|Dott|Dr|Prof)(?=\s|$)/i;
        const genericDoctorTerms = /^(specialisti?|medici?|dottori?|ortopedico|ortopedica|ortopedia|cardiologo|cardiologa|cardiologia|neurologo|neurologa|neurologia|chirurgo|chirurga|chirurgia|psicologo|psicologa|psicologia|dermatologo|dermatologa|dermatologia|urologo|urologa|urologia|ginecologo|ginecologa|ginecologia|pediatra|pediatria|studio|centro|clinica|ambulatorio|poliambulatorio)$/i;
        const prefixMatch = value.match(doctorPrefix);
        if (!prefixMatch) return value;

        const tokens = value
            .replace(doctorPrefix, "")
            .replace(/[^A-Za-zÀ-ÿ'’\-\s]/g, " ")
            .split(/\s+/)
            .filter(Boolean);
        const firstGenericIndex = tokens.findIndex((token) => genericDoctorTerms.test(token));
        const nameTokens = firstGenericIndex >= 0 ? tokens.slice(0, firstGenericIndex) : tokens;
        return `${prefixMatch[1]} ${nameTokens.join(" ")}`.trim();
    }

    _buildCard(resultOrName, spec = "", tipo = "", ind = "", contatti = "", prenotazione = "", det = "") {
        const result = typeof resultOrName === "object" && resultOrName !== null
            ? resultOrName
            : {
                nome: resultOrName,
                specializzazione: spec,
                tipo,
                indirizzo_modalita: ind,
                contatti,
                info: det
            };
        const resultName = this._normalizeDisplayResultName(result.nome || "Specialista o struttura sanitaria");
        if (!this._isDisplayableResultName(resultName)) return "";

        const resultSpec = String(result.specializzazione || spec || "Specialista").trim();
        const resultType = String(result.tipo || tipo || "Risultato").trim();
        const resultAddress = String(result.indirizzo_modalita || "Indirizzo non disponibile nella scheda pubblica").trim();
        const resultPhone = String(result.telefono || "").trim();
        const resultEmail = String(result.email || "").trim();
        const resultContacts = String(result.contatti || "").trim();
        const resultInfo = String(result.info || "").trim();

        const phoneLine = resultPhone
            ? resultPhone
            : (resultContacts.match(/Telefono:\s*([^|]+)/i)?.[1] || "Non disponibile nella scheda pubblica").trim();
        const emailLine = resultEmail
            ? resultEmail
            : (resultContacts.match(/Email:\s*([^|]+)/i)?.[1] || "Non disponibile nella scheda pubblica").trim();
        const detailsHTML = resultInfo && !/risultato individuato tramite ricerca|serpapi|google custom search/i.test(resultInfo)
            ? `<p><strong>Dettagli:</strong> ${escapeHTML(resultInfo)}</p>`
            : "";

        return `
    <div class="triage-result">
      <div class="triage-result-header">
        ${escapeHTML(resultName)} <span class="tag-badge">${escapeHTML(resultType)}</span>
      </div>
      <div class="triage-result-body">
        <p><strong>Specializzazione:</strong> ${escapeHTML(resultSpec)}</p>
        <p><strong>Indirizzo/Modalità:</strong> ${escapeHTML(resultAddress)}</p>
        <p><strong>Contatti:</strong> ${escapeHTML(resultContacts)}</p>
        <p><strong>Info:</strong> ${escapeHTML(resultInfo)}</p>
      </div>
    </div>`;
    }
}


for (const Rules of [BetaClinicalRules, BetaQuestionnaireRules]) {
    for (const name of Object.getOwnPropertyNames(Rules.prototype)) {
        if (name !== "constructor") Object.defineProperty(TriageEngine.prototype, name, Object.getOwnPropertyDescriptor(Rules.prototype, name));
    }
}
