# Cycle 01 - Ginecologia rerun

## Esito

3 PASS, 1 FAIL, 1 NON VALUTABILE. Gate **NON SUPERATO**.

| Caso | Prima | Dopo | Playwright | Evidenza |
| --- | --- | --- | --- | --- |
| GINE_01_URGENTE_DOLORE_SANGUINAMENTO_GRAVIDANZA | FAIL | PASS | PASS | Ramo ostetrico urgente, domande minime e accesso PS/Ostetricia appropriati. |
| GINE_02_CICLO_ABBONDANTE | FAIL | FAIL | PASS | Domande corrette; ramo principale ancora Medicina Generale e formulazione “possibile anemia/carenza marziale”. |
| GINE_03_DOLORE_PELVICO_CRONICO | WARNING | PASS | PASS | Coperti ciclo, rapporti, intestino/urine, intensita, peggioramento e accertamenti. |
| GINE_05_NEGATIVO_RITARDO_CICLO | FAIL | NON VALUTABILE | TIMEOUT | Nuovo ramo pertinente verificato; output reale non acquisito. |
| GINE_06_MENOPAUSA_SANGUINAMENTO | FAIL | PASS | PASS | Ramo ginecologico prioritario con quantita, durata, recidiva, farmaci, controlli e stabilita. |

Il PASS rappresentativo `GINE_04_BORDERLINE_BRUCIORE_URINARIO` resta PASS, con ramo Urologia non urgente e negazioni rispettate.
