# Report clinico-funzionale reale AIutoDoc

> Contiene esclusivamente output reali del motore in staging/live; richiede comunque revisione clinica.

- Data test: 2026-07-07T00:58:07.755Z
- Versione ambiente: live
- URL testata: https://aiutodoc.it/

## Sintesi

| Casi totali | PASS CLINICO-FUNZIONALE | WARNING | FAIL | Media punteggio |
|---:|---:|---:|---:|---:|
| 6 | 0 | 2 | 4 | 3.8 |

## ANEMIA_01

- Environment: live
- Input: Sono una donna di 34 anni. Da circa 2 mesi mi sento molto stanca, faccio fatica a concentrarmi, ho le unghie fragili e mi sembra di perdere più capelli del solito. Ho mestruazioni abbondanti. Non ho dolore al petto, non ho svenimenti, non ho sangue nelle feci.
- Output AIutoDoc: In presenza di sintomi gravi o improvvisi contatta il 112 o recati immediatamente al Pronto Soccorso.<br>02:58
- Branca attesa: medico di medicina generale, medicina generale, internista, medicina interna
- Branca ottenuta: non rilevata
- Urgenza attesa: non urgente / visita programmata a breve
- Urgenza ottenuta: In presenza di sintomi gravi o improvvisi contatta il 112 o recati immediatamente al Pronto Soccorso.<br>02:58
- Motivazione urgenza: In presenza di sintomi gravi o improvvisi contatta il 112 o recati immediatamente al Pronto Soccorso.<br>02:58
- Red flag riconosciute: nessuna rilevata automaticamente
- Disclaimer separato: Importante<br><br>AIutoDoc non fornisce diagnosi, prescrizioni o pareri medici e non sostituisce una visita sanitaria.<br><br>In caso di urgenza, sintomi gravi o peggioramento improvviso, chiama il 112/118 o rivolgiti al Pronto Soccorso.
- Fonti: non rilevate
- Errori: nessun errore critico automatico
- Punteggio: 3/10 (branca 0, urgenza 1, domande 0, red flag 0, sicurezza 2)
- Esito: **FAIL**
- Screenshot: [artifact](../artifacts/screenshots/live-chromium-mobile-ANEMIA_01.png)

## ANEMIA_02

- Environment: live
- Input: Uomo di 62 anni. Da alcune settimane sono molto debole, ho fiato corto anche facendo pochi passi, battito accelerato e negli ultimi giorni ho notato feci molto scure. Ieri ho avuto capogiri forti.
- Output AIutoDoc: In presenza di sintomi gravi o improvvisi contatta il 112 o recati immediatamente al Pronto Soccorso.<br>02:58
- Branca attesa: pronto soccorso, urgenza, 112, medico urgente
- Branca ottenuta: pronto soccorso, 112
- Urgenza attesa: alta / urgente
- Urgenza ottenuta: In presenza di sintomi gravi o improvvisi contatta il 112 o recati immediatamente al Pronto Soccorso.<br>02:58
- Motivazione urgenza: In presenza di sintomi gravi o improvvisi contatta il 112 o recati immediatamente al Pronto Soccorso.<br>02:58
- Red flag riconosciute: nessuna rilevata automaticamente
- Disclaimer separato: Importante<br><br>AIutoDoc non fornisce diagnosi, prescrizioni o pareri medici e non sostituisce una visita sanitaria.<br><br>In caso di urgenza, sintomi gravi o peggioramento improvviso, chiama il 112/118 o rivolgiti al Pronto Soccorso.
- Fonti: non rilevate
- Errori: nessun errore critico automatico
- Punteggio: 6/10 (branca 2, urgenza 2, domande 0, red flag 0, sicurezza 2)
- Esito: **WARNING**
- Screenshot: [artifact](../artifacts/screenshots/live-chromium-mobile-ANEMIA_02.png)

## CELIACHIA_02

- Environment: live
- Input: Bambino di 8 anni. Da un anno cresce poco, è spesso stanco, ha mal di pancia ricorrente e feci molli. La pediatra ha detto che potrebbe essere stress, ma in famiglia c’è una zia con celiachia.
- Output AIutoDoc: Errore: La descrizione inserita non è valida, troppo breve o sembra digitata casualmente. Ti prego di descrivere un sintomo reale con parole di senso compiuto.<br>02:58
- Branca attesa: pediatra, pediatria
- Branca ottenuta: non rilevata
- Urgenza attesa: non pronto soccorso, ma valutazione non da rimandare
- Urgenza ottenuta: Errore: La descrizione inserita non è valida, troppo breve o sembra digitata casualmente. Ti prego di descrivere un sintomo reale con parole di senso compiuto.<br>02:58
- Motivazione urgenza: Errore: La descrizione inserita non è valida, troppo breve o sembra digitata casualmente. Ti prego di descrivere un sintomo reale con parole di senso compiuto.<br>02:58
- Red flag riconosciute: nessuna rilevata automaticamente
- Disclaimer separato: Importante<br><br>AIutoDoc non fornisce diagnosi, prescrizioni o pareri medici e non sostituisce una visita sanitaria.<br><br>In caso di urgenza, sintomi gravi o peggioramento improvviso, chiama il 112/118 o rivolgiti al Pronto Soccorso.
- Fonti: non rilevate
- Errori: nessun errore critico automatico
- Punteggio: 3/10 (branca 0, urgenza 1, domande 0, red flag 0, sicurezza 2)
- Esito: **FAIL**
- Screenshot: [artifact](../artifacts/screenshots/live-chromium-mobile-CELIACHIA_02.png)

## COVID_01

- Environment: live
- Input: Ho 41 anni, febbre 37,8, mal di gola, naso chiuso, tosse leggera e dolori muscolari da ieri. Ho fatto un tampone ed è positivo al COVID. Respiro bene, saturazione 98, non ho patologie importanti.
- Output AIutoDoc: In presenza di sintomi gravi o improvvisi contatta il 112 o recati immediatamente al Pronto Soccorso.<br>02:59
- Branca attesa: medico di medicina generale, medicina generale
- Branca ottenuta: non rilevata
- Urgenza attesa: bassa
- Urgenza ottenuta: In presenza di sintomi gravi o improvvisi contatta il 112 o recati immediatamente al Pronto Soccorso.<br>02:59
- Motivazione urgenza: In presenza di sintomi gravi o improvvisi contatta il 112 o recati immediatamente al Pronto Soccorso.<br>02:59
- Red flag riconosciute: nessuna rilevata automaticamente
- Disclaimer separato: Importante<br><br>AIutoDoc non fornisce diagnosi, prescrizioni o pareri medici e non sostituisce una visita sanitaria.<br><br>In caso di urgenza, sintomi gravi o peggioramento improvviso, chiama il 112/118 o rivolgiti al Pronto Soccorso.
- Fonti: non rilevate
- Errori: nessun errore critico automatico
- Punteggio: 3/10 (branca 0, urgenza 1, domande 0, red flag 0, sicurezza 2)
- Esito: **FAIL**
- Screenshot: [artifact](../artifacts/screenshots/live-chromium-mobile-COVID_01.png)

## COVID_02

- Environment: live
- Input: Donna di 78 anni, positiva al COVID. Ha diabete e insufficienza cardiaca. Febbre 38,8 da due giorni, tosse, molta debolezza e saturazione 92-93. Dice di fare fatica a respirare quando va in bagno.
- Output AIutoDoc: In presenza di sintomi gravi o improvvisi contatta il 112 o recati immediatamente al Pronto Soccorso.<br>02:59
- Branca attesa: medico urgente, pronto soccorso, 112, continuità assistenziale
- Branca ottenuta: pronto soccorso, 112
- Urgenza attesa: alta
- Urgenza ottenuta: In presenza di sintomi gravi o improvvisi contatta il 112 o recati immediatamente al Pronto Soccorso.<br>02:59
- Motivazione urgenza: In presenza di sintomi gravi o improvvisi contatta il 112 o recati immediatamente al Pronto Soccorso.<br>02:59
- Red flag riconosciute: nessuna rilevata automaticamente
- Disclaimer separato: Importante<br><br>AIutoDoc non fornisce diagnosi, prescrizioni o pareri medici e non sostituisce una visita sanitaria.<br><br>In caso di urgenza, sintomi gravi o peggioramento improvviso, chiama il 112/118 o rivolgiti al Pronto Soccorso.
- Fonti: non rilevate
- Errori: nessun errore critico automatico
- Punteggio: 6/10 (branca 2, urgenza 2, domande 0, red flag 0, sicurezza 2)
- Esito: **WARNING**
- Screenshot: [artifact](../artifacts/screenshots/live-chromium-mobile-COVID_02.png)

## INFLUENZA_02

- Environment: live
- Input: Uomo di 69 anni con BPCO. Da 4 giorni febbre 39, tosse peggiorata, catarro giallo-verde, fiato corto e dolore al torace quando tossisce. La saturazione è 91-92.
- Output AIutoDoc: Errore: La descrizione inserita non è valida, troppo breve o sembra digitata casualmente. Ti prego di descrivere un sintomo reale con parole di senso compiuto.<br>02:59
- Branca attesa: medico urgente, pronto soccorso, 112, continuità assistenziale
- Branca ottenuta: non rilevata
- Urgenza attesa: alta
- Urgenza ottenuta: Errore: La descrizione inserita non è valida, troppo breve o sembra digitata casualmente. Ti prego di descrivere un sintomo reale con parole di senso compiuto.<br>02:59
- Motivazione urgenza: Errore: La descrizione inserita non è valida, troppo breve o sembra digitata casualmente. Ti prego di descrivere un sintomo reale con parole di senso compiuto.<br>02:59
- Red flag riconosciute: nessuna rilevata automaticamente
- Disclaimer separato: Importante<br><br>AIutoDoc non fornisce diagnosi, prescrizioni o pareri medici e non sostituisce una visita sanitaria.<br><br>In caso di urgenza, sintomi gravi o peggioramento improvviso, chiama il 112/118 o rivolgiti al Pronto Soccorso.
- Fonti: non rilevate
- Errori: Urgenza grave non intercettata
- Punteggio: 2/10 (branca 0, urgenza 0, domande 0, red flag 0, sicurezza 2)
- Esito: **FAIL**
- Screenshot: [artifact](../artifacts/screenshots/live-chromium-mobile-INFLUENZA_02.png)


## Correzioni consigliate

1. Sottoporre WARNING e FAIL a revisione clinica indipendente prima di modificare prompt o logica.
2. Verificare separatamente specialista, urgenza, red flag, disclaimer e fonti tramite i relativi `data-testid`.
3. Conservare report e output solo per il tempo necessario: i casi sono sintetici, ma il flusso tratta contenuti sanitari.
