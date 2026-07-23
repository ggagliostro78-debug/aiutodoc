# Valutazione QA domande anamnestiche per branche validate

Data: 2026-07-11  
Branch: `aiutodoc-clinical-validation`  
Tipo attività: analisi statica/documentale del generatore domande, senza nuovi batch clinico-funzionali.

## Regole rispettate

- Nessuna modifica a `main`.
- Nessun merge, push, PR o deploy.
- Nessun test su produzione.
- Nessuna chiamata Gemini.
- Nessun Playwright clinico.
- Nessun mock.
- Nessuna modifica al motore clinico, prompt, CSS, grafica, layout, UX, documenti legali, database, Netlify, analytics, consensi o privacy.

## Sintesi esecutiva

Le domande anamnestiche del secondo blocco non sono ancora abbastanza vicine alla branca/specialità individuata. Il problema non riguarda solo il caso di cefalea visto manualmente: è sistemico.

Il generatore `_generaDomandeAnamnestiche(disturbo)` sceglie il blocco domande con una priorità basata su parole chiave anatomiche o sintomatiche isolate. Questo causa falsi routing quando una parola:

- compare dentro una negazione;
- compare come red flag da escludere;
- appartiene a un sintomo associato, non al disturbo principale;
- è una sottostringa casuale di un’altra parola;
- precede nel codice una branca più pertinente.

Esempi reali rilevati:

- `non ho rigidità del collo` può attivare domande cervicali/ortopediche.
- `vista offuscata` in crisi ipertensiva attiva domande oculistiche invece che cardiovascolari/emergenza.
- `mandibola` in dolore toracico urgente attiva domande odontoiatriche.
- `caviglie gonfie` in possibile scompenso attiva domande piede/caviglia.
- `nodo alla gola` in attacchi di panico attiva domande ORL.
- `non ho dolore al petto` in DCA adolescenziale attiva domande cardiologiche.
- `evidente` contiene la sottostringa `dent` e può attivare domande dentali.

Conclusione QA: prima di proseguire con nuove branche, è consigliabile correggere la metodologia di selezione delle domande anamnestiche.

## Criterio di valutazione usato

Per ogni caso dei batch validati ho confrontato:

- disturbo dichiarato;
- branca/specialità attesa dai test validati;
- tre domande generate dal codice reale;
- pertinenza rispetto alla branca;
- rischio di raccogliere dati irrilevanti o mancare red flag importanti.

Classificazione:

- `OK`: domande coerenti con branca e disturbo.
- `PARZIALE`: domande nella macro-area corretta ma troppo generiche o non ottimali.
- `NON CONFORME`: domande di branca diversa o potenzialmente fuorvianti.

## Risultato numerico sui batch già validati

| Branca validata | Casi analizzati | OK | Parziale | Non conforme | Stato domande |
|---|---:|---:|---:|---:|---|
| Cardiologia | 5 | 1 | 1 | 3 | Non sufficiente |
| Neurologia | 5 | 0 | 0 | 5 | Critico |
| Psicologia/Psichiatria | 5 | 0 | 3 | 2 | Non sufficiente |
| Ortopedia | 5 | 2 | 1 | 2 | Parziale |
| Dermatologia | 5 | 1 | 1 | 3 | Non sufficiente |
| Totale | 25 | 4 | 6 | 15 | Non sufficiente |

Nota: questa valutazione riguarda solo la pertinenza delle domande anamnestiche, non l’esito finale Gemini/normalizzato già validato nei batch.

## Tabella caso per caso

| Caso | Branca attesa | Domande generate | Valutazione | Problema |
|---|---|---|---|---|
| CARDIO_01_DOLOR_TORACICO_SFORZO_LIEVE | Cardiologia | Sforzo; irradiazione; sintomi associati gravi | OK | Coerente con dolore toracico da sforzo |
| CARDIO_02_DOLOR_TORACICO_URGENTE | Emergenza cardiologica | Domande dentali/ascesso/gengive | NON CONFORME | `mandibola` attiva blocco dentale prima del blocco cardiologico |
| CARDIO_03_PALPITAZIONI_RICORRENTI | Cardiologia/aritmologia | Domande dolore toracico/sforzo/irradiazione | PARZIALE | Macro-cardio ma poco specifiche per palpitazioni/aritmia |
| CARDIO_04_IPERTENSIONE_SEVERA_CON_SINTOMI | Emergenza cardiovascolare | Domande oculistiche | NON CONFORME | `vista offuscata` attiva oculistica invece di crisi ipertensiva sintomatica |
| CARDIO_05_SCOMPENSO_POSSIBILE | Cardiologia/scompenso | Domande piede/caviglia | NON CONFORME | `caviglie gonfie` scambia edema da scompenso per distretto caviglia |
| NEURO_01_CEFALEA_RICORRENTE_NON_URGENTE | Neurologia/cefalee | Domande sonno oppure cervicali nel caso manuale | NON CONFORME | `poco sonno` o `collo` prevalgono su cefalea; manca blocco cefalea |
| NEURO_02_CEFALEA_RED_FLAG_URGENTE | Emergenza neurologica | Domande oculistiche | NON CONFORME | Sintomi oculari/occhi prevalgono su cefalea red flag |
| NEURO_03_PARESTESIE_RICORRENTI_NON_URGENTI | Neurologia/parestesie | Domande oculistiche | NON CONFORME | `visione doppia` negata attiva oculistica |
| NEURO_04_SOSPETTO_ICTUS_FAST | Emergenza neurologica/stroke unit | Domande dentali | NON CONFORME | `bocca storta` attiva blocco dentale invece di FAST/stroke |
| NEURO_05_PRIMA_CRISI_CONVULSIVA_RISOLTA | Neurologia/epilettologia | Domande anca/gamba | NON CONFORME | Caduta/gambe deviano su ortopedia invece che prima crisi convulsiva |
| PSY_01_ATTACCHI_PANICO_NON_URGENTE | Psicologia/Psichiatria | Domande ORL | NON CONFORME | `nodo alla gola` attiva ORL; mancano domande ansia/panico |
| PSY_02_DEPRESSIONE_MODERATA_SENZA_IDEAZIONE_SUICIDARIA | Psicologia/Psichiatria | Fallback generico | PARZIALE | Nessun blocco depressione/umore dedicato |
| PSY_03_IDEAZIONE_SUICIDARIA_ATTIVA | Emergenza psichiatrica | Fallback generico | PARZIALE | Manca blocco sicurezza suicidaria strutturato; attenzione a non ritardare emergenza |
| PSY_04_ESORDIO_PSICOTICO_POSSIBILE | Psichiatria | Fallback generico | PARZIALE | Manca blocco psicosi/agitazione/rischio per sé o altri |
| PSY_05_DISTURBO_ALIMENTARE_POSSIBILE | Neuropsichiatria/Psichiatria/DCA | Domande cardiologiche | NON CONFORME | `non ho dolore al petto` attiva cardio; manca blocco DCA |
| ORTO_01_LOMBALGIA_MECCANICA_NON_URGENTE | Ortopedia/Fisiatria | Domande urologiche | NON CONFORME | `urinare` negato nel contesto red flag attiva urologia |
| ORTO_02_LOMBALGIA_CAUDA_EQUINA_RED_FLAG | Emergenza neuro-ortopedica | Domande urologiche | PARZIALE | Urinario è rilevante, ma domande LUTS non cauda equina/neuro-ortopediche |
| ORTO_03_TRAUMA_GINOCCHIO_SOSPETTA_LESIONE_LEGAMENTOSA | Ortopedia ginocchio | Domande dentali | NON CONFORME | Probabile falso match sottostringa `dent` in `evidente` |
| ORTO_04_SPALLA_CRONICA_CUFFIA_POSSIBILE | Ortopedia/Fisiatria spalla | Domande spalla | OK | Coerente |
| ORTO_05_TRAUMA_CAVIGLIA_FRATTURA_SOSPETTA_URGENTE | Ortopedia/trauma caviglia | Domande piede/caviglia | OK | Coerente, anche se dovrebbe esplicitare freddo/pallore/vascolare |
| DERM_01_NEO_SOSPETTO_MELANOMA | Dermatologia/dermatoscopia | Domande lesione/neo | OK | Coerente |
| DERM_02_DERMATITE_ECZEMA_NON_URGENTE | Dermatologia/eczema | Domande dermatologiche generiche lesione/neo | PARZIALE | Macro-derm corretta, ma non specifica per eczema/dermatite mani |
| DERM_03_CELLULITE_ERISIPELA_GAMBA | Dermatologia/Infettivologia urgente | Domande anca/gamba | NON CONFORME | `gamba` attiva ortopedia, mancano domande infezione cutanea/sistemiche |
| DERM_04_ORTICARIA_CON_ANAFILASSI | Emergenza allergologica | Domande ORL | NON CONFORME | `gola` attiva ORL; dovrebbe blocco anafilassi/112 |
| DERM_05_IMPETIGINE_PEDIATRICA_NON_URGENTE | Pediatria/Dermatologia | Domande ORL | NON CONFORME | `naso`/`bocca` attivano ORL prima di dermatologia pediatrica |

## Problemi metodologici rilevati

### 1. Priorità per sede anatomica prima della branca clinica

Il codice dà priorità a occhi, ORL, denti, dermatologia, urologia, cardio/pneumo, gastro e distretti ortopedici in ordine fisso. Questo produce domande di sede quando la sede è solo un sintomo associato o una red flag.

Esempio: in `CARDIO_02`, “mandibola” è una red flag cardiologica, non un problema odontoiatrico.

### 2. Mancata gestione delle negazioni

Le domande vengono scelte anche da sintomi esplicitamente negati.

Esempi:

- `non ho rigidità del collo` attiva collo/cervicale.
- `non ho visione doppia` attiva oculistica.
- `non ho problemi a urinare` attiva urologia.
- `non ho dolore al petto` attiva cardiologia.

### 3. Match per sottostringa troppo permissivo

Alcuni termini sono cercati come sottostringa libera. Il caso più evidente è `dent`, che può comparire dentro parole non odontoiatriche come `evidente`.

### 4. Mancano blocchi dedicati per branche validate

Non risultano blocchi anamnestici sufficientemente specifici per:

- cefalea/emicrania;
- FAST/ictus;
- crisi convulsiva/epilettologia;
- parestesie/neuropatia;
- ansia/panico;
- depressione;
- rischio suicidario;
- psicosi;
- DCA;
- scompenso cardiaco;
- crisi ipertensiva;
- cellulite/erisipela;
- anafilassi;
- impetigine pediatrica;
- eczema/dermatite mani.

### 5. Domande potenzialmente pericolose nei casi urgenti

Nei casi con emergenza già evidente, il secondo blocco dovrebbe essere evitato o sostituito da un output emergenza immediato. Fare domande dentali/oculistiche/ortopediche in:

- dolore toracico urgente;
- FAST/ictus;
- anafilassi;
- crisi ipertensiva sintomatica;
- rischio suicidario;

può dare all’utente una sensazione di flusso ordinario e ritardare l’azione urgente.

## Valutazione per branca

### Cardiologia

Stato domande: non sufficiente.

Funzionano le domande per dolore toracico da sforzo, ma falliscono quando compaiono red flag/anatomie associate:

- mandibola → denti;
- vista offuscata → occhi;
- caviglie gonfie → piede/caviglia.

Fix consigliato:

1. Blocchi cardiologici prima dei distretti anatomici se sono presenti petto, pressione, dispnea, edema, palpitazioni, infarto remoto o red flag cardiache.
2. Blocco specifico palpitazioni.
3. Blocco specifico scompenso: ortopnea, edema, peso, dispnea da sforzo.
4. Blocco emergenza crisi ipertensiva sintomatica.

### Neurologia

Stato domande: critico.

Tutti i 5 casi del batch neurologia ricevono domande non coerenti o non specialistiche. Il caso manuale conferma il problema: cefalea ricorrente può deviare verso sonno o cervicale per parole non centrali.

Fix consigliato:

1. Blocco cefalea prima di sonno/collo/occhi se sono presenti `mal di testa`, `cefalea`, `emicrania`.
2. Blocco FAST/ictus prima di denti/bocca.
3. Blocco parestesie/neuropatia che ignori negazioni come `non ho visione doppia`.
4. Blocco prima crisi convulsiva che non venga superato da `caduta`, `gambe`, `trauma`.

### Psicologia/Psichiatria

Stato domande: non sufficiente.

Il batch clinico è valido, ma il secondo blocco domande non ha una vera tassonomia psicologica/psichiatrica. Ansia/panico devia su ORL; DCA devia su cardio; depressione, suicidarietà e psicosi cadono su fallback.

Fix consigliato:

1. Blocco ansia/panico.
2. Blocco depressione/umore.
3. Blocco rischio suicidario con sicurezza immediata, evitando flusso ordinario se piano/mezzi/tempistica.
4. Blocco psicosi/agitazione/rischio per sé o altri.
5. Blocco DCA adolescenziale con indicatori fisici e sicurezza.

### Ortopedia

Stato domande: parziale.

Spalla e caviglia sono coerenti. Lombalgia e cauda equina deviano su urologia per presenza di urinare; ginocchio devia su dentale per match sottostringa.

Fix consigliato:

1. Per lombalgia, blocco rachide deve precedere urologia quando il problema principale è lombare.
2. Per cauda equina, usare blocco neuro-ortopedico dedicato, non LUTS generico.
3. Rendere `dent` match a parola o radice odontoiatrica controllata, non sottostringa libera.

### Dermatologia

Stato domande: non sufficiente.

Neo sospetto è coerente. Dermatite è solo parzialmente coerente. Cellulite devia su ortopedia/gamba; anafilassi e impetigine deviano su ORL.

Fix consigliato:

1. Blocco anafilassi deve precedere ORL e dermatologia ordinaria.
2. Blocco infezione cutanea/cellulite deve precedere distretto gamba.
3. Blocco dermatite/eczema mani distinto da neo/lesione pigmentata.
4. Blocco impetigine pediatrica/rash pediatrico distinto da ORL.

## Proposta di nuova metodologia

### Fase 1: normalizzare contesto prima delle keyword

Creare una funzione che rimuova o marchi i segmenti negati prima del routing:

- `non ho ...`
- `non ha ...`
- `assenza di ...`
- `senza ...`
- `nega ...`

I sintomi negati devono restare disponibili come red flag negative, ma non devono scegliere la branca delle domande.

### Fase 2: rilevare emergenze prima delle domande ordinarie

Se emergenza locale strutturata è già evidente, evitare domande ordinarie e produrre output emergenza.

Da prioritizzare:

- dolore toracico acuto con irradiazione/sudorazione/dispnea;
- FAST/ictus;
- crisi ipertensiva sintomatica;
- anafilassi;
- cauda equina;
- rischio suicidario attivo;
- saturazione bassa/dispnea severa;
- sanguinamento/melena con sintomi sistemici.

### Fase 3: scegliere il blocco per branca/specialità, non per parola isolata

Il routing dovrebbe assegnare un punteggio a ogni branca:

- parole chiave principali del disturbo;
- red flag positive;
- negazioni escluse dal punteggio;
- priorità clinica;
- età pediatrica/adolescenziale/adulto;
- contesto temporale.

Poi scegliere il blocco domande della branca con punteggio più alto.

### Fase 4: blocchi dedicati per branche già validate

Prima di nuovi batch, servono almeno questi blocchi:

- Cardiologia: dolore toracico; palpitazioni; scompenso; crisi ipertensiva.
- Neurologia: cefalea; FAST/ictus; parestesie/neuropatia; prima crisi convulsiva.
- Psicologia/Psichiatria: panico; depressione; suicidarietà; psicosi; DCA.
- Ortopedia: rachide/lombalgia; cauda equina; ginocchio; spalla; caviglia/frattura.
- Dermatologia: neo/lesione pigmentata; eczema/dermatite; cellulite; anafilassi; impetigine/rash pediatrico.

## Domande alternative consigliate

### Cefalea / Neurologia

1. Il mal di testa è iniziato all’improvviso ed è molto diverso o più intenso del solito?
2. Si associa a debolezza, difficoltà a parlare, confusione, febbre, rigidità del collo o trauma recente?
3. Durante gli episodi hai nausea, fastidio alla luce/rumori, disturbi visivi o necessità di stare al buio?

### Palpitazioni / Cardiologia

1. Gli episodi iniziano e finiscono improvvisamente o il battito resta irregolare a lungo?
2. Si associano a dolore toracico, svenimento, fiato corto marcato o capogiri importanti?
3. Sono legati a sforzo, caffeina, stress, febbre o farmaci/sostanze?

### Scompenso possibile / Cardiologia

1. Il fiato corto compare a riposo, di notte o solo sotto sforzo?
2. Hai gonfiore alle gambe/caviglie, aumento rapido di peso o necessità di dormire con più cuscini?
3. Ci sono dolore toracico attuale, saturazione bassa, confusione, svenimento o peggioramento rapido?

### Ansia/panico / Psicologia-Psichiatria

1. Gli episodi sono brevi e si risolvono da soli oppure persistono/peggiorano?
2. Ci sono dolore toracico persistente, svenimento, grave difficoltà respiratoria o confusione?
3. Ci sono pensieri di farsi del male, perdita di controllo o compromissione importante della vita quotidiana?

### Eczema/dermatite mani / Dermatologia

1. Le chiazze peggiorano con detergenti, guanti, lavoro manuale o sostanze specifiche?
2. Ci sono pus, febbre, dolore importante, gonfiore o rapido peggioramento?
3. Il problema è limitato alle mani o coinvolge altre aree, viso, labbra o respirazione?

## Raccomandazione CTO QA

Non procedere con la validazione di nuove branche finché il routing delle domande non viene corretto almeno per le 5 branche già validate.

Priorità fix:

1. Escludere le negazioni dal trigger delle domande.
2. Correggere match sottostringa pericolosi (`dent` dentro `evidente`).
3. Spostare emergenze locali prima dei blocchi ordinari.
4. Aggiungere blocchi dedicati per Cardiologia, Neurologia, Psicologia/Psichiatria, Ortopedia e Dermatologia.
5. Aggiungere test statici del routing domande per i 25 casi già validati.

Solo dopo questi fix ha senso riprendere Batch 06 Gastroenterologia.

