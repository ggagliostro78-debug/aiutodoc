# Cycle 01 - Closure Ginecologia

## Esito

| Caso | Playwright | Clinico-funzionale | Evidenza |
| --- | --- | --- | --- |
| GINE_02_CICLO_ABBONDANTE | PASS | PASS | Ginecologo principale; branca Ginecologia; visita programmata con escalation condizionale; nessuna diagnosi, anemia/carenza marziale, prescrizione o dosaggio. |
| GINE_05_NEGATIVO_RITARDO_CICLO | TIMEOUT + RETRY TIMEOUT | NON VALUTABILE | Entrambi i tentativi sono scaduti a 75000 ms; domande del ramo pertinenti e nessun fix preventivo applicato. |
| GINE_04_BORDERLINE_BRUCIORE_URINARIO | PASS | PASS | Urologia preservata, Ginecologia solo eventuale secondo livello, negazione della gravidanza rispettata. |

Il FAIL residuo `GINE_02` e chiuso. Il gate complessivo non e chiudibile per il blocco infrastrutturale persistente di `GINE_05` e, fuori da questa tabella di branca, `ENDO_05`.
