# Dashboard AIutoDoc in Looker Studio

Questa guida serve per costruire una dashboard unica per `aiutodoc.it` usando:

- `Google Analytics 4`
- `Google Search Console`

Obiettivo: vedere in una sola schermata traffico, SEO, comportamento sulle pagine e risultati della piattaforma.

## 1. Fonti dati da collegare

In Looker Studio crea un nuovo report e collega queste 3 fonti:

1. `Google Analytics`
   - Proprietà: `AIutoDoc`
   - Property ID visto in GA4: `528959606`

2. `Search Console - Site Impression`
   - Dominio/sito: `https://aiutodoc.it/`
   - Serve per query, click, impression, CTR, posizione media

3. `Search Console - URL Impression`
   - Dominio/sito: `https://aiutodoc.it/`
   - Serve per performance delle singole pagine SEO

## 2. Cosa è già tracciato nel progetto

Dall'implementazione attuale risultano già presenti questi eventi GA4:

- `triage_started`
- `triage_completed`
- `specialist_search_result_shown`
- `recovery_requested`
- `recovery_success`
- `recovery_failed`
- `recovery_code_generated`
- `nav_page_open`
- `mailto_click`
- `pwa_install_prompt_available`
- `pwa_install_button_click`
- `pwa_install_prompt_choice`
- `pwa_app_installed`

Pagine chiave già presenti e utili da monitorare:

- `/`
- `/chi-siamo/`
- `/per-gli-specialisti/`
- `/glossario/`
- `/specializzazioni/`
- `/recupera-ricerca/`

Titoli rilevati nel codice:

- `AIutoDoc.it - Prenderti cura di te non è mai stato così semplice`
- `Chi Siamo | AIutoDoc.it`
- `Per gli specialisti | AIutoDoc.it`
- `Breve Glossario Medico | AIutoDoc.it`
- `Specializzazioni | AIutoDoc.it`
- `Recupera ricerca | AIutoDoc.it`

## 3. Struttura consigliata della dashboard

Costruisci la dashboard in 4 sezioni.

### Sezione A. Executive overview

Inserisci 8 scorecard GA4:

- `Utenti attivi`
- `Nuovi utenti`
- `Sessioni`
- `Visualizzazioni`
- `Sessioni con coinvolgimento`
- `Tasso di coinvolgimento`
- `Durata media del coinvolgimento`
- `Conteggio eventi`

Inserisci 4 scorecard Search Console:

- `Click`
- `Impression`
- `CTR`
- `Posizione media`

Filtro data globale consigliato:

- `Ultimi 28 giorni`

Confronto consigliato:

- `Periodo precedente`

### Sezione B. Acquisizione traffico

Grafici consigliati da GA4:

1. Serie temporale
   - Dimensione: `Data`
   - Metriche: `Sessioni`, `Utenti attivi`

2. Tabella canali
   - Dimensione: `Gruppo di canali principale della sessione`
   - Metriche:
     - `Sessioni`
     - `Utenti attivi`
     - `Sessioni con coinvolgimento`
     - `Tasso di coinvolgimento`
     - `Eventi chiave`

3. Tabella sorgente/mezzo
   - Dimensione: `Sorgente / mezzo sessione`
   - Metriche:
     - `Sessioni`
     - `Utenti attivi`
     - `Conteggio eventi`
     - `Eventi chiave`

4. Tabella landing page
   - Dimensione: `Pagina di destinazione + stringa di query`
   - Metriche:
     - `Sessioni`
     - `Utenti attivi`
     - `Tasso di coinvolgimento`
     - `Eventi chiave`

### Sezione C. Contenuti e comportamento

Grafici consigliati da GA4:

1. Tabella pagine
   - Dimensione: `Titolo pagina e classe schermata`
   - Metriche:
     - `Visualizzazioni`
     - `Utenti attivi`
     - `Visualizzazioni per utente attivo`
     - `Durata media del coinvolgimento per utente attivo`
     - `Conteggio eventi`

2. Tabella percorsi principali
   - Dimensione: `Percorso pagina + stringa di query`
   - Metriche:
     - `Visualizzazioni`
     - `Utenti attivi`
     - `Conteggio eventi`

3. Grafico eventi
   - Dimensione: `Nome evento`
   - Metriche:
     - `Conteggio eventi`
     - `Utenti totali`

Applica un filtro per tenere evidenti questi eventi:

- `triage_started`
- `triage_completed`
- `specialist_search_result_shown`
- `recovery_requested`
- `recovery_success`
- `recovery_failed`
- `recovery_code_generated`
- `nav_page_open`
- `mailto_click`
- `pwa_install_prompt_available`
- `pwa_install_button_click`
- `pwa_install_prompt_choice`
- `pwa_app_installed`

### Sezione D. SEO

Grafici consigliati da Search Console:

1. Serie temporale SEO
   - Dimensione: `Date`
   - Metriche:
     - `URL Clicks`
     - `URL Impressions`

2. Tabella query
   - Dimensione: `Query`
   - Metriche:
     - `Site Clicks`
     - `Site Impressions`
     - `Site CTR`
     - `Site Average Position`

3. Tabella pagine SEO
   - Dimensione: `Landing Page`
   - Metriche:
     - `URL Clicks`
     - `URL Impressions`
     - `URL CTR`
     - `URL Average Position`

4. Tabella paese
   - Dimensione: `Country`
   - Metriche:
     - `Site Clicks`
     - `Site Impressions`

## 4. Dashboard minimale pronta da copiare

Se vuoi farla velocemente, crea queste 10 visualizzazioni in quest'ordine:

1. Scorecard `Utenti attivi`
2. Scorecard `Sessioni`
3. Scorecard `Conteggio eventi`
4. Scorecard `Click da Search Console`
5. Serie temporale `Sessioni`
6. Tabella `Gruppo di canali principale della sessione`
7. Tabella `Sorgente / mezzo sessione`
8. Tabella `Titolo pagina`
9. Tabella `Nome evento`
10. Tabella `Query SEO`

Con questa base hai già l'80% del controllo utile.

## 5. Filtri indispensabili

Per non sporcare la dashboard, aggiungi questi controlli:

- Controllo intervallo date
- Controllo dispositivo
- Controllo gruppo di canali
- Controllo pagina

E in GA4 configura questi filtri lato proprietà:

- esclusione traffico interno
- esclusione developer traffic

## 6. Segmenti consigliati

Crea questi confronti o filtri in Looker Studio:

- `Traffico organico`
- `Traffico diretto`
- `Mobile`
- `Desktop`
- `Pagine SEO`
- `Pagina recupera ricerca`

## 7. KPI settimanali da monitorare

Ogni settimana controlla:

- utenti attivi
- sessioni
- sessioni da organic
- sessioni da direct
- pagine più viste
- query SEO principali
- CTR SEO medio
- numero `triage_completed`

## 8. KPI mensili da monitorare

Ogni mese controlla:

- crescita utenti
- crescita click organici
- crescita impression SEO
- nuove pagine che generano traffico
- tasso di coinvolgimento delle pagine principali
- rapporto tra traffico totale e `triage_completed`

## 9. Formula business utile

Se vuoi una metrica operativa semplice, crea in Looker Studio un campo calcolato:

`Triage completion rate`

Formula concettuale:

`triage_completed / sessioni`

Nota: in Looker Studio questa metrica si costruisce bene se il conteggio dell'evento `triage_completed` è disponibile in una tabella o scorecard dedicata. In alternativa puoi tenerla come rapporto manuale iniziale.

## 10. Cosa manca ancora nel tracking attuale

Per una dashboard ancora più forte, suggerisco di aggiungere in seguito questi eventi:

- `specialist_contact_click`
- `glossary_term_open`
- `specialty_card_open`

Con questi eventi puoi misurare meglio il funnel reale:

1. arrivo sulla pagina
2. avvio orientamento
3. completamento orientamento
4. recupero ricerca
5. contatto o passo successivo

## 11. Layout consigliato

Pagina 1: `Executive`
- KPI principali
- andamento sessioni
- andamento click SEO

Pagina 2: `Acquisizione`
- canali
- sorgente/mezzo
- landing page

Pagina 3: `Contenuti`
- pagine
- eventi
- pagine specialistiche

Pagina 4: `SEO`
- query
- pagine SEO
- CTR
- posizione media

## 12. Verifica finale dopo la creazione

Controlla che:

- non compaiano sorgenti tecniche anomale
- `beforeinstallprompt / (not set)` non esista più nei report
- i dati Search Console e GA4 siano coerenti come trend, anche se non identici
- la pagina `/recupera-ricerca/` compaia nei contenuti se usata

## 13. Ordine operativo consigliato

1. crea il report Looker Studio
2. collega GA4
3. collega Search Console site impression
4. collega Search Console URL impression
5. inserisci scorecard principali
6. inserisci tabelle acquisizione
7. inserisci tabelle contenuti
8. inserisci tabelle SEO
9. applica filtri data e dispositivo
10. valida i numeri con GA4 e Search Console

## 14. Risultato atteso

Alla fine dovresti vedere in un colpo solo:

- quante persone arrivano su AIutoDoc
- da dove arrivano
- quali pagine funzionano
- quali query SEO portano traffico
- quante persone completano il percorso di orientamento
