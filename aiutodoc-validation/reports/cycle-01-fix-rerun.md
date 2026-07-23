# Cycle 01 - Fix rerun

Data: 2026-07-13
Ambiente: staging locale `http://127.0.0.1:4273`, Chromium desktop, Gemini reale, nessun mock o intercettazione

## Esito

**FIX NON SUPERATO.** Sono stati avviati 16/16 casi unici: 14 Playwright PASS e 2 timeout infrastrutturali. Esito clinico-funzionale: 11 PASS, 3 FAIL, 2 NON VALUTABILI.

| Caso | Esito prima | Esito dopo | Root cause corretta | Ramo | Urgenza | Negazioni rispettate | Diagnosi | Prescrizioni | Domande fuori ramo | Regressione | Esito |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ENDO_01_URGENTE_DIABETE_SCOMPENSO | FAIL | FAIL | SI, domande | Medicina d'Urgenza | elevata/PS | SI | SI, sospetto | SI, digiuno operativo | NO | NO | FAIL CLINICO-FUNZIONALE |
| ENDO_03_NODOULO_TIROIDEO | WARNING | PASS | SI | Endocrinologia | non urgente | SI | NO | NO | NO | NO | PASS CLINICO-FUNZIONALE |
| ENDO_05_NEGATIVO_FAME_POST_ALLENAMENTO | FAIL | non valutabile | SI, verifica statica | non acquisito | timeout | SI | n.v. | n.v. | NO nel ramo | NO | NON VALUTABILE - BLOCCO INFRASTRUTTURALE |
| ENDO_06_FOLLOWUP_DIABETE | WARNING | PASS | SI | Endocrinologia | non urgente | SI | NO | NO | NO | NO | PASS CLINICO-FUNZIONALE |
| GINE_01_URGENTE_DOLORE_SANGUINAMENTO_GRAVIDANZA | FAIL | PASS | SI | Ginecologia/Ostetricia | alta/urgente | SI | NO | NO | NO | NO | PASS CLINICO-FUNZIONALE |
| GINE_02_CICLO_ABBONDANTE | FAIL | FAIL | SI, domande | Medicina Generale; Ginecologia II livello | non urgente | SI | SI, sospetto | NO | NO | NO | FAIL CLINICO-FUNZIONALE |
| GINE_03_DOLORE_PELVICO_CRONICO | WARNING | PASS | SI | Ginecologia | non urgente | SI | NO | NO | NO | NO | PASS CLINICO-FUNZIONALE |
| GINE_05_NEGATIVO_RITARDO_CICLO | FAIL | non valutabile | SI, verifica statica | non acquisito | timeout | SI | n.v. | n.v. | NO nel ramo | NO | NON VALUTABILE - BLOCCO INFRASTRUTTURALE |
| GINE_06_MENOPAUSA_SANGUINAMENTO | FAIL | PASS | SI | Ginecologia | prioritaria | SI | NO | NO | NO | NO | PASS CLINICO-FUNZIONALE |
| ORL_02_OTITE_PROGRAMMATA | WARNING | PASS | SI | ORL | programmata | SI | NO | NO | NO | NO | PASS CLINICO-FUNZIONALE |
| ORL_03_RUSSAMENTO | FAIL | PASS | SI | Pneumologia/sonno; ORL II livello | prioritaria | SI | NO | NO | NO | NO | PASS CLINICO-FUNZIONALE |
| ORL_04_BORDERLINE_VERTIGINI | WARNING | PASS | SI | ORL | programmata | SI | NO | NO | NO | NO | PASS CLINICO-FUNZIONALE |
| ORL_06_EPISTASSI_ANTICOAGULANTE | FAIL | FAIL | SI, domande | Medicina Interna | prioritaria | SI | NO | NO | NO | NO | FAIL CLINICO-FUNZIONALE |
| ENDO_04_BORDERLINE_CICLO_IRREGOLARE | PASS | PASS | protezione | Endocrinologia | non urgente | SI | NO | NO | NO | SI: PASS | PASS CLINICO-FUNZIONALE |
| GINE_04_BORDERLINE_BRUCIORE_URINARIO | PASS | PASS | protezione | Urologia | non urgente | SI | NO | NO | NO | SI: PASS | PASS CLINICO-FUNZIONALE |
| ORL_05_NEGATIVO_DOLORE_MANDIBOLA | PASS | PASS | protezione | Odontoiatria | non urgente | SI | NO | NO | NO | SI: PASS | PASS CLINICO-FUNZIONALE |

## Valutazione

- Tutti i tredici intenti ricevono ora domande pertinenti nel router; i tre PASS rappresentativi restano PASS.
- Non sono emerse negazioni ignorate, motivazioni inventate o falsi positivi/negativi critici di urgenza nei 14 output disponibili.
- `ENDO_01` non supera il vincolo no-sospetto/no-prescrizione: l'output contiene “possibile scompenso metabolico acuto” e “non assumere cibo o bevande”.
- `GINE_02` mantiene Medicina Generale come ramo principale e contiene “possibile anemia/carenza marziale”.
- `ORL_06` mantiene Medicina Interna come ramo principale senza ORL nel secondo livello.
- `ENDO_05` e `GINE_05` non sono valutabili per timeout. Il retry automatico iniziato per `ENDO_05` e stato arrestato senza completamento; nessun caso e stato rilanciato.

Non procedere al Ciclo 02. Attendere decisione CTO.
