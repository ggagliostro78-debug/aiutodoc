# ANEMIA_01 - prova timeout proxy Gemini

## Esito sintetico

- Environment: `staging`
- Base URL: `http://127.0.0.1:4273`
- Browser: `chromium-desktop`
- Mock: no
- Intercettazione `/api/gemini`: no
- Timeout proxy configurato: `90000 ms`
- Status `/api/gemini`: `HTTP 200`
- Output finale completo e renderizzato: **si**
- Esito clinico-funzionale: **FAIL CLINICO-FUNZIONALE**
- Errore infrastrutturale: **no**
- Errore UI/test: **si**, asserzione sull'urgenza esplicita non soddisfatta

## Tempi misurati

- Avvio comando: `2026-07-08T00:43:19.8607498+02:00`
- `started_at` Playwright: `2026-07-08T00:43:22.993+02:00`
- `completed_at` Playwright: `2026-07-08T00:45:21.764+02:00`
- `total_duration_ms`: `118771`
- Avvio `/api/gemini`: `2026-07-08T00:43:37.635+02:00`
- Completamento `/api/gemini`: `2026-07-08T00:43:45.201+02:00`
- Durata `/api/gemini`: `7565.861 ms`
- Tempo di attesa rete Gemini rilevato dalla trace: `7564.385 ms`

La durata totale include intervista UI, attese del flusso, ricerca specialisti, acquisizione screenshot/trace e gestione del fallimento Playwright; non rappresenta la sola latenza Gemini.

## Risultato funzionale

Aspetti corretti nell'output reale:

- specialista: `Medico di Medicina Generale`;
- nessun falso allarme 112/Pronto Soccorso;
- sintesi completa;
- suggerito eventuale approfondimento ginecologico per mestruazioni abbondanti;
- assenze di dolore toracico, svenimenti e sangue nelle feci presenti nella sintesi e nella nota MMG.

Aspetti non conformi:

- il campo urgenza mostra `Urgenza da definire con il medico` invece di `non urgente / visita programmata a breve`;
- le tre red flag negative non sono presenti nel campo strutturato `red_flags_rilevate`, che risulta vuoto;
- Playwright fallisce sull'asserzione dell'urgenza esplicita.

Il fallimento e quindi clinico-funzionale/strutturale, non dovuto a 429, 503, timeout, AbortController, proxy error o mancato rendering UI.

## Valutazione del timeout

Il passaggio da 45 a 90 secondi ha consentito alla richiesta di completarsi, ma questa singola misura ha registrato soltanto `7.566 s` per `/api/gemini`. Non dimostra che siano necessari 90 secondi in condizioni normali; conferma invece che il precedente abort oltre 45 secondi era intermittente.

**Timeout finale raccomandato: 75 secondi.**

Motivazione: offre 30 secondi di margine rispetto al precedente limite che ha prodotto l'abort, mantenendo un limite inferiore a 90 secondi per contenere occupazione delle connessioni e attese dell'utente. Prima di applicarlo stabilmente servono piu campioni di latenza reali; non aumentare oltre 90 secondi. In parallelo va ottimizzata la pipeline per ridurre variabilita e distinguere chiaramente timeout upstream da errori clinico-funzionali.

## Artefatti

- Output reale: `artifacts/raw-output/staging-chromium-desktop-ANEMIA_01.json`
- Risultato Playwright: `artifacts/playwright-results.json`
- Trace usata per la misura: `artifacts/test-results/aiutodoc-orientation-Valid-29e33----orientamento-e-sicurezza-chromium-desktop/trace.zip`

