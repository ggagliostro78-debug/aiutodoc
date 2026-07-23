# Batch 06 Gastroenterologia

Data run: 2026-07-11  
Branch: `aiutodoc-clinical-validation`  
Ambiente: staging locale  
Base URL: `http://127.0.0.1:4273`  
Browser: `chromium-desktop`  
Mock: no  
Intercettazione `/api/gemini`: no  
Produzione: non testata  

## Sintesi

Il Batch 06 ha eseguito 5/5 casi gastroenterologici reali su staging locale.

- PASS CLINICO-FUNZIONALE: 3/5
- WARNING: 1/5
- FAIL CLINICO-FUNZIONALE: 1/5
- Errori infrastrutturali: 0
- Falsi negativi su urgenze GI: 0 rilevati
- Falsi PS/112 su casi non acuti: 1 (`GASTRO_01`)

Il batch non supera pienamente i criteri minimi perché `GASTRO_01_REFLUSSO_DISPEPSIA_STABILE` genera un falso allarme locale 112/PS e `GASTRO_02_MELENA_CAPOGIRI_URGENTE` resta WARNING per output locale urgente corretto ma ancora generico nella struttura.

## Tabella risultati

| Caso | Esito clinico | Esito Playwright | Branca | Area specialistica | Urgenza | Red flag | Durata /api/gemini | Problema |
|---|---|---|---|---|---|---|---:|---|
| GASTRO_01_REFLUSSO_DISPEPSIA_STABILE | FAIL CLINICO-FUNZIONALE | FAIL | Medicina d'urgenza / PS | Valutazione urgente dei segnali di allarme riferiti | 112/118 o Pronto Soccorso | "Dolore toracico riferito" | n/d, blocco locale | Falso PS/112: bruciore retrosternale/acidita da reflusso stabile interpretato come dolore toracico acuto |
| GASTRO_02_MELENA_CAPOGIRI_URGENTE | WARNING | PASS Playwright | Medicina d'urgenza / PS | Valutazione urgente dei segnali di allarme riferiti | 112/118 o Pronto Soccorso | Feci nere/molto scure, capogiri | n/d, blocco locale | Urgenza corretta; output locale da rendere piu specifico per possibile sanguinamento gastrointestinale |
| GASTRO_03_DIARREA_CRONICA_PERDITA_PESO | PASS CLINICO-FUNZIONALE | PASS | Medicina Generale / Medicina Interna con secondo livello Gastroenterologia | Diarrea cronica, calo ponderale involontario e anemia | Prioritaria / non da rimandare | Diarrea cronica, crampi, stanchezza, calo ponderale, anemia | 17186.734 ms | Nessun problema critico; possibile migliorare priorita della branca gastroenterologica rispetto a MMG |
| GASTRO_04_DOLORE_ADDOME_ACUTO_FEBBRE | PASS CLINICO-FUNZIONALE | PASS | Chirurgia Generale | Dolore addominale acuto con febbre e sintomi sistemici | Alta / urgente, Pronto Soccorso | Dolore severo, febbre, nausea, vomito, peggiora col movimento, abbattimento | 8530.689 ms | Triage corretto; fonte specifica di branca in aggiornamento/generica |
| GASTRO_05_STIPSI_CRONICA_SENZA_RED_FLAG | PASS CLINICO-FUNZIONALE | PASS | Gastroenterologia | Stipsi cronica e gonfiore addominale | Non urgente / visita programmata a breve | Assenza dolore forte, vomito, sangue, feci nere, perdita peso, febbre | 11183.944 ms | Triage corretto; fonte CG184 non specifica per stipsi ma accettabile come fonte GI generica |

## Valutazione clinico-funzionale

### GASTRO_01_REFLUSSO_DISPEPSIA_STABILE

Il caso descrive un quadro compatibile con reflusso/dispepsia stabile: bruciore retrosternale e acidita dopo pasti abbondanti o da sdraiata, con assenza di dolore toracico da sforzo, dispnea, ematemesi, melena, calo ponderale e disfagia funzionalmente rilevante.

Errore rilevato: il rilevatore locale di emergenza ha bloccato il caso prima di Gemini e ha prodotto 112/118/PS per "Dolore toracico riferito". Questo e un sovratriage clinico-funzionale.

Correzione consigliata: distinguere esplicitamente:

- dolore toracico acuto/oppressivo/persistente o da sforzo, da inviare in emergenza;
- bruciore retrosternale/acidita post-prandiale o da decubito senza red flag, da orientare a MMG/Gastroenterologia con urgenza bassa o programmata.

### GASTRO_02_MELENA_CAPOGIRI_URGENTE

Il blocco locale e appropriato: feci nere molto scure + capogiri + debolezza + tachicardia + aspirina giustificano orientamento urgente/PS.

Problema residuo: output locale ancora troppo generico:

- branca: dovrebbe indicare emergenza medica/gastroenterologica;
- area specialistica: possibile sanguinamento gastrointestinale/melena;
- red flag: feci nere, capogiri, debolezza, tachicardia, terapia antiaggregante.

### GASTRO_03_DIARREA_CRONICA_PERDITA_PESO

Output reale Gemini con HTTP 200. Orientamento prudente e non diagnostico. Riconosce diarrea cronica, calo ponderale e anemia come elementi prioritari. Non formula diagnosi certa di celiachia o malattia infiammatoria intestinale e non prescrive farmaci.

Nota: la branca ottenuta e MMG/Medicina Interna con Gastroenterologia come secondo livello. Il risultato e clinicamente accettabile, ma per il batch gastro sarebbe preferibile valorizzare Gastroenterologia in modo piu diretto.

### GASTRO_04_DOLORE_ADDOME_ACUTO_FEBBRE

Output reale Gemini con HTTP 200. Urgenza alta corretta, con Pronto Soccorso immediato. Non formula diagnosi certa di appendicite/colecistite. Non prescrive farmaci. Red flag coerenti.

Nota: fonti cliniche ancora metodologiche/generiche per Chirurgia Generale; raccomandato mapping piu pertinente per addome acuto.

### GASTRO_05_STIPSI_CRONICA_SENZA_RED_FLAG

Output reale Gemini con HTTP 200. Urgenza bassa/programmata corretta. Nessun falso PS/112. Nessuna prescrizione di lassativi. Red flag negative strutturate presenti.

Nota: fonte CG184 e GI ma non specifica per stipsi; raccomandato mapping piu pertinente per stipsi cronica/alterazioni alvo senza red flag.

## Raccomandazione

Non procedere al Batch 07 Pneumologia finche non vengono corretti almeno:

1. `GASTRO_01`: evitare falso 112/PS su reflusso/dispepsia stabile con red flag negative.
2. `GASTRO_02`: rendere l'emergenza locale strutturata e specifica per melena/sanguinamento GI, non solo "segnali di allarme riferiti".

Il problema principale non e infrastrutturale: staging e Gemini hanno risposto correttamente nei casi arrivati al motore. Il blocco da risolvere e clinico-funzionale/local-emergency routing.
