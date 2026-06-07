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
                placeholder = "Rispondi indicando la lettera (A, B o C)";
                break;
            case '5C_DETTAGLIO_CONDIZIONATO':
                placeholder = this.currentConditionalDetail === "weight_kg"
                    ? "Inserisci il peso in kg. Es. 72"
                    : "Inserisci l'età precisa. Es. 47";
                break;
            case '4B_NOTA_CONOSCITIVA':
            case '5B_NOTA_ANAMNESTICA':
                placeholder = "Aggiungi dettagli o scrivi 'NO'";
                break;
            case '7_FINE':
                placeholder = "Orientamento completato.";
                break;
        }
        inputEl.placeholder = placeholder;
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
        return labels[value] || "";
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

    _prepareConditionalDetailsQueue() {
        const queue = [];
        if (this._needsPreciseAge() && !this.userData.exact_age) queue.push("exact_age");
        if (this._needsWeight() && !this.userData.weight_kg) queue.push("weight_kg");
        this.conditionalDetailsQueue = queue;
        this.currentConditionalDetail = null;
        return queue;
    }

    _askNextConditionalDetailOrFinalNote() {
        const next = this.conditionalDetailsQueue.shift();
        if (!next) {
            this.currentConditionalDetail = null;
            this.state = '5B_NOTA_ANAMNESTICA';
            this.onMessage('Ottimo. Vorresti aggiungere qualche dettaglio sui tuoi sintomi prima che elabori i dati? Altrimenti, digita "No" ed inizierò a cercare la figura più indicata per te.');
            this._updatePlaceholder();
            return;
        }

        this.currentConditionalDetail = next;
        this.state = '5C_DETTAGLIO_CONDIZIONATO';
        const message = next === "weight_kg"
            ? "Per questo percorso il peso può essere clinicamente rilevante. Indica il peso in kg, ad esempio <strong>72</strong>."
            : "Per questo percorso serve anche l'età puntuale. Indica l'età precisa in anni, ad esempio <strong>47</strong>.";
        this.onMessage(message);
        this._updatePlaceholder();
    }

    _handleConditionalDetailInput(input) {
        const value = String(input || "").replace(",", ".").match(/\d+(?:\.\d+)?/);
        const numberValue = value ? Number(value[0]) : NaN;

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
        }

        this._askNextConditionalDetailOrFinalNote();
    }

    _generateTriageID() {
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
        return letters + numbers;
    }

    _saveTriageResult(resultObj, source = 'api', options = {}) {
        const triageID = this._generateTriageID();
        const dataToSave = {
            id: triageID,
            date: new Date().toISOString(),
            userData: JSON.parse(JSON.stringify(this.userData)),
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

        pendingData.userRegistration = null;
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
            pendingData.expiresAt = null;
            console.warn("Archivio cloud non disponibile, salvataggio mantenuto solo in locale:", error);
        }

        saveStoredTriage(pendingData);
        window._currentTriageData = pendingData;
        window._pendingTriageSave = null;

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
            body: JSON.stringify({ triage: data })
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

    _detectUrgency(text) {
        const dangerWords = [
            'petto', 'cuore', 'respir', 'infarto', 'coscienza', 'svvenut', 'sangue', 'emorragia', 
            'suicid', 'uccider', 'mazzar', 'farla finita', 'emergenza', '118', '112', 'soccorso'
        ];
        return dangerWords.some(w => text.toLowerCase().includes(w));
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

    async processUserInput(text) {
        const input = text.trim();
        console.log("Engine: elaborazione input ->", input, "| Stato attuale:", this.state);
        if (!input) return;

        if (this._detectUrgency(input)) {
            console.log("Engine: Urgenza rilevata!");
            this.onMessage(URGENCY_WARNING, 'system-msg danger');
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

                // 1) Funzione Euristica Anti-Gibberish e Blacklist
                const dHasNoVowels = !/[aeiouy]/.test(dtl);
                const dHasTooManyConsonants = /[bcdfghjklmnpqrstvwxz]{5,}/.test(dtl);
                const dHasKeyboardPatterns = /(asd|qwe|zxc|fgh|jkl|123)+/.test(dtl);

                // Blacklist di stringhe inappropriate
                const badWordsPattern = /\b(caca\b|cacca|merda|stronz|cazzo\b|cazzi\b|figa\b|puttan|mignot|culo\b|piscia\b|piscio\b|pisciat|fott|scemo\b|scema\b|scemi\b|sceme\b|stupid|idiot|deficent|coglion|bastard|troia\b|troie\b|zoccola\b|zoccole\b|sborr|fifi\b|fuffa\b|blabla|prova\b|test\b|blah|porcod|diocan|diop|porcam|madonn|bestemm|dio c|dio p|dio s|cristo\b)/;
                const hasBadWords = badWordsPattern.test(dtl);

                // Esamina stringhe composite (es: "dolore caca", "dolore asdasd")
                const words = dtl.split(/\s+/);
                let hasGibberishWord = false;
                for (let w of words) {
                    // Se una singola parola sopra i 3 caratteri non ha vocali, ha consonanti eccessive o la stessa lettera ripetuta
                    if (w.length > 2 && (!/[aeiouy]/.test(w) || /[bcdfghjklmnpqrstvwxz]{4,}/.test(w) || /^(.)\1{2,}$/.test(w))) {
                        hasGibberishWord = true;
                        break;
                    }
                }

                if (dtl.length < 3 || 
                    !this._isValidFreeText(cleanDisturbo) ||
                    /^(.)\1+$/.test(dtl) ||
                    dHasTooManyConsonants ||
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
                        'dolor', 'brucior', 'prurit', 'fastidi', 'febbre', 'tosse', 'macchi', 'nausea', 'vomit', 'vertigin', 'capogir', 'debolezz', 'stanch', 'sangue', 'visita', 'mal di', 'male', 'gonfior', 'occhi', 'testa', 'schiena', 'pancia', 'gamba', 'braccio', 'mano', 'piede', 'ginocchi', 'spalla', 'fiato', 'respiro', 'battito', 'formicol', 'udito', 'vista', 'memoria', 'peso', 'diabete', 'tiroid',
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

                    if (isDirectValid) {
                        isValidMedicalTerm = true;
                    } else {
                        // 3) Validazione Scientifica / Enciclopedica sul web per disturbi fisici sconosciuti/rari
                        const response = await fetch(`https://it.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanDisturbo)}&utf8=&format=json&origin=*`);
                        const data = await response.json();

                        // Strict Verification: Non basta che Wikipedia trovi la parola. Dobbiamo assicurarci che nei risultati compaiano lemmi associati alla salute.
                        if (data && data.query && data.query.search && data.query.search.length > 0) {
                            const medicalKeywords = ['malattia', 'sindrome', 'medicina', 'medico', 'sintomo', 'dolore', 'patologia', 'terapia', 'infiammazione', 'disturbo', 'cura', 'salute', 'infezione', 'paziente', 'ospedale', 'clinica', 'farmaco', 'intervento', 'cronico', 'corpo', 'muscolo', 'osso', 'sangue', 'nerv', 'organo'];

                            // Scansioniamo i titoli e gli snippet dei primi risultati per trovare il match clinico
                            for (let i = 0; i < Math.min(3, data.query.search.length); i++) {
                                const combinedText = (data.query.search[i].title + " " + data.query.search[i].snippet).toLowerCase();
                                if (medicalKeywords.some(keyword => combinedText.includes(keyword))) {
                                    isValidMedicalTerm = true;
                                    break;
                                }
                            }
                        }
                    }

                    if (isValidMedicalTerm) {
                        this.userData.disturbo = cleanDisturbo;
                        this.userData.domandeAnamnesticheDinamiche = this._generaDomandeAnamnestiche(cleanDisturbo);
                        this.state = '4_CONOSCITIVE';
                        this.onMessage("<strong>OK: Sintomo convalidato dai database scientifici/letteratura.</strong><br><br>Ho preso nota del tuo disturbo. Per inquadrarlo meglio, ti porrò ora <strong>3 domande conoscitive.</strong><br><br>1. " + DOMANDE_CONOSCITIVE[0]);
                        this._updatePlaceholder();
                    } else {
                        this.onMessage(`Errore: Il testo "<strong>${cleanDisturbo}</strong>" non sembra descrivere un disturbo riconoscibile. Inserisci un problema reale o una necessità sanitaria concreta (es. "cefalea", "vertigini", "dolore alla schiena") e riprova.`, "system-msg danger");
                        return;
                    }
                } catch (error) {
                    console.error("Errore validazione sintomo:", error);
                    this.onMessage("Attenzione: Non riesco a convalidare il sintomo tramite le fonti online in questo momento. Riprova tra poco o descrivi il disturbo con termini più comuni.", "system-msg danger");
                    return;
                }
                break;

            case '4_CONOSCITIVE':
                const cleanConosc = input.trim().toUpperCase();

                // Transizione a Test a Scelta Multipla Chiusa (A, B, C) per massima aderenza
                const isValidMCQ = /^[A-C](?:\)|\.| -|:|\s|$)/.test(cleanConosc) || /\b(?:RISPOSTA|OPZIONE|LETTERA|SCELGO|LA)\s+[A-C]\b/.test(cleanConosc);

                if (!isValidMCQ) {
                    this.onMessage("Errore: Risposta non valida. Per proseguire scegli una delle opzioni disponibili: <strong>A, B o C</strong>.", "system-msg danger");
                    return;
                }

                this.userData.conoscitiveResp.push(cleanConosc);
                this.currentConoscitiva++;

                if (this.currentConoscitiva < DOMANDE_CONOSCITIVE.length) {
                    this.onMessage(`${this.currentConoscitiva + 1}. ` + DOMANDE_CONOSCITIVE[this.currentConoscitiva]);
                } else {
                    this.state = '4B_NOTA_CONOSCITIVA';
                    this.onMessage('Perfetto. Hai altre informazioni o dettagli che vorresti aggiungere riguardo a questi aspetti generali? Altrimenti, digita "No".');
                    this._updatePlaceholder();
                }
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

                this.state = '5_ANAMNESTICHE';
                this.onMessage(`Molto bene. Ora passiamo alla seconda fase con <strong>${this.userData.domandeAnamnesticheDinamiche.length} domande anamnestiche</strong> più specifiche sul disturbo per migliorare l'orientamento (rispondi con <strong>A, B o C</strong>).<br><br>1. ` + this.userData.domandeAnamnesticheDinamiche[0]);
                this._updatePlaceholder();
                break;

            case '5_ANAMNESTICHE':
                const cleanAnamn = input.trim().toUpperCase();

                // Validazione strutturata: pretendiamo la lettera A, B o C
                const isValidChoiceAnam = /^[A-C](?:\)|\.| -|:|\s|$)/.test(cleanAnamn) || /\b(?:RISPOSTA|OPZIONE|LETTERA|SCELGO|LA)\s+[A-C]\b/.test(cleanAnamn);

                if (!isValidChoiceAnam) {
                    this.onMessage("Errore: Formato risposta non riconosciuto. Per essere precisi è necessario rispondere in modo netto con una delle lettere indicate (es. <strong>A, B o C</strong>).", "system-msg danger");
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

                this.state = '6_RICERCA_SCIENTIFICA';
                
                // Nascondi barra di input durante la ricerca (DOPO l'ultima domanda dell'anamnesi)
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

            case '6_RICERCA_SCIENTIFICA':
                // Avvia la barra di progresso di 45 secondi
                let progressSeconds = 0;
                this.searchStartedAt = Date.now();

                // Assicuriamoci che il DOM abbia renderizzato il caricamento chiamando setTimeout
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

                // Timeout tecnico: la ricerca resta visibile per 45 secondi, poi mostriamo risultati reali o errore esplicito.
                this.researchTimeout = setTimeout(() => {
                    this._showResearchFailure("La ricerca reale non ha risposto entro il tempo previsto. Riprova tra poco: nessun risultato simulato viene mostrato.");
                }, 55000);

                // Proviamo a chiamare subito l'API
                this._eseguiRicercaAI();
                break;

            case '7_FINE':
                break;
            default:
                console.warn("Engine: Stato non gestito ->", this.state);
                this.onMessage("Attenzione: Si è verificato un imprevisto nel flusso. Per favore, clicca su 'Nuova Ricerca' per ricominciare.");
        }
    }

    _generaDomandeAnamnestiche(disturbo) {
        const dLower = disturbo.toLowerCase();
        const wholeWordTerms = new Set([
            "occhi", "vista", "occhio", "naso", "gola", "voce", "denti", "bocca",
            "pene", "testa", "osso", "ossa", "schiena", "ginocchio", "ginocchia",
            "spalla", "spalle", "caviglia", "caviglie", "tallone", "talloni",
            "mano", "mani", "polso", "polsi", "dito", "dita", "gomito",
            "anca", "bacino", "inguine", "coscia", "femore", "gamba", "gambe",
            "cuore", "petto", "tosse", "asma", "stomaco", "pancia", "addome",
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
            PNEUMO: ["polmon", "pneumo", "asma", "bronchi", "fischio", "catarro", "tosse", "affanno", "respiro"]
        };

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
            if (isRCOrVibo && isOrthopedic) {
                curatedNames.push("Dott. Vincenzo Calafiore");
            }

            // Filtra duplicati dei medici indicizzati dai risultati di Google Places
            let filteredPlaces = places.filter(p => {
                const isDup = curatedNames.some(cName => isSameDoctor(p.nome, cName));
                return !isDup;
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
                        if (!isDup) finalPlaces.push(fallbackPlace);
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

            const priorityCurated = this._buildCuratedSearchResults(resultObj.specialista_indicato);
            priorityCurated.forEach((curatedEntry, index) => {
                resultObj.risultati = resultObj.risultati.filter(r => !isSameDoctor(r.nome, curatedEntry.nome));
                const stableSeed = `${curatedEntry.nome}|${this.userData.zona}|${this.userData.disturbo}`.length;
                const targetIndex = Math.min(resultObj.risultati.length, (stableSeed + index) % 5);
                resultObj.risultati.splice(targetIndex, 0, curatedEntry);
            });
            resultObj.risultati = resultObj.risultati.slice(0, 20);

            // Mostriamo i risultati
            let outInitial = `
            <div id="printable-area">
            <div id="medical-disclaimer-start" class="result-start" style="background: var(--danger-bg); border: 1px solid #fecaca; color: var(--danger); padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; font-weight: 500;">
              Attenzione: ${escapeHTML(DISCLAIMER)}
            </div>
            
            <div class="result-card-main" style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); margin-bottom: 25px;">
                <h3 style="color: var(--primary); margin-top: 0; display: flex; align-items: center; gap: 8px;">
                    Sintesi Anamnestica
                </h3>
                <p style="line-height: 1.6; color: #4a5568;">${escapeHTML(resultObj.sintesi_anamnestica)}</p>
                
                <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 20px 0;">
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div style="background: #f0f7f7; padding: 15px; border-radius: 10px;">
                        <span style="display: flex; align-items: center; gap: 5px; font-size: 0.8rem; text-transform: uppercase; color: #0F5464; font-weight: bold; margin-bottom: 5px;">
                            SPECIALISTA CONSIGLIATO
                        </span>
                        <strong style="font-size: 1.1rem; color: #2d3748;">${escapeHTML(resultObj.specialista_indicato)}</strong>
                    </div>
                    <div style="background: #fff9e6; padding: 15px; border-radius: 10px;">
                        <span style="display: flex; align-items: center; gap: 5px; font-size: 0.8rem; text-transform: uppercase; color: #d48806; font-weight: bold; margin-bottom: 5px;">
                            GUIDA AL COMPORTAMENTO
                        </span>
                        <p style="margin: 0; font-size: 0.9rem; color: #2d3748;">${escapeHTML(resultObj.preparazione_visita)}</p>
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

            this.state = '7_FINE';
            this._updatePlaceholder();
            trackEvent('triage_completed', {
                method: 'api',
                specialista: resultObj.specialista_indicato,
                zona: this.userData.zona
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

    _normalizeGeminiResult(resultObj) {
        if (!resultObj || typeof resultObj !== 'object') {
            throw new Error("Risposta AI incompleta: oggetto risultato mancante.");
        }

        return {
            sintesi_anamnestica: String(resultObj.sintesi_anamnestica || "Sintesi non disponibile."),
            specialista_indicato: String(resultObj.specialista_indicato || "Medico specialista"),
            preparazione_visita: String(resultObj.preparazione_visita || "Porta con te documenti sanitari, referti ed elenco dei sintomi."),
            impegnativa_medico: String(resultObj.impegnativa_medico || "Valutazione specialistica in base ai sintomi riferiti."),
            risultati: Array.isArray(resultObj.risultati) ? resultObj.risultati : []
        };
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

        if (specLower.includes("psicolog") || specLower.includes("psicotera") || specLower.includes("psichiatr")) {
            const isRoma = contextLower.includes("roma");
            add({
                nome: "Dr.ssa Greta Devoli",
                specializzazione: "Psicologa ad orientamento Sistemico-Relazionale",
                tipo: "Privato",
                indirizzo_modalita: isRoma ? "Roma e online" : "Online in tutta Italia",
                contatti: "3479847838 | gretadevoli@gmail.com",
                fonte: "Scheda curata",
                info: "Specialista in regime di libera professione."
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

        if ((specLower.includes("neurochir") || specLower.includes("neurol")) && /\b(messina|milazzo|reggio|rc|villa)\b/i.test(contextLower)) {
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
            - Sesso biologico: ${this._sexAtBirthLabel(this.userData.sex_at_birth)} (${this.userData.sex_at_birth || "not_specified"})
            - Zona: ${userZonaStr}
            - Disturbo: ${this.userData.disturbo}
            - Risposte Conoscitive: ${JSON.stringify(this.userData.conoscitiveResp)}
            - Risposte Anamnestiche: ${JSON.stringify(this.userData.anamnesticheResp)}
            - Note Libere: ${this.userData.notaAnamnestica || "Nessuna nota aggiuntiva"}

            REGOLE DI OUTPUT:
            Restituisci ESCLUSIVAMENTE un oggetto JSON puro con questa struttura:
            {
              "sintesi_anamnestica": "Una sintesi dettagliata e professionale dei sintomi e dell'intervista in italiano.",
              "specialista_indicato": "La singola specializzazione medica più adatta (es. Cardiologo, Neurologo, Ortopedico, ecc. - usa solo il nome della branca, es. 'Cardiologo')",
              "preparazione_visita": "Guida al comportamento e consigli pratici per l'utente in preparazione alla visita medica.",
              "impegnativa_medico": "Una nota clinica chiara e sintetica da suggerire al Medico di Medicina Generale (MMG) per la compilazione della ricetta/impegnativa."
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
        const resultName = String(result.nome || "Specialista o struttura sanitaria").trim();
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

