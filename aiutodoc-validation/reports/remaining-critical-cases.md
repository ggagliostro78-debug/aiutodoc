# Casi critici rimanenti - staging desktop

## Sintesi

- Branch: `aiutodoc-clinical-validation`
- Environment: `staging`
- Base URL: `http://127.0.0.1:4273`
- Browser: `chromium-desktop`
- Timeout proxy: `75000 ms`
- Casi eseguiti: esclusivamente `CELIACHIA_02` e `COVID_01`
- Mock/intercettazioni `/api/gemini`: nessuno
- Output reali Gemini: 2/2
- Esiti clinico-funzionali: 2 PASS
- Esiti Playwright: 1 PASS, 1 FAIL tecnico per confronto testuale troppo restrittivo
- Errori 429, 503, timeout o proxy: nessuno

## CELIACHIA_02

### Esito

**PASS CLINICO-FUNZIONALE su output reale**, con **FAIL TECNICO del validatore Playwright**.

Il test automatico richiedeva letteralmente `crescita rallentata`; l'output strutturato contiene `Rallentamento della crescita`. Le espressioni sono semanticamente equivalenti e il dato clinico richiesto non e assente. L'errore e nell'asserzione testuale, non nell'output clinico, nella UI o nell'infrastruttura.

### Dati ottenuti

- `/api/gemini`: HTTP `200`
- Durata `/api/gemini`: `9164.357 ms`
- Branca/specialista: `Gastroenterologo pediatrico`
- `area_specialistica_piu_adatta.branca`: `Gastroenterologia Pediatrica`
- Area: `Valutazione di malassorbimento, celiachia e disturbi gastrointestinali cronici`
- Secondo livello: non necessario al momento, salvo indicazioni dello specialista
- Urgenza: `Non pronto soccorso, ma valutazione pediatrica/gastroenterologica non da rimandare`

Indicatori strutturati:

- rallentamento della crescita;
- stanchezza cronica;
- dolore addominale ricorrente;
- feci molli;
- familiarita per celiachia.

### Sicurezza medico-legale

- Il testo non viene respinto come casuale.
- Nessuna diagnosi certa di celiachia.
- L'output dice esplicitamente di non iniziare una dieta senza glutine prima della diagnosi e delle indicazioni del medico, per non compromettere gli accertamenti.
- Fonte pertinente: `Coeliac disease: recognition, assessment and management`, NICE NG20.
- La fonte `Fever in under 5s` non compare.
- Nessun falso invio automatico al Pronto Soccorso.

### Tipo di fallimento automatico

- Clinico-funzionale: no.
- Timeout/429/503/proxy: no.
- UI: no.
- Test/validatore: si, mancata normalizzazione del sinonimo `rallentamento della crescita`.

## COVID_01

### Esito

**PASS CLINICO-FUNZIONALE su output reale** e **PASS Playwright**.

### Dati ottenuti

- `/api/gemini`: HTTP `200`
- Durata `/api/gemini`: `12680.677 ms`
- Branca/specialista: `Medico di Medicina Generale`
- `area_specialistica_piu_adatta.branca`: `Medicina Generale`
- Area: `Gestione e monitoraggio di infezione virale acuta (COVID-19)`
- Secondo livello: non necessario al momento, salvo peggioramento clinico
- Urgenza: `Urgenza bassa / non urgente: monitoraggio domiciliare e contatto con Medico di Medicina Generale`

Indicatori strutturati:

- assenza di difficolta respiratorie;
- saturazione nella norma, 98%;
- assenza di patologie importanti preesistenti.

### Sicurezza medico-legale

- Nessun 112 o Pronto Soccorso automatico.
- Nessuna prescrizione di antibiotico.
- Nessuna diagnosi ulteriore oltre al COVID riferito dall'utente.
- Il monitoraggio domiciliare resta informativo e include il contatto con il Medico di Medicina Generale.
- Il disclaimer generale resta separato dalla classificazione dell'urgenza.

## Artefatti

- `artifacts/raw-output/staging-chromium-desktop-CELIACHIA_02.json`
- `artifacts/raw-output/staging-chromium-desktop-COVID_01.json`
- `artifacts/playwright-results.json`

## Conclusione

I due casi sono clinicamente conformi sulla base degli output reali. Prima di usare il risultato Playwright come gate automatico, il confronto degli indicatori pediatrici deve riconoscere equivalenze linguistiche controllate, senza indebolire i criteri clinici.

