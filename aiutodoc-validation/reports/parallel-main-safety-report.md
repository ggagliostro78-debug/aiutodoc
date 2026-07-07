# Report sicurezza main parallelo AIutoDoc

## Identificazione ambiente

- Branch parallelo: `aiutodoc-clinical-validation`
- Base immutata: `main` commit `f776bae225406bd05df9bbb95828ebefe0e16e81`
- Commit iniziale del branch parallelo: `f3a15b9d6d75eae0c5bd011b4801af0a230001ad`
- Deploy eseguiti: nessuno
- Merge o pull request: nessuno
- Ambiente live interrogato per QA: `https://aiutodoc.it`

Il riferimento Git di `main` è rimasto sul commit indicato sopra. Le modifiche clinico-funzionali sono presenti esclusivamente nel branch parallelo.

## File modificati nel branch parallelo

- `index.html`: soli attributi `data-testid`, nessuna variazione CSS/layout.
- `src/app_shared.js`: distinzione testabile tra disclaimer e urgenza clinica; output fonti identificabile.
- `src/app_v3_standalone.js`: validatore input, segnali urgenti motivati, red flag strutturate e output testabile.
- `src/chat_interface.js`: identificatori semantici per domande e alert clinici.
- `package.json`: wrapper `check:clinical-validation` e `build:clinical-validation` protetti dal branch guard.
- `aiutodoc-validation/**`: suite, scoring, configurazione ambienti, report e guardia branch.

## File e configurazioni non modificati

- Tutti i file CSS e gli asset grafici.
- Header, footer, colori, font, spaziature, card, icone, animazioni e responsive design.
- `netlify.toml`, routing e configurazione del deploy principale.
- API serverless, Firebase, Firestore e relative regole.
- Privacy policy, cookie policy, disclaimer medico, termini e consensi visibili.
- Analytics e Consent Mode.
- Dipendenze applicative del sito principale.

## Differenze funzionali introdotte

- Disclaimer generico escluso dallo scoring dell'urgenza.
- Segnale clinico urgente separato e accompagnato dalle motivazioni rilevate.
- Gestione prudente delle negazioni e della saturazione fino al 93%.
- Testi pediatrici, respiratori, cronici, numerici e con acronimi sanitari non vengono respinti come casuali.
- Output separati per specialista, urgenza, red flag, fonti e domande.
- Modalità `mocked-local`, `staging` e `live`; staging/live non intercettano `/api/gemini`.
- `PASS TECNICO` riservato ai mock; `PASS CLINICO-FUNZIONALE` riservato agli output reali.
- Controllo della contraddizione tra 112/Pronto Soccorso e “non pronto soccorso se stabile”.

## Confronto grafico

Il confronto è stato eseguito contro una worktree detached del commit `main` su desktop e Pixel 7. Dopo aver eliminato un vecchio server locale rimasto sulla porta 4173, le schermate baseline e parallele risultano visivamente identiche. Non sono state rilevate differenze grafiche.

- `artifacts/visual-comparison/main-baseline-desktop.png`
- `artifacts/visual-comparison/parallel-desktop.png`
- `artifacts/visual-comparison/main-baseline-mobile.png`
- `artifacts/visual-comparison/parallel-mobile.png`

## Mini-ciclo live

Comando:

```text
AIUTODOC_ENV=live AIUTODOC_BASE_URL=https://aiutodoc.it npm run test:live
```

Casi reali: `ANEMIA_01`, `ANEMIA_02`, `CELIACHIA_02`, `COVID_01`, `COVID_02`, `INFLUENZA_02` su desktop e mobile. Le API non sono state intercettate.

Esito clinico reale: 0 PASS, 2 WARNING, 4 FAIL. La produzione attuale mostra falsi positivi d'urgenza, respinge due testi realistici e non espone red flag/motivazioni specifiche nei tre casi urgenti. Questi risultati sono documentati, non mascherati.

Il branch parallelo, con mock deterministici, ha superato 12/12 esecuzioni sugli stessi sei casi.

## Validazione reale del main parallelo in staging

- URL staging separato: `http://127.0.0.1:4273`
- Backend: server locale del branch parallelo con proxy Gemini reale.
- Mock/intercettazioni `/api/gemini`: nessuna.
- Produzione interrogata: no.
- Casi: i sei casi critici approvati, senza estensione ai 75 casi.

Il run finale desktop ha superato 6/6 test. Le verifiche mobile hanno confermato i tre casi urgenti; due richieste complete hanno inoltre evidenziato timeout intermittenti del servizio esterno, conservati come limite operativo e non come regressione grafica.

Report clinico staging finale: 4 PASS CLINICO-FUNZIONALE, 2 WARNING, 0 FAIL. Tutti i criteri minimi richiesti sui sei casi risultano presenti negli output acquisiti.

## Comandi di sicurezza

- `npm run check:clinical-validation`
- `npm run build:clinical-validation`
- dalla cartella `aiutodoc-validation`: `npm test`, `npm run test:staging`, `npm run test:live`

Questi comandi verificano che il branch corrente sia `aiutodoc-clinical-validation`. Non è stato aggiunto alcun comando di deploy.

## Rischi residui

- La produzione continuerà a mostrare le criticità rilevate finché il founder non approverà un merge e un deploy separati.
- Lo scoring automatico non sostituisce revisione clinica.
- Le risposte live possono variare tra esecuzioni e consumano quota API.
- Il volume SMB ha presentato un inode/cartella `artifacts/screenshots` non accessibile; gli screenshot nuovi sono stati salvati in `artifacts/screenshots-live` e `artifacts/screenshots-mocked` senza perdita di evidenza.

## Procedura per un eventuale merge futuro

1. Revisione clinica dei sei casi e delle regole d'urgenza.
2. Code review di sicurezza/privacy e verifica dei testi visibili.
3. Esecuzione completa mocked-local e staging su ambiente separato.
4. Confronto visuale desktop/mobile aggiornato.
5. Approvazione scritta del founder.
6. Merge manuale verso `main`; nessuna automazione o deploy implicito.
