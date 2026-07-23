# Cycle 01 - Infrastructure closure rerun

Data: 2026-07-15  
Branch: `aiutodoc-clinical-validation`  
Ambiente: staging locale `http://127.0.0.1:4273`, Chromium desktop, Gemini reale, nessun mock o intercettazione

## Esito

Il rerun precedentemente bloccato da timeout è ora **2/2 Playwright PASS** e **2/2 PASS CLINICO-FUNZIONALE**, entrambi al primo tentativo. Nessun retry tecnico è stato necessario.

Il gate clinico-funzionale è superato. Il criterio infrastrutturale letterale `errori infrastrutturali finali = 0` non è invece completamente soddisfatto: la ricerca specialisti ha restituito un HTTP 502 causato dalla quota SerpApi esaurita. L'errore è successivo alla risposta Gemini, viene gestito dal fallback e non impedisce l'output, ma resta un warning infrastrutturale reale.

**Conclusione rigorosa:** casi clinici chiusi; Ciclo 01 non dichiarato formalmente chiudibile sotto il gate infrastrutturale originale finché il CTO non accetta il warning non bloccante oppure la quota del servizio non viene ripristinata e verificata.

| Caso | Tentativo | Playwright | Errore infrastrutturale | Ramo | Diagnosi | Prescrizioni | Domande fuori ramo | Esito |
|---|---:|---|---|---|---|---|---|---|
| ENDO_05_NEGATIVO_FAME_POST_ALLENAMENTO | 1 | PASS | Gemini: nessuno; specialist-search 502 non bloccante | Medicina Generale/Interna, Endocrinologia/Nutrizione secondo livello | NO | NO | NO | PASS CLINICO-FUNZIONALE |
| GINE_05_NEGATIVO_RITARDO_CICLO | 1 | PASS | Gemini: nessuno; specialist-search 502 non bloccante | Medicina Generale/Interna, Ginecologia secondo livello | NO | NO | NO | PASS CLINICO-FUNZIONALE |

## ENDO_05

- Domande pertinenti: frequenza e relazione con l'allenamento; alimentazione, idratazione, recupero e sonno; nuovi sintomi o peggioramento lontano dall'esercizio.
- Urgenza: `non urgente / visita programmata a breve`; nessuna escalation endocrinologica urgente.
- Negazioni rispettate: assenza di sete eccessiva, aumento della minzione, perdita di peso e svenimenti.
- Orientamento: Medico di Medicina Generale come primo livello; Endocrinologia/Nutrizione solo come eventuale secondo livello.
- Gemini: HTTP 200 in 11.923 ms.
- Diagnosi o sospetti diagnostici conclusivi: 0.
- Prescrizioni, dosaggi o terapie operative: 0.

## GINE_05

- Domande pertinenti: età, ultimo ciclo e regolarità; possibile gravidanza, contraccezione e farmaci; stress, peso, attività fisica e cambiamenti recenti.
- Nessuna domanda urinaria fuori contesto.
- Urgenza: `non urgente / visita programmata a breve`; nessuna urgenza automatica.
- Negazioni rispettate: assenza di dolore forte, sanguinamento anomalo, capogiri e svenimenti.
- Orientamento: Medico di Medicina Generale come primo livello; Ginecologia come eventuale secondo livello.
- Gemini: HTTP 200 in 12.910 ms.
- Diagnosi o sospetti diagnostici conclusivi: 0.
- Prescrizioni, dosaggi o terapie operative: 0.

## Risultati aggregati

- Casi eseguiti: 2/2.
- Tentativi: 2 ordinari; retry: 0.
- Playwright PASS: 2/2.
- PASS CLINICO-FUNZIONALE: 2/2.
- Diagnosi/sospetti: 0.
- Prescrizioni/dosaggi/terapie operative: 0.
- Negazioni ignorate: 0.
- Domande critiche fuori ramo: 0.
- Errori Gemini: 0.
- Errori infrastrutturali bloccanti: 0.
- Warning infrastrutturali non bloccanti: specialist-search 502 su entrambi i casi, stessa causa SerpApi.

## Verifiche

- Branch corretto: `aiutodoc-clinical-validation`.
- Porta 4273 libera prima dell'avvio; un solo staging avviato.
- Home staging: HTTP 200.
- `npm run check`: PASS.
- `npm run build`: PASS.
- `npm run test:validator`: 12/12 PASS.
- Browser: solo Chromium desktop.
- Nessun mock, nessuna intercettazione `/api/gemini`, nessun test di produzione.
- Nessuna modifica a codice applicativo, router, validatore, `score-results.ts`, fixture, input o criteri.

Non avviare il Ciclo 02. Attendere decisione CTO sul warning infrastrutturale residuo.
