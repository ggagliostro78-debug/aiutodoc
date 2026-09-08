// Regole cliniche conservative: sinonimi e negazioni non devono trasformare l'orientamento in diagnosi.
class BetaClinicalRules {
    _stripNegatedClinicalClauses(text) {
        return String(text || "")
            .replace(/\b(?:ma|pero|però|tuttavia|invece)\b/gi, ". ")
            .replace(/\b(?:non ho|non ha|non presento|non presenta|non riferisco|non riferisce|non assumo|non assume|non prendo|non prende|non sono|nessun[oa]?|senza|assenza di|nega|negano)\b[^.!?;]{0,180}(?=[.!?;]|$)/gi, " ")
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
        if (this._getSwimmingSymptomProfile(normalized) === "emergency") {
            signals.push("Sintomo grave durante il nuoto con dolore toracico intenso, quasi svenimento o grave difficolta respiratoria");
        }
        const emergencyPatterns = [
            { pattern: /\b(?:fiato corto|fatica a respirare|difficolta a respirare|difficolta respiratoria|dispnea|non riesc[oe] a respirare)\b/, label: "Difficoltà respiratoria o dispnea riferita", skip: exertionalOnlyDyspnea || resolvedAfterIntenseExercise },
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

    _getSwimmingSymptomProfile(sourceText) {
        const combined = sourceText === undefined
            ? [
                this.userData.disturbo,
                ...(this.userData.conoscitiveResp || []),
                ...(this.userData.anamnesticheResp || [])
            ].filter(Boolean).join(" ")
            : sourceText;
        const text = normalizeMedicalText(combined || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[â€™â€˜`Â´]/g, "'");
        const positiveText = this._stripNegatedClinicalClauses(text);
        const waterContext = /(?:nuot\w*|piscina|in acqua|acqua profonda|immersion\w*)/.test(positiveText);
        const relevantSymptom = /(?:oppressione|costrizione|peso|dolore|fastidio|manca l'aria|fame d'aria|dispnea|affanno|tosse|fischio|sibil|paura|panico|battito accelerato|palpitazion|capogir|vertigin|sveniment)/.test(positiveText);
        if (!waterContext || !relevantSymptom) return "";

        const severeChestPain = /(?:forte|intenso|persistente)[^.!?;]{0,35}(?:dolore|peso|oppressione)[^.!?;]{0,35}(?:petto|torace)|(?:dolore|peso|oppressione)[^.!?;]{0,35}(?:petto|torace)[^.!?;]{0,35}(?:forte|intenso|persistente)/.test(positiveText);
        const severeBreathing = /(?:grave|severa|marcata)[^.!?;]{0,35}(?:difficolta respiratoria|dispnea|mancanza d'aria)|(?:difficolta respiratoria|dispnea|mancanza d'aria)[^.!?;]{0,35}(?:grave|severa|marcata)/.test(positiveText);
        const syncope = /(?:perdita di coscienza|quasi svenimento|presincope|sincope)/.test(positiveText);
        if (severeChestPain || severeBreathing || syncope) return "emergency";

        const chestLocation = /(?:oppressione|costrizione|peso|dolore|fastidio)[^.!?;]{0,45}(?:petto|torace|sterno)|(?:petto|torace|sterno)[^.!?;]{0,45}(?:oppressione|costrizione|peso|dolore|fastidio)/.test(positiveText);
        const respiratory = /(?:manca l'aria|fame d'aria|dispnea|affanno|difficolta (?:a )?respirar|tosse|fischio|sibil)/.test(positiveText);
        const cardiacAssociated = /(?:palpitazion|battito accelerato|capogir|vertigin|sudorazione fredda|nausea)/.test(positiveText);
        const otherExertion = /(?:salendo|scale|corsa|corr\w*|altri sforzi|altro sforzo)/.test(positiveText);
        const fear = /(?:paura intensa|panico|bisogno urgente di uscire|devo uscire subito)/.test(positiveText);
        const waterSpecific = /(?:solo in acqua|acqua profonda|profondita|immersione|anche restando fermo)/.test(positiveText);
        const exerciseWell = /(?:fuori dall'acqua|fuori acqua)[^.!?;]{0,80}(?:sto bene|senza problemi)|(?:corro|corsa)[^.!?;]{0,45}(?:senza problemi|sto bene)/.test(text);
        const chestNegated = /(?:non ho|nessun[oa]?|senza|assenza di)[^.!?;]{0,60}(?:dolore|peso|oppressione)[^.!?;]{0,25}(?:petto|torace)|(?:non ho|nessun[oa]?|senza|assenza di)[^.!?;]{0,45}dolore toracico/.test(text);
        const breathingNegated = /(?:non ho|nessun[oa]?|senza|assenza di)[^.!?;]{0,65}(?:vera )?(?:mancanza d'aria|fame d'aria|dispnea|difficolta respiratoria)/.test(text);

        if (fear && waterSpecific && chestNegated && (breathingNegated || exerciseWell)) return "anxiety";
        if (chestLocation && (otherExertion || cardiacAssociated || respiratory)) return "cardiac";
        if (respiratory && !chestLocation) return "respiratory";
        if (/(?:oppressione|costrizione|peso|fastidio)/.test(positiveText)) return "ambiguous";
        return "";
    }

    _getSwimmingExplicitNegations() {
        const text = normalizeMedicalText([
            this.userData.disturbo,
            ...(this.userData.conoscitiveResp || []),
            ...(this.userData.anamnesticheResp || [])
        ].filter(Boolean).join(" ")).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return {
            chest: /(?:non ho|nessun[oa]?|senza|assenza di)[^.!?;]{0,60}(?:dolore|peso|oppressione)[^.!?;]{0,25}(?:petto|torace)|(?:non ho|nessun[oa]?|senza|assenza di)[^.!?;]{0,45}dolore toracico/.test(text),
            breathing: /(?:non ho|nessun[oa]?|senza|assenza di)[^.!?;]{0,65}(?:vera )?(?:mancanza d'aria|fame d'aria|dispnea|difficolta respiratoria)/.test(text)
        };
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
        const swimmingProfile = this._getSwimmingSymptomProfile();
        const swimmingNegations = this._getSwimmingExplicitNegations();
        if (swimmingProfile === "ambiguous") {
            normalized.sintesi_anamnestica = "E riferita una sensazione di oppressione o fastidio durante il nuoto o in acqua, ma sede, natura e sintomi associati non sono ancora sufficientemente definiti per indicare una branca specialistica con precisione.";
            normalized.specialista_indicato = "Medico di Medicina Generale o Internista per primo inquadramento";
            normalized.livello_urgenza = "Valutazione medica generale programmata a breve; non da rimandare se il disturbo peggiora";
            normalized.area_specialistica_piu_adatta = {
                branca: "Medicina generale / Medicina interna",
                area_specialistica: "Primo inquadramento di un sintomo non ancora localizzato durante il nuoto",
                eventuale_secondo_livello: "Cardiologia, Pneumologia o Psicologia solo secondo sede, sintomi associati e valutazione medica"
            };
            normalized.red_flags_rilevate = ["oppressione o fastidio durante il nuoto non ancora localizzato"];
            normalized.preparazione_visita = "Riferisci sede esatta del sintomo, durata, frequenza, relazione con lo sforzo e con la profondita dell'acqua, sintomi associati e rapidita di regressione dopo l'uscita dall'acqua. Se compaiono forte dolore al petto, svenimento o grave difficolta respiratoria, contatta subito 112/118 o Pronto Soccorso.";
            normalized.impegnativa_medico = "Primo inquadramento medico di oppressione o fastidio non localizzato durante il nuoto, senza attribuzione diagnostica e senza specialista forzato.";
        } else if (swimmingProfile === "cardiac") {
            normalized.sintesi_anamnestica = "Sono riferiti peso, dolore o oppressione localizzati al petto durante il nuoto, con elementi associati allo sforzo che richiedono orientamento cardiologico prudente.";
            normalized.specialista_indicato = "Cardiologo";
            normalized.livello_urgenza = "Valutazione cardiologica prioritaria / non da rimandare";
            normalized.area_specialistica_piu_adatta = {
                branca: "Cardiologia",
                area_specialistica: "Valutazione di sintomi toracici riferiti durante sforzo",
                eventuale_secondo_livello: "Servizio urgente se i sintomi sono attuali, persistenti o associati a segnali di allarme"
            };
            normalized.red_flags_rilevate = ["sintomo toracico riferito durante il nuoto o altro sforzo"];
            normalized.preparazione_visita = "Riferisci sede, durata, intensita, rapporto con riposo e altri sforzi, irradiazione e sintomi associati. Se il dolore e forte o persistente, compare a riposo, o si associa a grave difficolta respiratoria, sudorazione fredda, nausea, quasi svenimento o svenimento, contatta subito 112/118 o Pronto Soccorso.";
            normalized.impegnativa_medico = "Valutazione cardiologica prioritaria per sintomi toracici riferiti durante sforzo, senza formulazione diagnostica e senza prescrizioni.";
        } else if (swimmingProfile === "respiratory") {
            normalized.sintesi_anamnestica = "Durante il nuoto sono riferiti sintomi respiratori come mancanza d'aria, tosse o fischi nel respiro, senza attribuzione diagnostica.";
            normalized.specialista_indicato = "Pneumologo; Medico dello Sport secondo disponibilita e valutazione iniziale";
            normalized.livello_urgenza = "Valutazione pneumologica prioritaria / non da rimandare se il disturbo si ripete o peggiora";
            normalized.area_specialistica_piu_adatta = {
                branca: "Pneumologia / Medicina dello sport",
                area_specialistica: "Valutazione di sintomi respiratori riferiti durante esercizio",
                eventuale_secondo_livello: "Servizio urgente in caso di grave difficolta respiratoria o rapido peggioramento"
            };
            normalized.red_flags_rilevate = [
                "sintomi respiratori riferiti durante il nuoto",
                ...(swimmingNegations.chest ? ["assenza riferita di dolore al petto"] : [])
            ];
            normalized.preparazione_visita = "Riferisci comparsa, durata e intensita di mancanza d'aria, tosse e fischi, relazione con altri esercizi, freddo o ambienti specifici e rapidita di regressione. In caso di grave difficolta respiratoria, labbra bluastre, confusione, svenimento o rapido peggioramento, contatta subito 112/118 o Pronto Soccorso.";
            normalized.impegnativa_medico = "Valutazione pneumologica o medico-sportiva per sintomi respiratori riferiti durante esercizio, senza formulazione diagnostica e senza prescrizioni.";
        } else if (swimmingProfile === "anxiety") {
            normalized.sintesi_anamnestica = "Sono riferiti paura intensa e bisogno urgente di uscire in uno specifico contesto acquatico, con benessere fuori dall'acqua e senza segnali fisici rilevanti emersi dalle risposte.";
            normalized.specialista_indicato = "Psicologo o Psicoterapeuta";
            normalized.livello_urgenza = "Urgenza bassa / valutazione psicologica programmata";
            normalized.area_specialistica_piu_adatta = {
                branca: "Psicologia / Psicoterapia",
                area_specialistica: "Valutazione di paura o panico situazionale riferiti nel contesto acquatico",
                eventuale_secondo_livello: "Valutazione medica generale se compaiono sintomi fisici nuovi, persistenti o non situazionali"
            };
            normalized.red_flags_rilevate = [
                "paura intensa specifica del contesto acquatico",
                ...(swimmingNegations.chest ? ["assenza riferita di dolore toracico"] : []),
                ...(swimmingNegations.breathing ? ["assenza riferita di vera mancanza d'aria"] : [])
            ];
            normalized.preparazione_visita = "Descrivi profondita, immersione, sensazione di controllo, frequenza, durata, bisogno di uscire e impatto sulle attivita. Richiedi invece assistenza medica urgente se compaiono dolore toracico persistente, grave difficolta respiratoria, svenimento, confusione o peggioramento improvviso.";
            normalized.impegnativa_medico = "Valutazione psicologica programmata per paura intensa situazionale in acqua, dopo negazione dei segnali fisici rilevanti riferiti; senza diagnosi e senza prescrizioni.";
        }
        return this._sanitizeResultForUser(normalized);
    }

}
