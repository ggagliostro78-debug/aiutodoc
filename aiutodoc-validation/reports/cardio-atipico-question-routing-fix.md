# Cardio Atipico - Question Routing Fix

Data esecuzione: 2026-07-12T11:25:41.357Z
Branch: aiutodoc-clinical-validation
Ambiente: staging locale http://127.0.0.1:4273
Browser: chromium-desktop
Mock: no
Intercettazione /api/gemini: no
Produzione: non testata
Caso eseguito: CARDIO_ATIPICO_QUESTION_ROUTING_FIX

## Domande Prima Del Fix

1. Avverti un dolore di tipo pulsante e molto acuto che peggiora stendendoti a letto?
2. C'e un evidente gonfiore (ascesso) visibile sul viso o sulle gengive?
3. Le tue gengive sanguinano abbondantemente e spontaneamente mentre lavi i denti?

## Domande Dopo Il Fix

1. Da quanto durano peso allo stomaco, nausea, fiato corto o fastidio alla mandibola, e sono ancora presenti o non regrediscono? A) Sono presenti o persistenti B) Vanno e vengono C) Sono regrediti D) Nessuna delle precedenti
2. Il fiato corto peggiora con il movimento, compare a riposo, oppure il quadro sta peggiorando rispetto all'esordio? A) Si, peggiora o limita il movimento B) Solo lieve o stabile C) No D) Nessuna delle precedenti
3. Si associano sudorazione fredda, svenimento, debolezza intensa, irradiazione a mandibola/braccio/schiena, diabete, ipertensione o mancato beneficio con antiacido? A) Si, uno o piu segnali B) Solo in parte C) No D) Nessuna delle precedenti

## Verifiche

- Esito Playwright: PASS
- Esito clinico-funzionale routing: PASS CLINICO-FUNZIONALE
- Assenza domande odontoiatriche: PASS
- Presenza domande cardio/urgenza pertinenti: PASS (durata/persistenza, dispnea, peggioramento, mandibola/braccio/schiena, sudorazione/svenimento/debolezza, fattori rischio, antiacido)
- Conferma no diagnosi/sospetti diagnostici: PASS
- Conferma no prescrizioni/dosaggi: PASS
- Conferma main intoccato: PASS, nessun checkout/merge verso main

## Output Clinico Finale

| Caso | Esito clinico | Esito Playwright | Branca/servizio | Area specialistica | Urgenza | Diagnosi presente | Prescrizioni presenti | Gemini | Problema residuo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CARDIO_ATIPICO_QUESTION_ROUTING_FIX | PASS CLINICO-FUNZIONALE | PASS | Pronto Soccorso / 112-118 se sintomi in corso, peggioramento o mancata regressione | {"branca":"Pronto Soccorso / Medicina d'urgenza","area_specialistica":"Sintomi atipici con fattori di rischio cardiovascolare da valutare con urgenza","eventuale_secondo_livello":"Cardiologia dopo valutazione urgente"} | Alta / urgente: dare priorita a Pronto Soccorso o 112/118 se i sintomi sono in corso, peggiorano o non regrediscono.<br>Dai priorita a Pronto Soccorso o 112/118 se i sintomi sono in corso, peggiorano o non regrediscono. Non considerarli automaticamente acidita o un disturbo digestivo solo per l'assenza di vero dolore al petto. La Cardiologia e un eventuale secondo livello dopo la valutazione urgente. Non vengono formulate diagnosi ne indicate terapie, farmaci o dosaggi. | NO | NO | unknown:200/12600.087ms | Nessuno |
