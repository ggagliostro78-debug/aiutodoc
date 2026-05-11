# AiutoDoc - Documentazione di Progetto

## Descrizione della Piattaforma

AiutoDoc è una piattaforma digitale basata su Intelligenza Artificiale progettata per guidare il paziente verso lo specialista sanitario più appropriato attraverso un percorso di orientamento sanitario informativo. Il sistema svolge un triage orientativo non diagnostico.

## Obiettivo

Aiutare il paziente a individuare lo specialista più idoneo in base ai sintomi riferiti, senza fornire diagnosi, cure o suggerimenti medici.

## Flusso Operativo Attuale

### Fase 1 - Raccolta Dati Iniziali

All'inizio della conversazione il sistema richiede:

1. Sesso ed età del paziente
2. Zona geografica di riferimento, preferibilmente comune o provincia
3. Disturbo o sintomo principale

Il sistema consente anche l'opzione "Italia (Generale)" quando l'utente non desidera specificare la località.

### Fase 2 - Domande Conoscitive

Dopo l'acquisizione del sintomo principale, il sistema pone 3 domande conoscitive a risposta multipla per inquadrare:

- durata del disturbo
- modalità di insorgenza
- presenza di patologie note o terapie in corso

### Fase 3 - Domande Anamnestiche Mirate

Dopo la fase conoscitiva, il sistema pone 3 domande anamnestiche specifiche per la branca e per la sede del disturbo. Le domande vengono selezionate dinamicamente in base al testo inserito dall'utente.

Attualmente sono gestite anamnesi dedicate, tra le altre, per:

- occhi
- orecchio, naso e gola
- area dentale
- area urogenitale e pelvica
- gastroenterologia
- ginocchio
- spalla
- colonna e rachide
- piede e caviglia
- mano, polso e gomito
- anca e gamba
- neurologia
- reumatologia
- area psicologica
- area geriatrica

Quando il sintomo non ricade in una sottocategoria specifica, il sistema usa un set anamnestico generale coerente con la branca prevalente.

### Fase 4 - Sicurezza Sanitaria

Il sistema non deve mai:

- formulare diagnosi
- suggerire cure
- prescrivere farmaci
- sostituire il parere medico

Se emergono sintomi potenzialmente urgenti, il sistema mostra immediatamente il messaggio di emergenza:

> "In presenza di sintomi gravi o improvvisi contatta il 118 o recati immediatamente al Pronto Soccorso."

### Fase 5 - Analisi

Il sistema analizza le risposte del paziente e identifica l'area specialistica più compatibile, basandosi su conoscenze medico-scientifiche validate e su regole di classificazione interna.

- non viene mai indicata una diagnosi
- viene individuato esclusivamente lo specialista più idoneo

### Fase 6 - Risultato

Alla fine del percorso il sistema restituisce:

- sintesi anamnestica
- specialista indicato
- guida al comportamento e alla preparazione della visita
- nota informativa per il Medico di Medicina Generale
- elenco di 16 risultati sanitari

I risultati possono includere:

- professionisti privati
- centri medici
- cliniche
- ospedali

### Fase 7 - Persistenza e Recupero

Ogni triage completato genera un ID univoco che consente di recuperare la ricerca successivamente. I dati vengono salvati localmente e, quando disponibile, anche nel database cloud.

## Informazioni Mostrate per Ogni Risultato

Per ogni professionista o struttura il sistema può mostrare:

- nome struttura o medico
- specializzazione
- tipologia
- indirizzo o modalità di visita
- contatti
- nota informativa sintetica

## Comportamento Generale del Sistema

- linguaggio semplice e rassicurante
- focus esclusivo sull'indirizzamento corretto verso lo specialista
- nessuna interpretazione clinica definitiva
- nessuna sostituzione del medico curante
- forte attenzione alla pertinenza tra sintomo e anamnesi proposta

## Nota sullo Stato del Progetto

Questa documentazione descrive il comportamento attuale dell'applicazione e sostituisce le versioni precedenti non più allineate al codice.
