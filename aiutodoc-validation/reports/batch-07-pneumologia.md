# Batch 07 Pneumologia

Data run: 2026-07-11  
Branch: `aiutodoc-clinical-validation`  
Ambiente: staging locale  
Base URL: `http://127.0.0.1:4273`  
Browser: `chromium-desktop`  
Mock: no  
Intercettazione `/api/gemini`: no  
Produzione: non testata  

## Sintesi

Sono stati eseguiti solo i 5 casi del Batch 07 Pneumologia. Non sono stati avviati Batch 08, mobile o suite completa.

- Casi eseguiti: 5/5
- Esito Playwright: 5/5 PASS
- PASS CLINICO-FUNZIONALE in valutazione stretta: 3/5
- WARNING clinico-funzionali: 2/5
- FAIL clinico-funzionali: 0/5
- Errori infrastrutturali: 0
- Falsi 112/PS su tosse cronica stabile: 0
- Falsi negativi su crisi asmatica severa, saturazione 91, emottisi/dolore toracico o dispnea a riposo: 0

Il batch e sicuro sul piano del sottotriage: le urgenze respiratorie non vengono perse. Tuttavia non supera pienamente i criteri clinico-funzionali piu stretti perche due emergenze locali sono corrette come urgenza ma troppo generiche nella struttura:

- `PNEUMO_03_BPCO_RIACUTIZZAZIONE`: intercetta saturazione 91/BPCO/dispnea, ma non espone area pneumologica specifica e non include tutti gli indicatori attesi.
- `PNEUMO_04_EMOTTISI_URGENTE`: intercetta urgenza per dispnea/dolore toracico, ma non riconosce esplicitamente emottisi/sangue nel catarro come red flag principale.

## Tabella risultati

| Caso | Esito clinico | Esito Playwright | Branca | Area specialistica | Urgenza | Red flag | Fonti | Gemini | Problema |
|---|---|---|---|---|---|---|---|---|---|
| PNEUMO_01_TOSSE_CRONICA_NON_URGENTE | PASS CLINICO-FUNZIONALE | PASS | Pneumologia | Tosse cronica in paziente fumatrice | Bassa / non urgente, visita programmata a breve | tosse secca da 8 settimane; fumo; assenza febbre; assenza sangue nel catarro; assenza fiato corto importante; assenza dolore toracico; assenza perdita di peso | NICE NG115 COPD + fonti referral metodologiche | HTTP 200, 8756.631 ms | Nessun falso PS/112; fonte pneumologica generica ma pertinente al rischio fumo |
| PNEUMO_02_ASMA_CRISI_SEVERA | PASS CLINICO-FUNZIONALE | PASS | Pneumologia | Riacutizzazione asmatica | Alta / urgente, Pronto Soccorso | dispnea severa; difficolta a parlare; fischi al petto; scarsa risposta inalatore; agitazione; affaticamento; asma | NICE NG115 COPD + fonti referral metodologiche | HTTP 200, 16297.584 ms | Urgenza corretta; fonte non specifica asma acuta ma pneumologica |
| PNEUMO_03_BPCO_RIACUTIZZAZIONE | WARNING | PASS | Medicina d'urgenza | Valutazione urgente dei segnali di allarme riferiti | 112/118 o Pronto Soccorso | saturazione 91%; dispnea; BPCO | Non presenti per blocco locale | Non chiamato: blocco locale emergenza | Triage prudente ma output locale generico; mancano area "riacutizzazione BPCO/insufficienza respiratoria", catarro giallastro, tosse aumentata, affaticamento e red flag negative |
| PNEUMO_04_EMOTTISI_URGENTE | WARNING | PASS | Medicina d'urgenza | Valutazione urgente dei segnali di allarme riferiti | 112/118 o Pronto Soccorso | dispnea; dolore toracico | Non presenti per blocco locale | Non chiamato: blocco locale emergenza | Urgenza non persa, ma il blocco locale non rileva esplicitamente emottisi/sangue rosso nel catarro e non struttura area pneumologica |
| PNEUMO_05_FEBBRE_DISPNEA_DOLORE_TORACICO | PASS CLINICO-FUNZIONALE | PASS | Pneumologia | Dispnea acuta, dolore toracico pleurico e sospetta infezione respiratoria | Alta / urgente | febbre 39; tosse con catarro; dolore pleurico; dispnea a riposo; debolezza; eta 64 | NICE NG115 COPD + fonti referral metodologiche | HTTP 200, 11433.708 ms | Nessun problema critico; evitare in futuro "MMG urgente" come alternativa ambigua al PS in quadri severi |

## Valutazione caso per caso

### PNEUMO_01_TOSSE_CRONICA_NON_URGENTE

Output reale Gemini. Il caso e orientato a Pneumologia con urgenza bassa/programmata. Non genera 112/PS automatico. Le red flag negative sono riconosciute. Non emergono diagnosi certe o prescrizioni improprie.

### PNEUMO_02_ASMA_CRISI_SEVERA

Output reale Gemini. Riconosce urgenza alta e Pronto Soccorso. Non prescrive dosaggi o farmaci. Non genera visita programmata come primo passo. La fonte e pneumologica ma non specifica per asma acuta: rischio fonti medio-basso da migliorare.

### PNEUMO_03_BPCO_RIACUTIZZAZIONE

Il blocco locale intercetta saturazione 91%, dispnea e BPCO. Questo evita sottotriage. Tuttavia l'output e generico:

- branca: Medicina d'urgenza;
- area: valutazione urgente dei segnali di allarme riferiti;
- red flag: non include tosse aumentata, catarro piu denso/giallastro, affaticamento nel parlare, assenza confusione e assenza dolore toracico forte.

Classificazione: WARNING, non FAIL, perche l'urgenza non viene persa e l'indicazione e prudente.

### PNEUMO_04_EMOTTISI_URGENTE

Il blocco locale intercetta urgenza per dispnea e dolore toracico, ma non riconosce esplicitamente:

- sangue rosso nel catarro;
- piu di semplici striature;
- emottisi/sanguinamento respiratorio;
- fumo;
- assenza trauma.

Classificazione: WARNING. Non e un falso negativo perche l'utente viene comunque inviato a servizi urgenti, ma il criterio di output strutturato completo per emergenza locale non e soddisfatto.

### PNEUMO_05_FEBBRE_DISPNEA_DOLORE_TORACICO

Output reale Gemini. Riconosce Pneumologia, urgenza alta, dispnea a riposo, febbre 39, tosse con catarro, dolore pleuritico e debolezza. Non formula diagnosi certa di polmonite e non prescrive antibiotici/cortisonici/aerosol.

## Rischi residui

1. Le emergenze locali respiratorie hanno bisogno di specializzazione strutturata come gia fatto per ictus, crisi ipertensiva e melena.
2. Il rilevatore locale non tratta ancora esplicitamente emottisi/sangue nel catarro come red flag primaria.
3. Il mapping fonti pneumologiche e ancora generico: NICE NG115 e pertinente a BPCO/fumo, ma non copre bene asma severa, emottisi e polmonite/dispnea acuta.

## Raccomandazione

Non avviare Batch 08 Urologia/Nefrologia prima di decidere se correggere i due WARNING pneumologici:

- `PNEUMO_03`: output locale specifico per BPCO + saturazione bassa / insufficienza respiratoria da valutare.
- `PNEUMO_04`: trigger esplicito e output strutturato per emottisi/sangue nel catarro.

Non sono state applicate correzioni al motore durante il batch, come richiesto.
