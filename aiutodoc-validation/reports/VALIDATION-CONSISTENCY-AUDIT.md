# AiutoDoc - Validation Consistency Audit

Generated: 2026-07-16T23:17:01.419Z

## Decisione CTO applicata

La vecchia riserva SerpApi del Ciclo 01 e assorbita dalla metodologia successiva, che esclude la ricerca specialisti dal gate clinico-funzionale. Endocrinologia, Ginecologia/Ostetricia e Otorinolaringoiatria sono chiuse sui casi del Ciclo 01. L'evento 502 resta evidenza storica e non e un warning finale.

| ID | Stato | Incongruenza | Soluzione documentale |
|---|---|---|---|
| INC-01 | DOCUMENTATA | Branch map storica non riflette le chiusure successive. | Master Index prevale; branch map resta storica. |
| INC-02 | DOCUMENTATA | Roadmap propone batch poi eseguiti. | Roadmap non usata come stato corrente. |
| INC-03 | RISOLTA DA DECISIONE CTO | Il Ciclo 01 conservava una riserva SerpApi sotto la metodologia originaria. | La ricerca specialisti e esclusa dal gate clinico-funzionale; Ciclo 01 chiuso, evento 502 conservato come storia. |
| INC-04 | RISOLTA PER PREVALENZA | Una chiusura intermedia del Ciclo 02 riportava residui. | cycle-02-technical-closure.md chiude i tre residui. |
| INC-05 | RISOLTA PER PREVALENZA | Report intermedi del Ciclo 03 riportavano PED_02 aperto. | cycle-03-pediatria-final-closure.md e cycle-03-final-closure.md prevalgono. |
| INC-06 | DOCUMENTATA | Denominatori 5 e 6 appartengono a programmi distinti. | Ogni stato riporta esplicitamente batch/ciclo e numero casi. |
| INC-07 | LIMITAZIONE STORICA | batch-01-cardiologia.md cita due raw non presenti col nome indicato. | Non inventare file; usare i riferimenti esistenti e mantenere la mancanza documentata. |
| INC-08 | DOCUMENTATA | gpt-test-handoff.md contiene un percorso Playwright ambiguo. | Il manifest fornisce percorsi esatti. |
| INC-09 | RISOLTA NEL REGISTRO | Raw multipli per case ID. | Un solo referenceRaw; tutti gli altri restano classificati. |
| INC-10 | LIMITAZIONE NON BLOCCANTE | 10 JSON storici contengono BOM UTF-8. | BOM gestito solo in lettura; originali invariati. |
| INC-11 | LIMITAZIONE NON BLOCCANTE | 74 raw di riferimento includono ricerca specialisti storica. | Riutilizzo limitato alla porzione clinico-funzionale; ricerca fuori gate. |
| INC-12 | RISOLTA | Il consolidamento precedente confondeva testo urgente, PASS tecnico e BYPASS. | BYPASS assegnato solo con report esplicito e prova di percorso; esito clinico, path type e tecnica sono separati. |
