# Scelta iniziale e ricerca diretta - 14 settembre 2026

## Comportamento e file

- `index.html`, `src/style.css`: scelta fra orientamento guidato e ricerca immediata; modulo con branca medica e area geografica; invito finale alle domande anamnestiche. Il badge dei risultati resta leggibile anche su mobile.
- `src/direct_search.js`, `src/app_bootstrap.js`: gestione del percorso diretto separata dal triage. La ricerca diretta invia solo branca e zona, usa prima Google Places e passa alla ricerca web solo se Places non e configurato o fallisce.
- `server/places.js`: supporto a `searchMode: direct` con validazione della zona e tre query locali verso Google Places. La modalita guidata resta invariata.
- `server/specialist_search.js`: mantiene la ricerca web diretta come fallback, senza ampliamento nazionale automatico.
- `server/request_guard.js`: consente gli origin dei deploy preview Netlify del sito `aiutodoc`, mantenendo bloccati domini esterni e branch deploy generici.
- `scripts/shared-api-env.cjs`, `scripts/dev-local.js`, `.env.example`: il server locale puo riusare, solo in sviluppo, le chiavi API gia configurate in un altro `.env` AIutoDoc. L'import e limitato a chiavi Google/SerpApi/Gemini e non importa database, service account, retention, origin o flag di attivazione.
- `tests/direct-search.test.cjs`, `tests/shared-api-env.test.cjs`, `tests/local-origin.test.cjs`: regressioni per ordine dei provider, minimizzazione dei dati, validazione input, fallback, servizi non configurati, caricamento selettivo delle chiavi API condivise e origin Netlify preview.

## Impatto e rischi

La scorciatoia consente all'utente che conosce gia la branca di cercare specialisti e strutture nell'area indicata. La branca selezionata non e presentata come raccomandazione medica; AIutoDoc propone poi il percorso anamnestico per verificare meglio l'appropriatezza della scelta. Avvisi medici, emergenze, consensi e percorso guidato rimangono presenti.

Al provider vengono trasmesse solo branca e area geografica. Non sono stati aggiunti nuovi dati persistenti, nuove dipendenze, nuovi fornitori, eventi analytics, collezioni database o modifiche a Firestore. I risultati derivano da fonti pubbliche e restano da verificare su indirizzo, branca, disponibilita e canali ufficiali.

## Verifiche

- `npm run verify`: superato, 48 test.
- `npm run build`: superato; `dist` rigenerata dalle sorgenti.
- `git diff --check`: superato.
- Browser locale con API reali gia configurate in `AIutoDoc_main`: ricerca "Ortopedia e traumatologia" + "milano" restituisce 20 schede pubbliche da Google Places e mostra l'invito "Inizia le domande di orientamento".
- Desktop 1280x900 e mobile 390x844: modulo, risultati e invito verificati; nessun overflow orizzontale.
- Scansione file tracciati e `dist`: nessuna chiave API reale o service account copiati nei sorgenti pubblicabili.
- Netlify deploy preview: pubblicato da PR draft su branch `codex/aiutodoc-direct-search`, separato da `main`.

Limiti: la ricerca Places puo includere strutture limitrofe o schede non perfette perche dipende da dati pubblici del provider. Nessuna validazione clinica o ranking sanitario dei professionisti. Nessun deploy production eseguito in questa revisione.
