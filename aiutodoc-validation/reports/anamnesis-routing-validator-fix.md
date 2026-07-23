# Anamnesis Routing Validator Fix

Data: 2026-07-13
Branch: `aiutodoc-clinical-validation`
Perimetro: solo validatore QA del routing anamnestico
Applicazione/router: non modificati
Rerun clinici: non eseguiti
Produzione/mobile/Batch 09: non eseguiti

## Sintesi

Creato un validatore riusabile per l'audit del routing anamnestico, con 12 fixture sanitizzate. Il gate è **SUPERATO: 12/12 test PASS**.

La modifica preesistente a `scripts/score-results.ts` è stata letta e compresa: contiene lo standard medico-legale e controlli contestuali su conclusioni diagnostiche. Non è stata sovrascritta né modificata in questo task. Il nuovo modulo è separato perché la precedente logica di audit era contenuta in runner temporanei non più presenti.

## Risultati

| Test | Prima | Dopo | Esito atteso | Esito ottenuto | PASS/FAIL |
| --- | --- | --- | --- | --- | --- |
| VALIDATOR_01_DISCLAIMER | `diagnosi` rilevata lessicalmente | Disclaimer/negazione escluso dal controllo diagnostico | Diagnosi/sospetto NO | 0 violazioni, PASS ROUTING | PASS |
| VALIDATOR_02_DIAGNOSI_REALE | Rischio di esclusione insieme ai disclaimer | Pattern assertivo contestuale conservato | Diagnosi/sospetto SÌ | 1 violazione, FAIL ROUTING | PASS |
| VALIDATOR_03_DOMANDA_URGENZA | `urgente` nella domanda contato come escalation | L'urgenza effettiva usa solo bypass/emergency output/final output | Falso positivo urgenza NO | false, PASS ROUTING | PASS |
| VALIDATOR_04_BYPASS_APPROPRIATO | 112/118/PS potevano risultare fuori ramo | Termini emergenza esentati solo nel bypass documentato | Fuori ramo NO; bypass SÌ | 0 fuori ramo, BYPASS URGENZA DOCUMENTATO | PASS |
| VALIDATOR_05_MOTIVAZIONE_INVENTATA | Keyword negate potevano essere accettate | Motivazioni confrontate col solo input positivo | Fedeltà FAIL; negazioni ignorate SÌ | 2 motivazioni non fedeli, FAIL ROUTING | PASS |
| VALIDATOR_06_COPERTURA_URINARIA | Matching letterale perdeva varianti e slash | Alias morfologici/sinonimici normalizzati | Urinario e fecale coperti | entrambi true, PASS ROUTING | PASS |
| VALIDATOR_07_WARNING | Copertura subottimale degradata a FAIL | Ramo corretto e pertinente ma parziale produce WARNING | WARNING ROUTING | WARNING ROUTING | PASS |
| VALIDATOR_08_FAIL_FUORI_RAMO | Rischio di falso PASS per keyword mancanti | Ramo errato/non pertinente resta failure forte | FAIL e fuori ramo SÌ | 3 termini fuori ramo, FAIL ROUTING | PASS |
| VALIDATOR_09_PASS | Soglia non distinta chiaramente | Ramo pertinente e copertura adeguata produce PASS | PASS ROUTING | PASS ROUTING | PASS |
| VALIDATOR_10_BYPASS_FECI_SCURE | Raw P0 poteva generare diagnosi/fuori ramo | Disclaimer escluso, motivazioni fedeli e bypass riconosciuto | BYPASS; diagnosi/fuori ramo/fedeltà errori 0 | BYPASS URGENZA DOCUMENTATO, tutti 0 | PASS |
| VALIDATOR_11_VERTIGINI_NON_URGENTI | Domanda prudenziale classificata come urgenza impropria | Nessun bypass/output finale urgente equivale a nessuna escalation | Nessun falso positivo; PASS coerente | false, PASS ROUTING | PASS |
| VALIDATOR_12_LOMBALGIA_BORDERLINE | Forza/urinario/fecale segnalati mancanti | Forme equivalenti e `urinari/fecali` riconosciute | Copertura completa; nessun FAIL | tre concetti true, PASS ROUTING | PASS |

## File del validatore

- `scripts/anamnesis-routing-validator.ts`: nuove regole pure e riusabili per diagnosi, urgenza, bypass, copertura, fedeltà e classificazione.
- `fixtures/anamnesis-routing-validator.json`: 12 fixture sanitizzate; tre leggono raw già acquisiti.
- `tests/anamnesis-routing-validator.spec.ts`: suite unitaria e generazione risultato JSON.
- `package.json`: comando `test:validator`, configurato senza avvio del dev server.
- `artifacts/anamnesis-routing-validator-results.json`: risultato strutturato finale.
- `reports/git-safety-evidence.md`: evidenza del perimetro e dei controlli.

`scripts/score-results.ts` conserva integralmente le modifiche preesistenti e non è stato modificato.

## Regole corrette

### No-diagnosi

Il controllo opera per frase e ignora pattern negazionali/disclaimer come `non è una diagnosi`, `non formula diagnosi`, `non sostituisce una diagnosi` e `non costituisce diagnosi`. Restano bloccanti formulazioni assertive come `diagnosi di`, `sospetto di`, `quadro compatibile con`, `si tratta di` e `verosimilmente`.

### Urgenza

Le domande e le opzioni non determinano escalation. L'urgenza effettiva deriva da `emergencyBypass`, testo emergenza o output finale con indicazione operativa urgente. Un bypass appropriato non considera 112/118/Pronto Soccorso come fuori ramo.

### Copertura

Normalizzazione di accenti, apostrofi, punteggiatura e slash; alias controllati per forza/debolezza, urinario/minzione/urine, fecale/feci/alvo, febbre, perdite e peggioramento. Gli alias sono circoscritti per evitare falsi PASS eccessivamente permissivi.

### PASS, WARNING, FAIL

- `PASS ROUTING`: ramo e domande pertinenti, nessun problema forte.
- `WARNING ROUTING`: ramo corretto e domande pertinenti, ma copertura dichiarata parziale.
- `FAIL ROUTING`: diagnosi/prescrizione, escalation impropria, sottostima, fuori ramo, motivazioni non fedeli, ramo errato o domande sostanzialmente non pertinenti.
- `BYPASS URGENZA DOCUMENTATO`: bypass chiaro, proporzionato e privo di failure.

### Fedeltà

La fedeltà viene applicata soltanto alle motivazioni/affermazioni, non alle domande. Le motivazioni vengono confrontate con il testo positivo dopo rimozione delle clausole negate, conservando i confini di frase.

## Verifiche

- `npm run test:validator`: 12/12 PASS.
- Test tecnico preesistente `saved-raw-validator.spec.ts`: 1/1 PASS.
- `npm run check`: PASS.
- `npm run build`: PASS.
- Applicazione e casi clinici: non rilanciati.
- Mock e intercettazione `/api/gemini`: non usati.
- Primo rerun intermedio della suite: non valutabile per conflitto locale `EADDRINUSE` sulla porta 4173; lo script QA è stato corretto per non avviare il web server e il rerun finale è passato 12/12.
- Branch, diff, scan anti-segreti e perimetro file: verificati separatamente.

## Limiti residui

- Il validatore non sostituisce adjudication clinica nei casi realmente ambigui.
- La fedeltà usa un vocabolario controllato per i segnali testati; nuovi concetti richiederanno alias espliciti.
- La classificazione WARNING richiede che la fixture/audit dichiari copertura parziale; non inferisce autonomamente la completezza clinica.
- I raw P0/P1 restano la fonte per la verifica osservazionale; nessun dato sanitario nuovo è stato raccolto.

## Conferme

- `src/app_v3_standalone.js` non è stato modificato in questo task.
- Router, prompt clinici, output utente e fix P0/P1 non sono stati modificati.
- P2 non è stato corretto.
- Nessun Batch 09, altro batch medico, merge, push, PR o deploy.
