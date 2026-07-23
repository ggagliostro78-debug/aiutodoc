# Ciclo 02 - Technical closure

Data: 2026-07-16  
Branch: `aiutodoc-clinical-validation`  
Ambiente: staging locale `http://127.0.0.1:4273`, Chromium desktop, Gemini reale

## Esito

**GATE TECNICO PLAYWRIGHT DEL CICLO 02 CHIUSO.** I tre casi autorizzati sono PASS, con raw completi e teardown completato.

`RICERCA SPECIALISTI NON ESEGUITA PER SCELTA METODOLOGICA`

Le richieste a `places`, `specialist-search` ed enrichment sono state neutralizzate esclusivamente nel runner. Chiamate esterne di ricerca specialisti: 0. Gemini e rimasto reale nei casi non bypassati e non e stato intercettato.

| Caso | Clinica completata | Raw salvato | Asserzioni | Teardown | Playwright | Esito |
|---|---|---|---|---|---|---|
| NEURO_01_URGENTE_DEBOLEZZA_LINGUAGGIO | Si | Si | Debolezza improvvisa, difficolta nel parlare, 112/118 o PS | PASS | PASS | PASS |
| NEURO_04_BORDERLINE_VERTIGINI_UDITO | Si | Si | ORL/Audiovestibologia e domande pertinenti | PASS al retry tecnico | PASS | PASS |
| NEURO_06_ANTICOAGULANTE_TRAUMA_TESTA | Si | Si | Neurologia e urgenza alta | PASS | PASS | PASS |

## Correzioni del runner

- `NEURO_01`: asserzioni semantiche indipendenti da righe, punteggiatura, accenti e ordine del testo; restano obbligatori tutti e tre i concetti clinici.
- Teardown: il runner salva prima raw e artefatti, poi chiude pagina, contesto e browser con timeout separati, `try/finally` e chiusure idempotenti.
- `NEURO_04`: un unico retry tecnico documentato per `browser.close` timeout; nessuna modifica al prodotto tra tentativo e retry.

## Verifiche

- `npm run check`: PASS.
- `npm run build`: PASS.
- `npm run test:validator`: 12/12 PASS.
- Playwright finale: 3/3 PASS, zero retry automatici.
- Diagnosi/sospetti, prescrizioni/dosaggi, negazioni ignorate, domande fuori ramo e chiamate di ricerca specialisti: 0.
- File protetti invariati rispetto agli hash iniziali.

Ciclo 03 non avviato. Attendere decisione CTO esplicita.
