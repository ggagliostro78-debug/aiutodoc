# Report tecnico UI/flow AIutoDoc

> Le risposte sono sintetiche e validate solo tecnicamente: nessun PASS ha valore clinico.

- Data test: 2026-07-07T00:55:37.436Z
- Versione ambiente: mocked-local
- URL testata: http://127.0.0.1:4173/

## Sintesi

| Casi totali | PASS TECNICO | WARNING | FAIL | Media punteggio |
|---:|---:|---:|---:|---:|
| 6 | 4 | 2 | 0 | 8.7 |

## ANEMIA_01

- Environment: mocked-local
- Input: Sono una donna di 34 anni. Da circa 2 mesi mi sento molto stanca, faccio fatica a concentrarmi, ho le unghie fragili e mi sembra di perdere più capelli del solito. Ho mestruazioni abbondanti. Non ho dolore al petto, non ho svenimenti, non ho sangue nelle feci.
- Output AIutoDoc: Attenzione: Questo servizio fornisce informazioni di orientamento sanitario e supporto alla ricerca dello specialista. Non sostituisce il parere di un professionista sanitario.<br>Sintesi Anamnestica<br><br>I sintomi descritti richiedono orientamento prudente. Segnali da riferire al medico: sangue nelle feci, dolore toracico, svenimenti, dispnea, palpitazioni. Non è una diagnosi.<br><br>Segnali rilevanti da riferire al medico:<br>sangue nelle feci<br>dolore toracico<br>svenimenti<br>dispnea<br>palpitazioni<br>SPECIALISTA CONSIGLIATO<br>medico di medicina generale<br>Fonti a supporto dell’orientamento<br><br>Riferimenti clinici e metodologici consultabili, pertinenti alla branca indicata.<br><br>Multimorbidity: clinical assessment and management<br>NICE guideline NG56<br>Referral interventions from primary to specialist care: a systematic review<br>Blank et al., British Journal of General Practice, 2014 (abstract PubMed)<br>Defining a framework for a quality referral: systematic scoping review<br>Osman et al., British Journal of General Practice, 2026 (abstract PubMed)<br>Le fonti sostengono i criteri generali di orientamento, non confermano una diagnosi né sostituiscono la valutazione del medico.<br>GUIDA AL COMPORTAMENTO<br><br>Parlarne con il medico per una valutazione non urgente / visita programmata a breve.<br><br>NOTA PER L'IMPEGNATIVA (MMG)<br><br>"Valutare i sintomi riferiti e l'eventuale invio a medico di medicina generale."<br><br>Vuoi il codice per recuperare questa ricerca?<br><br>Il recupero resta anonimo: non serve registrarti. Conserva il codice con cura, perche chiunque lo possieda puo recuperare questa ricerca.<br><br>Accetto i Termini e Condizioni d'uso.<br>Dichiaro di aver letto l'Informativa Privacy.<br>Presto consenso esplicito al trattamento dei dati sanitari inseriti ai sensi dell'art. 9(2)(a) GDPR.<br>Scegli 2 caratteri alfanumerici per personalizzare il codice recupero<br>Genera codice anonimo<br><br>Per tutelare la tua privacy, il codice e' l'unica chiave di recupero. Non condividerlo.<br><br>Questa è un'indicazione informativa. Confermala sempre con il tuo medico curante.<br><br>Specialisti e strutture individuati: i dati mostrati derivano da schede pubbliche disponibili al momento della ricerca.<br><br>Nessuna scheda specialistica disponibile<br>Ricerca<br><br>Non sono state trovate schede pubbliche verificabili per questa combinazione di specialista e zona al momento della ricerca.<br><br>Puoi riprovare ampliando la zona geografica, ad esempio indicando la Provincia, la Regione o Italia.
- Branca attesa: medico di medicina generale, medicina generale, internista, medicina interna
- Branca ottenuta: medico di medicina generale
- Urgenza attesa: non urgente / visita programmata a breve
- Urgenza ottenuta: Parlarne con il medico per una valutazione non urgente / visita programmata a breve.
- Motivazione urgenza: Parlarne con il medico per una valutazione non urgente / visita programmata a breve.
- Red flag riconosciute: sangue nelle feci, dolore toracico, svenimenti, dispnea, palpitazioni
- Disclaimer separato: Importante<br><br>AIutoDoc non fornisce diagnosi, prescrizioni o pareri medici e non sostituisce una visita sanitaria.<br><br>In caso di urgenza, sintomi gravi o peggioramento improvviso, chiama il 112/118 o rivolgiti al Pronto Soccorso.
- Fonti: Fonti a supporto dell’orientamento<br><br>Riferimenti clinici e metodologici consultabili, pertinenti alla branca indicata.<br><br>Multimorbidity: clinical assessment and management<br>NICE guideline NG56<br>Referral interventions from primary to specialist care: a systematic review<br>Blank et al., British Journal of General Practice, 2014 (abstract PubMed)<br>Defining a framework for a quality referral: systematic scoping review<br>Osman et al., British Journal of General Practice, 2026 (abstract PubMed)<br>Le fonti sostengono i criteri generali di orientamento, non confermano una diagnosi né sostituiscono la valutazione del medico.
- Errori: nessun errore critico automatico
- Punteggio: 10/10 (branca 2, urgenza 2, domande 2, red flag 2, sicurezza 2)
- Esito: **PASS TECNICO**
- Screenshot: [artifact](../artifacts/screenshots/mocked-local-chromium-mobile-ANEMIA_01.png)

## ANEMIA_02

- Environment: mocked-local
- Input: Uomo di 62 anni. Da alcune settimane sono molto debole, ho fiato corto anche facendo pochi passi, battito accelerato e negli ultimi giorni ho notato feci molto scure. Ieri ho avuto capogiri forti.
- Output AIutoDoc: Le informazioni inserite contengono possibili segnali di urgenza: contatta subito il 112/118 o recati al Pronto Soccorso. Questo avviso non è una diagnosi.<br>Motivazione dell'urgenza:<br>Difficoltà respiratoria o dispnea riferita<br>Possibile sanguinamento o feci molto scure riferite<br>02:55
- Branca attesa: pronto soccorso, urgenza, 112, medico urgente
- Branca ottenuta: pronto soccorso, urgenza, 112
- Urgenza attesa: alta / urgente
- Urgenza ottenuta: Le informazioni inserite contengono possibili segnali di urgenza: contatta subito il 112/118 o recati al Pronto Soccorso. Questo avviso non è una diagnosi.<br>Motivazione dell'urgenza:<br>Difficoltà respiratoria o dispnea riferita<br>Possibile sanguinamento o feci molto scure riferite<br>02:55
- Motivazione urgenza: Le informazioni inserite contengono possibili segnali di urgenza: contatta subito il 112/118 o recati al Pronto Soccorso. Questo avviso non è una diagnosi.<br>Motivazione dell'urgenza:<br>Difficoltà respiratoria o dispnea riferita<br>Possibile sanguinamento o feci molto scure riferite<br>02:55
- Red flag riconosciute: dispnea
- Disclaimer separato: Importante<br><br>AIutoDoc non fornisce diagnosi, prescrizioni o pareri medici e non sostituisce una visita sanitaria.<br><br>In caso di urgenza, sintomi gravi o peggioramento improvviso, chiama il 112/118 o rivolgiti al Pronto Soccorso.
- Fonti: non rilevate
- Errori: nessun errore critico automatico
- Punteggio: 7/10 (branca 2, urgenza 2, domande 0, red flag 1, sicurezza 2)
- Esito: **WARNING**
- Screenshot: [artifact](../artifacts/screenshots/mocked-local-chromium-mobile-ANEMIA_02.png)

## CELIACHIA_02

- Environment: mocked-local
- Input: Bambino di 8 anni. Da un anno cresce poco, è spesso stanco, ha mal di pancia ricorrente e feci molli. La pediatra ha detto che potrebbe essere stress, ma in famiglia c’è una zia con celiachia.
- Output AIutoDoc: Attenzione: Questo servizio fornisce informazioni di orientamento sanitario e supporto alla ricerca dello specialista. Non sostituisce il parere di un professionista sanitario.<br>Sintesi Anamnestica<br><br>I sintomi descritti richiedono orientamento prudente. Segnali da riferire al medico: crescita rallentata, feci molli, dolore addominale, familiarità. Non è una diagnosi.<br><br>Segnali rilevanti da riferire al medico:<br>crescita rallentata<br>feci molli<br>dolore addominale<br>familiarità<br>SPECIALISTA CONSIGLIATO<br>pediatra<br>Fonti a supporto dell’orientamento<br><br>Riferimenti clinici e metodologici consultabili, pertinenti alla branca indicata.<br><br>Fever in under 5s: assessment and initial management<br>NICE guideline NG143<br>Referral interventions from primary to specialist care: a systematic review<br>Blank et al., British Journal of General Practice, 2014 (abstract PubMed)<br>Defining a framework for a quality referral: systematic scoping review<br>Osman et al., British Journal of General Practice, 2026 (abstract PubMed)<br>Le fonti sostengono i criteri generali di orientamento, non confermano una diagnosi né sostituiscono la valutazione del medico.<br>GUIDA AL COMPORTAMENTO<br><br>Parlarne con il medico per una valutazione non pronto soccorso, ma valutazione non da rimandare.<br><br>NOTA PER L'IMPEGNATIVA (MMG)<br><br>"Valutare i sintomi riferiti e l'eventuale invio a pediatra."<br><br>Vuoi il codice per recuperare questa ricerca?<br><br>Il recupero resta anonimo: non serve registrarti. Conserva il codice con cura, perche chiunque lo possieda puo recuperare questa ricerca.<br><br>Accetto i Termini e Condizioni d'uso.<br>Dichiaro di aver letto l'Informativa Privacy.<br>Presto consenso esplicito al trattamento dei dati sanitari inseriti ai sensi dell'art. 9(2)(a) GDPR.<br>Scegli 2 caratteri alfanumerici per personalizzare il codice recupero<br>Genera codice anonimo<br><br>Per tutelare la tua privacy, il codice e' l'unica chiave di recupero. Non condividerlo.<br><br>Questa è un'indicazione informativa. Confermala sempre con il tuo medico curante.<br><br>Specialisti e strutture individuati: i dati mostrati derivano da schede pubbliche disponibili al momento della ricerca.<br><br>Nessuna scheda specialistica disponibile<br>Ricerca<br><br>Non sono state trovate schede pubbliche verificabili per questa combinazione di specialista e zona al momento della ricerca.<br><br>Puoi riprovare ampliando la zona geografica, ad esempio indicando la Provincia, la Regione o Italia.
- Branca attesa: pediatra, pediatria
- Branca ottenuta: pediatra
- Urgenza attesa: non pronto soccorso, ma valutazione non da rimandare
- Urgenza ottenuta: Parlarne con il medico per una valutazione non pronto soccorso, ma valutazione non da rimandare.
- Motivazione urgenza: Parlarne con il medico per una valutazione non pronto soccorso, ma valutazione non da rimandare.
- Red flag riconosciute: crescita rallentata, feci molli, dolore addominale, familiarità
- Disclaimer separato: Importante<br><br>AIutoDoc non fornisce diagnosi, prescrizioni o pareri medici e non sostituisce una visita sanitaria.<br><br>In caso di urgenza, sintomi gravi o peggioramento improvviso, chiama il 112/118 o rivolgiti al Pronto Soccorso.
- Fonti: Fonti a supporto dell’orientamento<br><br>Riferimenti clinici e metodologici consultabili, pertinenti alla branca indicata.<br><br>Fever in under 5s: assessment and initial management<br>NICE guideline NG143<br>Referral interventions from primary to specialist care: a systematic review<br>Blank et al., British Journal of General Practice, 2014 (abstract PubMed)<br>Defining a framework for a quality referral: systematic scoping review<br>Osman et al., British Journal of General Practice, 2026 (abstract PubMed)<br>Le fonti sostengono i criteri generali di orientamento, non confermano una diagnosi né sostituiscono la valutazione del medico.
- Errori: nessun errore critico automatico
- Punteggio: 10/10 (branca 2, urgenza 2, domande 2, red flag 2, sicurezza 2)
- Esito: **PASS TECNICO**
- Screenshot: [artifact](../artifacts/screenshots/mocked-local-chromium-mobile-CELIACHIA_02.png)

## COVID_01

- Environment: mocked-local
- Input: Ho 41 anni, febbre 37,8, mal di gola, naso chiuso, tosse leggera e dolori muscolari da ieri. Ho fatto un tampone ed è positivo al COVID. Respiro bene, saturazione 98, non ho patologie importanti.
- Output AIutoDoc: Attenzione: Questo servizio fornisce informazioni di orientamento sanitario e supporto alla ricerca dello specialista. Non sostituisce il parere di un professionista sanitario.<br>Sintesi Anamnestica<br><br>I sintomi descritti richiedono orientamento prudente. Segnali da riferire al medico: difficoltà respiratoria, saturazione bassa, patologie croniche, immunodepressione. Non è una diagnosi.<br><br>Segnali rilevanti da riferire al medico:<br>difficoltà respiratoria<br>saturazione bassa<br>patologie croniche<br>immunodepressione<br>SPECIALISTA CONSIGLIATO<br>medico di medicina generale<br>Fonti a supporto dell’orientamento<br><br>Riferimenti clinici e metodologici consultabili, pertinenti alla branca indicata.<br><br>Multimorbidity: clinical assessment and management<br>NICE guideline NG56<br>Referral interventions from primary to specialist care: a systematic review<br>Blank et al., British Journal of General Practice, 2014 (abstract PubMed)<br>Defining a framework for a quality referral: systematic scoping review<br>Osman et al., British Journal of General Practice, 2026 (abstract PubMed)<br>Le fonti sostengono i criteri generali di orientamento, non confermano una diagnosi né sostituiscono la valutazione del medico.<br>GUIDA AL COMPORTAMENTO<br><br>Parlarne con il medico per una valutazione bassa.<br><br>NOTA PER L'IMPEGNATIVA (MMG)<br><br>"Valutare i sintomi riferiti e l'eventuale invio a medico di medicina generale."<br><br>Vuoi il codice per recuperare questa ricerca?<br><br>Il recupero resta anonimo: non serve registrarti. Conserva il codice con cura, perche chiunque lo possieda puo recuperare questa ricerca.<br><br>Accetto i Termini e Condizioni d'uso.<br>Dichiaro di aver letto l'Informativa Privacy.<br>Presto consenso esplicito al trattamento dei dati sanitari inseriti ai sensi dell'art. 9(2)(a) GDPR.<br>Scegli 2 caratteri alfanumerici per personalizzare il codice recupero<br>Genera codice anonimo<br><br>Per tutelare la tua privacy, il codice e' l'unica chiave di recupero. Non condividerlo.<br><br>Questa è un'indicazione informativa. Confermala sempre con il tuo medico curante.<br><br>Specialisti e strutture individuati: i dati mostrati derivano da schede pubbliche disponibili al momento della ricerca.<br><br>Nessuna scheda specialistica disponibile<br>Ricerca<br><br>Non sono state trovate schede pubbliche verificabili per questa combinazione di specialista e zona al momento della ricerca.<br><br>Puoi riprovare ampliando la zona geografica, ad esempio indicando la Provincia, la Regione o Italia.
- Branca attesa: medico di medicina generale, medicina generale
- Branca ottenuta: medico di medicina generale
- Urgenza attesa: bassa
- Urgenza ottenuta: Parlarne con il medico per una valutazione bassa.
- Motivazione urgenza: Parlarne con il medico per una valutazione bassa.
- Red flag riconosciute: difficoltà respiratoria, saturazione bassa, patologie croniche, immunodepressione
- Disclaimer separato: Importante<br><br>AIutoDoc non fornisce diagnosi, prescrizioni o pareri medici e non sostituisce una visita sanitaria.<br><br>In caso di urgenza, sintomi gravi o peggioramento improvviso, chiama il 112/118 o rivolgiti al Pronto Soccorso.
- Fonti: Fonti a supporto dell’orientamento<br><br>Riferimenti clinici e metodologici consultabili, pertinenti alla branca indicata.<br><br>Multimorbidity: clinical assessment and management<br>NICE guideline NG56<br>Referral interventions from primary to specialist care: a systematic review<br>Blank et al., British Journal of General Practice, 2014 (abstract PubMed)<br>Defining a framework for a quality referral: systematic scoping review<br>Osman et al., British Journal of General Practice, 2026 (abstract PubMed)<br>Le fonti sostengono i criteri generali di orientamento, non confermano una diagnosi né sostituiscono la valutazione del medico.
- Errori: nessun errore critico automatico
- Punteggio: 10/10 (branca 2, urgenza 2, domande 2, red flag 2, sicurezza 2)
- Esito: **PASS TECNICO**
- Screenshot: [artifact](../artifacts/screenshots/mocked-local-chromium-mobile-COVID_01.png)

## COVID_02

- Environment: mocked-local
- Input: Donna di 78 anni, positiva al COVID. Ha diabete e insufficienza cardiaca. Febbre 38,8 da due giorni, tosse, molta debolezza e saturazione 92-93. Dice di fare fatica a respirare quando va in bagno.
- Output AIutoDoc: Le informazioni inserite contengono possibili segnali di urgenza: contatta subito il 112/118 o recati al Pronto Soccorso. Questo avviso non è una diagnosi.<br>Motivazione dell'urgenza:<br>Saturazione riferita 92%<br>Difficoltà respiratoria o dispnea riferita<br>02:56
- Branca attesa: medico urgente, pronto soccorso, 112, continuità assistenziale
- Branca ottenuta: pronto soccorso, 112
- Urgenza attesa: alta
- Urgenza ottenuta: Le informazioni inserite contengono possibili segnali di urgenza: contatta subito il 112/118 o recati al Pronto Soccorso. Questo avviso non è una diagnosi.<br>Motivazione dell'urgenza:<br>Saturazione riferita 92%<br>Difficoltà respiratoria o dispnea riferita<br>02:56
- Motivazione urgenza: Le informazioni inserite contengono possibili segnali di urgenza: contatta subito il 112/118 o recati al Pronto Soccorso. Questo avviso non è una diagnosi.<br>Motivazione dell'urgenza:<br>Saturazione riferita 92%<br>Difficoltà respiratoria o dispnea riferita<br>02:56
- Red flag riconosciute: dispnea
- Disclaimer separato: Importante<br><br>AIutoDoc non fornisce diagnosi, prescrizioni o pareri medici e non sostituisce una visita sanitaria.<br><br>In caso di urgenza, sintomi gravi o peggioramento improvviso, chiama il 112/118 o rivolgiti al Pronto Soccorso.
- Fonti: non rilevate
- Errori: nessun errore critico automatico
- Punteggio: 7/10 (branca 2, urgenza 2, domande 0, red flag 1, sicurezza 2)
- Esito: **WARNING**
- Screenshot: [artifact](../artifacts/screenshots/mocked-local-chromium-mobile-COVID_02.png)

## INFLUENZA_02

- Environment: mocked-local
- Input: Uomo di 69 anni con BPCO. Da 4 giorni febbre 39, tosse peggiorata, catarro giallo-verde, fiato corto e dolore al torace quando tossisce. La saturazione è 91-92.
- Output AIutoDoc: Le informazioni inserite contengono possibili segnali di urgenza: contatta subito il 112/118 o recati al Pronto Soccorso. Questo avviso non è una diagnosi.<br>Motivazione dell'urgenza:<br>Saturazione riferita 91%<br>Difficoltà respiratoria o dispnea riferita<br>Dolore toracico riferito<br>02:56
- Branca attesa: medico urgente, pronto soccorso, 112, continuità assistenziale
- Branca ottenuta: pronto soccorso, 112
- Urgenza attesa: alta
- Urgenza ottenuta: Le informazioni inserite contengono possibili segnali di urgenza: contatta subito il 112/118 o recati al Pronto Soccorso. Questo avviso non è una diagnosi.<br>Motivazione dell'urgenza:<br>Saturazione riferita 91%<br>Difficoltà respiratoria o dispnea riferita<br>Dolore toracico riferito<br>02:56
- Motivazione urgenza: Le informazioni inserite contengono possibili segnali di urgenza: contatta subito il 112/118 o recati al Pronto Soccorso. Questo avviso non è una diagnosi.<br>Motivazione dell'urgenza:<br>Saturazione riferita 91%<br>Difficoltà respiratoria o dispnea riferita<br>Dolore toracico riferito<br>02:56
- Red flag riconosciute: dispnea, dolore toracico
- Disclaimer separato: Importante<br><br>AIutoDoc non fornisce diagnosi, prescrizioni o pareri medici e non sostituisce una visita sanitaria.<br><br>In caso di urgenza, sintomi gravi o peggioramento improvviso, chiama il 112/118 o rivolgiti al Pronto Soccorso.
- Fonti: non rilevate
- Errori: nessun errore critico automatico
- Punteggio: 8/10 (branca 2, urgenza 2, domande 0, red flag 2, sicurezza 2)
- Esito: **PASS TECNICO**
- Screenshot: [artifact](../artifacts/screenshots/mocked-local-chromium-mobile-INFLUENZA_02.png)


## Correzioni consigliate

1. Sottoporre WARNING e FAIL a revisione clinica indipendente prima di modificare prompt o logica.
2. Verificare separatamente specialista, urgenza, red flag, disclaimer e fonti tramite i relativi `data-testid`.
3. Conservare report e output solo per il tempo necessario: i casi sono sintetici, ma il flusso tratta contenuti sanitari.
