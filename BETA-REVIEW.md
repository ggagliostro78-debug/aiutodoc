# Revisione beta - 8 settembre 2026

## Base e ambito

Base: c9d2345 della cartella AIutoDoc_main, che al momento si trovava sul branch aiutodoc-clinical-validation; inclusa nella copia la modifica locale a src/app_v3_standalone.js e i due file del test nuoto. Nessun checkout, reset, commit, build o modifica di sorgenti nell'originale durante la creazione beta. Clone indipendente senza remote e senza file .env.

Il confronto source-baseline registra 566 file tracciati e non tracciati dell'originale. npm run audit:isolation confronta SHA-256 e stato Git. Il branch main originale e in un'altra worktree e non e stato toccato.

## Modifiche e motivi

| Area / file | Modifica | Impatto |
|---|---|---|
| server/triage_store.js, beta_storage.js | token 192 bit, hash HMAC, create-if-absent, ricevuta singola, campi completi, scadenza e cancellazione | Nuovo schema solo beta; vedere piano dati |
| server/consent_logs.js, beta_contract.js | ricevuta firmata, finalita/versione server, registro minimizzato | Cambia il flusso consensi beta; niente IP/UA nel registro |
| server/gemini_proxy.js | istruzioni server, dati strutturati, validazione output e urgenza, nessun mock clinico | Prompt modificato: serve nuova valutazione indipendente su AI reale |
| server/request_guard.js, beta_environment.js | rate limit atomico, header trusted Netlify, isolamento config | Non accetta le credenziali main; altri adapter senza IP attendibile condividono un limite conservativo |
| server/beta_http.js, places.js, specialist_search.js, enrich.js | deadline, allowlist provider, risposta <=2 MiB, 16 chiamate per richiesta e budget giornaliero | Rimosso scraping HTML arbitrario; possibili contatti meno completi |
| src/clinical_rules.js, questionnaire_rules.js, app_v3_standalone.js | separazione delle regole e UI, eliminato prompt client, ordine catalogo deterministico | Conservati routing preesistenti; piccole correzioni linguistiche urgenti documentate sotto |
| src/app_shared.js, beta_client.js, chat_interface.js, recupera-ricerca/index.html | archivio pagina in RAM, passaggio codice in sessionStorage, recupero completo, cancella e termina sessione | Nessuna persistenza automatica di dati sanitari in localStorage; vecchi codici non compatibili |
| src/ga_bootstrap.js, legal_page_tracking.js | ripristino granted dopo revoca, scadenza rigorosa, chiavi browser separate | Analytics disattivati nella beta, nessuna proprieta GA di produzione usata |
| index.html, src/style.css, beta/, pagine pubbliche | identita beta, avvisi, token lunghi, layout mobile, documenti accessibili | UX beta modificata e segnalata; disclaimer e avvisi urgenti preservati |
| privacy-policy/, cookie-policy/ | nota beta e trattamento effettivo documentato | Bozza tecnica da verificare prima di dati reali; non attestazione legale |
| service-worker.js, app_bootstrap.js, netlify.toml | niente cache dati/pagine beta, noindex e referrer ridotto | PWA offline non attiva nella beta |
| scripts/, tests/, package.json, workflow | controlli locali, confronto originale, test automatici e CI senza deploy | Nessuna nuova dipendenza applicativa |

## Sicurezza sanitaria e validazione

Un nuovo caso linguistico con difficolta a respirare a riposo e dolore al petto non attivava la protezione locale. Aggiunto il sinonimo 'difficolta a respirare' alla categoria respiratoria gia esistente. Le negazioni terminano ora anche davanti a ma/pero/tuttavia/invece, per non cancellare la successiva frase affermativa. Il messaggio resta informativo e invita al 112/118 senza formulare una diagnosi.

Fonte informativa generale di confronto: https://www.nhs.uk/symptoms/chest-pain/ . La traduzione in regole software non e una validazione clinica. I nuovi casi usati per correggere il codice sono da questo momento regressioni, non una prova indipendente di generalizzazione.

Il confronto locale su 50 casi storici conferma identico esito del riconoscimento urgenza e identiche domande prima/dopo l'estrazione dei moduli. Non confronta l'output di Gemini e non dimostra appropriatezza clinica dei 50 casi.

Restano regole storiche molto specifiche per alcuni scenari. Non sono state generalizzate automaticamente, per evitare cambiamenti clinici non validati. Prima di dati reali servono revisore sanitario, nuovi casi non utilizzati nello sviluppo, parafrasi/negazioni/comorbilita, misura di urgenze mancate e falsi allarmi e validazione delle branche non coperte. I controlli testuali sulle prescrizioni intercettano soltanto alcuni pattern e non garantiscono la sicurezza semantica di ogni risposta del modello.

## Verifiche

- npm run check: superato.
- npm test: 29 test superati; servizi simulati, nessuna chiamata AI reale.
- Script confronto routing: 50 casi, 50 invariati, 0 differenze.
- HTTP smoke: allowlist file pubblici, blocco .env/server/.git e percorso codificato, metodi, consenso obbligatorio, ricevuta singola, salvataggio/recupero completo: superato.
- Browser locale: consenso ingresso, rifiuto cookie, questionario, avviso urgente su caso inventato, recupero completo e cancellazione del record sintetico verificati; controlli desktop 1280x900 e mobile 390x844.
- Modulo cloud: test con risposte HTTP simulate per isolamento progetto, creazione esclusiva, CAS e conflitti. Non connesso a Firestore reale.
- Verifica integrita originale: 566 impronte e stato Git invariati.
- npm run build e git diff --check: superati. Scansione di 617 file sorgente/output: nessuna firma riconosciuta di chiavi private, API Google o token GitHub; nessuna cartella privata o .env in dist. La scansione non costituisce un audit completo della cronologia Git.

## Costi e osservabilita

Nessun servizio esterno attivo per impostazione iniziale. All'attivazione esplicita, le metriche operative registrano solo provider, codice HTTP e durata; niente URL di ricerca, chat, localita, codici o dettagli degli errori. Le chiamate ai provider sono limitate globalmente nel progetto beta: default 1000 al giorno per hostname, configurabile 1-10000. Questo e un limite di volume, non un tetto monetario: impostare anche budget/alert nel pannello di ciascun fornitore e verificare i prezzi del contratto.

Costo medio operativo da misurare nel pilot: addebiti attribuibili alla beta / ricerche completate. Monitorare anche percentuale di completamento, abbandono per fase, errori, latenza p50/p95 e risultati utili. Non attivare una proprieta analytics o un nuovo servizio di monitoraggio senza valutazione e configurazione beta dedicata. La beta non presume di conoscere prezzi o costi reali non osservati.

## Attivazione esterna: controlli ancora da svolgere

1. Progetto Google/Firebase separato e account con privilegi minimi; nessuna credenziale main.
2. Contratti e impostazioni Gemini, SerpApi, Google Places/CSE, Nominatim, Netlify: finalita, dati inviati, localizzazione, conservazione e trasferimenti. La beta non ha creato nuovi account o accordi.
3. Policy TTL effettive su tutte le collezioni beta; cancellazione e scadenza controllate sul cloud.
4. Valutazione privacy e inquadramento sanitario/regolatorio con professionisti competenti.
5. Collaudo end-to-end con Gemini e ricerca reali, test di carico, security review e verifica degli header sul sito beta pubblicato.
6. Eventuale hostname separato: non pubblicare la beta in una sottocartella del dominio main, per isolare storage, cookie e service worker.

Fonti tecniche: https://ai.google.dev/api/generate-content ; https://ai.google.dev/gemini-api/terms ; https://firebase.google.com/docs/firestore/ttl .

La beta locale e consegnabile per prove sintetiche. Non e dichiarata pronta per un lancio sanitario pubblico. Main puo essere modificato solo con nuova richiesta o approvazione esplicita dell'utente.



## Dipendenze e CI opzionale

Nessuna nuova dipendenza npm e nessun SDK aggiunto al bundle applicativo. Alternativa considerata: SDK Firebase Admin; mantenuto un adapter REST ridotto con test del contratto HTTP, evitando una nuova dipendenza, ma la manutenzione dell'adapter resta a carico del progetto.

Il workflow opzionale usa actions/checkout e actions/setup-node, progetti ufficiali GitHub con licenza MIT, fissati a commit verificati del ramo v4; richiede soli permessi contents:read e non conserva le credenziali di checkout. Scopo: ripetere i test sintetici e la build. Alternativa: eseguire solo npm run verify in locale, gia possibile. Nessun impatto sul bundle. Rischio supply chain: codice di terzi nel runner CI, ridotto dal pin dei commit, dall'assenza di segreti e dal mancato deploy. Verificare aggiornamenti di sicurezza prima dell'effettiva attivazione del workflow. Fonti: https://github.com/actions/checkout e https://github.com/actions/setup-node . Nessun invio a GitHub effettuato durante questa attivita.

Ultimo controllo UI: corretta la disposizione del banner beta su desktop e mobile; eliminato il download dei font da CDN, usando i font disponibili sul dispositivo.

## Aggiornamento impegnativa e scheda curata

Il campo `impegnativa_medico` è ora presentato come proposta di dicitura da discutere con il medico curante. Le istruzioni server-side richiedono che contenga una formulazione sintetica relativa alla valutazione specialistica e ai sintomi riferiti, senza diagnosi, codici di prescrizione, esami, farmaci o terapia. Il medico resta l’unico soggetto che decide se e come redigere l’impegnativa.

La scheda curata del Dott. Vincenzo Calafiore viene mantenuta entro le prime cinque proposte, e comunque entro il limite di 20 risultati, solo per orientamenti ortopedici/traumatologici con zona Reggio Calabria o Vibo Valentia. Era esclusa da un difetto di ordinamento quando erano già presenti 20 risultati. La scheda resta identificata come curata e non rappresenta un ranking clinico o un endorsement.

## Attivazione servizi autorizzata
Su richiesta esplicita dell’utente, configurate in .env beta le chiavi Gemini, Google Places e SerpApi lette dalla cartella main. Il file sorgente non e stato modificato; nessun service account, database o analytics importato. Questa eccezione condivide quote e fatturazione dei provider: non costituisce isolamento cloud. Archivio beta ancora locale e volatile. .env escluso da Git e dist.
Modificati server/gemini_proxy.js (codici distinti per servizi spenti/configurazione assente), src/app_v3_standalone.js (stato errore e nuova ricerca, eliminata attesa artificiale sul fallimento), scripts/dev-local.js (solo variabili BETA_ e indicatore ricerca corretto), tests/clinical-holdout.test.cjs (regressione stato errore). Consensi e istruzioni sanitarie invariati; test esterno soltanto con scenario inventato.

Esiti attivazione: Gemini HTTP 200 con risultato conforme; ricerca specialisti HTTP 200 con 20 schede; 30 test superati, check e build superati. Scansione dist contro i valori effettivi delle chiavi: nessuna corrispondenza. Flusso completo browser non ripetuto in questa attivazione; verificati gli endpoint reali e lo stato errore con test automatico.
