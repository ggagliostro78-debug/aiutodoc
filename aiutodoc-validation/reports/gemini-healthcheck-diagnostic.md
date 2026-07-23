# Diagnostica healthcheck Gemini

## Esito

**GEMINI_OK**

## Aggiornamento durante il test staging

- Caso avviato: `ANEMIA_01`, solo `chromium-desktop`.
- Esito: **GEMINI_SERVICE_OR_PROXY_UNAVAILABLE**.
- Risposta UI/proxy: HTTP `503`, codice `20`, `Servizio AI temporaneamente non disponibile`.
- Log upstream: `Gemini API call failed: This operation was aborted`.
- Causa immediata: timeout `AbortController` del proxy dopo 45 secondi durante il prompt clinico completo.
- `CELIACHIA_02` e `COVID_01`: non avviati, in conformita alla regola di arresto al primo errore Gemini.
- Chiamate healthcheck aggiuntive: `0`.

Il precedente `GEMINI_OK` resta valido esclusivamente per il prompt minimo. Non dimostra che il prompt clinico completo termini entro il timeout del proxy.

- Timestamp UTC: `2026-07-07T22:31:02.374Z`
- Timestamp locale Europe/Rome: `2026-07-08 00:31:02`
- Branch: `aiutodoc-clinical-validation`
- Commit: `46acd6c2751cac141d46b9d5e1b0c403477dd565`
- Commit `main` osservato: invariato rispetto alla base protetta
- Ambiente richiesto: `staging`
- `AIUTODOC_ENV` nel processo diagnostico: non impostata
- Base URL richiesta: `http://127.0.0.1:4273`
- `AIUTODOC_BASE_URL` nel processo diagnostico: non impostata
- Variabile chiave presente: `GEMINI_API_KEY` (valore non letto nel report e non salvato)
- Modello: `gemini-2.5-flash`
- Status HTTP upstream: `200`
- `error.status`: `null`
- `error.code`: `null`
- `error.message`: `null`
- Dettagli quota: nessuno nella risposta corrente
- Risposta modello: `OK`
- Classificazione: `GEMINI_OK`

## Endpoint e percorso applicativo

- Endpoint upstream usato, senza API key: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
- Metodo: `POST`
- Prompt: `Rispondi solo OK`
- Numero di chiamate reali Gemini: **1**
- Endpoint UI configurato: `/api/gemini`
- Proxy/backend locale: `scripts/dev-local.js` inoltra `/api/gemini` a `server/gemini_proxy.js`.
- Il proxy applicativo non e stato usato per questa chiamata diagnostica, per evitare i retry automatici e rispettare il limite massimo di una chiamata reale.

## Configurazione e Git

- Il nome della variabile API key e presente in `.env`; nessun valore, prefisso, suffisso o fingerprint e incluso negli artefatti.
- Lo stato paid/billing non e dichiarato dalla configurazione locale e non puo essere verificato offline.
- La risposta HTTP 200 prova che, al momento del controllo, chiave, progetto, modello ed endpoint upstream accettano richieste.
- Il working tree conteneva gia report e artefatti di test non puliti; non sono stati modificati file di `main`, configurazioni di deploy o codice applicativo durante questa diagnosi.

## Ipotesi sulla causa precedente

La causa piu probabile del precedente blocco non e un errore permanente di chiave, modello o endpoint. Le evidenze precedenti mostravano prima un `429 RESOURCE_EXHAUSTED` Free Tier e successivamente un timeout del proxy (`AbortController` a 45 secondi). L'attuale HTTP 200 e coerente con almeno una di queste condizioni:

1. quota ripristinata o passaggio al Paid Tier propagato;
2. indisponibilita/rate limit temporaneo terminato;
3. timeout limitato al prompt clinico completo o al percorso proxy, non alla connettivita Gemini di base.

Il solo healthcheck breve non dimostra ancora che un prompt clinico completo termini entro i 45 secondi imposti dal proxy.

## Azione consigliata successiva

In una nuova esecuzione, effettuare i tre test staging desktop gia approvati (`ANEMIA_01`, `CELIACHIA_02`, `COVID_01`) senza una sonda preliminare aggiuntiva. Se ricompare `503`, acquisire il log upstream distinguendo `429` da timeout/abort. Non modificare `main`, non usare mock e non classificare come PASS un caso privo di output reale.
