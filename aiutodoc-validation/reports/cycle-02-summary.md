# Ciclo 02 - Summary

Data: 2026-07-15  
Branch: `aiutodoc-clinical-validation`  
Ambiente: staging locale `http://127.0.0.1:4273`, Chromium desktop, Gemini reale

## Esito complessivo

**CICLO 02 NON SUPERATO.** Tutti i 18 casi sono tecnicamente valutabili e Playwright PASS, ma ogni branca presenta almeno un FAIL clinico-funzionale.

| Branca | Casi valutabili | PASS | WARNING | FAIL | BYPASS | Warning SerpApi | Gate clinico |
|---|---:|---:|---:|---:|---:|---:|---|
| Gastroenterologia | 6/6 | 0 | 2 | 4 | 0 | 6 | NON SUPERATO |
| Neurologia | 6/6 | 2 | 2 | 2 | 0 | 6 | NON SUPERATO |
| Pneumologia | 6/6 | 1 | 2 | 2 | 1 | 4 | NON SUPERATO |
| **Totale** | **18/18** | **3** | **6** | **8** | **1** | **16** | **NON SUPERATO** |

## Indicatori

- Playwright PASS: 18/18.
- Casi non valutabili: 0.
- Gemini HTTP 200: 16/16 percorsi non bypassati.
- Bypass urgenti: 2; appropriato 1, falso positivo critico 1.
- Diagnosi o sospetti diagnostici conclusivi: 0.
- Prescrizioni o dosaggi: 0.
- Negazioni ignorate formalmente: 0.
- Falsi negativi critici: 1 (`NEURO_01`).
- Falsi positivi critici: 1 (`PNEUMO_05`).
- Domande fuori ramo critiche: 3 (`GASTRO_02`, `GASTRO_04`, `NEURO_05`).
- Warning SerpApi non bloccanti: 16; esclusi dal gate clinico.

## Rischi principali

1. **Routing anamnestico:** reflusso e dolore toracico post-prandiale ricevono domande urinarie; stanchezza da sonno insufficiente riceve domande psichiatriche ad alta gravità.
2. **Urgenza:** deficit neurologico acuto non attiva bypass immediato; dispnea post-corsa risolta lo attiva impropriamente.
3. **Copertura di sicurezza:** dolore addominale instabile, sanguinamento con anticoagulante ed emottisi non ricevono tutte le domande minime richieste.
4. **Fedeltà all'input:** `GASTRO_06` introduce feci scure, debolezza e capogiri non riferiti e in parte esplicitamente negati.

## Separazione gate ricerca

Non esiste una modalità configurabile già prevista per disabilitare soltanto `specialist-search`. Il flusso è rimasto reale e invariato. I `502` dovuti alla quota SerpApi sono registrati come `WARNING INFRASTRUTTURALE NON BLOCCANTE - SERPAPI` e non modificano alcun esito clinico.

## Verifiche

- `npm run check`: PASS.
- `npm run build`: PASS.
- `npm run test:validator`: 12/12 PASS.
- Playwright: 18/18 PASS, zero retry.
- Nessun mock clinico e nessuna intercettazione `/api/gemini`.
- Nessuna produzione, nessun mobile, nessun Ciclo 03.
- Nessun fix applicato durante l'audit.

Attendere decisione CTO esplicita.
