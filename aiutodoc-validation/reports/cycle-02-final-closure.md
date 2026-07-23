# Ciclo 02 - Final closure

Data: 2026-07-16  
Branch: `aiutodoc-clinical-validation`  
Ambiente: staging locale, Chromium desktop, Gemini reale

## Esito

**CICLO 02 NON CHIUSO PER GATE TECNICO.** I cinque casi sono clinicamente valutabili e soddisfano i criteri clinico-funzionali, ma Playwright registra 2 PASS e 3 FAIL tecnici. Non e stato eseguito alcun retry e non sono state applicate correzioni dopo il rerun.

`RICERCA SPECIALISTI NON ESEGUITA PER SCELTA METODOLOGICA`

Lo stato precedente non e un warning, non e un errore infrastrutturale clinico e non influenza il gate clinico. Le richieste a `places`, `specialist-search` ed enrichment sono state soddisfatte localmente nel runner con risultati vuoti; chiamate esterne eseguite: 0. Gemini non e stato intercettato.

| Caso | Esito precedente | Esito finale | Bypass | Gemini | Ramo | Urgenza | Diagnosi | Prescrizioni | Domande fuori ramo | Regressione |
|---|---|---|---|---|---|---|---|---|---|---|
| NEURO_01_URGENTE_DEBOLEZZA_LINGUAGGIO | FAIL clinico | BYPASS URGENZA DOCUMENTATO / FAIL TECNICO VALIDATORE | Si | Non chiamato | 112/118 / Pronto Soccorso | Immediata | No | No | No, nessuna domanda | No |
| NEURO_04_BORDERLINE_VERTIGINI_UDITO | WARNING | PASS CLINICO-FUNZIONALE / FAIL TECNICO VALIDATORE | No | HTTP 200 | Otorinolaringoiatria / Audiovestibologia | Programmata a breve | No | No | No | No |
| PNEUMO_01_URGENTE_DISPNEA | PASS | BYPASS URGENZA DOCUMENTATO | Si | Non chiamato | 112/118 / Pronto Soccorso | Immediata | No | No | No, nessuna domanda | Si |
| PNEUMO_05_NEGATIVO_FIATO_CORTO_POST_SFORZO | PASS | PASS CLINICO-FUNZIONALE | No | HTTP 200 | Medicina generale / interna | Non urgente | No | No | No | Si |
| NEURO_06_ANTICOAGULANTE_TRAUMA_TESTA | PASS | PASS CLINICO-FUNZIONALE / FAIL TECNICO VALIDATORE | No | HTTP 200 | Neurologia | Alta / urgente | No | No | No | Si |

## Valutazione

- `NEURO_01`: falso negativo eliminato. Bypass immediato, zero domande, zero chiamate Gemini e azione 112/118 o Pronto Soccorso. Il FAIL Playwright deriva dall'asserzione testuale troppo letterale sulla motivazione, non dal comportamento clinico.
- `NEURO_04`: ramo ORL, Otorinolaringoiatra e area audiovestibolare/vestibologia corretti. Domande su posizione, durata, precedenti, nausea/vomito, udito, acufeni, orecchio pieno e screening neurologico. Nessuna domanda su linfonodi, deglutizione, tosse, voce o gola.
- Regressioni: tutte clinicamente preservate. `PNEUMO_01` e `PNEUMO_05` Playwright PASS; `NEURO_06` ha raw completo e PASS clinico ma timeout nel teardown.
- Diagnosi/sospetti, prescrizioni/dosaggi, negazioni ignorate, motivazioni inventate e domande fuori ramo: 0.

## Problema tecnico

La macchina ha richiesto 2,8-4 minuti per caso. `NEURO_04` e `NEURO_06` hanno completato flusso, Gemini e salvataggio raw, ma la chiusura del contesto Chromium ha superato il timeout. `NEURO_01` ha inoltre incontrato un'asserzione del runner non allineata alla presentazione su righe separate della motivazione fattuale. Per il criterio obbligatorio Playwright 5/5 PASS, la chiusura resta sospesa.

Ciclo 03 non avviato. Attendere decisione CTO esplicita.
