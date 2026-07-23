# Audit readiness pre-main

## Baseline Git

- Source: `aiutodoc-clinical-validation` @ `f5b58abffa615ab04ec0a6acf83392e08e7fc52b`.
- Target protetto: `main` @ `f776bae225406bd05df9bbb95828ebefe0e16e81`.
- Merge-base: `f776bae225406bd05df9bbb95828ebefe0e16e81`.
- Divergenza: 20 commit solo nel branch clinico; 0 commit solo in `main`.
- Conflitti testuali previsti dal merge-tree: 0.

La storia è lineare e il rischio di conflitto testuale è basso. Il rischio semantico resta alto perché le modifiche intervengono su emergenze, negazioni, routing, schema Gemini e normalizzazione clinica.

## File candidati al futuro porting manuale

| File | Classificazione |
|---|---|
| `server/gemini_proxy.js` | schema strutturato e timeout Gemini |
| `src/app_shared.js` | fonti e messaggistica urgenza condivisa |
| `src/app_v3_standalone.js` | routing, bypass, negazioni, prompt e normalizzazione clinica |
| `src/chat_interface.js` | marcatura output emergenziale e testabilità |

`index.html` contiene solo strumentazione `data-testid` rispetto a `main`: trasferimento opzionale QA. `package.json` aggiunge comandi del workflow clinico: trasferimento opzionale solo se si decide di conservare la suite nel repository target.

## File da non trasferire nel runtime

- `aiutodoc-validation/artifacts/**`, inclusi raw, screenshot, trace e manifest;
- `aiutodoc-validation/reports/**` e `delivery/**`;
- runner temporanei: rimossi, nessuno da trasferire;
- archivi ZIP e materiale estraneo non tracciato presenti nel working tree.

## Rischi e strategia

Tre file candidati (`src/app_shared.js`, `src/app_v3_standalone.js`, `src/chat_interface.js`) hanno modifiche locali preesistenti non committate. Un merge diretto mescolerebbe quindi commit auditati e stato locale non identificato. Inoltre il gate mobile è FAIL per il menu hamburger.

Strategia suggerita, non eseguita: **porting manuale su un futuro branch di integrazione**, dopo (1) separazione e commit/revisione delle modifiche locali, (2) fix autorizzato del menu, (3) rerun mobile minimo, (4) nuova verifica hash e clinica mirata. Cherry-pick dell'intera serie o merge diretto non sono raccomandati nello stato attuale, perché importerebbero anche harness e storia documentale non destinati al runtime.

## Esito

Readiness verso `main`: **NON IDONEO**. `main` è rimasto invariato; nessuna strategia è stata eseguita.

Dettaglio machine-readable: `artifacts/pre-main-transfer-diff.json`.
