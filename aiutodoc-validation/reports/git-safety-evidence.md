# Evidenza sicurezza Git

## PSY_01 attacchi di panico non urgente - 9 luglio 2026

- Branch: `aiutodoc-clinical-validation`
- Commit base del branch al momento della correzione: `17e49f303c530246cba9408d613d2a97932e63b5`
- Commit `main`: `f776bae225406bd05df9bbb95828ebefe0e16e81`, invariato
- File applicativo modificato: `src/app_v3_standalone.js`
- Report generato: `aiutodoc-validation/reports/psy01-panic-urgency-fix.md`
- Artefatti generati: `aiutodoc-validation/artifacts/raw-output/staging-chromium-desktop-PSY_01_ATTACCHI_PANICO_NON_URGENTE.json`, `aiutodoc-validation/artifacts/playwright-results.json`
- Modifica clinico-funzionale: normalizzazione circoscritta del quadro ansia/attacchi di panico ricorrenti, brevi e risolti, con assenza esplicita di red flag cardiopolmonari/autolesive.
- Output richiesto ottenuto: branca `Psicologia / Psichiatria`, area `Ansia / attacchi di panico / disturbi d'ansia`, urgenza `bassa / visita psicologica o psichiatrica programmata`, nessun 112/PS automatico.
- Timeout proxy: invariato a `75000 ms`
- CSS, grafica, layout, UX, documenti legali, database, Netlify e produzione: non modificati
- Test eseguito: solo `PSY_01_ATTACCHI_PANICO_NON_URGENTE`, staging locale `http://127.0.0.1:4273`, solo `chromium-desktop`
- Mock, fallback clinico improprio e intercettazione `/api/gemini`: nessuno
- `/api/gemini`: HTTP 200, durata `10551.245 ms`
- Esito: Playwright PASS; clinico-funzionale PASS
- Merge, push, PR e deploy produzione: nessuno
- Verifiche: `npm run check` PASS; `npm run build` PASS tramite `pushd` per compatibilita UNC

## Batch 03 Psicologia/Psichiatria - 9 luglio 2026

- Branch: `aiutodoc-clinical-validation`
- Commit `main`: `f776bae225406bd05df9bbb95828ebefe0e16e81`, invariato
- Ambiente: staging locale `http://127.0.0.1:4273`
- Browser: solo `chromium-desktop`
- Timeout proxy: `75000 ms`
- Casi eseguiti: solo `PSY_01_ATTACCHI_PANICO_NON_URGENTE`, `PSY_02_DEPRESSIONE_MODERATA_SENZA_IDEAZIONE_SUICIDARIA`, `PSY_03_IDEAZIONE_SUICIDARIA_ATTIVA`, `PSY_04_ESORDIO_PSICOTICO_POSSIBILE`, `PSY_05_DISTURBO_ALIMENTARE_POSSIBILE`
- Modifiche applicative/motore/prompt: nessuna durante il batch
- Modifiche suite: aggiunte fixture PSY e mapping tecnico `13-17 -> 13_17` nel validatore Playwright per eseguire PSY_05
- CSS, grafica, layout, UX, documenti legali, database, Netlify e produzione: non modificati
- Mock, route interception `/api/gemini`, fallback clinico locale: nessuno
- Produzione/live pubblico: non testati
- Mobile, 75 casi, Ortopedia e Dermatologia: non eseguiti
- Merge, push, PR e deploy produzione: nessuno
- Esito Playwright finale consolidato: 5/5 PASS
- Esito clinico-funzionale: 4 PASS, 1 WARNING (`PSY_01` per urgenza sovrastimata)
- Errori infrastrutturali: 0
- Verifiche: JSON fixture PASS; `npm run check` PASS; `npm run build` PASS tramite `pushd` per compatibilita UNC

## NEURO_04 sospetto ictus / FAST positivo - 9 luglio 2026

- Branch: `aiutodoc-clinical-validation`
- Commit base del branch al momento della correzione: `d69fe83dac161cd1df8fd8b6ee4f9483f214639d`
- Commit `main`: `f776bae225406bd05df9bbb95828ebefe0e16e81`, invariato
- File applicativo modificato: `src/app_v3_standalone.js`
- Report generato: `aiutodoc-validation/reports/neuro04-stroke-fast-fix.md`
- Artefatti generati: `aiutodoc-validation/artifacts/raw-output/staging-chromium-desktop-NEURO_04_SOSPETTO_ICTUS_FAST.json`, `aiutodoc-validation/artifacts/playwright-results.json`
- Modifica clinico-funzionale: riconoscimento locale strutturato di FAST positivo con bocca/viso storto, difficolta a sollevare un braccio, linguaggio confuso ed esordio recente/improvviso.
- Output richiesto ottenuto: `112/118`, `Pronto Soccorso`, `stroke unit`, branca `Emergenza neurologica / ictus`, area `Sospetto ictus/TIA acuto / stroke unit`.
- Timeout proxy: invariato a `75000 ms`
- CSS, grafica, layout, UX, documenti legali, database, Netlify e produzione: non modificati
- Test eseguito: solo `NEURO_04_SOSPETTO_ICTUS_FAST`, staging locale `http://127.0.0.1:4273`, solo `chromium-desktop`
- Mock, fallback clinico improprio e intercettazione `/api/gemini`: nessuno
- `/api/gemini`: non chiamata perche il rilevatore locale ha bloccato correttamente come emergenza strutturata completa
- Esito: Playwright PASS; clinico-funzionale PASS
- Merge, push, PR e deploy produzione: nessuno
- Verifiche: `npm run check` PASS; `npm run build` PASS tramite `pushd` per compatibilita UNC

## Batch 02 Neurologia - 9 luglio 2026

- Branch: `aiutodoc-clinical-validation`
- Commit `main`: `f776bae225406bd05df9bbb95828ebefe0e16e81`, invariato
- Ambiente: staging locale `http://127.0.0.1:4273`
- Browser: solo `chromium-desktop`
- Timeout proxy: `75000 ms`
- Casi eseguiti: solo `NEURO_01_CEFALEA_RICORRENTE_NON_URGENTE`, `NEURO_02_CEFALEA_RED_FLAG_URGENTE`, `NEURO_03_PARESTESIE_RICORRENTI_NON_URGENTI`, `NEURO_04_SOSPETTO_ICTUS_FAST`, `NEURO_05_PRIMA_CRISI_CONVULSIVA_RISOLTA`
- Modifiche applicative/motore/prompt: nessuna durante il batch
- Modifiche suite: aggiunte fixture neurologiche e telemetria non invasiva status/durata `/api/gemini`
- CSS, grafica, layout, UX, documenti legali, database, Netlify e produzione: non modificati
- Mock, route interception `/api/gemini`, fallback clinico locale: nessuno
- Produzione/live pubblico: non testati
- Mobile, 75 casi e altri batch: non eseguiti
- Merge, push, PR e deploy produzione: nessuno
- Esito Playwright: 5/5 PASS
- Esito clinico-funzionale: 4 PASS, 1 WARNING (`NEURO_04` per assenza di `112/118` esplicito e `stroke unit`)
- Errori infrastrutturali: 0
- Verifiche: JSON fixture PASS; `npm run check` PASS; `npm run build` PASS tramite `pushd` per compatibilita UNC

## CARDIO_04 crisi ipertensiva sintomatica - 9 luglio 2026

- Branch: `aiutodoc-clinical-validation`
- Commit base del branch al momento della correzione: `29e240f47acd1e6455694c746f2ba8d8a54d81af`
- Commit finale della correzione: commit corrente del branch `aiutodoc-clinical-validation` contenente questo report
- Commit `main`: `f776bae225406bd05df9bbb95828ebefe0e16e81`, invariato
- File applicativo modificato: `src/app_v3_standalone.js`
- Report generato: `aiutodoc-validation/reports/cardio04-hypertensive-crisis-fix.md`
- Artefatti generati: `aiutodoc-validation/artifacts/raw-output/staging-chromium-desktop-CARDIO_04_IPERTENSIONE_SEVERA_CON_SINTOMI.json`, `aiutodoc-validation/artifacts/playwright-results.json`
- Modifica clinico-funzionale: riconoscimento locale strutturato di pressione severa associata a sintomi neurologici/cardiorespiratori, con indicazione 112/118 o Pronto Soccorso.
- Timeout proxy: invariato a `75000 ms`
- CSS, grafica, layout, UX, documenti legali, database, Netlify e produzione: non modificati
- Test eseguito: solo `CARDIO_04_IPERTENSIONE_SEVERA_CON_SINTOMI`, staging locale `http://127.0.0.1:4273`, solo `chromium-desktop`
- Mock, fallback clinico e intercettazione `/api/gemini`: nessuno
- `/api/gemini`: non chiamata perche il rilevatore locale ha bloccato correttamente come emergenza strutturata completa
- Esito: Playwright PASS; clinico-funzionale PASS
- Merge, push, PR e deploy produzione: nessuno
- Verifiche: `npm run check` PASS; `npm run build` PASS tramite `pushd` per compatibilita UNC

## Correzioni Batch 01 Cardiologia - 8 luglio 2026

- Branch: `aiutodoc-clinical-validation`
- Commit di partenza: `2259fa5e047217502bdbe68df2d03b45a39aec11`
- `main`: `f776bae225406bd05df9bbb95828ebefe0e16e81`, invariato
- Modifiche: temporalita del rilevatore cardiologico, output emergenza locale strutturato, normalizzazione CARDIO_01/CARDIO_05 e acquisizione campi strutturati nei test
- Timeout proxy: invariato a `75000 ms`
- CSS, grafica, layout, UX, legali, database, Netlify e produzione: non modificati
- Test: soltanto CARDIO_01, CARDIO_02, CARDIO_04 e CARDIO_05; rerun aggiuntivo limitato a CARDIO_05 dopo correzione del matcher
- Browser/ambiente: solo `chromium-desktop`, staging locale
- Mock, fallback e route interception: nessuno
- Merge, push, PR e deploy: nessuno
- Verifiche finali: `npm run check` PASS; `npm run build` PASS tramite `pushd` per compatibilita UNC

## Batch 01 Cardiologia - 8 luglio 2026

- Branch: `aiutodoc-clinical-validation`
- Commit applicativo testato: `49540a7be0b8475990873e2a08941624ffe38091`
- `main`: `f776bae225406bd05df9bbb95828ebefe0e16e81`, invariato
- Fixture aggiunte: esclusivamente i cinque casi cardiologici ufficiali del Batch 01 e relativi risultati attesi
- Modifiche al motore, prompt, proxy, CSS, UX, legali, database o produzione: nessuna
- Browser/ambiente: solo `chromium-desktop`, staging locale `http://127.0.0.1:4273`
- Timeout proxy verificato: `75000 ms`
- Mock, fallback e route interception: nessuno
- Casi tentati: 5/5; Playwright 3 PASS e 2 FAIL
- Merge, push, PR e deploy: nessuno

## Correzione validatore CELIACHIA_02 - 8 luglio 2026

- Branch: `aiutodoc-clinical-validation`
- Commit di partenza: `60af367595fb45d4edbeb1ec0ad2ba7141f6c52c`
- `main`: `f776bae225406bd05df9bbb95828ebefe0e16e81`, invariato
- Modifiche limitate alla suite Playwright: matcher controllato e test offline sul raw salvato
- Motore AiutoDoc, prompt, proxy, CSS, grafica e UX: non modificati
- Gemini call, test clinici e mock: nessuno
- Esito Playwright offline: 1/1 PASS
- Merge, push e deploy produzione: nessuno

## Run CELIACHIA_02 / COVID_01 - 8 luglio 2026

- Branch: `aiutodoc-clinical-validation`
- Commit applicativo testato: `95dc46fec5cc1cfb0c90775c77c8b4bdda47b5f5`
- `main`: `f776bae225406bd05df9bbb95828ebefe0e16e81`, invariato
- Timeout proxy verificato: `75000 ms`
- Test eseguiti: soltanto `CELIACHIA_02` e `COVID_01`, staging reale, `chromium-desktop`
- Mock, route interception e healthcheck aggiuntivi: nessuno
- Modifiche a codice, CSS, grafica o UX durante questo run: nessuna
- Merge, push e deploy produzione: nessuno
- Risultato: COVID_01 PASS Playwright; CELIACHIA_02 output clinico conforme ma FAIL tecnico per sinonimo non riconosciuto

## Correzione funzionale ANEMIA_01 - 8 luglio 2026

- Branch: `aiutodoc-clinical-validation`
- Commit di partenza: `5ce5131c6bf4bc916d0cfa5845154d9c2899585e`
- `main`: `f776bae225406bd05df9bbb95828ebefe0e16e81`, invariato
- Timeout proxy finale: `75000 ms`
- Codice modificato: schema/timeout proxy, normalizzazione output e acquisizione test dell'area specialistica
- CSS, layout, grafica, UX visibile e onboarding specialisti: non modificati
- Test: solo `ANEMIA_01`, staging reale, `chromium-desktop`, 1/1 PASS
- Mock e intercettazioni `/api/gemini`: nessuno
- Merge, push e deploy produzione: nessuno

## Prova timeout ANEMIA_01 - 8 luglio 2026

- Branch: `aiutodoc-clinical-validation`
- Commit di partenza del test: `46acd6c2751cac141d46b9d5e1b0c403477dd565`
- `main`: `f776bae225406bd05df9bbb95828ebefe0e16e81`, invariato
- Modifica applicativa: solo `server/gemini_proxy.js`, timeout `AbortController` da `45000` a `90000` ms
- CSS, layout, grafica, UX, documenti legali, database e API key: non modificati
- Merge, push, pull request e deploy produzione: nessuno
- Test eseguito: solo `ANEMIA_01`, staging, `chromium-desktop`, senza mock o intercettazioni
- Controlli: `node --check server/gemini_proxy.js` PASS; `node scripts/build-netlify.js` PASS
- `/api/gemini`: HTTP 200 in `7565.861 ms`
- Esito test: FAIL CLINICO-FUNZIONALE per urgenza non esplicita e red flag negative non strutturate; nessun errore infrastrutturale

## Evidenza aggiornata - 7 luglio 2026

- Branch corrente: `aiutodoc-clinical-validation`
- Commit `main` di partenza e attuale: `f776bae225406bd05df9bbb95828ebefe0e16e81`
- Commit branch parallelo: `7e52867f72665c6ddabd34fa750509bcf2a3a65a`
- Commit funzionale precedente: `43bdb88505e9a1dace268e47bc615732cbf9224e`
- Main modificato: **no**
- Deploy produzione: **nessuno**
- Merge, push o pull request: **nessuno**
- Diff summary `main...7e52867`: **21 file, 1770 inserimenti, 58 eliminazioni**

File modificati dall'ultima correzione: `src/app_shared.js`, `src/app_v3_standalone.js`, `aiutodoc-validation/expected-results.json`, `aiutodoc-validation/playwright.config.ts`, `aiutodoc-validation/tests/aiutodoc-orientation.spec.ts` e i report generati. Nessun CSS, file legale, configurazione Netlify, API serverless, database o regola Firestore e stato modificato.

- Branch corrente: `aiutodoc-clinical-validation`
- Commit `main` di partenza: `f776bae225406bd05df9bbb95828ebefe0e16e81`
- Commit funzionale branch parallelo validato: `43bdb88505e9a1dace268e47bc615732cbf9224e`
- Deploy in produzione eseguiti: **nessuno**
- Merge verso `main`: **nessuno**

## Stato rilevato

`git branch --show-current` ha restituito `aiutodoc-clinical-validation`. `main` punta ancora a `f776bae`; il branch parallelo contiene due commit dedicati sopra tale base. I file non tracciati già presenti nel workspace non sono stati aggiunti o modificati, salvo gli artefatti esplicitamente richiesti sotto `aiutodoc-validation`.

## Diff summary `main...aiutodoc-clinical-validation`

```text
20 files changed, 1820 insertions(+), 55 deletions(-)
```

La diff non contiene file CSS, configurazioni Netlify, funzioni serverless, regole Firestore o documenti legali.

## File modificati rispetto a main

- `aiutodoc-validation/.gitignore`
- `aiutodoc-validation/README.md`
- `aiutodoc-validation/expected-results.json`
- `aiutodoc-validation/package-lock.json`
- `aiutodoc-validation/package.json`
- `aiutodoc-validation/playwright.config.ts`
- `aiutodoc-validation/reports/clinical-functional-report.md`
- `aiutodoc-validation/reports/parallel-main-safety-report.md`
- `aiutodoc-validation/reports/staging-visual-comparison.md`
- `aiutodoc-validation/reports/technical-ui-flow-report.md`
- `aiutodoc-validation/scripts/assert-parallel-branch.cjs`
- `aiutodoc-validation/scripts/score-results.ts`
- `aiutodoc-validation/scripts/start-local-staging.cjs`
- `aiutodoc-validation/test-cases.json`
- `aiutodoc-validation/tests/aiutodoc-orientation.spec.ts`
- `index.html`
- `package.json`
- `src/app_shared.js`
- `src/app_v3_standalone.js`
- `src/chat_interface.js`

## Conferme

Il riferimento Git `main` non è stato spostato né modificato. Non sono stati eseguiti push, merge, pull request o deploy. Lo staging usato per la validazione è locale, separato dalla produzione e avviato dal solo branch parallelo. Il commit che aggiunge questo documento è intenzionalmente successivo al commit funzionale indicato sopra e non altera il codice validato.
