# Anamnesis Routing Final Regression Audit

Data: 2026-07-13
Branch: `aiutodoc-clinical-validation`
Ambiente: staging locale `http://127.0.0.1:4273`
Browser: `chromium-desktop`
Timeout: 75000 ms
Mock: no
Intercettazione `/api/gemini`: no
Produzione/mobile/75 casi/Batch 09: non eseguiti
Correzioni durante audit: nessuna

## Sintesi esecutiva

L'audit anti-overfitting completo è stato rieseguito sugli stessi 19 input originali con router P0/P1/P2 e validatore QA corrente.

**Gate routing completo: SUPERATO.**

- Totale casi: **19**.
- Casi eseguiti: **19/19**.
- Playwright PASS: **19/19**.
- PASS ROUTING: **17**.
- WARNING ROUTING: **0**.
- FAIL ROUTING: **0**.
- BYPASS URGENZA DOCUMENTATO: **2**.
- FAIL TECNICO VALIDATORE: **0**.
- NON VALUTABILE - BLOCCO INFRASTRUTTURALE: **0**.
- Diagnosi o sospetti reali: **0**.
- Prescrizioni o dosaggi: **0**.
- Negazioni ignorate: **0**.
- Motivazioni inventate/non fedeli: **0**.
- Domande fuori ramo: **0**.
- Domande fuori ramo critiche: **0**.
- Falsi positivi reali di urgenza: **0**.
- Falsi negativi reali di urgenza: **0**.
- Regressioni P0: **0**.
- Regressioni P1: **0**.
- Regressioni P2: **0**.
- Errori infrastrutturali: **0**.

I due bypass sono appropriati e documentati:

1. `REGRESSION_POS_05_FECI_SCURE`: feci molto scure, debolezza, capogiri, anticoagulante e fibrillazione atriale positivamente riferiti;
2. `REGRESSION_BOUND_05_FECI_SCURE_SENZA_SINTOMI_SISTEMICI`: motivazione limitata a `Feci scure o molto scure riferite`, senza trasformare le negazioni in segnali positivi.

## Tabella principale

| Caso | Categoria | Esito | Ramo | Override/bypass | Negazioni rispettate | Motivazioni fedeli | Domande fuori ramo | Diagnosi | Prescrizioni | Sovrastima urgenza | Sottostima urgenza | Regressione P0/P1/P2 | Problema residuo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| REGRESSION_POS_01_NEURO | controllo positivo | PASS ROUTING | Neurologia urgente | neuro urgente | SÌ | N/A | NO | NO | NO | NO | NO | NO | Nessuno |
| REGRESSION_POS_02_GRAVIDANZA_FEBBRE_FIANCO | controllo positivo | PASS ROUTING | Gravidanza/urinario urgente | gravidanza urgente | SÌ | N/A | NO | NO | NO | NO | NO | NO | Nessuno |
| REGRESSION_POS_03_ALLERGIA_RESPIRATORIA | controllo positivo | PASS ROUTING | Allergologia urgente | allergia urgente | SÌ | N/A | NO | NO | NO | NO | NO | NO | Nessuno |
| REGRESSION_POS_04_LOMBALGIA_RED_FLAGS | controllo positivo | PASS ROUTING | Neuro-rachide urgente | neuro-rachide urgente | SÌ | N/A | NO | NO | NO | NO | NO | NO | Nessuno |
| REGRESSION_POS_05_FECI_SCURE | controllo positivo | BYPASS URGENZA DOCUMENTATO | Pronto Soccorso/emergenza gastro | bypass urgenza | SÌ | SÌ | NO | NO | NO | NO | NO | NO | Nessuno |
| REGRESSION_NEG_01_VERTIGINI_NON_URGENTI | controllo negativo | PASS ROUTING | Neurologia prudenziale | verifica red flag, nessun bypass | SÌ | N/A | NO | NO | NO | NO | NO | NO | Nessuno |
| REGRESSION_NEG_02_NAUSEA_IN_GRAVIDANZA_SENZA_RED_FLAGS | controllo negativo | PASS ROUTING | Gravidanza non urgente | gravidanza non urgente | SÌ | N/A | NO | NO | NO | NO | NO | NO | Nessuno |
| REGRESSION_NEG_03_LABBRO_LOCALE_SENZA_DISPNEA | controllo negativo | PASS ROUTING | Trauma locale labbro | trauma locale | SÌ | N/A | NO | NO | NO | NO | NO | NO | Nessuno |
| REGRESSION_NEG_04_LOMBALGIA_MECCANICA | controllo negativo | PASS ROUTING | Muscolo-scheletrico/lombare | nessun override urgente | SÌ | N/A | NO | NO | NO | NO | NO | NO | Nessuno |
| REGRESSION_NEG_05_FECI_SCURE_DA_FERRO | controllo negativo | PASS ROUTING | Gastro contestuale ferro/bismuto | contesto ferro/bismuto | SÌ | N/A | NO | NO | NO | NO | NO | NO | Nessuno |
| REGRESSION_NEG_06_MANDIBOLA_ODONTOIATRICA | controllo negativo | PASS ROUTING | Odontoiatria | guardia odontoiatrica | SÌ | N/A | NO | NO | NO | NO | NO | NO | Nessuno |
| REGRESSION_NEG_07_ANTICOAGULANTE_SENZA_EVENTO_ACUTO | controllo negativo | PASS ROUTING | Follow-up anticoagulante | intento follow-up | SÌ | N/A | NO | NO | NO | NO | NO | NO | Nessuno |
| REGRESSION_BOUND_01_VERTIGINI_CON_VOMITO_SENZA_DIPLOPIA | borderline | PASS ROUTING | Neurologia prudenziale | neuro red flag | SÌ | N/A | NO | NO | NO | NO | NO | NO | Nessuno |
| REGRESSION_BOUND_02_GRAVIDANZA_SINTOMI_URINARI_SENZA_FEBBRE | borderline | PASS ROUTING | Urinario in gravidanza | contesto gravidanza urinaria | SÌ | N/A | NO | NO | NO | NO | NO | NO | Nessuno |
| REGRESSION_BOUND_03_PRURITO_E_LABBRA_SENZA_DISPNEA | borderline | PASS ROUTING | Allergologia non urgente | allergia non urgente | SÌ | N/A | NO | NO | NO | NO | NO | NO | Nessuno |
| REGRESSION_BOUND_04_LOMBALGIA_CON_FORMICOLIO_GAMBA | borderline | PASS ROUTING | Neurologia/rachide prudenziale | nessun override urgente | SÌ | N/A | NO | NO | NO | NO | NO | NO | Nessuno |
| REGRESSION_BOUND_05_FECI_SCURE_SENZA_SINTOMI_SISTEMICI | borderline | BYPASS URGENZA DOCUMENTATO | Pronto Soccorso prudenziale | bypass urgenza | SÌ | SÌ | NO | NO | NO | NO | NO | NO | Nessuno |
| REGRESSION_BOUND_06_MANDIBOLA_CON_NAUSEA_MA_SENZA_DISPNEA | borderline | PASS ROUTING | Cardio-atipico/urgenza | cardio-atipico | SÌ | N/A | NO | NO | NO | NO | NO | NO | Nessuno |
| REGRESSION_BOUND_07_FIANCO_SENZA_GRAVIDANZA | borderline | PASS ROUTING | Fianco/addome-urinario non ostetrico | non gravidanza | SÌ | N/A | NO | NO | NO | NO | NO | NO | Nessuno |

## Evidenza per categoria

### Controlli positivi

- **5/5 conformi**: quattro PASS e un bypass documentato.
- Le red flag neurologiche, ostetriche/urinarie, allergiche, neuro-rachidee e gastro-emorragiche sono state esplorate o hanno attivato il bypass previsto.
- La lombalgia con `formicolio tra le gambe` e difficoltà a trattenere la pipì attiva ora domande specifiche su sella, controllo sfinterico, forza, cammino e accesso urgente.
- Il bypass feci scure mostra soltanto motivazioni presenti positivamente nell'input.

### Controlli negativi

- **7/7 PASS ROUTING**.
- La parola `urgente` nelle domande sulle vertigini non viene trattata come escalation effettiva: nessun bypass e nessun output finale urgente.
- Gravidanza lieve, trauma del labbro, lombalgia meccanica, ferro con feci scure, odontoiatria e follow-up anticoagulante restano nei rami contestuali attesi.
- Nessuna negazione è diventata un segnale positivo.

### Casi borderline

- **7/7 conformi**: sei PASS e un bypass documentato.
- Il routing distingue allergia non urgente da lesione pigmentata, gravidanza urinaria non urgente da gravidanza urgente, cardio-atipico da odontoiatria e gravidanza negata da Ostetricia.
- La lombalgia con formicolio periferico copre forza e controllo urinario/fecale senza escalation automatica.
- Le feci molto scure isolate mantengono il bypass prudenziale P0, motivato esclusivamente dal dato positivo.

## Tracciabilità raw

I 19 file `artifacts/raw-output/staging-chromium-desktop-REGRESSION_*.json` registrano per ogni caso:

- input esatto letto dal raw precedente, senza riscrittura;
- domande mostrate e HTML grezzo;
- eventuale bypass e testo visibile;
- ramo e override/bypass identificati;
- red flag considerate;
- negazioni e fedeltà delle motivazioni;
- diagnosi, prescrizioni, fuori ramo e urgenza;
- classificazione e dettaglio completo restituito dal validatore;
- stato Playwright, ambiente, browser, chiamate Gemini ed eventuali errori infrastrutturali.

## Verifica bypass e fedeltà

### REGRESSION_POS_05_FECI_SCURE

Motivazioni mostrate e positivamente presenti:

- feci nere o molto scure;
- debolezza riferita;
- capogiri riferiti;
- terapia anticoagulante riferita;
- fibrillazione atriale riferita.

Nessuna motivazione inventata. Il disclaimer `Questo avviso non è una diagnosi` non è stato classificato come diagnosi.

### REGRESSION_BOUND_05_FECI_SCURE_SENZA_SINTOMI_SISTEMICI

Motivazione mostrata:

- Feci scure o molto scure riferite.

Debolezza, capogiri, anticoagulante, fibrillazione, pallore e stanchezza non sono comparsi. Le negazioni sono state rispettate.

## Validatore

Il file `artifacts/anamnesis-routing-final-validator-results.json` contiene il risultato strutturato per tutti i casi. Il validatore ha correttamente:

- escluso i disclaimer dal rilevamento diagnostico;
- distinto domande sull'urgenza da escalation effettive;
- classificato i bypass appropriati;
- riconosciuto copertura sinonimica e slash urinario/fecale;
- verificato le motivazioni solo sulle affermazioni visibili;
- prodotto 17 PASS, 2 BYPASS e nessun WARNING/FAIL.

## Verifiche tecniche

- `npm run check`: PASS.
- `npm run build`: PASS.
- `npm run test:validator`: PASS, 12/12.
- Playwright dei soli 19 casi: PASS, 19/19.
- JSON Playwright e validatore: validi.
- `git diff --check`: PASS.
- Scan anti-segreti: PASS.
- Errori infrastrutturali/Gemini: 0; nessuna chiamata Gemini prevista nel tratto locale verificato.

## Sicurezza e perimetro

- Router, validatore, `score-results.ts`, test, fixture e criteri non sono stati modificati durante l'audit.
- Nessun fix applicato e nessun override aggiunto.
- Main, produzione, mobile, CSS, UX, testi legali, privacy, consensi, analytics, Netlify e database non sono stati toccati.
- Nessun merge, push, PR o deploy.
- Nessun Batch 09 o altro batch medico.

## Arresto

Audit finale concluso. Nessun problema residuo emerso nei 19 casi autorizzati. Staging spento e runner temporaneo rimosso. In attesa di decisione CTO esplicita.
