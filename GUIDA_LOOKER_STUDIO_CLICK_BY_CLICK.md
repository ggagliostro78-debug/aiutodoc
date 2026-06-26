# Guida Looker Studio Click By Click

Questa guida ti accompagna passo passo per creare la dashboard di `aiutodoc.it`.

## 1. Apri Looker Studio

1. Vai su [Looker Studio](https://lookerstudio.google.com/).
2. Accedi con lo stesso account Google che usa `GA4` e `Search Console`.
3. Clicca `Crea`.
4. Clicca `Report`.

## 2. Collega Google Analytics 4

1. Nella finestra `Aggiungi dati al report`, scegli `Google Analytics`.
2. Cerca la proprietà `AIutoDoc`.
3. Seleziona la proprietà `AIutoDoc`.
4. Seleziona la vista dati web corretta.
5. Clicca `Aggiungi`.
6. Conferma con `Aggiungi al report`.

## 3. Collega Search Console Site Impression

1. In alto clicca `Risorsa`.
2. Clicca `Gestisci origini dati aggiunte`.
3. Clicca `Aggiungi un'origine dati`.
4. Scegli `Search Console`.
5. Seleziona il sito `https://aiutodoc.it/`.
6. Scegli `Site Impression`.
7. Clicca `Aggiungi`.
8. Clicca `Aggiungi al report`.

## 4. Collega Search Console URL Impression

1. Ripeti `Risorsa > Gestisci origini dati aggiunte > Aggiungi un'origine dati`.
2. Scegli di nuovo `Search Console`.
3. Seleziona `https://aiutodoc.it/`.
4. Scegli `URL Impression`.
5. Clicca `Aggiungi`.
6. Clicca `Aggiungi al report`.

## 5. Inserisci il controllo data globale

1. Nel menu in alto clicca `Aggiungi un controllo`.
2. Scegli `Controllo intervallo date`.
3. Disegnalo in alto a destra.
4. Nelle proprietà a destra imposta:
   - intervallo predefinito: `Ultimi 28 giorni`
   - confronto: `Periodo precedente`

## 6. Crea le scorecard principali GA4

Per ogni metrica:

1. Clicca `Aggiungi un grafico`.
2. Scegli `Scheda punteggio`.
3. Disegnala nella prima riga.
4. Nelle proprietà a destra seleziona origine dati `Google Analytics`.
5. Imposta la metrica richiesta.

Crea queste schede:

1. `Utenti attivi`
2. `Sessioni`
3. `Conteggio eventi`
4. `Sessioni con coinvolgimento`
5. `Tasso di coinvolgimento`
6. `Durata media del coinvolgimento`

## 7. Crea le scorecard SEO Search Console

Ripeti lo stesso procedimento, ma usa l'origine dati `Search Console Site Impression`.

Crea queste schede:

1. `Site Clicks`
2. `Site Impressions`
3. `Site CTR`
4. `Site Average Position`

## 8. Crea il grafico andamento traffico

1. Clicca `Aggiungi un grafico`.
2. Scegli `Serie temporale`.
3. Disegnala sotto le scorecard.
4. Origine dati: `Google Analytics`.
5. Dimensione: `Data`.
6. Metrica primaria: `Sessioni`.
7. Aggiungi come seconda metrica: `Utenti attivi`.

## 9. Crea la tabella acquisizione canali

1. Clicca `Aggiungi un grafico`.
2. Scegli `Tabella`.
3. Disegnala sotto il grafico temporale.
4. Origine dati: `Google Analytics`.
5. Dimensione: `Gruppo di canali principale della sessione`.
6. Metriche:
   - `Sessioni`
   - `Utenti attivi`
   - `Sessioni con coinvolgimento`
   - `Tasso di coinvolgimento`
   - `Eventi chiave`

## 10. Crea la tabella sorgente / mezzo

1. Duplica la tabella precedente.
2. Cambia la dimensione in `Sorgente / mezzo sessione`.
3. Mantieni queste metriche:
   - `Sessioni`
   - `Utenti attivi`
   - `Conteggio eventi`
   - `Eventi chiave`

## 11. Crea la tabella landing page

1. Aggiungi una nuova `Tabella`.
2. Origine dati: `Google Analytics`.
3. Dimensione: `Pagina di destinazione + stringa di query`.
4. Metriche:
   - `Sessioni`
   - `Utenti attivi`
   - `Tasso di coinvolgimento`
   - `Eventi chiave`

## 12. Crea la tabella pagine più viste

1. Aggiungi una nuova `Tabella`.
2. Origine dati: `Google Analytics`.
3. Dimensione: `Titolo pagina e classe schermata`.
4. Metriche:
   - `Visualizzazioni`
   - `Utenti attivi`
   - `Durata media del coinvolgimento per utente attivo`
   - `Conteggio eventi`

## 13. Crea la tabella eventi

1. Aggiungi una nuova `Tabella`.
2. Origine dati: `Google Analytics`.
3. Dimensione: `Nome evento`.
4. Metriche:
   - `Conteggio eventi`
   - `Utenti totali`

## 14. Filtra la tabella eventi sui soli eventi utili

1. Seleziona la tabella eventi.
2. Nel pannello a destra clicca `Filtro`.
3. Clicca `Aggiungi un filtro`.
4. Clicca `Crea un filtro`.
5. Nome filtro: `Eventi AIutoDoc`.
6. Includi `Nome evento`.
7. Usa `RegExp Match`.
8. Inserisci questa espressione:

```text
triage_started|triage_completed|specialist_search_result_shown|recovery_requested|recovery_success|recovery_failed|recovery_code_generated|nav_page_open|mailto_click|pwa_install_prompt_available|pwa_install_button_click|pwa_install_prompt_choice|pwa_app_installed
```

9. Salva.

## 15. Crea il grafico SEO nel tempo

1. Aggiungi una `Serie temporale`.
2. Origine dati: `Search Console URL Impression`.
3. Dimensione: `Date`.
4. Metriche:
   - `URL Clicks`
   - `URL Impressions`

## 16. Crea la tabella query SEO

1. Aggiungi una `Tabella`.
2. Origine dati: `Search Console Site Impression`.
3. Dimensione: `Query`.
4. Metriche:
   - `Site Clicks`
   - `Site Impressions`
   - `Site CTR`
   - `Site Average Position`

## 17. Crea la tabella pagine SEO

1. Aggiungi una `Tabella`.
2. Origine dati: `Search Console URL Impression`.
3. Dimensione: `Landing Page`.
4. Metriche:
   - `URL Clicks`
   - `URL Impressions`
   - `URL CTR`
   - `URL Average Position`

## 18. Aggiungi filtri utili

1. Clicca `Aggiungi un controllo`.
2. Scegli `Elenco a discesa`.
3. Crea questi controlli:
   - `Dispositivo`
   - `Gruppo di canali principale della sessione`
   - `Titolo pagina e classe schermata`

## 19. Dai un ordine visivo semplice

Riga 1:
- scorecard traffico
- scorecard SEO

Riga 2:
- serie temporale sessioni
- serie temporale SEO

Riga 3:
- tabella canali
- tabella sorgente/mezzo

Riga 4:
- tabella landing page
- tabella pagine

Riga 5:
- tabella eventi
- tabella query SEO

Riga 6:
- tabella pagine SEO

## 20. Controllo finale

Dopo aver creato la dashboard:

1. cambia data su `Ultimi 7 giorni`
2. verifica che compaiano eventi AIutoDoc
3. verifica che non compaia `beforeinstallprompt / (not set)` nei dati di acquisizione
4. verifica che `triage_completed` compaia nella tabella eventi
5. verifica che Search Console mostri query e pagine

## 21. Nome consigliato della dashboard

Usa questo nome:

`AIutoDoc - Traffic, SEO & Funnel`

