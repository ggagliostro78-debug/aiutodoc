// Question routing, separated from UI and provider integration.
class BetaQuestionnaireRules {
    _generaDomandeAnamnestiche(disturbo) {
        const rawLower = normalizeMedicalText(disturbo || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’‘`´]/g, "'");
        const stripNegatedClauses = (value) => String(value || "")
            .replace(/\b(?:non ho|non ha|non presento|non presenta|non riferisco|non sono|non mi sono|nessun[oa]?|senza|assenza di|nega|negano)\b[^.!?;]{0,180}(?=[.!?;]|$)/gi, " ")
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
        if (this._getSwimmingSymptomProfile(rawLower)) {
            return questionSet(
                "Dove avverti esattamente l'oppressione o il fastidio durante il nuoto?\n<br><i>A) Al petto o al torace, come dolore o peso<br>B) Alla gola o nel respiro, con difficolta a inspirare<br>C) Come sensazione emotiva, oppure non riesco a localizzarla</i>",
                "Quali sintomi compaiono nello stesso momento?\n<br><i>A) Palpitazioni, capogiro, sudorazione, nausea o quasi svenimento<br>B) Fame d'aria, tosse, fischi o sibili nel respiro<br>C) Nessuno di questi, oppure non so</i>",
                "In quali altre situazioni succede?\n<br><i>A) Anche con altri sforzi, come corsa o scale<br>B) Solo in acqua, soprattutto se profonda o anche restando fermo, con paura o bisogno urgente di uscire<br>C) Il rapporto con sforzo, profondita o uscita dall'acqua non e chiaro</i>"
            );
        }
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

}
