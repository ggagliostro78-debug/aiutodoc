# Git Safety Evidence

Data aggiornamento: 2026-07-12T21:21:51.093Z
Branch operativo: aiutodoc-clinical-validation
Task: Anamnesis Routing Regression Audit anti-overfitting

## Vincoli rispettati

- main intoccabile: si, nessun checkout/merge verso main
- merge: non eseguito
- push: non eseguito
- PR: non aperta
- deploy produzione: non eseguito
- produzione: non testata
- mock: non usati
- intercettazione /api/gemini: non usata
- browser: chromium-desktop
- mobile: non eseguito
- 75 casi: non eseguiti
- Batch 09: non avviato
- nuovi batch medici: non avviati
- correzioni router durante audit: nessuna
- CSS/grafica/layout/UX: non modificati
- documenti legali/database/Netlify/privacy/analytics/consensi: non modificati
- API key/segreti: non stampati ne salvati intenzionalmente

## Esito audit

- Totale casi: 19
- Playwright PASS: 19
- PASS ROUTING: 5
- WARNING ROUTING: 0
- FAIL ROUTING: 14
- BYPASS URGENZA DOCUMENTATO: 0
- NON VALUTABILE: 0
- Diagnosi/sospetti: 2
- Prescrizioni/dosaggi: 0
- Falsi positivi urgenza: 1
- Falsi negativi urgenza: 1
- Gate: NON SUPERATO

---

Data aggiornamento: 2026-07-12
Task: Anamnesis Routing Adjudication CTO/QA

## Perimetro adjudication

- Branch verificato: `aiutodoc-clinical-validation`
- Fonte primaria: 14 raw output dei casi originariamente classificati `FAIL ROUTING`
- Report creato: `reports/anamnesis-routing-adjudication.md`
- Router, validatore, test, fixture e criteri: non modificati
- Rerun dei 19 casi: non eseguito
- Script di analisi mutativi: non eseguiti
- Batch 09 e altri batch medici: non avviati
- Produzione, mobile, mock e intercettazione `/api/gemini`: non usati
- Merge, push, PR e deploy: non eseguiti
- Main: intoccato
- CSS, grafica, layout, UX, documenti legali, privacy, consensi, analytics, Netlify e database: non modificati
- API key o segreti: non stampati né salvati intenzionalmente

## Esito adjudication

- Failure prodotto confermati: 9/14
- TRUE FAIL critici: 3
- TRUE FAIL non critici: 6
- WARNING prodotto: 2
- PASS prodotto dopo revisione: 3
- Falsi positivi completi del validatore: 3
- Violazioni no-diagnosi reali: 0
- Falsi positivi lessicali no-diagnosi: 2
- Falsi positivi reali di urgenza: 0
- Falsi negativi reali di urgenza: 2
- Casi con negazioni realmente ignorate: 2
- Prescrizioni/dosaggi/terapie operative: 0
- Gate prodotto: NON SUPERATO

---

Data aggiornamento: 2026-07-12
Task: Anamnesis Routing P0 Fix

## Perimetro P0

- Branch operativo verificato: `aiutodoc-clinical-validation`
- Main: intoccato
- Fix applicati: solo lombalgia con red flag, feci scure negation-aware, cardio-atipico mandibola/nausea con fattori di rischio
- P1, P2 e validatore: non modificati
- Test eseguiti: solo i nove casi P0 autorizzati
- Ambiente: staging locale `http://127.0.0.1:4273`, Chromium desktop
- Mock e intercettazione `/api/gemini`: non usati
- Produzione, mobile, 75 casi, Batch 09 e nuovi batch medici: non eseguiti
- Merge, push, PR e deploy: non eseguiti
- CSS, grafica, layout, UX, documenti legali, privacy, consensi, analytics, Netlify e database: non modificati
- API key e segreti: non stampati né salvati intenzionalmente

## Esito P0

- Casi eseguiti: 9/9
- Playwright PASS: 9/9
- PASS ROUTING: 9/9
- Falsi negativi critici: 0
- Falsi positivi critici: 0
- Negazioni trasformate in segnali positivi: 0
- Motivazioni non fedeli all'input: 0
- Diagnosi/sospetti: 0
- Prescrizioni/dosaggi/terapie operative: 0
- Errori infrastrutturali: 0
- Gate P0: SUPERATO

---

Data aggiornamento: 2026-07-12
Task: Anamnesis Routing P1 Fix

## Perimetro P1

- Branch operativo verificato: `aiutodoc-clinical-validation`
- Main: intoccato
- Fix applicati: solo i sei P1 autorizzati
- P0: preservati e verificati nei controlli di regressione autorizzati
- P2 e validatore: non modificati
- Test eseguiti: solo i dodici casi P1 autorizzati
- Ambiente: staging locale `http://127.0.0.1:4273`, Chromium desktop
- Mock e intercettazione `/api/gemini`: non usati
- Produzione, mobile, 75 casi, Batch 09 e nuovi batch medici: non eseguiti
- Merge, push, PR e deploy: non eseguiti
- CSS, grafica, layout, UX, documenti legali, privacy, consensi, analytics, Netlify e database: non modificati
- API key e segreti: non stampati né salvati intenzionalmente

## Esito P1

- Casi eseguiti: 12/12
- Playwright PASS: 12/12
- PASS ROUTING: 12/12
- Positivi P1 PASS: 6/6
- Controlli negativi/regressione PASS: 6/6
- Regressioni P0: 0
- Negazioni ignorate: 0
- Domande fuori ramo: 0
- Diagnosi/sospetti: 0
- Prescrizioni/dosaggi/modifiche terapeutiche: 0
- Escalazioni improprie: 0
- Sottostime urgenti: 0
- Errori infrastrutturali: 0
- Gate P1: SUPERATO

---

Data aggiornamento: 2026-07-13
Task: Anamnesis Routing Validator Fix

## Perimetro validatore

- Branch verificato: `aiutodoc-clinical-validation`
- Main: intoccato
- Router, prompt clinici, output utente e `src/app_v3_standalone.js`: non modificati nel task
- Fix P0/P1: non modificati
- P2: non corretto
- `score-results.ts`: modifica preesistente letta e preservata, nessuna sovrascrittura
- Applicazione e casi clinici: non rilanciati
- Fixture: sanitizzate e basate anche su raw già acquisiti
- Mock e intercettazione `/api/gemini`: non usati
- Produzione, mobile, 75 casi, Batch 09 e nuovi batch medici: non eseguiti
- Merge, push, PR e deploy: non eseguiti
- CSS, UX, testi legali, privacy, consensi, analytics, Netlify e database: non modificati
- API key e segreti: non stampati né salvati intenzionalmente

## Esito validatore

- Test unitari fixture: 12/12 PASS
- Test tecnico preesistente su raw: 1/1 PASS
- Disclaimer no-diagnosi: falso positivo eliminato
- Diagnosi assertiva: rilevata
- Domanda sull'urgenza: nessuna escalation automatica
- Bypass appropriato: documentato, senza fuori ramo
- Motivazioni inventate/negate: rilevate come FAIL
- Copertura forza/urinario/fecale: riconosciuta
- PASS/WARNING/FAIL/BYPASS: distinti correttamente
- Gate validatore: SUPERATO

## Nota infrastrutturale

Un rerun intermedio ha incontrato `EADDRINUSE` sulla porta locale 4173 perché la configurazione Playwright tentava di avviare un server non necessario. Lo script `test:validator` è stato configurato per evitare l'avvio del web server. Il rerun finale è terminato con 12/12 PASS senza testare l'applicazione o la produzione.

---

Data aggiornamento: 2026-07-13
Task: Anamnesis Routing P2 Fix

## Perimetro P2

- Branch verificato: `aiutodoc-clinical-validation`
- Main: intoccato
- Fix: solo feci scure associate a ferro/bismuto e sintomi urinari in gravidanza senza red flag
- P0/P1, validatore e `score-results.ts`: non modificati
- Audit completo 19 casi, 75 casi, Batch 09 e altri batch medici: non eseguiti
- Ambiente: staging locale 127.0.0.1:4273, Chromium desktop
- Mock e intercettazione `/api/gemini`: non usati
- Produzione e mobile: non testati
- Merge, push, PR e deploy: non eseguiti
- CSS, UX, documenti legali, privacy, consensi, analytics, Netlify e database: non modificati
- API key e segreti: non stampati né salvati intenzionalmente

## Esito P2

- Casi completati: 10/10
- Playwright tecnico: 10/10 PASS
- PASS ROUTING: 8
- BYPASS URGENZA DOCUMENTATO: 2
- FAIL/WARNING/NON VALUTABILE: 0
- Positivi P2: 2/2 PASS
- Controlli negativi: 3 PASS + 1 bypass P0 appropriato e documentato
- Regressioni P0/P1: 0
- Negazioni ignorate: 0
- Domande fuori ramo: 0
- Diagnosi/sospetti: 0
- Prescrizioni/dosaggi: 0
- Motivazioni inventate: 0
- Escalazioni improprie o sottostime urgenti: 0
- Errori infrastrutturali: 0
- Gate P2: SUPERATO con classificazione esplicita dei bypass P0

---

Data aggiornamento: 2026-07-13
Task: Anamnesis Routing Final Regression Audit

## Perimetro audit finale

- Branch verificato: `aiutodoc-clinical-validation`
- Main: intoccato
- Router, validatore, `score-results.ts`, test, fixture e criteri: non modificati
- Fix durante audit: nessuno
- Input: gli stessi 19 input originali, letti direttamente dai raw precedenti
- Ambiente: staging locale 127.0.0.1:4273, Chromium desktop
- Mock e intercettazione `/api/gemini`: non usati
- Produzione, mobile, 75 casi, Batch 09 e altri batch medici: non eseguiti
- Merge, push, PR e deploy: non eseguiti
- CSS, UX, documenti legali, privacy, consensi, analytics, Netlify e database: non modificati
- API key e segreti: non stampati né salvati intenzionalmente

## Esito audit finale

- Casi eseguiti: 19/19
- Playwright PASS: 19/19
- PASS ROUTING: 17
- BYPASS URGENZA DOCUMENTATO: 2
- WARNING ROUTING: 0
- FAIL ROUTING: 0
- FAIL TECNICO VALIDATORE: 0
- NON VALUTABILE: 0
- Diagnosi/sospetti: 0
- Prescrizioni/dosaggi: 0
- Negazioni ignorate: 0
- Motivazioni inventate: 0
- Domande fuori ramo: 0
- Falsi positivi/falsi negativi di urgenza: 0/0
- Regressioni P0/P1/P2: 0
- Errori infrastrutturali: 0
- Gate routing completo: SUPERATO

---

Data aggiornamento: 2026-07-13
Task: Cycle 01 rapido risk-based - Endocrinologia, Ginecologia, Otorinolaringoiatria

## Vincoli rispettati

- Branch: `aiutodoc-clinical-validation`; main intoccato
- Router, validatore, `score-results.ts`, test e fixture esistenti: non modificati
- Fix durante audit: nessuno
- Casi: solo i 18 autorizzati, input invariati
- Staging locale, Chromium desktop, Gemini reale; nessun mock/intercettazione
- Produzione, mobile, 75 casi, batch successivi e deploy: non eseguiti
- Merge, push e PR: non eseguiti
- CSS, UX, testi legali, privacy, consensi, analytics, Netlify e database: non modificati
- Segreti/API key: non stampati né salvati intenzionalmente

## Esito ciclo 01

- Casi eseguiti: 18/18
- Playwright PASS: 18/18
- PASS CLINICO-FUNZIONALE: 5
- WARNING: 5
- FAIL CLINICO-FUNZIONALE: 8
- BYPASS/NON VALUTABILI/FAIL TECNICO: 0
- Diagnosi/sospetti: 0
- Prescrizioni/dosaggi: 0
- Errori infrastrutturali: 0
- Gate Endocrinologia: NON SUPERATO
- Gate Ginecologia: NON SUPERATO
- Gate Otorinolaringoiatria: NON SUPERATO
- Gate ciclo: NON SUPERATO
# Cycle 01 fix rerun - evidenze 2026-07-13

- Branch verificato: `aiutodoc-clinical-validation`; `main` non usato ne modificato.
- Nessun merge, push, PR, deploy o test di produzione.
- Nessuna modifica a validatore, `score-results.ts`, CSS/UX, documenti legali, privacy, consensi, analytics, Netlify o database.
- Codice applicativo modificato nel solo router anamnestico di `src/app_v3_standalone.js`.
- Verifiche pre-rerun: `npm run check` PASS, `npm run build` PASS, `npm run test:validator` 12/12 PASS.
- Rerun: 16 casi unici avviati su staging locale/Chromium desktop/Gemini reale; 14 PASS Playwright e 2 timeout.
- Il retry automatico staging di `ENDO_05` e stato arrestato appena rilevato e non completato; nessun caso e stato rilanciato.
- La segnalazione preesistente di trailing whitespace in `reports/clinical-functional-report.md` non e stata corretta perche fuori perimetro.
- Staging arrestato al termine e runner temporanei rimossi.
# Cycle 01 final microfix - evidenze 2026-07-14

- Branch verificato: `aiutodoc-clinical-validation`; `main` intoccato.
- Nessun merge, push, PR, deploy, produzione, mobile, Ciclo 02 o altro batch.
- Modificato esclusivamente `src/app_v3_standalone.js` per tre override finali contestuali.
- Validatore e `score-results.ts` non modificati nel micro-fix.
- Nessuna modifica a CSS/UX, privacy, consensi, analytics, Netlify o database.
- `npm run check` PASS; `npm run build` PASS; `npm run test:validator` 12/12 PASS.
- Rerun: 8 casi unici, Chromium desktop, Gemini reale, nessun mock/intercettazione, timeout 75000 ms, retry 0.
- Risultato Playwright: 6 PASS, 2 timeout (`ENDO_05`, `GINE_05`). Nessun rilancio.
- La segnalazione preesistente dei due trailing whitespace in `reports/clinical-functional-report.md` resta documentata e non corretta.
- Staging arrestato e runner temporanei rimossi al termine.
# Cycle 01 closure - evidenze 2026-07-14

- Branch verificato: `aiutodoc-clinical-validation`; `main` non usato o modificato.
- Nessun merge, push, PR, deploy, produzione, mobile, Ciclo 02 o altro batch.
- Root cause corretta esclusivamente in `src/app_v3_standalone.js`: normalizzazione accent-insensitive del matcher semantico per sanguinamento mestruale abbondante ricorrente.
- Validatore e `score-results.ts` invariati rispetto al baseline del ciclo.
- Nessuna modifica a CSS, layout, UX, privacy, consensi, analytics, Netlify, database o documenti legali.
- `npm run check` PASS; `npm run build` PASS; `npm run test:validator` 12/12 PASS.
- Rerun autorizzato: quattro casi unici. `GINE_02` e `GINE_04` Playwright PASS.
- `ENDO_05` e `GINE_05`: tentativo ordinario e unico retry tecnico entrambi in timeout a 75000 ms; raw separati conservati.
- La segnalazione preesistente dei due trailing whitespace in `reports/clinical-functional-report.md` resta documentata e non corretta.
- Staging arrestato e runner temporanei rimossi al termine.
# Cycle 01 infrastructure closure - evidenze 2026-07-15

- Task esclusivamente tecnico: nessun codice, router, validatore, scoring, test permanente, fixture, input o criterio modificato.
- Branch verificato: `aiutodoc-clinical-validation`; `main` intoccato.
- Nessun merge, push, PR, deploy, produzione, mobile o Ciclo 02.
- Hash iniziali e finali verificati per `src/app_v3_standalone.js`, validatore e `score-results.ts`.
- Ambiente iniziale pulito: porta 4273 libera; nessun staging, Playwright o Chromium Playwright residuo; circa 2883 MB disponibili.
- Un solo staging locale avviato; home raggiungibile con HTTP 200.
- `npm run check` PASS; `npm run build` PASS; validatore 12/12 PASS.
- `ENDO_05` e `GINE_05`: un tentativo ordinario e un retry tecnico ciascuno; tutti in timeout standard a 150000 ms senza risposta `/api/gemini` registrata.
- Quattro raw separati dei tentativi conservati; nessun ulteriore retry.
- I due trailing whitespace preesistenti in `reports/clinical-functional-report.md` restano documentati e non corretti.
- Staging arrestato, processi Chromium Playwright terminati e runner temporaneo rimosso al termine.

# Cycle 01 timeout root cause analysis - evidenze 2026-07-15

- Task esclusivamente diagnostico sul branch `aiutodoc-clinical-validation`; `main` intoccato.
- Nessun fix applicato e nessuna modifica permanente a codice applicativo, router, validatore, `score-results.ts`, test, fixture, input o criteri.
- Nessun merge, push, PR, deploy, produzione, mobile o Ciclo 02.
- Baseline SHA-256 acquisita per applicazione, proxy, server locale, validatore e scoring; verifica finale obbligatoria dopo la rimozione della strumentazione.
- Configurazione Gemini verificata solo come presenza; valore della chiave non letto, stampato o salvato. Fallback locale disabilitato.
- DNS e TCP 443 verso l'endpoint Google disponibili; staging locale raggiungibile HTTP 200.
- `npm run check` PASS; `npm run build` PASS; `npm run test:validator` 12/12 PASS.
- Eseguiti esattamente quattro casi autorizzati, in serie, Chromium desktop, Gemini reale, zero retry e nessuna intercettazione.
- `ENDO_05`, `GINE_05`, `ENDO_04` e `GINE_04`: una richiesta ciascuno, proxy raggiunto, Gemini invocato, HTTP 200 e UI aggiornata.
- Classificazione: `BLOCCO ESTERNO NON RIPRODUCIBILE`; nessun problema dichiarato risolto.
- Tracce aggregate sanitizzate: contenuti sanitari oscurati, query string upstream esclusa, nessun cookie/token/segreto registrato.
- Il 502 specialist-search da quota SerpApi è successivo a Gemini, comune ai quattro casi e gestito dal fallback; non è la causa dei timeout in esame.
- I due trailing whitespace preesistenti in `reports/clinical-functional-report.md` restano fuori perimetro e non vengono corretti.
- Verifica finale: hash di `src/app_v3_standalone.js`, `server/gemini_proxy.js`, `scripts/dev-local.js`, validatore e `score-results.ts` identici al baseline iniziale.
- Tutti i sette JSON richiesti validi; scan anti-segreti sui nove output senza occorrenze.
- Staging arrestato, porta 4273 libera, nessun processo Playwright/Chromium/Node diagnostico residuo.
- Wrapper server, runner Playwright e log NDJSON temporaneo rimossi.

# Cycle 01 closure rerun - evidenze 2026-07-15

- Branch verificato: `aiutodoc-clinical-validation`; `main` intoccato.
- Task limitato a `ENDO_05_NEGATIVO_FAME_POST_ALLENAMENTO` e `GINE_05_NEGATIVO_RITARDO_CICLO`.
- Nessuna modifica a codice applicativo, router, validatore, `score-results.ts`, fixture, input o criteri.
- Nessun merge, push, PR, deploy, produzione, mobile o Ciclo 02.
- Staging locale avviato una sola volta; home HTTP 200; Chromium desktop e Gemini reale senza mock o intercettazione.
- `npm run check` PASS; `npm run build` PASS; `npm run test:validator` 12/12 PASS.
- Entrambi i casi Playwright PASS e PASS CLINICO-FUNZIONALE al primo tentativo; retry 0.
- Gemini HTTP 200 per entrambi; diagnosi/sospetti, prescrizioni, dosaggi, terapie operative, negazioni ignorate e domande critiche fuori ramo: 0.
- Warning non bloccante comune: specialist-search HTTP 502 per quota SerpApi esaurita; output clinico regolarmente prodotto.
- Per il criterio letterale `errori infrastrutturali finali = 0`, il gate rigoroso resta non soddisfatto e richiede decisione CTO.
- Hash finali di applicazione, validatore e `score-results.ts` identici al baseline; scan anti-segreti senza occorrenze.
- Staging arrestato, porta 4273 libera, nessun processo Playwright/Chromium/Node residuo e runner temporaneo rimosso.
- `git diff --check` segnala soltanto due trailing whitespace preesistenti in `reports/clinical-functional-report.md`, non modificati perché fuori perimetro.

# Ciclo 02 risk-based audit - evidenze 2026-07-15

- Branch verificato: `aiutodoc-clinical-validation`; `main` intoccato.
- Eseguiti esclusivamente i 18 casi autorizzati di Gastroenterologia, Neurologia e Pneumologia.
- Nessuna modifica a `src/app_v3_standalone.js`, proxy Gemini, specialist-search, server locale, validatore, `score-results.ts`, test/fixture permanenti, CSS/UX, privacy, consensi, analytics, Netlify, database o documenti legali.
- Nessun fix applicato durante l'audit; nessun Ciclo 03.
- Nessun merge, push, PR, deploy, produzione o mobile.
- Staging locale HTTP 200; Chromium desktop; Gemini reale; nessun mock clinico e nessuna intercettazione `/api/gemini`.
- Non esiste una configurazione applicativa per disabilitare soltanto specialist-search; SerpApi è rimasta reale e invariata.
- `npm run check` PASS; `npm run build` PASS; `npm run test:validator` 12/12 PASS.
- Playwright: 18/18 PASS, zero retry; 18/18 casi clinicamente valutabili.
- Adjudicazione: 3 PASS CLINICO-FUNZIONALI, 6 WARNING, 8 FAIL CLINICO-FUNZIONALI, 1 BYPASS URGENZA DOCUMENTATO.
- Gate Gastroenterologia, Neurologia, Pneumologia e Ciclo 02: NON SUPERATI.
- Diagnosi/sospetti: 0; prescrizioni/dosaggi: 0; casi non valutabili: 0.
- Warning `WARNING INFRASTRUTTURALE NON BLOCCANTE - SERPAPI`: 16, esclusi dal gate clinico.
- Hash finali di applicazione, proxy Gemini, specialist-search, server locale, validatore e scoring identici al baseline iniziale.
- Tutti i 20 JSON validi; 18 raw presenti; scan anti-segreti senza occorrenze.
- Staging arrestato, porta 4273 libera, nessun processo Playwright/Chromium/Node residuo e runner temporaneo rimosso.

# Ciclo 02 fix rerun - evidenze 2026-07-16

- Branch verificato: `aiutodoc-clinical-validation`; `main` non usato o modificato.
- Modifica applicativa circoscritta a `src/app_v3_standalone.js`: precedenze di urgenza, routing anamnestico contestuale e fedelta al sangue rosso con anticoagulante.
- Validatore e `score-results.ts` non modificati in questo task; nessuna modifica a CSS/UX, privacy, consensi, analytics, Netlify, database o documenti legali.
- Nessun merge, push, PR, deploy, produzione, mobile o Ciclo 03.
- Validazione JSON finale: 5/5 artefatti validi, inclusi tre raw completi.
- `NEURO_01`: Gemini 0 e domande 0; `NEURO_04` e `NEURO_06`: Gemini reale HTTP 200.
- `git diff --check` sui file del task PASS; il controllo globale conserva soltanto due trailing whitespace preesistenti in `reports/clinical-functional-report.md`.
- Scan anti-segreti senza occorrenze; staging arrestato, porta 4273 libera, runner temporanei rimossi e nessun Chromium Playwright residuo.
- `npm run check` PASS; `npm run build` PASS; `npm run test:validator` 12/12 PASS.
- Staging locale HTTP 200; Chromium desktop; Gemini reale; nessun mock e nessuna intercettazione `/api/gemini`.
- Rerun autorizzato: 17 casi; output finali valutabili 17/17 e Playwright finale 17/17 PASS.
- Recupero tecnico: 7 casi inizialmente bloccati prima di Gemini da un errore del runner sul placeholder accentato `eta`; nessuna modifica al prodotto tra tentativo e recupero; recupero 7/7 PASS.
- Adjudicazione finale: 15 PASS, 1 WARNING (`NEURO_04`), 1 FAIL P0 (`NEURO_01`); gate complessivo NON SUPERATO.
- Diagnosi/sospetti, prescrizioni/dosaggi, negazioni ignorate e domande fuori ramo critiche: 0.
- Warning SerpApi non bloccanti: 15, esclusi dal gate clinico.
- Nessun ulteriore fix applicato dopo il rerun, come richiesto.
- Validazione JSON: 19/19 file validi (17 raw e 2 aggregati); scan anti-segreti senza occorrenze.
- Hash di validatore e `score-results.ts` invariati rispetto al baseline del Ciclo 02.
- `git diff --check` segnala soltanto i due trailing whitespace preesistenti in `reports/clinical-functional-report.md`, lasciati fuori perimetro.
- Runner e aggregatore temporanei rimossi; staging arrestato; porta 4273 libera; nessun Chromium Playwright residuo.

# Ciclo 02 final closure - evidenze 2026-07-16

- Branch verificato: `aiutodoc-clinical-validation`; `main` intoccato.
- Fix circoscritto a `src/app_v3_standalone.js` per varianti linguistiche del deficit del linguaggio e routing vestibolare/ORL.
- Validatore, `score-results.ts`, CSS/UX, privacy, consensi, analytics, Netlify, database e documenti legali non modificati in questo task.
- `npm run check` PASS; `npm run build` PASS; `npm run test:validator` 12/12 PASS.
- Eseguiti esclusivamente i cinque casi autorizzati, Chromium desktop, zero retry.
- Gemini reale e non intercettato: non chiamato nei due bypass; HTTP 200 nei tre percorsi ordinari.
- `RICERCA SPECIALISTI NON ESEGUITA PER SCELTA METODOLOGICA`; chiamate esterne di ricerca specialisti: 0.
- Cinque raw completi e clinicamente valutabili; esito clinico 5/5 conforme.
- Playwright: 2 PASS, 3 FAIL tecnici; gate tecnico e chiusura Ciclo 02 NON SUPERATI.
- Nessun ulteriore fix applicato dopo il rerun; Ciclo 03 non avviato.
- Validazione JSON: 7/7 file validi, inclusi cinque raw completi.
- Hash del validatore e di `score-results.ts` invariati rispetto al baseline; scan anti-segreti senza occorrenze.
- `git diff --check` sui file del task PASS; il controllo globale segnala soltanto due trailing whitespace preesistenti in `reports/clinical-functional-report.md`.
- Runner temporaneo rimosso; staging arrestato; porta 4273 libera; nessun Chromium Playwright residuo.

# Ciclo 02 technical closure - evidenze 2026-07-16

- Branch verificato: `aiutodoc-clinical-validation`; `main` intoccato.
- Nessun file di prodotto, router, prompt, post-processing, validatore o scoring modificato in questo task.
- Hash iniziali e finali identici per applicazione, proxy Gemini, specialist-search, server locale, validatore e `score-results.ts`.
- `npm run check` PASS; `npm run build` PASS; `npm run test:validator` 12/12 PASS.
- Rerun limitato a `NEURO_01`, `NEURO_04` e `NEURO_06`, Chromium desktop, Gemini reale, nessuna intercettazione `/api/gemini`.
- `NEURO_04`: un solo retry tecnico autorizzato per timeout `browser.close`; nessuna modifica del prodotto tra i tentativi.
- Playwright finale 3/3 PASS; raw completi 3/3; teardown completato.
- `RICERCA SPECIALISTI NON ESEGUITA PER SCELTA METODOLOGICA`; chiamate esterne a ricerca specialisti, places ed enrichment: 0.
- Nessun merge, push, PR, deploy, produzione, mobile o Ciclo 03.
- `git diff --check` segnala soltanto due trailing whitespace preesistenti in `reports/clinical-functional-report.md`, non corretti perché fuori perimetro.
# Ciclo 03 - evidenza finale (2026-07-16)

- Branch verificato: `aiutodoc-clinical-validation`; `main` non modificato.
- Hash iniziali/finali dei file protetti: identici.
- `npm run check`: PASS.
- `npm run build`: PASS.
- `npm run test:validator`: 12/12 PASS.
- Nuovi raw Ciclo 03: 18; raw precedenti conservati: 10.
- JSON validati: manifest, risultati Playwright, risultati Ciclo 03 e 18 raw (21/21 validi).
- Ricerca specialisti esterna: 0 chiamate; route neutralizzate soltanto nel runner temporaneo.
- Scan anti-segreti su report e artefatti: 0 corrispondenze.
- `git diff --check`: segnala esclusivamente due spazi finali preesistenti in `reports/clinical-functional-report.md` righe 18-19, file non modificato dal Ciclo 03.
- Nessun merge, push, PR, deploy, test produzione o Ciclo 04.

# Ciclo 03 fix rerun - evidenze 2026-07-16

- Branch verificato: `aiutodoc-clinical-validation`; main intoccato.
- Modifica applicativa circoscritta a `src/app_v3_standalone.js`: matcher P0, routing anamnestico e post-processing dei soli contesti Ciclo 03.
- Hash applicazione prima del fix (baseline audit Ciclo 03): `6F5499D1C9D089BFE2536E88A6A4C4C8A1D41F34A259F5CB1F0D780644D28609`; dopo il fix: `CD68C9E7BD30848C6F9A3E3177FD5A74DC5CD83D9139BDD86E88CF63816FC542`.
- Validatore invariato: `3A52BB7495211098145FA55FDFFAD4A2DBC7F31B5A2C338BF138CA052151BD5A`; score-results invariato: `6473C81BDC29FED91CB5DC30F2C398CADA353C82599273EA8297483FE6A5D13A`.
- `npm run check` PASS; `npm run build` PASS; `npm run test:validator` 12/12 PASS.
- Rerun autorizzato: 16 casi tentati; Playwright 15 PASS e 1 FAIL infrastrutturale; 15 raw completi piu un raw tecnico.
- Bypass P0 3/3, Gemini non chiamato; 12 percorsi ordinari valutabili con Gemini HTTP 200.
- RICERCA SPECIALISTI NON ESEGUITA PER SCELTA METODOLOGICA; chiamate esterne: 0.
- Diagnosi/sospetti, prescrizioni/dosaggi, modifiche terapeutiche, negazioni ignorate e domande critiche fuori ramo: 0 nei casi valutabili.
- Nessun ulteriore fix dopo il rerun; Ciclo 04 non avviato.
- JSON finali validi: 18/18 (due aggregati e 16 raw); scan anti-segreti: 0 corrispondenze.
- `git diff --check` segnala soltanto i due trailing whitespace preesistenti in `reports/clinical-functional-report.md`, lasciati fuori perimetro.
- Runner temporanei rimossi; staging arrestato; porta 4273 libera; nessun processo Chromium, Playwright o Node del workspace residuo.

# Ciclo 03 technical closure PED_02 - evidenze 2026-07-16

- Branch verificato: `aiutodoc-clinical-validation`; main intoccato.
- Nessun file di prodotto, router, matcher, prompt, post-processing, validatore, scoring, CSS/UX, privacy, consensi, analytics, Netlify, database o documenti legali modificato.
- Hash iniziali e finali identici per 8/8 file protetti.
- `npm run check` PASS; `npm run build` PASS; `npm run test:validator` 12/12 PASS.
- Eseguito soltanto `PED_02_FEBBRE_BAMBINO_PROGRAMMATA`: tentativo ordinario FAIL runner e unico retry autorizzato FAIL runner.
- Nel retry il valore eta `7` e stato inserito e confermato, ma lo stato del flusso non e avanzato entro il timeout tecnico.
- Gemini reale non intercettato ma non raggiunto; ricerca specialisti esterna: 0 chiamate.
- Nessun ulteriore retry, nessun fix clinico e nessun Ciclo 04.
- JSON finali validi: 6/6; scan anti-segreti: 0 corrispondenze.
- `git diff --check` segnala soltanto due trailing whitespace preesistenti in `reports/clinical-functional-report.md`, non modificati nel task.
- Runner temporaneo rimosso; staging arrestato; porta 4273 libera; nessun processo Chromium, Playwright o Node del workspace residuo.

# PED_02 root cause diagnostica - evidenze 2026-07-16

- Branch verificato: `aiutodoc-clinical-validation`; main intoccato.
- Task esclusivamente diagnostico; nessun file di prodotto, routing, matcher, prompt, post-processing, validatore o scoring modificato.
- Quattro sessioni autorizzate, Metodi A/B/C/D: 4/4 PASS diagnostici.
- In tutti i metodi `exact_age=7` e `currentConditionalDetail` avanza a `weight_kg`; lo stato generale resta correttamente `5C_DETTAGLIO_CONDIZIONATO`.
- Root cause: ERRORE RUNNER, dovuto all'asserzione errata che richiedeva l'uscita immediata dallo stato generale `5C`.
- Gemini: 0 richieste; ricerca specialisti, places ed enrichment: 0 chiamate esterne.
- `npm run check` PASS; `npm run build` PASS; `npm run test:validator` 12/12 PASS.
- Nessun fix applicato, nessun rerun clinico e nessun Ciclo 04.
- Hash iniziali/finali dei 10 file protetti: 10/10 identici; JSON diagnostici: 3/3 validi; scan anti-segreti: 0 corrispondenze.
- `git diff --check` conserva soltanto due trailing whitespace preesistenti in `reports/clinical-functional-report.md`, fuori perimetro.
- Runner e strumentazione temporanei rimossi; staging arrestato; porta 4273 libera; nessun processo Chromium, Playwright o Node del workspace residuo.

# Ciclo 03 final rerun PED_02 - evidenze 2026-07-16

- Branch verificato: `aiutodoc-clinical-validation`; `main` non testato e non modificato.
- Nessun file di prodotto, router, matcher, prompt, post-processing, validatore, scoring, UI, privacy, consensi, analytics, Netlify, database o documento legale modificato.
- `npm run check` PASS; `npm run build` PASS; validatore Playwright 12/12 PASS.
- Eseguito esclusivamente `PED_02_FEBBRE_BAMBINO_PROGRAMMATA`, un tentativo ordinario e zero retry.
- Raw completo salvato; Gemini reale e non intercettato HTTP 200; ricerca specialisti esterna 0 chiamate.
- Esito clinico-funzionale PASS; Playwright FAIL tecnico per asserzione letterale `durata` nonostante la domanda equivalente `Da quanto dura la febbre`.
- Nessun retry eseguito poiche il falso negativo lessicale non rientra nelle condizioni autorizzate.
- Runner temporaneo rimosso; nessun Ciclo 04, merge, push, PR, deploy, produzione o mobile.
- Hash iniziali/finali dei 10 file protetti: 10/10 identici.

## Integrazione autorizzata al rerun finale

- Su istruzione successiva dell'utente e stata corretta esclusivamente l'asserzione lessicale del runner temporaneo: `durata|quanto dura`.
- Il prodotto e i 10 file protetti sono rimasti invariati.
- Nuova esecuzione limitata al solo `PED_02`: Playwright 1/1 PASS; esito clinico-funzionale PASS.
- Gemini reale e non intercettato HTTP 200; ricerca specialisti esterna 0 chiamate.
- Pediatria gate SUPERATO 6/6; Ciclo 03 SUPERATO E CHIUSO.
- Runner temporaneo rimosso; `main` non testato e non modificato; Ciclo 04 non avviato.
- Artefatti JSON richiesti validi 5/5; scan anti-segreti sui file del task: 0 occorrenze.
- Staging arrestato; porta 4273 libera; nessun processo Chromium, Playwright o Node del workspace residuo.
- `git diff --check` conserva soltanto i due trailing whitespace preesistenti in `reports/clinical-functional-report.md` righe 18-19, fuori perimetro.

# Audit consolidato pre-main - evidenze 2026-07-17

- Branch verificato: `aiutodoc-clinical-validation` @ `f5b58abffa615ab04ec0a6acf83392e08e7fc52b`.
- `main` verificato in sola lettura @ `f776bae225406bd05df9bbb95828ebefe0e16e81`; merge-base identico a `main`; 20 commit solo clinico, 0 solo main; merge-tree senza conflitti testuali.
- Working tree già sporco prima dell'audit: 11 file tracciati modificati, inclusi tre file prodotto protetti, e 571 file non tracciati. Nessun file preesistente è stato ripristinato o sovrascritto intenzionalmente.
- Baseline hash: `artifacts/consolidated-audit-baseline.json`.
- Dipendenze suite installate con lockfile: `npm ci --ignore-scripts`, 0 vulnerabilità riportate.
- `npm run check` PASS; `npm run build` PASS; `npm run test:validator` 12/12 PASS.
- JSON: 317 validi; BOM storici 10; manifest e riferimenti: 99 report, 236 raw, 162 case ID e 162 reference raw unici, 0 riferimenti mancanti, 0 link consolidati rotti.
- Scan anti-segreti su file tracciati e `dist`: 0 file con corrispondenze; `.env` assente da `dist`.
- `git diff --check`: solo due trailing whitespace preesistenti nel report clinico; non corretti.
- Desktop finale: 40/40 PASS; mobile clinico-funzionale: 22/22 PASS; UX mobile: FAIL chiusura menu su 4/4 viewport.
- Ricerca specialisti esterna: 0; Gemini reale; nessun mock o intercettazione `/api/gemini`; persistenza triage/consensi neutralizzata nel runner.
- Runner temporanei creati per l'audit rimossi; restano solo evidenze, raw, screenshot, trace, manifest e report.
- Nessuna modifica prodotto effettuata dall'audit; file protetti invariati rispetto agli hash iniziali.
- Nessun merge, cherry-pick, rebase, reset, branch di integrazione, push, PR, deploy o test di produzione.
# Evidenza fix UX mobile e rerun mirato - 2026-07-17

- Branch verificato: `aiutodoc-clinical-validation`; HEAD `f5b58abffa615ab04ec0a6acf83392e08e7fc52b`.
- `main` verificato e invariato: `f776bae225406bd05df9bbb95828ebefe0e16e81`.
- Inventario pre-fix: 11 file tracciati modificati e 728 file non tracciati già presenti; nessun reset, clean, restore o stash.
- Fix prodotto isolato: `src/style.css` e `src/app_bootstrap.js`; 11 inserimenti e 2 sostituzioni/rimozioni.
- Hash clinici invariati: `src/app_shared.js`, `src/app_v3_standalone.js`, `src/chat_interface.js`, Gemini, routing, bypass, validatore e scoring.
- Root cause pre-fix riprodotta 4/4; menu post-fix 4/4 PASS; rotazioni 2/2 PASS; casi mobile 8/8 PASS; smoke desktop 3/3 PASS.
- `npm run check` PASS; `npm run build` PASS; validator 12/12 PASS; JSON e scan anti-segreti PASS.
- Gemini reale nei percorsi ordinari; zero Gemini nei bypass. Ricerca specialisti e persistenza neutralizzate soltanto nel runner; nessuna ricerca esterna.
- Runner temporanei da rimuovere al termine; evidenze, raw, screenshot, hash e report conservati.
- Nessun merge, cherry-pick, rebase, trasferimento a `main`, push, PR, deploy o test in produzione.
