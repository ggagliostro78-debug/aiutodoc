# Audit working tree prima del fix menu mobile

Data: 2026-07-17

## Riferimenti Git

- Branch operativo: `aiutodoc-clinical-validation`.
- HEAD verificato: `f5b58abffa615ab04ec0a6acf83392e08e7fc52b`.
- `main` verificato e merge-base: `f776bae225406bd05df9bbb95828ebefe0e16e81`.
- Working tree non pulito prima del fix: 11 file tracciati modificati e 728 file non tracciati.

## File tracciati già modificati

| File | Stato iniziale | Classificazione | Vincolo |
|---|---:|---|---|
| `aiutodoc-validation/README.md` | M | documentazione validazione | preservare |
| `aiutodoc-validation/expected-results.json` | M | aspettative cliniche validate | non modificare |
| `aiutodoc-validation/package.json` | M | harness validazione | non modificare salvo necessità del runner temporaneo, poi ripristino locale puntuale |
| `aiutodoc-validation/reports/clinical-functional-report.md` | M | report/evidenza | preservare; due trailing whitespace preesistenti fuori perimetro |
| `aiutodoc-validation/reports/git-safety-evidence.md` | M | evidenza Git | append consentito per il presente audit |
| `aiutodoc-validation/reports/technical-ui-flow-report.md` | M | report/evidenza | preservare |
| `aiutodoc-validation/scripts/score-results.ts` | M | validatore/scoring | non modificare |
| `aiutodoc-validation/test-cases.json` | M | casi clinici | non modificare |
| `src/app_shared.js` | M | logica clinico-funzionale validata | non modificare |
| `src/app_v3_standalone.js` | M | logica clinica, routing, prompt e post-processing validati | non modificare |
| `src/chat_interface.js` | M | coda domande/quick reply A-D validata | non modificare |

`src/style.css`, `src/app_bootstrap.js` e `index.html` risultavano puliti. Sono gli unici candidati sicuri per un fix menu; la preferenza è `src/style.css`, perché evita sovrapposizioni con codice clinico e limita il cambiamento allo stacking del controllo.

## File non tracciati già presenti

L'elenco completo è stato acquisito con `git ls-files --others --exclude-standard` prima di ogni modifica. Totale: 728.

| Categoria | Numero | Trattamento |
|---|---:|---|
| Artefatti, raw e screenshot di validazione | 524 | evidenze; non cancellare né trasferire nel runtime |
| Report di validazione | 85 | evidenze; preservare |
| Delivery e archivi ZIP | 95 | materiale di consegna; escludere dal runtime |
| Materiale locale Codex/allegati | 8 | estraneo al prodotto; preservare |
| Fixture | 1 | harness; preservare |
| Materiale non attribuito/altro workspace | 11 | non attribuito; non modificare |
| Altri file | 4 | `AGENTS.md`, feedback e materiale locale; preservare |

I percorsi comprendono principalmente `aiutodoc-validation/artifacts/**`, `aiutodoc-validation/reports/**`, `aiutodoc-validation/delivery/**`, archivi ZIP, `.codex-remote-attachments/**`, `$CODEX_HOME/**`, `automation_output/**` e generatori/rassegne non pertinenti. Nessun file preesistente è stato cancellato, ripristinato o sovrascritto.

## Sovrapposizioni e decisione operativa

- Le modifiche preesistenti in `src/app_shared.js`, `src/app_v3_standalone.js` e `src/chat_interface.js` sono clinico-funzionali e già validate; non sono sicure per un fix UX concorrente.
- Non risultano modifiche locali preesistenti nei file del menu (`src/style.css`, `src/app_bootstrap.js`, `index.html`).
- Il difetto noto è compatibile con una collisione di stacking/pointer hit-testing tra `.main-nav.open` e `#menu-toggle`; il fix sarà applicato soltanto dopo la riproduzione e il report di root cause.
- Report, raw, screenshot e trace sono evidenze. Archivi, allegati e materiale di automazione/rassegna sono estranei al fix.

## Hash SHA-256 iniziali dei file protetti

| File | SHA-256 iniziale |
|---|---|
| `src/app_v3_standalone.js` | `cd68c9e7bd30848c6f9a3e3177fd5a74dc5cd83d9139bdd86e88cf63816fc542` |
| `src/app_shared.js` | `ad6906bfa62a1254cb792f229f78f3e3fd6b7b9bbc22286f77467bcb486b9be3` |
| `src/chat_interface.js` | `ab58e927f7c2c812de23c17cfd564654b8b06e6630ff40f33f3ca363b89a601c` |
| `src/app_bootstrap.js` | `1a93012b716500df17b8b2ea3762aa8a1044e5e4c65b5be53856f3a3a1b08b4c` |
| `index.html` | `042d7d061c904a3cf9b7544407da046fb0ef8ca3790c3c4994d89df6090f9107` |
| `server/gemini_proxy.js` | `a2e54cf564a1031e7775c52a98178f1c429996c3bb96ff0ee4ff9c608f066c97` |
| `server/specialist_search.js` | `ebf086fb524ca1528ada36bd0613bd2edf03b77b46fdf2ef27758c2c63e0bb4a` |
| `server/places.js` | `eee8c117159a58620c7a78802cfc8c4f35ab5d576ba981b60a6ad7ff11cbaa74` |
| `server/enrich.js` | `dd6b7bb70ad24483f0d62596790d1746245083d35711f909b526790b8b4ff222` |
| `scripts/dev-local.js` | `8f348558693cebc619ed9f0fdb2c81461b0f48f86f614f9207ecc029475ec96d` |
| `aiutodoc-validation/scripts/anamnesis-routing-validator.ts` | `3a52bb7495211098145fa55fdffad4a2dbc7f31b5a2c338bf138ca052151bd5a` |
| `aiutodoc-validation/scripts/score-results.ts` | `6473c81bdc29fed91cb5dc30f2c398cada353c82599273ea8297483fe6a5d13a` |
| `aiutodoc-validation/test-cases.json` | `0eff288c3473956ef6e72cf9a5df7eecf9470046a2e14b8c7a37c0a66a36ff10` |
| `aiutodoc-validation/expected-results.json` | `01d2d22c20e68f66fcc0cf710d8c5102243ffdc3869d3a708453dda93cf353c0` |
| `src/style.css` | `c594803f25f4a8548f84164cfa8bfa42a58f67d9854c9cf48054c2035ecc778b` |

## Sicurezza

Non sono stati usati `git reset --hard`, `git clean`, merge, cherry-pick, rebase, push, PR o deploy. `main` non è stato modificato.
