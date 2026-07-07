# Report clinico-funzionale reale AIutoDoc

> Contiene esclusivamente output reali del motore in staging/live; richiede comunque revisione clinica.

- Data test: 2026-07-07T13:45:31.531Z
- Versione ambiente: staging
- URL testata: http://127.0.0.1:4273/

## Sintesi

| Casi totali | PASS CLINICO-FUNZIONALE | WARNING | FAIL | Media punteggio |
|---:|---:|---:|---:|---:|
| 3 | 3 | 0 | 0 | 8.0 |

## ANEMIA_02

- Environment: staging
- Input: Uomo di 62 anni. Da alcune settimane sono molto debole, ho fiato corto anche facendo pochi passi, battito accelerato e negli ultimi giorni ho notato feci molto scure. Ieri ho avuto capogiri forti.
- Output AIutoDoc: Le informazioni inserite contengono possibili segnali di urgenza: contatta subito il 112/118 o recati al Pronto Soccorso. Questo avviso non è una diagnosi.<br>Motivazione dell'urgenza:<br>Difficoltà respiratoria o dispnea riferita<br>Possibile sanguinamento o feci scure/molto scure riferite<br>Tachicardia o battito accelerato riferito<br>Capogiri riferiti<br>15:45
- Branca attesa: pronto soccorso, urgenza, 112, medico urgente
- Branca ottenuta: pronto soccorso, urgenza, 112
- Urgenza attesa: alta / urgente
- Urgenza ottenuta: Le informazioni inserite contengono possibili segnali di urgenza: contatta subito il 112/118 o recati al Pronto Soccorso. Questo avviso non è una diagnosi.<br>Motivazione dell'urgenza:<br>Difficoltà respiratoria o dispnea riferita<br>Possibile sanguinamento o feci scure/molto scure riferite<br>Tachicardia o battito accelerato riferito<br>Capogiri riferiti<br>15:45
- Motivazione urgenza: Le informazioni inserite contengono possibili segnali di urgenza: contatta subito il 112/118 o recati al Pronto Soccorso. Questo avviso non è una diagnosi.<br>Motivazione dell'urgenza:<br>Difficoltà respiratoria o dispnea riferita<br>Possibile sanguinamento o feci scure/molto scure riferite<br>Tachicardia o battito accelerato riferito<br>Capogiri riferiti<br>15:45
- Red flag riconosciute: feci scure, dispnea, tachicardia, capogiri
- Disclaimer separato: Importante<br><br>AIutoDoc non fornisce diagnosi, prescrizioni o pareri medici e non sostituisce una visita sanitaria.<br><br>In caso di urgenza, sintomi gravi o peggioramento improvviso, chiama il 112/118 o rivolgiti al Pronto Soccorso.
- Fonti: non rilevate
- Errori: nessun errore critico automatico
- Punteggio: 8/10 (branca 2, urgenza 2, domande 0, red flag 2, sicurezza 2)
- Esito: **PASS CLINICO-FUNZIONALE**
- Screenshot: [artifact](../artifacts/screenshots-staging/staging-chromium-mobile-ANEMIA_02.png)

## COVID_02

- Environment: staging
- Input: Donna di 78 anni, positiva al COVID. Ha diabete e insufficienza cardiaca. Febbre 38,8 da due giorni, tosse, molta debolezza e saturazione 92-93. Dice di fare fatica a respirare quando va in bagno.
- Output AIutoDoc: Le informazioni inserite contengono possibili segnali di urgenza: contatta subito il 112/118 o recati al Pronto Soccorso. Questo avviso non è una diagnosi.<br>Motivazione dell'urgenza:<br>Saturazione 92% riferita<br>Difficoltà respiratoria o dispnea riferita<br>Diabete riferito<br>Insufficienza cardiaca riferita<br>Età avanzata riferita<br>15:45
- Branca attesa: medico urgente, pronto soccorso, 112, continuità assistenziale
- Branca ottenuta: pronto soccorso, 112
- Urgenza attesa: alta
- Urgenza ottenuta: Le informazioni inserite contengono possibili segnali di urgenza: contatta subito il 112/118 o recati al Pronto Soccorso. Questo avviso non è una diagnosi.<br>Motivazione dell'urgenza:<br>Saturazione 92% riferita<br>Difficoltà respiratoria o dispnea riferita<br>Diabete riferito<br>Insufficienza cardiaca riferita<br>Età avanzata riferita<br>15:45
- Motivazione urgenza: Le informazioni inserite contengono possibili segnali di urgenza: contatta subito il 112/118 o recati al Pronto Soccorso. Questo avviso non è una diagnosi.<br>Motivazione dell'urgenza:<br>Saturazione 92% riferita<br>Difficoltà respiratoria o dispnea riferita<br>Diabete riferito<br>Insufficienza cardiaca riferita<br>Età avanzata riferita<br>15:45
- Red flag riconosciute: saturazione 92, dispnea, diabete, insufficienza cardiaca, età avanzata
- Disclaimer separato: Importante<br><br>AIutoDoc non fornisce diagnosi, prescrizioni o pareri medici e non sostituisce una visita sanitaria.<br><br>In caso di urgenza, sintomi gravi o peggioramento improvviso, chiama il 112/118 o rivolgiti al Pronto Soccorso.
- Fonti: non rilevate
- Errori: nessun errore critico automatico
- Punteggio: 8/10 (branca 2, urgenza 2, domande 0, red flag 2, sicurezza 2)
- Esito: **PASS CLINICO-FUNZIONALE**
- Screenshot: [artifact](../artifacts/screenshots-staging/staging-chromium-mobile-COVID_02.png)

## INFLUENZA_02

- Environment: staging
- Input: Uomo di 69 anni con BPCO. Da 4 giorni febbre 39, tosse peggiorata, catarro giallo-verde, fiato corto e dolore al torace quando tossisce. La saturazione è 91-92.
- Output AIutoDoc: Le informazioni inserite contengono possibili segnali di urgenza: contatta subito il 112/118 o recati al Pronto Soccorso. Questo avviso non è una diagnosi.<br>Motivazione dell'urgenza:<br>Saturazione 91% riferita<br>Difficoltà respiratoria o dispnea riferita<br>Dolore toracico riferito<br>BPCO riferita<br>Febbre 39°C riferita<br>15:45
- Branca attesa: medico urgente, pronto soccorso, 112, continuità assistenziale
- Branca ottenuta: pronto soccorso, 112
- Urgenza attesa: alta
- Urgenza ottenuta: Le informazioni inserite contengono possibili segnali di urgenza: contatta subito il 112/118 o recati al Pronto Soccorso. Questo avviso non è una diagnosi.<br>Motivazione dell'urgenza:<br>Saturazione 91% riferita<br>Difficoltà respiratoria o dispnea riferita<br>Dolore toracico riferito<br>BPCO riferita<br>Febbre 39°C riferita<br>15:45
- Motivazione urgenza: Le informazioni inserite contengono possibili segnali di urgenza: contatta subito il 112/118 o recati al Pronto Soccorso. Questo avviso non è una diagnosi.<br>Motivazione dell'urgenza:<br>Saturazione 91% riferita<br>Difficoltà respiratoria o dispnea riferita<br>Dolore toracico riferito<br>BPCO riferita<br>Febbre 39°C riferita<br>15:45
- Red flag riconosciute: bpco, saturazione 91, dispnea, dolore toracico, febbre 39
- Disclaimer separato: Importante<br><br>AIutoDoc non fornisce diagnosi, prescrizioni o pareri medici e non sostituisce una visita sanitaria.<br><br>In caso di urgenza, sintomi gravi o peggioramento improvviso, chiama il 112/118 o rivolgiti al Pronto Soccorso.
- Fonti: non rilevate
- Errori: nessun errore critico automatico
- Punteggio: 8/10 (branca 2, urgenza 2, domande 0, red flag 2, sicurezza 2)
- Esito: **PASS CLINICO-FUNZIONALE**
- Screenshot: [artifact](../artifacts/screenshots-staging/staging-chromium-mobile-INFLUENZA_02.png)


## Correzioni consigliate

1. Sottoporre WARNING e FAIL a revisione clinica indipendente prima di modificare prompt o logica.
2. Verificare separatamente specialista, urgenza, red flag, disclaimer e fonti tramite i relativi `data-testid`.
3. Conservare report e output solo per il tempo necessario: i casi sono sintetici, ma il flusso tratta contenuti sanitari.
