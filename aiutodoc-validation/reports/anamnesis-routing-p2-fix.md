# Anamnesis Routing P2 Fix

Data: 2026-07-13
Branch: `aiutodoc-clinical-validation`
Ambiente: staging locale `http://127.0.0.1:4273`
Browser: `chromium-desktop`
Timeout: 75000 ms
Mock/intercettazione `/api/gemini`: no
Produzione/mobile/audit 19 casi/Batch 09: non eseguiti

## Sintesi

Applicati esclusivamente i due miglioramenti P2 autorizzati:

1. domande contestuali per feci scure comparse dopo ferro o bismuto;
2. domande urinarie esplicitamente contestualizzate alla gravidanza senza red flag.

Esito: **10/10 casi completati**, con **8 PASS ROUTING** e **2 BYPASS URGENZA DOCUMENTATO**. I bypass riguardano le feci molto scure senza spiegazione positiva e il caso urgente con debolezza, capogiri e anticoagulante; entrambi preservano la prudenza P0.

Il controllo `P2_NEG_01_FECI_SCURE_SENZA_FERRO` non riceve l'etichetta PASS ordinaria perché il validatore corretto richiede la classificazione dedicata per un bypass appropriato. Il comportamento è conforme all'atteso P0 e non costituisce escalation inventata.

Gate P2: **SUPERATO sul comportamento clinico-funzionale richiesto**, con classificazione del bypass resa esplicita anziché nascosta.

## Risultati

| Caso | Problema prima | Comportamento dopo | Ramo | Contesto valorizzato | Negazioni rispettate | Regressione P0/P1 | Domande fuori ramo | Diagnosi | Prescrizioni | Esito |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P2_POS_01_FECI_SCURE_FERRO | Gastro generico su pasti/alvo/peso | Temporalità ferro/bismuto, aspetto, andamento, nuove red flag, altri farmaci e contatto professionale | Gastro contestuale ferro/bismuto | SÌ | SÌ | NO | NO | NO | NO | PASS ROUTING |
| P2_POS_02_GRAVIDANZA_URINARIA_SENZA_FEBBRE | Urinario pertinente ma non contestualizzato | Settimana, durata, frequenza/urgenza, minzione, red flag e segnali ostetrici | Urinario in gravidanza non urgente | SÌ | SÌ | NO | NO | NO | NO | PASS ROUTING |
| P2_NEG_01_FECI_SCURE_SENZA_FERRO | Controllo protezione P0 | Nessun ramo ferro; bypass prudenziale motivato solo da feci scure riferite | Prudenza P0 | SÌ | SÌ | P0 preservato | NO | NO | NO | BYPASS URGENZA DOCUMENTATO |
| P2_NEG_02_FERRO_SENZA_FECI_SCURE | Rischio di ramo feci scure improprio | Follow-up informativo su indicazione, professionista, referti e nuovi sintomi | Informazione/follow-up ferro | SÌ | SÌ | NO | NO | NO | NO | PASS ROUTING |
| P2_NEG_03_SINTOMI_URINARI_NON_INCINTA | Controllo negazione gravidanza | Ramo urinario non ostetrico con minzione, frequenza e red flag | Urinario non ostetrico | SÌ | SÌ | P1 preservato | NO | NO | NO | PASS ROUTING |
| P2_NEG_04_GRAVIDANZA_SENZA_SINTOMI_URINARI | Rischio di usare sintomi negati | Orientamento generale per controllo, riferimenti e nuovi cambiamenti; nessun ramo urinario | Gravidanza senza sintomi | SÌ | SÌ | P1 preservato | NO | NO | NO | PASS ROUTING |
| P2_REG_01_FECI_SCURE_URGENTE_P0 | Controllo regressione | Bypass con sole feci scure, debolezza, capogiri e anticoagulante | Urgenza P0 | SÌ | SÌ | PASS | NO | NO | NO | BYPASS URGENZA DOCUMENTATO |
| P2_REG_02_GRAVIDANZA_FEBBRE_FIANCO_P0 | Controllo regressione | Mantenuto ramo gravidanza urgente e accesso PS/Ostetricia | Gravidanza urgente P0 | SÌ | SÌ | PASS | NO | NO | NO | PASS ROUTING |
| P2_REG_03_NAUSEA_LIEVE_GRAVIDANZA_P1 | Controllo regressione | Mantenuto ramo nausea lieve in gravidanza, senza ramo urinario | Gravidanza non urgente P1 | SÌ | SÌ | PASS | NO | NO | NO | PASS ROUTING |
| P2_REG_04_FIANCO_NON_INCINTA_P1 | Controllo regressione | Mantenute domande su fianco, addome e urinario senza Ostetricia | Fianco non ostetrico P1 | SÌ | SÌ | PASS | NO | NO | NO | PASS ROUTING |

## P2_POS_01 - Fedeltà al contesto

| Elemento | Presente nell'input | Negato | Usato correttamente |
| --- | ---: | ---: | ---: |
| assunzione di integratore di ferro | SÌ | NO | SÌ, attiva il contesto solo insieme al cambiamento delle feci |
| relazione temporale `da quando` | SÌ | NO | SÌ |
| feci più scure | SÌ | NO | SÌ |
| debolezza | NO | SÌ | SÌ, compare soltanto come domanda su eventuale comparsa successiva |
| capogiri | NO | SÌ | SÌ, compare soltanto come domanda |
| dolore | NO | SÌ | SÌ, compare soltanto come domanda |
| vomito | NO | SÌ | SÌ, compare soltanto come domanda |
| svenimenti | NO | SÌ | SÌ, compare soltanto come domanda |
| anticoagulanti | NO | SÌ | SÌ, non usati come motivazione né per un bypass |

Non sono state suggerite sospensione, modifica o dosaggio di ferro/bismuto. Non è comparso alcun bypass.

## P2_POS_02 - Verifica contestuale

- Gravidanza riconosciuta: **SÌ**, con domanda esplicita sulla settimana.
- Sintomi urinari riconosciuti: **SÌ**, con durata, bruciore, frequenza, urgenza e minzione.
- Red flag negate rispettate: **SÌ**; vengono richieste come verifica anamnestica, non affermate.
- Escalation automatica: **ASSENTE**; nessun bypass, 112/118 o PS automatico.
- Domanda contestuale ostetrica: **PRESENTE**, con contrazioni, dolore pelvico, perdite di sangue/liquido e contatti con ginecologo/ostetrica/medico curante.
- Diagnosi/prescrizioni: **ASSENTI**.

## Implementazione

La modifica è limitata a `_generaDomandeAnamnestiche()` in `src/app_v3_standalone.js`:

- il ramo ferro/bismuto richiede congiuntamente relazione temporale positiva, assunzione positiva e cambiamento positivo delle feci;
- il ramo urinario P2 richiede gravidanza positiva e sintomi urinari positivi, dopo il ramo urgente P0 e il ramo nausea P1;
- due guardie informative ristrette impediscono fallback generici quando l'utente dichiara esplicitamente assenza di cambiamenti/disturbi.

Non sono stati modificati rilevamento urgenza, motivazioni P0, guardia cardio, altri rami P1, validatore o `score-results.ts`.

## Verifiche

- `npm run check`: PASS.
- `npm run build`: PASS.
- Suite validatore invariata: 12/12 PASS.
- Playwright staging, Chromium desktop, soli dieci casi P2: 10/10 tecnicamente PASS.
- Classificazioni clinico-funzionali: 8 PASS ROUTING, 2 BYPASS URGENZA DOCUMENTATO, 0 FAIL.
- Regressioni P0: 0.
- Regressioni P1: 0.
- Negazioni ignorate: 0.
- Domande fuori ramo: 0.
- Diagnosi/sospetti: 0.
- Prescrizioni/dosaggi/modifiche terapeutiche: 0.
- Motivazioni inventate: 0.
- Escalazioni improprie: 0.
- Sottostime urgenti: 0.
- Errori infrastrutturali: 0.
- Gemini: 0 chiamate osservate; il tratto verificato è risolto localmente.

## Impatti e limiti

- Salute: maggiore pertinenza senza ridurre la prudenza P0 né aumentare automaticamente l'urgenza.
- Privacy/sicurezza: nessuna nuova raccolta, persistenza, API, dipendenza o segreto.
- CSS, UX, testi legali, privacy, consensi, analytics, Netlify e database: non modificati.
- Validatore, P0 e P1: non modificati.
- Audit completo dei 19 casi e altri batch: non eseguiti.

## Arresto

Fix e rerun P2 conclusi. Staging spento e runner temporaneo rimosso. In attesa di decisione CTO esplicita.
