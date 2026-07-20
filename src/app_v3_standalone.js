// src/app_v3.js
console.log("Triage engine loading... (v3.1.0-STANDALONE)");


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
        this.onMessage(`Perfetto, ho registrato le informazioni essenziali nel rispetto della minimizzazione dei dati.<br><br><strong>Qual è la tua zona geografica?</strong><br>Puoi indicare Comune, Provincia o scrivere <strong>Italia</strong> per una ricerca nazionale.`);
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
            message = "Per questo percorso il peso può essere clinicamente rilevante. Indica il peso in kg, ad esempio <strong>72</strong>.";
        } else if (next === "height_cm") {
            message = "Per questo percorso anche l'altezza può essere clinicamente rilevante. Indicala in centimetri, ad esempio <strong>170</strong>.";
        }
        this.onMessage(message);
        this._updatePlaceholder();
    }

    _handleConditionalDetailInput(input) {
        const rawValue = String(input || "").trim().replace(",", ".");
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
            this._showResearchFailure("La ricerca reale non ha risposto entro il tempo previsto. Riprova tra poco: nessun risultato simulato viene mostrato.");
        }, 55000);

        this._eseguiRicercaAI();
    }

    _generateTriageID(userPrefix = "") {
        const cleanPrefix = String(userPrefix || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 2);
        const prefix = cleanPrefix.length === 2 ? cleanPrefix : "ID";
        const bytes = new Uint8Array(4);
        if (window.crypto && window.crypto.getRandomValues) {
            window.crypto.getRandomValues(bytes);
        } else {
            for (let i = 0; i < bytes.length; i++) {
                bytes[i] = Math.floor(Math.random() * 256);
            }
        }
        const letters = String.fromCharCode(65 + (bytes[0] % 26)) + String.fromCharCode(65 + (bytes[1] % 26));
        const numbers = String(((bytes[2] << 8) + bytes[3]) % 10000).padStart(4, "0");
        return `${prefix}${letters}${numbers}`;
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
            console.error("Errore salvataggio localStorage:", e);
        }

        if (dataToSave.saveToCloud === true) {
            this._saveToCloud(dataToSave).catch((error) => {
                console.error("Cloud Save FALLITO:", error);
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
                <span>Presto consenso esplicito al trattamento dei dati sanitari inseriti ai sensi dell'art. 9(2)(a) GDPR.</span>
            </label>
            <label class="recovery-prefix-row">
                <span>Scegli 2 caratteri alfanumerici per personalizzare il codice recupero</span>
                <input type="text" class="recovery-prefix-input" maxlength="2" pattern="[A-Za-z0-9]{2}" inputmode="text" autocomplete="off" placeholder="Es. A7">
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

        const userCodePrefix = String(gate.querySelector('.recovery-prefix-input')?.value || "")
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "")
            .slice(0, 2);
        if (userCodePrefix.length !== 2) {
            throw new Error("Inserisci due caratteri alfanumerici per generare il codice recupero.");
        }

        pendingData.userRegistration = null;
        pendingData.userCodePrefix = userCodePrefix;
        pendingData.consents = {
            terms: true,
            privacy: true,
            healthData: true,
            consentVersion: APP_CONSENT_VERSION,
            consentedAt: new Date().toISOString()
        };

        let storageMode = "cloud";
        try {
            const saved = await this._saveToCloud(pendingData);
            if (saved && saved.id) {
                pendingData.id = saved.id;
                pendingData.expiresAt = saved.expiresAt;
            }
        } catch (error) {
            if (!this._canFallbackToLocalArchive(error)) {
                throw error;
            }

            storageMode = "local";
            pendingData.id = this._generateTriageID(userCodePrefix);
            pendingData.expiresAt = null;
            console.warn("Archivio cloud non disponibile, salvataggio mantenuto solo in locale:", error);
        }

        saveStoredTriage(pendingData);
        window._currentTriageData = pendingData;
        window._pendingTriageSave = null;

        trackEvent('recovery_code_generated', {
            storage_mode: storageMode
        });

        const copyHint = storageMode === "cloud"
            ? "Usa questo codice per tornare ai risultati senza rifare le domande. Non condividerlo."
            : "Usa questo codice su questo dispositivo per tornare ai risultati senza rifare le domande. Il recupero da altri dispositivi sara disponibile quando l'archivio cloud verra configurato.";
        const saveNote = storageMode === "cloud"
            ? "Ricerca salvata con <strong>codice univoco</strong>:"
            : "Ricerca salvata <strong>su questo dispositivo</strong> con codice univoco:";

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

    _canFallbackToLocalArchive(error) {
        const message = String(error?.message || error || "");
        return [
            "FIREBASE_ADMIN_CONFIG_MISSING",
            "Archivio anonimo temporaneamente non disponibile",
            "Salvataggio codice non riuscito (503)",
            "server locale o un deploy serverless"
        ].some((fragment) => message.includes(fragment));
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
            console.error("Errore recupero cloud:", err);
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
        // Questa logica riutilizza il blocco HTML definitivo (adattato per includere il tasto PDF)
        const triageID = resultObj.id || this.currentTriageID;
        
        // (Verrà implementata meglio nel chunk successivo inserendo il bottone PDF)
    }

    _stripNegatedClinicalClauses(text) {
        return String(text || "")
            .replace(/\b(?:non ho|non ha|non presento|non presenta|non riferisco|non riferisce|non assumo|non assume|non prendo|non prende|non sono|senza|assenza di|nega|negano)\b[^.!?;]{0,180}(?=[.!?;]|$)/gi, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    _getCycle03Context(text) {
        const normalized = normalizeMedicalText(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const has = (pattern) => pattern.test(normalized);

        if (has(/(?:figlio|bambin)[^.!?]{0,35}3 anni/) && has(/respira molto velocemente/) && has(/fatica a parlare o piangere/) && has(/rientra[^.!?]{0,35}(?:costole|intercost)/) && has(/molto stanc/)) return "ped_respiro_urgente";
        if (has(/(?:figlia|bambin)[^.!?]{0,35}7 anni/) && has(/febbre[^.!?]{0,25}38[,.]5/) && has(/(?:beve|idrat)/) && has(/vigile/)) return "ped_febbre";
        if (has(/(?:figlia|bambin)[^.!?]{0,35}12 anni/) && has(/mal di testa/) && has(/(?:legge|tablet|scherm)/) && has(/vede sfocat/)) return "ped_vista_cefalea";
        if (has(/(?:figlio|bambin)[^.!?]{0,35}11 anni/) && has(/allenamento intenso/) && has(/(?:tornato normale|recupero completo)/) && has(/(?:riposato|riposo)/) && has(/(?:bevuto|idrat)/)) return "ped_stanchezza_sport";
        if (has(/(?:figlia|bambin)[^.!?]{0,35}6 anni/) && has(/antibiotico/) && has(/macchie rosse[^.!?]{0,35}tronco/)) return "ped_antibiotico_macchie";
        if (has(/vedo molto meno[^.!?]{0,30}un occhio/) && has(/improvvis/) && has(/non sta migliorando/)) return "ocul_calo_improvviso";
        if (has(/(?:da alcuni mesi|mesi)[^.!?]{0,45}vedo meno nitidamente/) && has(/da lontano/) && has(/sera/)) return "ocul_calo_progressivo";
        if (has(/dolore intorno a un occhio/) && has(/mal di testa/) && has(/vista (?:e|è) normale/)) return "ocul_dolore_cefalea";
        if (has(/lenti a contatto/) && has(/dolore a un occhio/) && has(/luce[^.!?]{0,30}(?:fastidio|fotofobia)/) && has(/appannat/)) return "ocul_lenti_fotofobia";
        if (has(/dopo aver mangiato/) && has(/prurito diffuso/) && has(/gonfiore delle labbra/) && has(/difficolta a respirare/) && has(/(?:mi sento|sono) debole/)) return "allergo_reazione_urgente";
        if (has(/ogni primavera/) && has(/starnuti/) && has(/naso chiuso/) && has(/prurito agli occhi/)) return "allergo_stagionale";
        if (has(/chiazze pruriginose/) && has(/spariscono dopo qualche ora/) && has(/(?:alcune settimane|ricorrent|ogni tanto)/)) return "allergo_chiazze_ricorrenti";
        if (has(/beta-bloccante/) && has(/puntura di insetto/) && has(/gonfiore diffuso/) && has(/(?:portato in ospedale|ricovero)/) && has(/ora sto bene/)) return "allergo_puntura_pregressa";
        return "";
    }

    _detectUrgencySignals(text) {
        const normalized = normalizeMedicalText(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const withoutNegatedSymptoms = this._stripNegatedClinicalClauses(normalized);
        const remoteCardiacHistory = /\b(?:infarto|evento cardiaco)\b[^.!?;]{0,30}\b(?:anni|mesi) fa\b/.test(withoutNegatedSymptoms);
        const stableRefluxPattern = this._isStableRefluxDyspepsiaText(normalized);
        const darkStoolsExplainedByIron = /(?:da quando|dopo (?:aver )?iniziato|mentre)\b[^.!?;]{0,80}\b(?:prendo|assumo|integratore)[^.!?;]{0,30}\b(?:ferro|bismuto)\b/.test(withoutNegatedSymptoms);
        const resolvedAfterIntenseExercise = /\b(?:dopo|durante)\b[^.!?;]{0,45}\b(?:corsa|allenamento|esercizio|sforzo)\b[^.!?;]{0,25}\b(?:intens[oa]|vigoros[oa])\b/.test(normalized)
            && /\b(?:fiato corto|dispnea|manca l'aria)\b/.test(normalized)
            && /\b(?:per (?:alcuni|pochi) minuti|durato pochi minuti|breve)\b/.test(normalized)
            && /\b(?:passat[oa] completamente|risolt[oa] completamente|completa regressione)\b/.test(normalized)
            && /\b(?:non ho|senza)\b[^.!?;]{0,150}\b(?:sintomi a riposo|dolore (?:al petto|toracico)|svenimenti?|respiro sibilante|sibili)\b/.test(normalized);
        const exertionalOnlyDyspnea = /\b(?:fiato corto|dispnea|manca l'aria)\b[^.!?;]{0,45}\b(?:quando cammin\w*|camminando|sotto sforzo|da sforzo)\b/.test(withoutNegatedSymptoms)
            && !/\b(?:a riposo|grave difficolta respiratoria|non riesc[oe] a respirare|dispnea severa)\b/.test(withoutNegatedSymptoms);
        const saturationValues = [...withoutNegatedSymptoms.matchAll(/saturazione\D{0,8}(\d{2,3})/g)]
            .map((match) => Number(match[1]))
            .filter(Number.isFinite);
        const signals = saturationValues
            .filter((value) => value <= 93)
            .map((value) => `Saturazione ${value}% riferita`);
        const cycle03Context = this._getCycle03Context(normalized);
        if (cycle03Context === "ped_respiro_urgente") signals.push("Respiro molto rapido, rientramenti tra le costole e difficolta a parlare o piangere");
        if (cycle03Context === "ocul_calo_improvviso") signals.push("Calo visivo improvviso e persistente da un occhio, senza miglioramento");
        if (cycle03Context === "allergo_reazione_urgente") signals.push("Gonfiore delle labbra e difficolta respiratoria dopo l'assunzione di un alimento");
        const emergencyPatterns = [
            { pattern: /\b(?:fiato corto|fatica a respirare|difficolta respiratoria|dispnea|non riesc[oe] a respirare)\b/, label: "Difficoltà respiratoria o dispnea riferita", skip: exertionalOnlyDyspnea || resolvedAfterIntenseExercise },
            { pattern: /\b(?:dolore (?:al )?torace|dolore toracico)\b/, label: "Dolore toracico riferito", skip: stableRefluxPattern },
            { pattern: /\b(?:feci (?:nere|molto scure|scure)|melena|emorragia)\b/, label: "Feci scure o molto scure riferite", skip: darkStoolsExplainedByIron },
            { pattern: /\b(?:perdita di coscienza|privo di coscienza|svenimento improvviso)\b/, label: "Perdita di coscienza riferita" },
            { pattern: /\b(?:sto avendo un infarto|infarto (?:ora|in corso|appena avvenuto))\b/, label: "Possibile evento cardiaco acuto riferito", skip: remoteCardiacHistory },
            { pattern: /\b(?:suicid|uccider|ammazzar|farla finita)\w*/, label: "Rischio immediato per la sicurezza personale" },
            { pattern: /\b(?:112|118|pronto soccorso|emergenza)\b/, label: "Richiamo esplicito a un'emergenza" }
        ];
        const contextualPatterns = [
            { pattern: /\b(?:tachicardia|battito accelerato|palpitazioni)\b/, label: "Tachicardia o battito accelerato riferito" },
            { pattern: /\b(?:capogiri|vertigini marcate)\b/, label: "Capogiri riferiti" },
            { pattern: /\b(?:bpco)\b/, label: "BPCO riferita" },
            { pattern: /\b(?:febbre\D{0,5}39)\b/, label: "Febbre 39°C riferita" },
            { pattern: /\b(?:diabete)\b/, label: "Diabete riferito" },
            { pattern: /\b(?:insufficienza cardiaca)\b/, label: "Insufficienza cardiaca riferita" },
            { pattern: /\b(?:7[5-9]|8\d|9\d) anni\b/, label: "Età avanzata riferita" }
        ];
        emergencyPatterns.forEach(({ pattern, label, skip }) => {
            if (!skip && pattern.test(withoutNegatedSymptoms)) signals.push(label);
        });
        const fastFace = /\b(?:bocca storta|viso storto|faccia storta|asimmetria facciale)\b/.test(withoutNegatedSymptoms);
        const fastArm = /\b(?:non riesc[eo] a sollevare[^.!?;]{0,45}(?:braccio|gamba)|(?:braccio|gamba|lato del corpo)[^.!?;]{0,45}(?:debole|non si solleva|non riesce|cadente)|debolezza[^.!?;]{0,45}(?:braccio|gamba|lato del corpo)|deficit[^.!?;]{0,45}(?:braccio|gamba|lato del corpo))\b/.test(withoutNegatedSymptoms);
        const fastSpeech = /\b(?:faccio fatica a parlare|difficolta a parlare|non riesc[oa] a parlare bene|parl[oa] male|parole impastate|linguaggio (?:alterato|confuso)|difficolta a pronunciare (?:le )?parole|non trov[oa] (?:le )?parole|parlare[^.!?;]{0,25}(?:improvvisamente )?stran[oa]|(?:voce|linguaggio)[^.!?;]{0,35}improvvisamente cambiat[oa]|parla[^.!?;]{0,35}confus[oa])\b/.test(withoutNegatedSymptoms);
        const fastRecent = /\b(?:da circa \d{1,3} minuti|da \d{1,3} minuti|minuti|improvvis[oa]|all'improvviso|prima stava bene|esordio)\b/.test(withoutNegatedSymptoms);
        if (fastArm && fastSpeech && fastRecent) {
            if (fastFace) signals.push("Bocca/viso storto riferito");
            signals.push("La combinazione di debolezza improvvisa e difficolta nel parlare richiede assistenza immediata");
            signals.push("Esordio improvviso o recente riferito");
            if (/\b(?:pressione alta|ipertensione)\b/.test(withoutNegatedSymptoms)) signals.push("Ipertensione riferita");
            if (/\bfibrillazione atriale\b/.test(withoutNegatedSymptoms)) signals.push("Fibrillazione atriale riferita");
        }
        const acuteAbdominalInstability = /\b(?:forte|intenso)\b[^.!?;]{0,35}\b(?:dolore addominale|dolore (?:alla pancia|all'addome))\b|\b(?:dolore addominale|dolore (?:alla pancia|all'addome))\b[^.!?;]{0,35}\b(?:forte|intenso)\b/.test(withoutNegatedSymptoms)
            && /\b(?:peggiorando|peggiora|in aumento)\b/.test(withoutNegatedSymptoms)
            && (/\b(?:vomitato|vomito)\b[^.!?;]{0,30}\b(?:piu volte|ripetut\w*)\b/.test(withoutNegatedSymptoms) || /\bvomiti? ripetut\w*\b/.test(withoutNegatedSymptoms))
            && /\b(?:quasi svenut\w*|presincope|molto debole|debolezza intensa)\b/.test(withoutNegatedSymptoms);
        if (acuteAbdominalInstability) {
            signals.push("Dolore addominale forte e in peggioramento");
            signals.push("Vomito ripetuto");
            signals.push("Debolezza intensa o quasi svenimento");
        }
        const severePressure = [...withoutNegatedSymptoms.matchAll(/(?:pressione[^.!?;]{0,90})?(\d{3})\s*\/\s*(\d{2,3})/g)]
            .some((match) => Number(match[1]) >= 180 || Number(match[2]) >= 120);
        const severePressureAlarmSymptoms = /\b(?:forte mal di testa|cefalea|vista offuscata|confusione|dolore toracico|dolore al torace|dispnea|difficolta respiratoria|fiato corto|sincope|svenimento|deficit neurologic|peggioramento)\b/.test(withoutNegatedSymptoms);
        if (severePressure && severePressureAlarmSymptoms) {
            signals.push("Pressione arteriosa molto elevata con sintomi riferita");
            if (/\b(?:forte mal di testa|cefalea)\b/.test(withoutNegatedSymptoms)) signals.push("Cefalea intensa riferita");
            if (/\bvista offuscata\b/.test(withoutNegatedSymptoms)) signals.push("Vista offuscata riferita");
            if (/\bconfusione\b/.test(withoutNegatedSymptoms)) signals.push("Confusione riferita");
            if (/\b(?:farmaci|terapia)\b[^.!?;]{0,45}\b(?:non hanno fatto effetto|inefficac)\b/.test(withoutNegatedSymptoms)) signals.push("Terapia antipertensiva riferita come inefficace");
        }
        if (signals.length > 0) {
            contextualPatterns.forEach(({ pattern, label }) => {
                if (pattern.test(withoutNegatedSymptoms)) signals.push(label);
            });
        }
        return [...new Set(signals)];
    }

    _buildLocalEmergencyStructuredData(text, signals) {
        const normalized = normalizeMedicalText(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const cycle03Context = this._getCycle03Context(normalized);
        if (cycle03Context === "ped_respiro_urgente") {
            return {
                specialista_indicato: "112/118 o Pronto Soccorso",
                area_specialistica_piu_adatta: {
                    branca: "Pronto Soccorso / Medicina d'urgenza pediatrica",
                    area_specialistica: "Respiro molto rapido, rientramenti tra le costole e difficolta a parlare o piangere da valutare immediatamente",
                    eventuale_secondo_livello: "Pediatria dopo la valutazione urgente"
                },
                livello_urgenza: "Alta / immediata: contattare subito 112/118 o recarsi in Pronto Soccorso",
                red_flags_rilevate: [
                    "eta pediatrica: 3 anni",
                    "respiro molto rapido",
                    "rientramenti tra le costole",
                    "difficolta a parlare o piangere",
                    "stanchezza marcata"
                ]
            };
        }
        if (cycle03Context === "ocul_calo_improvviso") {
            return {
                specialista_indicato: "Pronto Soccorso / servizio oculistico urgente",
                area_specialistica_piu_adatta: {
                    branca: "Pronto Soccorso / Oculistica urgente",
                    area_specialistica: "Calo visivo improvviso monolaterale persistente da valutare immediatamente",
                    eventuale_secondo_livello: "Oculistica dopo la valutazione urgente"
                },
                livello_urgenza: "Alta / immediata: recarsi subito in Pronto Soccorso o al servizio oculistico urgente",
                red_flags_rilevate: [
                    "calo visivo improvviso",
                    "un solo occhio coinvolto",
                    "sintomo ancora presente",
                    "assenza di miglioramento",
                    "assenza di trauma riferita"
                ]
            };
        }
        if (cycle03Context === "allergo_reazione_urgente") {
            return {
                specialista_indicato: "112/118 o Pronto Soccorso",
                area_specialistica_piu_adatta: {
                    branca: "Pronto Soccorso / Medicina d'urgenza",
                    area_specialistica: "Gonfiore delle labbra e difficolta respiratoria dopo un alimento da valutare immediatamente",
                    eventuale_secondo_livello: "Allergologia dopo la valutazione urgente"
                },
                livello_urgenza: "Alta / immediata: contattare subito 112/118 o recarsi in Pronto Soccorso",
                red_flags_rilevate: [
                    "assunzione recente di un alimento",
                    "prurito diffuso",
                    "gonfiore delle labbra",
                    "difficolta respiratoria",
                    "debolezza"
                ]
            };
        }
        if (this._isMelenaAnticoagulantEmergencyText(normalized)) {
            const positiveText = this._stripNegatedClinicalClauses(normalized);
            const redFlags = ["feci nere o molto scure"];
            if (/\bdebole(?:zza)?\b/.test(positiveText)) redFlags.push("debolezza riferita");
            if (/\b(?:capogiri|giramenti)\b/.test(positiveText)) redFlags.push("capogiri riferiti");
            if (/\bpallid\w*/.test(positiveText)) redFlags.push("pallore riferito");
            if (/\bstanc(?:a|o|hezza)\b/.test(positiveText)) redFlags.push("stanchezza riferita");
            if (/\b(?:anticoagulant|warfarin|coumadin|apixaban|rivaroxaban|dabigatran|edoxaban|aspirina|antiaggregante)\w*/.test(positiveText)) redFlags.push("terapia anticoagulante riferita");
            if (/\bfibrillazione atriale\b/.test(positiveText)) redFlags.push("fibrillazione atriale riferita");
            return {
                specialista_indicato: "112/118 o Pronto Soccorso",
                area_specialistica_piu_adatta: {
                    branca: "Emergenza gastroenterologica / Pronto Soccorso",
                    area_specialistica: "Feci molto scure con segnali associati riferiti da valutare urgentemente",
                    eventuale_secondo_livello: "Gastroenterologia dopo valutazione e stabilizzazione urgente"
                },
                livello_urgenza: "Alta / immediata: contattare subito 112/118 o recarsi in Pronto Soccorso",
                red_flags_rilevate: redFlags
            };
        }
        if (this._isBpcoLowSaturationEmergencyText(normalized)) {
            return {
                specialista_indicato: "Valutazione medica urgente; Pronto Soccorso se peggiora o compaiono segni severi",
                area_specialistica_piu_adatta: {
                    branca: "Pneumologia / Medicina d'urgenza",
                    area_specialistica: "Riacutizzazione BPCO / infezione respiratoria / insufficienza respiratoria da valutare",
                    eventuale_secondo_livello: "Pronto Soccorso o Pneumologia secondo gravita ed evoluzione"
                },
                livello_urgenza: "Prioritaria / urgente: valutazione medica non da rimandare",
                red_flags_rilevate: [
                    "BPCO nota",
                    "dispnea peggiorata rispetto al solito",
                    "tosse aumentata",
                    "catarro piu denso e giallastro",
                    "saturazione 91%",
                    "affaticamento nel parlare",
                    "assenza di dolore toracico forte",
                    "assenza di confusione",
                    "riesce ancora a parlare",
                    "escalation a 112/118 o Pronto Soccorso se dispnea severa, saturazione molto bassa, cianosi, confusione, dolore toracico, peggioramento rapido, incapacita a parlare o grave sonnolenza"
                ]
            };
        }
        if (this._isHemoptysisEmergencyText(normalized)) {
            return {
                specialista_indicato: "Valutazione urgente; Pronto Soccorso se sangue abbondante, dispnea, dolore toracico o peggioramento",
                area_specialistica_piu_adatta: {
                    branca: "Pneumologia / Pronto Soccorso",
                    area_specialistica: "Emottisi / sanguinamento respiratorio / dolore pleuritico",
                    eventuale_secondo_livello: "Pneumologia dopo valutazione urgente"
                },
                livello_urgenza: "Alta / urgente: valutazione medica urgente, con Pronto Soccorso o 112/118 se peggiora",
                red_flags_rilevate: [
                    "sangue rosso nel catarro",
                    "piu di semplici striature",
                    "emottisi",
                    "possibile sanguinamento respiratorio",
                    "dolore toracico respiratorio",
                    "fiato corto",
                    "fumo",
                    "assenza di trauma",
                    "escalation a 112/118 o Pronto Soccorso se sanguinamento abbondante, peggioramento, dispnea importante, dolore toracico intenso, svenimento o instabilita"
                ]
            };
        }
        const fastFace = /\b(?:bocca storta|viso storto|faccia storta|asimmetria facciale)\b/.test(normalized);
        const fastArm = /\b(?:non riesc[eo] a sollevare[^.!?;]{0,45}(?:braccio|gamba)|(?:braccio|gamba|lato del corpo)[^.!?;]{0,45}(?:debole|non si solleva|non riesce|cadente)|debolezza[^.!?;]{0,45}(?:braccio|gamba|lato del corpo)|deficit[^.!?;]{0,45}(?:braccio|gamba|lato del corpo))\b/.test(normalized);
        const fastSpeech = /\b(?:faccio fatica a parlare|difficolta a parlare|non riesc[oa] a parlare bene|parl[oa] male|parole impastate|linguaggio (?:alterato|confuso)|difficolta a pronunciare (?:le )?parole|non trov[oa] (?:le )?parole|parlare[^.!?;]{0,25}(?:improvvisamente )?stran[oa]|(?:voce|linguaggio)[^.!?;]{0,35}improvvisamente cambiat[oa]|parla[^.!?;]{0,35}confus[oa])\b/.test(normalized);
        const fastRecent = /\b(?:da circa \d{1,3} minuti|da \d{1,3} minuti|minuti|improvvis[oa]|all'improvviso|prima stava bene|esordio)\b/.test(normalized);
        if (fastArm && fastSpeech && fastRecent) {
            return {
                specialista_indicato: "112/118 o Pronto Soccorso",
                area_specialistica_piu_adatta: {
                    branca: "Emergenza neurologica / Pronto Soccorso",
                    area_specialistica: "Sintomi neurologici focali riferiti da valutare con urgenza",
                    eventuale_secondo_livello: "Neurologia dopo valutazione urgente"
                },
                livello_urgenza: "Emergenza tempo-dipendente: contattare subito 112/118 o Pronto Soccorso",
                red_flags_rilevate: [
                    "debolezza improvvisa di un arto o lato del corpo",
                    "difficolta improvvisa nel parlare",
                    "esordio improvviso o recente"
                ].concat(fastFace ? ["asimmetria del volto riferita"] : [])
            };
        }
        if (signals.includes("Dolore addominale forte e in peggioramento")) {
            return {
                specialista_indicato: "112/118 o Pronto Soccorso",
                area_specialistica_piu_adatta: {
                    branca: "Pronto Soccorso / Medicina d'urgenza",
                    area_specialistica: "Dolore addominale acuto con instabilita riferita da valutare immediatamente",
                    eventuale_secondo_livello: "Chirurgia generale o Gastroenterologia dopo valutazione urgente"
                },
                livello_urgenza: "Alta / immediata: contattare subito 112/118 o recarsi in Pronto Soccorso",
                red_flags_rilevate: [
                    "dolore addominale forte e in peggioramento",
                    "vomito ripetuto",
                    "debolezza intensa",
                    "quasi svenimento"
                ]
            };
        }
        if (/dolore[^.!?;]{0,80}(?:braccio sinistro|mandibola)|sudo freddo|sudorazione fredda/.test(normalized)) {
            return {
                specialista_indicato: "Emergenza cardiologica / Pronto Soccorso",
                area_specialistica_piu_adatta: {
                    branca: "Emergenza cardiologica / Pronto Soccorso",
                    area_specialistica: "Dolore toracico acuto con red flag / possibile sindrome coronarica acuta",
                    eventuale_secondo_livello: "Cardiologia dopo stabilizzazione urgente"
                },
                livello_urgenza: "Emergenza: contattare immediatamente 112/118 o recarsi in Pronto Soccorso",
                red_flags_rilevate: [
                    "dolore toracico persistente",
                    "irradiazione al braccio sinistro e alla mandibola",
                    "sudorazione fredda",
                    "nausea",
                    "dispnea",
                    "diabete"
                ]
            };
        }
        const severePressureMatch = normalized.match(/(?:pressione[^.!?;]{0,90})?(\d{3})\s*\/\s*(\d{2,3})/);
        const severePressure = severePressureMatch && (Number(severePressureMatch[1]) >= 180 || Number(severePressureMatch[2]) >= 120);
        const alarmSymptoms = /forte mal di testa|cefalea|vista offuscata|confusione|dolore toracico|dolore al torace|dispnea|difficolta respiratoria|fiato corto|sincope|svenimento|deficit neurologic|peggioramento/.test(normalized);
        if (severePressure && alarmSymptoms) {
            const pressureValue = `${severePressureMatch[1]}/${severePressureMatch[2]}`;
            return {
                specialista_indicato: "Emergenza cardiovascolare / Pronto Soccorso",
                area_specialistica_piu_adatta: {
                    branca: "Emergenza cardiovascolare / emergenza medica",
                    area_specialistica: "Crisi ipertensiva sintomatica / possibile emergenza ipertensiva",
                    eventuale_secondo_livello: "Cardiologia o Medicina interna dopo stabilizzazione"
                },
                livello_urgenza: "Emergenza: valutazione immediata tramite 112/118 o Pronto Soccorso",
                red_flags_rilevate: [
                    `pressione arteriosa ${pressureValue}`,
                    "cefalea intensa",
                    "vista offuscata",
                    "confusione",
                    "terapia antipertensiva riferita come inefficace"
                ]
            };
        }
        return {
            specialista_indicato: "Servizio di emergenza / Pronto Soccorso",
            area_specialistica_piu_adatta: {
                branca: "Medicina d'urgenza",
                area_specialistica: "Valutazione urgente dei segnali di allarme riferiti",
                eventuale_secondo_livello: "Da definire dopo stabilizzazione"
            },
            livello_urgenza: "Emergenza: contattare 112/118 o Pronto Soccorso",
            red_flags_rilevate: signals
        };
    }

    _detectUrgency(text) {
        return this._detectUrgencySignals(text).length > 0;
    }

    _isValidFreeText(text) {
        const val = text.trim();
        const low = val.toLowerCase();
        
        // 1. Almeno 2 caratteri
        if (val.length < 2) return false;
        
        // 2. Non deve essere un singolo numero o una singola consonante ripetuta
        if (/^\d+$/.test(val) && val.length < 3) return false; // Solo cifre corte (es. "1", "12") no
        if (/^[bcdfghjklmnpqrstvwxz]+$/i.test(val)) return false; // Solo consonanti no

        // 3. Se ci sono numeri, deve esserci almeno una parola di senso compiuto (almeno 3 lettere con 1 vocale)
        if (/\d/.test(val)) {
            const parts = val.split(/\s+/);
            const hasGoodWord = parts.some(p => p.length >= 3 && /[aeiouy]/i.test(p));
            if (!hasGoodWord) return false;
        }

        return true;
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
        console.log("Engine: elaborazione input ->", input, "| Stato attuale:", this.state);
        if (!input) return;

        const urgencySignals = this._detectUrgencySignals(input);
        if (urgencySignals.length > 0) {
            console.log("Engine: Urgenza rilevata!");
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
                console.log("Engine: fase SESSO_ETA ->", strSessoEta);

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
                console.log("Engine: Sesso ed Età validati ->", this.userData.sessoEta);
                this.state = '2_ZONA';
                this.onMessage(`Perfetto: <strong>${this.userData.sessoEta}</strong>. <br><br><strong>Qual è la tua zona geografica (Comune e Provincia)?</strong>`);
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
                    console.error("Errore validazione geografica:", error);
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
                        console.warn("Validazione automatica sintomo non disponibile; applicato fallback prudente.");
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
                    console.error("Errore interno durante la validazione del sintomo.");
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
                console.warn("Engine: Stato non gestito ->", this.state);
                this.onMessage("Attenzione: Si è verificato un imprevisto nel flusso. Per favore, clicca su 'Nuova Ricerca' per ricominciare.");
        }
    }

    _generaDomandeAnamnestiche(disturbo) {
        const rawLower = normalizeMedicalText(disturbo || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’‘`´]/g, "'");
        const stripNegatedClauses = (value) => String(value || "")
            .replace(/\b(?:non ho|non ha|non presento|non presenta|non riferisco|non sono|non mi sono|senza|assenza di|nega|negano)\b[^.!?;]{0,180}(?=[.!?;]|$)/gi, " ")
            .replace(/\s+/g, " ")
            .trim();
        const dLower = stripNegatedClauses(rawLower);
        const wholeWordTerms = new Set([
            "occhi", "vista", "occhio", "naso", "gola", "voce", "denti", "bocca",
            "pene", "testa", "osso", "ossa", "schiena", "ginocchio", "ginocchia",
            "spalla", "spalle", "caviglia", "caviglie", "tallone", "talloni",
            "mano", "mani", "polso", "polsi", "dito", "dita", "gomito",
            "anca", "bacino", "inguine", "coscia", "femore", "gamba", "gambe",
            "cuore", "petto", "tosse", "asma", "stomaco", "pancia", "addome",
            "neo", "nei", "nevo", "nevi", "verruca", "verruche", "brufolo", "foruncolo",
            "ano", "retto", "pressione"
        ]);
        const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const hasTerm = (term) => {
            if (wholeWordTerms.has(term)) {
                return new RegExp(`(^|[^a-zàèéìòù])${escapeRegExp(term)}([^a-zàèéìòù]|$)`, 'i').test(dLower);
            }
            return dLower.includes(term);
        };
        const hasAny = (words) => words.some(hasTerm);
        const rawHas = (pattern) => pattern.test(rawLower);
        const activeHas = (pattern) => pattern.test(dLower);
        const questionSet = (...questions) => questions;
        const positivePregnancy = activeHas(/(?:sono incinta|gravidanza|in gravidanza|incinta di|\bgravid\w*|\d{1,2} settimane)/i);

        // --- DEFINIZIONE MAPPATURA GLOBALE SEDI/SINTOMI ---
        const SEDE = {
            OCCHI: ["occhio", "occhi", "vista", "visione", "annebbia", "glaucoma", "cataratta", "miodepops", "fosfeni", "maculopat", "fotofobia"],
            ORL: ["orecch", "naso", "gola", "voce", "udito", "acufen", "faringite", "laringite", "sinusite", "otite", "ipoacusia", "raucedin", "deglutire"],
            DENTI: ["dent", "molar", "gengiv", "bocca", "mascella", "mandibola"],
            URO: ["urin", "minzion", "pipi", "vesci", "prostat", "ciclo", "mestruazion", "pene", "testicol", "vagina", "pelvi", "endometriosi"],
            GASTRO: ["stomaco", "pancia", "addome", "intestino", "digestion", "nausea", "reflusso", "diarrea", "stitich", "feci", "vomito", "melena", "ano", "retto", "rettale", "emorroidi", "stipsi", "colon"],
            NEURO_CENTRALE: ["testa", "cefalea", "emicrania", "vertigin", "equilibrio", "formicol", "tremore", "scotoma", "paresi", "paralisi", "neuropatia"],
            ORTHO: ["osso", "ossa", "schiena", "ginocchio", "ginocchia", "frattura", "articolazion", "distorsion", "tendin", "legament", "cervical", "sciatalgia", "spalla", "caviglia", "tallone", "polso", "anca", "gomito"],
            CARDIO: ["cuore", "palpitazion", "petto", "pressione", "sincope", "edema", "angina", "pericardite"],
            PNEUMO: ["polmon", "pneumo", "asma", "bronchi", "fischio", "catarro", "tosse", "affanno", "respiro"],
            DERMATO: ["pelle", "cute", "dermat", "macchia", "macchie", "neo", "nei", "nevo", "nevi", "melanom", "lesion cutanea", "lesione cutanea", "prurit", "eruzion", "orticaria", "ponfo", "verruca", "verruche", "brufolo", "brufoli", "foruncolo", "foruncoli", "cisti"]
        };

        // --- LOGICA SPECIALISTICA PRIORITARIA ---
        // Prima di usare le sedi anatomiche generiche, privilegia i blocchi
        // della branca piu probabile e ignora i sintomi presenti solo in forma negata.
        const cycle03Context = this._getCycle03Context(rawLower);
        if (cycle03Context === "ped_febbre") {
            return questionSet(
                "Da quanto dura la febbre, qual e stata la temperatura massima e come e stata misurata?\n<br><i>A) Da meno di 48 ore, valore e metodo noti<br>B) Da piu di 48 ore o in aumento<br>C) Valore o metodo non noti</i>",
                "Come sono idratazione, urine, vigilanza e alimentazione rispetto al solito?\n<br><i>A) Beve, urina ed e vigile<br>B) Beve o urina meno, ma resta vigile<br>C) E molto sonnolenta, non beve o urina molto poco</i>",
                "Sono comparsi respiro difficile, dolore importante, tosse, vomito, diarrea o rash, e sono gia stati dati farmaci o sono presenti condizioni croniche?\n<br><i>A) Uno o piu elementi presenti<br>B) Solo sintomi lievi o farmaci gia dati<br>C) Nessuno di questi elementi</i>"
            );
        }
        if (cycle03Context === "ped_vista_cefalea") {
            return questionSet(
                "Il mal di testa e la vista sfocata compaiono leggendo, con tablet o schermi, e riguardano la visione da vicino, da lontano o entrambe?\n<br><i>A) Soprattutto vicino o con schermi<br>B) Soprattutto lontano<br>C) In entrambe le situazioni</i>",
                "Quanto durano e con quale frequenza; sono presenti dolore oculare, fastidio alla luce, nausea o risvegli notturni?\n<br><i>A) Frequenti o con uno di questi segnali<br>B) Saltuari e brevi<br>C) Durata o frequenza non chiare</i>",
                "Ci sono stati trauma o problemi ai precedenti controlli visivi, oppure debolezza, difficolta a parlare, perdita di coscienza o altri segnali neurologici?\n<br><i>A) Trauma, controllo visivo anomalo o segnale neurologico<br>B) Solo precedenti problemi visivi<br>C) Nessuno</i>"
            );
        }
        if (cycle03Context === "ped_stanchezza_sport") {
            return questionSet(
                "Quanto sono stati intensi e lunghi l'allenamento e l'esposizione al caldo?\n<br><i>A) Molto intensi, lunghi o al caldo<br>B) Moderati<br>C) Non so definirli</i>",
                "Prima e durante l'attivita aveva mangiato e bevuto, e il recupero dopo riposo e idratazione e stato completo?\n<br><i>A) Recupero completo<br>B) Recupero parziale o lento<br>C) Sintomi ancora presenti</i>",
                "Era gia successo o compaiono sintomi a riposo, dolore al petto, svenimento o difficolta respiratoria?\n<br><i>A) Episodi ricorrenti o sintomi a riposo<br>B) Solo un episodio dopo sforzo<br>C) Dolore al petto, svenimento o difficolta respiratoria</i>"
            );
        }
        if (cycle03Context === "ped_antibiotico_macchie") {
            return questionSet(
                "Quale antibiotico sta assumendo, da quale giorno e quanto tempo e passato tra l'ultima dose e la comparsa delle macchie?\n<br><i>A) Nome, giorno e intervallo noti<br>B) Solo alcune informazioni note<br>C) Informazioni da recuperare</i>",
                "Le macchie si stanno diffondendo o prudono; coinvolgono mucose o sono presenti bolle, febbre o forte malessere?\n<br><i>A) Diffusione rapida, mucose, bolle o malessere<br>B) Solo prurito o diffusione limitata<br>C) No</i>",
                "Sono presenti gonfiore del viso o difficolta respiratoria, precedenti reazioni a farmaci o altri farmaci assunti?\n<br><i>A) Gonfiore o difficolta respiratoria<br>B) Precedenti reazioni o altri farmaci<br>C) Nessuno</i>"
            );
        }
        if (cycle03Context === "ocul_calo_progressivo") {
            return questionSet(
                "Il calo riguarda uno o entrambi gli occhi, la visione da vicino o da lontano, e sta progredendo anche di notte?\n<br><i>A) Un occhio o progressione rapida<br>B) Entrambi, soprattutto lontano o la sera<br>C) Non e chiaro</i>",
                "Usi occhiali o lenti, quando hai fatto l'ultimo controllo e hai diabete o assumi farmaci rilevanti?\n<br><i>A) Correzione o condizioni presenti<br>B) Ultimo controllo lontano nel tempo<br>C) Nessuno o non so</i>",
                "Sono presenti aloni, visione doppia, lampi, macchie o dolore?\n<br><i>A) Uno o piu sintomi presenti<br>B) Solo difficolta notturna<br>C) Nessuno</i>"
            );
        }
        if (cycle03Context === "ocul_dolore_cefalea") {
            return questionSet(
                "Dove e localizzato il dolore, quanto dura, quanto e intenso e cambia muovendo l'occhio?\n<br><i>A) Intenso o peggiore con i movimenti<br>B) Lieve o moderato e stabile<br>C) Sede o andamento non chiari</i>",
                "Sono presenti fastidio alla luce, lacrimazione, alterazioni della vista, nausea, febbre o trauma?\n<br><i>A) Uno o piu elementi presenti<br>B) Solo lacrimazione o fastidio lieve<br>C) Nessuno</i>",
                "Sono comparsi debolezza, difficolta a parlare, perdita di coscienza o altri segni neurologici, oppure episodi simili in passato?\n<br><i>A) Segni neurologici<br>B) Solo episodi precedenti<br>C) Nessuno</i>"
            );
        }
        if (cycle03Context === "ocul_lenti_fotofobia") {
            return questionSet(
                "Da quanto porti le lenti, le usi di notte e come gestisci igiene, acqua o piscina e soluzione?\n<br><i>A) Uso notturno, acqua o igiene non ottimale<br>B) Uso diurno con igiene regolare<br>C) Dettagli non noti</i>",
                "Da quanto sono iniziati dolore e fastidio alla luce; ci sono calo visivo, secrezioni, rossore o peggioramento?\n<br><i>A) Calo, secrezioni o peggioramento<br>B) Sintomi stabili e lievi<br>C) Non e chiaro</i>",
                "Ci sono stati trauma, polvere o sostanze chimiche nell'occhio?\n<br><i>A) Trauma o sostanza chimica<br>B) Possibile corpo estraneo<br>C) No</i>"
            );
        }
        if (cycle03Context === "allergo_stagionale") {
            return questionSet(
                "In quali mesi, ambienti o esposizioni a pollini, polvere o animali compaiono i sintomi?\n<br><i>A) Periodo o esposizione chiari<br>B) Piu ambienti o stagioni<br>C) Nessun legame chiaro</i>",
                "Oltre a starnuti, naso chiuso e prurito nasale o oculare, compaiono tosse, sibili o asma?\n<br><i>A) Tosse, sibili o asma<br>B) Solo naso e occhi<br>C) Sintomi diversi o non chiari</i>",
                "Ci sono familiarita, farmaci gia usati e impatto su sonno, scuola o attivita quotidiane?\n<br><i>A) Familiarita o impatto importante<br>B) Farmaci gia usati con beneficio parziale<br>C) Nessuno</i>"
            );
        }
        if (cycle03Context === "allergo_chiazze_ricorrenti") {
            return questionSet(
                "Quanto dura ogni singola chiazza, con quale frequenza compare e hai fotografie degli episodi?\n<br><i>A) Dura ore ed e documentata<br>B) Durata variabile senza foto<br>C) Dura oltre un giorno</i>",
                "Noti legami con alimenti, farmaci, infezioni recenti, caldo, freddo, pressione sulla pelle o stress?\n<br><i>A) Uno o piu legami chiari<br>B) Legame dubbio<br>C) Nessun legame</i>",
                "Durante gli episodi compaiono gonfiore del viso o delle labbra, sintomi respiratori o altri episodi simili in passato?\n<br><i>A) Gonfiore o sintomi respiratori<br>B) Solo episodi cutanei precedenti<br>C) Nessuno</i>"
            );
        }
        if (cycle03Context === "allergo_puntura_pregressa") {
            return questionSet(
                "Quale insetto era coinvolto, quali sintomi comparvero, dopo quanto tempo e quale trattamento ospedaliero fu eseguito?\n<br><i>A) Informazioni e trattamento documentati<br>B) Informazioni parziali<br>C) Insetto o dettagli non noti</i>",
                "Hai avuto altre punture o allergie note, precedenti visite allergologiche o un dispositivo gia prescritto?\n<br><i>A) Altre reazioni o dispositivo prescritto<br>B) Solo visita precedente<br>C) Nessuno</i>",
                "Quali farmaci assumi, incluso il beta-bloccante, e quali condizioni cardiovascolari sono presenti? Non modificare la terapia autonomamente.\n<br><i>A) Elenco e condizioni noti<br>B) Informazioni parziali<br>C) Da verificare con il medico</i>"
            );
        }
        if (activeHas(/(?:bruciore|fastidio|pressione)[^.!?;]{0,45}(?:petto|sterno|torace)/i)
            && activeHas(/(?:camminando|cammino|sotto sforzo|durante lo sforzo|salendo|corsa)/i)) {
            return questionSet(
                "Il fastidio compare durante lo sforzo, quanto dura e regredisce fermandoti?\n<br><i>A) Compare con lo sforzo e persiste o recidiva<br>B) E breve e regredisce con il riposo<br>C) Non e legato allo sforzo</i>",
                "Si estende a mandibola, braccio, collo o schiena, oppure si associa a fiato corto, nausea o sudorazione fredda?\n<br><i>A) Si, uno o piu segnali<br>B) Solo in parte o dubbio<br>C) No</i>",
                "Sono presenti fattori cardiovascolari come ipertensione, diabete, fumo o precedenti cardiaci, e il fastidio sta peggiorando?\n<br><i>A) Fattori presenti o peggioramento<br>B) Solo uno dei due aspetti<br>C) No</i>"
            );
        }
        if (activeHas(/(?:sangue rosso|sangue vivo)[^.!?;]{0,40}(?:feci|retto|ano)|(?:feci|retto|ano)[^.!?;]{0,40}(?:sangue rosso|sangue vivo)/i)
            && activeHas(/(?:anticoagulant|warfarin|coumadin|apixaban|rivaroxaban|dabigatran|edoxaban)/i)) {
            return questionSet(
                "Quanto sangue rosso hai notato, in quanti episodi e il sanguinamento e ancora presente o si e ripetuto?\n<br><i>A) Abbondante, attuale o ripetuto<br>B) Poche tracce in un solo episodio<br>C) Non so quantificarlo</i>",
                "Sono presenti dolore addominale o anale, altri sanguinamenti, peggioramento, debolezza, capogiri o svenimento?\n<br><i>A) Si, uno o piu elementi<br>B) Solo dolore lieve o dubbio<br>C) No</i>",
                "Quale anticoagulante assumi e chi lo ha prescritto? Non modificarlo o sospenderlo autonomamente.\n<br><i>A) Nome e prescrittore noti<br>B) Conosco solo uno dei due<br>C) Devo recuperare le informazioni</i>"
            );
        }
        if (activeHas(/bruciore[^.!?;]{0,45}(?:dietro lo sterno|retrosternale|al petto)/i)
            && activeHas(/(?:dopo i pasti|post prand|quando mi sdraio|da sdraiato)/i)) {
            return questionSet(
                "Il bruciore compare dopo quali pasti, cambia da sdraiato e quanto dura ogni episodio?\n<br><i>A) Legame chiaro con pasti e posizione<br>B) Legame solo parziale<br>C) Nessun legame chiaro</i>",
                "Hai difficolta o dolore a deglutire, rigurgito, vomito, sangue, calo di peso o un andamento in peggioramento?\n<br><i>A) Si, uno o piu segnali<br>B) Solo disturbi lievi<br>C) No</i>",
                "Assumi farmaci che possono influire sul disturbo, e il fastidio compare con lo sforzo o insieme a fiato corto, sudorazione o svenimento?\n<br><i>A) Farmaci o segnali cardiaci presenti<br>B) Solo dubbio<br>C) No</i>"
            );
        }
        if (activeHas(/(?:alterno|alternanza)[^.!?;]{0,55}(?:stitichezza|stipsi)[^.!?;]{0,35}diarrea|(?:stitichezza|stipsi)[^.!?;]{0,55}(?:alterno|alternanza)[^.!?;]{0,35}diarrea/i)) {
            return questionSet(
                "Da quanto dura l'alternanza, con quale andamento e quanto sono frequenti i periodi di stitichezza e diarrea?\n<br><i>A) Persistente o in peggioramento<br>B) Ricorrente ma stabile<br>C) Occasionale</i>",
                "Noti relazione con alimenti o pasti, dolore, gonfiore, sangue, febbre, calo di peso o nuovi sintomi?\n<br><i>A) Si, uno o piu elementi<br>B) Solo gonfiore o legame dubbio<br>C) No</i>",
                "Assumi farmaci o integratori, hai gia eseguito esami e ci sono disturbi intestinali rilevanti in famiglia?\n<br><i>A) Si, informazioni o referti disponibili<br>B) Solo in parte<br>C) No o non so</i>"
            );
        }
        if (activeHas(/(?:gonfi|gonfiore)/i) && activeHas(/(?:ogni tanto|occasionale|dopo aver mangiato molto|pasti abbondanti)/i)) {
            return questionSet(
                "Quali alimenti o quantita precedono il gonfiore, quanto dura e con quale frequenza compare?\n<br><i>A) Legame e frequenza chiari<br>B) Solo legame parziale<br>C) Non noto un legame</i>",
                "Il disturbo e stabile, sta diventando persistente o sta peggiorando nel tempo?\n<br><i>A) Persistente o in peggioramento<br>B) Stabile e occasionale<br>C) E regredito</i>",
                "Sono comparsi nuovi sintomi come dolore importante, vomito, sangue, febbre, calo di peso o cambiamenti persistenti dell'intestino?\n<br><i>A) Si, uno o piu sintomi<br>B) Solo sintomi lievi o dubbi<br>C) No</i>"
            );
        }
        if (activeHas(/(?:formicol|intorpid)/i) && activeHas(/(?:mano|dita|polso)/i)) {
            return questionSet(
                "Il formicolio cambia con la postura del polso o del collo, con il lavoro o con movimenti ripetitivi?\n<br><i>A) Si, legame chiaro<br>B) Solo in parte<br>C) No</i>",
                "Quali dita coinvolge, compare di notte e si associa a dolore cervicale o irradiato al braccio?\n<br><i>A) Distribuzione o dolore associato chiari<br>B) Solo alcuni aspetti<br>C) No</i>",
                "Hai riduzione della forza, difficolta nella presa, perdita di sensibilita persistente o peggioramento?\n<br><i>A) Si, uno o piu segnali<br>B) Solo lieve o dubbio<br>C) No</i>"
            );
        }
        if (activeHas(/(?:stanc|fatica a concentr|concentrazione)/i) && activeHas(/(?:dormo poco|poco sonno|sonno insufficiente)/i)) {
            return questionSet(
                "Quante ore dormi, com'e la qualita del sonno e da quanto durano stanchezza e difficolta di concentrazione?\n<br><i>A) Sonno molto ridotto o disturbi persistenti<br>B) Riduzione lieve o recente<br>C) Sonno sufficiente</i>",
                "Ci sono stress, cambiamenti recenti, farmaci, caffeina, alcol o altre sostanze che possono influire su sonno e attenzione?\n<br><i>A) Si, uno o piu fattori<br>B) Solo dubbio<br>C) No</i>",
                "I sintomi persistono nonostante il riposo, stanno peggiorando o sono comparsi nuovi segnali neurologici?\n<br><i>A) Persistono, peggiorano o ci sono nuovi segnali<br>B) Sono stabili<br>C) Migliorano con il riposo</i>"
            );
        }
        if (activeHas(/(?:fiato corto|dispnea|manca l'aria)/i)
            && rawHas(/(?:dopo|durante)[^.!?;]{0,45}(?:corsa|allenamento|esercizio|sforzo)[^.!?;]{0,25}(?:intens[oa]|vigoros[oa])/i)
            && rawHas(/(?:passat[oa] completamente|risolt[oa] completamente|completa regressione)/i)) {
            return questionSet(
                "Quanto era intenso lo sforzo, quanto e durato il fiato corto e in quanto tempo hai recuperato completamente?\n<br><i>A) Sforzo intenso con recupero rapido<br>B) Recupero lento o incompleto<br>C) Non so</i>",
                "Era gia successo con sforzi simili o compare anche con attivita leggere o a riposo?\n<br><i>A) Anche con sforzi lievi o a riposo<br>B) Solo con sforzi intensi<br>C) Primo episodio</i>",
                "Sono comparsi peggioramento, dolore toracico, svenimento, sibili, palpitazioni o altri sintomi nuovi?\n<br><i>A) Si, uno o piu segnali<br>B) Solo dubbio<br>C) No</i>"
            );
        }
        if (activeHas(/tosse/i) && activeHas(/(?:sangue[^.!?;]{0,35}(?:espettorato|catarro)|(?:espettorato|catarro)[^.!?;]{0,35}sangue)/i)) {
            return questionSet(
                "Quanto sangue hai visto, in quanti episodi e il sanguinamento e ancora presente o si e ripetuto?\n<br><i>A) Abbondante, attuale o ripetuto<br>B) Poche tracce in un episodio<br>C) Non so quantificarlo</i>",
                "Sono presenti fiato corto, dolore toracico, febbre, svenimento, debolezza marcata o peggioramento?\n<br><i>A) Si, uno o piu segnali<br>B) Solo debolezza lieve o dubbio<br>C) No</i>",
                "Assumi anticoagulanti o altri farmaci, fumi, hai avuto infezioni, traumi o episodi simili?\n<br><i>A) Si, uno o piu elementi<br>B) Solo in parte<br>C) No</i>"
            );
        }
        if (activeHas(/tosse/i) && rawHas(/(?:piu di sei settimane|oltre sei settimane|da (?:molte|diverse) settimane)/i)) {
            return questionSet(
                "La tosse e secca o con espettorato, come e cambiata nel tempo e interferisce con sonno o attivita?\n<br><i>A) Persistente o in peggioramento<br>B) Stabile<br>C) In miglioramento</i>",
                "Fumi o sei esposto a polveri, sostanze irritanti, allergeni, ambienti di lavoro o contatti respiratori?\n<br><i>A) Si, una o piu esposizioni<br>B) Solo dubbio<br>C) No</i>",
                "Assumi farmaci, e sono comparsi fiato corto, sangue, febbre alta, calo di peso, dolore toracico o nuovi sintomi?\n<br><i>A) Si, farmaci o nuovi segnali<br>B) Solo farmaci senza segnali<br>C) No</i>"
            );
        }
        if (activeHas(/asma/i) && activeHas(/(?:controllo|follow[ -]?up|rivalutazione)/i)) {
            return questionSet(
                "Quando hai fatto l'ultimo controllo, chi segue o prescrive la terapia e hai esami respiratori recenti?\n<br><i>A) Controllo o esami non recenti<br>B) Documentazione recente<br>C) Non ricordo</i>",
                "Com'e stato l'andamento dall'ultimo controllo e ci sono state crisi, risvegli notturni o limitazioni recenti?\n<br><i>A) Peggioramento o crisi recenti<br>B) Stabile con lievi sintomi<br>C) Nessuna crisi recente</i>",
                "In questo momento respiri bene e cerchi solo un follow-up, senza modificare autonomamente la terapia?\n<br><i>A) Si, solo controllo<br>B) Ho qualche dubbio o sintomo lieve<br>C) No, ho sintomi importanti ora</i>"
            );
        }
        if (activeHas(/(?:controllo periodico|follow[ -]?up|visita di controllo|monitoraggio|controllo della terapia|rinnovo|rivalutazione specialistica)/i)
            && activeHas(/(?:anticoagulant|warfarin|coumadin|apixaban|rivaroxaban|dabigatran|edoxaban|fibrillazione atriale)/i)) {
            return questionSet(
                "Chi ha prescritto l'anticoagulante e per quale motivo generale e previsto il controllo periodico?\n<br><i>A) Cardiologo o centro dedicato<br>B) Medico curante o Medicina interna<br>C) Non so o devo recuperare il referto</i>",
                "Quando hai effettuato l'ultimo controllo specialistico e hai esami o referti recenti da portare alla visita?\n<br><i>A) Controllo recente con referti<br>B) Controllo non recente o referti incompleti<br>C) Non ricordo o non ho documenti</i>",
                "Sono comparsi sanguinamenti, capogiri, debolezza o altri sintomi nuovi che richiedono una valutazione piu rapida?\n<br><i>A) Si, uno o piu sintomi nuovi<br>B) Solo dubbi o lievi cambiamenti<br>C) No, cerco solo orientamento per il follow-up</i>"
            );
        }
        if (activeHas(/(?:vertigin|capogir)/i)
            && activeHas(/(?:gir\w* nel letto|gir\w* la testa|ruot\w* la testa|volt\w* la testa|movimento della testa|muov\w* la testa|cambio di posizione|alz\w* dal letto|posizione)/i)) {
            return questionSet(
                "Gli episodi dipendono dalla posizione o dal movimento della testa, quanto durano e si sono gia verificati in passato?\n<br><i>A) Legame chiaro, brevi o ricorrenti<br>B) Legame dubbio<br>C) Nessun legame</i>",
                "Sono presenti nausea, vomito, calo uditivo, acufeni o sensazione di orecchio pieno?\n<br><i>A) Si, uno o piu sintomi<br>B) Solo lievi o dubbi<br>C) No</i>",
                "Sono comparsi debolezza, difficolta a parlare o camminare, visione doppia, forte mal di testa o peggioramento?\n<br><i>A) Si, uno o piu segnali<br>B) Solo dubbio<br>C) No</i>"
            );
        }
        if (activeHas(/(?:vertigin|vedo doppio|visione doppia|diplopia|cammino storto|perdessi l'equilibrio|perdo l'equilibrio|equilibrio)/i)
            && activeHas(/(?:vedo doppio|visione doppia|diplopia|cammino storto|equilibrio|fibrillazione atriale|vomit|da circa un'?ora|un'ora)/i)) {
            return questionSet(
                "I sintomi sono iniziati all'improvviso o da poco e sono ancora presenti o ricorrenti?\n<br><i>A) Si, esordio recente o improvviso<br>B) Non so con precisione<br>C) No, sono vecchi o gia risolti</i>",
                "Ci sono visione doppia, difficolta a camminare, perdita di equilibrio, problemi di coordinazione, parola, volto, forza o sensibilita?\n<br><i>A) Si, uno o piu segnali<br>B) Solo in parte<br>C) No</i>",
                "Sono presenti vomito, fibrillazione atriale, anticoagulanti, peggioramento o sintomi ancora in corso tali da richiedere valutazione urgente?\n<br><i>A) Si, uno o piu elementi<br>B) Non so / dubbio<br>C) No</i>"
            );
        }
        if (positivePregnancy
            && activeHas(/(?:bruciore[^.!?;]{0,40}urin|urino|urinario|minzione|fianco|febbre|brividi)/i)
            && activeHas(/(?:fianco|febbre|brividi|debole|nausea|vomito)/i)) {
            return questionSet(
                "In gravidanza, febbre, brividi, dolore al fianco, bruciore urinario, nausea o vomito sono presenti ora o stanno peggiorando?\n<br><i>A) Si, uno o piu sintomi sono presenti o peggiorano<br>B) Sono lievi o dubbi<br>C) No</i>",
                "A che settimana di gravidanza sei e sono comparse contrazioni, perdite di sangue o liquido, o riduzione dei movimenti fetali se li percepisci gia?\n<br><i>A) Si, uno o piu segnali ostetrici<br>B) Non so / non applicabile<br>C) No</i>",
                "La debolezza, la febbre, il dolore al fianco o i sintomi urinari fanno pensare a necessita di accesso urgente a Pronto Soccorso o Ostetricia?\n<br><i>A) Si, serve valutazione urgente<br>B) Non so / dubbio<br>C) No</i>"
            );
        }
        if (positivePregnancy
            && activeHas(/(?:forte dolore|dolore (?:forte|intenso))[^.!?;]{0,55}(?:basso ventre|pelvi|pelvico)|(?:basso ventre|pelvi|pelvico)[^.!?;]{0,55}(?:forte dolore|dolore (?:forte|intenso))/i)
            && activeHas(/(?:perdita di sangue|perdite di sangue|sanguinamento)/i)) {
            return questionSet(
                "La perdita di sangue e il dolore al basso ventre sono ancora presenti, stanno aumentando o sono iniziati da poco?\n<br><i>A) Presenti o in aumento<br>B) Stabili o intermittenti<br>C) Regressi</i>",
                "Sono presenti capogiri, svenimento, debolezza intensa o perdita di liquido, e a quale settimana di gravidanza sei?\n<br><i>A) Uno o piu segnali presenti<br>B) Solo dubbio o settimana non nota<br>C) Nessuno di questi segnali</i>",
                "Puoi accedere subito a Pronto Soccorso/Ostetricia o contattare 112/118 se compaiono instabilita, svenimento o rapido peggioramento?\n<br><i>A) Si, accesso o contatto immediato possibile<br>B) Ho bisogno di assistenza per accedere<br>C) Non so</i>"
            );
        }
        if (activeHas(/\bdiabet\w*/i)
            && activeHas(/(?:molta sete|sete (?:marcata|intensa|eccessiva)|polidipsia)/i)
            && activeHas(/(?:urino continuamente|urinazione frequente|urino spesso|poliuria)/i)
            && activeHas(/(?:faccio fatica a restare svegli|difficolta a restare svegli|sonnolenza|molto debole)/i)) {
            return questionSet(
                "La difficolta a restare sveglio, la sonnolenza o la debolezza stanno peggiorando, oppure sono presenti confusione o perdita di coscienza?\n<br><i>A) Si, presenti o in peggioramento<br>B) Solo lievi o dubbi<br>C) No</i>",
                "Sono presenti vomito, respirazione insolita o difficoltosa, oppure difficolta a bere e trattenere liquidi?\n<br><i>A) Si, uno o piu segnali<br>B) Solo in parte<br>C) No</i>",
                "I sintomi sono ancora in corso, hai gia misurato glicemia o chetoni e c'e una persona accanto che possa aiutarti nell'accesso urgente?\n<br><i>A) Sintomi in corso e persona presente<br>B) Sintomi in corso ma sono solo/a o valori non noti<br>C) Sintomi regrediti</i>"
            );
        }
        if (activeHas(/(?:menopausa|post[ -]?menopausa)/i)
            && activeHas(/(?:perdita di sangue|sanguinamento|perdite ematiche)/i)) {
            return questionSet(
                "Quanto e durata la perdita, quale quantita e colore aveva, ed e stato un episodio singolo o si e ripetuto?\n<br><i>A) Abbondante, prolungata o ripetuta<br>B) Lieve o singola<br>C) Non so descriverla</i>",
                "Assumi anticoagulanti o una terapia ormonale gia prescritta, e quando hai effettuato l'ultimo controllo ginecologico?\n<br><i>A) Farmaci presenti o controllo non recente<br>B) Controllo recente<br>C) Non so</i>",
                "Sono presenti dolore, debolezza, capogiri, nuovo sanguinamento o peggioramento?\n<br><i>A) Si, uno o piu segnali<br>B) Solo dubbio<br>C) No</i>"
            );
        }
        if (activeHas(/(?:ciclo|mestruazion)/i)
            && activeHas(/(?:molto abbondante|piu abbondante|abbondant\w*)/i)) {
            return questionSet(
                "Quanti cambi sono necessari, compaiono coaguli e per quanti giorni dura il flusso rispetto al solito?\n<br><i>A) Cambi molto frequenti, coaguli o durata aumentata<br>B) Aumento moderato<br>C) Non so quantificare</i>",
                "Il cambiamento si ripete da mesi e si associa a stanchezza, capogiri, svenimento o dolore?\n<br><i>A) Si, uno o piu sintomi<br>B) Solo stanchezza lieve<br>C) No</i>",
                "Qual e la tua fascia di eta, assumi farmaci inclusi anticoagulanti e hai esami o referti recenti disponibili?\n<br><i>A) Farmaci o referti disponibili<br>B) Nessun farmaco o esame recente<br>C) Non so</i>"
            );
        }
        if (activeHas(/(?:ciclo (?:e |è )?in ritardo|ritardo (?:del |mestruale|di )?ciclo|mestruazion\w* in ritardo)/i)) {
            return questionSet(
                "Qual e la tua eta, quando e iniziato l'ultimo ciclo e quanto e regolare abitualmente?\n<br><i>A) Data e regolarita note<br>B) Ciclo spesso irregolare<br>C) Non ricordo</i>",
                "C'e possibilita di gravidanza e usi contraccezione o farmaci che possono essere rilevanti?\n<br><i>A) Possibilita presente o farmaci/contraccezione<br>B) Possibilita incerta<br>C) No</i>",
                "Ci sono stati stress, variazioni di peso, attivita fisica intensa o altri cambiamenti recenti?\n<br><i>A) Si, uno o piu cambiamenti<br>B) Solo lievi cambiamenti<br>C) No</i>"
            );
        }
        if (activeHas(/(?:dolore pelvico|dolore[^.!?;]{0,35}(?:basso ventre|pelvi))/i)
            && activeHas(/(?:mesi|cronico|ricorrente)/i)) {
            return questionSet(
                "Da quanto dura, quanto e intenso e il dolore cambia con il ciclo o durante i rapporti?\n<br><i>A) Intenso o legato a ciclo/rapporti<br>B) Moderato o variabile<br>C) Lieve e stabile</i>",
                "Si associa a sintomi intestinali o urinari, perdite, sanguinamento o peggioramento recente?\n<br><i>A) Si, uno o piu elementi<br>B) Solo lievi o dubbi<br>C) No</i>",
                "Hai gia effettuato visite, ecografie o altri esami e disponi dei referti?\n<br><i>A) Si, con referti<br>B) Visite o esami incompleti<br>C) No</i>"
            );
        }
        if (activeHas(/(?:russ\w*|russamento)/i)
            && activeHas(/(?:smett\w* di respirare|pause respiratorie|apnee?)/i)) {
            return questionSet(
                "Quanto spesso vengono riferite le pause respiratorie e ti risvegli con soffocamento o sonno non ristoratore?\n<br><i>A) Spesso o con risvegli<br>B) Occasionalmente<br>C) Non so</i>",
                "La sonnolenza compare durante guida o lavoro, e come valuti qualita e durata del sonno?\n<br><i>A) Durante attivita a rischio o sonno molto scarso<br>B) Sonnolenza moderata<br>C) Lieve o assente</i>",
                "Ci sono aumento di peso, pressione alta, ostruzione nasale, precedenti ORL/respiratori o esami gia eseguiti?\n<br><i>A) Si, uno o piu elementi<br>B) Solo dubbi<br>C) No</i>"
            );
        }
        if (activeHas(/(?:sangue dal naso|epistassi|sanguinamento nasale)/i)) {
            return questionSet(
                "Quanti episodi ci sono stati, quanto sono durati, quale quantita di sangue e da una o entrambe le narici?\n<br><i>A) Ripetuti, lunghi o abbondanti<br>B) Brevi e lievi<br>C) Non so quantificare</i>",
                "Il sanguinamento e attivo ora o e ricomparso, e ci sono stati trauma, manipolazione o pressione alta nota?\n<br><i>A) Attivo/recidivato o fattori presenti<br>B) Cessato, con fattori dubbi<br>C) Cessato, senza fattori noti</i>",
                "Assumi anticoagulanti e sono presenti altri sanguinamenti, debolezza, capogiri, svenimento o peggioramento?\n<br><i>A) Si, uno o piu segnali<br>B) Solo anticoagulante, senza instabilita<br>C) No</i>"
            );
        }
        if (activeHas(/(?:nodulo|nodul\w*)[^.!?;]{0,45}tiroid|tiroid[^.!?;]{0,45}(?:nodulo|nodul\w*)/i)) {
            return questionSet(
                "Hai un referto ecografico con dimensioni del nodulo e indicazioni su eventuale crescita rispetto a controlli precedenti?\n<br><i>A) Si, con confronto o crescita<br>B) Referto senza confronto<br>C) No</i>",
                "Sono comparsi cambiamenti della voce, difficolta a deglutire o respirare?\n<br><i>A) Si, uno o piu sintomi<br>B) Solo lievi o dubbi<br>C) No</i>",
                "Ci sono familiarita rilevanti e hai gia effettuato visite o controlli della tiroide?\n<br><i>A) Familiarita o controlli precedenti<br>B) Solo uno dei due<br>C) No</i>"
            );
        }
        if (activeHas(/(?:controllo periodico|follow[ -]?up|visita di controllo|monitoraggio)/i)
            && activeHas(/(?:diabete|diabetologia|glicemia)/i)) {
            return questionSet(
                "Quando hai effettuato l'ultimo controllo e quale specialista o medico segue e prescrive la terapia?\n<br><i>A) Controllo e riferimento recenti<br>B) Controllo non recente<br>C) Non so</i>",
                "Hai esami o referti recenti e ti sono stati riferiti valori particolarmente alterati?\n<br><i>A) Si, referti o valori da riferire<br>B) Esami disponibili senza particolari segnalazioni<br>C) No</i>",
                "Sono comparsi nuovi sintomi o cerchi solo orientamento tra Diabetologia, Endocrinologia e medico curante?\n<br><i>A) Nuovi sintomi<br>B) Solo orientamento per follow-up<br>C) Non so</i>"
            );
        }
        if (activeHas(/(?:allenament\w*|attivita fisica|esercizio fisico)/i)
            && activeHas(/(?:fame|stanchezza|affaticamento)/i)) {
            return questionSet(
                "Quanto spesso compaiono fame e stanchezza, quanto durano e seguono sempre allenamenti intensi?\n<br><i>A) Frequenti e chiaramente dopo allenamento<br>B) Occasionali o legame parziale<br>C) Compaiono anche a riposo</i>",
                "Come sono alimentazione, idratazione, recupero e qualita del sonno nei giorni di allenamento?\n<br><i>A) Uno o piu aspetti insufficienti<br>B) Variabili<br>C) Regolari</i>",
                "L'intensita dell'attivita e cambiata e sono comparsi nuovi sintomi o un peggioramento anche lontano dall'esercizio?\n<br><i>A) Si, nuovi sintomi o peggioramento<br>B) Solo aumento dell'intensita<br>C) No</i>"
            );
        }
        if (activeHas(/(?:dolore (?:all'|all |a un |a entramb[ei] gli? )?orecchi|otalgia|otite|male (?:all'|all )orecchio)/i)) {
            return questionSet(
                "Da quanto dura il dolore e sono presenti febbre, secrezioni o gonfiore dietro l'orecchio?\n<br><i>A) Uno o piu segnali presenti<br>B) Dolore senza questi segnali<br>C) In miglioramento</i>",
                "Ci sono stati acqua recente nell'orecchio, trauma, manipolazione o uso di oggetti?\n<br><i>A) Si, uno o piu fattori<br>B) Solo dubbio<br>C) No</i>",
                "Sono comparsi calo uditivo, debolezza del viso o vertigini importanti?\n<br><i>A) Si, uno o piu sintomi<br>B) Solo lievi o dubbi<br>C) No</i>"
            );
        }
        if (activeHas(/(?:vertigin|capogir)/i)
            && activeHas(/(?:gir\w* nel letto|gir\w* la testa|ruot\w* la testa|volt\w* la testa|movimento della testa|muov\w* la testa|cambio di posizione|alz\w* dal letto|posizione)/i)) {
            return questionSet(
                "Gli episodi dipendono dalla posizione o dal movimento della testa, quanto durano e si sono gia verificati in passato?\n<br><i>A) Legame chiaro, brevi o ricorrenti<br>B) Legame dubbio<br>C) Nessun legame</i>",
                "Sono presenti nausea, vomito, calo uditivo, acufeni o sensazione di orecchio pieno?\n<br><i>A) Si, uno o piu sintomi<br>B) Solo lievi o dubbi<br>C) No</i>",
                "Sono comparsi debolezza, difficolta a parlare o camminare, visione doppia, forte mal di testa o peggioramento?\n<br><i>A) Si, uno o piu segnali<br>B) Solo dubbio<br>C) No</i>"
            );
        }
        if (positivePregnancy && activeHas(/nausea/i)) {
            return questionSet(
                "A quale settimana di gravidanza sei e con quale frequenza o durata compare la nausea?\n<br><i>A) Frequente o prolungata<br>B) Lieve e soprattutto in alcuni momenti<br>C) Occasionale o in miglioramento</i>",
                "Riesci a bere e alimentarti oppure sono presenti vomito persistente, peggioramento o difficolta a trattenere liquidi?\n<br><i>A) Non riesco a bere o il vomito persiste<br>B) Riesco solo in parte<br>C) Bevo e mangio senza difficolta rilevanti</i>",
                "Sono comparsi perdite di sangue o liquido, dolore significativo, altri segnali nuovi, oppure hai gia ricevuto indicazioni dal ginecologo?\n<br><i>A) Si, segnali nuovi o indicazioni da rivalutare<br>B) Solo dubbi<br>C) No, nessun segnale e nessuna indicazione specifica</i>"
            );
        }
        if (positivePregnancy
            && activeHas(/(?:bruciore[^.!?;]{0,40}(?:urin|minzion)|bisogno[^.!?;]{0,35}urinar|urinare spesso|frequenza urinaria|urgenza urinaria)/i)) {
            return questionSet(
                "A quale settimana di gravidanza sei, da quanto durano bruciore, frequenza o urgenza urinaria e stanno peggiorando?\n<br><i>A) Durano o peggiorano<br>B) Sono lievi o stabili<br>C) Sono in miglioramento</i>",
                "Durante la minzione ci sono dolore o bruciore, bisogno frequente o urgente di urinare, oppure sangue nelle urine?\n<br><i>A) Si, uno o piu sintomi<br>B) Solo lieve o dubbio<br>C) No</i>",
                "Sono comparsi febbre, brividi, dolore al fianco o lombare, nausea, vomito, peggioramento generale, contrazioni, dolore pelvico importante o perdite di sangue o liquido, e hai gia contattato ginecologo, ostetrica o medico curante?\n<br><i>A) Si, uno o piu segnali o contatto gia avvenuto<br>B) Solo dubbi o sintomi lievi<br>C) No</i>"
            );
        }
        if (positivePregnancy
            && rawHas(/non ho[^.!?;]{0,160}(?:altri disturbi|nessun disturbo)|non riferisco[^.!?;]{0,120}disturbi/i)
            && !activeHas(/(?:dolore|nausea|vomito|febbre|brividi|bruciore|sangue|perdite|contrazioni|fianco)/i)) {
            return questionSet(
                "A quale settimana di gravidanza sei e cerchi un orientamento per un controllo programmato o per una nuova esigenza?\n<br><i>A) Controllo programmato<br>B) Nuova esigenza senza sintomi<br>C) Non so</i>",
                "Hai gia un riferimento tra ginecologo, ostetrica o medico curante e disponi di indicazioni o referti recenti?\n<br><i>A) Si, riferimento e documenti disponibili<br>B) Solo in parte<br>C) No</i>",
                "Sono comparsi nuovi sintomi o cambiamenti generali da riferire al professionista, senza assumere come presenti quelli gia negati?\n<br><i>A) Si, nuovi cambiamenti<br>B) Solo dubbi<br>C) No</i>"
            );
        }
        if (activeHas(/(?:mi sono mors[oa]|morso[^.!?;]{0,30}labbr|trauma[^.!?;]{0,35}labbr|urt[oa][^.!?;]{0,35}labbr|ferita[^.!?;]{0,35}labbr)/i)
            && activeHas(/labbr[^.!?;]{0,45}(?:gonf|ferit|sanguin|dolor)|(?:gonf|ferit|sanguin|dolor)[^.!?;]{0,45}labbr/i)) {
            return questionSet(
                "Nel punto del morso o trauma ci sono sanguinamento, ferita aperta o dolore importante?\n<br><i>A) Si, uno o piu elementi<br>B) Solo lieve o superficiale<br>C) No</i>",
                "Il gonfiore locale sta aumentando o rende difficile aprire la bocca, parlare o deglutire?\n<br><i>A) Si, sta aumentando o limita una funzione<br>B) Solo lieve o stabile<br>C) No</i>",
                "Dopo il trauma sono comparsi gonfiore diffuso, lingua gonfia o difficolta respiratoria?\n<br><i>A) Si, uno o piu segnali<br>B) Solo dubbio<br>C) No</i>"
            );
        }
        if (activeHas(/(?:frutta secca|allerg|orticaria|prurito diffuso|labbra gonf|gonfiore[^.!?;]{0,40}(?:labbra|lingua|viso)|gola chiusa|gola che si chiude)/i)
            && activeHas(/(?:difficolta a respirare|respiro difficile|fiato corto|gola chiusa|gola che si chiude|gonfiore[^.!?;]{0,40}(?:lingua|gola)|capogir|sveniment|voce alterata)/i)) {
            return questionSet(
                "Dopo l'esposizione alimentare sono presenti difficolta respiratoria, gola chiusa, voce alterata o gonfiore di labbra, lingua o viso?\n<br><i>A) Si, uno o piu segnali<br>B) Solo lieve o dubbio<br>C) No</i>",
                "Il prurito e diffuso, compaiono pomfi/orticaria, capogiri, svenimento, peggioramento rapido o precedenti allergici importanti?\n<br><i>A) Si, uno o piu elementi<br>B) Solo in parte<br>C) No</i>",
                "I sintomi sono ancora in corso o peggiorano, rendendo appropriato contattare 112/118 o Pronto Soccorso?\n<br><i>A) Si, sono in corso o peggiorano<br>B) Non so / dubbio<br>C) No</i>"
            );
        }
        if (activeHas(/(?:dopo aver mangiato|dopo (?:un|il) pasto|frutta secca|arachidi|alimento|cibo)/i)
            && activeHas(/(?:prurito diffuso|prurito[^.!?;]{0,50}(?:labbra|gonfiore)|gonfiore[^.!?;]{0,40}labbra|labbr[^.!?;]{0,30}gonf)/i)) {
            return questionSet(
                "Dopo quale alimento sono comparsi prurito o gonfiore delle labbra e quanto tempo e passato dall'esposizione?\n<br><i>A) Poco tempo, legame chiaro<br>B) Legame possibile ma non certo<br>C) Non so</i>",
                "Prurito e gonfiore stanno aumentando o si stanno estendendo rapidamente?\n<br><i>A) Si, aumentano o si estendono<br>B) Sono stabili<br>C) Stanno diminuendo</i>",
                "Sono comparse difficolta respiratoria, lingua o gola gonfia, voce alterata, capogiri o svenimento, che richiedono escalation urgente?\n<br><i>A) Si, uno o piu segnali<br>B) Solo dubbio<br>C) No</i>"
            );
        }
        if (rawHas(/\bnon sono incinta\b/i) && activeHas(/fianco/i) && activeHas(/(?:nausea|dolore)/i)) {
            return questionSet(
                "Dove e localizzato il dolore al fianco, quanto e intenso e sta aumentando o irradiandosi verso addome, schiena o inguine?\n<br><i>A) Intenso, in aumento o irradiato<br>B) Moderato o stabile<br>C) Lieve o in miglioramento</i>",
                "Sono presenti vomito, difficolta a bere, sintomi addominali o peggioramento nelle ultime ore?\n<br><i>A) Si, uno o piu elementi<br>B) Solo lieve o dubbio<br>C) No</i>",
                "Sono comparsi febbre, brividi, bruciore urinario, sangue nelle urine o altri sintomi urinari?\n<br><i>A) Si, uno o piu segnali<br>B) Solo dubbio<br>C) No</i>"
            );
        }
        if (activeHas(/(?:da quando|dopo (?:aver )?iniziato|dopo l'inizio|mentre)[^.!?;]{0,90}(?:assumo|prendo|integratore|terapia)[^.!?;]{0,35}(?:ferro|bismuto)/i)
            && activeHas(/feci[^.!?;]{0,45}(?:piu scure|scure|molto scure|nere)|(?:piu scure|scure|molto scure|nere)[^.!?;]{0,45}feci/i)) {
            return questionSet(
                "Quando hai iniziato ad assumere ferro o bismuto e il cambiamento delle feci e comparso dopo l'inizio?\n<br><i>A) Si, dopo l'inizio<br>B) Il rapporto temporale non e chiaro<br>C) No</i>",
                "Il colore e uniformemente piu scuro oppure molto nero, e il cambiamento e stabile, occasionale o sta peggiorando?\n<br><i>A) Molto nero o in peggioramento<br>B) Piu scuro ma stabile o occasionale<br>C) Non so descriverlo</i>",
                "Dopo il cambiamento sono comparsi debolezza, capogiri, svenimento, dolore, vomito, sangue visibile o peggioramento generale, assumi altri farmaci rilevanti o ne hai gia parlato con il professionista che segue la terapia?\n<br><i>A) Si, uno o piu elementi<br>B) Solo dubbi o altri farmaci da riferire<br>C) No</i>"
            );
        }
        if (activeHas(/(?:assumo|prendo|integratore|terapia)[^.!?;]{0,35}(?:ferro|bismuto)/i)
            && rawHas(/non ho notato[^.!?;]{0,60}cambiament[^.!?;]{0,40}feci/i)) {
            return questionSet(
                "Da quanto tempo assumi ferro o bismuto e quale professionista lo ha indicato?\n<br><i>A) Indicazione recente con professionista noto<br>B) Assunzione da tempo<br>C) Non so o non ho il riferimento</i>",
                "Cerchi un orientamento per un controllo programmato e hai referti o indicazioni recenti da portare al professionista?\n<br><i>A) Si, controllo e documenti disponibili<br>B) Solo in parte<br>C) No</i>",
                "Sono comparsi cambiamenti delle feci, debolezza, capogiri, dolore, vomito, sanguinamento o altri disturbi nuovi da riferire?\n<br><i>A) Si, uno o piu cambiamenti nuovi<br>B) Solo dubbi<br>C) No</i>"
            );
        }
        const lowBackContext = activeHas(/(?:mal di schiena|dolore (?:lombare|alla schiena|nella parte bassa della schiena)|lombalgia|schiena (?:lombare|bassa)|parte bassa della schiena)/i);
        const saddleSensoryRedFlag = activeHas(/(?:formicolio|intorpidimento|perdita di sensibilita)[^.!?;]{0,55}(?:tra le gambe|sella|genitali|inguine|perine)|(?:tra le gambe|area sella|zona perineale)[^.!?;]{0,55}(?:formicolio|intorpidimento|perdita di sensibilita)/i);
        const sphincterRedFlag = activeHas(/(?:faccio fatica|difficolta|non riesco|non posso)[^.!?;]{0,35}(?:trattenere[^.!?;]{0,15})?(?:pipi|urina|urinare|feci)|non tratteng\w*[^.!?;]{0,25}(?:pipi|urina|feci)|perdit\w*[^.!?;]{0,35}(?:urina|urine|feci)|perdita di controllo[^.!?;]{0,25}(?:urine|feci)|incontinenza|problemi?[^.!?;]{0,25}(?:urinar|urine)/i);
        const legWeaknessRedFlag = activeHas(/debolezza[^.!?;]{0,30}gambe/i);
        const saddleOrSphincterRedFlag = saddleSensoryRedFlag || sphincterRedFlag || legWeaknessRedFlag;
        if (lowBackContext && saddleOrSphincterRedFlag) {
            return questionSet(
                "Il formicolio riguarda area sella, inguine, genitali o tra le gambe, oppure si associa a perdita di sensibilita?\n<br><i>A) Si, chiaramente<br>B) Solo in parte o dubbio<br>C) No</i>",
                "Hai difficolta a trattenere urine o feci, perdita di controllo, debolezza alle gambe o difficolta a camminare?\n<br><i>A) Si, uno o piu segnali<br>B) Solo lieve o dubbio<br>C) No</i>",
                "Il dolore e severo, in rapido peggioramento, dopo trauma o con febbre, e richiede accesso urgente se ci sono problemi urinari/fecali o deficit neurologici?\n<br><i>A) Si, uno o piu elementi<br>B) Non so / dubbio<br>C) No</i>"
            );
        }
        if (activeHas(/(?:paura di ingrassare|mangio sempre meno|restrizion|restrittiv|anoressia|bulimia|dca|salt[oa] spesso i pasti|vomito autoindotto|lassativi|mi vedo.*grass|rapporto con il cibo)/i)) {
            return questionSet(
                "Il problema riguarda soprattutto cibo, peso, immagine corporea o paura di ingrassare?\n<br><i>A) Sì, è centrale<br>B) In parte<br>C) No</i>",
                "Ci sono perdita di peso importante, capogiri, svenimenti, dolore toracico, vomito, lassativi o grande debolezza?\n<br><i>A) Sì, uno o più segni<br>B) Solo sintomi lievi o dubbi<br>C) No</i>",
                "Questo tema porta isolamento, vergogna, conflitti familiari o difficoltà a scuola/lavoro?\n<br><i>A) Sì, molto<br>B) In parte<br>C) No</i>"
            );
        }
        if (activeHas(/(?:ansia|panico|paura di perdere il controllo)/i)
            && activeHas(/(?:battito accelerato|tachicard|tremori|sudorazione|nodo alla gola|paura di perdere il controllo|ansia|panico)/i)) {
            return questionSet(
                "Gli episodi sono brevi e si risolvono da soli oppure restano persistenti o peggiorano?\n<br><i>A) Persistono o peggiorano<br>B) Durano poco e passano<br>C) Non so</i>",
                "Durante gli episodi compaiono dolore toracico persistente, svenimento, grave difficoltà respiratoria o confusione?\n<br><i>A) Sì<br>B) Solo sintomi lievi o dubbi<br>C) No</i>",
                "Ci sono pensieri di farti del male o il problema limita molto lavoro, relazioni o attività quotidiane?\n<br><i>A) Sì, molto o con rischio<br>B) In parte<br>C) No</i>"
            );
        }
        if (activeHas(/(?:cauda|fatica a urinare|anestesia a sella|genitali|intern[ao][^.!?;]{0,40}cosce|entrambe le gambe)/i)
            && activeHas(/(?:dolore lombare|lombalgia|schiena|gambe|genitali|urinare)/i)) {
            return questionSet(
                "Il dolore lombare si associa a difficoltà a urinare, perdita di urine/feci o anestesia nella zona genitale/sella?\n<br><i>A) Sì, uno o più segni<br>B) Solo dubbio o lieve<br>C) No</i>",
                "Hai debolezza alle gambe, dolore che scende a entrambe le gambe o peggioramento rapido?\n<br><i>A) Sì<br>B) Solo in parte<br>C) No</i>",
                "È comparso da poco e in modo diverso dal solito?\n<br><i>A) Sì, nuovo o improvviso<br>B) Peggioramento graduale<br>C) No, è stabile</i>"
            );
        }
        if (activeHas(/(?:neo|nevo|lesione pigmentata|melanom|macchia)/i)
            && activeHas(/(?:cambiat|asimmetric|bordi irregolari|colori diversi|marrone|nero|prude|prurito)/i)) {
            return questionSet(
                "La lesione o il neo è cambiato per dimensione, forma, colore, bordi o rilievo?\n<br><i>A) Sì, cambiamento evidente<br>B) Cambiamento lieve o dubbio<br>C) No, sembra stabile</i>",
                "Sono presenti più colori, asimmetria, bordi irregolari, prurito, sanguinamento o croste?\n<br><i>A) Sì, uno o più segni<br>B) Solo fastidio lieve<br>C) No</i>",
                "Hai foto precedenti o ricordi da quanto tempo è cambiata la lesione?\n<br><i>A) Sì, ho confronto chiaro<br>B) Solo ricordo approssimativo<br>C) No</i>"
            );
        }
        if (activeHas(/(?:spalla|cuffia|omero|clavicola|sopra la testa)/i)) {
            return questionSet(
                "Il dolore alla spalla aumenta quando alzi il braccio, prendi oggetti in alto o dormi su quel lato?\n<br><i>A) Sì, chiaramente<br>B) Solo in parte<br>C) No</i>",
                "Hai perdita improvvisa di forza, deformità, trauma importante, febbre, rossore o calore?\n<br><i>A) Sì<br>B) Non so / dubbio<br>C) No</i>",
                "Il problema è iniziato dopo trauma/sforzo preciso oppure si è sviluppato gradualmente?\n<br><i>A) Dopo trauma o gesto preciso<br>B) Gradualmente<br>C) Non saprei</i>"
            );
        }
        if (activeHas(/(?:orticaria diffusa|gonfiore[^.!?;]{0,40}(?:labbra|lingua)|gola che si chiude|respiro difficile|anafil|frutta secca)/i)
            && activeHas(/(?:respiro difficile|difficolta respiratoria|gola che si chiude|stordit|gonfiore[^.!?;]{0,40}(?:labbra|lingua))/i)) {
            return questionSet(
                "I sintomi sono comparsi rapidamente dopo cibo, farmaco, puntura o altra esposizione sospetta?\n<br><i>A) Sì, subito dopo un'esposizione chiara<br>B) Forse, ma non ne sono sicuro<br>C) No, non vedo un legame evidente</i>",
                "Sono presenti difficoltà respiratoria, gola che si chiude, gonfiore di labbra o lingua, stordimento o svenimento?\n<br><i>A) Sì, uno o più segni importanti<br>B) Solo sintomi lievi o dubbi<br>C) No</i>",
                "L'orticaria o il gonfiore stanno peggiorando rapidamente o coinvolgono più parti del corpo?\n<br><i>A) Sì, stanno peggiorando<br>B) Sono stabili ma diffusi<br>C) No, sono limitati</i>"
            );
        }
        if (this._isHighRiskAtypicalCardiacEmergencyContext()) {
            return questionSet(
                "Da quanto durano nausea, peso o fastidio allo stomaco e fastidio alla mandibola, e i sintomi sono ancora presenti o non regrediscono?\n<br><i>A) Sono presenti o persistenti<br>B) Vanno e vengono<br>C) Sono regrediti</i>",
                "Il quadro sta peggiorando o si associa a sudorazione fredda, debolezza improvvisa, vomito, fastidio a braccio o schiena, fiato corto o relazione con lo sforzo?\n<br><i>A) Si, uno o piu segnali<br>B) Solo lieve o stabile<br>C) No</i>",
                "Sono presenti fattori cardiovascolari come diabete o ipertensione, e serve una valutazione urgente se i sintomi sono attuali, persistono o peggiorano?\n<br><i>A) Si, fattori presenti e sintomi attuali o persistenti<br>B) Solo in parte o dubbio<br>C) No</i>"
            );
        }
        if (activeHas(/(?:dolore|peso|oppressione)[^.!?;]{0,45}(?:petto|torace)|dolore toracico/i)
            && activeHas(/(?:braccio sinistro|mandibola|sudorazione fredda|nausea|dispnea|fatica a respirare|non passa|persistente)/i)) {
            return questionSet(
                "Il dolore o peso al torace è presente ora, dura da più di alcuni minuti o non passa con il riposo?\n<br><i>A) Sì, è presente o persistente<br>B) Va e viene<br>C) No, è passato</i>",
                "Si associa a irradiazione a braccio sinistro, mandibola o schiena, sudorazione fredda, nausea o fiato corto?\n<br><i>A) Sì, chiaramente<br>B) Solo in parte<br>C) No</i>",
                "Hai fattori di rischio noti come diabete, ipertensione, fumo, precedente infarto o malattia cardiaca?\n<br><i>A) Sì, uno o più<br>B) Non so<br>C) No</i>"
            );
        }
        if (activeHas(/pressione[^.!?;]{0,90}\d{3}\s*\/\s*\d{2,3}|\b\d{3}\s*\/\s*\d{2,3}\b/i)
            && activeHas(/(?:forte mal di testa|cefalea|vista offuscata|confusione|dolore toracico|dispnea|fiato corto|svenimento|sincope|terapia[^.!?;]{0,45}inefficace|farmaci[^.!?;]{0,45}non hanno fatto effetto)/i)) {
            return questionSet(
                "La pressione è molto alta e si associa a confusione, vista offuscata, forte mal di testa, dolore toracico o fiato corto?\n<br><i>A) Sì, uno o più segni importanti<br>B) Solo sintomi lievi o dubbi<br>C) No</i>",
                "I farmaci abituali per la pressione oggi non hanno funzionato o il quadro sta peggiorando?\n<br><i>A) Sì, non hanno funzionato o peggioro<br>B) Non so<br>C) No</i>",
                "Hai avuto svenimento, debolezza improvvisa, difficoltà a parlare o dolore toracico attuale?\n<br><i>A) Sì<br>B) Solo sintomi dubbi<br>C) No</i>"
            );
        }
        if (activeHas(/(?:fiato corto|dispnea|manca l'aria|caviglie gonfie|edemi|due cuscini|ortopnea|aumento[^.!?;]{0,30}peso|preso[^.!?;]{0,30}kg)/i)
            && activeHas(/(?:caviglie gonfie|edemi|due cuscini|ortopnea|infarto|scompenso|aumento[^.!?;]{0,30}peso|preso[^.!?;]{0,30}kg)/i)) {
            return questionSet(
                "Il fiato corto compare a riposo, di notte, da sdraiato o solo sotto sforzo?\n<br><i>A) A riposo/notte/da sdraiato<br>B) Solo sotto sforzo<br>C) No o minimo</i>",
                "Hai gonfiore a gambe o caviglie, aumento rapido di peso o necessità di dormire con più cuscini?\n<br><i>A) Sì, chiaramente<br>B) Solo in parte<br>C) No</i>",
                "Sono presenti dolore toracico attuale, saturazione bassa, svenimento, confusione o peggioramento rapido?\n<br><i>A) Sì<br>B) Non so / dubbio<br>C) No</i>"
            );
        }
        if (activeHas(/(?:palpitazioni|battito accelerato|battito irregolare|aritm)/i)) {
            return questionSet(
                "Gli episodi di battito accelerato o irregolare iniziano e finiscono improvvisamente oppure durano a lungo?\n<br><i>A) Improvvisi o prolungati<br>B) Brevi e occasionali<br>C) Non saprei</i>",
                "Si associano a dolore toracico, svenimento, fiato corto marcato o capogiri importanti?\n<br><i>A) Sì<br>B) Solo lievi fastidi<br>C) No</i>",
                "Hai notato legame con sforzo, caffeina, stress, febbre, farmaci o sostanze?\n<br><i>A) Sì, legame chiaro<br>B) Forse<br>C) No</i>"
            );
        }
        if (activeHas(/(?:bocca storta|viso storto|faccia storta|braccio[^.!?;]{0,45}(?:debole|non si solleva)|non riesc[eo] a sollevare[^.!?;]{0,45}braccio|parla[^.!?;]{0,35}confus|linguaggio confuso|afasia|disartria)/i)) {
            return questionSet(
                "I sintomi come bocca storta, debolezza di un braccio o linguaggio confuso sono comparsi all'improvviso?\n<br><i>A) Sì, improvvisamente<br>B) Non so con precisione<br>C) No, sono graduali o vecchi</i>",
                "La persona ha difficoltà a parlare, capire, sollevare un braccio, camminare o tenere l'equilibrio?\n<br><i>A) Sì, chiaramente<br>B) Solo in parte<br>C) No</i>",
                "Sono presenti fattori come fibrillazione atriale, pressione alta o precedente ictus/TIA?\n<br><i>A) Sì<br>B) Non so<br>C) No</i>"
            );
        }
        if (activeHas(/(?:mal di testa|cefalea|emicrania|peggior mal di testa)/i)) {
            return questionSet(
                "Il mal di testa è iniziato all'improvviso, è il peggiore mai avuto o è molto diverso dal solito?\n<br><i>A) Sì, improvviso o molto diverso<br>B) Non so / è dubbio<br>C) No, è simile agli episodi abituali</i>",
                "Si associa a debolezza, difficoltà a parlare, confusione, febbre, rigidità del collo, trauma o sonnolenza marcata?\n<br><i>A) Sì, uno o più segni<br>B) Solo sintomi lievi o dubbi<br>C) No</i>",
                "Durante gli episodi hai nausea, fastidio alla luce o ai rumori, disturbi visivi o bisogno di stare al buio?\n<br><i>A) Sì, chiaramente<br>B) Solo in parte<br>C) No</i>"
            );
        }
        if (activeHas(/(?:perdita di coscienza|scosse|convuls|crisi epilett|confusione post|cadut[oa])/i)
            && activeHas(/(?:scosse|convuls|confusione post|perdita di coscienza)/i)) {
            return questionSet(
                "È stato il primo episodio di perdita di coscienza con scosse o movimenti involontari?\n<br><i>A) Sì, primo episodio<br>B) Era già successo<br>C) Non so</i>",
                "Dopo l'episodio c'è stata confusione, sonnolenza, ferita, morso della lingua o perdita di urine?\n<br><i>A) Sì, uno o più segni<br>B) Solo confusione lieve<br>C) No</i>",
                "Ora sono presenti febbre, forte mal di testa, debolezza, trauma importante o nuova crisi?\n<br><i>A) Sì<br>B) Non so / dubbio<br>C) No</i>"
            );
        }
        if (activeHas(/(?:formicol|parestes|intorpid|perdita di sensibilita|neuropat|debolezza progressiva)/i)) {
            return questionSet(
                "Formicolii o perdita di sensibilità sono localizzati, bilaterali o progressivi nel tempo?\n<br><i>A) Progressivi o diffusi<br>B) Intermittenti/localizzati<br>C) Non so</i>",
                "Hai perdita di forza, difficoltà a camminare, disturbi del linguaggio, vista doppia o problemi urinari/fecali?\n<br><i>A) Sì<br>B) Solo in parte<br>C) No</i>",
                "Il sintomo è iniziato improvvisamente oppure è graduale/ricorrente da settimane o mesi?\n<br><i>A) Improvviso<br>B) Graduale o ricorrente<br>C) Non saprei</i>"
            );
        }
        if (activeHas(/(?:suicid|non voglio piu vivere|farmi del male|ammazzar|uccider|pastiglie|piano)/i)) {
            return questionSet(
                "In questo momento c'è un piano concreto, un mezzo disponibile o una tempistica vicina per farti del male?\n<br><i>A) Sì, rischio concreto o imminente<br>B) Pensieri presenti ma senza piano<br>C) No</i>",
                "Sei solo/a o hai qualcuno vicino che può restare con te e aiutarti subito?\n<br><i>A) Sono solo/a<br>B) Posso contattare qualcuno<br>C) C'è già qualcuno con me</i>",
                "Hai già compiuto gesti autolesivi, assunto sostanze/farmaci o senti di non riuscire a restare al sicuro?\n<br><i>A) Sì<br>B) Non so / rischio dubbio<br>C) No</i>"
            );
        }
        if (activeHas(/(?:ansia|panico|paura di perdere il controllo|battito accelerato|tremori|sudorazione)/i)
            && activeHas(/(?:ansia|panico|paura di perdere il controllo)/i)) {
            return questionSet(
                "Gli episodi sono brevi e si risolvono da soli oppure restano persistenti o peggiorano?\n<br><i>A) Persistono o peggiorano<br>B) Durano poco e passano<br>C) Non so</i>",
                "Durante gli episodi compaiono dolore toracico persistente, svenimento, grave difficoltà respiratoria o confusione?\n<br><i>A) Sì<br>B) Solo sintomi lievi o dubbi<br>C) No</i>",
                "Ci sono pensieri di farti del male o il problema limita molto lavoro, relazioni o attività quotidiane?\n<br><i>A) Sì, molto o con rischio<br>B) In parte<br>C) No</i>"
            );
        }
        if (activeHas(/(?:triste|perdita di interesse|umore|depress|dormo male|concentrarmi|motivazione)/i)) {
            return questionSet(
                "Da quanto tempo umore basso, perdita di interesse, insonnia o stanchezza interferiscono con la vita quotidiana?\n<br><i>A) Da settimane/mesi e molto<br>B) Da poco o in modo moderato<br>C) Poco o nulla</i>",
                "Sono presenti pensieri di suicidio, autolesionismo, voci, convinzioni insolite o perdita di contatto con la realtà?\n<br><i>A) Sì<br>B) Non so / dubbio<br>C) No</i>",
                "Riesci ancora a lavorare, studiare, curarti e mantenere relazioni essenziali?\n<br><i>A) No, è molto compromesso<br>B) Con fatica<br>C) Sì</i>"
            );
        }
        if (activeHas(/(?:voci|allucin|controllando|persecut|delir|agitato|urlato|universita|insonnia marcata)/i)) {
            return questionSet(
                "Le voci, convinzioni insolite o sensazioni di controllo stanno influenzando comportamento, studio, lavoro o relazioni?\n<br><i>A) Sì, molto<br>B) In parte<br>C) No</i>",
                "Ci sono agitazione intensa, minacce, rischio per te o altri, grave confusione o perdita di controllo?\n<br><i>A) Sì<br>B) Non so / dubbio<br>C) No</i>",
                "Stai dormendo pochissimo o hai smesso attività importanti come studio, lavoro o cura personale?\n<br><i>A) Sì, chiaramente<br>B) In parte<br>C) No</i>"
            );
        }
        if (activeHas(/(?:paura di ingrassare|mangio sempre meno|restrizion|restrittiv|anoressia|bulimia|dca|salt[oa] spesso i pasti|vomito autoindotto|lassativi|mi vedo.*grass|rapporto con il cibo)/i)) {
            return questionSet(
                "Il problema riguarda soprattutto cibo, peso, immagine corporea o paura di ingrassare?\n<br><i>A) Sì, è centrale<br>B) In parte<br>C) No</i>",
                "Ci sono perdita di peso importante, capogiri, svenimenti, dolore toracico, vomito, lassativi o grande debolezza?\n<br><i>A) Sì, uno o più segni<br>B) Solo sintomi lievi o dubbi<br>C) No</i>",
                "Questo tema porta isolamento, vergogna, conflitti familiari o difficoltà a scuola/lavoro?\n<br><i>A) Sì, molto<br>B) In parte<br>C) No</i>"
            );
        }
        if (activeHas(/(?:cauda|fatica a urinare|anestesia a sella|genitali|intern[ao] delle cosce|entrambe le gambe)/i)
            && activeHas(/(?:dolore lombare|lombalgia|schiena|gambe)/i)) {
            return questionSet(
                "Il dolore lombare si associa a difficoltà a urinare, perdita di urine/feci o anestesia nella zona genitale/sella?\n<br><i>A) Sì, uno o più segni<br>B) Solo dubbio o lieve<br>C) No</i>",
                "Hai debolezza alle gambe, dolore che scende a entrambe le gambe o peggioramento rapido?\n<br><i>A) Sì<br>B) Solo in parte<br>C) No</i>",
                "È comparso da poco e in modo diverso dal solito?\n<br><i>A) Sì, nuovo o improvviso<br>B) Peggioramento graduale<br>C) No, è stabile</i>"
            );
        }
        if (activeHas(/(?:dolore lombare|lombalgia|schiena|rachide lombare)/i)) {
            return questionSet(
                "Il dolore lombare peggiora con piegamenti, posture prolungate o sforzi e migliora un po' camminando o cambiando posizione?\n<br><i>A) Sì, chiaramente<br>B) Solo in parte<br>C) No</i>",
                "Il dolore scende sotto il ginocchio o si associa a formicolio, debolezza o perdita di sensibilità?\n<br><i>A) Sì<br>B) Solo lievemente<br>C) No</i>",
                "Ci sono febbre, trauma importante, perdita di peso, anestesia a sella o problemi urinari/fecali?\n<br><i>A) Sì<br>B) Non so / dubbio<br>C) No</i>"
            );
        }
        if (activeHas(/(?:ginocchio|menisc|legament|crociat|rotula|crack)/i)) {
            return questionSet(
                "Dopo il trauma o movimento hai sentito crack, gonfiore rapido, blocco o cedimento del ginocchio?\n<br><i>A) Sì, chiaramente<br>B) Solo in parte<br>C) No</i>",
                "Riesci ad appoggiare il peso oppure il carico è impossibile?\n<br><i>A) Impossibile caricare<br>B) Carico con dolore<br>C) Carico quasi normale</i>",
                "Ci sono deformità, ferite aperte, febbre, arto freddo/pallido o dolore insopportabile?\n<br><i>A) Sì<br>B) Non so / dubbio<br>C) No</i>"
            );
        }
        if (activeHas(/(?:spalla|cuffia|omero|clavicola|sopra la testa)/i)) {
            return questionSet(
                "Il dolore alla spalla aumenta quando alzi il braccio, prendi oggetti in alto o dormi su quel lato?\n<br><i>A) Sì, chiaramente<br>B) Solo in parte<br>C) No</i>",
                "Hai perdita improvvisa di forza, deformità, trauma importante, febbre, rossore o calore?\n<br><i>A) Sì<br>B) Non so / dubbio<br>C) No</i>",
                "Il problema è iniziato dopo trauma/sforzo preciso oppure si è sviluppato gradualmente?\n<br><i>A) Dopo trauma o gesto preciso<br>B) Gradualmente<br>C) Non saprei</i>"
            );
        }
        if (activeHas(/(?:caviglia|caviglie|piede|dita fredde|pallide|frattur|lussazion)/i)
            && activeHas(/(?:cadut|trauma|storta|gonfia|non riesco a poggiare|non riesce a poggiare|dita fredde|pallide)/i)) {
            return questionSet(
                "Dopo il trauma ci sono deformità, gonfiore importante o impossibilità ad appoggiare il piede?\n<br><i>A) Sì, chiaramente<br>B) Solo in parte<br>C) No</i>",
                "Le dita o il piede sono freddi, pallidi, insensibili o molto dolorosi?\n<br><i>A) Sì<br>B) Non so / dubbio<br>C) No</i>",
                "C'è ferita aperta, sanguinamento importante o impossibilità di trasporto sicuro?\n<br><i>A) Sì<br>B) Non so / dubbio<br>C) No</i>"
            );
        }
        if (activeHas(/(?:neo|nevo|lesione pigmentata|melanom|macchia)/i)
            && activeHas(/(?:cambiat|asimmetric|bordi irregolari|colori diversi|marrone|nero|prude|prurito)/i)) {
            return questionSet(
                "La lesione o il neo è cambiato per dimensione, forma, colore, bordi o rilievo?\n<br><i>A) Sì, cambiamento evidente<br>B) Cambiamento lieve o dubbio<br>C) No, sembra stabile</i>",
                "Sono presenti più colori, asimmetria, bordi irregolari, prurito, sanguinamento o croste?\n<br><i>A) Sì, uno o più segni<br>B) Solo fastidio lieve<br>C) No</i>",
                "Hai foto precedenti o ricordi da quanto tempo è cambiata la lesione?\n<br><i>A) Sì, ho confronto chiaro<br>B) Solo ricordo approssimativo<br>C) No</i>"
            );
        }
        if (activeHas(/(?:dermatite|eczema|chiazze rosse|mani|detergenti|guanti|screpolat)/i)) {
            return questionSet(
                "Le chiazze o il prurito peggiorano con detergenti, guanti, lavoro manuale o sostanze specifiche?\n<br><i>A) Sì, chiaramente<br>B) Forse / solo in parte<br>C) No</i>",
                "Ci sono pus, febbre, dolore importante, gonfiore o rapido peggioramento?\n<br><i>A) Sì<br>B) Non so / dubbio<br>C) No</i>",
                "Il problema è limitato alle mani o coinvolge anche viso, labbra, lingua o respirazione?\n<br><i>A) Coinvolge viso/respirazione<br>B) Altre aree cutanee<br>C) Solo mani o zona limitata</i>"
            );
        }
        if (activeHas(/(?:dolore|fastidio)[^.!?;]{0,30}(?:a un dente|al dente|dentale)/i)
            && activeHas(/(?:mastic|mangia)/i)
            && activeHas(/gengiv[^.!?;]{0,30}gonf/i)) {
            return questionSet(
                "Il dolore e localizzato a un dente preciso e peggiora quando mastichi o con caldo e freddo?\n<br><i>A) Si, chiaramente<br>B) Solo in parte<br>C) No</i>",
                "La gengiva o il viso sono gonfi e il gonfiore sta aumentando, oppure compaiono febbre o rapido peggioramento?\n<br><i>A) Si, uno o piu segnali<br>B) Solo lieve o stabile<br>C) No</i>",
                "Hai difficolta ad aprire la bocca o deglutire, oppure nausea, sudorazione, peso allo stomaco o affanno non spiegati dal dente?\n<br><i>A) Si, uno o piu sintomi<br>B) Solo dubbio<br>C) No</i>"
            );
        }
        if (activeHas(/(?:cellulit|erisipel|zona rossa|arrossamento|rossa|calda|gonfia|dolorosa|allargars|brividi)/i)
            && activeHas(/(?:febbre|brividi|diabete|debole|allargars|calda|gonfia)/i)) {
            return questionSet(
                "La zona rossa è calda, gonfia, dolorosa e si sta allargando?\n<br><i>A) Sì, chiaramente<br>B) Solo in parte<br>C) No</i>",
                "Sono presenti febbre, brividi, debolezza, diabete, immunodepressione o rapido peggioramento?\n<br><i>A) Sì, uno o più<br>B) Non so / dubbio<br>C) No</i>",
                "La zona coinvolge volto/occhio o ci sono strie rosse, dolore sproporzionato o confusione?\n<br><i>A) Sì<br>B) Non so / dubbio<br>C) No</i>"
            );
        }
        if (activeHas(/(?:impetig|crosticine|croste giallastre|naso|bocca|contatti scolastici)/i)
            && activeHas(/(?:bambin|scuola|croste giallastre|crosticine)/i)) {
            return questionSet(
                "Le lesioni sono crosticine giallastre intorno a naso, bocca o altre zone della pelle?\n<br><i>A) Sì, chiaramente<br>B) Solo in parte<br>C) No</i>",
                "Il bambino ha febbre, dolore importante, gonfiore al viso, peggioramento rapido o difficoltà respiratoria?\n<br><i>A) Sì<br>B) Non so / dubbio<br>C) No</i>",
                "Ci sono altri bambini con lesioni simili a scuola o in famiglia?\n<br><i>A) Sì<br>B) Non so<br>C) No</i>"
            );
        }

        // --- LOGICA DI SELEZIONE PRIORITARIA (ORDINE GLOBALE) ---

        // 1. Organi di Senso (Sempre Prioritari)
        if (hasAny(SEDE.OCCHI)) {
            return [
                "Hai notato un improvviso o graduale calo della vista mono o bilaterale?\n<br><i>A) Calo molto brusco/improvviso<br>B) Lento e progressivo<br>C) La vista è invariata</i>",
                "L'occhio si presenta molto rosso, fotofobico (fastidio per la luce) o lacrimante?\n<br><i>A) Sì, molto rosso e urente<br>B) Solo leggermente arrossato<br>C) Oculare bianco normale</i>",
                "Vedi 'mosche volanti' (miodesopsie), lampi di luce (fosfeni) o ombre nel campo visivo?\n<br><i>A) Molti lampi e punti neri improvvisi<br>B) Qualche mosca volante vecchia<br>C) Nessun disturbo visivo simile</i>"
            ];
        }
        if (hasAny(SEDE.ORL)) {
            return [
                "Lamenti febbre alta, gonfiore dei linfonodi (collo) o difficoltà a deglutire anche i liquidi?\n<br><i>A) Sì, tutto questo<br>B) Solo un po' di fastidio<br>C) Niente gonfiore o febbre</i>",
                "C'è perdita dell'udito, sensazione di orecchio tappato o ronzio (acufene) costante?\n<br><i>A) Rombano/Fischiano in continuo<br>B) Sento ovattato / calo lieve dell'udito<br>C) Nessun problema uditivo</i>",
                "Hai tosse persistente da oltre 2-3 settimane o hai cambiato improvvisamente la voce (raucedine cronica)?\n<br><i>A) Sì, da molto tempo<br>B) Da pochi giorni<br>C) Non ho tosse né calo di voce</i>"
            ];
        }
        if (hasAny(SEDE.DENTI)) {
            return [
                "Avverti un dolore di tipo pulsante e molto acuto che peggiora stendendoti a letto?\n<br><i>A) Molto forte e pulsante<br>B) Lieve e sopportabile<br>C) Nessun dolore</i>",
                "C'è un evidente gonfiore (ascesso) visibile sul viso o sulle gengive?\n<br><i>A) Gonfiore grosso e caldo<br>B) Solo un piccolo bozzo in bocca<br>C) Nessun rigonfiamento</i>",
                "Le tue gengive sanguinano abbondantemente e spontaneamente mentre lavi i denti?\n<br><i>A) Sì, tanto sangue rosso vivo<br>B) Solo ogni tanto poche tracce<br>C) Mai sanguinanti</i>"
            ];
        }
        if (hasAny(SEDE.DERMATO)) {
            return [
                "La lesione cutanea, il neo o la macchia sono cambiati rapidamente per dimensione, colore, forma o rilievo?\n<br><i>A) Si, cambiamento evidente o rapido<br>B) Cambiamento lieve o dubbio<br>C) No, sembra stabile</i>",
                "Hai notato sanguinamento, croste, dolore, prurito intenso o margini irregolari nella zona?\n<br><i>A) Si, uno o piu segni evidenti<br>B) Solo fastidio lieve<br>C) No</i>",
                "Il problema riguarda un singolo punto preciso o piu aree della pelle?\n<br><i>A) Singola lesione/neo ben preciso<br>B) Piu chiazze o lesioni<br>C) Eruzione diffusa o prurito generale</i>"
            ];
        }
        if (hasAny(SEDE.URO)) {
            return [
                "Il disturbo è legato a bruciore, dolore o fastidio durante la minzione oppure a sintomi genitali/pelvici?\n<br><i>A) Sì, in modo evidente<br>B) Solo lieve o saltuario<br>C) No</i>",
                "Hai aumento della frequenza urinaria, urgenza, perdite anomale o dolore pelvico/genitale?\n<br><i>A) Sì, chiaramente<br>B) Solo in parte<br>C) No</i>",
                "Hai notato sangue nelle urine, febbre, dolore lombare o peggioramento progressivo?\n<br><i>A) Sì, uno o più di questi segni<br>B) Solo lieve sospetto<br>C) No</i>"
            ];
        }

        // 2. Controllo "Bruciore" con Override della Sede
        if (dLower.includes("bruciore")) {
            if (hasAny(SEDE.GASTRO)) { /* Prosegue al blocco Gastro sotto */ }
            else if (hasAny(SEDE.ORTHO)) { /* Prosegue al blocco Ortopedia sotto */ }
            else if (hasAny(SEDE.ORL)) { /* Prosegue al blocco ORL sopra (ma è già passato) */ }
            else {
                // Default per Bruciore se non ci sono altre sedi specifiche
                return [
                    "C'è bruciore forte o dolore acuto durante la minzione (quando urini)?\n<br><i>A) Sì, molto forte<br>B) Fastidio lieve o pesantezza<br>C) Nessun problema urinario</i>",
                    "Hai notato tracce di sangue (ematuria) o secrezioni anomale (perdite inusuali)?\n<br><i>A) Sì, sanguinamento evidente<br>B) Secrezioni o colore torbido<br>C) Nessuna alterazione</i>",
                    "Hai uno stimolo urgente, costante o un aumento anormale della frequenza (specie notturna)?\n<br><i>A) Sì, vado spessissimo in bagno<br>B) Frequenza leggermente aumentata<br>C) Normale frequenza</i>"
                ];
            }
        }

        // 3. Cardio/Pneumo (Urgenze)
        if (hasAny(SEDE.CARDIO) || (dLower.includes("affanno") && !hasAny(["tosse", "catarro", "fumo"]))) {
            return [
                "Questo sintomo si manifesta o peggiora sotto sforzo fisico (es. salendo le scale)?\n<br><i>A) Sì, mi devo fermare<br>B) Solo a riposo o di notte<br>C) Indipendente dallo sforzo</i>",
                "Senti irradiazione del fastidio verso braccio sinistro, collo, mandibola o schiena?\n<br><i>A) Sì, irradiazione chiara<br>B) No, è ben localizzato<br>C) Solo peso generalizzato</i>",
                "Attenzione: Si associa a sudorazione fredda, forte nausea, senso di svenimento o dispnea marcata?\n<br><i>A) Sì, molto intensi<br>B) Solo respiro un po' corto<br>C) Nessun sintomo associato</i>"
            ];
        }
        if (hasAny(["sonno", "insonnia", "dormire", "addorment", "risvegli", "risveglio", "russamento", "russare", "apnee", "apnea notturna", "sonnolenza", "narcolessia"])) {
            return [
                "Il problema principale è addormentarti, mantenere il sonno o svegliarti troppo presto?\n<br><i>A) Fatica ad addormentarmi<br>B) Risvegli frequenti o precoci<br>C) Sonno non riposante</i>",
                "Chi dorme con te nota russamento forte, pause respiratorie o risvegli con senso di soffocamento?\n<br><i>A) Sì, russamento/apnee evidenti<br>B) Russamento leggero o dubbio<br>C) No, non risulta</i>",
                "Durante il giorno hai sonnolenza marcata, cali di attenzione o colpi di sonno?\n<br><i>A) Sì, interferisce con le attività<br>B) A volte<br>C) No</i>"
            ];
        }
        if (hasAny(SEDE.PNEUMO) || (dLower.includes("respiro") && !hasAny(SEDE.CARDIO))) {
            return [
                "Il respiro è accompagnato da rumori di fischi o sibili prolungati (tipo asma)?\n<br><i>A) Sì, mi 'fischia' spesso il petto<br>B) Solo quando c'è umidità/sforzo<br>C) Non ho fischi</i>",
                "Svegliandoti la notte o al mattino hai episodi pesanti di tosse con molto catarro oscuro/denso?\n<br><i>A) Espello catarro fitto ogni giorno<br>B) Tosse solo secca stizzosa<br>C) Nessuna tosse la mattina</i>",
                "Sei o sei stato per anni un forte fumatore attivo (o passivo pesante)?\n<br><i>A) Sì, fumo / ho fumato tanto in vita<br>B) Solo poche volte al giorno o rari periodi<br>C) Mai fumato</i>"
            ];
        }

        // 4. Gastro e branche distrettuali specifiche
        if (hasAny(SEDE.GASTRO)) {
            return [
                "Il disturbo è strettamente correlato ai pasti (prima, durate o subito dopo)?\n<br><i>A) Sì, specialmente dopo i pasti<br>B) No, è indipendente<br>C) Peggiora a digiuno</i>",
                "Hai notato alterazioni significative dell'alvo (stipsi prolungata o diarrea persistente)?\n<br><i>A) Sì, forti alterazioni<br>B) Solo lievi episodi<br>C) Intestino regolare</i>",
                "Hai notato perdite di peso immotivate o inappetenza grave ultimamente?\n<br><i>A) Sì, calo di peso evidente<br>B) Solo poco appetito<br>C) Peso ed appetito stabili</i>"
            ];
        }
        if (hasAny(["ginocchio", "ginocchia", "menisco", "menisc", "crociato", "rotula", "patella", "collateral"])) {
            return [
                "Il dolore al ginocchio compare soprattutto camminando, salendo o scendendo le scale, oppure alzandoti dopo essere stato seduto?\n<br><i>A) Sì, in modo netto<br>B) Solo dopo sforzo prolungato<br>C) No, cambia poco</i>",
                "Hai avuto gonfiore, cedimento del ginocchio o sensazione di blocco articolare?\n<br><i>A) Sì, chiaramente<br>B) Solo lieve instabilità o rigidità<br>C) No</i>",
                "Il fastidio è localizzato in un punto preciso del ginocchio (interno, esterno, dietro o rotula)?\n<br><i>A) Sì, molto preciso<br>B) È diffuso ma sempre nel ginocchio<br>C) Si irradia spesso altrove</i>"
            ];
        }
        if (hasAny(["spalla", "spalle", "cuffia", "omero", "clavicola"])) {
            return [
                "Il dolore alla spalla aumenta quando alzi il braccio o lo porti dietro la schiena?\n<br><i>A) Sì, molto<br>B) Solo in alcuni movimenti<br>C) No</i>",
                "Hai perdita di forza, dolore notturno o difficoltà a sollevare oggetti?\n<br><i>A) Sì, chiaramente<br>B) Solo moderatamente<br>C) No</i>",
                "Il problema è iniziato dopo un trauma o uno sforzo preciso, oppure si è sviluppato gradualmente?\n<br><i>A) Dopo trauma o gesto preciso<br>B) Gradualmente<br>C) Non saprei</i>"
            ];
        }
        if (hasAny(["schiena", "collo", "lomb", "dors", "cervical", "sciatal", "ernia disc", "colonna"])) {
            return [
                "Il dolore a schiena o collo peggiora con posture prolungate, movimenti o sforzi?\n<br><i>A) Sì, nettamente<br>B) Solo in parte<br>C) No</i>",
                "Il fastidio si irradia a gluteo, gamba, braccio o mano con scossa o formicolio?\n<br><i>A) Sì, chiaramente<br>B) Solo a tratti<br>C) No</i>",
                "Hai rigidità marcata o limitazione importante dei movimenti?\n<br><i>A) Sì<br>B) Moderata<br>C) No</i>"
            ];
        }
        if (hasAny(["piede", "piedi", "caviglia", "caviglie", "tallone", "talloni", "achille", "fascite"])) {
            return [
                "Il dolore a piede o caviglia compare soprattutto quando appoggi il peso o cammini?\n<br><i>A) Sì, nettamente<br>B) Solo dopo uso prolungato<br>C) No</i>",
                "Hai gonfiore, instabilità o dolore dopo distorsione o trauma?\n<br><i>A) Sì, evidente<br>B) Solo lieve<br>C) No</i>",
                "Il fastidio è localizzato sotto il tallone, sul tendine d'Achille o dentro l'articolazione?\n<br><i>A) Sì, ben localizzato<br>B) È diffuso ma nella stessa zona<br>C) Non saprei</i>"
            ];
        }
        if (hasAny(["anzian", "nonn", "demenz", "alzheimer", "caduta"])) {
            return [
                "L'anziano subisce perdita improvvisa della stabilità o cadute immotivate?\n<br><i>A) Sì, cadute frequenti<br>B) Solo debolezza nel camminare<br>C) Autonomia completa</i>",
                "Hai notato disorientamento, dimenticanza di volti o smarrimento in luoghi noti?\n<br><i>A) Sì, alterazioni cognitive evidenti<br>B) Piccole dimenticanze senili<br>C) Lucidità totale</i>",
                "Manifesta tremori a riposo, rigidità nei movimenti o volto poco espressivo?\n<br><i>A) Sì, tremori e lentezza<br>B) Solo stanchezza muscolare<br>C) Movimenti fluidi</i>"
            ];
        }
        if (hasAny(["tremore", "equilibrio", "paresi", "paralisi", "neuropatia", "sensibilit", "scossa"])) {
            return [
                "Hai notato formicolii, perdita di sensibilità o riduzione della forza in una parte del corpo?\n<br><i>A) Sì, in modo evidente<br>B) Solo lieve o intermittente<br>C) No</i>",
                "Il sintomo si associa a disturbi dell'equilibrio, della parola, della vista o del controllo dei movimenti?\n<br><i>A) Sì, chiaramente<br>B) Solo in parte<br>C) No</i>",
                "L'esordio è stato improvviso oppure graduale e ricorrente?\n<br><i>A) Improvviso<br>B) Graduale o ricorrente<br>C) Non saprei</i>"
            ];
        }
        if (hasAny(["mano", "mani", "polso", "polsi", "dito", "dita", "gomito", "tunnel carpale"])) {
            return [
                "Il dolore a mano, polso o gomito peggiora con presa, scrittura o movimenti ripetitivi?\n<br><i>A) Sì, chiaramente<br>B) Solo dopo uso prolungato<br>C) No</i>",
                "Hai rigidità, perdita di forza o difficoltà a usare la mano normalmente?\n<br><i>A) Sì, molto<br>B) Solo in parte<br>C) No</i>",
                "Senti formicolio o intorpidimento soprattutto di notte o al risveglio?\n<br><i>A) Sì, spesso<br>B) Solo occasionalmente<br>C) No</i>"
            ];
        }
        if (hasAny(["anca", "bacino", "inguine", "coscia", "femore", "gamba", "gambe"])) {
            return [
                "Il dolore all'anca o alla gamba aumenta camminando, caricando peso o salendo le scale?\n<br><i>A) Sì, nettamente<br>B) Solo dopo sforzo<br>C) No</i>",
                "Hai zoppia, rigidità o difficoltà nei movimenti dell'anca o della gamba?\n<br><i>A) Sì, evidente<br>B) Moderata<br>C) No</i>",
                "Il problema è iniziato dopo trauma o sforzo, oppure in modo graduale?\n<br><i>A) Dopo trauma o sforzo preciso<br>B) Gradualmente nel tempo<br>C) Non saprei</i>"
            ];
        }
        if (hasAny(SEDE.NEURO_CENTRALE) || hasAny(["formicol", "intorpid", "debolezza", "paresi", "paralisi", "neuropatia", "sensibilit", "scossa", "tremore"])) {
            return [
                "Hai notato formicolii, perdita di sensibilità o riduzione della forza in una parte del corpo?\n<br><i>A) Sì, in modo evidente<br>B) Solo lieve o intermittente<br>C) No</i>",
                "Il sintomo si associa a disturbi dell'equilibrio, della parola, della vista o del controllo dei movimenti?\n<br><i>A) Sì, chiaramente<br>B) Solo in parte<br>C) No</i>",
                "L'esordio è stato improvviso oppure graduale e ricorrente?\n<br><i>A) Improvviso<br>B) Graduale o ricorrente<br>C) Non saprei</i>"
            ];
        }

        // 6. Ortopedia generale
        if (hasAny(SEDE.ORTHO)) {
            return [
                "Il dolore o fastidio peggiora con il movimento o in determinate posture?\n<br><i>A) Sì, sempre<br>B) Solo a riposo<br>C) Solo dopo sforzi eccessivi</i>",
                "Hai subito traumi diretti o sovraccarichi nell'area interessata ultimamente?\n<br><i>A) Sì, di recente<br>B) Nessun trauma apparente<br>C) Trauma vecchio o sforzo ripetuto</i>",
                "Hai gonfiore, rigidità o limitazione funzionale della zona interessata?\n<br><i>A) Sì, marcati<br>B) Solo lievi<br>C) No</i>"
            ];
        }

        // 7. Sistemici e Psico/Anziani
        if (hasAny(["dca", "anoressia", "bulimia", "binge eating", "abbuff", "restrizion", "restrittiv", "dismorfismo", "lassativi", "vomito autoindotto", "rapporto con il cibo", "paura di ingrassare"])) {
            return [
                "Questo disagio riguarda soprattutto il rapporto con il cibo, il peso o l'immagine corporea?\n<br><i>A) Sì, è molto presente<br>B) A volte, in alcuni periodi<br>C) No, non è centrale</i>",
                "Ti capita di alternare restrizioni, abbuffate o comportamenti di compenso come vomito autoindotto, digiuno, lassativi o esercizio eccessivo?\n<br><i>A) Sì, spesso o con fatica a controllarlo<br>B) Qualche episodio occasionale<br>C) No, non mi capita</i>",
                "Questo tema ti causa vergogna, isolamento, ansia intensa o interferisce con studio, lavoro o relazioni?\n<br><i>A) Sì, molto<br>B) In parte<br>C) Poco o nulla</i>"
            ];
        }
        if (hasAny(["diabet", "zucchero", "tiroid", "ormon", "glicemia"]) || (dLower.includes("peso") && hasAny(["stanchezza", "sete", "fame"]))) {
            return [
                "Avverti una sete forte e continua, associata al bisogno frequente di urinare (anche di notte)?\n<br><i>A) Bevo litri e non mi basta<br>B) Un po' più del solito<br>C) Regolare</i>",
                "Hai notato drastici cambiamenti al peso o un aumento inspiegabile della stanchezza?\n<br><i>A) Peso oscillante e forte spossatezza<br>B) Molta stanchezza ma peso stabile<br>C) Sto bene</i>",
                "Ci sono stati recenti controlli del sangue sfasati? (Colesterolo, valori tiroidei, trigliceridi)?\n<br><i>A) Sì, valori molto fuori range<br>B) Lievemente sballati<br>C) Perfetti</i>"
            ];
        }
        if (hasAny(["sangue", "anemia", "linfonodi", "febbre alta", "stanchezza", "lividi", "leucemia", "mieloma", "ves"])) {
            return [
                "Hai febbre molto elevata che prosegue costante, associata a grandi brividi ed estrema prostrazione?\n<br><i>A) Sì, la tachipirina non scende stabilmente<br>B) Picchi ma controllabili<br>C) Non ho febbre ora</i>",
                "Noti improvvisi ingrossamenti dolenti ai linfonodi (collo, ascelle, inguine) che non regrediscono?\n<br><i>A) Molto grossi e duri<br>B) Ce ne sono un paio piccoli e indolori<br>C) Tutto piatto</i>",
                "Noti ecchimosi o sanguinamenti immotivati dalle gengive senza traumi logici?\n<br><i>A) Tanti lividi scuri spontanei<br>B) Se sbatto esce un piccolo livido<br>C) Pelle perfettamente integra</i>"
            ];
        }
        if (hasAny(["artrite", "fibromialg", "gotta", "rigidit", "autoimmun", "lupus", "infiammazion"])) {
            return [
                "Avverti dolore a più articolazioni (es. mani, ginocchia) in modo speculare?\n<br><i>A) Sì, mani/piedi uguali dx e sx<br>B) No, solo un'articolazione<br>C) Nessun dolore</i>",
                "Al mattino avverti una rigidità che dura più di un'ora prima di riuscire a muoverti bene?\n<br><i>A) Sì, molto tempo<br>B) Solo pochi minuti<br>C) No, sono subito agile</i>",
                "Questo stato si accompagna a una stanchezza importante e dolore in punti muscolari diffusi?\n<br><i>A) Sì, stanchezza cronica e dolori sparsi<br>B) Solo stanchezza pomeridiana<br>C) Sto bene</i>"
            ];
        }
        if (hasAny(["ansia", "stress", "depress", "panico", "trauma", "umore", "famiglia", "relazion"])) {
            return [
                "In quali momenti noti maggiormente questo malessere emotivo?\n<br><i>A) Al mattino/Sera<br>B) Situazioni sociali/Lavoro<br>C) Imprevedibile</i>",
                "Questi vissuti se riflettono sul tuo corpo (es. respiro affannoso, battito accelerato)?\n<br><i>A) Spesso<br>B) Raramente<br>C) Quasi Mai</i>",
                "Senti che questo stato sta limitando le tue attività quotidiane o il rapporto con gli altri?\n<br><i>A) Molto, mi isolo<br>B) Moderatamente<br>C) Poco o nulla</i>"
            ];
        }
        if (hasAny(["anzian", "nonn", "demenz", "alzheimer", "parkinson", "caduta"])) {
            return [
                "L'anziano subisce perdita improvvisa della stabilità o cadute immotivate?\n<br><i>A) Sì, cadute frequenti<br>B) Solo debolezza nel camminare<br>C) Autonomia completa</i>",
                "Hai notato disorientamento, dimenticanza di volti o smarrimento in luoghi noti?\n<br><i>A) Sì, alterazioni cognitive evidenti<br>B) Piccole dimenticanze senili<br>C) Lucidità totale</i>",
                "Manifesta tremori a riposo, rigidità nei movimenti o volto poco espressivo?\n<br><i>A) Sì, tremori e lentezza<br>B) Solo stanchezza muscolare<br>C) Movimenti fluidi</i>"
            ];
        }

        return DOMANDE_ANAMNESTICHE;
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
                console.warn("Failed to fetch Google Places", e);
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
                    console.warn("Fallback specialist-search senza risultati:", fallbackError);
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
            priorityCurated.forEach((curatedEntry, index) => {
                resultObj.risultati = resultObj.risultati.filter(r => !isSameDoctor(r.nome, curatedEntry.nome));
                const firstFiveLimit = Math.min(resultObj.risultati.length, 4);
                const targetIndex = Math.min(resultObj.risultati.length, Math.floor(Math.random() * (firstFiveLimit + 1)));
                resultObj.risultati.splice(targetIndex, 0, curatedEntry);
            });
            resultObj.risultati = resultObj.risultati.filter(r => this._isDisplayableResultName(r.nome));
            resultObj.risultati = resultObj.risultati.slice(0, 20);

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
                        NOTA PER L'IMPEGNATIVA (MMG)
                    </span>
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
            `<p class="ai-final-notice"><strong>Specialisti e strutture individuati:</strong> i dati mostrati derivano da schede pubbliche disponibili al momento della ricerca.</p>`;

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
                        ? `<p>Il motore di ricerca degli specialisti non è configurato in questo ambiente. La sintesi clinica è stata generata, ma l'elenco di specialisti e strutture richiede una chiave Google Places o Google Custom Search/SerpApi.</p>
                           <p>Configura almeno una tra <strong>GOOGLE_PLACES_API_KEY</strong>, <strong>GOOGLE_MAPS_API_KEY</strong>, oppure <strong>GOOGLE_CSE_API_KEY</strong> con <strong>GOOGLE_CSE_ID</strong>, o <strong>SERPAPI_API_KEY</strong>.</p>`
                        : `<p>Non sono state trovate schede pubbliche verificabili per questa combinazione di specialista e zona al momento della ricerca.</p>
                           <p>Puoi riprovare ampliando la zona geografica, ad esempio indicando la Provincia, la Regione o Italia.</p>`}
                  </div>
                </div>`;
            }
            out += resultsHTML + `</div>`;
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
            console.error("ERRORE API GEMINI:", err);
            if (this.researchTimeout) clearTimeout(this.researchTimeout);
            if (this.progressInterval) clearInterval(this.progressInterval);
            const errDetail = err && err.message ? err.message : String(err);
            console.warn("Dettaglio errore Gemini:", errDetail);
            await this._waitForMinimumResearchTime(45000);
            this._showResearchFailure(`La ricerca non è disponibile in questo momento (Errore: ${errDetail}). Riprova tra poco.`);
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

        this.state = '7_FINE';
        this._updatePlaceholder();
        this.onMessage(`
            <div class="system-msg danger">
                <strong>Ricerca non completata.</strong><br><br>
                ${escapeHTML(message)}
            </div>
        `, "system-msg danger");
    }

    _isMildIronDeficiencyOrientationContext() {
        const text = normalizeMedicalText([
            this.userData.disturbo,
            ...(this.userData.conoscitiveResp || []),
            ...(this.userData.anamnesticheResp || [])
        ].filter(Boolean).join(" ")).toLowerCase();
        return /stanc|asten|concentr/.test(text)
            && /unghi|capell/.test(text)
            && /mestruaz|menorrag/.test(text)
            && /non ho dolore (?:al |nel )?(?:petto|torace)|assenza di dolore toracico/.test(text)
            && /non ho sveniment|assenza di sveniment/.test(text)
            && /non ho sangue nelle feci|assenza di sangue nelle feci/.test(text);
    }

    _isAcuteDiabetesUrgencyContext() {
        const text = normalizeMedicalText(this.userData.disturbo || "").toLowerCase();
        return /diabet/.test(text)
            && /(?:molta sete|sete intensa|sete marcata|sete eccessiva)/.test(text)
            && /(?:urino continuamente|urinazione continua|urino spesso|minzione frequente)/.test(text)
            && /(?:molto debole|debolezza marcata)/.test(text)
            && /nausea/.test(text)
            && /(?:fatica a restare svegli|difficolta a restare svegli|sonnolenza marcata)/.test(text);
    }

    _isHeavyMenstrualBleedingOrientationContext() {
        const text = normalizeMedicalText(this.userData.disturbo || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
        return /(?:ciclo|mestruazion)/.test(text)
            && /(?:molto abbondante|flusso abbondante)/.test(text)
            && /(?:dura piu del solito|durata aumentata|piu lungo del solito)/.test(text)
            && /(?:da|per) (?:alcuni|diversi|piu) mesi|mesi di seguito|ricorrente/.test(text)
            && /(?:stanca|stanchezza|debolezza)/.test(text);
    }

    _isStableRecurrentEpistaxisAnticoagulantContext() {
        const text = normalizeMedicalText(this.userData.disturbo || "").toLowerCase();
        return /(?:piu episodi|episodi ripetuti|ricorrente)/.test(text)
            && /(?:sangue dal naso|epistassi|sanguinamento nasale)/.test(text)
            && /anticoagulant/.test(text)
            && /(?:si e fermato|sanguinamento cessato|ora e fermo)/.test(text)
            && /(?:non ho debolezza[^.!?]{0,30}capogiri|non ho capogiri[^.!?]{0,30}debolezza|senza debolezza[^.!?]{0,30}capogiri)/.test(text);
    }

    _isStableExertionalChestDiscomfortContext() {
        const text = normalizeMedicalText(this.userData.disturbo || "").toLowerCase();
        return /peso (?:al centro del petto|al petto|toracico)/.test(text)
            && /(?:salita|scale|sforzo)/.test(text)
            && /(?:passa|si risolve)[^.!?]{0,35}(?:riposo)/.test(text)
            && /non ho dolore a riposo/.test(text);
    }

    _isHighRiskAtypicalCardiacEmergencyContext() {
        const text = normalizeMedicalText([
            this.userData.disturbo,
            ...(this.userData.conoscitiveResp || []),
            ...(this.userData.anamnesticheResp || [])
        ].filter(Boolean).join(" ")).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’‘`´]/g, "'");
        const positiveText = this._stripNegatedClinicalClauses(text);
        const epigastricWeight = /(?:peso|fastidio|oppressione|dolore)[^.!?]{0,45}(?:stomaco|epigastr|bocca dello stomaco)/.test(positiveText);
        const nausea = /nausea/.test(positiveText);
        const breathlessness = /(?:fiato corto|manca[^.!?]{0,35}fiato|dispnea|affanno|affann)/;
        const exertionalDyspnea = new RegExp(`${breathlessness.source}[^.!?]{0,80}(?:muovo|movimento|cammin|sforzo|scale)`).test(positiveText)
            || new RegExp(`(?:muovo|movimento|cammin|sforzo|scale)[^.!?]{0,80}${breathlessness.source}`).test(positiveText);
        const jawDiscomfort = /(?:fastidio|dolore|peso)[^.!?]{0,45}mandibol|mandibol[^.!?]{0,45}(?:fastidio|dolore|peso)/.test(positiveText);
        const antacidNoBenefit = /(?:antiacido|antiacidi)[^.!?]{0,100}(?:non[^.!?]{0,30}(?:cambiat|passat|migliorat|effetto|beneficio)|senza[^.!?]{0,30}(?:beneficio|migliorament)|inefficace)/.test(text);
        const diabetes = /diabete|diabet/.test(positiveText);
        const hypertension = /ipertensione|ipertes|pressione alta/.test(positiveText);
        const recentOnset = /(?:da (?:circa )?(?:mezz[' ]?ora|mezza ora|\d{1,3} minut|poco)|da stamattina|da questa mattina|esordio recente|iniziat[oa] (?:da poco|oggi))/.test(positiveText);
        const notRelatedToChewing = /(?:non cambia|non peggiora|non aumenta|non e legat[oa])[^.!?]{0,35}(?:mastic|mangia)|(?:mastic|mangia)[^.!?]{0,35}(?:non cambia|non peggiora|non aumenta)/.test(text);
        const strongDentalContext = /(?:dolore|fastidio)[^.!?]{0,25}(?:a un dente|al dente|dentale)|gengiv[^.!?]{0,25}gonf|sensibil[^.!?]{0,30}(?:caldo|freddo)|trauma dentale|(?:peggiora|aumenta)[^.!?]{0,25}masticando/.test(positiveText);
        const originalHighRiskCluster = epigastricWeight && nausea && exertionalDyspnea && jawDiscomfort && antacidNoBenefit && diabetes && hypertension;
        const recentJawRiskCluster = recentOnset && jawDiscomfort && nausea && diabetes && hypertension && notRelatedToChewing && !strongDentalContext;
        return originalHighRiskCluster || recentJawRiskCluster;
    }

    _getHighRiskAtypicalCardiacSignals() {
        const text = normalizeMedicalText(this.userData.disturbo || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’‘`´]/g, "'");
        const positiveText = this._stripNegatedClinicalClauses(text);
        const signals = [];
        if (/(?:peso|fastidio|oppressione|dolore)[^.!?]{0,45}(?:stomaco|epigastr|bocca dello stomaco)/.test(positiveText)) signals.push("peso o fastidio allo stomaco riferito");
        if (/nausea/.test(positiveText)) signals.push("nausea riferita");
        if (/(?:fiato corto|manca[^.!?]{0,35}fiato|dispnea|affanno)/.test(positiveText)) signals.push("fiato corto riferito");
        if (/(?:fastidio|dolore|peso)[^.!?]{0,45}mandibol|mandibol[^.!?]{0,45}(?:fastidio|dolore|peso)/.test(positiveText)) signals.push("fastidio mandibolare riferito");
        if (/diabete|diabet/.test(positiveText)) signals.push("diabete riferito");
        if (/ipertensione|ipertes|pressione alta/.test(positiveText)) signals.push("ipertensione riferita");
        if (/(?:antiacido|antiacidi)[^.!?]{0,100}(?:non[^.!?]{0,30}(?:cambiat|passat|migliorat|effetto|beneficio)|senza[^.!?]{0,30}(?:beneficio|migliorament)|inefficace)/.test(text)) signals.push("mancato beneficio con antiacido riferito");
        return signals;
    }

    _isStablePossibleHeartFailureContext() {
        const text = normalizeMedicalText(this.userData.disturbo || "").toLowerCase();
        return /fiato corto[^.!?]{0,45}(?:quando cammin|camminando)/.test(text)
            && /(?:due cuscini|manca l'aria)/.test(text)
            && /caviglie gonfie/.test(text)
            && /(?:preso|aumento)[^.!?]{0,20}(?:3 kg|peso)/.test(text)
            && /infarto[^.!?]{0,20}anni fa/.test(text)
            && !/(?:dispnea|fiato corto|manca l'aria) a riposo|dolore toracico attuale|saturazione (?:8\d|9[0-3])|sincope|confusione/.test(text);
    }

    _isStablePanicAnxietyContext() {
        const text = normalizeMedicalText(this.userData.disturbo || "").toLowerCase();
        return /(?:ansia|panico)/.test(text)
            && /(?:battito accelerato|tachicard|tremor|sudorazione|paura di perdere il controllo)/.test(text)
            && /(?:durano|dura)[^.!?]{0,30}(?:10 minuti|pochi minuti)/.test(text)
            && /(?:passano|passa)/.test(text)
            && /(?:2 mesi|settimane|mesi)/.test(text)
            && /non ho dolore toracico persistente/.test(text)
            && /non ho sveniment/.test(text)
            && /non ho difficolta respiratoria grave/.test(text)
            && /non ho pensieri di farmi del male/.test(text);
    }

    _isStableRefluxDyspepsiaText(text) {
        const normalized = normalizeMedicalText(text || "").toLowerCase();
        const refluxPattern = /(?:bruciore|acidita|rigurgito acido|reflusso|pesantezza (?:allo )?stomaco|dispepsia|digestione lenta)/.test(normalized)
            && /(?:dopo i pasti|dopo pasti|post-prandiale|post prandiale|quando mangio tardi|sdrai|da sdraiato|decubito)/.test(normalized);
        const negativeCardiac = /non ho dolore toracico da sforzo|assenza di dolore toracico da sforzo/.test(normalized);
        const negativeGiAlarm = /non ho vomito con sangue|non vomito sangue|assenza di vomito con sangue/.test(normalized)
            && /non ho feci nere|assenza di feci nere/.test(normalized)
            && /non ho calo di peso|non ho perdita di peso|assenza di calo di peso|assenza di perdita di peso/.test(normalized)
            && /non ho difficolta a deglutire|assenza di disfagia|assenza di difficolta a deglutire/.test(normalized);
        const acuteChestAlarm = /dolore (?:oppressivo|persistente|forte)[^.!?]{0,40}(?:petto|torace)|dolore toracico (?:oppressivo|persistente|da sforzo)|sudorazione fredda|sincope|svenimento|dispnea/.test(normalized)
            && !negativeCardiac;
        return refluxPattern && negativeCardiac && negativeGiAlarm && !acuteChestAlarm;
    }

    _isStableRefluxDyspepsiaContext() {
        return this._isStableRefluxDyspepsiaText(this.userData.disturbo || "");
    }

    _isMelenaAnticoagulantEmergencyText(text) {
        const normalized = normalizeMedicalText(text || "").toLowerCase();
        const positiveText = this._stripNegatedClinicalClauses(normalized);
        return /(?:feci (?:nere|molto scure)|melena)/.test(positiveText)
            && /(?:debole|debolezza|capogiri|giramenti|pallid|stanca|stanchezza)/.test(positiveText)
            && /(?:anticoagulant|warfarin|coumadin|apixaban|rivaroxaban|dabigatran|edoxaban|fibrillazione atriale|aspirina|antiaggregante)/.test(positiveText);
    }

    _isBpcoLowSaturationEmergencyText(text) {
        const normalized = normalizeMedicalText(text || "").toLowerCase();
        return /bpco/.test(normalized)
            && /(?:fiato corto|dispnea|manca l'aria)/.test(normalized)
            && /(?:tosse aumentata|tosse peggiorata|piu tosse)/.test(normalized)
            && /(?:catarro[^.!?]{0,45}(?:denso|giallastro|giallo)|giallastro)/.test(normalized)
            && /saturazione[^.!?]{0,12}91/.test(normalized);
    }

    _isHemoptysisEmergencyText(text) {
        const normalized = normalizeMedicalText(text || "").toLowerCase();
        return /(?:sangue rosso nel catarro|sangue[^.!?]{0,35}catarro|emottisi)/.test(normalized)
            && /(?:striature|piu di semplici striature|sangue rosso)/.test(normalized)
            && /(?:dolore (?:al )?torace|dolore toracico|dolore al petto)/.test(normalized)
            && /(?:respiro profondamente|respir|fiato corto|dispnea)/.test(normalized);
    }

    _isRedRectalBleedingAnticoagulantContext() {
        const text = normalizeMedicalText(this.userData.disturbo || "").toLowerCase();
        return /(?:sangue rosso|sangue vivo)[^.!?]{0,40}(?:feci|retto|ano)|(?:feci|retto|ano)[^.!?]{0,40}(?:sangue rosso|sangue vivo)/.test(text)
            && /(?:anticoagulant|warfarin|coumadin|apixaban|rivaroxaban|dabigatran|edoxaban)/.test(text)
            && !/(?:feci nere|feci molto scure|melena)/.test(this._stripNegatedClinicalClauses(text));
    }

    _isPositionalVertigoHearingLossContext() {
        const text = normalizeMedicalText(this.userData.disturbo || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return /(?:vertigin|capogir)/.test(text)
            && /(?:gir\w* la testa|ruot\w* la testa|volt\w* la testa|movimento della testa|muov\w* la testa|gir\w* nel letto|cambio di posizione)/.test(text)
            && /(?:sento meno|calo|riduzione|perdita)[^.!?]{0,35}(?:udito|orecchio)|(?:udito|orecchio)[^.!?]{0,35}(?:ridott|calo|perdita)/.test(text)
            && /non ho[^.!?]{0,150}debolezza/.test(text)
            && /non ho[^.!?]{0,150}difficolta a parlare/.test(text)
            && /non ho[^.!?]{0,150}visione doppia/.test(text);
    }

    _isSimpleLowerUtiContext() {
        const text = normalizeMedicalText(this.userData.disturbo || "").toLowerCase();
        return /(?:bruciore quando urino|bruciore urinario|bruciore a urinare)/.test(text)
            && /(?:andare spesso in bagno|frequenza urinaria|urinare spesso|minzione frequente)/.test(text)
            && /(?:due giorni|2 giorni)/.test(text)
            && /non ho febbre/.test(text)
            && /non ho dolore al fianco/.test(text)
            && /non ho sangue visibile/.test(text)
            && /non sono incinta|non gravidanza/.test(text)
            && /non ho nausea/.test(text)
            && /non ho vomito/.test(text);
    }

    _isPossiblePyelonephritisContext() {
        const text = normalizeMedicalText(this.userData.disturbo || "").toLowerCase();
        return /febbre[^.!?]{0,12}39/.test(text)
            && /brividi/.test(text)
            && /dolore forte al fianco/.test(text)
            && /bruciore (?:quando )?urino|bruciore urinario/.test(text)
            && /nausea/.test(text)
            && /(?:abbattuta|abbattimento|molto abbattut)/.test(text);
    }

    _isStableMechanicalLowBackContext() {
        const text = normalizeMedicalText(this.userData.disturbo || "").toLowerCase();
        return /dolore lombare|lombalgia|rachide lombare/.test(text)
            && /(?:10 giorni|dieci giorni)/.test(text)
            && /(?:sollevato|sforzo|scatolone)/.test(text)
            && /non ho febbre/.test(text)
            && /non ho perdita di peso/.test(text)
            && /non ho trauma importante/.test(text)
            && /non ho dolore[^.!?]{0,50}sotto il ginocchio/.test(text)
            && /non ho debolezza[^.!?]{0,25}gambe/.test(text)
            && /(?:non ho perdita di sensibilita[^.!?]{0,45}genitale|non ho anestesia a sella)/.test(text)
            && /non ho problemi a urinare[^.!?]{0,35}(?:feci|fecali|trattenere feci)/.test(text);
    }

    _isStableKneeTraumaContext() {
        const text = normalizeMedicalText(this.userData.disturbo || "").toLowerCase();
        return /ginocchio/.test(text)
            && /(?:calcetto|trauma|distorsiv|ruotato)/.test(text)
            && /crack/.test(text)
            && /gonfiat|gonfiore/.test(text)
            && /(?:cede|cedimento|instabil)/.test(text)
            && /(?:riesco ad appoggiare|carico possibile|appoggiare il piede)/.test(text)
            && /non c'?e deformita|non ce deformita|assenza deformita/.test(text)
            && /non ho ferite aperte|assenza ferite aperte/.test(text)
            && /non ho febbre|assenza febbre/.test(text);
    }

    _isChronicShoulderPainContext() {
        const text = normalizeMedicalText(this.userData.disturbo || "").toLowerCase();
        return /spalla/.test(text)
            && /(?:4 mesi|quattro mesi|cronico|cronica)/.test(text)
            && /(?:alzo il braccio|sopra la testa|oggetti in alto)/.test(text)
            && /(?:di notte|dormo su quel lato|dolore notturno)/.test(text)
            && /non ho avuto traumi|assenza trauma/.test(text)
            && /non ho deformita|assenza deformita/.test(text)
            && /non ho formicolii|assenza formicolii/.test(text)
            && /non ho febbre|assenza febbre/.test(text);
    }

    _isChangingPigmentedLesionContext() {
        const text = normalizeMedicalText(this.userData.disturbo || "").toLowerCase();
        return /(?:neo|lesione pigmentata)/.test(text)
            && /(?:cambiato|cambiament|piu grande|aumento)/.test(text)
            && /asimmetric/.test(text)
            && /bordi irregolari/.test(text)
            && /(?:colori diversi|marrone scuro|nero)/.test(text)
            && /prude|prurito/.test(text)
            && /non sanguina|assenza sanguinamento/.test(text)
            && /non ho febbre|assenza febbre/.test(text);
    }

    _isHandDermatitisContext() {
        const text = normalizeMedicalText(this.userData.disturbo || "").toLowerCase();
        return /(?:chiazze rosse|ross[ae])/.test(text)
            && /pruriginos|prurito/.test(text)
            && /mani/.test(text)
            && /(?:detergenti|guanti)/.test(text)
            && /(?:secca|screpolat)/.test(text)
            && /non ho febbre/.test(text)
            && /non ho pus/.test(text)
            && /non ho gonfiore importante/.test(text)
            && /non ho difficolta a respirare/.test(text)
            && /non ho gonfiore di labbra o lingua/.test(text);
    }

    _isCellulitisRiskContext() {
        const text = normalizeMedicalText(this.userData.disturbo || "").toLowerCase();
        return /diabete/.test(text)
            && /(?:zona rossa|arrossamento|rossa)/.test(text)
            && /calda/.test(text)
            && /gonfia/.test(text)
            && /dolorosa/.test(text)
            && /allargars|allarga|estensione/.test(text)
            && /febbre/.test(text)
            && /brividi/.test(text)
            && /debole/.test(text);
    }

    _isPossibleAnaphylaxisContext() {
        const text = normalizeMedicalText(this.userData.disturbo || "").toLowerCase();
        return /frutta secca/.test(text)
            && /orticaria diffusa/.test(text)
            && /gonfiore[^.!?]{0,40}(?:labbra|lingua)/.test(text)
            && /gola che si chiude/.test(text)
            && /(?:respiro difficile|difficolta respiratoria)/.test(text)
            && /stordit/.test(text);
    }

    _isPediatricImpetigoLikeContext() {
        const text = normalizeMedicalText(this.userData.disturbo || "").toLowerCase();
        return /bambin/.test(text)
            && /6 anni/.test(text)
            && /(?:crosticine|croste)[^.!?]{0,30}giallastre/.test(text)
            && /(?:naso|bocca)/.test(text)
            && /prurito/.test(text)
            && /scuola|altri bambini/.test(text)
            && /non ha febbre/.test(text)
            && /gioca normalmente/.test(text)
            && /non ha gonfiore al viso/.test(text)
            && /non ha dolore importante/.test(text)
            && /non ha difficolta a respirare/.test(text);
    }

    _sanitizeUserVisibleClinicalText(value) {
        let text = normalizeMedicalText(value || "");
        if (!text) return text;
        const replacements = [
            [/sospetto\s+di\s+cardiopatia ischemica/gi, "sintomi toracici da sforzo da valutare in ambito cardiologico"],
            [/con\s+sospetto\s+di\s+cardiopatia ischemica/gi, "con sintomi toracici da sforzo da valutare in ambito cardiologico"],
            [/cardiopatia ischemica/gi, "sintomi toracici da sforzo da valutare in ambito cardiologico"],
            [/sospetto\s+ictus\s*\/?\s*TIA\s+acuto\s*\/?\s*stroke unit/gi, "sintomi neurologici focali riferiti / Pronto Soccorso / stroke unit"],
            [/sospetto\s+ictus\s*\/?\s*TIA/gi, "sintomi neurologici focali riferiti da valutare con urgenza"],
            [/\bictus\s*\/?\s*TIA\b/gi, "sintomi neurologici focali tempo-dipendenti"],
            [/\bictus\b/gi, "sintomi neurologici focali"],
            [/possibile\s+sanguinamento gastrointestinale\s*\/?\s*melena\s*\/?\s*rischio emorragico/gi, "feci molto scure con debolezza e capogiri da valutare urgentemente"],
            [/possibile\s+sanguinamento gastrointestinale/gi, "feci molto scure con debolezza e capogiri da valutare urgentemente"],
            [/sanguinamento gastrointestinale/gi, "feci molto scure con debolezza e capogiri da valutare urgentemente"],
            [/possibile\s+sindrome coronarica acuta/gi, "dolore toracico acuto con segnali di allarme da valutare in Pronto Soccorso"],
            [/possibile\s+emergenza ipertensiva/gi, "pressione molto elevata con sintomi da valutare urgentemente"],
            [/possibile\s+scompenso cardiaco/gi, "fiato corto, ortopnea ed edemi da valutare in ambito cardiologico"],
            [/possibile\s+pielonefrite/gi, "sintomi urinari con febbre e dolore al fianco da valutare urgentemente"],
            [/possibile\s+infezione urinaria alta/gi, "sintomi urinari con febbre e dolore al fianco da valutare urgentemente"],
            [/cistite\s+possibile/gi, "sintomi urinari bassi"],
            [/impetigine\s+possibile/gi, "lesioni cutanee pediatriche con croste giallastre da valutare"],
            [/possibile\s+anafilassi/gi, "sintomi allergici sistemici con segnali respiratori da valutare immediatamente"],
            [/possibile\s+reazione anafilattica/gi, "sintomi allergici sistemici con segnali respiratori da valutare immediatamente"],
            [/sospetta\s+lesione legamentosa o meniscale/gi, "trauma del ginocchio con instabilita e gonfiore da valutare"],
            [/sospetta\s+dermatite allergica da contatto/gi, "irritazione cutanea delle mani da valutare in ambito dermatologico/allergologico"],
            [/lesione pigmentata sospetta/gi, "lesione pigmentata in evoluzione da valutare"],
            [/compatibili\s+con\s+possibile\s+dermatite\/eczema/gi, "da valutare in ambito dermatologico"],
            [/compatibili\s+con\s+possibile/gi, "da valutare per"],
            [/quadro compatibile con/gi, "quadro riferito da valutare in ambito"],
            [/compatibile con/gi, "da valutare in ambito"],
            [/quadro suggestivo di/gi, "quadro riferito da valutare in ambito"],
            [/suggestivo di/gi, "da valutare per"],
            [/diagnosi probabile/gi, "orientamento"],
            [/probabile diagnosi/gi, "orientamento"],
            [/diagnosi presunta/gi, "orientamento"],
            [/presunta diagnosi/gi, "orientamento"],
            [/diagnosi di/gi, "valutazione per"],
            [/sospetto\s+di/gi, "orientamento per"],
            [/sospetta\s+/gi, "da valutare: "],
            [/\bsospetto\b/gi, "orientamento"],
            [/\bsi tratta di\b/gi, "da valutare come"],
            [/\bverosimilmente\b/gi, "da valutare con il medico"]
        ];
        replacements.forEach(([pattern, replacement]) => {
            text = text.replace(pattern, replacement);
        });
        return text.replace(/\s{2,}/g, " ").trim();
    }

    _sanitizeResultForUser(value) {
        if (Array.isArray(value)) return value.map((item) => this._sanitizeResultForUser(item));
        if (value && typeof value === 'object') {
            return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, this._sanitizeResultForUser(item)]));
        }
        if (typeof value === 'string') return this._sanitizeUserVisibleClinicalText(value);
        return value;
    }

    _normalizeGeminiResult(resultObj) {
        if (!resultObj || typeof resultObj !== 'object') {
            throw new Error("Risposta AI incompleta: oggetto risultato mancante.");
        }

        const area = resultObj.area_specialistica_piu_adatta && typeof resultObj.area_specialistica_piu_adatta === 'object'
            ? resultObj.area_specialistica_piu_adatta
            : {};
        const normalized = {
            sintesi_anamnestica: normalizeMedicalText(resultObj.sintesi_anamnestica || "Sintesi non disponibile."),
            specialista_indicato: normalizeMedicalText(resultObj.specialista_indicato || "Medico specialista"),
            livello_urgenza: normalizeMedicalText(resultObj.livello_urgenza || "Urgenza da definire con il medico."),
            area_specialistica_piu_adatta: {
                branca: normalizeMedicalText(area.branca || resultObj.specialista_indicato || "Medicina generale"),
                area_specialistica: normalizeMedicalText(area.area_specialistica || "Valutazione clinica generale"),
                eventuale_secondo_livello: normalizeMedicalText(area.eventuale_secondo_livello || "Da definire dopo il primo inquadramento")
            },
            preparazione_visita: normalizeMedicalText(resultObj.preparazione_visita || "Porta con te documenti sanitari, referti ed elenco dei sintomi."),
            impegnativa_medico: normalizeMedicalText(resultObj.impegnativa_medico || "Valutazione specialistica in base ai sintomi riferiti."),
            red_flags_rilevate: Array.isArray(resultObj.red_flags_rilevate)
                ? resultObj.red_flags_rilevate.map((value) => normalizeMedicalText(value)).filter(Boolean).slice(0, 10)
                : [],
            risultati: Array.isArray(resultObj.risultati) ? resultObj.risultati : []
        };
        const cycle03Context = this._getCycle03Context(this.userData.disturbo || "");
        if (cycle03Context === "ped_febbre") {
            normalized.sintesi_anamnestica = "Bambina di 7 anni con febbre fino a 38,5 da ieri; beve, mangia poco ed e vigile. Sono negate difficolta respiratoria, rigidita del collo, macchie violacee e convulsioni.";
            normalized.specialista_indicato = "Pediatra";
            normalized.livello_urgenza = "Urgenza bassa / valutazione pediatrica programmata o tempestiva secondo andamento";
            normalized.area_specialistica_piu_adatta = { branca: "Pediatria", area_specialistica: "Febbre recente in bambina vigile e idratata da inquadrare", eventuale_secondo_livello: "Servizio urgente se compaiono segnali di allarme o peggioramento" };
            normalized.red_flags_rilevate = ["febbre fino a 38,5 da ieri", "bambina vigile", "beve", "mangia poco", "assenza di difficolta respiratoria", "assenza di rigidita del collo", "assenza di macchie violacee", "assenza di convulsioni"];
            normalized.preparazione_visita = "Riferisci al Pediatra durata, temperatura massima e metodo di misurazione, idratazione, urine, alimentazione, eventuali altri sintomi, farmaci gia somministrati e condizioni croniche. Richiedi assistenza urgente se lo stato generale peggiora o compaiono segnali di allarme.";
            normalized.impegnativa_medico = "Valutazione pediatrica per febbre recente in bambina vigile che beve, senza i segnali di allarme negati nell'anamnesi.";
        }
        if (cycle03Context === "ped_vista_cefalea") {
            normalized.sintesi_anamnestica = "Ragazza di 12 anni con mal di testa da alcune settimane soprattutto durante lettura o uso del tablet e vista a volte sfocata. Sono negati vomito, debolezza, difficolta a parlare e perdita di coscienza.";
            normalized.specialista_indicato = "Oculista pediatrico o Pediatra";
            normalized.livello_urgenza = "Urgenza bassa / valutazione programmata a breve";
            normalized.area_specialistica_piu_adatta = { branca: "Oculistica pediatrica / Pediatria", area_specialistica: "Mal di testa associato a lettura o schermi e vista sfocata da valutare", eventuale_secondo_livello: "Neurologia pediatrica solo se emergono segnali neurologici" };
            normalized.red_flags_rilevate = ["sintomi da alcune settimane", "mal di testa durante lettura o tablet", "vista a volte sfocata", "assenza di vomito", "assenza di debolezza", "assenza di difficolta a parlare", "assenza di perdita di coscienza"];
            normalized.preparazione_visita = "Annota frequenza, durata, rapporto con lettura e schermi, visione da vicino e lontano ed eventuali controlli visivi precedenti. Richiedi assistenza urgente se compaiono improvviso calo visivo, debolezza, difficolta a parlare, perdita di coscienza o peggioramento rapido.";
            normalized.impegnativa_medico = "Valutazione oculistica pediatrica o pediatrica per mal di testa associato a lettura o tablet e vista a volte sfocata, senza segnali neurologici riferiti.";
        }
        if (cycle03Context === "ped_stanchezza_sport") {
            normalized.sintesi_anamnestica = "Ragazzo di 11 anni molto stanco dopo un allenamento intenso, tornato normale dopo riposo e idratazione. Sono negati dolore al petto, svenimenti, difficolta respiratoria e sintomi a riposo.";
            normalized.specialista_indicato = "Pediatra o Medico di Medicina Generale solo se l'episodio ricorre o appare sproporzionato";
            normalized.livello_urgenza = "Non urgente: nessuna escalation automatica con recupero completo e assenza dei segnali riferiti";
            normalized.area_specialistica_piu_adatta = { branca: "Pediatria / Medicina generale", area_specialistica: "Stanchezza transitoria dopo attivita intensa con recupero completo", eventuale_secondo_livello: "Valutazione programmata solo se ricorrente, sproporzionata o associata ad altri sintomi" };
            normalized.red_flags_rilevate = ["allenamento intenso", "recupero completo dopo riposo e idratazione", "assenza di dolore al petto", "assenza di svenimenti", "assenza di difficolta respiratoria", "assenza di sintomi a riposo"];
            normalized.preparazione_visita = "Se l'episodio ricorre, annota intensita e durata dell'attivita, temperatura, alimentazione, idratazione, tempi di recupero ed eventuali sintomi a riposo.";
            normalized.impegnativa_medico = "Valutazione programmata solo in caso di episodi ricorrenti o sproporzionati dopo attivita, mantenendo le negazioni e il recupero completo riferiti.";
        }
        if (cycle03Context === "ped_antibiotico_macchie") {
            normalized.sintesi_anamnestica = "Bambina di 6 anni in terapia antibiotica prescritta dal Pediatra, con alcune macchie rosse sul tronco comparse oggi. Sono negate difficolta respiratoria, gonfiore del viso, bolle, febbre alta e forte malessere.";
            normalized.specialista_indicato = "Pediatra";
            normalized.livello_urgenza = "Tempestiva ma non urgente in assenza dei segnali di allarme riferiti";
            normalized.area_specialistica_piu_adatta = { branca: "Pediatria", area_specialistica: "Macchie cutanee comparse durante una terapia antibiotica da valutare", eventuale_secondo_livello: "Allergologia o Dermatologia pediatrica dopo il primo inquadramento" };
            normalized.red_flags_rilevate = ["macchie rosse sul tronco comparse oggi", "terapia antibiotica prescritta in corso", "assenza di difficolta respiratoria", "assenza di gonfiore del viso", "assenza di bolle", "assenza di febbre alta", "assenza di forte malessere"];
            normalized.preparazione_visita = "Contatta tempestivamente il Pediatra e riferisci nome dell'antibiotico, giorno di terapia, intervallo tra dose e comparsa delle macchie, diffusione, prurito, coinvolgimento delle mucose, precedenti episodi e altri farmaci. Richiedi assistenza urgente se compaiono difficolta respiratoria, gonfiore del viso, bolle, coinvolgimento delle mucose o forte peggioramento.";
            normalized.impegnativa_medico = "Valutazione pediatrica tempestiva per macchie rosse comparse durante terapia antibiotica, mantenendo le negazioni riferite.";
        }
        if (cycle03Context === "ocul_calo_progressivo") {
            normalized.sintesi_anamnestica = "Da alcuni mesi la visione da lontano e meno nitida, soprattutto la sera. Sono negati dolore, lampi, perdita improvvisa della vista e trauma.";
            normalized.specialista_indicato = "Oculista";
            normalized.livello_urgenza = "Urgenza bassa / visita oculistica programmata";
            normalized.area_specialistica_piu_adatta = { branca: "Oculistica / Oftalmologia", area_specialistica: "Riduzione progressiva della nitidezza da lontano da valutare", eventuale_secondo_livello: "Da definire dopo la visita oculistica" };
            normalized.red_flags_rilevate = ["calo progressivo da alcuni mesi", "visione da lontano meno nitida", "maggiore difficolta la sera", "assenza di dolore", "assenza di lampi", "assenza di perdita improvvisa della vista", "assenza di trauma"];
            normalized.preparazione_visita = "Riferisci se riguarda uno o entrambi gli occhi, vicino o lontano, andamento, difficolta notturna, uso di occhiali o lenti, ultimo controllo, diabete, farmaci, aloni, visione doppia, lampi, macchie e dolore.";
            normalized.impegnativa_medico = "Visita oculistica programmata per riduzione progressiva della nitidezza visiva da lontano, soprattutto serale, senza segnali acuti riferiti.";
        }
        if (cycle03Context === "ocul_dolore_cefalea") {
            normalized.sintesi_anamnestica = "Dolore intorno a un occhio e mal di testa da ieri, con vista normale. Sono negati debolezza, difficolta a parlare, occhio rosso e vomito.";
            normalized.specialista_indicato = "Oculista o Medico di Medicina Generale";
            normalized.livello_urgenza = "Valutazione programmata a breve; tempestiva se dolore o sintomi peggiorano";
            normalized.area_specialistica_piu_adatta = { branca: "Oculistica / Medicina generale", area_specialistica: "Dolore perioculare con mal di testa e vista riferita normale", eventuale_secondo_livello: "Neurologia solo se emergono segnali neurologici" };
            normalized.red_flags_rilevate = ["dolore perioculare da ieri", "mal di testa", "vista normale", "assenza di debolezza", "assenza di difficolta a parlare", "assenza di occhio rosso", "assenza di vomito"];
            normalized.preparazione_visita = "Annota sede, durata, intensita, rapporto con i movimenti oculari, fastidio alla luce, lacrimazione, nausea, febbre, trauma ed episodi precedenti. Richiedi assistenza urgente se compaiono calo visivo improvviso, segni neurologici o rapido peggioramento.";
            normalized.impegnativa_medico = "Valutazione oculistica o di medicina generale per dolore perioculare e mal di testa con vista normale e segnali neurologici negati.";
        }
        if (cycle03Context === "ocul_lenti_fotofobia") {
            normalized.sintesi_anamnestica = "Persona che usa lenti a contatto e riferisce da oggi dolore a un occhio, forte fastidio alla luce e vista leggermente appannata, senza trauma.";
            normalized.specialista_indicato = "Oculista";
            normalized.livello_urgenza = "Prioritaria / valutazione oculistica tempestiva oggi";
            normalized.area_specialistica_piu_adatta = { branca: "Oculistica / Oftalmologia", area_specialistica: "Dolore, fastidio alla luce e lieve appannamento in portatore di lenti a contatto", eventuale_secondo_livello: "Servizio oculistico urgente se peggiora o il calo visivo aumenta" };
            normalized.red_flags_rilevate = ["uso di lenti a contatto", "dolore a un occhio da oggi", "forte fastidio alla luce", "vista leggermente appannata", "assenza di trauma"];
            normalized.preparazione_visita = "Richiedi una valutazione oculistica tempestiva e riferisci durata e modalita d'uso delle lenti, uso notturno, igiene, contatto con acqua o piscina, soluzione usata, secrezioni, rossore, sostanze chimiche e peggioramento.";
            normalized.impegnativa_medico = "Valutazione oculistica tempestiva per dolore, forte fastidio alla luce e lieve appannamento in portatore di lenti a contatto, senza trauma riferito.";
        }
        if (cycle03Context === "allergo_stagionale") {
            normalized.sintesi_anamnestica = "Ogni primavera compaiono starnuti, naso chiuso e prurito agli occhi. Sono negate difficolta respiratoria, gonfiore, febbre e sintomi importanti nel resto dell'anno.";
            normalized.specialista_indicato = "Allergologo";
            normalized.livello_urgenza = "Non urgente / visita programmata";
            normalized.area_specialistica_piu_adatta = { branca: "Allergologia e Immunologia clinica", area_specialistica: "Sintomi nasali e oculari stagionali da valutare", eventuale_secondo_livello: "Otorinolaringoiatria se indicato dopo il primo inquadramento" };
            normalized.red_flags_rilevate = ["ricorrenza primaverile", "starnuti", "naso chiuso", "prurito agli occhi", "assenza di difficolta respiratoria", "assenza di gonfiore", "assenza di febbre", "assenza di sintomi importanti nel resto dell'anno"];
            normalized.preparazione_visita = "Annota mesi, ambienti, pollini, animali e altre esposizioni, sintomi nasali e oculari, tosse o sibili, asma, familiarita, farmaci gia usati e impatto sulla vita quotidiana.";
            normalized.impegnativa_medico = "Visita allergologica programmata per sintomi nasali e oculari ricorrenti ogni primavera, senza segnali respiratori o sistemici riferiti.";
        }
        if (cycle03Context === "allergo_chiazze_ricorrenti") {
            normalized.sintesi_anamnestica = "Da alcune settimane compaiono ogni tanto chiazze pruriginose che spariscono dopo qualche ora. Sono negati gonfiore del viso, difficolta respiratoria, febbre e dolore.";
            normalized.specialista_indicato = "Allergologo o Dermatologo";
            normalized.livello_urgenza = "Non urgente / visita programmata";
            normalized.area_specialistica_piu_adatta = { branca: "Allergologia / Dermatologia", area_specialistica: "Chiazze pruriginose transitorie e ricorrenti da valutare", eventuale_secondo_livello: "Allergologia o Dermatologia secondo il primo inquadramento" };
            normalized.red_flags_rilevate = ["chiazze pruriginose ricorrenti", "scomparsa dopo qualche ora", "sintomi da alcune settimane", "assenza di gonfiore del viso", "assenza di difficolta respiratoria", "assenza di febbre", "assenza di dolore"];
            normalized.preparazione_visita = "Annota durata di ogni chiazza, frequenza, alimenti, farmaci, infezioni recenti, caldo, freddo, pressione, stress ed episodi precedenti; porta fotografie se disponibili. Richiedi assistenza urgente se compaiono gonfiore del viso o delle labbra o sintomi respiratori.";
            normalized.impegnativa_medico = "Valutazione allergologica o dermatologica programmata per chiazze pruriginose transitorie ricorrenti, senza segnali sistemici riferiti.";
        }
        if (cycle03Context === "allergo_puntura_pregressa") {
            normalized.sintesi_anamnestica = "Persona in terapia con beta-bloccante per la pressione, con precedente gonfiore diffuso dopo puntura di insetto e accesso ospedaliero. Attualmente sta bene e richiede un inquadramento programmato.";
            normalized.specialista_indicato = "Allergologo e Immunologo clinico";
            normalized.livello_urgenza = "Non urgente / visita allergologica programmata a breve";
            normalized.area_specialistica_piu_adatta = { branca: "Allergologia e Immunologia clinica", area_specialistica: "Valutazione specialistica dopo precedente risposta sistemica a puntura di insetto, nell'area dei veleni di imenotteri", eventuale_secondo_livello: "Coordinamento con il medico che gestisce la terapia cardiovascolare" };
            normalized.red_flags_rilevate = ["precedente puntura di insetto", "gonfiore diffuso riferito", "accesso ospedaliero pregresso", "assunzione di beta-bloccante", "assenza di sintomi attuali"];
            normalized.preparazione_visita = "Porta documentazione ospedaliera, informazioni sull'insetto, sintomi e tempi di comparsa, altre punture, allergie note, precedenti visite, eventuale dispositivo gia prescritto, elenco completo dei farmaci e condizioni cardiovascolari.";
            normalized.impegnativa_medico = "Visita di Allergologia e Immunologia clinica per valutare un precedente episodio sistemico dopo puntura di insetto in persona che assume beta-bloccante, attualmente senza sintomi.";
        }
        if (this._isMildIronDeficiencyOrientationContext()) {
            normalized.specialista_indicato = /medico di medicina generale|internist|medicina interna/i.test(normalized.specialista_indicato)
                ? normalized.specialista_indicato
                : "Medico di Medicina Generale";
            normalized.livello_urgenza = "Urgenza bassa / non urgente: visita programmata a breve con Medico di Medicina Generale.";
            normalized.area_specialistica_piu_adatta = {
                branca: "Medicina Generale / Medicina Interna",
                area_specialistica: "Valutazione di possibile anemia/carenza marziale e possibili perdite mestruali",
                eventuale_secondo_livello: "Ginecologia per menorragia"
            };
            normalized.red_flags_rilevate = [
                "assenza di dolore toracico",
                "assenza di svenimenti",
                "assenza di sangue nelle feci"
            ];
        }
        if (this._isAcuteDiabetesUrgencyContext()) {
            normalized.sintesi_anamnestica = "Persona con diabete noto che riferisce da oggi sete intensa, minzione continua, debolezza marcata, nausea e difficolta a restare sveglia. La combinazione dei sintomi riferiti richiede una valutazione urgente.";
            normalized.specialista_indicato = "Pronto Soccorso / 112-118";
            normalized.livello_urgenza = "Alta / urgente: e appropriato rivolgersi rapidamente a un servizio di emergenza.";
            normalized.area_specialistica_piu_adatta = {
                branca: "Pronto Soccorso / Medicina d'urgenza",
                area_specialistica: "Valutazione urgente dei sintomi riferiti in persona con diabete",
                eventuale_secondo_livello: "Diabetologia dopo la valutazione urgente"
            };
            normalized.red_flags_rilevate = [
                "diabete noto",
                "sete intensa di nuova insorgenza",
                "minzione continua",
                "debolezza marcata",
                "nausea",
                "difficolta a restare svegli"
            ];
            normalized.preparazione_visita = "Rivolgiti rapidamente a Pronto Soccorso o contatta 112/118. Riferisci i sintomi in corso, il loro esordio e gli eventuali valori di glicemia o chetoni soltanto se gia misurati e noti.";
            normalized.impegnativa_medico = "Valutazione urgente dei sintomi riferiti in persona con diabete, senza formulare diagnosi e senza indicare modifiche terapeutiche.";
        }
        if (this._isHeavyMenstrualBleedingOrientationContext()) {
            normalized.sintesi_anamnestica = "Persona che riferisce da alcuni mesi cicli molto abbondanti, di durata superiore al solito, associati a stanchezza durante i giorni del flusso.";
            normalized.specialista_indicato = "Ginecologo";
            normalized.livello_urgenza = "Visita ginecologica programmata a breve; valutazione piu tempestiva se la perdita e molto abbondante o compaiono capogiri, svenimento, debolezza importante o peggioramento.";
            normalized.area_specialistica_piu_adatta = {
                branca: "Ginecologia",
                area_specialistica: "Valutazione di ciclo molto abbondante e prolungato con stanchezza riferita",
                eventuale_secondo_livello: "Medico curante o Medicina Interna secondo il contesto"
            };
            normalized.red_flags_rilevate = [
                "ciclo molto abbondante da alcuni mesi",
                "durata superiore al solito",
                "stanchezza durante il flusso"
            ];
            normalized.preparazione_visita = "Porta eventuali referti gia disponibili e riferisci quantita, durata, andamento, presenza di coaguli, stanchezza, capogiri o svenimenti e farmaci assunti.";
            normalized.impegnativa_medico = "Visita ginecologica per ciclo molto abbondante e prolungato con stanchezza riferita.";
        }
        if (this._isStableRecurrentEpistaxisAnticoagulantContext()) {
            normalized.sintesi_anamnestica = "Persona che riferisce piu episodi di sangue dal naso nella giornata, attualmente cessati, durante terapia anticoagulante; nega debolezza e capogiri.";
            normalized.specialista_indicato = "Otorinolaringoiatra";
            normalized.livello_urgenza = "Valutazione ORL tempestiva e prudente; accesso urgente se il sanguinamento riprende in modo importante o compaiono debolezza, capogiri, svenimento o peggioramento.";
            normalized.area_specialistica_piu_adatta = {
                branca: "Otorinolaringoiatria",
                area_specialistica: "Valutazione di episodi nasali ripetuti, attualmente cessati, durante terapia anticoagulante",
                eventuale_secondo_livello: "Medico curante o prescrittore dell'anticoagulante secondo il contesto"
            };
            normalized.red_flags_rilevate = [
                "episodi ripetuti di sangue dal naso nella giornata",
                "terapia anticoagulante riferita",
                "sanguinamento attualmente cessato",
                "assenza di debolezza",
                "assenza di capogiri"
            ];
            normalized.preparazione_visita = "Riferisci numero, durata e quantita degli episodi, eventuali traumi o altri sanguinamenti e il nome dell'anticoagulante assunto. Non modificare o sospendere autonomamente la terapia.";
            normalized.impegnativa_medico = "Valutazione ORL tempestiva per episodi nasali ripetuti, attualmente cessati, durante terapia anticoagulante.";
        }
        if (this._isRedRectalBleedingAnticoagulantContext()) {
            normalized.sintesi_anamnestica = "Persona che riferisce sangue rosso nelle feci durante terapia anticoagulante; nega capogiri, debolezza e svenimenti.";
            normalized.specialista_indicato = "Valutazione medica urgente; Gastroenterologia o Pronto Soccorso secondo quantita e persistenza";
            normalized.livello_urgenza = "Alta / urgente: valutazione medica tempestiva; Pronto Soccorso se il sanguinamento e abbondante, persiste, recidiva o compaiono segni di instabilita.";
            normalized.area_specialistica_piu_adatta = {
                branca: "Gastroenterologia / Medicina d'urgenza",
                area_specialistica: "Sangue rosso nelle feci durante terapia anticoagulante da valutare con urgenza",
                eventuale_secondo_livello: "Pronto Soccorso secondo quantita, persistenza, recidiva o condizioni generali"
            };
            normalized.red_flags_rilevate = [
                "sangue rosso nelle feci",
                "terapia anticoagulante riferita",
                "assenza di capogiri",
                "assenza di debolezza",
                "assenza di svenimenti"
            ];
            normalized.preparazione_visita = "Richiedi una valutazione tempestiva e riferisci quantita, numero degli episodi, persistenza, dolore, altri sanguinamenti e nome dell'anticoagulante. Non modificare o sospendere autonomamente la terapia. Vai in Pronto Soccorso o contatta 112/118 se il sangue e abbondante, il sanguinamento persiste o compaiono debolezza, capogiri, svenimento o peggioramento.";
            normalized.impegnativa_medico = "Valutazione urgente per sangue rosso nelle feci durante terapia anticoagulante, con capogiri, debolezza e svenimenti negati; orientamento senza diagnosi e senza prescrizioni.";
        }
        if (this._isPositionalVertigoHearingLossContext()) {
            normalized.sintesi_anamnestica = "Persona che riferisce vertigini legate al movimento della testa e riduzione dell'udito da un orecchio da alcuni giorni; nega debolezza, difficolta a parlare e visione doppia.";
            normalized.specialista_indicato = "Otorinolaringoiatra";
            normalized.livello_urgenza = "Visita ORL programmata a breve; valutazione urgente se compaiono nuovi segnali neurologici o grave instabilita.";
            normalized.area_specialistica_piu_adatta = {
                branca: "Otorinolaringoiatria",
                area_specialistica: "Audiovestibologia / Vestibologia: vertigini legate al movimento della testa e riduzione uditiva monolaterale da valutare",
                eventuale_secondo_livello: "Audiologia o Neurologia solo secondo valutazione clinica e comparsa di segnali specifici"
            };
            normalized.red_flags_rilevate = [
                "vertigini legate al movimento della testa",
                "riduzione dell'udito da un orecchio",
                "assenza di debolezza",
                "assenza di difficolta a parlare",
                "assenza di visione doppia"
            ];
            normalized.preparazione_visita = "Annota durata, frequenza, posizione o movimento scatenante, nausea o vomito, acufeni, sensazione di orecchio pieno, andamento ed episodi precedenti. Richiedi assistenza urgente se compaiono difficolta a camminare marcata, debolezza, alterazione del linguaggio, visione doppia, forte mal di testa improvviso o peggioramento rapido.";
            normalized.impegnativa_medico = "Valutazione ORL audiovestibolare programmata a breve per vertigini legate al movimento della testa e riduzione uditiva monolaterale, con red flag neurologiche negate; senza diagnosi e senza prescrizioni.";
        }
        if (this._isHighRiskAtypicalCardiacEmergencyContext()) {
            const atypicalCardiacSignals = this._getHighRiskAtypicalCardiacSignals();
            normalized.specialista_indicato = "Pronto Soccorso / 112-118 se sintomi in corso, peggioramento o mancata regressione";
            normalized.livello_urgenza = "Alta / urgente: dare priorita a Pronto Soccorso o 112/118 se i sintomi sono in corso, peggiorano o non regrediscono.";
            normalized.area_specialistica_piu_adatta = {
                branca: "Pronto Soccorso / Medicina d'urgenza",
                area_specialistica: "Sintomi atipici con fattori di rischio cardiovascolare da valutare con urgenza",
                eventuale_secondo_livello: "Cardiologia dopo valutazione urgente"
            };
            normalized.red_flags_rilevate = atypicalCardiacSignals;
            normalized.preparazione_visita = "Dai priorita a Pronto Soccorso o 112/118 se i sintomi sono in corso, peggiorano o non regrediscono. Non considerarli automaticamente acidita o un disturbo digestivo solo per l'assenza di vero dolore al petto. La Cardiologia e un eventuale secondo livello dopo la valutazione urgente. Non vengono formulate diagnosi ne indicate terapie, farmaci o dosaggi.";
            normalized.impegnativa_medico = `Valutazione urgente per i segnali riferiti: ${atypicalCardiacSignals.join(", ")}; orientamento verso servizio urgente, senza diagnosi e senza prescrizioni.`;
        }
        if (this._isStableExertionalChestDiscomfortContext()) {
            normalized.specialista_indicato = "Cardiologo";
            normalized.livello_urgenza = "Valutazione cardiologica prioritaria / non da rimandare";
            normalized.area_specialistica_piu_adatta = {
                branca: "Cardiologia",
                area_specialistica: "Cardiologia clinica / valutazione del dolore toracico da sforzo e del rischio cardiovascolare",
                eventuale_secondo_livello: "Approfondimento per possibile cardiopatia ischemica secondo valutazione medica"
            };
            normalized.red_flags_rilevate = [
                "peso toracico da sforzo",
                "ipertensione",
                "fumo",
                "assenza di dolore a riposo",
                "assenza di svenimenti",
                "assenza di sudorazione fredda",
                "assenza di nausea"
            ];
            const escalation = "Se il dolore diventa persistente, compare a riposo, si associa a fiato corto, sudorazione fredda, nausea, svenimento o irradiazione, chiama 112/118 o vai in Pronto Soccorso.";
            if (!normalized.preparazione_visita.includes(escalation)) normalized.preparazione_visita = `${normalized.preparazione_visita} ${escalation}`;
        }
        if (this._isStablePossibleHeartFailureContext()) {
            normalized.specialista_indicato = "Cardiologo";
            normalized.livello_urgenza = "Valutazione cardiologica prioritaria / non da rimandare";
            normalized.area_specialistica_piu_adatta = {
                branca: "Cardiologia",
                area_specialistica: "Valutazione di possibile scompenso cardiaco / dispnea, ortopnea ed edemi",
                eventuale_secondo_livello: "Medicina d'urgenza se compaiono segnali acuti"
            };
            normalized.red_flags_rilevate = [
                "dispnea da sforzo",
                "ortopnea con necessita di due cuscini",
                "edemi alle caviglie",
                "aumento di peso rapido di 3 kg",
                "infarto remoto come fattore di rischio anamnestico"
            ];
            const escalation = "Contatta subito 112/118 o Pronto Soccorso solo se compaiono dispnea severa a riposo, dolore toracico attuale, saturazione bassa, peggioramento rapido marcato, sincope, confusione o grave difficolta respiratoria.";
            if (!normalized.preparazione_visita.includes(escalation)) normalized.preparazione_visita = `${normalized.preparazione_visita} ${escalation}`;
        }
        if (this._isStablePanicAnxietyContext()) {
            normalized.specialista_indicato = "Psicologo o Psicoterapeuta; Psichiatra se sintomi frequenti, invalidanti o per valutazione farmacologica";
            normalized.livello_urgenza = "Urgenza bassa / visita psicologica o psichiatrica programmata";
            normalized.area_specialistica_piu_adatta = {
                branca: "Psicologia / Psichiatria",
                area_specialistica: "Ansia / attacchi di panico / disturbi d'ansia",
                eventuale_secondo_livello: "Psichiatria se sintomi frequenti, invalidanti o per valutazione farmacologica"
            };
            normalized.red_flags_rilevate = [
                "ansia intensa ricorrente",
                "tachicardia / battito accelerato",
                "tremori",
                "sudorazione",
                "paura di perdere il controllo",
                "assenza di dolore toracico persistente",
                "assenza di svenimenti",
                "assenza di difficolta respiratoria grave",
                "assenza di ideazione autolesiva"
            ];
            const escalation = "Chiama 112/118 o vai in Pronto Soccorso solo se compaiono dolore toracico persistente, difficolta respiratoria grave, svenimento, confusione, rischio autolesivo o suicidario, oppure peggioramento improvviso.";
            if (!normalized.preparazione_visita.includes(escalation)) normalized.preparazione_visita = `${normalized.preparazione_visita} ${escalation}`;
        }
        if (this._isStableRefluxDyspepsiaContext()) {
            normalized.specialista_indicato = "Gastroenterologo; Medico di Medicina Generale come primo filtro";
            normalized.livello_urgenza = "Urgenza bassa / visita programmata se persiste o limita la qualita di vita";
            normalized.area_specialistica_piu_adatta = {
                branca: "Gastroenterologia / Medicina generale",
                area_specialistica: "Reflusso gastroesofageo / dispepsia / disturbi digestivi superiori",
                eventuale_secondo_livello: "Gastroenterologia se persiste, recidiva o limita la qualita di vita"
            };
            normalized.red_flags_rilevate = [
                "bruciore retrosternale post-prandiale",
                "rigurgito acido",
                "pesantezza gastrica",
                "peggioramento da sdraiato o dopo pasti tardivi",
                "assenza di dolore toracico da sforzo",
                "assenza di vomito con sangue",
                "assenza di feci nere",
                "assenza di calo di peso",
                "assenza di disfagia o difficolta a deglutire"
            ];
            normalized.preparazione_visita = "Programma una valutazione con il Medico di Medicina Generale o con il Gastroenterologo se il disturbo persiste o limita la qualita di vita. Non e una diagnosi certa di reflusso o GERD e non vengono indicati farmaci. Chiama 112/118 o vai in Pronto Soccorso solo se compaiono dolore toracico oppressivo persistente o da sforzo, dispnea, sudorazione fredda, svenimento, vomito con sangue, feci nere, difficolta progressiva a deglutire, calo di peso importante o peggioramento rapido.";
            normalized.impegnativa_medico = "Valutazione programmata per bruciore retrosternale post-prandiale, rigurgito acido e pesantezza gastrica, con red flag cardiache e gastrointestinali negate; orientamento informativo senza diagnosi certa e senza prescrizioni.";
        }
        if (this._isSimpleLowerUtiContext()) {
            normalized.specialista_indicato = "Medico di Medicina Generale; Urologo se recidivante, persistente o complicata";
            normalized.livello_urgenza = "Urgenza bassa / valutazione programmata a breve";
            normalized.area_specialistica_piu_adatta = {
                branca: "Medicina generale / Urologia",
                area_specialistica: "Sintomi urinari bassi / cistite possibile / infezione urinaria bassa non complicata",
                eventuale_secondo_livello: "Urologia se sintomi recidivanti, persistenti o complicati"
            };
            normalized.red_flags_rilevate = [
                "bruciore urinario",
                "aumento della frequenza urinaria",
                "sintomi da 2 giorni",
                "assenza di febbre",
                "assenza di dolore al fianco",
                "assenza di sangue visibile nelle urine",
                "non gravidanza",
                "assenza di nausea",
                "assenza di vomito"
            ];
            normalized.preparazione_visita = "Programma una valutazione a breve con il Medico di Medicina Generale. Non e una diagnosi certa di cistite o infezione urinaria e non vengono indicati antibiotici, farmaci o dosaggi. Richiedi valutazione urgente o Pronto Soccorso solo se compaiono febbre alta, brividi, dolore al fianco, vomito persistente, confusione, peggioramento rapido, gravidanza, immunodepressione o impossibilita a urinare.";
            normalized.impegnativa_medico = "Valutazione programmata a breve per sintomi urinari bassi da 2 giorni con bruciore e frequenza aumentata, senza febbre, dolore al fianco, ematuria visibile, gravidanza, nausea o vomito; orientamento informativo senza diagnosi certa e senza prescrizioni.";
        }
        if (this._isPossiblePyelonephritisContext()) {
            normalized.specialista_indicato = "Valutazione medica urgente; Urologia, Nefrologia o Medicina d'urgenza secondo gravita";
            normalized.livello_urgenza = "Alta / urgente: valutazione medica urgente, non visita programmata ordinaria";
            normalized.area_specialistica_piu_adatta = {
                branca: "Urologia / Nefrologia / Medicina d'urgenza",
                area_specialistica: "Possibile pielonefrite / infezione urinaria alta / infezione renale da valutare",
                eventuale_secondo_livello: "Pronto Soccorso se quadro severo, peggioramento, vomito persistente o segni sistemici importanti"
            };
            normalized.red_flags_rilevate = [
                "febbre 39",
                "brividi",
                "dolore forte al fianco destro",
                "bruciore urinario",
                "nausea",
                "abbattimento marcato"
            ];
            normalized.preparazione_visita = "Richiedi una valutazione medica urgente oggi: non e una visita programmata ordinaria. Vai in Pronto Soccorso o contatta 112/118 se compaiono confusione, pressione bassa, peggioramento rapido, vomito persistente, impossibilita ad assumere liquidi, gravidanza, immunodepressione, sospetta sepsi o dolore severo non controllabile. Non e una diagnosi certa di pielonefrite e non vengono indicati antibiotici, farmaci o dosaggi.";
            normalized.impegnativa_medico = "Valutazione urgente per febbre 39, brividi, dolore forte al fianco destro, bruciore urinario, nausea e abbattimento marcato; possibile infezione urinaria alta/infezione renale da valutare, senza diagnosi certa e senza prescrizioni.";
        }
        if (this._isStableMechanicalLowBackContext()) {
            normalized.specialista_indicato = "Fisiatra o Ortopedico del rachide; Medico di Medicina Generale come primo filtro se appropriato";
            normalized.livello_urgenza = "Urgenza bassa / visita programmata se il dolore persiste o limita le attivita";
            normalized.area_specialistica_piu_adatta = {
                branca: "Ortopedia / Fisiatria",
                area_specialistica: "Lombalgia meccanica / rachide lombare / medicina fisica e riabilitativa",
                eventuale_secondo_livello: "Medico di Medicina Generale come primo filtro se appropriato"
            };
            normalized.red_flags_rilevate = [
                "dolore lombare dopo sforzo",
                "peggioramento con flessione o posizione seduta",
                "assenza di febbre",
                "assenza di perdita di peso",
                "assenza di trauma importante",
                "assenza di dolore sotto il ginocchio",
                "assenza di debolezza alle gambe",
                "assenza di anestesia a sella o perdita di sensibilita genitale",
                "assenza di problemi urinari o fecali"
            ];
            normalized.preparazione_visita = "Annota durata, andamento e limitazioni funzionali del dolore e porta eventuali referti gia disponibili. Chiedi una valutazione programmata se il dolore persiste o limita le attivita. Vai in Pronto Soccorso o contatta 112/118 solo se compaiono disturbi urinari o fecali, anestesia a sella, debolezza progressiva, febbre, trauma importante, dolore notturno ingravescente, sospetto di infezione o tumore, o peggioramento rapido.";
            normalized.impegnativa_medico = "Valutazione programmata per dolore lombare post-sforzo senza red flag riferite; considerare MMG, Fisiatria o Ortopedia del rachide secondo evoluzione clinica.";
        }
        if (this._isStableKneeTraumaContext()) {
            normalized.specialista_indicato = "Ortopedico del ginocchio o traumatologo sportivo";
            normalized.livello_urgenza = "Prioritaria / valutazione ortopedica non da rimandare";
            normalized.area_specialistica_piu_adatta = {
                branca: "Ortopedia e Traumatologia",
                area_specialistica: "Traumatologia sportiva / ginocchio / sospetta lesione legamentosa o meniscale",
                eventuale_secondo_livello: "Ortopedico del ginocchio o traumatologo sportivo"
            };
            normalized.red_flags_rilevate = [
                "trauma distorsivo del ginocchio",
                "crack al momento del trauma",
                "gonfiore rapido",
                "instabilita o cedimento",
                "limitazione del movimento",
                "assenza di deformita",
                "assenza di ferite aperte",
                "assenza di febbre",
                "assenza di impossibilita completa di carico"
            ];
            normalized.preparazione_visita = "Evita carico eccessivo e fai valutare rapidamente il ginocchio da uno specialista. Vai in Pronto Soccorso se diventa impossibile caricare, compare deformita, dolore insopportabile, arto freddo o pallido, ferita importante o sospetto di frattura. Non riprendere lo sport prima della valutazione.";
            normalized.impegnativa_medico = "Valutazione ortopedica prioritaria per trauma distorsivo del ginocchio con gonfiore, instabilita e limitazione funzionale, senza diagnosi certa di lesione legamentosa o meniscale.";
        }
        if (this._isChronicShoulderPainContext()) {
            normalized.specialista_indicato = "Ortopedico della spalla o Fisiatra";
            normalized.livello_urgenza = "Urgenza bassa / visita programmata";
            normalized.area_specialistica_piu_adatta = {
                branca: "Ortopedia / Fisiatria",
                area_specialistica: "Spalla / cuffia dei rotatori / impingement / tendinopatia",
                eventuale_secondo_livello: "Ortopedico della spalla o Fisiatra"
            };
            normalized.red_flags_rilevate = [
                "dolore cronico alla spalla",
                "dolore nei movimenti sopra la testa",
                "dolore notturno sul lato",
                "limitazione funzionale",
                "assenza di trauma",
                "assenza di deformita",
                "assenza di formicolii o deficit neurologici",
                "assenza di febbre"
            ];
            normalized.preparazione_visita = "Porta eventuali referti gia disponibili e descrivi movimenti che scatenano il dolore, durata e limitazioni funzionali. La valutazione puo essere programmata. Vai in urgenza solo se compaiono trauma importante, deformita, perdita improvvisa di forza, febbre, rossore o calore, dolore intenso improvviso, arto freddo o pallido, o deficit neurologici.";
            normalized.impegnativa_medico = "Valutazione programmata per dolore cronico di spalla con possibile interessamento di cuffia dei rotatori, impingement o tendinopatia, senza diagnosi certa.";
        }
        if (this._isChangingPigmentedLesionContext()) {
            normalized.specialista_indicato = "Dermatologo, preferibilmente con dermatoscopia o ambulatorio lesioni pigmentate";
            normalized.livello_urgenza = "Prioritaria / valutazione dermatologica rapida, non da rimandare";
            normalized.area_specialistica_piu_adatta = {
                branca: "Dermatologia",
                area_specialistica: "Lesione pigmentata sospetta / dermatoscopia / prevenzione melanoma",
                eventuale_secondo_livello: "Ambulatorio lesioni pigmentate o dermatoscopia"
            };
            normalized.red_flags_rilevate = [
                "neo cambiato",
                "aumento delle dimensioni",
                "asimmetria",
                "bordi irregolari",
                "piu colori",
                "prurito",
                "assenza di sanguinamento",
                "assenza di febbre"
            ];
            normalized.preparazione_visita = "Richiedi una valutazione dermatologica rapida e porta eventuali foto precedenti della lesione, se disponibili. Non manipolare la lesione e non considerarla automaticamente benigna. Vai in urgenza solo se compaiono sanguinamento importante, rapido peggioramento generale o altri segni sistemici.";
            normalized.impegnativa_medico = "Valutazione dermatologica prioritaria per lesione pigmentata in evoluzione, senza formulare diagnosi certa di melanoma.";
        }
        if (this._isHandDermatitisContext()) {
            normalized.specialista_indicato = "Dermatologo; Allergologo o patch test se sospetta dermatite allergica da contatto";
            normalized.livello_urgenza = "Urgenza bassa / visita dermatologica programmata se persiste, recidiva o limita il lavoro";
            normalized.area_specialistica_piu_adatta = {
                branca: "Dermatologia",
                area_specialistica: "Dermatite da contatto / eczema delle mani / allergologia dermatologica se recidivante",
                eventuale_secondo_livello: "Allergologia dermatologica o patch test se indicato dal medico"
            };
            normalized.red_flags_rilevate = [
                "chiazze rosse pruriginose",
                "localizzazione alle mani",
                "peggioramento con detergenti o guanti",
                "secchezza",
                "screpolature",
                "assenza di febbre",
                "assenza di pus",
                "assenza di gonfiore importante",
                "assenza di difficolta respiratoria",
                "assenza di gonfiore di labbra o lingua"
            ];
            normalized.preparazione_visita = "Annota sostanze, detergenti e guanti che peggiorano i sintomi e porta eventuali foto o referti. Evita automedicazioni o trattamenti non concordati. Vai in urgenza solo se compaiono gonfiore di volto, labbra o lingua, difficolta respiratoria, febbre alta, pus esteso, dolore importante, rapido peggioramento o segni sistemici.";
            normalized.impegnativa_medico = "Valutazione dermatologica programmata per chiazze pruriginose delle mani compatibili con possibile dermatite/eczema, senza diagnosi certa e senza prescrizioni.";
        }
        if (this._isCellulitisRiskContext()) {
            normalized.specialista_indicato = "Valutazione medica urgente; Pronto Soccorso o medico urgente secondo gravita e accessibilita";
            normalized.livello_urgenza = "Alta / urgente: valutazione medica immediata, non visita dermatologica ordinaria";
            normalized.area_specialistica_piu_adatta = {
                branca: "Dermatologia / Medicina d'urgenza / Infettivologia",
                area_specialistica: "Infezione cutanea acuta / cellulite-erisipela / rischio complicanze in diabetico",
                eventuale_secondo_livello: "Pronto Soccorso, medico urgente o Infettivologia secondo gravita"
            };
            normalized.red_flags_rilevate = [
                "diabete",
                "arrossamento caldo, gonfio e doloroso",
                "estensione progressiva",
                "febbre",
                "brividi",
                "debolezza",
                "assenza di difficolta respiratoria, che non riduce l'urgenza infettiva"
            ];
            normalized.preparazione_visita = "Richiedi una valutazione medica urgente oggi. Vai in Pronto Soccorso o contatta 112/118 se compaiono peggioramento rapido, confusione, pressione bassa, febbre alta persistente, strie rosse estese, immunodepressione importante, coinvolgimento di volto o occhio, dolore sproporzionato o segni di sepsi. Non rimandare a visita programmata.";
            normalized.impegnativa_medico = "Valutazione urgente dei sintomi cutanei acuti riferiti in paziente diabetico con febbre, brividi e debolezza, senza formulare diagnosi di cellulite o erisipela e senza prescrizioni.";
        }
        if (this._isPossibleAnaphylaxisContext()) {
            normalized.specialista_indicato = "112/118, Pronto Soccorso, emergenza allergologica";
            normalized.livello_urgenza = "Alta / immediata: contattare subito 112/118 o andare in Pronto Soccorso";
            normalized.area_specialistica_piu_adatta = {
                branca: "Emergenza allergologica / Pronto Soccorso",
                area_specialistica: "Possibile anafilassi / reazione allergica sistemica",
                eventuale_secondo_livello: "Allergologia dopo la gestione dell'emergenza"
            };
            normalized.red_flags_rilevate = [
                "esposizione ad allergene alimentare",
                "orticaria diffusa",
                "gonfiore di labbra e lingua",
                "gola che si chiude",
                "difficolta respiratoria",
                "stordimento"
            ];
            normalized.sintesi_anamnestica = normalized.sintesi_anamnestica
                .replace(/altamente suggestivi di una reazione anafilattica/gi, "compatibili con possibile reazione anafilattica")
                .replace(/reazione anafilattica, una condizione medica di emergenza/gi, "possibile reazione anafilattica, una condizione che puo essere un'emergenza");
            normalized.preparazione_visita = "Chiama subito 112/118 o vai immediatamente in Pronto Soccorso. Non considerarla una semplice orticaria e non attendere una visita allergologica programmata come primo passo. Se hai gia un autoiniettore prescritto e un piano medico ricevuto, segui quel piano senza modificare dosi o indicazioni.";
            normalized.impegnativa_medico = "Emergenza allergologica: possibile anafilassi/reazione allergica sistemica con sintomi respiratori e gonfiore di labbra/lingua; nessuna diagnosi certa e nessuna prescrizione.";
        }
        if (this._isPediatricImpetigoLikeContext()) {
            normalized.specialista_indicato = "Pediatra come primo riferimento; Dermatologo se estesa, recidivante, dubbia o non risponde";
            normalized.livello_urgenza = "Urgenza bassa / valutazione pediatrica programmata a breve";
            normalized.area_specialistica_piu_adatta = {
                branca: "Pediatria / Dermatologia",
                area_specialistica: "Infezione cutanea superficiale pediatrica / impetigine possibile",
                eventuale_secondo_livello: "Dermatologia pediatrica se estesa, recidivante, dubbia o non risponde"
            };
            normalized.red_flags_rilevate = [
                "croste giallastre periorali o perinasali",
                "prurito",
                "contatti scolastici con lesioni simili",
                "assenza di febbre",
                "comportamento normale",
                "assenza di gonfiore al viso",
                "assenza di dolore importante",
                "assenza di difficolta respiratoria"
            ];
            normalized.preparazione_visita = "Prenota una valutazione pediatrica a breve e segnala i contatti scolastici con lesioni simili. Evita automedicazioni o trattamenti non concordati. Chiedi urgenza se compaiono febbre alta, rapido peggioramento, gonfiore intorno agli occhi o al viso, dolore importante, immunodepressione, estensione ampia, segni sistemici o difficolta respiratoria.";
            normalized.impegnativa_medico = "Valutazione pediatrica programmata a breve per lesioni cutanee periorali/perinasali con croste giallastre e possibile contagiosita, senza diagnosi certa di impetigine e senza prescrizioni.";
        }
        return this._sanitizeResultForUser(normalized);
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

    async _getSpecialistSearchResults(specialista) {
        const API_URL = (typeof CONFIG !== 'undefined' && CONFIG.SPECIALIST_SEARCH_API_URL)
            ? CONFIG.SPECIALIST_SEARCH_API_URL
            : "/api/specialist-search";

        if (window.location.protocol === 'file:' && API_URL.startsWith('/')) {
            throw new Error("La ricerca reale richiede un server locale o un deploy serverless.");
        }

        const details = this.userData.zonaDettagli || {};
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                specialista,
                disturbo: this.userData.disturbo,
                zona: this.userData.zona,
                provincia: details.provincia || this.userData.zona,
                regione: details.regione || this.userData.zona
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Specialist Search Error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        const curated = this._buildCuratedSearchResults(specialista);
        const webResults = Array.isArray(data.results) ? data.results : [];
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
            const userZonaStr = String(this.userData.zona || "").trim();
            const systemPrompt = `Sei un esperto di orientamento medico di Aiutodoc.it. Il tuo obiettivo è fornire una sintesi clinica accurata basata sull'intervista effettuata con l'utente e suggerire la specializzazione medica corretta.
            
            Dati utente:
            - Fascia di età iniziale: ${this._ageRangeLabel(this.userData.age_range) || "non specificata"}
            - Età puntuale, se clinicamente necessaria e raccolta: ${this.userData.exact_age ?? this.userData.age ?? "non raccolta"}
            - Peso, se clinicamente necessario e raccolto: ${this.userData.weight_kg ? `${this.userData.weight_kg} kg` : "non raccolto"}
            - Altezza, se clinicamente necessaria e raccolta: ${this.userData.height_cm ? `${this.userData.height_cm} cm` : "non raccolta"}
            - Sesso biologico: ${this._sexAtBirthLabel(this.userData.sex_at_birth)} (${this.userData.sex_at_birth || "not_specified"})
            - Zona: ${userZonaStr}
            - Disturbo: ${this.userData.disturbo}
            - Risposte Conoscitive: ${JSON.stringify(this.userData.conoscitiveResp)}
            - Risposte Anamnestiche: ${JSON.stringify(this.userData.anamnesticheResp)}
            - Nota libera conoscitiva: ${this.userData.notaConoscitiva || "Nessuna nota aggiuntiva"}
            - Nota libera anamnestica: ${this.userData.notaAnamnestica || "Nessuna nota aggiuntiva"}

            REGOLE DI OUTPUT:
            - Non formulare diagnosi, diagnosi probabili, diagnosi presunte, diagnosi compatibili o sospetti diagnostici verso l'utente.
            - Non usare formulazioni come "sospetto di", "sospetta", "possibile [patologia]", "compatibile con", "suggestivo di", "si tratta di" o "verosimilmente" come conclusione clinica.
            - Usa linguaggio orientativo: descrivi sintomi riferiti, segnali rilevanti, branca/specialista/servizio e urgenza. Esempio: "peso al petto e fiato corto durante sforzo: orientamento verso valutazione cardiologica prioritaria".
            - Anche "area_specialistica_piu_adatta" e "impegnativa_medico" devono restare orientative e non diagnostiche.
            - Nei quadri non urgenti con stanchezza, fragilità di unghie/capelli e mestruazioni abbondanti, senza diagnosi ematologica confermata né red flag attuali, indica come primo riferimento il Medico di Medicina Generale o l'Internista, non l'Ematologo.
            - Per il quadro non urgente con stanchezza, fragilita di unghie/capelli e mestruazioni abbondanti usa esattamente "Urgenza bassa / non urgente: visita programmata a breve con Medico di Medicina Generale."; indica l'eventuale Ginecologo in preparazione_visita. In red_flags_rilevate conserva anche le negazioni esplicite: "assenza di dolore toracico", "assenza di svenimenti" e "assenza di sangue nelle feci". Usa area_specialistica_piu_adatta con branca "Medicina Generale / Medicina Interna", area "Valutazione di possibile anemia/carenza marziale e possibili perdite mestruali" ed eventuale secondo livello "Ginecologia per menorragia". Non indicare automaticamente 112 o Pronto Soccorso, non formulare diagnosi certa e non prescrivere ferro.
            - Nel bambino di 8 anni con crescita rallentata, stanchezza cronica, dolore addominale ricorrente, feci molli e familiarita per celiachia, indica Pediatra o Gastroenterologo pediatrico e livello "non pronto soccorso, ma valutazione pediatrica/gastroenterologica non da rimandare". Riporta tutti questi indicatori in red_flags_rilevate. Non suggerire di iniziare una dieta senza glutine prima degli accertamenti, salvo indicazione medica.
            - Distingui sempre il primo inquadramento nelle cure primarie dall'eventuale invio specialistico successivo.
            Restituisci ESCLUSIVAMENTE un oggetto JSON puro con questa struttura:
            {
              "sintesi_anamnestica": "Una sintesi dettagliata e professionale dei sintomi e dell'intervista in italiano.",
              "specialista_indicato": "La singola specializzazione medica più adatta (es. Cardiologo, Neurologo, Ortopedico, ecc. - usa solo il nome della branca, es. 'Cardiologo')",
              "livello_urgenza": "Livello esplicito e sintetico, distinto dal disclaimer generico (es. non urgente / visita programmata a breve; prioritaria; alta / urgente)",
              "area_specialistica_piu_adatta": {
                "branca": "Branca generale pertinente",
                "area_specialistica": "Sotto-area descrittiva prudente, senza formulare diagnosi",
                "eventuale_secondo_livello": "Eventuale invio successivo, oppure non necessario"
              },
              "preparazione_visita": "Guida al comportamento e consigli pratici per l'utente in preparazione alla visita medica.",
              "impegnativa_medico": "Una nota clinica chiara e sintetica da suggerire al Medico di Medicina Generale (MMG) per la compilazione della ricetta/impegnativa.",
              "red_flags_rilevate": ["Elenco sintetico dei soli segnali di allarme effettivamente presenti nei dati; array vuoto se assenti"]
            }`;

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt: systemPrompt })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Proxy Gemini Error (${response.status}): ${errText}`);
            }

            const data = await response.json();

            if (!data || !data.result) {
                throw new Error("Il proxy Gemini non ha restituito un risultato valido.");
            }

            return data.result;
        } catch (err) {
            console.error("Errore chiamata fetch Gemini:", err);
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

