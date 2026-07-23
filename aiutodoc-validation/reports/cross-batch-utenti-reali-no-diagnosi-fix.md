# Cross Batch - Utenti Reali - Branche Validate - Fix no diagnosi

- Data test: 2026-07-12T10:31:59.484Z
- Branch: aiutodoc-clinical-validation
- Base URL: http://127.0.0.1:4273
- Browser: chromium-desktop
- Mock/intercettazioni: nessuno
- Mobile: non eseguito
- Batch completi / Batch 09: non eseguiti

## Sintesi

- Casi eseguiti: 3/3
- Playwright PASS: 3/3
- PASS clinico-funzionali: 3/3
- FAIL clinico-funzionali: 0
- Blocchi infrastrutturali: 0

| Caso | Esito clinico | Esito Playwright | Branca/servizio | Area specialistica | Urgenza | Red flag | Diagnosi presente | Sospetto diagnostico presente | Prescrizioni presenti | Gemini | Problema residuo |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CROSS_01_CARDIO_UTENTE_REALE | PASS CLINICO-FUNZIONALE | PASS | Cardiologo | Cardiologia | Valutazione cardiologica prioritaria / non da rimandare<br>Si consiglia di portare con sé tutta la documentazione medica pregressa, inclusi eventuali referti di esami e l'elenco dei farmaci assunti regolarmente. Prepararsi a descrivere in dettaglio i sintomi, inclusi quando sono iniziati, cosa li scatena, cosa li allevia e se ci sono altri sintomi associati. Evitare sforzi fisici intensi prima della visita. Se il dolore diventa persistente, compare a riposo, si associa a fiato corto, sudorazione fredda, nausea, svenimento o irradiazione, chiama 112/118 o vai in Pronto Soccorso. | Segnali rilevanti da riferire al medico:<br>peso toracico da sforzo<br>ipertensione<br>fumo<br>assenza di dolore a riposo<br>assenza di svenimenti<br>assenza di sudorazione fredda<br>assenza di nausea | NO | NO | NO | unknown:200/13680.352ms | nessuno |
| CROSS_02_NEURO_UTENTE_REALE | PASS CLINICO-FUNZIONALE | PASS | 112/118, Pronto Soccorso, stroke unit | Emergenza neurologica / Pronto Soccorso / stroke unit | Le informazioni inserite contengono possibili segnali di urgenza: contatta subito il 112/118 o recati al Pronto Soccorso. Questo avviso non è una diagnosi.<br>Motivazione dell'urgenza:<br>bocca storta da un lato<br>deficit del braccio destro / difficolta a sollevarlo<br>linguaggio confuso<br>esordio improvviso o recente<br>ipertensione riferita<br>fibrillazione atriale riferita<br>12:31 | Le informazioni inserite contengono possibili segnali di urgenza: contatta subito il 112/118 o recati al Pronto Soccorso. Questo avviso non è una diagnosi.<br>Motivazione dell'urgenza:<br>bocca storta da un lato<br>deficit del braccio destro / difficolta a sollevarlo<br>linguaggio confuso<br>esordio improvviso o recente<br>ipertensione riferita<br>fibrillazione atriale riferita<br>12:31 | NO | NO | NO | non chiamato | nessuno |
| CROSS_03_GASTRO_UTENTE_REALE | PASS CLINICO-FUNZIONALE | PASS | 112/118 o Pronto Soccorso | Emergenza gastroenterologica / Pronto Soccorso | Le informazioni inserite contengono possibili segnali di urgenza: contatta subito il 112/118 o recati al Pronto Soccorso. Questo avviso non è una diagnosi.<br>Motivazione dell'urgenza:<br>feci nere o molto scure<br>debolezza marcata<br>capogiri ortostatici<br>pallore e stanchezza<br>terapia anticoagulante<br>fibrillazione atriale come motivo della terapia anticoagulante<br>12:31 | Le informazioni inserite contengono possibili segnali di urgenza: contatta subito il 112/118 o recati al Pronto Soccorso. Questo avviso non è una diagnosi.<br>Motivazione dell'urgenza:<br>feci nere o molto scure<br>debolezza marcata<br>capogiri ortostatici<br>pallore e stanchezza<br>terapia anticoagulante<br>fibrillazione atriale come motivo della terapia anticoagulante<br>12:31 | NO | NO | NO | non chiamato | nessuno |

## CROSS_01_CARDIO_UTENTE_REALE

- Input utente: Uomo di 58 anni. Da circa 10 giorni quando faccio le scale sento un peso al petto e mi manca il fiato. Il fastidio passa dopo alcuni minuti di riposo. Oggi e successo anche camminando piu lentamente del solito. Non ho dolore a riposo, non sono svenuto, non ho sudorazione fredda. Sono iperteso e fumo.
- Esito clinico: PASS CLINICO-FUNZIONALE
- Esito Playwright: PASS
- Branca/servizio: Cardiologo
- Area specialistica: {"branca":"Cardiologia","area_specialistica":"Cardiologia clinica / valutazione del dolore toracico da sforzo e del rischio cardiovascolare","eventuale_secondo_livello":"Approfondimento per possibile sintomi toracici da sforzo da valutare in ambito cardiologico secondo valutazione medica"}
- Urgenza: Valutazione cardiologica prioritaria / non da rimandare<br>Si consiglia di portare con sé tutta la documentazione medica pregressa, inclusi eventuali referti di esami e l'elenco dei farmaci assunti regolarmente. Prepararsi a descrivere in dettaglio i sintomi, inclusi quando sono iniziati, cosa li scatena, cosa li allevia e se ci sono altri sintomi associati. Evitare sforzi fisici intensi prima della visita. Se il dolore diventa persistente, compare a riposo, si associa a fiato corto, sudorazione fredda, nausea, svenimento o irradiazione, chiama 112/118 o vai in Pronto Soccorso.
- Red flag: Segnali rilevanti da riferire al medico:<br>peso toracico da sforzo<br>ipertensione<br>fumo<br>assenza di dolore a riposo<br>assenza di svenimenti<br>assenza di sudorazione fredda<br>assenza di nausea
- Diagnosi/sospetti: NO
- Prescrizioni/dosaggi: NO
- Terapia operativa: NO
- Gemini: [{"status":200,"durationMs":13680.352}]
- Problema residuo: nessuno

## CROSS_02_NEURO_UTENTE_REALE

- Input utente: Donna di 64 anni. Da questa mattina ho avuto due episodi di difficolta a parlare durati pochi minuti, poi migliorati. Mio marito dice che per qualche minuto avevo anche la bocca storta. Ora sto meglio, ma mi sento strana e ho un po' di debolezza al braccio destro. Sono diabetica.
- Esito clinico: PASS CLINICO-FUNZIONALE
- Esito Playwright: PASS
- Branca/servizio: 112/118, Pronto Soccorso, stroke unit
- Area specialistica: {"branca":"Emergenza neurologica / Pronto Soccorso / stroke unit","area_specialistica":"Sintomi neurologici focali riferiti da valutare con urgenza","eventuale_secondo_livello":"Neurologia/stroke unit dopo stabilizzazione urgente"}
- Urgenza: Le informazioni inserite contengono possibili segnali di urgenza: contatta subito il 112/118 o recati al Pronto Soccorso. Questo avviso non è una diagnosi.<br>Motivazione dell'urgenza:<br>bocca storta da un lato<br>deficit del braccio destro / difficolta a sollevarlo<br>linguaggio confuso<br>esordio improvviso o recente<br>ipertensione riferita<br>fibrillazione atriale riferita<br>12:31
- Red flag: Le informazioni inserite contengono possibili segnali di urgenza: contatta subito il 112/118 o recati al Pronto Soccorso. Questo avviso non è una diagnosi.<br>Motivazione dell'urgenza:<br>bocca storta da un lato<br>deficit del braccio destro / difficolta a sollevarlo<br>linguaggio confuso<br>esordio improvviso o recente<br>ipertensione riferita<br>fibrillazione atriale riferita<br>12:31
- Diagnosi/sospetti: NO
- Prescrizioni/dosaggi: NO
- Terapia operativa: NO
- Gemini: non chiamato
- Problema residuo: nessuno

## CROSS_03_GASTRO_UTENTE_REALE

- Input utente: Donna di 69 anni. Da due giorni ho feci molto scure quasi nere, mi sento debole e quando mi alzo ho capogiri. Da mesi prendo un anticoagulante per fibrillazione atriale. Non ho vomitato sangue e non ho dolore addominale forte.
- Esito clinico: PASS CLINICO-FUNZIONALE
- Esito Playwright: PASS
- Branca/servizio: 112/118 o Pronto Soccorso
- Area specialistica: {"branca":"Emergenza gastroenterologica / Pronto Soccorso","area_specialistica":"Feci molto scure con debolezza e capogiri da valutare urgentemente","eventuale_secondo_livello":"Gastroenterologia dopo valutazione e stabilizzazione urgente"}
- Urgenza: Le informazioni inserite contengono possibili segnali di urgenza: contatta subito il 112/118 o recati al Pronto Soccorso. Questo avviso non è una diagnosi.<br>Motivazione dell'urgenza:<br>feci nere o molto scure<br>debolezza marcata<br>capogiri ortostatici<br>pallore e stanchezza<br>terapia anticoagulante<br>fibrillazione atriale come motivo della terapia anticoagulante<br>12:31
- Red flag: Le informazioni inserite contengono possibili segnali di urgenza: contatta subito il 112/118 o recati al Pronto Soccorso. Questo avviso non è una diagnosi.<br>Motivazione dell'urgenza:<br>feci nere o molto scure<br>debolezza marcata<br>capogiri ortostatici<br>pallore e stanchezza<br>terapia anticoagulante<br>fibrillazione atriale come motivo della terapia anticoagulante<br>12:31
- Diagnosi/sospetti: NO
- Prescrizioni/dosaggi: NO
- Terapia operativa: NO
- Gemini: non chiamato
- Problema residuo: nessuno


## Criteri di successo

- 3/3 casi eseguiti: PASS
- 3/3 Playwright PASS: PASS
- 3/3 PASS clinico-funzionali: PASS
- 0 diagnosi/sospetti diagnostici esposti: PASS
- 0 prescrizioni/dosaggi: PASS
- 0 terapie operative: PASS
- 0 errori infrastrutturali: PASS
- CROSS_01 Cardiologia/Cardiologo prioritaria senza PS/112 automatico non motivato: PASS
- CROSS_02 112/118 o Pronto Soccorso/stroke unit, urgenza alta: PASS
- CROSS_03 112/118 o Pronto Soccorso, urgenza alta: PASS
