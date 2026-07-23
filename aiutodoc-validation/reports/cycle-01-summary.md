# Cycle 01 - Summary

## Esito complessivo

**CICLO NON SUPERATO**. Tutte le branche sono state completate, ma ciascuna presenta almeno un FAIL.

| Branca | Casi | PASS | WARNING | FAIL | BYPASS | Non valutabili | Gate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Endocrinologia | 6 | 2 | 2 | 2 | 0 | 0 | NON SUPERATO |
| Ginecologia | 6 | 1 | 1 | 4 | 0 | 0 | NON SUPERATO |
| Otorinolaringoiatria | 6 | 2 | 2 | 2 | 0 | 0 | NON SUPERATO |
| **Totale** | **18** | **5** | **5** | **8** | **0** | **0** | **NON SUPERATO** |

## Metriche comuni

- Playwright: 18/18 PASS.
- Gemini: 18 risposte HTTP 200; nessun blocco infrastrutturale.
- Diagnosi/sospetti rilevati dal validatore: 0.
- Prescrizioni/dosaggi rilevati: 0.
- Negazioni ignorate: 0.
- Motivazioni non fedeli: 0.
- FAIL TECNICO VALIDATORE: 0.

## Root cause aggregate

1. **Fallback generici fuori contesto:** template ematologico per gravidanza/sanguinamento/post-allenamento; template urinario per casi ginecologici; template ORL generale per epistassi.
2. **Intento non riconosciuto:** follow-up diabete e russamento con pause respiratorie.
3. **Copertura distrettuale incompleta:** nodulo tiroideo, otalgia e vertigini posizionali.
4. **Red flag urgente con domande inadeguate:** diabete con sonnolenza e gravidanza con dolore+sangue+capogiri ricevono output urgente corretto ma secondo blocco non mirato.
5. **Limite del validatore:** clausole condizionali nel testo finale possono apparire come escalation; adjudication manuale ha corretto sei classificazioni con motivazione documentata, senza cambiare criteri o codice.

## Casi da adjudication CTO

- ENDO_03_NODOULO_TIROIDEO
- ENDO_06_FOLLOWUP_DIABETE
- GINE_03_DOLORE_PELVICO_CRONICO
- ORL_02_OTITE_PROGRAMMATA
- ORL_04_BORDERLINE_VERTIGINI

## Raccomandazione CTO

Non procedere al ciclo successivo prima di una decisione sui WARNING e di un piano mirato per gli 8 FAIL. Priorità proposta:

- P0: `ENDO_01`, `GINE_01` per qualità del routing anamnestico in quadri urgenti.
- P1: `GINE_02`, `GINE_05`, `GINE_06`, `ORL_03`, `ORL_06`.
- P2: `ENDO_05` e i cinque WARNING, secondo adjudication.

Serve un fix: **SÌ**, ma non è stato applicato in questo audit.

Rerun minimo proposto, non eseguito: i soli 13 casi non PASS (8 FAIL + 5 WARNING), mantenendo come regressione un PASS rappresentativo per branca.
