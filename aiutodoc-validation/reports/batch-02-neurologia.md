# Batch 02 Neurologia - validazione clinico-funzionale

## Ambiente e sicurezza

- Data run: `2026-07-09`
- Branch: `aiutodoc-clinical-validation`
- Commit testato: commit corrente del branch contenente le fixture Batch 02
- Base URL: `http://127.0.0.1:4273`
- Ambiente: `staging`
- Browser: `chromium-desktop`
- Timeout proxy: `75000 ms`
- Mock: no
- Intercettazione `/api/gemini`: no
- Fallback clinico locale per falsare i test: no
- Mobile, 75 casi, altri batch: non eseguiti
- Produzione/live pubblico: non testati
- Merge, push, PR, deploy produzione: nessuno
- CSS, grafica, layout, UX, documenti legali, database, Netlify e produzione: non modificati

## Risultati

| Caso | Esito clinico | Esito Playwright | Branca | Area specialistica | Urgenza | Red flag | Durata /api/gemini | Problema |
|---|---|---|---|---|---|---|---:|---|
| NEURO_01_CEFALEA_RICORRENTE_NON_URGENTE | PASS CLINICO-FUNZIONALE | PASS | Neurologia / Neurologo | Valutazione e gestione di cefalea ricorrente | Non urgente / visita programmata a breve | Cefalea ricorrente e fotofobia in sintesi; assenza febbre, rigidita nucale, deficit motori, disturbi linguaggio, confusione e traumi | 13496.507 ms, HTTP 200 | Output prudente; escalation condizionale specifica non dettagliata, coperta solo dal disclaimer generale |
| NEURO_02_CEFALEA_RED_FLAG_URGENTE | PASS CLINICO-FUNZIONALE | PASS | Neurologia / Neurologo | Cefalea acuta severa con sintomi neurologici associati | Alta / urgente; Pronto Soccorso immediato | Peggior mal di testa della vita, esordio improvviso, vomito, confusione, difficolta a tenere gli occhi aperti | 12169.389 ms, HTTP 200 | Clinicamente urgente e sicuro; non riporta `112/118` letterale, ma indica PS immediato |
| NEURO_03_PARESTESIE_RICORRENTI_NON_URGENTI | PASS CLINICO-FUNZIONALE | PASS | Neurologia / Neurologo | Parestesie intermittenti e dolore cervicale; secondo livello Fisiatria/Ortopedia | Non urgente / visita programmata a breve | Formicolii mani-piedi e dolore cervicale in sintesi; assenza forza, linguaggio, visione doppia e disturbi sfinterici | 7722.741 ms, HTTP 200 | Nessun falso 112/PS; escalation condizionale specifica non dettagliata |
| NEURO_04_SOSPETTO_ICTUS_FAST | WARNING | PASS | Neurologia / Neurologo | Evento cerebrovascolare acuto | Alta / urgente; struttura di emergenza immediata | Bocca storta, difficolta braccio destro, linguaggio confuso, esordio acuto, pressione alta, fibrillazione atriale | 10101.489 ms, HTTP 200 | Riconosce urgenza immediata, ma manca indicazione esplicita `112/118` e area `stroke unit`; specialist field resta generico `Neurologo` |
| NEURO_05_PRIMA_CRISI_CONVULSIVA_RISOLTA | PASS CLINICO-FUNZIONALE | PASS | Neurologia / Neurologo | Episodio sincopale/crisi epilettica di nuova insorgenza | Alta / urgente; valutazione non da rimandare | Perdita di conoscenza, caduta, scosse, confusione post-critica, primo episodio | 11417.293 ms, HTTP 200 | Non genera 112 automatico mentre ora risolto; corretta indicazione rapida. Escalation condizionale PS/112 non dettagliata |

## Sintesi batch

- Casi eseguiti: `5/5`
- PASS CLINICO-FUNZIONALE: `4`
- WARNING: `1`
- FAIL CLINICO-FUNZIONALE: `0`
- FAIL TECNICO VALIDATORE: `0`
- NON VALUTABILE - BLOCCO INFRASTRUTTURALE: `0`
- Playwright: `5 PASS`, `0 FAIL`
- Errori 429/503/timeout/AbortController/proxy/net::ERR_NO_BUFFER_SPACE: `0`
- Area specialistica presente: `5/5`
- Falsi 112/PS su casi non acuti: `0`
- Falsi negativi di urgenza neurologica: `0` in senso stretto; `NEURO_04` resta WARNING per canale emergenza non abbastanza esplicito (`112/118` assente).

## Valutazione clinico-funzionale

Il batch supera la soglia numerica minima di `4/5 PASS` e non presenta errori infrastrutturali. I casi non urgenti non vengono spinti automaticamente verso 112/PS. I casi urgenti vengono riconosciuti come tali, ma `NEURO_04` richiede correzione metodologica prima di considerare robusto il ramo FAST/ictus: per un sospetto ictus tempo-dipendente deve comparire chiaramente `112/118` e idealmente `stroke unit`, non solo "struttura di emergenza".

## Sicurezza medico-legale

- Nessun output formula una diagnosi certa conclusiva.
- Nessun output prescrive farmaci, dosaggi o terapie.
- NEURO_02 consiglia PS immediato e sconsiglia guida/farmaci prima della valutazione.
- NEURO_04 riconosce emergenza, ma deve essere reso piu esplicito sul canale 112/118.
- NEURO_05 non banalizza come stress/ansia e non prescrive antiepilettici.

## Artefatti

- `artifacts/raw-output/staging-chromium-desktop-NEURO_01_CEFALEA_RICORRENTE_NON_URGENTE.json`
- `artifacts/raw-output/staging-chromium-desktop-NEURO_02_CEFALEA_RED_FLAG_URGENTE.json`
- `artifacts/raw-output/staging-chromium-desktop-NEURO_03_PARESTESIE_RICORRENTI_NON_URGENTI.json`
- `artifacts/raw-output/staging-chromium-desktop-NEURO_04_SOSPETTO_ICTUS_FAST.json`
- `artifacts/raw-output/staging-chromium-desktop-NEURO_05_PRIMA_CRISI_CONVULSIVA_RISOLTA.json`
- `artifacts/playwright-results.json`

## Raccomandazione

Non ho avviato Psicologia, Ortopedia o Dermatologia. Prima del Batch 03 consiglio una correzione circoscritta per `NEURO_04`: sospetto FAST/ictus con bocca storta, deficit braccio e linguaggio confuso deve produrre output strutturato da emergenza neurologica con `112/118`, `Pronto Soccorso` e `stroke unit`.
