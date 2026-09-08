# Dati, consensi e rollback della beta

## Isolamento

Nessuna migrazione e stata eseguita sul database originale. Non sono state importate credenziali, archivi o codici reali. La beta locale usa RAM; il codice cloud e predisposto ma non attivato.

## Schema precedente

Collezioni anonymous_triages e consent_logs. Il triage usava un hash SHA-256 del codice come ID, ma il payload conteneva anche il codice in chiaro. Alcuni campi dell'orientamento non erano archiviati; mancava il legame con la prova del consenso. Il wrapper assegnava una scadenza predefinita di un giorno ai documenti privi di expiresAt.

## Schema beta

| Collezione nel progetto beta | Contenuto | Scadenza |
|---|---|---|
| beta_triages_v2 | userData ridotto, risultato completo, data server, schemaVersion 2, consentId/versione; ID HMAC del codice | configurabile 1-30 giorni, mai oltre 30 |
| beta_consents_v2 | finalita, consensi ammessi, versione e snapshot dei testi server, data; nessun IP/UA | massimo 30 giorni |
| beta_consents_v2 / used_* | marcatura di utilizzo della ricevuta archivio, senza dati sanitari | scadenza del triage |
| beta_limits_v1 | contatore, resetAt, expiresAt; ID HMAC separato per finalita | doppia finestra, massimo 48 ore per budget giornalieri |

Ogni documento cloud ha payloadJson e un expiresAt TIMESTAMP nativo. Configurare e verificare una policy TTL sul campo expiresAt per tutte e tre le collezioni. A scadenza il recupero rifiuta il documento anche prima della cancellazione TTL. Scadenze non valide sono rifiutate; quelle gia presenti non vengono trattate come illimitate.

I codici contengono 24 byte casuali (192 bit) rappresentati in 48 caratteri esadecimali. La chiave HMAC e BETA_SIGNING_SECRET, almeno 64 caratteri casuali, stabile e solo server-side. La rotazione non coordinata rende inutilizzabili codici, ricevute e contatori precedenti: pianificarla prima dell'attivazione del cloud.

## Compatibilita

La beta non accetta i vecchi codici di main. Questo e intenzionale: leggerli richiederebbe accesso ai dati originali, vietato in questa attivita. Non fare import automatici di dati sanitari o consensi storici.

In un eventuale intervento futuro espressamente autorizzato: definire nuova base di consenso, censimento, migrazione su copia protetta, mapping dei campi mancanti senza ricostruzioni cliniche inventate, verifica della retention, collaudo e periodo di rollback. I vecchi codici dovrebbero essere revocati o sostituiti secondo un flusso approvato.

## Cancellazione e revoca

Il recupero permette una richiesta POST di cancellazione con il codice: elimina triage e relativa ricevuta archivio. La chiusura sessione revoca la ricevuta d'ingresso e svuota lo stato della pagina; non elimina automaticamente gli archivi salvati volontariamente, per i quali serve il codice. In caso di errore di revoca viene dichiarato che la scadenza della ricevuta resta di 30 minuti.

Una cancellazione cloud puo essere parziale se il provider fallisce tra le operazioni: il triage viene eliminato per primo; l'eventuale ricevuta residua senza dati sanitari scade tramite TTL. Prevedere controllo operativo dei residui prima del lancio con utenti reali.

## Rollback

Per annullare una prova locale: fermare il server beta. I dati in RAM vengono eliminati; main non subisce effetti.
Per rollback del software beta: conservare la versione precedente nello stesso repository isolato e ripristinarla senza cambiare schema o credenziali main.
Per un futuro cloud beta: disattivare BETA_EXTERNAL_SERVICES, fermare il traffico sul solo sito beta, mantenere cancellazione/TTL secondo i tempi comunicati. Non ripristinare backup che riattivino documenti scaduti o cancellati. Nessuna operazione di rollback e stata eseguita sul cloud durante questa attivita.

## Riferimenti tecnici

- https://firebase.google.com/docs/firestore/ttl
- https://firebase.google.com/docs/firestore/reference/rest/v1/projects.databases.documents/commit

Il controllo atomico del contatore usa commit con precondizione updateTime oppure exists:false e ripete i conflitti; se non riesce, rifiuta la richiesta invece di disattivare il limite.
