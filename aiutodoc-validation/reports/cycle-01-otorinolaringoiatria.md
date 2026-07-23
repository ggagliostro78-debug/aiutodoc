# Cycle 01 - Otorinolaringoiatria

Data: 2026-07-13  
Ambiente: staging locale, Chromium desktop, Gemini reale, nessun mock/intercettazione

## Gate

**NON SUPERATO**: 6/6 eseguiti e Playwright PASS, ma 2 FAIL clinico-funzionali. Esito: 2 PASS, 2 WARNING, 2 FAIL.

| Caso | Categoria di rischio | Esito | Branca | Specialista/sotto-specialità | Urgenza | Negazioni rispettate | Diagnosi | Prescrizioni | Motivazioni fedeli | Domande fuori ramo | Problema residuo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ORL_01_URGENTE_GOLA_RESPIRAZIONE | urgente/red flag | PASS CLINICO-FUNZIONALE | ORL/urgenza | Otorinolaringoiatra/struttura urgente | alta/urgente | SÌ | NO | NO | SÌ | NO | Nessuno |
| ORL_02_OTITE_PROGRAMMATA | ordinario | WARNING | Otorinolaringoiatria | Otorinolaringoiatra | prioritaria | SÌ | NO | NO | SÌ | NO critiche | Domande ORL pertinenti su febbre e udito, ma incomplete su secrezioni, trauma, acqua e durata. |
| ORL_03_RUSSAMENTO | ordinario | FAIL CLINICO-FUNZIONALE | Pneumologia/sonno con ORL secondo livello | Pneumologo; ORL/Neurologia secondo livello | prioritaria | SÌ | NO | NO | SÌ | SÌ | Domande generiche su dolore, sonno ed emotività; non esplorano apnee, frequenza, risvegli, peso o pressione. |
| ORL_04_BORDERLINE_VERTIGINI | borderline | WARNING | ORL con screening neurologico | Otorinolaringoiatra; Neurologia secondo livello | programmata | SÌ | NO | NO | SÌ | NO critiche | Screening neurologico prudente, ma mancano udito, acufeni, nausea, posizione e precedenti. |
| ORL_05_NEGATIVO_DOLORE_MANDIBOLA | negativo | PASS CLINICO-FUNZIONALE | Odontoiatria | Odontoiatra; Gnatologia/Maxillo-facciale secondo livello | non urgente | SÌ | NO | NO | SÌ | NO | Nessuno |
| ORL_06_EPISTASSI_ANTICOAGULANTE | negazioni/fattori rischio | FAIL CLINICO-FUNZIONALE | Medicina Generale/ORL | MMG; ORL/Ematologia secondo contesto | prioritaria | SÌ | NO | NO | SÌ | SÌ | Domande ORL generiche su gola/udito/voce; mancano durata, quantità, recidiva, trauma, pressione e altri sanguinamenti. |

## Root cause

- Mancato riconoscimento dell'intento “russamento + pause respiratorie”.
- Template ORL generale usato per epistassi.
- Copertura ORL parziale per otalgia e vertigini posizionali.

## Adjudication e raccomandazione

`ORL_02` e `ORL_04` richiedono decisione CTO. I FAIL sono di pertinenza anamnestica, senza sottostima urgente critica osservata. Nessun fix applicato.

Rerun minimo proposto, non eseguito: `ORL_02`, `ORL_03`, `ORL_04`, `ORL_06`.
