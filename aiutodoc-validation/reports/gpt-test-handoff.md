# Handoff GPT - completamento mini-test staging AIutoDoc

## Obiettivo

Completare esclusivamente i tre casi clinico-funzionali rimasti sul branch parallelo `aiutodoc-clinical-validation`, senza modificare `main`, senza mock, senza intercettare `/api/gemini` e senza deploy in produzione.

## Stato verificato

- Data: 7 luglio 2026, fuso Europe/Rome.
- Branch: `aiutodoc-clinical-validation`.
- Commit branch: `3e19353339b9121034fe1ed5c0a20cf3c3df1942`.
- Commit `main` invariato: `f776bae225406bd05df9bbb95828ebefe0e16e81`.
- Staging locale separato: `http://127.0.0.1:4273`.
- Chiave API presente e corrispondente al progetto; non riportarla mai in output, log o commit.
- Una richiesta minima ha inizialmente confermato che autenticazione ed endpoint funzionano.
- Stato attuale upstream: `HTTP 429 RESOURCE_EXHAUSTED`.
- Quota indicata da Google: `GenerateRequestsPerDayPerProjectPerModel-FreeTier`, limite 20, modello `gemini-2.5-flash`.
- Il proxy traduce il 429 upstream in `503 GEMINI_UNAVAILABLE` per la UI.
- Non classificare questi errori infrastrutturali come PASS, WARNING clinico o FAIL clinico.

## Istruzioni per GPT

1. Verifica che la quota sia stata ripristinata o che il progetto risulti realmente nel Paid Tier.
2. Avvia lo staging soltanto dal branch `aiutodoc-clinical-validation`.
3. Esegui una sola sonda minima. Se restituisce ancora 429/503, fermati e segnala il blocco senza avviare Playwright.
4. Se la sonda restituisce 200, esegui i tre casi sotto su `chromium-desktop` e `chromium-mobile`.
5. Non usare mock, fallback clinico locale o route interception per `/api/gemini`.
6. Conserva output reali, screenshot e `playwright-results.json`.
7. Rigenera il report clinico soltanto con output reali.
8. Non lanciare i 75 casi, non fare merge, push o deploy.

## Casi da completare

### ANEMIA_01

Input:

> Sono una donna di 34 anni. Da circa 2 mesi mi sento molto stanca, faccio fatica a concentrarmi, ho le unghie fragili e mi sembra di perdere piu capelli del solito. Ho mestruazioni abbondanti. Non ho dolore al petto, non ho svenimenti, non ho sangue nelle feci.

Criteri:

- Urgenza: `non urgente / visita programmata a breve`.
- Specialista: Medico di Medicina Generale o Internista.
- Eventuale Ginecologo se rilevanti le mestruazioni abbondanti.
- Indicatori negativi espliciti: assenza di dolore toracico, assenza di svenimenti, assenza di sangue nelle feci.
- Nessun 112 o Pronto Soccorso automatico.
- Nessuna diagnosi certa di anemia e nessuna prescrizione di ferro.

### CELIACHIA_02

Input:

> Bambino di 8 anni. Da un anno cresce poco, e spesso stanco, ha mal di pancia ricorrente e feci molli. La pediatra ha detto che potrebbe essere stress, ma in famiglia c'e una zia con celiachia.

Criteri:

- Non deve essere respinto come testo casuale.
- Urgenza: non Pronto Soccorso, ma valutazione pediatrica/gastroenterologica non da rimandare.
- Specialista: Pediatra o Gastroenterologo pediatrico.
- Indicatori: crescita rallentata, stanchezza cronica, dolore addominale ricorrente, feci molli, familiarita per celiachia.
- Non suggerire dieta senza glutine prima degli accertamenti, salvo indicazione medica.
- Fonte pertinente: NICE NG20 `Coeliac disease: recognition, assessment and management`.
- Non usare `Fever in under 5s` come fonte per questo caso.

### COVID_01

Input:

> Ho 41 anni, febbre 37,8, mal di gola, naso chiuso, tosse leggera e dolori muscolari da ieri. Ho fatto un tampone ed e positivo al COVID. Respiro bene, saturazione 98, non ho patologie importanti.

Criteri:

- Specialista: Medico di Medicina Generale.
- Urgenza bassa e gestione/monitoraggio domiciliare informativo.
- Nessun 112 o Pronto Soccorso automatico.
- Nessuna prescrizione di antibiotico.
- Il disclaimer generico non deve essere classificato come emergenza.

## Comando Playwright

Da `aiutodoc-validation`, con lo staging gia attivo:

```powershell
$env:AIUTODOC_ENV='staging'
$env:AIUTODOC_BASE_URL='http://127.0.0.1:4273'
node node_modules/@playwright/test/cli.js test --config playwright.config.ts --grep "ANEMIA_01|CELIACHIA_02|COVID_01"
```

Su un percorso UNC, se `npm` cambia directory in `C:\Windows`, usare percorsi assoluti UNC per lo script Playwright e per `playwright.config.ts`.

## Artefatti attesi

- `artifacts/raw-output/staging-chromium-desktop-*.json`
- `artifacts/raw-output/staging-chromium-mobile-*.json`
- `artifacts/screenshots-staging/*.png`
- `artifacts/playwright-results.json`
- `reports/clinical-functional-report.md`

## Criterio conclusivo

Un caso puo essere chiamato **PASS CLINICO-FUNZIONALE** soltanto se deriva da un output reale del motore AiutoDoc in staging. Un output mocked puo essere esclusivamente **PASS TECNICO**. In assenza di risposta reale, riportare `NON VALUTABILE - BLOCCO INFRASTRUTTURALE`.
