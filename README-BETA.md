# AIutoDoc Beta 2.0.0-beta.1

Beta locale isolata, creata l'8 settembre 2026 nella cartella AIutoDoc_beta.
Repository Git indipendente, branch codex/aiutodoc-beta, nessun remote configurato.
La cartella originale AIutoDoc_main e il branch main non vengono modificati.

## Avvio

Da questa cartella, con Node.js 22 o successivo consigliato:

    npm run dev

Aprire http://127.0.0.1:4274/ . La porta e distinta dalla versione originale.
Non serve installare dipendenze per l'applicazione e i nuovi test Node.
Usare solo casi inventati. AIutoDoc resta un orientamento informativo; non effettua diagnosi o prescrizioni, non sostituisce il medico e non gestisce emergenze.

## Cosa e pronto

- Consenso registrato prima di sbloccare il percorso; ricevuta firmata, versionata, verificata dal server e valida 30 minuti.
- Salvataggio facoltativo con consenso distinto e ricevuta utilizzabile una sola volta.
- Codice casuale a 192 bit, mai salvato in chiaro nel database; creazione esclusiva con gestione delle collisioni.
- Recupero completo di urgenza, segnali, area specialistica e indicazioni; cancellazione tramite codice.
- Archivio locale in RAM, cancellato al riavvio; nessun dato sanitario persistente in localStorage.
- Configurazione opzionale Firestore in un progetto beta separato; rate limit condiviso con aggiornamenti atomici e budget giornalieri dei provider.
- Prompt sul server, input strutturato e ridotto, schema output verificato, vocabolario urgenza vincolato e rifiuto di alcune istruzioni terapeutiche esplicite.
- Nessun fallback clinico simulato in caso di errore Gemini.
- Deadline delle API, limite di chiamate e dimensione delle risposte, log tecnici minimizzati.
- Analytics disattivati; corretto il ciclo accetta/rifiuta/riaccetta, comprese preferenze scadute.
- Questionario e regole cliniche separati dall'interfaccia; test di sicurezza e di regressione.

## Modalita iniziale

I servizi esterni sono disattivati. Il questionario e le protezioni urgenti locali funzionano; la generazione AI e la ricerca online restituiscono indisponibilita finche non vengono configurate credenziali beta dedicate. Non viene inventato un risultato per simulare un servizio reale.

L'archivio locale e VOLATILE: i codici non sopravvivono al riavvio del server. Questa modalita e per test, non per dati reali. Sul cloud la retention massima e 30 giorni; la rimozione fisica TTL e asincrona.

## Comandi

    npm run verify          # sintassi e test automatici
    npm run build           # genera solo dist della beta
    npm run audit:isolation # confronta impronte e stato Git dell'originale
    node scripts/http-smoke.cjs # server beta gia avviato, usa solo dati sintetici
    node scripts/clinical-regression.cjs # confronto locale con l'originale, sola lettura

La configurazione CI inclusa esegue verifiche e build, senza deployment. Il repository non e collegato a GitHub e la CI non e stata eseguita remotamente.

## Prima di collegare servizi reali

Leggere BETA-REVIEW.md e BETA-MIGRATION.md. Non copiare .env o service account di main.
La configurazione usa esclusivamente BETA_*. Il progetto Firestore deve essere separato e terminare in -beta; un account riferito a un progetto differente viene rifiutato prima delle chiamate di rete.
Qualsiasi pubblicazione o modifica di main richiede una nuova richiesta o approvazione esplicita dell'utente.


## Stato locale aggiornato
Servizi esterni attivati su richiesta: Gemini, Places e SerpApi configurati tramite chiavi indicate dall’utente nella cartella main. Quote e costi sono condivisi con tali chiavi. Archivio locale volatile e analytics spenti. Riavviare npm run dev dopo modifiche al file .env; ricaricare la pagina e avviare una nuova ricerca dopo un riavvio.
