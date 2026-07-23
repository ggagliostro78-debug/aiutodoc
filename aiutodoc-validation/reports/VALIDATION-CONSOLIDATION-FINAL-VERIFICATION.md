# AiutoDoc - Validation Consolidation Final Verification

Generated: 2026-07-16T23:17:01.419Z

## 1. File corretti

Master Index, Final Status, Report Map, Case Registry, Raw Registry, Consistency Audit, Continuity Handoff e manifest. Creati Anti-Hallucination Audit e questo report.

## 2. Problemi trovati

Il consolidamento precedente deduceva bypass da testo urgente, selezionava raw per completezza tecnica senza separare adjudication clinica e trattava componenti di chiusure composte come fonti autonome.

## 3. Problemi risolti

Esito clinico, tipo percorso, esito tecnico, livello evidenza e limitazioni sono ora separati. SerpApi e formalmente fuori gate.

## 4. Casi riclassificati

162 record riesaminati nel nuovo schema; 43 etichette bypass automatiche rimosse. Bypass finali documentati: 10.

## 5. Report riclassificati

54 report preesistenti hanno cambiato categoria; le fonti parziali necessarie sono marcate `COMPONENTE DELLA CHIUSURA FINALE`.

## 6. Raw riclassificati

167/236 raw hanno una categoria diversa dal consolidamento precedente. Nessun raw e stato spostato, cancellato o modificato.

## 7. Casi non adjudicati

- `ANEMIA_01`
- `ANEMIA_02`
- `CELIACHIA_02`
- `COVID_01`
- `COVID_02`
- `INFLUENZA_02`
- `ROUTING_01_CARDIO_ATIPICO_MANDIBOLA`

## 8. Decisione SerpApi

La riserva del Ciclo 01 e assorbita dalla metodologia successiva. Ciclo 01 chiuso sul piano clinico-funzionale; i 502 restano storia, non warning finale.

## 9. Conteggi finali

- Report: 99 dopo i due nuovi audit.
- Raw: 236.
- Case ID: 162.
- Reference raw unici: 162.
- Casi adjudicati: 155.
- Casi non adjudicati: 7.

## 10. Controlli automatici

- PASS: 99 report, 236 raw e 162 case ID.
- PASS: case ID e reference raw unici; tutti i percorsi esistono.
- PASS: JSON leggibili; 10 artefatti storici richiedono rimozione BOM in lettura.
- PASS: nessun bypass con path type ordinario.
- PASS: nessun percorso ordinario con Gemini non dimostrato e senza limitazione.
- PASS: nessun `RAW FINALE VERIFICATO` senza Playwright PASS nel raw.
- PASS: nessun caso non adjudicato presentato come chiusura di una branca.
- PASS: nessuna fonte `SUPERSEDED` usata da sola come fonte autorevole.
- PASS: link relativi dei documenti consolidati.
- PASS: scan anti-segreti sui registri e manifest.
- PASS: 14/14 hash dei file di prodotto protetti invariati.
- PASS: branch `aiutodoc-clinical-validation` e commit `f5b58abffa615ab04ec0a6acf83392e08e7fc52b` invariati; `main` resta `f776bae225406bd05df9bbb95828ebefe0e16e81`.
- NOTA: `git diff --check` segnala due spazi finali preesistenti in `clinical-functional-report.md`, non introdotti da questa rettifica.

## 11. Campione manuale

| Strato | Casi | Esito confronto |
|---|---|---|
| BYPASS | P2_NEG_01_FECI_SCURE_SENZA_FERRO; REGRESSION_POS_05_FECI_SCURE; GASTRO_01_URGENTE_DOLORE_ADDOME_INSTABILITA; PED_01_URGENTE_DIFFICOLTA_RESPIRATORIA; OCUL_01_URGENTE_PERDITA_VISIVA_IMPROVVISA | Report esplicito, zero domande/Gemini e messaggio urgente verificati. |
| ORDINARIO | GINE_02_CICLO_ABBONDANTE; CARDIO_01_DOLOR_TORACICO_SFORZO_LIEVE; NEURO_06_ANTICOAGULANTE_TRAUMA_TESTA; ORTO_03_TRAUMA_GINOCCHIO_SOSPETTA_LESIONE_LEGAMENTOSA; GINE_06_MENOPAUSA_SANGUINAMENTO | Domande e Gemini HTTP 200; non sono bypass. |
| ROUTING-ONLY | P0_POS_01_LOMBALGIA; P1_POS_01_GRAVIDANZA_NAUSEA; P2_POS_01_FECI_SCURE_FERRO; REGRESSION_NEG_01_VERTIGINI_NON_URGENTI; ROUTING_02_NEURO_VERTIGINI_DIPLOPIA | Esito ricavato dalle tabelle finali di routing. |
| RETRY | ENDO_05_NEGATIVO_FAME_POST_ALLENAMENTO; GINE_05_NEGATIVO_RITARDO_CICLO; NEURO_04_BORDERLINE_VERTIGINI_UDITO; PED_02_FEBBRE_BAMBINO_PROGRAMMATA; PSY_05_DISTURBO_ALIMENTARE_POSSIBILE | Tentativi precedenti conservati; riferimento selezionato dalla chiusura successiva. |
| OBBLIGATORI | GINE_02_CICLO_ABBONDANTE; GINE_03_DOLORE_PELVICO_CRONICO; ORL_02_OTITE_PROGRAMMATA; ORL_04_BORDERLINE_VERTIGINI; ORL_05_NEGATIVO_DOLORE_MANDIBOLA; CARDIO_01_DOLOR_TORACICO_SFORZO_LIEVE; NEURO_06_ANTICOAGULANTE_TRAUMA_TESTA; ORTO_03_TRAUMA_GINOCCHIO_SOSPETTA_LESIONE_LEGAMENTOSA; ORTO_05_TRAUMA_CAVIGLIA_FRATTURA_SOSPETTA_URGENTE; GINE_06_MENOPAUSA_SANGUINAMENTO | Tutti confrontati con report e raw; nessuno classificato bypass. |
| NON ADJUDICATI | ANEMIA_01; ANEMIA_02; CELIACHIA_02; COVID_01; COVID_02; INFLUENZA_02; ROUTING_01_CARDIO_ATIPICO_MANDIBOLA | Nessuna chiusura finale sufficiente sullo stesso case ID. |

## 12. Limiti residui

- 74 raw di riferimento includono ricerca specialisti storica e sono limitati alla porzione clinico-funzionale.
- 10 JSON storici richiedono rimozione BOM in lettura.
- Alcuni percorsi locali urgenti non sono chiamati bypass dai report e restano `NON DETERMINATO` come tipo percorso.
- Due riferimenti raw Cardiologia storici non esistono col nome citato.

## 13. Stato finale

**CONSOLIDAMENTO VERIFICATO - LIMITAZIONI DOCUMENTATE**
