// src/app_v3.js
console.log("Triage engine loading... (v3.1.0-STANDALONE)");


class TriageEngine {
    constructor(onMessage) {
        this.state = '1_SESSO_ETA';
        this.userData = {
            sessoEta: null,
            zona: null,
            disturbo: null,
            conoscitiveResp: [],
            anamnesticheResp: []
        };
        this.currentConoscitiva = 0;
        this.currentAnamnestica = 0;
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
    }

    _updatePlaceholder() {
        const inputEl = document.getElementById('user-input');
        if (!inputEl) return;

        let placeholder = "Scrivi qui...";
        switch (this.state) {
            case '1_SESSO_ETA':
                placeholder = "Età e Sesso (es. Uomo, 35)";
                break;
            case '2_ZONA':
                placeholder = "Zona geografica (es. Milano, RM)";
                break;
            case '3_DISTURBO':
                placeholder = "Descrivi il tuo disturbo o sintomo principale...";
                break;
            case '4_CONOSCITIVE':
            case '5_ANAMNESTICHE':
                placeholder = "Rispondi indicando la lettera (A, B o C)";
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

    _generateTriageID() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const prefix = chars.charAt(Math.floor(Math.random() * chars.length));
        const numbers = Math.floor(100000 + Math.random() * 900000); // 6 cifre
        return `${prefix}${numbers}`;
    }

    _saveTriageResult(resultObj, source = 'api', options = {}) {
        const triageID = this._generateTriageID();
        const registeredUser = getRegisteredUser();
        const dataToSave = {
            id: triageID,
            date: new Date().toISOString(),
            userData: JSON.parse(JSON.stringify(this.userData)),
            result: resultObj,
            source: source,
            userRegistration: registeredUser ? {
                userId: registeredUser.userId,
                emailHash: registeredUser.emailHash,
                emailMasked: registeredUser.emailMasked,
                consentVersion: registeredUser.consentVersion,
                consents: registeredUser.consents
            } : null
        };

        if (options.deferUntilRegistration) {
            return dataToSave;
        }

        this._persistTriageResult(dataToSave);

        return dataToSave;
    }

    _persistTriageResult(dataToSave) {
        try {
            let allResults = JSON.parse(localStorage.getItem('aiutodoc_triages') || '{}');
            allResults[dataToSave.id] = dataToSave;
            localStorage.setItem('aiutodoc_triages', JSON.stringify(allResults));
        } catch (e) {
            console.error("Errore salvataggio localStorage:", e);
        }

        this._saveToCloud(dataToSave);
    }

    _buildRegistrationGate(pendingData) {
        window._pendingTriageSave = pendingData;
        const registeredUser = getRegisteredUser();
        if (registeredUser) {
            return `
            <div class="registration-gate" data-save-ready="true">
                <p><strong>Codice disponibile per utente registrato.</strong></p>
                <p>Profilo: ${escapeHTML(registeredUser.emailMasked)}. Conferma per salvare questa ricerca e generare il codice recuperabile.</p>
                <button type="button" class="btn-primary-wide save-triage-after-registration">Genera codice ricerca</button>
            </div>`;
        }

        return `
        <div class="registration-gate">
            <p><strong>Vuoi il codice per recuperare questa ricerca?</strong></p>
            <p>Il codice viene creato solo previa registrazione e consenso esplicito. Senza registrazione il risultato resta disponibile solo in questa sessione.</p>
            <label class="registration-field">
                <span>Email per la registrazione</span>
                <input type="email" class="registration-email" autocomplete="email" placeholder="nome@email.it">
            </label>
            <label class="consent-row">
                <input type="checkbox" class="registration-consent" data-consent="terms">
                <span>Accetto Termini e Condizioni d'uso.</span>
            </label>
            <label class="consent-row">
                <input type="checkbox" class="registration-consent" data-consent="privacy">
                <span>Dichiaro di aver letto l'Informativa Privacy.</span>
            </label>
            <label class="consent-row">
                <input type="checkbox" class="registration-consent" data-consent="healthData">
                <span>Presto consenso esplicito al trattamento dei dati sanitari inseriti ai sensi dell'art. 9(2)(a) GDPR.</span>
            </label>
            <button type="button" class="btn-primary-wide register-and-save-triage">Registrati e genera codice</button>
            <p class="registration-note">Per minimizzare i dati, l'app salva l'hash dell'email e i consensi associati al codice ricerca.</p>
        </div>`;
    }

    async registerAndSavePendingTriage(formEl) {
        const gate = formEl.closest('.registration-gate') || formEl;
        const pendingData = window._pendingTriageSave;
        if (!pendingData) {
            alert("Nessun risultato in attesa di salvataggio.");
            return;
        }

        let registeredUser = getRegisteredUser();
        if (!registeredUser) {
            const emailInput = gate.querySelector('.registration-email');
            const consentFlags = {};
            gate.querySelectorAll('.registration-consent').forEach((input) => {
                consentFlags[input.dataset.consent] = input.checked;
            });
            registeredUser = await registerUserForRecovery(emailInput ? emailInput.value : "", consentFlags);
        }

        pendingData.userRegistration = {
            userId: registeredUser.userId,
            emailHash: registeredUser.emailHash,
            emailMasked: registeredUser.emailMasked,
            consentVersion: registeredUser.consentVersion,
            consents: registeredUser.consents
        };

        this._persistTriageResult(pendingData);
        window._currentTriageData = pendingData;
        window._pendingTriageSave = null;

        gate.outerHTML = `
        <div class="id-copy-box" data-triage-id="${escapeHTML(pendingData.id)}" title="Clicca per copiare l'ID">
            <p style="margin: 0 0 8px 0; font-size: 0.9rem; opacity: 0.9;">Ricerca salvata con <strong>codice univoco</strong>:</p>
            <div class="id-number">${escapeHTML(pendingData.id)}</div>
            <p class="copy-hint">Usa questo codice per tornare ai risultati senza rifare le domande.</p>
        </div>`;

        const newBox = document.querySelector(`.id-copy-box[data-triage-id="${pendingData.id}"]`);
        if (newBox) {
            newBox.addEventListener('click', () => copyTriageID(pendingData.id, newBox));
            newBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    async _saveToCloud(data) {
        if (!data.userRegistration || !data.userRegistration.userId) {
            console.log("Cloud Save: registrazione mancante, salvataggio persistente non eseguito.");
            return;
        }
        if (window.firebaseReady) {
            await window.firebaseReady;
        }
        if (!db) {
            console.log("Firebase non inizializzato, salvataggio cloud saltato.");
            return;
        }
        try {
            console.log("Cloud Save (Firebase): invio dati per ID", data.id);
            await db.collection("triages").doc(data.id).set(data);
            console.log("Cloud Save (Firebase): completato!");
        } catch (err) {
            console.error("Cloud Save (Firebase) FALLITO:", err);
        }
    }

    async retrieveFromCloud(id) {
        if (!id) {
            alert("Inserisci un codice ID valido.");
            return;
        }
        const registeredUser = getRegisteredUser();
        if (!registeredUser) {
            alert("Per recuperare una ricerca devi prima registrarti da un risultato completato.");
            return;
        }
        const cleanID = id.trim().toUpperCase();
        if (window.firebaseReady) {
            await window.firebaseReady;
        }
        if (!db) {
            alert("Sistema Cloud non disponibile al momento. Riprova più tardi.");
            return;
        }

        this.onMessage("🔍 Recupero ricerca in corso per ID: " + cleanID + "...", "system-msg");

        try {
            const doc = await db.collection("triages").doc(cleanID).get();
            if (!doc.exists) {
                this.onMessage("❌ Nessuna ricerca trovata con l'ID richiesto. Verifica il codice e riprova.", "system-msg danger");
                return;
            }

            const data = doc.data();
            if (data.userRegistration && data.userRegistration.userId !== registeredUser.userId) {
                this.onMessage("❌ Il codice esiste ma non è associato alla registrazione presente su questo dispositivo.", "system-msg danger");
                return;
            }
            this.onMessage("✅ Ricerca recuperata con successo!", "system-msg success");
            
            // Switch alla tab chat se necessario
            const chatBtn = document.querySelector('[data-target="chat-section"]');
            if (chatBtn) chatBtn.click();

            // Rendering dei risultati recuperati
            this.userData = data.userData;
            this.currentTriageID = data.id;
            this._renderCloudResults(data.result);

        } catch (err) {
            console.error("Errore recupero cloud:", err);
            this.onMessage("⚠️ Errore durante il recupero. Riprova.", "system-msg danger");
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
                const strSessoEta = input.toLowerCase();
                console.log("Engine: fase SESSO_ETA ->", strSessoEta);

                // Regex molto permissiva: cerca un numero e parole chiave
                const sexMatch = strSessoEta.match(/(uomo|donna|maschio|femmina|ragazzo|ragazza|bambino|bambina| m | f | u | d |^m$|^f$|^u$|^d$| m$| f$| u$| d$|^m |^f |^u |^d )/i);
                const ageMatch = strSessoEta.match(/(-?\d+)/);

                // Se non troviamo nulla di utile
                if (!sexMatch && !ageMatch) {
                   this.onMessage("❌ Dati non chiari. Per favore inserisci Sesso ed Età (es: Maschio, 47).", "system-msg danger");
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
                    this.onMessage("❌ L'età inserita non è valida. Per procedere è necessario inserire un'età reale compresa tra 0 e 120 anni (es: Maschio, 47).", "system-msg danger");
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

                // Identifica se l'utente sta descrivendo un sintomo (es. "dolore", "problemi", "comunicazione", "socio")
                const symptomKeywords = ['dolore', 'problema', 'disturbo', 'comunicazione', 'socio', 'paura', 'ansia', 'stress', 'sintomo', 'male'];
                const seemsLikeSymptom = symptomKeywords.some(w => input.toLowerCase().includes(w));

                // Se l'utente digita solo 2 lettere (es. 'RM' o 'rm'), cerchiamo di tradurlo in nome esteso
                if (cleanZona.length === 2 && /^[A-Z]{2}$/.test(cleanZona)) {
                    if (provinceIt[cleanZona]) {
                        cleanZona = provinceIt[cleanZona]; 
                    } else if (!seemsLikeSymptom) {
                        this.onMessage(`❌ La sigla "<strong>${cleanZona}</strong>" non corrisponde a nessuna provincia italiana valida.`, "system-msg danger");
                        return;
                    }
                } 
                
                // Se la stringa è molto lunga e contiene parole legate ai sintomi, o se è "salta" o "non so"
                const skipKeywords = ['salta', 'skip', 'niente', 'non so', 'nessuna', 'generale', 'tutta italia', 'italia'];
                const isSkip = skipKeywords.includes(input.toLowerCase().trim());
                
                if (isSkip) {
                    this.userData.zona = "Italia (Generale)";
                    this.state = '3_DISTURBO';
                    this.onMessage(`✅ Località impostata: <strong>Italia (Generale)</strong>.<br><br>Ora descrivimi il tuo disturbo o problema principale.`);
                    this._updatePlaceholder();
                    return;
                }

                if (seemsLikeSymptom && cleanZona.length > 10) {
                    this.onMessage(`⚠️ Sembra che tu stia descrivendo il tuo disturbo. Per aiutarti a trovare lo specialista più vicino, ho bisogno di conoscere prima il tuo <strong>Comune o Provincia</strong> attuale. <br><br>Se preferisci non specificarlo, rispondi semplicemente con <strong>'ITALIA'</strong>.`, "system-msg danger");
                    return;
                }

                if (!seemsLikeSymptom && (cleanZona.length < 3 || /^\d+$/.test(cleanZona) || /^(.)\1+$/.test(cleanZona))) {
                    this.onMessage("❌ L'area inserita non sembra valida. Per procedere è necessario inserire una provincia o comune (es. Roma, MI) o scrivi <strong>'Italia'</strong>.", "system-msg danger");
                    return;
                }

                try {
                    const response = await this._fetchWithTimeout(
                        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=it&q=${encodeURIComponent(cleanZona)}`,
                        {},
                        4500
                    );
                    const data = await response.json();

                    if (data && data.length > 0) {
                        const validatedCity = data[0].display_name.split(',')[0];
                        this.userData.zona = validatedCity;
                        this.state = '3_DISTURBO';
                        this.onMessage(`✅ Località verificata sul territorio: <strong>${validatedCity}</strong>.<br><br>Grazie. Ora descrivimi più nel dettaglio: <strong>qual è il tuo disturbo o sintomo principale?</strong>`);
                        this._updatePlaceholder();
                    } else {
                        this.onMessage(`❌ Non siamo riusciti a trovare "<strong>${cleanZona}</strong>" sul territorio italiano. Riprova inserendo un Comune o una Provincia in modo più preciso.`, "system-msg danger");
                        return;
                    }
                } catch (error) {
                    console.error("Errore validazione geografica:", error);
                    // Fallback silenzioso se l'API Geo è down, proseguiamo fiduciosi
                    this.userData.zona = cleanZona;
                    this.state = '3_DISTURBO';
                    this.onMessage("Grazie. Ora descrivimi più nel dettaglio: <strong>qual è il tuo disturbo o sintomo principale?</strong>");
                    this._updatePlaceholder();
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

                    this.onMessage("❌ La descrizione inserita non è valida, troppo breve o sembra digitata casualmente. Ti prego di descrivere un sintomo reale con parole di senso compiuto.", "system-msg danger");
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
                        this.onMessage("✅ <strong>Sintomo convalidato dai database scientifici/letteratura.</strong><br><br>Ho preso nota del tuo disturbo. Per inquadrarlo meglio, ti porrò ora <strong>3 domande conoscitive.</strong><br><br>1. " + DOMANDE_CONOSCITIVE[0]);
                        this._updatePlaceholder();
                    } else {
                        this.onMessage(`❌ Il testo "<strong>${cleanDisturbo}</strong>" non sembra descrivere un disturbo riconoscibile. Inserisci un problema reale o una necessità sanitaria concreta (es. "cefalea", "vertigini", "dolore alla schiena") e riprova.`, "system-msg danger");
                        return;
                    }
                } catch (error) {
                    console.error("Errore validazione sintomo:", error);
                    // Fallback se le internet api sono down (fallback permissivo locale)
                    this.userData.disturbo = cleanDisturbo;
                    this.userData.domandeAnamnesticheDinamiche = this._generaDomandeAnamnestiche(cleanDisturbo);
                    this.state = '4_CONOSCITIVE';
                    this.onMessage("Ho preso nota del tuo sintomo. Per comprendere meglio, ti porrò ora <strong>3 domande conoscitive.</strong><br><br>1. " + DOMANDE_CONOSCITIVE[0]);
                    this._updatePlaceholder();
                }
                break;

            case '4_CONOSCITIVE':
                const cleanConosc = input.trim().toUpperCase();

                // Transizione a Test a Scelta Multipla Chiusa (A, B, C) per massima aderenza
                const isValidMCQ = /^[A-C](?:\)|\.| -|:|\s|$)/.test(cleanConosc) || /\b(?:RISPOSTA|OPZIONE|LETTERA|SCELGO|LA)\s+[A-C]\b/.test(cleanConosc);

                if (!isValidMCQ) {
                    this.onMessage("❌ Risposta non valida. Per proseguire scegli una delle opzioni disponibili: <strong>A, B o C</strong>.", "system-msg danger");
                    return;
                }

                this.userData.conoscitiveResp.push(cleanConosc);
                this.currentConoscitiva++;

                if (this.currentConoscitiva < DOMANDE_CONOSCITIVE.length) {
                    this.onMessage(`${this.currentConoscitiva + 1}. ` + DOMANDE_CONOSCITIVE[this.currentConoscitiva]);
                } else {
                    this.state = '4B_NOTA_CONOSCITIVA';
                    this.onMessage("Perfetto. Hai altre <strong>informazioni o dettagli a parole tue</strong> che vorresti aggiungere riguardo a questi aspetti generali? Se non hai altro, digita semplicemente <strong>'NO'</strong>.");
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
                        this.onMessage("❌ Il testo inserito non è valido, troppo breve o contiene termini inappropriati. Inserisci informazioni valide o scrivi 'NO'.", "system-msg danger");
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
                    this.onMessage("❌ Formato risposta non riconosciuto. Per essere precisi è necessario rispondere in modo netto con una delle lettere indicate (es. <strong>A, B o C</strong>).", "system-msg danger");
                    return;
                }

                this.userData.anamnesticheResp.push(cleanAnamn);
                this.currentAnamnestica++;
                if (this.currentAnamnestica < this.userData.domandeAnamnesticheDinamiche.length) {
                    this.onMessage(`${this.currentAnamnestica + 1}. ` + this.userData.domandeAnamnesticheDinamiche[this.currentAnamnestica]);
                } else {
                    this.state = '5B_NOTA_ANAMNESTICA';
                    this.onMessage("Ottimo. Vorresti aggiungere in chiusura qualche <strong>dettaglio descrittivo libero sui tuoi sintomi</strong> prima che io passi i dati all'intelligenza artificiale medica? <br><br><i>La barra \"scrivi qui\" sparirà subito dopo questo invio e inizierò a cercare lo specialista.</i><br><br>Se non hai altro, scrivi <strong>'NO'</strong>.");
                    this._updatePlaceholder();
                }
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
                        this.onMessage("❌ Il testo inserito non è valido, troppo breve o contiene termini inappropriati. Inserisci informazioni valide o scrivi 'NO'.", "system-msg danger");
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
                        <p>Dati raccolti con successo. <br><br>⏳ <em>Ricerca in corso tra studi scientifici validati e specialisti...</em></p>
                        
                        <div style="width: 100%; max-width: 300px; background-color: #e0e9e9; border-radius: 10px; margin: 15px 0; overflow: hidden; height: 12px; position:relative;">
                            <div id="ai-progress-bar" style="width: 0%; height: 100%; background-color: var(--primary, #1b9b9a); transition: width 1s linear;"></div>
                        </div>
                        <p id="ai-countdown-text" style="font-size: 0.85rem; color: #6f899e; margin-bottom: 10px;">Tempo stimato: 45 secondi</p>

                        <h3 id="ai-loading-title" style="color:var(--primary, #1b9b9a); animation: blink 1.5s infinite;"><strong>ATTENDERE...</strong></h3>
                        <style>
                            @keyframes blink { 0% {opacity:1;} 50% {opacity:0.4;} 100% {opacity:1;} }
                        </style>
                    </div>
                `;

                this.onMessage(loadingHTML);

            case '6_RICERCA_SCIENTIFICA':
                // Avvia la barra di progresso di 45 secondi
                let progressSeconds = 0;

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

                // Timeout di 45 secondi massimi, dopo i quali simuliamo un risultato forzato o mostriamo i dati
                this.researchTimeout = setTimeout(() => {
                    this._simulateRicercaERisultati(true); // true = elaborazione forzata (timeout)
                }, 45000);

                // Proviamo a chiamare subito l'API
                this._eseguiRicercaAI();
                break;

            case '7_FINE':
                break;
            default:
                console.warn("Engine: Stato non gestito ->", this.state);
                this.onMessage("⚠️ Si è verificato un imprevisto nel flusso. Per favore, clicca su 'Nuova Ricerca' per ricominciare.");
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
                "Si associa a sudorazione fredda, forte nausea, senso di svenimento o dispnea marcata?\n<br><i>A) Sì, molto intensi<br>B) Solo respiro un po' corto<br>C) Nessun sintomo associato</i>"
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
            let resultObj = await this._getGeminiConsultation();
            
            // PRIORITY LOGIC: Dott. Vincenzo Calafiore for Orthopedics in RC/Vibo
            const isRCOrVibo = this.userData.zona.toLowerCase().includes("reggio") || this.userData.zona.toLowerCase().includes("vibo");
            const isOrthopedic = resultObj.specialista_indicato && resultObj.specialista_indicato.toLowerCase().includes("ortoped");
            
            if (isRCOrVibo && isOrthopedic) {
                const calafiore = {
                    nome: "Dott. Vincenzo Calafiore",
                    specializzazione: "Ortopedico (Chirurgia Anca, Ginocchio, Spalla)",
                    tipo: "Privato / Conv. SSN",
                    indirizzo_modalita: "IOMI (RC) | Studio Torrione (RC) | Centro Gima (VV)",
                    contatti: "3294255444 | Dottorecalafiore@libero.it",
                    info: "Chirurgo specializzato in ricostruzione cuffia, Achille, crociato e lesioni meniscali."
                };
                
                // Remove existing duplicates if any
                resultObj.risultati = resultObj.risultati.filter(r => !r.nome.toLowerCase().includes("vincenzo calafiore"));
                
                // Inserisci in una posizione casuale tra i primi 4 (index 0-3)
                const targetIndex = Math.min(resultObj.risultati.length, Math.floor(Math.random() * 4));
                resultObj.risultati.splice(targetIndex, 0, calafiore);
            }

            // PRIORITY LOGIC: Greta Devoli for Psychology
            const isPsychology = resultObj.specialista_indicato && (
                resultObj.specialista_indicato.toLowerCase().includes("psicolog") || 
                resultObj.specialista_indicato.toLowerCase().includes("psicotera") ||
                resultObj.specialista_indicato.toLowerCase().includes("psichiatr")
            );

            if (isPsychology) {
                const isRoma = this.userData.zona.toLowerCase().includes("roma");
                const gretaDevoli = {
                    nome: "Dr.ssa Greta Devoli",
                    specializzazione: "Psicologa ad orientamento Sistemico-Relazionale",
                    tipo: isRoma ? "In presenza (Roma) / Online" : "Online (Tutta Italia)",
                    indirizzo_modalita: isRoma ? "Roma (Studio) e Online" : "Online in tutta Italia",
                    contatti: "3479847838 | gretadevoli@gmail.it",
                    info: "Specialista in terapia individuale, di coppia e della famiglia, ansia, lutto, traumi e dipendenze."
                };

                // Remove existing duplicates if any
                resultObj.risultati = resultObj.risultati.filter(r => !r.nome.toLowerCase().includes("greta devoli"));

                // Inserisci in una posizione casuale tra i primi 4 (index 0-3)
                const targetIndex = Math.min(resultObj.risultati.length, Math.floor(Math.random() * 4));
                resultObj.risultati.splice(targetIndex, 0, gretaDevoli);
            }

            // PRIORITY LOGIC: Dott. Carmelo Pecora for Neurosurgery in Messina/Milazzo/RC/Reggio
            const isAreaPecora = this.userData.zona.toLowerCase().includes("messina") || this.userData.zona.toLowerCase().includes("milazzo") || this.userData.zona.toLowerCase().includes("reggio") || this.userData.zona.toLowerCase().includes("villa");
            const isNeurosurgery = resultObj.specialista_indicato && (resultObj.specialista_indicato.toLowerCase().includes("neurochir") || resultObj.specialista_indicato.toLowerCase().includes("neurol"));

            if (isAreaPecora && isNeurosurgery) {
                const pecora = {
                    nome: "Dott. Carmelo Pecora",
                    specializzazione: "Neurochirurgo",
                    tipo: "Privato",
                    indirizzo_modalita: "Messina (New Delta) | Milazzo (Orice) | RC (AB Medical / De Blasi)",
                    contatti: "3339690197 | carmelopecora77@gmail.com",
                    info: "Specializzato in chirurgia mininvasiva della colonna vertebrale, ernie del disco, stenosi lombare e patologie vertebrali."
                };

                // Remove existing duplicates if any
                resultObj.risultati = resultObj.risultati.filter(r => !r.nome.toLowerCase().includes("carmelo pecora"));

                // Inserisci in una posizione casuale tra i primi 4 (index 0-3)
                const targetIndex = Math.min(resultObj.risultati.length, Math.floor(Math.random() * 4));
                resultObj.risultati.splice(targetIndex, 0, pecora);
            }

            // --- GARANTISCE ESATTAMENTE 16 RISULTATI FINALI ---
            if (resultObj.risultati.length > 16) {
                resultObj.risultati = resultObj.risultati.slice(0, 16);
            }
            
            if (this.researchTimeout) clearTimeout(this.researchTimeout);
            if (this.progressInterval) clearInterval(this.progressInterval);

            // Pulizia UI di caricamento
            const boxLoadingDOM = document.getElementById('ai-loading-box');
            if (boxLoadingDOM) boxLoadingDOM.remove();

            // Mostriamo i risultati
            let outInitial = `
            <div id="printable-area">
            <div id="medical-disclaimer-start" class="result-start" style="background: var(--danger-bg); border: 1px solid #fecaca; color: var(--danger); padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; font-weight: 500;">
              ⚠️ ${escapeHTML(DISCLAIMER)}
            </div>
            
            <div class="result-card-main" style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); margin-bottom: 25px;">
                <h3 style="color: var(--primary); margin-top: 0;">🔍 Sintesi Anamnestica</h3>
                <p style="line-height: 1.6; color: #4a5568;">${escapeHTML(resultObj.sintesi_anamnestica)}</p>
                
                <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 20px 0;">
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div style="background: #f0f7f7; padding: 15px; border-radius: 10px;">
                        <span style="display: block; font-size: 0.8rem; text-transform: uppercase; color: #1b9b9a; font-weight: bold; margin-bottom: 5px;">👨‍⚕️ Specialista Consigliato</span>
                        <strong style="font-size: 1.1rem; color: #2d3748;">${escapeHTML(resultObj.specialista_indicato)}</strong>
                    </div>
                    <div style="background: #fff9e6; padding: 15px; border-radius: 10px;">
                        <span style="display: block; font-size: 0.8rem; text-transform: uppercase; color: #d48806; font-weight: bold; margin-bottom: 5px;">💡 Guida al Comportamento</span>
                        <p style="margin: 0; font-size: 0.9rem; color: #2d3748;">${escapeHTML(resultObj.preparazione_visita)}</p>
                    </div>
                </div>
                
                <div style="margin-top: 20px; background: #fef2f2; padding: 15px; border-radius: 10px; border: 1px dashed #f87171;">
                    <span style="display: block; font-size: 0.8rem; text-transform: uppercase; color: #b91c1c; font-weight: bold; margin-bottom: 5px;">📑 Nota per l'Impegnativa (MMG)</span>
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
            `Ecco 16 specialisti individuati in rete:<br>`;

            let resultsHTML = "";
            const seenNames = new Set();
            resultObj.risultati.forEach(r => {
                const nameKey = String(r.nome || "").trim().toLowerCase();
                if (!seenNames.has(nameKey)) {
                    seenNames.add(nameKey);
                    resultsHTML += this._buildCard(r.nome, r.specializzazione || resultObj.specialista_indicato, r.tipo, r.indirizzo_modalita, r.contatti, "Dalla rete", r.info);
                }
            });
            out += resultsHTML + `</div>`;
            this.onMessage(out);

            this.state = '7_FINE';
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
            const isLocalConfigIssue = /GEMINI_API_KEY|Endpoint Gemini|proxy Gemini|404|Not found|Failed to fetch/i.test(errDetail);
            const fallbackMessage = isLocalConfigIssue
                ? "Modalità locale attiva: uso il motore dimostrativo di orientamento perché il proxy AI non è configurato in questo ambiente."
                : "Il motore AI non è momentaneamente disponibile. Proseguo con un orientamento dimostrativo, senza mostrare dati tecnici.";
            this.onMessage(fallbackMessage, isLocalConfigIssue ? "system-msg" : "system-msg danger");
            setTimeout(() => this._eseguiSimulazioneFallback(), 1200);
        }
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
            const systemPrompt = `Sei un sistema di intelligenza artificiale per orientamento sanitario informativo di Aiutodoc.it. Il tuo obiettivo e' fornire una sintesi informativa non diagnostica e una lista di 16 specialisti pertinenti.
            
            Dati utente:
            - Sesso/Età: ${this.userData.sessoEta}
            - Zona: ${this.userData.zona}
            - Disturbo: ${this.userData.disturbo}
            - Risposte Conoscitive: ${JSON.stringify(this.userData.conoscitiveResp)}
            - Risposte Anamnestiche: ${JSON.stringify(this.userData.anamnesticheResp)}
            - Note Libere: ${this.userData.notaAnamnestica}

            REGOLE DI OUTPUT:
            Restituisci ESCLUSIVAMENTE un oggetto JSON puro con questa struttura:
            {
              "sintesi_anamnestica": "Sintesi informativa dei sintomi dichiarati e delle risposte, senza formulare pareri clinici.",
              "specialista_indicato": "Branca medica principale (es. Cardiologo, Neurochirurgo, ecc.)",
              "preparazione_visita": "Consigli pratici per la visita (es. 'porta con te esami del sangue recenti')",
              "impegnativa_medico": "Testo suggerito per il Medico di Medicina Generale (MMG) per facilitare la scrittura dell'impegnativa.",
              "risultati": [
                { "nome": "...", "specializzazione": "...", "tipo": "...", "indirizzo_modalita": "...", "contatti": "...", "info": "..." }
              ]
            }

            IMPORTANTE - REGOLA DEI 16 SPECIALISTI:
            1. Restituisci esattamente 16 risultati univoci e REALI.
            2. Distribuzione per Tipologia:
               - Almeno 8 (50%) devono essere PROFESSIONISTI PRIVATI (es. "Dott. Nome Cognome").
               - Gli altri 8 possono essere Centri Medici, Cliniche o Ospedali di eccellenza.
            3. Distribuzione geografica:
               - 8 risultati (50%) devono essere nella Zona/Provincia di "${this.userData.zona}".
               - 5 risultati (30%) devono essere eccellenze Regionali (Calabria/Sicilia/Lazio ecc. a seconda della zona).
               - 3 risultati (20%) devono essere eccellenze Nazionali (Milano, Roma, Bologna).
            4. **SPECIALIZZAZIONI SPECIFICHE**: Ogni professionista o centro deve avere la propria specializzazione specifica (es. se la branca è "Ortopedico", alcuni saranno "Chirurgo della Mano", "Specialista del Piede", "Esperto in Protesi Anca", ecc.). Non usare un'unica etichetta per tutti i 16 risultati.
            5. Se lo specialista è "Ortopedico" in Calabria o Sicilia, includi sempre "Dott. Vincenzo Calafiore" (IOMI RC).`;

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

    // --- COMPATIBILITA CON IL VECCHIO SISTEMA (FALLBACK) ---
    _eseguiSimulazioneFallback() {
        // Pulizia UI di caricamento (anche se chiamata dal costrutto timeout)
        const boxLoadingDOM = document.getElementById('ai-loading-box');
        if (boxLoadingDOM) boxLoadingDOM.remove();

        let orientamentoStr = "Orientamento dimostrativo locale";
        let specStr = "Medico Internista / Medico di Base";

        const dLower = this.userData.disturbo.toLowerCase();

        if (dLower.includes("dca") || dLower.includes("anoressia") || dLower.includes("bulimia") || dLower.includes("binge") || dLower.includes("abbuff") || dLower.includes("restrizion") || dLower.includes("dismorfismo")) {
            orientamentoStr = "Disagio legato al rapporto con cibo, peso o immagine corporea"; specStr = "Psicologo/Psichiatra esperto in DCA";
        }
        else if (dLower.includes("sonno") || dLower.includes("insonnia") || dLower.includes("dormire") || dLower.includes("addorment") || dLower.includes("risvegli") || dLower.includes("russ") || dLower.includes("apne") || dLower.includes("sonnolenza")) {
            orientamentoStr = "Disturbo del sonno da approfondire"; specStr = "Centro di Medicina del Sonno / Neurologo o Pneumologo";
        }
        else if (dLower.includes("ansia") || dLower.includes("stress") || dLower.includes("depressione") || dLower.includes("famiglia") || dLower.includes("panico") || dLower.includes("trauma") || dLower.includes("lutto") || dLower.includes("socializz") || dLower.includes("relazion") || dLower.includes("isolament") || dLower.includes("timidezz")) {
            orientamentoStr = "Necessità di supporto psicologico"; specStr = "Psicologa ad orientamento Sistemico-Relazionale";
        }
        else if (dLower.includes("osso") || dLower.includes("dolore") || dLower.includes("schiena") || dLower.includes("ginocchio") || dLower.includes("frattura")) {
            orientamentoStr = "Area muscolo-scheletrica da approfondire"; specStr = "Ortopedico";
        }
        else if (dLower.includes("testa") || dLower.includes("cefalea") || dLower.includes("memoria")) {
            orientamentoStr = "Area neurologica da approfondire"; specStr = "Neurologo";
        }

        const resultObjFallback = {
            sintesi_anamnestica: `L'utente riferisce: ${this.userData.disturbo}.`,
            specialista_indicato: specStr,
            preparazione_visita: "Portare eventuali esami precedenti e lista farmaci.",
            impegnativa_medico: "Si consiglia visita specialistica per " + specStr,
            risultati: [] // Verranno popolati sotto
        };

        let outInitial = `✅ [MODALITA' LOCALE - ORIENTAMENTO DIMOSTRATIVO]<br><br>Sulla base delle informazioni fornite: <strong>${escapeHTML(orientamentoStr)}</strong>. <br><br>Branca/specialista indicato: <strong>${escapeHTML(specStr)}</strong>.<br><br>`;
        let resultsHTML = "";
        const seenNamesFallback = new Set();

        const isRoma = this.userData.zona.toLowerCase().includes("roma");
        if (specStr === "Psicologa ad orientamento Sistemico-Relazionale") {
            let mod = isRoma ? "In presenza a Roma e Online" : "Online in tutta Italia"; let addr = isRoma ? "Via Nazionale 100, Roma" : "Videoconsulto";
            const card = { nome: "Dr.ssa Greta Devoli", tipo: "Privato", indirizzo_modalita: addr, contatti: "3479847838 | gretadevoli@gmail.com", info: "Terapia individuale/coppia. Sostegno per ansia, relazionali, traumi e genitorialità." };
            resultObjFallback.risultati.push(card);
            seenNamesFallback.add(card.nome.toLowerCase());
            resultsHTML += this._buildCard(card.nome, specStr, card.tipo, card.indirizzo_modalita, card.contatti, mod, card.info);
        }

        const isRC = this.userData.zona.toLowerCase().includes("reggio") || this.userData.zona.toLowerCase().includes("vibo");
        if (specStr === "Ortopedico" && isRC) {
            const card = { nome: "Dott. Vincenzo Calafiore", tipo: "Privato / Conv. SSN", indirizzo_modalita: "IOMI (RC) | Studio Torrione (RC) | Centro Gima (VV)", contatti: "3294255444 | Dottorecalafiore@libero.it", info: "Chirurgo dell’anca, del ginocchio e della spalla (ricostruzione cuffia, Achille, crociato e lesioni meniscali)." };
            resultObjFallback.risultati.push(card);
            seenNamesFallback.add(card.nome.toLowerCase());
            resultsHTML += this._buildCard(card.nome, "Ortopedico / Chirurgo", card.tipo, card.indirizzo_modalita, card.contatti, "Visita / Chirurgia Protesica", card.info);
        }

        const isAreaPecora = this.userData.zona.toLowerCase().includes("messina") || this.userData.zona.toLowerCase().includes("milazzo") || this.userData.zona.toLowerCase().includes("reggio") || this.userData.zona.toLowerCase().includes("villa");
        if (specStr === "Neurologo" && isAreaPecora) {
            const card = { nome: "Dott. Carmelo Pecora", tipo: "Privato", indirizzo_modalita: "Messina (New Delta) | Milazzo (Orice) | RC (AB Medical / De Blasi)", contatti: "333 9690197 | carmelopecora77@gmail.com", info: "Specializzato in chirurgia mininvasiva della colonna vertebrale, ernie del disco, stenosi lombare e patologie vertebrali." };
            resultObjFallback.risultati.push(card);
            seenNamesFallback.add(card.nome.toLowerCase());
            resultsHTML += this._buildCard(card.nome, "Neurochirurgo", card.tipo, card.indirizzo_modalita, card.contatti, "Visita (130€)", card.info);
        }

        let currentCardIndex = 0;
        let overrideCounter = resultObjFallback.risultati.length;

        while (overrideCounter + currentCardIndex < 16) {
            const cardName = "Centro Medico " + (currentCardIndex + 1);
            let geoInfo = "Eccl. Nazionale";
            if (currentCardIndex < 8) geoInfo = "Provinciale";
            else if (currentCardIndex < 13) geoInfo = "Regionale";

            const card = { nome: cardName, tipo: "Privato", indirizzo_modalita: `${geoInfo} - Area ${this.userData.zona}`, contatti: "Da verificare", info: "Risultato dimostrativo locale: configura GEMINI_API_KEY per ricerca AI reale." };
            if (!seenNamesFallback.has(cardName.toLowerCase())) {
                resultObjFallback.risultati.push(card);
                resultsHTML += this._buildCard(card.nome, specStr, card.tipo, card.indirizzo_modalita, card.contatti, "CUP", card.info);
            }
            currentCardIndex++;
        }

        const pendingTriage = this._saveTriageResult(resultObjFallback, 'fallback', { deferUntilRegistration: true });
        
        window._currentTriageData = { 
            ...this.userData, 
            id: null,
            date: pendingTriage.date,
            result: resultObjFallback 
        };

        let outInitialRes = `
        <div id="printable-area">
        <div id="medical-disclaimer-start" class="result-start" style="background: var(--danger-bg); border: 1px solid #fecaca; color: var(--danger); padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; font-weight: 500;">
          ⚠️ ${escapeHTML(DISCLAIMER)}
        </div>
        <div class="result-card-main" style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); margin-bottom: 25px;">
            <p style="color: var(--primary); font-weight:bold;">✅ [MODALITA' LOCALE - ORIENTAMENTO DIMOSTRATIVO]</p>
            <h3 style="color: var(--primary); margin-top: 5px;">🔍 Sintesi Anamnestica</h3>
            <p style="line-height: 1.6; color: #4a5568;">${escapeHTML(orientamentoStr)} (Simulata per: ${escapeHTML(this.userData.disturbo)})</p>
            <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 20px 0;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div style="background: #f0f7f7; padding: 15px; border-radius: 10px;">
                    <span style="display: block; font-size: 0.8rem; text-transform: uppercase; color: #1b9b9a; font-weight: bold; margin-bottom: 5px;">👨‍⚕️ Specialista Consigliato</span>
                    <strong style="font-size: 1.1rem; color: #2d3748;">${escapeHTML(specStr)}</strong>
                </div>
            </div>
        </div>
        `;

        let out = outInitialRes + 
        this._buildRegistrationGate(pendingTriage) +
        `<p class="ai-final-notice">${escapeHTML(AI_FINAL_NOTICE)}</p>` +
        `Ecco 16 risultati (simulati):<br>` + resultsHTML + `</div>`;
        
        // this._setupPDFDownload(); // Rimosso temporaneamente

        this.state = '7_FINE';
        // Traccia completamento triage (fallback simulato)
        trackEvent('triage_completed', {
            method: 'fallback',
            specialista: specStr,
            zona: this.userData.zona
        });
        this.onMessage(out);
    }

    _buildCard(nome, spec, tipo, ind, contatti, prenotazione, det) {
        return `
    <div class="triage-result">
      <div class="triage-result-header">
        ${escapeHTML(nome)} <span class="tag-badge">${escapeHTML(tipo)}</span>
      </div>
      <div class="triage-result-body">
        <p><strong>Specializzazione:</strong> ${escapeHTML(spec)}</p>
        <p><strong>Indirizzo/Modalità:</strong> ${ind} (${prenotazione})</p>
        <p><strong>Contatti:</strong> ${escapeHTML(contatti)}</p>
        <p><strong>Info:</strong> ${escapeHTML(det)}</p>
      </div>
    </div>`;
    }
}
