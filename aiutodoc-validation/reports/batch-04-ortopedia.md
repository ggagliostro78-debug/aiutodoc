# Batch 04 Ortopedia - validazione clinico-funzionale reale

- Data run: 9 luglio 2026
- Branch: `aiutodoc-clinical-validation`
- Commit testato: `f5b58abffa615ab04ec0a6acf83392e08e7fc52b`
- Ambiente: `staging`
- Base URL: `http://127.0.0.1:4273`
- Browser: `chromium-desktop`
- Timeout proxy: 75s
- Mock: no
- Intercettazione `/api/gemini`: no
- Produzione: non testata
- Merge/push/deploy/PR: non eseguiti
- CSS/grafica/layout/UX/documenti legali/database/Netlify: non modificati

## Nota di suite

I casi ortopedici non erano ancora presenti nella suite espansa locale. Ho aggiunto solo fixture e attesi del validatore Playwright per `ORTO_01`-`ORTO_05`, senza modificare motore AiutoDoc, prompt clinico, CSS o UX.

## Sintesi batch

| Caso | Esito clinico | Esito Playwright | Branca | Area specialistica | Urgenza | Red flag | Durata /api/gemini | Problema |
|---|---|---|---|---|---|---|---:|---|
| ORTO_01_LOMBALGIA_MECCANICA_NON_URGENTE | WARNING | FLAKY | Ortopedia | Valutazione di lombalgia acuta post-sforzo; secondo livello Fisiatria | Prioritaria | Assenza febbre, perdita peso, trauma importante, dolore sotto ginocchio, debolezza, anestesia genitale, disturbi urinari/fecali | 9592.656 ms | Urgenza sovrastimata: caso atteso bassa/programmata. Nessun falso 112/PS. Primo tentativo Playwright fallito su criterio `farmaco`, retry passato: variabilità da monitorare. |
| ORTO_02_LOMBALGIA_CAUDA_EQUINA_RED_FLAG | PASS CLINICO-FUNZIONALE | PASS | Neurochirurgia | Valutazione e gestione urgente di sindrome della cauda equina | Emergenza medica: accesso immediato al Pronto Soccorso | Dolore lombare severo, irradiazione bilaterale, difficoltà a urinare, anestesia a sella, debolezza arti inferiori, esordio acuto | 14805.854 ms | Output urgente corretto; non formula diagnosi certa. Nota minore: specialista come Neurochirurgo invece di branca esplicita emergenza neuro-ortopedica/PS, ma PS immediato è chiaro. |
| ORTO_03_TRAUMA_GINOCCHIO_SOSPETTA_LESIONE_LEGAMENTOSA | WARNING | PASS | Ortopedia e Traumatologia | Trauma distorsivo ginocchio con sospetta lesione legamentosa/meniscale | Prioritaria | Crack, gonfiore acuto, difficoltà a piegare, cedimento/instabilità, dolore all'appoggio | 8720.971 ms | Triage coerente e nessun 112 automatico. Warning per testo operativo su ghiaccio/riposo/fasciatura e fonti non pertinenti `Low back pain and sciatica`; mancano red flag negative strutturate nel campo red flag. |
| ORTO_04_SPALLA_CRONICA_CUFFIA_POSSIBILE | WARNING | PASS | Ortopedia | Dolore cronico spalla destra, possibile tendinopatia o capsulite | Non urgente / visita programmata a breve | Assenza trauma, deformità, formicolii, febbre | 10941.289 ms | Urgenza corretta e nessun 112/PS. Warning per specializzazione non abbastanza esplicita su spalla/cuffia/impingement e fonti non pertinenti `Low back pain and sciatica`. |
| ORTO_05_TRAUMA_CAVIGLIA_FRATTURA_SOSPETTA_URGENTE | PASS CLINICO-FUNZIONALE | PASS | Ortopedia e Traumatologia | Trauma acuto caviglia con sospetta frattura/lussazione e potenziale compromissione neurovascolare | Alta / urgente: accesso immediato al Pronto Soccorso | Caduta, dolore forte, gonfiore importante, deformità, impossibilità di carico, dita fredde/pallide | 10675.470 ms | Urgenza corretta. Warning residuo non bloccante sulle fonti: compare `Low back pain and sciatica`, non pertinente alla caviglia. |

## Conteggio

- Casi eseguiti: 5/5
- PASS CLINICO-FUNZIONALE: 2
- WARNING: 3
- FAIL CLINICO-FUNZIONALE: 0
- FAIL TECNICO VALIDATORE: 0
- NON VALUTABILE - BLOCCO INFRASTRUTTURALE: 0
- HTTP Gemini: 200 in 5/5 raw output
- `area_specialistica_piu_adatta`: presente in 5/5 casi
- Falsi negativi su cauda equina/frattura-lussazione urgente/compromissione vascolare: 0
- Falsi 112/PS su lombalgia meccanica, spalla cronica o ginocchio stabile: 0

## Esito criteri minimi

Il Batch 04 non supera il criterio minimo di almeno 4/5 PASS CLINICO-FUNZIONALI: risultato attuale 2/5 PASS, 3 WARNING, 0 FAIL.

La criticità principale è qualitativa, non infrastrutturale:

1. `ORTO_01`: overtriage da `bassa/programmata` a `prioritaria`.
2. `ORTO_03`: testo operativo su ghiaccio/riposo/fasciatura e fonti non pertinenti.
3. `ORTO_04` e `ORTO_05`: fonti non pertinenti alla sede anatomica, soprattutto ricorso a `Low back pain and sciatica` per spalla/caviglia.

## Raccomandazione

Non procedere a Dermatologia prima di correggere i WARNING ortopedici, in particolare:

- distinguere lombalgia meccanica stabile senza red flag da urgenze rachidee;
- evitare consigli pratici che possano sembrare prescrizioni o terapia;
- migliorare il mapping fonti per ginocchio, spalla e caviglia;
- mantenere l'escalation forte per cauda equina e trauma caviglia con segni vascolari.

## Artefatti

- `artifacts/raw-output/staging-chromium-desktop-ORTO_01_LOMBALGIA_MECCANICA_NON_URGENTE.json`
- `artifacts/raw-output/staging-chromium-desktop-ORTO_02_LOMBALGIA_CAUDA_EQUINA_RED_FLAG.json`
- `artifacts/raw-output/staging-chromium-desktop-ORTO_03_TRAUMA_GINOCCHIO_SOSPETTA_LESIONE_LEGAMENTOSA.json`
- `artifacts/raw-output/staging-chromium-desktop-ORTO_04_SPALLA_CRONICA_CUFFIA_POSSIBILE.json`
- `artifacts/raw-output/staging-chromium-desktop-ORTO_05_TRAUMA_CAVIGLIA_FRATTURA_SOSPETTA_URGENTE.json`
- `artifacts/playwright-results.json`

## Verifiche repository

- `npm run check`: PASS
- `npm run build`: PASS, build statica locale completata in `dist`
- Deploy: non eseguito
