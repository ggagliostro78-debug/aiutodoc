# Audit Routing Anamnestico - Pertinenza Domande

Data esecuzione: 2026-07-12T11:36:44.771Z
Branch: aiutodoc-clinical-validation
Ambiente: staging locale http://127.0.0.1:4273
Browser: chromium-desktop
Mock: no
Intercettazione /api/gemini: no
Produzione: non testata
Batch 09: non avviato
Correzioni motore durante audit: nessuna

## Sintesi Esecutiva

Eseguiti 6 casi di audit sul secondo blocco anamnestico. Risultati: PASS 1, WARNING 0, FAIL 4, NON VALUTABILE 1.

Il controllo valuta pertinenza delle domande rispetto al primo input, rischio di deviazione su branche confinanti, presenza di termini diagnostici/prescrittivi nelle domande e capacita di distinguere urgenza da visita programmata.

| Caso | Esito routing | Branca attesa | Domande catturate | Domande pertinenti | Domande fuori ramo | Rischio clinico | Rischio reputazionale | Correzione consigliata |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ROUTING_01_CARDIO_ATIPICO_MANDIBOLA | PASS ROUTING | Cardiologia / Medicina d'urgenza | Da quanto durano peso allo stomaco, nausea, fiato corto o fastidio alla mandibola, e sono ancora presenti o non regrediscono? A) Sono presenti o persistenti B) Vanno e vengono C) Sono regrediti D) Nessuna delle precedenti<br>Il fiato corto peggiora con il movimento, compare a riposo, oppure il quadro sta peggiorando rispetto all'esordio? A) Si, peggiora o limita il movimento B) Solo lieve o stabile C) No D) Nessuna delle precedenti<br>Si associano sudorazione fredda, svenimento, debolezza intensa, irradiazione a mandibola/braccio/schiena, diabete, ipertensione o mancato beneficio con antiacido? A) Si, uno o piu segnali B) Solo in parte C) No D) Nessuna delle precedenti | fiato corto, peggior, mandibola, braccio, schiena, sudorazione, svenimento, debolezza, diabete, ipertensione, antiacido | Nessuna | Basso: domande coerenti con raccolta orientativa | Basso | Nessuna correzione immediata: mantenere monitoraggio nei batch futuri. |
| ROUTING_02_NEURO_VERTIGINI_DIPLOPIA | FAIL ROUTING | Neurologia / Pronto Soccorso | Hai notato formicolii, perdita di sensibilità o riduzione della forza in una parte del corpo? A) Sì, in modo evidente B) Solo lieve o intermittente C) No D) Nessuna delle precedenti<br>Il sintomo si associa a disturbi dell'equilibrio, della parola, della vista o del controllo dei movimenti? A) Sì, chiaramente B) Solo in parte C) No D) Nessuna delle precedenti<br>L'esordio è stato improvviso oppure graduale e ricorrente? A) Improvviso B) Graduale o ricorrente C) Non saprei D) Nessuna delle precedenti | improvvis, equilibrio | Nessuna | copertura insufficiente dei segnali attesi | Medio/alto: domande percepibili come fuori contesto o non prudenti | Rafforzare precedenza del router sui segnali urgenti e ridurre il peso delle keyword ambigue isolate. |
| ROUTING_03_URO_GRAVIDANZA_FEBBRE_FIANCO | FAIL ROUTING | Urgenza / Ostetricia / Urologia-Nefrologia | La zona rossa è calda, gonfia, dolorosa e si sta allargando? A) Sì, chiaramente B) Solo in parte C) No D) Nessuna delle precedenti<br>Sono presenti febbre, brividi, debolezza, diabete, immunodepressione o rapido peggioramento? A) Sì, uno o più B) Non so / dubbio C) No D) Nessuna delle precedenti<br>La zona coinvolge volto/occhio o ci sono strie rosse, dolore sproporzionato o confusione? A) Sì B) Non so / dubbio C) No D) Nessuna delle precedenti | febbre, brividi, debolezza | Nessuna | copertura insufficiente dei segnali attesi | Medio/alto: domande percepibili come fuori contesto o non prudenti | Rafforzare precedenza del router sui segnali urgenti e ridurre il peso delle keyword ambigue isolate. |
| ROUTING_04_DERM_ORAL_ALLERGIA | FAIL ROUTING | Allergologia / Emergenza | La lesione cutanea, il neo o la macchia sono cambiati rapidamente per dimensione, colore, forma o rilievo? A) Si, cambiamento evidente o rapido B) Cambiamento lieve o dubbio C) No, sembra stabile D) Nessuna delle precedenti<br>Hai notato sanguinamento, croste, dolore, prurito intenso o margini irregolari nella zona? A) Si, uno o piu segni evidenti B) Solo fastidio lieve C) No D) Nessuna delle precedenti<br>Il problema riguarda un singolo punto preciso o piu aree della pelle? A) Singola lesione/neo ben preciso B) Piu chiazze o lesioni C) Eruzione diffusa o prurito generale D) Nessuna delle precedenti | prurito | Nessuna | copertura insufficiente dei segnali attesi | Medio/alto: domande percepibili come fuori contesto o non prudenti | Rafforzare precedenza del router sui segnali urgenti e ridurre il peso delle keyword ambigue isolate. |
| ROUTING_05_GASTRO_FECI_SCURE_ANTICOAGULANTE | NON VALUTABILE | Gastroenterologia / Pronto Soccorso |  | Nessuna o insufficiente | Nessuna | Non valutabile: secondo blocco anamnestico non mostrato | Basso/medio: impossibile valutare la pertinenza delle domande per bypass del blocco | Se il bypass e voluto per urgenza, documentare che il router non mostra domande; altrimenti prevedere domande minime di conferma urgenza. |
| ROUTING_06_ORTO_LOMBALGIA_RED_FLAGS | FAIL ROUTING | Ortopedia / Neurochirurgia / Urgenza | Formicolii o perdita di sensibilità sono localizzati, bilaterali o progressivi nel tempo? A) Progressivi o diffusi B) Intermittenti/localizzati C) Non so D) Nessuna delle precedenti<br>Hai perdita di forza, difficoltà a camminare, disturbi del linguaggio, vista doppia o problemi urinari/fecali? A) Sì B) Solo in parte C) No D) Nessuna delle precedenti<br>Il sintomo è iniziato improvvisamente oppure è graduale/ricorrente da settimane o mesi? A) Improvviso B) Graduale o ricorrente C) Non saprei D) Nessuna delle precedenti | urin, progress | Nessuna | copertura insufficiente dei segnali attesi | Medio/alto: domande percepibili come fuori contesto o non prudenti | Rafforzare precedenza del router sui segnali urgenti e ridurre il peso delle keyword ambigue isolate. |

## ROUTING_01_CARDIO_ATIPICO_MANDIBOLA

Input utente:
Uomo di 40 anni. Da stamattina ho una forte sensazione di peso allo stomaco e nausea. Mi sembra acidita, ma mi manca anche un po' il fiato quando mi muovo e ho fastidio alla mandibola. Non ho un vero dolore al petto. Ho diabete e pressione alta. Ho preso un antiacido ma non e cambiato molto.

Domande mostrate:
1. Da quanto durano peso allo stomaco, nausea, fiato corto o fastidio alla mandibola, e sono ancora presenti o non regrediscono? A) Sono presenti o persistenti B) Vanno e vengono C) Sono regrediti D) Nessuna delle precedenti
2. Il fiato corto peggiora con il movimento, compare a riposo, oppure il quadro sta peggiorando rispetto all'esordio? A) Si, peggiora o limita il movimento B) Solo lieve o stabile C) No D) Nessuna delle precedenti
3. Si associano sudorazione fredda, svenimento, debolezza intensa, irradiazione a mandibola/braccio/schiena, diabete, ipertensione o mancato beneficio con antiacido? A) Si, uno o piu segnali B) Solo in parte C) No D) Nessuna delle precedenti

Valutazione:
- Esito routing: PASS ROUTING
- Pertinenza rispetto al primo input: adeguata
- Supporto a branca/specialita/sotto-specialita: presente
- Supporto a urgenza vs visita programmata: presente
- Tiene conto di negazioni: si
- Tiene conto di fattori di rischio: si
- Diagnosi/sospetti diagnostici nelle domande: assenti
- Prescrizioni/dosaggi/terapie operative nelle domande: assenti

Criticita:
- Nessuna criticita rilevante nelle domande catturate.

Proposta di miglioramento:
Nessuna correzione immediata: mantenere monitoraggio nei batch futuri.

Priorita correzione: Bassa

## ROUTING_02_NEURO_VERTIGINI_DIPLOPIA

Input utente:
Uomo di 67 anni. Da circa un'ora ho vertigini forti, vedo doppio a momenti e cammino storto come se perdessi l'equilibrio. Ho vomitato una volta. Non ho mal di testa forte e non ho la bocca storta. Prendo farmaci per fibrillazione atriale.

Domande mostrate:
1. Hai notato formicolii, perdita di sensibilità o riduzione della forza in una parte del corpo? A) Sì, in modo evidente B) Solo lieve o intermittente C) No D) Nessuna delle precedenti
2. Il sintomo si associa a disturbi dell'equilibrio, della parola, della vista o del controllo dei movimenti? A) Sì, chiaramente B) Solo in parte C) No D) Nessuna delle precedenti
3. L'esordio è stato improvviso oppure graduale e ricorrente? A) Improvviso B) Graduale o ricorrente C) Non saprei D) Nessuna delle precedenti

Valutazione:
- Esito routing: FAIL ROUTING
- Pertinenza rispetto al primo input: non adeguata o non valutabile
- Supporto a branca/specialita/sotto-specialita: debole/assente
- Supporto a urgenza vs visita programmata: debole/assente
- Tiene conto di negazioni: si
- Tiene conto di fattori di rischio: non evidente
- Diagnosi/sospetti diagnostici nelle domande: assenti
- Prescrizioni/dosaggi/terapie operative nelle domande: assenti

Criticita:
- Copertura insufficiente dei segnali attesi: le domande toccano equilibrio ed esordio, ma non valorizzano abbastanza diplopia, deambulazione storta, vomito, fibrillazione atriale/anticoagulazione e urgenza.

Proposta di miglioramento:
Rafforzare precedenza del router sui segnali urgenti e ridurre il peso delle keyword ambigue isolate.

Priorita correzione: Alta

## ROUTING_03_URO_GRAVIDANZA_FEBBRE_FIANCO

Input utente:
Donna di 34 anni, incinta di 22 settimane. Da ieri ho bruciore quando urino e dolore al fianco destro. Stanotte ho avuto febbre a 38,8 con brividi e oggi mi sento molto debole. Ho anche nausea, ma pensavo fosse normale in gravidanza.

Domande mostrate:
1. La zona rossa è calda, gonfia, dolorosa e si sta allargando? A) Sì, chiaramente B) Solo in parte C) No D) Nessuna delle precedenti
2. Sono presenti febbre, brividi, debolezza, diabete, immunodepressione o rapido peggioramento? A) Sì, uno o più B) Non so / dubbio C) No D) Nessuna delle precedenti
3. La zona coinvolge volto/occhio o ci sono strie rosse, dolore sproporzionato o confusione? A) Sì B) Non so / dubbio C) No D) Nessuna delle precedenti

Valutazione:
- Esito routing: FAIL ROUTING
- Pertinenza rispetto al primo input: non adeguata o non valutabile
- Supporto a branca/specialita/sotto-specialita: presente
- Supporto a urgenza vs visita programmata: presente
- Tiene conto di negazioni: si
- Tiene conto di fattori di rischio: si
- Diagnosi/sospetti diagnostici nelle domande: assenti
- Prescrizioni/dosaggi/terapie operative nelle domande: assenti

Criticita:
- Copertura insufficiente dei segnali attesi e ramo non coerente: le domande sembrano orientate a cute/infezione superficiale, mentre il primo input contiene gravidanza, sintomi urinari, dolore al fianco, febbre, brividi e debolezza.

Proposta di miglioramento:
Rafforzare precedenza del router sui segnali urgenti e ridurre il peso delle keyword ambigue isolate.

Priorita correzione: Alta

## ROUTING_04_DERM_ORAL_ALLERGIA

Input utente:
Donna di 31 anni. Dopo aver mangiato frutta secca ho iniziato ad avere prurito diffuso, labbra gonfie e un po' di difficolta a respirare. Non ho febbre. Ho gia avuto allergie in passato.

Domande mostrate:
1. La lesione cutanea, il neo o la macchia sono cambiati rapidamente per dimensione, colore, forma o rilievo? A) Si, cambiamento evidente o rapido B) Cambiamento lieve o dubbio C) No, sembra stabile D) Nessuna delle precedenti
2. Hai notato sanguinamento, croste, dolore, prurito intenso o margini irregolari nella zona? A) Si, uno o piu segni evidenti B) Solo fastidio lieve C) No D) Nessuna delle precedenti
3. Il problema riguarda un singolo punto preciso o piu aree della pelle? A) Singola lesione/neo ben preciso B) Piu chiazze o lesioni C) Eruzione diffusa o prurito generale D) Nessuna delle precedenti

Valutazione:
- Esito routing: FAIL ROUTING
- Pertinenza rispetto al primo input: non adeguata o non valutabile
- Supporto a branca/specialita/sotto-specialita: debole/assente
- Supporto a urgenza vs visita programmata: debole/assente
- Tiene conto di negazioni: si
- Tiene conto di fattori di rischio: non evidente
- Diagnosi/sospetti diagnostici nelle domande: assenti
- Prescrizioni/dosaggi/terapie operative nelle domande: assenti

Criticita:
- Copertura insufficiente dei segnali attesi e ramo troppo dermatologico ordinario: le domande non valorizzano abbastanza esposizione a frutta secca, gonfiore labbra, difficolta respiratoria, precedenti allergici e urgenza.

Proposta di miglioramento:
Rafforzare precedenza del router sui segnali urgenti e ridurre il peso delle keyword ambigue isolate.

Priorita correzione: Alta

## ROUTING_05_GASTRO_FECI_SCURE_ANTICOAGULANTE

Input utente:
Donna di 69 anni. Da due giorni ho feci molto scure quasi nere, mi sento debole e quando mi alzo ho capogiri. Da mesi prendo un anticoagulante per fibrillazione atriale. Non ho vomitato sangue e non ho dolore addominale forte.

Domande mostrate:
Non catturate.

Valutazione:
- Esito routing: NON VALUTABILE
- Pertinenza rispetto al primo input: non adeguata o non valutabile
- Supporto a branca/specialita/sotto-specialita: debole/assente
- Supporto a urgenza vs visita programmata: debole/assente
- Tiene conto di negazioni: si
- Tiene conto di fattori di rischio: non evidente
- Diagnosi/sospetti diagnostici nelle domande: assenti
- Prescrizioni/dosaggi/terapie operative nelle domande: assenti

Criticita:
- Secondo blocco anamnestico non mostrato: il flusso sembra bypassare le domande per urgenza, quindi la pertinenza del routing anamnestico non e valutabile su questo caso.

Proposta di miglioramento:
Se il bypass e voluto per urgenza, documentare che il router non mostra domande; altrimenti prevedere domande minime di conferma urgenza.

Priorita correzione: Alta tecnica

## ROUTING_06_ORTO_LOMBALGIA_RED_FLAGS

Input utente:
Uomo di 52 anni. Da ieri ho un forte mal di schiena lombare dopo aver sollevato un peso. Pero da qualche ora sento formicolio tra le gambe e faccio fatica a trattenere la pipi. Non ho febbre.

Domande mostrate:
1. Formicolii o perdita di sensibilità sono localizzati, bilaterali o progressivi nel tempo? A) Progressivi o diffusi B) Intermittenti/localizzati C) Non so D) Nessuna delle precedenti
2. Hai perdita di forza, difficoltà a camminare, disturbi del linguaggio, vista doppia o problemi urinari/fecali? A) Sì B) Solo in parte C) No D) Nessuna delle precedenti
3. Il sintomo è iniziato improvvisamente oppure è graduale/ricorrente da settimane o mesi? A) Improvviso B) Graduale o ricorrente C) Non saprei D) Nessuna delle precedenti

Valutazione:
- Esito routing: FAIL ROUTING
- Pertinenza rispetto al primo input: non adeguata o non valutabile
- Supporto a branca/specialita/sotto-specialita: debole/assente
- Supporto a urgenza vs visita programmata: presente
- Tiene conto di negazioni: si
- Tiene conto di fattori di rischio: non evidente
- Diagnosi/sospetti diagnostici nelle domande: assenti
- Prescrizioni/dosaggi/terapie operative nelle domande: assenti

Criticita:
- Copertura insufficiente dei segnali attesi: le domande intercettano alcuni aspetti neurologici/urinari, ma non valorizzano abbastanza area sella, controllo urine/feci, debolezza gambe, dolore severo, progressione e necessita di accesso urgente.

Proposta di miglioramento:
Rafforzare precedenza del router sui segnali urgenti e ridurre il peso delle keyword ambigue isolate.

Priorita correzione: Alta


## Pattern Di Errore Del Routing Anamnestico

- mandibola: rischio di deviazione verso odontoiatria se letta come sede orale isolata; va pesata con dispnea, nausea, fattori cardiovascolari e negazione del dolore toracico tipico.
- nausea: puo appartenere a gastroenterologia, gravidanza, allergia o quadri cardio-atipici; il contesto deve prevalere sulla keyword.
- vomito: puo spingere verso gastro/cefalea, ma in vertigini con diplopia e instabilita va mantenuto nel perimetro neurologico urgente.
- vertigini: non devono diventare automaticamente ORL se coesistono diplopia, atassia, fibrillazione atriale o esordio recente.
- labbra/bocca: in presenza di frutta secca, prurito diffuso e dispnea devono attivare allergologia/urgenza, non odontoiatria.
- fianco: in gravidanza con febbre, brividi e sintomi urinari non va trattato come disturbo urinario semplice.
- schiena: con formicolio area sella o disturbi urinari/fecali richiede ramo urgenza/neuro-rachide, non lombalgia meccanica ordinaria.
- sangue/feci scure: con anticoagulante, debolezza e capogiri deve restare su urgenza gastroenterologica.
- gravidanza: deve aumentare la prudenza e non normalizzare nausea o sintomi sistemici.

## Regole Consigliate Per Il Router Anamnestico

1. Valutare l'input come frase intera prima delle singole keyword anatomiche.
2. Dare precedenza ai cluster tempo-dipendenti o urgenti rispetto alle sedi anatomiche isolate.
3. Pesare le negazioni come contesto, non come esclusione automatica di urgenza.
4. Se una keyword e ambigua, usare sintomi associati e fattori di rischio per decidere il ramo.
5. Per gravidanza, anticoagulanti, diabete, fibrillazione atriale e dispnea, aumentare la soglia di prudenza.
6. Evitare domande su branca ordinaria quando esistono red flag sistemiche o neurologiche.
7. Le domande devono raccogliere informazioni, non formulare diagnosi o sospetti diagnostici.
8. Le domande non devono contenere prescrizioni, dosaggi o indicazioni terapeutiche operative.
9. Ogni blocco anamnestico dovrebbe contenere almeno una domanda utile a distinguere urgenza da visita programmata.
10. Mantenere un set di regressione per keyword ambigue: mandibola, nausea, vomito, vertigini, labbra/bocca, fianco, schiena, feci scure, gravidanza.
