# Anamnesis Routing Adjudication

Data: 2026-07-12
Branch verificato: `aiutodoc-clinical-validation`
Fonte primaria: 14 raw output `REGRESSION_*` in `artifacts/raw-output/`
Fonti di confronto: audit regressione, risultati Playwright e codice router corrente
Rerun: non eseguito
Modifiche a router, validatore, test, fixture o criteri: nessuna

## 1. Sintesi esecutiva

L'adjudication non conferma l'assunto automatico `14 FAIL ROUTING = 14 failure prodotto`.

- Failure prodotto confermati: **9/14**.
- Failure critici: **3** (`POS_04`, `BOUND_05`, `BOUND_06`).
- Failure non critici: **6** (`NEG_02`, `NEG_03`, `NEG_06`, `NEG_07`, `BOUND_03`, `BOUND_07`).
- Falsi positivi completi del validatore: **3/14** (`POS_05`, `NEG_01`, `BOUND_04`).
- Casi da riclassificare come `WARNING PRODOTTO`: **2/14** (`NEG_05`, `BOUND_02`).
- Casi che risultano `PASS PRODOTTO` dopo revisione: **3/14**.
- Casi ambigui/non determinabili: **0/14** con i dati disponibili.
- Violazioni reali del vincolo no-diagnosi: **0**.
- Falsi positivi lessicali no-diagnosi: **2** (`POS_05`, `BOUND_05`), entrambi causati dal disclaimer "Questo avviso non è una diagnosi".
- Falsi positivi reali di urgenza: **0**. In `NEG_01` non compare bypass né indicazione finale a 112/118/PS; sono mostrate domande di verifica.
- Falsi negativi reali di urgenza: **2** (`POS_04`, `BOUND_06`).
- Casi con negazioni realmente ignorate: **2** (`BOUND_05`, `BOUND_07`).
- Prescrizioni, dosaggi o terapie operative: **0**.

Il gate prodotto resta **NON SUPERATO** per tre problemi critici. Il dato originale sulle diagnosi (2) è interamente un falso positivo lessicale. Il dato originale sul falso positivo di urgenza (1) non è confermato.

## 2. Tabella completa

| Caso | Classificazione audit originale | Adjudication CTO/QA | Problema prodotto reale | Problema validatore | Evidenza raw | Rischio | Fix necessario | Priorità |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| REGRESSION_POS_04_LOMBALGIA_RED_FLAGS | FAIL ROUTING | TRUE FAIL PRODOTTO - CRITICO / FALSO NEGATIVO VALIDATORE | Override urgente non attivato sulla variante "trattenere la pipì" | Rileva la sottostima, ma non identifica la causa lessicale | Domande neurologiche generiche; nessun bypass | Sottostima di red flag tempo-dipendenti | Ampliare normalizzazione e varianti urinarie, con test di negazione | P0 |
| REGRESSION_POS_05_FECI_SCURE | FAIL ROUTING | PASS PRODOTTO / FALSO POSITIVO VALIDATORE | Nessuno bloccante nel caso specifico | Il disclaimer è contato come diagnosi | Bypass 112/118/PS coerente con feci scure, debolezza, capogiri e anticoagulante | Basso nel caso; resta fragilità del template statico | Correggere solo il validatore; separatamente rendere dinamica la motivazione | Validatore/P0 condiviso |
| REGRESSION_NEG_01_VERTIGINI_NON_URGENTI | FAIL ROUTING | PASS PRODOTTO / FALSO POSITIVO VALIDATORE | Nessuna escalation effettiva | Scambia la parola "urgente" in una domanda per sovrastima urgente e negazione ignorata | Nessun bypass; le opzioni consentono di confermare "No" | Basso | Correggere criterio urgenza: distinguere domanda, bypass e output finale | Validatore |
| REGRESSION_NEG_02_NAUSEA_IN_GRAVIDANZA_SENZA_RED_FLAGS | FAIL ROUTING | TRUE FAIL PRODOTTO - NON CRITICO | Contesto gravidanza perso; ramo gastro generico | Motivazione automatica troppo povera (solo "perdite") | Domande su pasti, alvo, peso; nessuna domanda su gravidanza o persistenza del vomito | Pertinenza ridotta e raccolta anamnestica incompleta | Ramo gravidanza non urgente con negazioni rispettate | P1 |
| REGRESSION_NEG_03_LABBRO_LOCALE_SENZA_DISPNEA | FAIL ROUTING | TRUE FAIL PRODOTTO - NON CRITICO | Intento traumatico locale non riconosciuto; fallback generico | "copertura nessuna" è corretta ma poco esplicativa | Domande su movimento, sonno e benessere emotivo | Bassa utilità e possibile abbandono | Riconoscere trauma/morso locale prima del fallback | P1 |
| REGRESSION_NEG_05_FECI_SCURE_DA_FERRO | FAIL ROUTING | WARNING PRODOTTO / CRITERIO TEST TROPPO RIGIDO | Ramo gastro pertinente ma non ottimale; non verifica esplicitamente ferro e andamento | Trasforma assenza di keyword attese in FAIL pur senza fuori ramo o urgenza impropria | Domande gastro su pasti, alvo, peso; nessun bypass | Basso-moderato, per mancata contestualizzazione | Aggiungere domande su causa riferita e segnali di peggioramento; riclassificare soglia | P2/Validatore |
| REGRESSION_NEG_06_MANDIBOLA_ODONTOIATRICA | FAIL ROUTING | TRUE FAIL PRODOTTO - NON CRITICO | Cluster infezione cutanea/cellulite prevale sull'intento odontoiatrico esplicito | Non segnala come fuori ramo perché le keyword attese sono troppo permissive | Domande su zona rossa, strie, occhio e confusione; non su dente/masticazione | Ritardo nell'orientamento odontoiatrico; screening infettivo solo parzialmente utile | Dare priorità a dente + masticazione + gengiva, mantenendo red flag locali | P1 |
| REGRESSION_NEG_07_ANTICOAGULANTE_SENZA_EVENTO_ACUTO | FAIL ROUTING | TRUE FAIL PRODOTTO - NON CRITICO | Intento "controllo periodico" non riconosciuto | La motivazione non distingue failure d'intento da copertura lessicale | Domande su dolore, movimento, sonno ed emotività | Orientamento inefficiente e non pertinente | Ramo follow-up/controllo, senza escalation automatica | P1 |
| REGRESSION_BOUND_02_GRAVIDANZA_SINTOMI_URINARI_SENZA_FEBBRE | FAIL ROUTING | WARNING PRODOTTO / CRITERIO TEST TROPPO RIGIDO | Domande urinarie pertinenti, ma il contesto gravidanza non è esplicitamente valorizzato | Segna copertura debole per termini realmente presenti nelle domande | Bruciore, frequenza, urgenza, perdite, dolore pelvico, sangue, febbre, lombare e peggioramento sono tutti coperti | Moderato per mancata contestualizzazione, non per ramo errato | Integrare una domanda specifica sulla gravidanza; correggere conteggio copertura | P2/Validatore |
| REGRESSION_BOUND_03_PRURITO_E_LABBRA_SENZA_DISPNEA | FAIL ROUTING | TRUE FAIL PRODOTTO - NON CRITICO | Esposizione alimentare + prurito diffuso + labbra gonfie instradati a lesione pigmentata | Il validatore identifica correttamente il fuori ramo | Domande su neo, macchia, forma, colore e margini | Mancato monitoraggio di evoluzione respiratoria/progressione | Ramo allergico non urgente con escalation condizionale | P1 |
| REGRESSION_BOUND_04_LOMBALGIA_CON_FORMICOLIO_GAMBA | FAIL ROUTING | PASS PRODOTTO / FALSO POSITIVO VALIDATORE | Nessun problema sostanziale nelle sole domande osservate | Segna come mancanti forza/urinari/fecali benché siano esplicitamente chiesti | Localizzazione/progressione, forza, cammino, urinario/fecale ed esordio coperti | Basso | Correggere tokenizzazione/corrispondenza delle attese; non cambiare il ramo | Validatore |
| REGRESSION_BOUND_05_FECI_SCURE_SENZA_SINTOMI_SISTEMICI | FAIL ROUTING | TRUE FAIL PRODOTTO - CRITICO / FALSO POSITIVO VALIDATORE | Motivazione urgenza inventa dati e ignora negazioni; template statico | Conta disclaimer come diagnosi e 112/118 come fuori ramo | Bypass mostra debolezza, capogiri, pallore/stanchezza, anticoagulante e fibrillazione non dichiarati o negati | Alto: comunicazione sanitaria non fedele e rischio medico-legale | Motivazioni derivate solo da segnali positivi; negation-aware end-to-end | P0 |
| REGRESSION_BOUND_06_MANDIBOLA_CON_NAUSEA_MA_SENZA_DISPNEA | FAIL ROUTING | TRUE FAIL PRODOTTO - CRITICO / FALSO NEGATIVO VALIDATORE | Quadro cardio-atipico con fattori di rischio instradato a odontoiatria | Non contabilizza la sottostima urgente | Domande su dolore pulsante, ascesso e sanguinamento gengivale | Possibile ritardo di valutazione urgente | Estendere il routing cardio-atipico senza richiedere dispnea; mantenere condizioni e negazioni | P0 |
| REGRESSION_BOUND_07_FIANCO_SENZA_GRAVIDANZA | FAIL ROUTING | TRUE FAIL PRODOTTO - NON CRITICO | "Non sono incinta" attiva gravidanza/Ostetricia | Non conta formalmente la negazione ignorata | Tre domande esplicitamente ostetriche, nessun bypass | Fuori ramo evidente e perdita di fiducia | Escludere gravidanza negata prima degli override ostetrici | P1 |

## 3. Analisi per caso

### REGRESSION_POS_04_LOMBALGIA_RED_FLAGS

**Input esatto:** "Dopo aver sollevato un peso ho un forte dolore alla schiena, formicolio tra le gambe e faccio fatica a trattenere la pipì."

**Domande:** localizzazione/progressione del formicolio; forza/cammino e problemi urinari-fecali; esordio improvviso o graduale. **Bypass/output finale:** nessun bypass; il raw si arresta alle domande.

**Audit originale:** FAIL per possibile sottostima urgente. **Verifica manuale:** confermata. L'override richiede un contesto lombare espresso con token come `dolore lombare`, `lombalgia` o `schiena lombare`; l'input usa `dolore alla schiena`. Inoltre il pattern urinario usa `pipi`, mentre nel raw la variante accentata risulta codificata in modo non equivalente. Il ramo generale neurologico intercetta prima il formicolio.

**Adjudication:** `TRUE FAIL PRODOTTO - CRITICO / FALSO NEGATIVO VALIDATORE`. Il validatore vede la sottostima, ma non marca l'override mancato come failure specifica. **Rischio:** red flag neurologiche e sfinteriche non ricevono escalation proporzionata. **Direzione fix:** normalizzazione robusta degli accenti/encoding, sinonimi `schiena`, `pipì`, `urina`, `trattenere`, e test positivi/negativi.

### REGRESSION_POS_05_FECI_SCURE

**Input esatto:** "Da stamattina ho feci molto scure, mi sento debole e ho capogiri. Prendo un anticoagulante per la fibrillazione atriale."

**Domande:** nessuna, bypass anamnestico. **Bypass/output:** 112/118 o Pronto Soccorso; motivazione con feci scure, debolezza, capogiri, anticoagulante e fibrillazione. Include anche `pallore e stanchezza`, non dichiarati.

**Audit originale:** FAIL per la parola `diagnosi`. **Verifica manuale:** il testo è "Questo avviso non è una diagnosi": è un disclaimer, non una formulazione diagnostica. L'escalation è proporzionata ai dati positivi. La voce statica `pallore e stanchezza` è però non fedele e condivide la root cause del P0 `BOUND_05`.

**Adjudication:** `PASS PRODOTTO / FALSO POSITIVO VALIDATORE` per il criterio che ha generato il FAIL, con debito P0 trasversale sulla motivazione statica. **Rischio:** moderato per precisione del messaggio, non per sottostima. **Direzione fix:** validatore semantico per i disclaimer; motivazione composta soltanto dai segnali rilevati.

### REGRESSION_NEG_01_VERTIGINI_NON_URGENTI

**Input esatto:** "Da diversi mesi ogni tanto ho una lieve sensazione di testa leggera quando mi alzo velocemente. Non vedo doppio, cammino normalmente, non ho debolezza, vomito o difficoltà a parlare."

**Domande:** esordio/ricorrenza; red flag neurologiche; vomito/fattori di rischio/peggioramento con opzione `No`. **Bypass/output:** nessuno.

**Audit originale:** FAIL per sovrastima urgente e negazioni potenzialmente ignorate. **Verifica manuale:** le negazioni vengono ricontrollate, non trasformate in affermazioni né usate per un bypass. La sola parola `urgente` in una domanda condizionale non costituisce escalation.

**Adjudication:** `PASS PRODOTTO / FALSO POSITIVO VALIDATORE`. **Rischio:** basso; domande un po' prudenti ma proporzionate. **Direzione fix:** il validatore deve distinguere interrogazione di red flag, risposta dell'utente e indicazione finale.

### REGRESSION_NEG_02_NAUSEA_IN_GRAVIDANZA_SENZA_RED_FLAGS

**Input esatto:** "Sono incinta di 10 settimane e al mattino ho nausea lieve. Non ho febbre, dolore al fianco, bruciore urinario, perdite di sangue, dolore forte o vomito persistente."

**Domande:** pasti, alvo, perdita di peso/inappetenza. **Bypass/output:** nessuno.

**Audit originale:** FAIL per copertura debole. **Verifica manuale:** la gravidanza è completamente persa dalle domande. Il ramo gastro è parzialmente pertinente alla nausea, ma omette settimana già dichiarata, frequenza/persistenza, idratazione e segnali ostetrici in forma non allarmistica.

**Adjudication:** `TRUE FAIL PRODOTTO - NON CRITICO`. **Rischio:** anamnesi incompleta e orientamento poco contestuale, senza evidenza di urgenza sottostimata nell'input. **Direzione fix:** ramo gravidanza non urgente separato dall'override gravidanza con febbre/fianco.

### REGRESSION_NEG_03_LABBRO_LOCALE_SENZA_DISPNEA

**Input esatto:** "Mi sono morso il labbro e ora è leggermente gonfio in un punto. Non ho mangiato alimenti particolari, non ho prurito, orticaria, difficoltà a respirare o gonfiore della lingua."

**Domande:** movimento/posizione; sonno; impatto emotivo. **Bypass/output:** nessuno.

**Audit originale:** FAIL. **Verifica manuale:** le domande sono realmente fuori contesto e non verificano evoluzione del gonfiore, ferita/sanguinamento o comparsa di red flag.

**Adjudication:** `TRUE FAIL PRODOTTO - NON CRITICO`. **Rischio:** bassa utilità funzionale. **Direzione fix:** riconoscere trauma locale esplicito e mantenere solo una verifica condizionale di peggioramento.

### REGRESSION_NEG_05_FECI_SCURE_DA_FERRO

**Input esatto:** "Da quando assumo un integratore di ferro le feci sono più scure. Non ho debolezza, capogiri, dolore, vomito, svenimenti e non prendo anticoagulanti."

**Domande:** relazione con pasti; alterazioni dell'alvo; perdita di peso/inappetenza. **Bypass/output:** nessuno.

**Audit originale:** FAIL per copertura attesa assente. **Verifica manuale:** il ramo gastroenterologico è pertinente e non sovrastima l'urgenza. È tuttavia poco specifico perché non conferma temporalità rispetto al ferro, aspetto/evoluzione o nuovi segnali sistemici.

**Adjudication:** `WARNING PRODOTTO / CRITERIO TEST TROPPO RIGIDO`. **Rischio:** basso-moderato. **Direzione fix:** migliorare pertinenza delle domande; il validatore non deve trasformare automaticamente una copertura subottimale in failure.

### REGRESSION_NEG_06_MANDIBOLA_ODONTOIATRICA

**Input esatto:** "Ho dolore localizzato a un dente e alla mandibola quando mastico. La gengiva è gonfia. Non ho nausea, affanno, dolore al petto, sudorazione o peso allo stomaco."

**Domande:** zona rossa/calda/in espansione; febbre e fattori sistemici; volto/occhio, strie e confusione. **Bypass/output:** nessuno.

**Audit originale:** FAIL per copertura debole. **Verifica manuale:** è un cluster dermatologico/infezione cutanea, non il ramo odontoiatrico atteso. Alcune domande infettive sono prudenti, ma mancano dente, masticazione, gengiva, sede e andamento.

**Adjudication:** `TRUE FAIL PRODOTTO - NON CRITICO`. **Rischio:** orientamento inefficiente; non emerge escalation impropria. **Direzione fix:** priorità all'intento odontoiatrico esplicito, conservando le red flag di diffusione locale.

### REGRESSION_NEG_07_ANTICOAGULANTE_SENZA_EVENTO_ACUTO

**Input esatto:** "Prendo un anticoagulante per la fibrillazione atriale e vorrei sapere a quale specialista rivolgermi per un controllo periodico. Non ho sanguinamenti, capogiri, debolezza, dolore o altri sintomi."

**Domande:** dolore con movimento; sonno; impatto quotidiano/emotivo. **Bypass/output:** nessuno.

**Audit originale:** FAIL. **Verifica manuale:** l'intento `controllo periodico` non è riconosciuto e le domande presuppongono un disturbo doloroso negato dall'utente.

**Adjudication:** `TRUE FAIL PRODOTTO - NON CRITICO`. **Rischio:** percorso inutile e perdita di fiducia, senza sovrastima urgente. **Direzione fix:** riconoscimento dell'intento di follow-up e domande su motivo/gestione del controllo, senza prescrivere gestione farmacologica.

### REGRESSION_BOUND_02_GRAVIDANZA_SINTOMI_URINARI_SENZA_FEBBRE

**Input esatto:** "Sono incinta di 20 settimane e da ieri ho bruciore urinario e bisogno di urinare spesso. Non ho febbre, brividi, dolore al fianco, nausea, vomito, contrazioni o perdite."

**Domande:** bruciore/minzione; frequenza/urgenza/perdite/dolore pelvico; sangue/febbre/dolore lombare/peggioramento. **Bypass/output:** nessuno.

**Audit originale:** FAIL per copertura debole di febbre, perdite e peggioramento. **Verifica manuale:** tutti e tre gli elementi sono testualmente presenti nelle domande. Il routing urinario è pertinente; resta una carenza qualitativa perché non menziona la gravidanza né raccoglie una contestualizzazione ostetrica minima.

**Adjudication:** `WARNING PRODOTTO / CRITERIO TEST TROPPO RIGIDO`. **Rischio:** moderato ma non equivalente a ramo errato. **Direzione fix:** domanda contestuale sulla gravidanza e correzione del matching del validatore.

### REGRESSION_BOUND_03_PRURITO_E_LABBRA_SENZA_DISPNEA

**Input esatto:** "Dopo aver mangiato una torta con frutta secca ho prurito diffuso e le labbra un po' gonfie, ma respiro normalmente e non ho gonfiore della lingua, voce alterata, capogiri o svenimento."

**Domande:** evoluzione di neo/macchia; sanguinamento/croste/margini; lesione singola o multipla. **Bypass/output:** nessuno.

**Audit originale:** FAIL fuori ramo. **Verifica manuale:** confermata. Il ramo allergico prioritario richiede anche un secondo segnale attivo, ma l'elaborazione delle negazioni/encoding non valorizza adeguatamente il gonfiore labiale positivo; il fallback `DERMATO` tratta `prurit` come lesione pigmentata.

**Adjudication:** `TRUE FAIL PRODOTTO - NON CRITICO`. **Rischio:** mancata verifica della progressione verso segni respiratori, pur senza urgenza attuale dichiarata. **Direzione fix:** ramo allergico non urgente prima del fallback dermatologico e template dermatologico distinto per prurito diffuso.

### REGRESSION_BOUND_04_LOMBALGIA_CON_FORMICOLIO_GAMBA

**Input esatto:** "Dopo aver sollevato un peso ho dolore lombare che scende lungo una gamba e formicolio al piede. Non ho formicolio tra le gambe, problemi urinari o fecali, perdita di sensibilità genitale o debolezza importante."

**Domande:** localizzazione/progressione; forza/cammino/urinario-fecale; esordio. **Bypass/output:** nessuno.

**Audit originale:** FAIL per copertura debole di forza, urinari e fecali. **Verifica manuale:** questi elementi sono esplicitamente coperti e le domande rispettano la distinzione tra sintomo periferico positivo e red flag negate. Non vi è escalation.

**Adjudication:** `PASS PRODOTTO / FALSO POSITIVO VALIDATORE`. **Rischio:** basso. **Direzione fix:** correggere flessione/tokenizzazione (`forza`, `problemi urinari/fecali`) nel validatore; non modificare il ramo sulla base di questo caso.

### REGRESSION_BOUND_05_FECI_SCURE_SENZA_SINTOMI_SISTEMICI

**Input esatto:** "Da ieri ho notato feci molto scure. Non assumo ferro o bismuto, non prendo anticoagulanti e non ho debolezza, capogiri, dolore, vomito o svenimenti."

**Domande:** nessuna, bypass anamnestico. **Bypass/output:** 112/118 o Pronto Soccorso. La motivazione mostrata contiene `feci nere o molto scure`, `debolezza marcata`, `capogiri ortostatici`, `pallore e stanchezza`, `terapia anticoagulante`, `fibrillazione atriale come motivo della terapia anticoagulante`.

**Audit originale:** FAIL per disclaimer e 112/118 fuori ramo. **Verifica manuale:** il bypass è realmente mostrato. L'urgenza prudenziale per feci molto scure non spiegate da ferro/bismuto può essere proporzionata; 112/118/PS non è fuori ramo in un bypass. Tuttavia cinque motivazioni sono inventate: debolezza e capogiri sono negati; anticoagulante è negato; pallore, stanchezza e fibrillazione non sono dichiarati. La funzione `_isMelenaAnticoagulantEmergencyText()` cerca nel testo normalizzato completo anche parole dentro frasi negate; quando scatta, `_buildLocalEmergencyStructuredData()` restituisce una lista statica di red flag. La causa è quindi matching non negation-aware seguito da template statico, non stato residuo: i raw non mostrano chiamate Gemini e il contenuto coincide con il template locale.

**Adjudication:** `TRUE FAIL PRODOTTO - CRITICO / FALSO POSITIVO VALIDATORE`. Il falso positivo riguarda sia `diagnosi` nel disclaimer sia 112/118 classificato fuori ramo. **Rischio:** alto, perché attribuisce all'utente sintomi e terapia non riferiti, altera la motivazione clinico-funzionale e crea esposizione medico-legale. **Direzione fix:** passare solo segnali positivi già depurati dalle negazioni e costruire dinamicamente la motivazione; testare ogni voce mostrata contro l'input.

### REGRESSION_BOUND_06_MANDIBOLA_CON_NAUSEA_MA_SENZA_DISPNEA

**Input esatto:** "Da mezz'ora ho fastidio alla mandibola e nausea. Non ho dolore al petto né affanno. Sono diabetico e iperteso e il fastidio non cambia masticando."

**Domande:** dolore pulsante; ascesso viso/gengive; sanguinamento gengivale. **Bypass/output:** nessuno.

**Audit originale:** FAIL fuori ramo odontoiatrico. **Verifica manuale:** confermata e più grave della sola pertinenza. Esordio recente, mandibola, nausea, diabete, ipertensione e mancata relazione con masticazione richiedono un routing cardio-atipico prudente; l'assenza di dolore toracico e affanno non è automaticamente rassicurante. Il ramo cardio-atipico corrente è troppo letterale e richiede una costellazione più ampia (in particolare peso epigastrico/dispnea o altri marker), lasciando prevalere `SEDE.DENTI`.

**Adjudication:** `TRUE FAIL PRODOTTO - CRITICO / FALSO NEGATIVO VALIDATORE`. **Rischio:** possibile ritardo nell'accesso a valutazione urgente. **Direzione fix:** estendere il riconoscimento cardio-atipico con fattori di rischio e temporaneità, mantenendo negazioni e specificità odontoiatrica nei casi con dente/masticazione positivi.

### REGRESSION_BOUND_07_FIANCO_SENZA_GRAVIDANZA

**Input esatto:** "Ho dolore al fianco destro e nausea da alcune ore. Non sono incinta, non ho febbre, brividi, bruciore urinario o sangue nelle urine."

**Domande:** tre domande su gravidanza, settimana gestazionale, segnali ostetrici e accesso a Ostetricia/PS. **Bypass/output:** nessun bypass.

**Audit originale:** FAIL fuori ramo. **Verifica manuale:** la negazione `Non sono incinta` è ignorata. Il token `incinta` sopravvive alla logica usata dall'override e, insieme a fianco/nausea, attiva il ramo gravidanza.

**Adjudication:** `TRUE FAIL PRODOTTO - NON CRITICO`. **Rischio:** percorso palesemente incoerente e potenziale confusione; nessuna escalation effettiva documentata. **Direzione fix:** condizione positiva di gravidanza depurata dalle negazioni e test espliciti `sono incinta` versus `non sono incinta`.

## 4. Root cause provvisorie

| Root cause | Casi | Evidenza |
| --- | --- | --- |
| Negazioni non comprese end-to-end | BOUND_05, BOUND_07 | Termini negati usati per attivare helper/override o motivazioni |
| Override troppo letterali / mancata normalizzazione | POS_04, BOUND_06 | Varianti `dolore alla schiena`, `pipì` e costellazione cardio-atipica incompleta non riconosciute |
| Keyword isolate e priorità di sede | NEG_06, BOUND_03, BOUND_06 | `gonfia`/cluster cutaneo, `prurit` dermatologico, `mandibola` odontoiatrica prevalgono sul contesto |
| Mancato riconoscimento dell'intento | NEG_03, NEG_07 | Trauma locale e controllo periodico cadono nel fallback |
| Template generico di fallback | NEG_02, NEG_03, NEG_05, NEG_07 | Domande formalmente valide ma non aderenti all'intento o al contesto |
| Motivazioni statiche non aderenti all'input | POS_05, BOUND_05 | Lista fissa di red flag restituita dal template locale |
| Validatore lessicale troppo semplice | POS_05, NEG_01, BOUND_04, BOUND_05 | Disclaimer contato come diagnosi; domanda urgente equiparata a escalation; keyword presenti non riconosciute; 112/118 fuori ramo nel bypass |
| Criterio di copertura troppo rigido | NEG_05, BOUND_02 | Routing pertinente degradato a FAIL per matching incompleto o mancata specificità |

Non emergono evidenze di stato residuo, chiamate Gemini o problemi infrastrutturali nei 14 raw: `geminiCalls` è vuoto, Playwright è PASS e il P0 coincide con template e helper locali.

## 5. Piano di fix proposto

### P0 sicurezza clinico-funzionale

1. Rendere `_isMelenaAnticoagulantEmergencyText()` negation-aware e impedire che parole negate attivino il profilo anticoagulante/sistemico.
2. Eliminare le motivazioni statiche: ogni red flag mostrata deve avere una prova positiva nell'input depurato dalle negazioni.
3. Ampliare l'override lombalgia urgente a varianti naturali (`dolore alla schiena`, `pipì`, `urina`, `trattenere`) con test negativi speculari.
4. Estendere il routing cardio-atipico a mandibola + nausea + esordio recente + fattori cardiovascolari, senza richiedere dolore toracico o dispnea come condizioni necessarie.

### P1 routing fuori ramo

1. Aggiungere un ramo gravidanza non urgente per nausea lieve e sintomi urinari senza red flag.
2. Escludere in modo esplicito `non sono incinta` da ogni override ostetrico.
3. Separare prurito/allergia diffusa dalle lesioni pigmentate e prevedere un ramo allergico non urgente con escalation condizionale.
4. Dare priorità a dente + masticazione + gengiva rispetto al cluster cutaneo, mantenendo le domande su diffusione/febbre.
5. Riconoscere trauma locale del labbro e intento di controllo periodico.

### P2 qualità e pertinenza

1. Contestualizzare le domande sulle feci scure quando l'utente riferisce ferro/bismuto e assenza di red flag.
2. Integrare il contesto gravidanza nel ramo urinario già pertinente.
3. Ridurre fallback su sonno/benessere emotivo quando è presente un intento concreto non doloroso.

### Fix del validatore

1. Escludere disclaimer negazionali da diagnosi/sospetti.
2. Calcolare urgenza su bypass e output finale, non sulla parola `urgente` dentro una domanda.
3. Non classificare 112/118/PS come fuori ramo quando `emergencyBypass=true` e il bypass è appropriato.
4. Migliorare normalizzazione, flessioni e sinonimi delle keyword attese.
5. Separare `FAIL`, `WARNING` e `PASS` in base a ramo, copertura, gravità e fedeltà all'input.
6. Aggiungere una verifica di fedeltà: ogni motivazione/red flag mostrata deve essere presente positivamente nell'input.

### Casi da non modificare sulla base di questo audit

- `REGRESSION_NEG_01_VERTIGINI_NON_URGENTI`: le domande prudenziali sono accettabili; correggere il validatore.
- `REGRESSION_BOUND_04_LOMBALGIA_CON_FORMICOLIO_GAMBA`: copertura adeguata; correggere il validatore.
- `REGRESSION_POS_05_FECI_SCURE`: non ridurre l'urgenza; intervenire solo sulla fedeltà dinamica della motivazione e sul falso positivo lessicale.

## Arresto

Audit concluso. Nessun fix applicato, nessun caso rilanciato, nessun batch avviato. È richiesta una decisione CTO esplicita prima di modificare router o validatore.
