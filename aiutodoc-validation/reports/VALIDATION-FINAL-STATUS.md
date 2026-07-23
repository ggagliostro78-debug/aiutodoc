# AiutoDoc - Validation Final Status

Generated: 2026-07-16T23:17:01.419Z  
Branch: `aiutodoc-clinical-validation`  
Commit: `f5b58abffa615ab04ec0a6acf83392e08e7fc52b`

## Stato cicli

- Routing finale: **SUPERATO SUI 19 CASI DELL'AUDIT** (17 PASS ROUTING, 2 BYPASS URGENZA DOCUMENTATI).
- Ciclo 01: **SUPERATO E CHIUSO SUL PIANO CLINICO-FUNZIONALE**. La vecchia riserva SerpApi e storica e fuori gate per decisione CTO.
- Ciclo 02: **SUPERATO E CHIUSO SUI 18 CASI DEL PROGRAMMA**.
- Ciclo 03: **SUPERATO E CHIUSO SUI 18 CASI DEL PROGRAMMA**.
- Ciclo 04: **NON AVVIATO**.

## Branche

| Branca | Programma | Stato finale circoscritto | Fonte | Nota |
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

## Copertura non equivalente a validazione generale

Le chiusure riguardano esclusivamente i casi dei programmi indicati. Infettivologia, Medicina generale/interna, Medicina d'urgenza, Odontoiatria/Maxillo-facciale, Reumatologia, Ematologia, Oncologia, Neuropsichiatria infantile e altre aree non hanno un batch dedicato conclusivo. I casi ANEMIA_01, ANEMIA_02, CELIACHIA_02, COVID_01, COVID_02 e INFLUENZA_02 non sono dichiarati validati.
