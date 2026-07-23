# Cycle 01 - Endocrinologia

Data: 2026-07-13  
Ambiente: staging locale, Chromium desktop, Gemini reale, nessun mock/intercettazione

## Gate

**NON SUPERATO**: 6/6 eseguiti e Playwright PASS, ma 2 FAIL clinico-funzionali. Esito: 2 PASS, 2 WARNING, 2 FAIL.

| Caso | Categoria di rischio | Esito | Branca | Specialista/sotto-specialità | Urgenza | Negazioni rispettate | Diagnosi | Prescrizioni | Motivazioni fedeli | Domande fuori ramo | Problema residuo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ENDO_01_URGENTE_DIABETE_SCOMPENSO | urgente/red flag | FAIL CLINICO-FUNZIONALE | Medicina Interna/urgenza | Internista; Endocrinologia secondo livello | alta/urgente | SÌ | NO | NO | SÌ | SÌ | Domande urinarie generiche; non esplorano coscienza, respirazione, vomito, idratazione o glicemia. Rischio di ritardo anamnestico. |
| ENDO_02_TIROIDE_PROGRAMMATA | ordinario | PASS CLINICO-FUNZIONALE | Endocrinologia | Endocrinologo | prioritaria/programmatabile | SÌ | NO | NO | SÌ | NO | Nessuno |
| ENDO_03_NODOULO_TIROIDEO | ordinario | WARNING | Endocrinologia | Endocrinologo, area tiroide | prioritaria | SÌ | NO | NO | SÌ | NO critiche | Domande endocrine generiche; mancano referto, dimensioni, crescita, voce, deglutizione e familiarità. |
| ENDO_04_BORDERLINE_CICLO_IRREGOLARE | borderline | PASS CLINICO-FUNZIONALE | Medicina Generale con percorso endocrino-ginecologico | MMG, Endocrinologia/Ginecologia secondo contesto | non urgente | SÌ | NO | NO | SÌ | NO | Nessuno |
| ENDO_05_NEGATIVO_FAME_POST_ALLENAMENTO | negativo | FAIL CLINICO-FUNZIONALE | Medicina Generale | MMG | non urgente | SÌ | NO | NO | SÌ | SÌ | Domande su febbre, linfonodi ed ecchimosi, non su allenamento, alimentazione e recupero. |
| ENDO_06_FOLLOWUP_DIABETE | negazioni/fattori rischio | WARNING | Endocrinologia | Endocrinologo/Diabetologia | non urgente | SÌ | NO | NO | SÌ | NO critiche | Output corretto, ma domande su sintomi metabolici e valori generici anziché ultimo controllo, prescrittore e referti. |

## Root cause

- Assenza di un ramo urgente diabetologico/metabolico nel secondo blocco.
- Template endocrino troppo generico per nodulo tiroideo e follow-up.
- Fallback ematologico improprio nei sintomi post-allenamento.

## Adjudication e raccomandazione

Richiedono decisione CTO i due WARNING. I due FAIL sono prodotto reale: priorità P0 per `ENDO_01`, P1 per `ENDO_05`. Non è stato applicato alcun fix.

Rerun minimo proposto, non eseguito: `ENDO_01`, `ENDO_03`, `ENDO_05`, `ENDO_06` dopo eventuale correzione.
