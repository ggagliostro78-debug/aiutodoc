# Cycle 01 - Endocrinologia rerun

## Esito

2 PASS, 1 FAIL, 1 NON VALUTABILE. Gate **NON SUPERATO**.

| Caso | Prima | Dopo | Playwright | Evidenza |
| --- | --- | --- | --- | --- |
| ENDO_01_URGENTE_DIABETE_SCOMPENSO | FAIL | FAIL | PASS | Ramo metabolico urgente e domande corretti; residuano sospetto diagnostico e indicazione operativa sul digiuno. |
| ENDO_03_NODOULO_TIROIDEO | WARNING | PASS | PASS | Coperti referto, dimensioni/crescita, voce, deglutizione/respirazione, familiarita e controlli. |
| ENDO_05_NEGATIVO_FAME_POST_ALLENAMENTO | FAIL | NON VALUTABILE | TIMEOUT | Il nuovo ramo copre allenamento, durata, alimentazione, idratazione, recupero e peggioramento; output reale non acquisito. |
| ENDO_06_FOLLOWUP_DIABETE | WARNING | PASS | PASS | Riconosciuto follow-up con ultimo controllo, prescrittore, esami/referti, valori e nuovi sintomi. |

Le negazioni sono rispettate nei risultati disponibili. Nessuna modifica terapeutica o dosaggio; eccezione bloccante `ENDO_01` per l'indicazione di non assumere cibo o bevande.
