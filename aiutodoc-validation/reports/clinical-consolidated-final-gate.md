# Gate finale audit clinico consolidato

Data: 2026-07-17

| Gate | Esito | Evidenza |
|---|---|---|
| Consolidamento | PASS | 99 report, 236 raw, 162 case ID/reference raw unici, 155 adjudicati, 7 non adjudicati, 10 bypass, 10 BOM, 74 raw storici con ricerca; 14 branche; cicli 01-03 chiusi nei rispettivi perimetri |
| Check | PASS | `npm run check` |
| Build | PASS | `npm run build` |
| Validator | PASS | `npm run test:validator`: 12/12 |
| Desktop | PASS | 40/40 finali; rerun minimo 4/4 |
| Mobile | FAIL | 22/22 clinico-funzionali PASS, ma menu hamburger non richiudibile su 4/4 viewport |
| Bypass | PASS | desktop 9/9; mobile 7/7; Gemini 0 chiamate nei bypass |
| Controlli negativi | PASS | desktop 13/13; mobile 6/6; falsi positivi urgenti 0 |
| PED_02 | PASS | coda completa, 7 anni, 24 kg, 125 cm, secondo blocco, Gemini 200, semantica durata |
| Sicurezza clinica | PASS | diagnosi/sospetti visibili 0; prescrizioni/dosaggi/modifiche terapia 0; negazioni/dati/motivazioni inventati 0 |
| Hash prodotto | PASS | file protetti invariati rispetto alla baseline audit |
| Main invariato | PASS | `main` ancora `f776bae225406bd05df9bbb95828ebefe0e16e81` |
| Readiness verso main | NON IDONEO | gate mobile bloccato e working tree prodotto preesistente non pulito |

## Numeri finali

- Desktop: 40 casi, 40 PASS, 0 failure finali, 0 warning clinici.
- Mobile: 22 esecuzioni/21 casi unici; iPhone 13 6/6, iPhone SE 6/6, Pixel 7 5/5, Android compatto 5/5.
- Mobile UX: 1 difetto bloccante riprodotto su 4/4 viewport.
- Routing finale: 19 casi, 17 PASS ROUTING e 2 BYPASS.
- Gemini: 46 risposte cliniche HTTP 200 complessive (31 desktop + 15 mobile); 0 chiamate nei bypass.
- Ricerca specialisti esterna: 0 chiamate.

## Root cause, rischi e rerun

La failure consolidata non è clinica: il menu mobile aperto sovrappone il controllo di chiusura e intercetta gli eventi puntatore. Il difetto è presente nella base e non è stato corretto durante l'audit. Rerun minimo: chiusura menu su quattro viewport, due rotazioni con stato, un caso ordinario e uno urgente per viewport, PED_02 su iPhone 13.

Rischi residui: non determinismo Gemini; forte sensibilità sanitaria delle modifiche; tre file candidati al trasferimento hanno modifiche locali preesistenti; i sette casi non adjudicati restano non validati. Non sono emersi impatti nuovi su privacy, testi legali, database, analytics o servizi esterni; persistenza triage/consensi è stata neutralizzata nel runner e sono stati usati solo dati sintetici.

## Trasferimento futuro

File candidati: `server/gemini_proxy.js`, `src/app_shared.js`, `src/app_v3_standalone.js`, `src/chat_interface.js`. Opzionali QA/runner: `index.html`, `package.json`. Da non trasferire nel runtime: l'intera evidenza `aiutodoc-validation/artifacts/**`, report, raw, screenshot, trace, delivery e archivi.

Strategia proposta: porting manuale su futuro branch di integrazione dopo pulizia dello stato locale e fix/rerun mobile. Nessun merge, cherry-pick, push, PR o deploy è stato eseguito.

**AUDIT CONSOLIDATO NON SUPERATO - TRASFERIMENTO SU MAIN NON RACCOMANDATO**
