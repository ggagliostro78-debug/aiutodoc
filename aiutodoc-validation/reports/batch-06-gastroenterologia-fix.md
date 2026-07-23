# Batch 06 Gastroenterologia - Fix GASTRO_01/GASTRO_02

Data run: 2026-07-11  
Branch: `aiutodoc-clinical-validation`  
Ambiente: staging locale  
Base URL: `http://127.0.0.1:4273`  
Browser: `chromium-desktop`  
Mock: no  
Intercettazione `/api/gemini`: no  
Produzione: non testata  

## Sintesi

Sono stati corretti e rilanciati solo:

- `GASTRO_01_REFLUSSO_DISPEPSIA_STABILE`
- `GASTRO_02_MELENA_CAPOGIRI_URGENTE`

Esito rerun mirato: 2/2 passati.

Considerando il batch completo dopo il fix:

- PASS CLINICO-FUNZIONALE complessivi: almeno 5/5
- Falsi 112/PS su reflusso/dispepsia stabile: 0
- Falsi negativi su melena/capogiri/anticoagulanti: 0
- Errori infrastrutturali: 0

## Tabella risultati

| Caso | Esito clinico | Esito Playwright | Branca | Area specialistica | Urgenza | Red flag | Gemini | Problema residuo |
|---|---|---|---|---|---|---|---|---|
| GASTRO_01_REFLUSSO_DISPEPSIA_STABILE | PASS CLINICO-FUNZIONALE | PASS | Gastroenterologia / Medicina generale | Reflusso gastroesofageo / dispepsia / disturbi digestivi superiori | Bassa / visita programmata se persiste o limita la qualita di vita | bruciore retrosternale post-prandiale; rigurgito acido; pesantezza gastrica; peggioramento da sdraiato o dopo pasti tardivi; assenza dolore toracico da sforzo; assenza vomito con sangue; assenza feci nere; assenza calo di peso; assenza disfagia | HTTP 200, 11435.235 ms | Nessun falso PS/112; output reale Gemini normalizzato |
| GASTRO_02_MELENA_CAPOGIRI_URGENTE | PASS CLINICO-FUNZIONALE | PASS | Emergenza gastroenterologica / Pronto Soccorso | Possibile sanguinamento gastrointestinale / melena / rischio emorragico | Alta / immediata: 112/118 o Pronto Soccorso | feci nere o molto scure; debolezza marcata; capogiri ortostatici; pallore e stanchezza; terapia anticoagulante; fibrillazione atriale | Non chiamato: blocco locale emergenza appropriato | Nessun problema residuo critico; output locale strutturato completo |

## Correzioni applicate

### GASTRO_01

Corretto il falso trigger locale su dolore toracico:

- la presenza di `sterno` o `retrosternale` non basta piu ad attivare emergenza se il quadro e chiaramente bruciore/acido/post-prandiale/da decubito;
- sono richieste red flag cardiache o sistemiche non negate per l'escalation locale;
- il quadro stabile di reflusso/dispepsia viene lasciato proseguire al motore reale Gemini.

Normalizzazione finale applicata al contesto stabile:

- specialista: Gastroenterologo; MMG come primo filtro;
- urgenza: bassa/programmata;
- area specialistica: reflusso/dispepsia/disturbi digestivi superiori;
- red flag negative cardiache e gastrointestinali mantenute;
- nessuna diagnosi certa;
- nessuna prescrizione di PPI, antiacidi o farmaci.

### GASTRO_02

Corretto l'output locale per melena/capogiri/anticoagulanti:

- branca: Emergenza gastroenterologica / Pronto Soccorso;
- area: possibile sanguinamento gastrointestinale / melena / rischio emorragico;
- servizio: 112/118 o Pronto Soccorso;
- urgenza: alta/immediata;
- red flag specifiche: feci nere/molto scure, debolezza marcata, capogiri ortostatici, pallore/stanchezza, terapia anticoagulante, fibrillazione atriale.

Sicurezza:

- non visita gastroenterologica programmata;
- non MMG come unico primo passo;
- nessuna diagnosi certa di emorragia digestiva;
- nessuna prescrizione;
- nessuna indicazione di sospendere autonomamente anticoagulanti.

## Verifiche

- JSON `test-cases.json` / `expected-results.json`: OK
- `npm run check`: OK
- `npm run build`: OK
- Staging locale `http://127.0.0.1:4273`: HTTP 200
- Playwright mirato: `GASTRO_0[12]`, `chromium-desktop`, staging, no mock: 2 passed

## Raccomandazione

Batch 06 puo essere considerato recuperato sui problemi segnalati. Si puo procedere al Batch 07 Pneumologia solo mantenendo le stesse regole: staging locale, no produzione, no mock, no mobile se non richiesto, nessun batch completo da 75 casi senza approvazione.
