# Evidenza sicurezza Git

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
