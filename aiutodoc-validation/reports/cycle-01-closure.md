# Cycle 01 - Closure

Data: 2026-07-14
Ambiente: staging locale, Chromium desktop, Gemini reale, timeout 75000 ms

## Esito

**CICLO 01 NON CHIUDIBILE.** Quattro casi unici eseguiti: 2 Playwright PASS e 2 NON VALUTABILI dopo un retry tecnico ciascuno. Il FAIL reale `GINE_02` e stato corretto ed e PASS clinico-funzionale; manca tuttavia il requisito 4/4 casi valutabili.

| Caso | Stato precedente | Playwright | Ramo principale | Diagnosi/sospetti | Prescrizioni | Domande fuori ramo | Regressione | Esito finale |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GINE_02_CICLO_ABBONDANTE | FAIL | PASS | Ginecologia / Ginecologo | 0 | 0 | NO | NO | PASS CLINICO-FUNZIONALE |
| ENDO_05_NEGATIVO_FAME_POST_ALLENAMENTO | NON VALUTABILE | TIMEOUT + RETRY TIMEOUT | non acquisito | n.v. | n.v. | NO nel routing | NO | NON VALUTABILE - BLOCCO INFRASTRUTTURALE |
| GINE_05_NEGATIVO_RITARDO_CICLO | NON VALUTABILE | TIMEOUT + RETRY TIMEOUT | non acquisito | n.v. | n.v. | NO nel routing | NO | NON VALUTABILE - BLOCCO INFRASTRUTTURALE |
| GINE_04_BORDERLINE_BRUCIORE_URINARIO | PASS | PASS | Urologia | 0 | 0 | NO | PASS preservato | PASS CLINICO-FUNZIONALE |

## Root cause e correzione

- Le domande di `GINE_02` erano gia pertinenti.
- Gemini produceva Medicina Generale e la formulazione “possibile anemia/carenza marziale”.
- Il post-processing disponeva gia di un override ginecologico, ma il relativo matcher non normalizzava gli accenti e quindi non riconosceva `più` nel raw reale.
- Il matcher e ora accent-insensitive e richiede il cluster semantico completo: ciclo/mestruazioni, flusso molto abbondante, durata maggiore, ricorrenza per mesi e stanchezza.
- L'output finale assegna Ginecologia/Ginecologo come ramo principale, urgenza programmata o tempestiva secondo i segnali raccolti e non contiene anemia, carenza marziale, diagnosi, sospetti, ferro o dosaggi.

## Timeout

`ENDO_05` e `GINE_05` hanno ricevuto un tentativo ordinario e un solo retry tecnico, con input, codice e criteri invariati. Tutti e quattro i tentativi sono scaduti a 75000 ms senza output finale; i raw separati sono conservati. Non sono classificati come FAIL clinici.

Non avviare il Ciclo 02. Attendere decisione CTO.
