# Ciclo 03 - chiusura finale

Data: 2026-07-16

## Esito

Il caso `PED_02_FEBBRE_BAMBINO_PROGRAMMATA` ha prodotto **Playwright PASS** e **PASS clinico-funzionale** dopo la correzione esclusiva dell'asserzione lessicale del runner temporaneo. Il prodotto non e stato modificato.

L'asserzione ora riconosce correttamente sia `durata` sia l'espressione semanticamente equivalente `quanto dura`.

| Caso | Eta | Peso | Altezza | Gemini | Branca | Urgenza | Negazioni | Diagnosi | Prescrizioni | Playwright | Esito |
|---|---:|---:|---:|---|---|---|---|---:|---:|---|---|
| PED_02_FEBBRE_BAMBINO_PROGRAMMATA | 7 | 24 kg | 125 cm | reale, HTTP 200 | Pediatria / Pediatra | bassa, programmata o tempestiva secondo andamento | rispettate 4/4 | 0 | 0 | PASS | PASS clinico-funzionale |

## Evidenze

- Coda condizionata completata: `exact_age` -> `weight_kg` -> `height_cm`.
- Secondo blocco pertinente: durata, temperatura massima, metodo di misurazione, idratazione, urine, vigilanza, alimentazione, respiro, dolore, tosse, vomito, diarrea, rash, farmaci e condizioni croniche.
- Branca principale: Pediatria; specialista: Pediatra.
- Urgenza non emergenziale; nessun 112/118 e nessun Pronto Soccorso automatico.
- Negazioni rispettate: difficolta respiratoria, rigidita del collo, macchie violacee e convulsioni.
- Diagnosi o sospetti diagnostici: 0. Prescrizioni, dosaggi o antibiotici: 0.
- Gemini reale e non intercettato: HTTP 200.
- `RICERCA SPECIALISTI NON ESEGUITA PER SCELTA METODOLOGICA`.
- Chiamate esterne di ricerca specialisti: 0.
- File protetti invariati: hash iniziali/finali identici 10/10.

## Chiusura gate

- Pediatria: **gate SUPERATO 6/6**.
- Oculistica: **gate SUPERATO**.
- Allergologia: **gate SUPERATO**.
- Ciclo 03: **SUPERATO E CHIUSO**.

Nessun Ciclo 04 avviato. `main` non testato e non modificato.
