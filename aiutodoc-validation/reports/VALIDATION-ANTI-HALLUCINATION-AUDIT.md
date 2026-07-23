# AiutoDoc - Validation Anti-Hallucination Audit

Generated: 2026-07-16T23:17:01.419Z

| Affermazione | Fonte primaria | Fonte secondaria | Verificata | Limitazione |
|---|---|---|---|---|
| Report correnti: 99 | Inventario reports/ dopo creazione dei due audit | validation-master-manifest.json | SI | 97 prima dei due output nuovi. |
| Raw: 236 | Inventario artifacts/raw-output | VALIDATION-RAW-REGISTRY.md | SI | Nessun file spostato o cancellato. |
| Case ID: 162 | Raggruppamento campo id/caseId dei raw | VALIDATION-CASE-REGISTRY.md | SI | Un reference raw per ID. |
| Branche chiuse nel registro: 14 | Report finali e componenti dei programmi | VALIDATION-FINAL-STATUS.md | SI | Chiuse solo sui casi dei programmi indicati. |
| Ciclo 01 chiuso clinico-funzionalmente | Report Ciclo 01 + decisione CTO del task | VALIDATION-CONSISTENCY-AUDIT.md | SI | SerpApi resta evento storico fuori gate. |
| Ciclo 02 chiuso | cycle-02-fix-rerun.md | cycle-02-technical-closure.md | SI | Chiusura composta. |
| Ciclo 03 chiuso | cycle-03-final-closure.md | rerun Pediatria/Oculistica/Allergologia | SI | Chiusura composta. |
| Routing finale: 19 casi | anamnesis-routing-final-regression-audit.md | raw REGRESSION_* | SI | 17 PASS ROUTING e 2 bypass. |
| Pediatria 6/6 | cycle-03-pediatria-rerun.md + pediatria-final-closure.md | cycle-03-final-closure.md | SI | Composizione 5 + PED_02. |
| Oculistica chiusa sui 6 casi | cycle-03-oculistica-rerun.md | cycle-03-final-closure.md | SI | Non validazione universale. |
| Allergologia chiusa sui 6 casi | cycle-03-allergologia-rerun.md | cycle-03-final-closure.md | SI | Non validazione universale. |
| Bypass documentati: 10 | Report specifici con etichetta bypass | raw con assenza domande/Gemini e urgenza | SI | Non include semplici messaggi urgenti ordinari. |
| Casi non adjudicati: 7 | Assenza di chiusura finale dedicata | Case Registry | SI | Non presentati come validati. |
| Raw di riferimento con ricerca storica: 74 | Scansione output raw | Raw Registry | SI | Ricerca esclusa dal gate. |
| JSON con BOM: 10 | Scansione byte iniziale artefatti JSON | Consistency Audit | SI | Validi dopo rimozione BOM in lettura. |
| Due riferimenti raw Cardiologia mancanti | batch-01-cardiologia.md | inventario raw-output | SI | File non inventati. |
| 14/14 file di prodotto protetti invariati | Hash SHA-256 acquisiti prima della rettifica | Hash SHA-256 finali | SI | Le modifiche prodotto gia presenti nel working tree precedono questo task. |
