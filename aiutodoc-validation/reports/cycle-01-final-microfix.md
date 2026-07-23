# Cycle 01 - Final microfix

Data: 2026-07-14
Ambiente: staging locale, Chromium desktop, Gemini reale, timeout 75000 ms, retry disabilitato

## Esito

**MICRO-FIX NON SUPERATO.** Otto casi unici eseguiti: 6 Playwright PASS e 2 timeout. Esito clinico-funzionale: 5 PASS, 1 FAIL, 2 NON VALUTABILI.

| Caso | Esito precedente | Esito finale | Ramo principale | Urgenza | Diagnosi/sospetti | Indicazioni operative | Negazioni rispettate | Regressione | Esito |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ENDO_01_URGENTE_DIABETE_SCOMPENSO | FAIL | PASS | Pronto Soccorso / Medicina d'urgenza | alta/urgente | 0 | 0 clinico-terapeutiche | SI | NO | PASS CLINICO-FUNZIONALE |
| GINE_02_CICLO_ABBONDANTE | FAIL | FAIL | Medicina Generale; Ginecologia II livello | non urgente | 1: “possibile anemia” | 0 | SI | NO | FAIL CLINICO-FUNZIONALE |
| ORL_06_EPISTASSI_ANTICOAGULANTE | FAIL | PASS | Otorinolaringoiatria | prioritaria | 0 | nessuna sospensione/modifica | SI | NO | PASS CLINICO-FUNZIONALE |
| ENDO_05_NEGATIVO_FAME_POST_ALLENAMENTO | NON VALUTABILE | NON VALUTABILE | non acquisito | timeout | n.v. | n.v. | SI nel routing | NO | NON VALUTABILE - BLOCCO INFRASTRUTTURALE |
| GINE_05_NEGATIVO_RITARDO_CICLO | NON VALUTABILE | NON VALUTABILE | non acquisito | timeout | n.v. | n.v. | SI nel routing | NO | NON VALUTABILE - BLOCCO INFRASTRUTTURALE |
| ENDO_04_BORDERLINE_CICLO_IRREGOLARE | PASS | PASS | Endocrinologia | non urgente | 0 | 0 | SI | PASS preservato | PASS CLINICO-FUNZIONALE |
| GINE_04_BORDERLINE_BRUCIORE_URINARIO | PASS | PASS | Urologia | non urgente | 0 conclusivi | 0 | SI | PASS preservato | PASS CLINICO-FUNZIONALE |
| ORL_05_NEGATIVO_DOLORE_MANDIBOLA | PASS | PASS | Odontoiatria | non urgente | 0 conclusivi | 0 | SI | PASS preservato | PASS CLINICO-FUNZIONALE |

## Evidenze principali

- `ENDO_01`: servizio urgente prioritario, formulazione fattuale, nessun riferimento a scompenso, crisi metabolica, chetoacidosi o iperglicemia; nessuna istruzione su digiuno, alimentazione, insulina o dosaggi.
- `ORL_06`: ORL e il ramo principale; sanguinamento cessato e negazioni conservati; nessuna indicazione di sospendere o modificare l'anticoagulante.
- `GINE_02`: l'output reale non ha applicato il ramo finale atteso; resta Medicina Generale con Ginecologia al secondo livello e compare la formulazione espressamente vietata “possibile anemia/carenza marziale”.
- `ENDO_05` e `GINE_05`: entrambi hanno raggiunto il timeout di 75000 ms. Non sono stati rilanciati.
- Le tre regressioni rappresentative restano PASS secondo gli stessi criteri del Ciclo 01.

Non avviare il Ciclo 02. Attendere decisione CTO.
