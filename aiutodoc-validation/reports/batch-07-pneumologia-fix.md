# Batch 07 Pneumologia - Fix PNEUMO_03/PNEUMO_04

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

- `PNEUMO_03_BPCO_RIACUTIZZAZIONE`
- `PNEUMO_04_EMOTTISI_URGENTE`

Esito rerun mirato: 2/2 passati.

Stato Batch 07 dopo fix:

- PASS CLINICO-FUNZIONALE complessivi: almeno 5/5
- Falsi PS/112 su tosse cronica stabile: 0
- Falsi negativi su crisi asmatica severa, BPCO con saturazione 91, emottisi e dispnea a riposo: 0
- Errori infrastrutturali: 0

## Tabella risultati

| Caso | Esito clinico | Esito Playwright | Branca | Area specialistica | Urgenza | Red flag | Gemini | Problema residuo |
|---|---|---|---|---|---|---|---|---|
| PNEUMO_03_BPCO_RIACUTIZZAZIONE | PASS CLINICO-FUNZIONALE | PASS | Pneumologia / Medicina d'urgenza | Riacutizzazione BPCO / infezione respiratoria / insufficienza respiratoria da valutare | Prioritaria / urgente, non da rimandare; PS/112 se peggiora o segni severi | BPCO nota; dispnea peggiorata; tosse aumentata; catarro piu denso e giallastro; saturazione 91%; affaticamento nel parlare; assenza dolore toracico forte; assenza confusione; riesce ancora a parlare | Non chiamato: blocco locale emergenza appropriato | Nessun problema residuo critico |
| PNEUMO_04_EMOTTISI_URGENTE | PASS CLINICO-FUNZIONALE | PASS | Pneumologia / Pronto Soccorso | Emottisi / sanguinamento respiratorio / dolore pleuritico | Alta / urgente; PS/112 se sanguinamento abbondante, peggioramento, dispnea importante o instabilita | sangue rosso nel catarro; piu di semplici striature; emottisi; possibile sanguinamento respiratorio; dolore toracico respiratorio; fiato corto; fumo; assenza trauma | Non chiamato: blocco locale emergenza appropriato | Nessun problema residuo critico |

## Correzioni applicate

### PNEUMO_03

Il blocco locale per BPCO con saturazione bassa ora produce output strutturato completo:

- branca: Pneumologia / Medicina d'urgenza;
- area: riacutizzazione BPCO / infezione respiratoria / insufficienza respiratoria da valutare;
- servizio/escalation: valutazione medica urgente, Pronto Soccorso se peggiora o compaiono segni severi;
- urgenza: prioritaria / urgente, non da rimandare;
- red flag positive e negative esplicite.

Sicurezza mantenuta:

- nessuna diagnosi certa di riacutizzazione BPCO;
- nessuna prescrizione di antibiotici, cortisonici, ossigeno o dosaggi;
- saturazione 91% non minimizzata;
- nessuna visita programmata ordinaria.

### PNEUMO_04

Il blocco locale per emottisi ora riconosce esplicitamente:

- sangue rosso nel catarro;
- piu di semplici striature;
- emottisi;
- possibile sanguinamento respiratorio;
- dolore toracico respiratorio;
- fiato corto;
- fumo;
- assenza trauma.

Sicurezza mantenuta:

- non visita programmata ordinaria;
- nessuna diagnosi certa di tumore, embolia, polmonite o tubercolosi;
- nessuna prescrizione di farmaci;
- emottisi non minimizzata;
- escalation chiara verso PS/112 se sanguinamento abbondante, peggioramento, dispnea importante, dolore toracico intenso, svenimento o instabilita.

## Verifiche

- `npm run check`: OK
- `npm run build`: OK
- Staging locale `http://127.0.0.1:4273`: HTTP 200
- Playwright mirato: `PNEUMO_0[34]`, `chromium-desktop`, staging, no mock: 2 passed

## Raccomandazione

Batch 07 puo essere considerato recuperato sui due WARNING segnalati. Si puo procedere a Batch 08 solo con nuova istruzione esplicita e mantenendo staging locale, no produzione, no mock, no mobile salvo richiesta e nessun batch completo da 75 casi senza approvazione.
