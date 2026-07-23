# AGENTS.md - AIutoDoc

## Ambito

Queste regole si applicano all'intero repository. Eventuali `AGENTS.md` presenti in sottocartelle possono aggiungere regole piu specifiche, senza indebolire quelle di sicurezza, privacy e tutela sanitaria definite qui.

## Obiettivo del progetto

AIutoDoc e una piattaforma di orientamento sanitario informativo. Aiuta l'utente a individuare la branca specialistica piu pertinente e a trovare specialisti o strutture tramite fonti pubbliche.

AIutoDoc:

- non effettua diagnosi;
- non prescrive terapie, farmaci o esami;
- non sostituisce il medico, il medico di medicina generale, il pediatra o altri professionisti sanitari;
- non sostituisce il Servizio Sanitario Nazionale o Regionale;
- non deve essere usato per gestire emergenze sanitarie.

## Regole fondamentali

- Non rimuovere, nascondere o indebolire disclaimer medico, privacy policy, cookie policy, termini e condizioni, consensi o avvisi per le emergenze.
- Non introdurre diagnosi automatiche, valutazioni cliniche conclusive, prescrizioni o promesse di accuratezza sanitaria.
- Non trasformare l'indicazione della branca specialistica in un parere medico o in una diagnosi.
- Non salvare, inviare a terzi o rendere persistenti dati sanitari senza consenso esplicito, informato, specifico e documentabile.
- Non ampliare dati raccolti, finalita, tempi di conservazione, destinatari o servizi terzi senza segnalarlo e senza aggiornare, quando necessario, testi legali e flussi di consenso.
- Non modificare UX, testi legali, banner cookie, Consent Mode, flussi privacy o registrazione dei consensi senza evidenziarlo prima e documentarne l'impatto.
- Non inserire chiavi API, service account, credenziali, token o dati personali nel codice client, nei log, nei commit o nei file pubblicati in `dist`.
- Non esporre direttamente Firestore al client: le regole correnti negano ogni accesso client e l'archivio e gestito dal backend tramite Firebase Admin.
- Non registrare nei log richieste sanitarie complete, anamnesi, codici di recupero in chiaro, segreti o payload sensibili.
- Non indebolire validazione input, limiti di dimensione, rate limiting, CORS, CSP, escaping HTML, retention o hashing dei codici senza una motivazione di sicurezza documentata.
- Non introdurre nuove dipendenze o servizi esterni senza motivazione, verifica della manutenzione e valutazione privacy/sicurezza.
- Non cambiare struttura, collezioni o regole del database senza migration e piano di rollback documentati.
- Non fare refactor massivi se il task e circoscritto. Conservare il comportamento non coinvolto.
- Ogni modifica deve essere verificabile con controlli proporzionati al rischio.
- Ogni risposta conclusiva deve indicare i file modificati, il motivo e i controlli eseguiti.
- Prima di modificare codice critico, spiegare sinteticamente piano, rischi e verifiche previste.

## Codice critico e aree sensibili

Considerare critiche almeno queste aree:

- prompt, parsing e output dell'orientamento sanitario;
- riconoscimento e messaggistica delle emergenze;
- consenso privacy e trattamento dei dati sanitari;
- registro dei consensi e versionamento dei documenti legali;
- salvataggio, recupero e scadenza dei triage anonimi;
- codici di recupero, hashing e accesso a Firestore;
- Firebase Admin, service account e `firestore.rules`;
- proxy Gemini e integrazioni Google/SerpApi;
- ricerca, ranking e presentazione di specialisti e strutture;
- cookie, Google Analytics 4 e Consent Mode v2;
- header di sicurezza, CSP, CORS e rate limiting;
- eventuali futuri login admin/specialista, prenotazioni, pagamenti o fee.

Per modifiche in queste aree:

1. descrivere il comportamento attuale e il cambiamento previsto;
2. identificare rischi sanitari, privacy e sicurezza;
3. mantenere un comportamento sicuro in caso di errore o servizio esterno non disponibile;
4. eseguire almeno `npm run check` e `npm run build`, oltre a test manuali mirati;
5. segnalare esplicitamente qualsiasi verifica non eseguibile localmente.

## Stack tecnico attuale

- Frontend: HTML, CSS e JavaScript vanilla, senza framework; PWA con `manifest.webmanifest` e `service-worker.js`.
- Backend: Node.js 18+ in CommonJS; moduli condivisi in `server/`, funzioni serverless in `netlify/functions/` e adapter API in `api/`.
- Intelligenza artificiale: Google Gemini tramite proxy server-side.
- Ricerca specialisti: Google Places API, Google Programmable Search/Custom Search oppure SerpApi, con dati derivati da fonti pubbliche.
- Database: Google Cloud Firestore opzionale, accessibile server-side con Firebase Admin; collezioni correnti `anonymous_triages` e `consent_logs`.
- Hosting principale: Netlify; build statica in `dist` e Netlify Functions. Il branch di produzione documentato e `main`.
- Analytics: Google Analytics 4 con Google Consent Mode v2; reportistica documentata per Looker Studio. Analytics completo solo dopo consenso.
- Sistema login: nessun login o account autenticato. Il recupero del triage usa un codice anonimo; non trattarlo come autenticazione forte.
- Gestione specialisti: ricerca e visualizzazione di professionisti/strutture da fonti pubbliche; non esiste un portale specialisti autenticato.
- Gestione prenotazioni: nessun motore di prenotazione interno; vengono mostrati contatti o collegamenti pubblici verso soggetti terzi.
- Pagamenti e fee: non implementati; il progetto dichiara di non raccogliere dati di pagamento.

## Struttura principale

- `index.html`, `src/`: interfaccia, percorso di orientamento, consensi e analytics.
- `server/`: logica backend condivisa, guardie richieste, Gemini, ricerca, Firestore e consensi.
- `netlify/functions/`: entry point Netlify delle API.
- `api/`: adapter serverless alternativi delle API.
- `privacy-policy/`, `cookie-policy/`, `disclaimer-medico/`, `termini-condizioni/`: documenti legali sensibili.
- `firestore.rules`: accesso client a Firestore, attualmente negato.
- `scripts/`: server locale, build e generatori.
- `netlify.toml`: build, route API e header di sicurezza della produzione Netlify.
- `.env.example`: elenco delle variabili d'ambiente ammesse; non contiene segreti reali.

## Comandi utili

- Requisiti: Node.js 18 o successivo.
- Installazione: `npm install` (attualmente non sono dichiarate dipendenze applicative).
- Sviluppo locale: `npm run dev` (default `http://127.0.0.1:4173`).
- Controllo sintattico/lint disponibile: `npm run check`.
- Build: `npm run build` (genera `dist`).
- Test: non esiste ancora una suite automatizzata dedicata; usare `npm run check`, `npm run build` e test manuali mirati.

## Verifiche minime

Per ogni modifica al codice:

- eseguire `npm run check`;
- eseguire `npm run build`;
- verificare che nessun segreto sia finito nei file tracciati o in `dist`;
- verificare il flusso interessato in locale, inclusi errori e servizi non configurati;
- per modifiche UI, controllare desktop e mobile e la presenza degli avvisi sanitari;
- per modifiche ai consensi, provare accettazione, rifiuto, modifica preferenze e scadenza;
- per modifiche ai dati sanitari, verificare minimizzazione, consenso, retention, cancellazione/scadenza e assenza di dati sensibili nei log;
- per modifiche alle API, verificare metodo HTTP, input non valido, payload eccessivo, rate limit, CORS e risposta senza dettagli interni.

## Dati e privacy

- Raccogliere solo i dati strettamente necessari all'orientamento richiesto.
- Preferire dati anonimi o pseudonimi; non aggiungere nome, email, telefono o identificatori persistenti senza una decisione esplicita di prodotto e privacy.
- I triage salvati possono contenere dati sanitari: conservarli solo per il periodo configurato e mai oltre il necessario.
- I codici di recupero devono restare casuali, non enumerabili facilmente e memorizzati tramite hash lato database.
- Le chiavi e `FIREBASE_SERVICE_ACCOUNT_JSON` devono esistere solo nelle variabili d'ambiente server-side.
- Ogni nuovo fornitore che riceve dati richiede una valutazione di finalita, base giuridica, trasferimenti, conservazione e aggiornamento dell'informativa.

## Sicurezza sanitaria dell'AI

- Il modello deve produrre orientamento prudente e una branca specialistica, non una diagnosi.
- Mantenere istruzioni e controlli che vietano terapie, farmaci, dosaggi e conclusioni cliniche.
- In presenza di possibili segnali urgenti, privilegiare messaggi chiari che indirizzino ai servizi di emergenza appropriati, senza rassicurazioni automatiche.
- Un errore di Gemini o delle API di ricerca non deve generare indicazioni cliniche inventate. In produzione il fallback locale clinico deve restare disabilitato salvo valutazione esplicita e documentata.
- I risultati relativi agli specialisti devono essere presentati come informazioni provenienti da fonti pubbliche, senza garanzie, endorsement o ranking clinico ingannevole.

## Dipendenze, database e deploy

- Per ogni nuova dipendenza indicare scopo, alternativa considerata, impatto sul bundle, licenza e rischi di supply chain.
- Per ogni modifica dati indicare schema precedente e nuovo, migrazione, compatibilita, retention e rollback.
- Non modificare direttamente output generati in `dist`: modificare le sorgenti e rigenerare con `npm run build`.
- Non pubblicare o fare push senza richiesta esplicita.
- Prima del deploy controllare anche `netlify.toml`, variabili d'ambiente richieste, header di sicurezza e comportamento senza chiavi opzionali.

## Formato della consegna

La risposta finale di ogni intervento deve includere:

- file modificati e motivo;
- verifiche eseguite e relativo esito;
- rischi, limiti o test non eseguiti;
- eventuali impatti su salute, privacy, testi legali, database, analytics o servizi esterni.
