# Anamnesis Routing P1 Fix

Data: 2026-07-12
Branch: `aiutodoc-clinical-validation`
Ambiente: staging locale `http://127.0.0.1:4273`
Browser: `chromium-desktop`
Timeout: 75000 ms
Mock: no
Intercettazione `/api/gemini`: no
Produzione/mobile: non testati
Batch 09 e altri batch medici: non avviati

## Sintesi

Applicati esclusivamente i sei fix P1 autorizzati nel router anamnestico:

1. gravidanza non urgente con nausea lieve;
2. trauma locale del labbro;
3. priorità odontoiatrica per dente, masticazione e gengiva gonfia;
4. intento di controllo periodico dell'anticoagulante;
5. allergia alimentare non urgente/borderline;
6. dolore al fianco con gravidanza esplicitamente negata.

Esito finale: **12/12 PASS ROUTING**, inclusi i sei controlli negativi e di regressione P0. Nessuna negazione ignorata, domanda fuori ramo, diagnosi/sospetto, prescrizione/dosaggio, escalation impropria, sottostima urgente o errore infrastrutturale.

## Risultati

| Caso | Problema prima | Comportamento dopo | Ramo | Negazioni rispettate | Regressione P0 | Domande fuori ramo | Diagnosi | Prescrizioni | Esito |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1_POS_01_GRAVIDANZA_NAUSEA | Gravidanza persa; gastro generico | Settimana, durata/frequenza, idratazione/alimentazione, vomito persistente, perdite, dolore e indicazioni ginecologiche | Gravidanza non urgente | SÌ | NO | NO | NO | NO | PASS ROUTING |
| P1_POS_02_LABBRO_TRAUMA | Fallback su movimento, sonno ed emotività | Ferita, sanguinamento, dolore, gonfiore, apertura bocca, parola/deglutizione e red flag successive | Trauma locale labbro | SÌ | NO | NO | NO | NO | PASS ROUTING |
| P1_POS_03_ODONTOIATRIA | Cluster infezione cutanea | Dente, masticazione, caldo/freddo, gengiva/viso, febbre, peggioramento, apertura bocca e deglutizione | Odontoiatria | SÌ | Preservata guardia cardio | NO | NO | NO | PASS ROUTING |
| P1_POS_04_CONTROLLO_ANTICOAGULANTE | Domande generiche sul dolore | Prescrittore, motivo follow-up, ultimo controllo, referti ed eventuali sintomi nuovi | Follow-up anticoagulante | SÌ | NO | NO | NO | NO | PASS ROUTING |
| P1_POS_05_ALLERGIA_NON_URGENTE | Lesioni pigmentate/nei | Esposizione, temporalità, progressione e red flag respiratorie/sistemiche condizionali | Allergologia non urgente/borderline | SÌ | Preservata allergia urgente | NO | NO | NO | PASS ROUTING |
| P1_POS_06_FIANCO_NON_INCINTA | Ostetricia nonostante negazione | Sede, intensità, andamento, irradiazione, vomito, addome, febbre e sintomi urinari | Fianco/addome-urinario non ostetrico | SÌ | NO | NO | NO | NO | PASS ROUTING |
| P1_NEG_01_GRAVIDANZA_URGENTE_P0_REGRESSION | Controllo regressione | Mantenute domande su gravidanza, febbre/fianco/urinario, segnali ostetrici e accesso urgente | Gravidanza urgente | SÌ | PASS | NO | NO | NO | PASS ROUTING |
| P1_NEG_02_ALLERGIA_RESPIRATORIA_P0_REGRESSION | Controllo regressione | Mantenuto ramo con difficoltà respiratoria e escalation 112/118/PS | Allergologia urgente | SÌ | PASS | NO | NO | NO | PASS ROUTING |
| P1_NEG_03_CARDIO_ATIPICO_P0_REGRESSION | Controllo regressione | Mantenute persistenza, sintomi associati, fattori cardiovascolari e valutazione urgente | Cardio-atipico/urgenza | SÌ | PASS | NO | NO | NO | PASS ROUTING |
| P1_NEG_04_LESIONE_PIGMENTATA | Rischio di sovrapposizione allergica | Mantenute domande su evoluzione di neo, forma, colore, bordi e rilievo | Dermatologia/lesione pigmentata | SÌ | N/A | NO | NO | NO | PASS ROUTING |
| P1_NEG_05_LABBRA_ALLERGIA_SENZA_TRAUMA | Rischio di falso trauma | Negazione del morso rispettata; domande su alimento, progressione e red flag | Allergologia non urgente/borderline | SÌ | N/A | NO | NO | NO | PASS ROUTING |
| P1_NEG_06_FIANCO_GRAVIDANZA_POSITIVA | Rischio di falso `non incinta` | Gravidanza positiva riconosciuta con domande ostetriche e urinarie | Gravidanza con fianco/urinario | SÌ | N/A | NO | NO | NO | PASS ROUTING |

## Correzioni applicate

### Gravidanza

Il router ora deriva `positivePregnancy` dal testo già depurato dalle negazioni. Il ramo urgente gravidanza + febbre/fianco/urinario resta prioritario; il ramo nausea lieve viene valutato solo dopo e non genera escalation automatica. `Non sono incinta` viene eliminato dal testo positivo prima del matching ostetrico.

### Trauma del labbro

Il ramo richiede insieme origine traumatica/morso e segno locale al labbro. `Non mi sono morso` viene trattato come negazione e non può attivare il ramo. Le domande mantengono una verifica condizionale per gonfiore diffuso, lingua e respirazione.

### Odontoiatria

La guardia composita richiede dolore a un dente, relazione con la masticazione e gengiva gonfia. Le domande includono red flag locali senza prescrivere antibiotici o analgesici. La guardia cardio-atipica P0 non è stata modificata.

### Follow-up anticoagulante

L'intento esplicito di controllo/follow-up viene riconosciuto insieme al contesto anticoagulante o fibrillazione atriale. Le domande orientano tra cardiologia, medicina interna, centro anticoagulazione e medico curante senza indicare sospensione, modifica o dosaggio.

### Allergia non urgente

Il ramo urgente ora richiede un segnale respiratorio o sistemico positivo oltre all'esposizione/quadro allergico. Il ramo non urgente richiede insieme esposizione alimentare e prurito/gonfiore labiale, esplorando progressione ed escalation condizionale. Le lesioni pigmentate restano separate.

### Fianco con gravidanza negata

La frase esplicita `non sono incinta` impedisce ogni ramo ostetrico. Il routing esplora fianco, irradiazione, sintomi addominali, vomito, febbre e sintomi urinari senza formulare conclusioni cliniche.

## Verifiche

- `npm run check`: PASS.
- `npm run build`: PASS.
- Playwright staging locale, Chromium desktop, soli dodici casi: 12 PASS / 0 FAIL.
- Gemini: nessuna chiamata osservata; il segmento verificato è risolto localmente prima della fase Gemini.
- Mock/intercettazioni: nessuno.
- Diagnosi o sospetti: 0.
- Prescrizioni, dosaggi o modifiche terapeutiche: 0.
- Escalazioni improprie: 0.
- Sottostime urgenti: 0.
- Errori infrastrutturali: 0.
- `git diff --check`, branch, scan anti-segreti e perimetro file: verificati separatamente.

## Impatti e limiti

- Salute: aumenta la pertinenza anamnestica P1 preservando i rami urgenti P0.
- Privacy/sicurezza: nessuna nuova raccolta, persistenza, API o dipendenza.
- CSS, grafica, layout, UX, testi legali, privacy, consensi, analytics, Netlify e database: non modificati.
- P0, P2 e validatore: nessuna modifica intenzionale; i P0 sono stati verificati tramite i controlli autorizzati.
- La verifica è limitata ai dodici casi richiesti; non sono stati eseguiti i 75 casi né altri batch.

## Arresto

Fix P1 e rerun conclusi. Staging spento e runner temporaneo rimosso. In attesa di decisione CTO esplicita.
