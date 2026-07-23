# Cycle 01 - timeout root cause analysis

Data: 2026-07-15  
Branch: `aiutodoc-clinical-validation`  
Ambiente: staging locale `http://127.0.0.1:4273`, `chromium-desktop`, Gemini reale, nessun mock, nessuna intercettazione.

## Classificazione

**BLOCCO ESTERNO NON RIPRODUCIBILE**

I due timeout storici non si sono riprodotti nell'unico tentativo diagnostico autorizzato. Entrambi i casi hanno emesso una sola richiesta, raggiunto il proxy, invocato Gemini, ricevuto HTTP 200 e aggiornato la UI. Le stesse fasi sono riuscite nei due confronti storicamente PASS.

Non esiste una traccia backend del run storico sufficiente per attribuire retroattivamente il blocco a frontend, proxy o Gemini. La causa più probabile resta una indisponibilità o latenza transitoria esterna durante i run precedenti, con confidenza **medio-bassa (45%)**.

## Risultati

| Caso | Richiesta emessa | Proxy raggiunto | Gemini invocato | Risposta Gemini | Risposta frontend | UI aggiornata | Punto di blocco | Root cause |
|---|---:|---:|---:|---:|---:|---:|---|---|
| ENDO_05_NEGATIVO_FAME_POST_ALLENAMENTO | Sì, 1 POST | Sì | Sì | 200 in 12.794 ms | 200 in 13.170 ms | Sì | Nessuno nel run diagnostico | Blocco storico esterno non riproducibile |
| GINE_05_NEGATIVO_RITARDO_CICLO | Sì, 1 POST | Sì | Sì | 200 in 8.716 ms | 200 in 9.153 ms | Sì | Nessuno nel run diagnostico | Blocco storico esterno non riproducibile |
| ENDO_04_BORDERLINE_CICLO_IRREGOLARE, confronto PASS | Sì, 1 POST | Sì | Sì | 200 in 13.690 ms | 200 in 13.838 ms | Sì | Nessuno | Controllo riuscito |
| GINE_04_BORDERLINE_BRUCIORE_URINARIO, confronto PASS | Sì, 1 POST | Sì | Sì | 200 in 11.223 ms | 200 in 11.533 ms | Sì | Nessuno | Controllo riuscito |

## Timeline frontend

I tempi sono relativi all'apertura della pagina del singolo caso.

| Caso | Input inviato | Ricerca avviata / POST Gemini | Risposta `/api/gemini` | Stato `7_FINE` | Esito UI |
|---|---:|---:|---:|---:|---|
| ENDO_05 | 4.749 ms | 9.697 ms | 22.866 ms | 56.275 ms | Output visibile |
| GINE_05 | 2.384 ms | 7.273 ms | 16.426 ms | 53.485 ms | Output visibile |
| ENDO_04 PASS | 1.949 ms | 6.889 ms | 20.726 ms | 53.017 ms | Output visibile |
| GINE_04 PASS | 2.173 ms | 6.625 ms | 18.158 ms | 52.829 ms | Output visibile |

La UI applica un'attesa minima di 45 secondi prima di mostrare il risultato. Per questo lo stato finale compare circa 46 secondi dopo l'invio anche quando Gemini risponde in 9-14 secondi.

## Timeline backend

Per ogni richiesta il wrapper diagnostico temporaneo ha registrato ingresso, validazione, avvio upstream, risposta e uscita del proxy. Nessuna chiave, query string, cookie o contenuto sanitario è stato registrato.

| Caso | Body proxy | Prompt | Body upstream | Ingresso -> upstream | Upstream | Totale proxy | HTTP |
|---|---:|---:|---:|---:|---:|---:|---:|
| ENDO_05 | 4.934 B | 4.792 caratteri | 5.267 B | 296 ms | 12.794 ms | 13.107 ms | 200 |
| GINE_05 | 4.920 B | 4.776 caratteri | 5.253 B | 285 ms | 8.716 ms | 9.114 ms | 200 |
| ENDO_04 PASS | 4.867 B | 4.725 caratteri | 5.200 B | 69 ms | 13.690 ms | 13.798 ms | 200 |
| GINE_04 PASS | 4.907 B | 4.765 caratteri | 5.240 B | 224 ms | 11.223 ms | 11.495 ms | 200 |

## Payload e confronto

Il payload completo ha struttura `POST { "prompt": string }`. Nel trace condivisibile i valori sanitari sono sostituiti da `[SANITIZED]`; hash SHA-256, struttura e metriche consentono di dimostrare quale payload è stato inoltrato senza duplicare anamnesi nei log.

| Caso | Body | Prompt UTF-8 | Newline | Accenti | Apostrofi | `null` letterali | `undefined` | Domande anamnestiche |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| ENDO_05 | 4.934 B | 4.798 B | 37 | 6 | 11 | 0 | 0 | 3 |
| GINE_05 | 4.920 B | 4.784 B | 37 | 8 | 11 | 0 | 0 | 3 |
| ENDO_04 PASS | 4.867 B | 4.731 B | 37 | 6 | 11 | 0 | 0 | 3 |
| GINE_04 PASS | 4.907 B | 4.771 B | 37 | 6 | 11 | 0 | 0 | 3 |

Le differenze sono minime e coerenti con il testo raccolto. JSON sempre valido, prompt non vuoto, dimensioni lontane dai limiti, nessun carattere corrotto e nessun valore `undefined` serializzato. Accenti e apostrofi sono stati accettati da backend e Gemini.

## Tracciamento frontend

- Evento di avvio: conclusione dell'ultima scelta anamnestica, `_startScientificResearch()`, quindi `_eseguiRicercaAI()` e `_getGeminiConsultation()`.
- Una sola richiesta finale `/api/gemini` per caso; nessun doppio submit.
- Metodo POST e `Content-Type: application/json`.
- Nessuna Promise rimasta pendente al termine; richieste Gemini pending finali: 0.
- Nessuna eccezione JavaScript non gestita o `pageerror`.
- Il fetch finale Gemini non usa un `AbortController` frontend. Il proxy usa un abort a 75 secondi, non attivato nel run corrente.
- Il loader viene rimosso e il risultato è visibile. La barra input resta nascosta nel normale stato finale; il pulsante è tecnicamente abilitato ma non visibile tramite il contenitore.
- Il timer UI di 55 secondi può mostrare il fallimento prima del limite backend di 75 secondi. Nel run corrente Gemini ha risposto prima di entrambi.

## Verifiche delle cause candidate

| Causa candidata | Evidenza diagnostica |
|---|---|
| Richiesta frontend mai inviata / condizione che blocca fetch | Esclusa nel run: 1 POST per caso |
| Promise mai risolta / ramo senza return / loop | Esclusa nel run: Promise conclusa, stato `7_FINE` e output visibile |
| Serializzazione, prompt vuoto/corrotto, payload eccessivo | Esclusa: JSON valido, prompt 4,7-4,8 KB, backend validato |
| Caratteri speciali, accenti, apostrofi, newline | Esclusa: tutti i payload hanno ricevuto 200 |
| Doppio submit / race / stato non resettato | Non osservata: una richiesta e nessun pending finale |
| Proxy non raggiunto | Esclusa nel run: ingresso proxy registrato quattro volte |
| Rate limiting Gemini | Non osservato: nessun 429 Gemini |
| Keep-alive o connessione chiusa | Non osservato: tutte le connessioni completate |
| Chiamata Gemini pendente / risposta non conforme / parser bloccato | Non osservato: 200, parsing e risposta proxy completati |
| Risposta ricevuta ma UI non aggiornata | Esclusa: quattro output visibili |
| Errore specialist-search | Presente dopo Gemini: SerpApi 429 tradotto in 502, gestito dal fallback e non bloccante per l'output |

## Evidenza sul timeout storico

Il runner ordinario attende il solo contenitore di successo `[data-testid="aiutodoc-output"]` quando lo stato entra in ricerca. Se la UI mostra invece `Ricerca non completata` dopo 55 secondi, quel contenitore non viene creato e l'asserzione continua fino al timeout Playwright di 120/150 secondi. Inoltre il raw ordinario viene scritto solo dopo il recupero dell'output: in caso di timeout la lista delle richieste può non essere persistita integralmente.

Questo spiega il **timeout Playwright e la scarsa osservabilità** dei run precedenti, ma non dimostra perché la chiamata esterna storica non abbia prodotto una risposta registrata.

## Chiamata isolata

Non è stata eseguita una seconda invocazione diretta dei due payload: avrebbe costituito un ulteriore tentativo oltre l'unico autorizzato. Il tracciamento end-to-end ha comunque verificato l'equivalente tecnico: payload esatto emesso dal frontend, ricevuto dal proxy e inoltrato una volta a Gemini reale, con risposta 200.

## Causa probabile e proposta

**Causa più probabile:** episodio transitorio esterno di latenza/indisponibilità Gemini o della connessione upstream durante i run storici.  
**Confidenza:** medio-bassa, 45%, perché l'evento non è riproducibile e mancano log backend storici.

**Fix minimo proposto, non applicato:** migliorare esclusivamente l'osservabilità del runner in `aiutodoc-validation/tests/aiutodoc-orientation.spec.ts`, attendendo uno stato terminale composto da output di successo oppure messaggio di fallimento e salvando sempre request-start, pending, response/requestfailed e console in un blocco `finally`.

**Rischio del fix proposto:** basso per il prodotto perché limitato alla suite QA; medio per la classificazione dei test se il messaggio di indisponibilità venisse erroneamente contato come PASS. Deve restare un esito infrastrutturale distinto.

Non è proposto alcun fix applicativo senza una nuova riproduzione. Un eventuale allineamento dei timeout richiederebbe valutazione separata di `src/app_v3_standalone.js` e `server/gemini_proxy.js`, con rischio di modificare l'esperienza di fallimento e la disponibilità del servizio.

## Rerun minimo successivo

Solo `ENDO_05` e `GINE_05`, una volta approvata dal CTO la modifica di osservabilità QA oppure durante una nuova ricorrenza del problema, con log backend sanitizzati attivi dall'inizio. Nessun Ciclo 02.

## Verifiche

- `npm run check`: PASS.
- `npm run build`: PASS.
- `npm run test:validator`: 12/12 PASS.
- Runner diagnostico: 4/4 completati, zero retry.
- Branch: `aiutodoc-clinical-validation`.
- Nessun mock, nessuna intercettazione, nessuna produzione, nessun mobile.
- Nessun comportamento clinico, router, validatore, scoring, fixture o criterio modificato.

