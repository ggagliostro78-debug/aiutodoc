# Audit diff fix menu mobile

Data: 2026-07-17

## Diff prodotto introdotto dal task

| File | Tipo modifica | Necessaria | Clinica | UX | Sicura |
|---|---|---:|---:|---:|---:|
| `src/style.css` | `z-index` toggle mobile da 1200 a 2100 | Sì | No | Sì | Sì |
| `src/app_bootstrap.js` | ARIA dinamica, chiusura backdrop, `Escape`, ripristino focus | Sì | No | Sì | Sì |

Numeri: `src/style.css` 1 inserimento/1 rimozione; `src/app_bootstrap.js` 10 inserimenti/1 rimozione. Totale: 11 inserimenti e 2 rimozioni/sostituzioni. Nessun testo sanitario o legale è cambiato.

## File protetti

| Area | Esito |
|---|---|
| `src/app_shared.js` | hash invariato |
| `src/app_v3_standalone.js` | hash invariato |
| `src/chat_interface.js` | hash invariato |
| `server/gemini_proxy.js` | hash invariato |
| routing e bypass | nessun diff |
| prompt Gemini e post-processing | nessun diff |
| validatore e `score-results.ts` | nessun diff introdotto dal task |
| privacy, consensi, legal, analytics e database | nessun diff |
| servizi di ricerca/enrichment | nessun diff |

Gli hash completi iniziali/finali sono in `artifacts/mobile-menu-fix-hashes.json`. Le uniche variazioni protette sono i due file UX dichiarati. Il diff non attraversa i tre file prodotto già modificati prima del task.

## Modifiche locali preesistenti ancora presenti

Restano preservate le 11 modifiche tracciate inventariate in `pre-mobile-fix-working-tree-audit.md`, comprese quelle clinico-funzionali in `src/app_shared.js`, `src/app_v3_standalone.js` e `src/chat_interface.js`. Restano inoltre gli artefatti, report, raw, screenshot, archivi, allegati e materiale estraneo preesistenti. Nessun elemento è stato ripristinato, cancellato, stashed o sovrascritto.

## Classificazione per futuro porting

- Fix mobile autonomo candidato: `src/style.css`, `src/app_bootstrap.js`.
- Candidati clinico-funzionali separati, già presenti prima del fix: `server/gemini_proxy.js`, `src/app_shared.js`, `src/app_v3_standalone.js`, `src/chat_interface.js`.
- Da escludere dal runtime: `aiutodoc-validation/artifacts/**`, `reports/**`, raw, screenshot, trace, delivery, ZIP, allegati Codex, automazioni e materiale di rassegna.

Il futuro trasferimento deve mantenere separati il diff UX e le modifiche clinico-funzionali e richiede autorizzazione CTO.
