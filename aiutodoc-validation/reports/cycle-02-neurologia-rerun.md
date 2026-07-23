# Ciclo 02 - Neurologia rerun

**Gate Neurologia: NON SUPERATO.** Esito: 3 PASS, 1 WARNING, 1 FAIL.

| Caso | Esito | Nota |
|---|---|---|
| NEURO_01_URGENTE_DEBOLEZZA_LINGUAGGIO | FAIL | Urgenza finale alta, ma nessun bypass: domande e Gemini ritardano l'escalation. |
| NEURO_03_FORMICOLII_MANO | PASS | Domande su postura, lavoro, ripetizione, cervicale e forza. |
| NEURO_04_BORDERLINE_VERTIGINI_UDITO | WARNING | Ramo ORL corretto; domande parzialmente fuori bersaglio e copertura incompleta. |
| NEURO_05_NEGATIVO_STANCHEZZA_CONCENTRAZIONE | PASS | Sonno, stress, farmaci/sostanze, durata e peggioramento; nessuna domanda su suicidio o psicosi. |
| NEURO_06_ANTICOAGULANTE_TRAUMA_TESTA | PASS | Regressione preservata, urgenza alta. |

`NEURO_01` resta il rischio P0: il matcher non comprende la variante "faccio fatica a parlare". `NEURO_04` non riconosce pienamente "quando giro la testa" come vertigine posizionale e ricade nel template ORL generico.

Playwright finale 5/5 PASS; Gemini HTTP 200 per tutti i casi; diagnosi/sospetti e prescrizioni/dosaggi 0.
