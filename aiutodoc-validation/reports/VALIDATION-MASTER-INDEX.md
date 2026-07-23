# AiutoDoc - Validation Master Index

Primo documento da leggere per lo stato corrente del branch clinico.

Generated: 2026-07-16T23:17:01.419Z  
Branch: `aiutodoc-clinical-validation`  
Commit: `f5b58abffa615ab04ec0a6acf83392e08e7fc52b`

## Regola di prevalenza

Caso finale > branca finale > ciclo finale > chiusura tecnica > rerun finale > fix > audit iniziale > raw. Esito clinico, tipo percorso ed esito tecnico non sono intercambiabili. Un raw non prevale su una adjudication finale.

## Stato corrente

- Ciclo 01: **SUPERATO E CHIUSO SUL PIANO CLINICO-FUNZIONALE** per decisione CTO sulla metodologia SerpApi.
- Ciclo 02: **SUPERATO E CHIUSO SUI CASI DEL PROGRAMMA**.
- Ciclo 03: **SUPERATO E CHIUSO SUI CASI DEL PROGRAMMA**.
- Routing finale: **19 casi, 17 PASS ROUTING e 2 BYPASS documentati**.
- 7 casi restano **NON ADJUDICATI**.
- Nessuna dichiarazione riguarda automaticamente main o produzione.

## Documenti ufficiali

- [VALIDATION-FINAL-STATUS.md](VALIDATION-FINAL-STATUS.md)
- [VALIDATION-REPORT-MAP.md](VALIDATION-REPORT-MAP.md)
- [VALIDATION-CASE-REGISTRY.md](VALIDATION-CASE-REGISTRY.md)
- [VALIDATION-RAW-REGISTRY.md](VALIDATION-RAW-REGISTRY.md)
- [VALIDATION-CONSISTENCY-AUDIT.md](VALIDATION-CONSISTENCY-AUDIT.md)
- [VALIDATION-ANTI-HALLUCINATION-AUDIT.md](VALIDATION-ANTI-HALLUCINATION-AUDIT.md)
- [VALIDATION-CONSOLIDATION-FINAL-VERIFICATION.md](VALIDATION-CONSOLIDATION-FINAL-VERIFICATION.md)
- [VALIDATION-CONTINUITY-HANDOFF.md](VALIDATION-CONTINUITY-HANDOFF.md)
- Manifest: `artifacts/validation-master-manifest.json`

## Branche e perimetro

| Branca | Programma | Stato | Fonte | Nota |
|---|---|---|---|---|
| Cardiologia | Batch 01: 5 casi | CHIUSA SUI 5 CASI DEL BATCH 01 | batch-01-cardiologia.md + batch-01-cardiologia-fix.md + cardio04-hypertensive-crisis-fix.md | Chiusura composta; altri casi cardio sono evidenze separate. |
| Neurologia | Batch 02: 5 casi; Ciclo 02: 6 casi | CHIUSA SUI CASI DEI DUE PROGRAMMI | batch-02-neurologia.md + neuro04-stroke-fast-fix.md + cycle-02-fix-rerun.md + cycle-02-technical-closure.md | Non equivale a validazione universale della branca. |
| Psicologia/Psichiatria | Batch 03: 5 casi | CHIUSA SUI 5 CASI DEL BATCH 03 | batch-03-psicologia-psichiatria.md + psy01-panic-urgency-fix.md | Chiusura composta. |
| Ortopedia e Traumatologia | Batch 04: 5 casi | CHIUSA SUI 5 CASI DEL BATCH 04 | batch-04-ortopedia.md + batch-04-ortopedia-fix.md | ORTO_02 e preservato dal batch originario. |
| Dermatologia | Batch 05: 5 casi | CHIUSA SUI 5 CASI DEL BATCH 05 | batch-05-dermatologia-fix.md | Rerun 5/5. |
| Gastroenterologia | Batch 06: 5 casi; Ciclo 02: 6 casi | CHIUSA SUI CASI DEI DUE PROGRAMMI | batch-06-gastroenterologia.md + batch-06-gastroenterologia-fix.md + cycle-02-fix-rerun.md | Copertura parziale della branca. |
| Pneumologia | Batch 07: 5 casi; Ciclo 02: 6 casi | CHIUSA SUI CASI DEI DUE PROGRAMMI | batch-07-pneumologia.md + batch-07-pneumologia-fix.md + cycle-02-fix-rerun.md | Copertura parziale della branca. |
| Urologia/Nefrologia | Batch 08: 5 casi | CHIUSA SUI 5 CASI DEL BATCH 08 | batch-08-urologia-nefrologia.md + batch-08-urologia-nefrologia-fix.md | Chiusura composta. |
| Otorinolaringoiatria | Ciclo 01: 6 casi | CLINICAMENTE CHIUSA SUI 6 CASI DEL CICLO 01 | cycle-01-otorinolaringoiatria.md + cycle-01-fix-rerun.md + cycle-01-final-otorinolaringoiatria.md | SerpApi fuori dal gate. |
| Endocrinologia | Ciclo 01: 6 casi | CLINICAMENTE CHIUSA SUI 6 CASI DEL CICLO 01 | cycle-01-endocrinologia.md + cycle-01-fix-rerun.md + cycle-01-final-endocrinologia.md + cycle-01-infrastructure-closure.md | Riserva SerpApi storica assorbita. |
| Ginecologia/Ostetricia | Ciclo 01: 6 casi | CLINICAMENTE CHIUSA SUI 6 CASI DEL CICLO 01 | cycle-01-ginecologia.md + cycle-01-fix-rerun.md + cycle-01-closure.md + cycle-01-infrastructure-closure.md | Riserva SerpApi storica assorbita. |
| Pediatria | Ciclo 03: 6 casi | CHIUSA SUI 6 CASI DEL CICLO 03 | cycle-03-pediatria-rerun.md + cycle-03-pediatria-final-closure.md + cycle-03-final-closure.md | Chiusura composta. |
| Oculistica/Oftalmologia | Ciclo 03: 6 casi | CHIUSA SUI 6 CASI DEL CICLO 03 | cycle-03-oculistica-rerun.md + cycle-03-final-closure.md | Chiusura composta. |
| Allergologia e Immunologia clinica | Ciclo 03: 6 casi | CHIUSA SUI 6 CASI DEL CICLO 03 | cycle-03-allergologia-rerun.md + cycle-03-final-closure.md | Chiusura composta. |

## Cicli

| Ciclo | Perimetro | Stato | Fonte |
|---|---|---|---|
| Routing anti-overfitting | 19 casi finali | SUPERATO: 17 PASS ROUTING + 2 BYPASS DOCUMENTATI | anamnesis-routing-final-regression-audit.md |
| P0 | 9 casi | SUPERATO: 9 PASS ROUTING | anamnesis-routing-p0-fix.md + anamnesis-routing-final-regression-audit.md |
| P1 | 12 casi | SUPERATO: 12 PASS ROUTING | anamnesis-routing-p1-fix.md + anamnesis-routing-final-regression-audit.md |
| Validatore | 12 fixture tecniche | SUPERATO: 12/12 fixture; non sono casi clinici | anamnesis-routing-validator-fix.md |
| P2 | 10 casi | SUPERATO: 8 PASS ROUTING + 2 BYPASS DOCUMENTATI | anamnesis-routing-p2-fix.md + anamnesis-routing-final-regression-audit.md |
| Audit routing finale | 19 casi | SUPERATO | anamnesis-routing-final-regression-audit.md |
| Ciclo 01 | 18 casi: Endocrinologia, Ginecologia, ORL | SUPERATO E CHIUSO SUL PIANO CLINICO-FUNZIONALE | chiusura composta; decisione CTO SerpApi applicata |
| Ciclo 02 | 18 casi: Gastroenterologia, Neurologia, Pneumologia | SUPERATO E CHIUSO | cycle-02-fix-rerun.md + cycle-02-technical-closure.md |
| Ciclo 03 | 18 casi: Pediatria, Oculistica, Allergologia | SUPERATO E CHIUSO | cycle-03-final-closure.md e rerun di branca |

## Casi sensibili e raw

Il Case Registry contiene un solo esito autorevole e un solo raw di riferimento per ciascuno dei 162 case ID. Il Raw Registry conserva tutti i 236 raw senza cancellazioni. I raw con ricerca specialisti storica sono riutilizzabili solo per la porzione clinico-funzionale.

## Prossima attivita

Attendere autorizzazione CTO prima di costruire la suite consolidata. Non avviare Ciclo 04 e non integrare verso main.
