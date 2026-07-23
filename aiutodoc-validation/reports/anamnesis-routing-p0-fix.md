# Anamnesis Routing P0 Fix

Data: 2026-07-12
Branch: `aiutodoc-clinical-validation`
Ambiente: staging locale `http://127.0.0.1:4273`
Browser: `chromium-desktop`
Mock: no
Intercettazione `/api/gemini`: no
Produzione: non testata
Batch 09 / altri batch medici: non avviati

## Sintesi

Applicati esclusivamente i tre fix P0 autorizzati:

1. riconoscimento di lombalgia/schiena con red flag neurologiche o sfinteriche, dopo normalizzazione e rimozione delle negazioni;
2. gestione negation-aware delle feci scure, esclusione del bypass quando il colore è riferito al ferro e motivazioni urgenti generate soltanto da segnali positivi;
3. routing cardio-atipico per esordio recente + mandibola + nausea + diabete + ipertensione + mancata relazione con la masticazione, con guardia composita per il caso odontoiatrico locale.

Esito finale: **9/9 PASS ROUTING**, **0 falsi negativi critici**, **0 falsi positivi critici**, **0 diagnosi/sospetti**, **0 prescrizioni/dosaggi**, **0 errori infrastrutturali**.

## Risultati

| Caso | Prima | Dopo | Override | Negazioni rispettate | Motivazioni fedeli all'input | Domande fuori ramo | Diagnosi | Prescrizioni | Esito |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P0_POS_01_LOMBALGIA | Domande neurologiche generiche; urgenza sottostimata | Domande specifiche su sella/genitali, sensibilità, urine/feci, forza, cammino e accesso urgente | Neuro-rachide urgente | SÌ | N/A, nessun bypass | NO | NO | NO | PASS ROUTING |
| P0_POS_02_FECI_SCURE_URGENTE | Lista statica con pallore, stanchezza e fibrillazione non dichiarati | Bypass con sole feci scure, debolezza, capogiri e anticoagulante | Bypass urgente | SÌ | SÌ | NO | NO | NO | PASS ROUTING |
| P0_POS_03_CARDIO_ATIPICO | Domande odontoiatriche | Domande su persistenza, peggioramento, sintomi associati, sforzo, fattori cardiovascolari e valutazione urgente | Cardio-atipico/urgenza | SÌ | N/A, nessun bypass | NO | NO | NO | PASS ROUTING |
| P0_NEG_01_LOMBALGIA_MECCANICA | Controllo negativo | Ramo muscolo-scheletrico con verifica prudente delle red flag | Nessun override urgente | SÌ | N/A | NO | NO | NO | PASS ROUTING |
| P0_NEG_02_FECI_SCURE_FERRO | Rischio di matching su keyword negate | Nessun bypass; ramo gastro, nessun profilo anticoagulante inventato | Nessun bypass | SÌ | SÌ, nessuna motivazione mostrata | NO | NO | NO | PASS ROUTING |
| P0_NEG_03_MANDIBOLA_ODONTOIATRICA | Cluster cutaneo generico | Ramo odontoiatrico per dente + masticazione + gengiva gonfia | Guardia odontoiatrica locale | SÌ | N/A | NO | NO | NO | PASS ROUTING |
| P0_BOUND_01_FECI_SCURE_ISOLATE | Motivazioni statiche non fedeli | Bypass prudente motivato esclusivamente da feci scure/molto scure riferite | Bypass urgente prudenziale | SÌ | SÌ | NO | NO | NO | PASS ROUTING |
| P0_BOUND_02_MANDIBOLA_NAUSEA_SENZA_FATTORI | Rischio di over-triggering cardio | Nessun ramo cardio urgente; valorizzata la mandibola senza inventare fattori | Nessun override cardio | SÌ | N/A | NO | NO | NO | PASS ROUTING |
| P0_BOUND_03_SCHIENA_DIFFICOLTA_URINARE | Variante lessicale non garantita | Domande specifiche su urine/feci, sensibilità, forza, cammino e urgenza | Neuro-rachide urgente | SÌ | N/A | NO | NO | NO | PASS ROUTING |

## Fedeltà motivazioni feci scure

### P0_POS_02_FECI_SCURE_URGENTE

| Motivazione mostrata | Presente positivamente nell'input | Negata nell'input | Ammessa |
| --- | --- | --- | --- |
| feci nere o molto scure | SÌ | NO | SÌ |
| debolezza riferita | SÌ | NO | SÌ |
| capogiri riferiti | SÌ | NO | SÌ |
| terapia anticoagulante riferita | SÌ | NO | SÌ |

Non sono comparsi pallore, stanchezza o fibrillazione atriale.

### P0_NEG_02_FECI_SCURE_FERRO

Nessun bypass e nessuna motivazione urgente mostrata. Debolezza, capogiri e terapia anticoagulante negate non sono state trasformate in segnali positivi.

### P0_BOUND_01_FECI_SCURE_ISOLATE

| Motivazione mostrata | Presente positivamente nell'input | Negata nell'input | Ammessa |
| --- | --- | --- | --- |
| Feci scure o molto scure riferite | SÌ | NO | SÌ |

Non sono comparsi debolezza, capogiri, anticoagulante, fibrillazione atriale, pallore o stanchezza.

## Root cause e correzioni

- **Lombalgia:** il matching richiedeva formulazioni lombari e urinarie troppo specifiche. Il fix normalizza accenti/apostrofi e richiede una sede lombare/schiena insieme ad almeno una red flag sensitiva, sfinterica o di debolezza. Le frasi negate vengono escluse prima del matching.
- **Feci scure:** `_isMelenaAnticoagulantEmergencyText()` esaminava il testo completo, incluse negazioni, e `_buildLocalEmergencyStructuredData()` restituiva una lista statica. Il fix usa solo testo positivo e compone dinamicamente le motivazioni. L'associazione temporale positiva con ferro/bismuto evita il bypass basato sul solo colore.
- **Cardio-atipico:** il cluster precedente richiedeva anche peso epigastrico, dispnea da sforzo e antiacido inefficace. Il fix aggiunge un secondo cluster composito ad alta specificità e normalizza l'apostrofo di `mezz'ora`. Una guardia odontoiatrica richiede congiuntamente dente localizzato, masticazione e gengiva gonfia.

## Verifiche

- `npm run check`: PASS.
- `npm run build`: PASS.
- Playwright staging locale, Chromium desktop, soli nove casi: 9 PASS / 0 FAIL.
- Chiamate Gemini osservate nei nove raw: 0; il tratto verificato è stato risolto localmente e Gemini non era previsto in questa fase del flusso.
- Mock e intercettazioni: nessuno.
- Diagnosi/sospetti: 0.
- Prescrizioni/dosaggi/terapie operative: 0.
- Scan anti-segreti: eseguito separatamente, nessuna corrispondenza.
- Produzione e mobile: non testati per vincolo esplicito.

## Impatti e limiti

- Salute: aumenta la sensibilità sui tre P0 senza ridurre la prudenza; i controlli negativi impediscono escalation automatica nei profili locali/meccanici.
- Privacy e sicurezza: nessuna nuova raccolta, persistenza o trasmissione dati; nessun segreto registrato.
- Testi legali, database, analytics, Netlify, CSS e UX: non modificati.
- P1, P2 e validatore: non modificati.
- La verifica copre esclusivamente i nove casi autorizzati; non sostituisce una regressione completa, volutamente non eseguita.

## Arresto

Fix P0 e rerun conclusi. Staging spento e runner temporaneo rimosso. Nessun Batch 09 o altro batch medico avviato.
