# AIutoDoc master — copia di lavoro dell'upgrade

Cartella: `Z:\ProgettiAI\Antigravity\Futuro\aiutodoc_master`.
Repository: `https://github.com/ggagliostro78-debug/aiutodoc.git`, ramo locale `main`.

Questa copia parte dal commit di produzione `e6795b64498b8991dfa679594089ee7f6f548d14` e integra le sorgenti dell'upgrade sviluppato in `AIutoDoc_beta`, incluse le correzioni di interfaccia successive. La fascia gialla iniziale e stata rimossa; il pulsante Termina sessione e nel menu. Le altre cartelle restano separate.

## Avvio locale

Eseguire `npm run dev` in questa cartella e aprire <http://127.0.0.1:4284/>. Non aprire direttamente index.html. La porta puo essere cambiata con BETA_PORT.

Il file .env non e incluso: le credenziali non fanno parte del trasferimento delle sorgenti. Senza configurazione i servizi esterni restano disattivati; il questionario, i controlli urgenti e i test sintetici locali restano disponibili. L'archivio locale e in RAM e si svuota al riavvio. Usare dati inventati durante le prove.

## Verifiche

- `npm run verify`: sintassi e test Node senza dipendenze aggiuntive.
- `npm run build`: rigenera dist dalle sorgenti.
- `node scripts/http-smoke.cjs`: a server avviato, prova consensi, salvataggio, recupero e cancellazione di un caso sintetico, senza conservare il codice su disco.

I documenti README-BETA.md, BETA-REVIEW.md e BETA-MIGRATION.md descrivono lo sviluppo storico e i vincoli dell'upgrade. I riferimenti a cartelle e porte in quei documenti non indicano questa copia master. Gli script storici audit:isolation e clinical-regression richiedono gli archivi originali e non sono controlli di questa integrazione.

## Backup e ripristino

Backup precedente all'integrazione:
`Z:\ProgettiAI\Antigravity\Futuro\AIutoDoc_backups\aiutodoc_master-before-upgrade-20260908-124411`.

Contiene main-sources.zip e repository.bundle, verificato da git bundle verify, con la cronologia Git completa. Per recuperare la versione precedente clonare repository.bundle in una NUOVA cartella con `git clone -b main PERCORSO_BUNDLE NUOVA_CARTELLA`; non sovrascrivere le copie con lavoro in corso. Il backup non comprende dati Firestore o variabili Netlify.

## Limiti prima del deploy

Il trasferimento locale non e un deploy. L'upgrade usa variabili BETA_*, firma dei consensi e un database diverso dalla produzione storica: vedere BETA-MIGRATION.md. I vecchi codici di recupero non sono compatibili. Conservare i dati e i consensi storici senza importazione automatica; definire compatibilita, TTL e rollback prima di sostituire il sito pubblico.

Le modifiche includono prompt server-side, controlli sulle risposte, registro consensi, minimizzazione e cancellazione, regole cliniche separate, protezioni API e nuove diciture privacy/cookie. Analytics restano disattivati e noindex preservato. Nessuna nuova dipendenza, nessuna credenziale pubblicata, nessuna modifica al database di produzione effettuata con questa integrazione.

## Esito della verifica di integrazione — 8 settembre 2026

Trasferiti 115 file sorgente/configurazione/test/documentazione selezionati dalla copia di sviluppo, escluse credenziali, archivi raw, output generati e workflow CI opzionale. Conservate le 13 correzioni successive ai testi dalla copia temporanea. Il repository Git della destinazione conserva origine e cronologia della produzione.

Adattamenti locali: porta predefinita 4284; caricamento .env prima della scelta della porta; validazione Origin legata alla porta configurata, senza allargare gli host ammessi; smoke HTTP con cancellazione del record sintetico e nessun codice di recupero salvato su disco. Nessuna modifica alle regole cliniche aggiuntiva rispetto all'upgrade trasferito.

- Backup Git verificato e archivio ZIP delle sorgenti precedenti creato prima del trasferimento.
- npm run verify: 33 test superati, inclusa regressione sulla porta locale e mantenimento dei vincoli Origin in produzione.
- npm run build: superato.
- HTTP smoke sul server master: superato (file privati non accessibili, metodi API, consenso obbligatorio, ricevuta monouso, recupero completo e cancellazione).
- HTML servito dalla porta 4284: fascia gialla assente, un solo pulsante Termina sessione, disclaimer medico e messaggio 112/118 presenti.
- Scansione delle firme comuni di chiavi private, token GitHub e chiavi Google nei candidati Git e in dist: nessuna corrispondenza. Non costituisce un audit completo dei segreti.
- File .env e dist esclusi dai candidati Git.
- Test con servizi reali e database cloud non eseguiti in questa copia; nessun dato reale trasferito. Verifica visiva desktop/mobile non ripetuta in questa integrazione.

Questi controlli verificano l'integrazione tecnica locale, non costituiscono una validazione clinica indipendente o un'approvazione legale dei documenti trasferiti.
