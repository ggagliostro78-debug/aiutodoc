# Root cause menu mobile

Data: 2026-07-17

## Riproduzione pre-fix

Il difetto è stato riprodotto sullo staging locale `http://127.0.0.1:4273`, con Chromium ed emulazione dei quattro viewport. Dopo i consensi, il menu si apre, `.main-nav` riceve la classe `open`, `body` riceve `menu-open` e `aria-expanded` passa correttamente da `false` a `true`. Il secondo click sul pulsante scade perché il pannello intercetta gli eventi.

| Viewport | Dimensione osservata | Toggle | Nav aperta | Hit test al centro toggle | Chiusura pointer |
|---|---:|---|---|---|---:|
| iPhone 13 equivalente | 390×664 | `position:absolute; z-index:1200` | `position:fixed; z-index:2000; pointer-events:auto` | `nav.main-nav.open` | FAIL |
| iPhone SE | 320×568 | `position:absolute; z-index:1200` | `position:fixed; z-index:2000; pointer-events:auto` | `nav.main-nav.open` | FAIL |
| Pixel 7 | 412×839 | `position:absolute; z-index:1200` | `position:fixed; z-index:2000; pointer-events:auto` | `nav.main-nav.open` | FAIL |
| Android compatto | 320×658 | `position:absolute; z-index:1200` | `position:fixed; z-index:2000; pointer-events:auto` | `nav.main-nav.open` | FAIL |

## Analisi

- **Stacking context e z-index:** `#menu-toggle` e `.main-nav` sono fratelli nella stessa `banner-wrapper`; il toggle ha `z-index:1200`, la nav `z-index:2000`. La nav viene dipinta sopra il toggle.
- **Position:** il toggle è assoluto nel banner; la nav è fissa con `inset:0`, `width:100vw` e altezza pari al viewport.
- **Pointer events e overlay:** la nav aperta mantiene `pointer-events:auto` e copre l'intero viewport. `document.elementFromPoint()` al centro visivo del toggle restituisce la nav, non il button.
- **Dimensione pannello:** il pannello occupa integralmente 320–412 px di larghezza e 568–839 px di altezza nelle quattro emulazioni.
- **DOM:** il toggle precede immediatamente la nav. L'ordine DOM non è la causa primaria perché entrambi hanno uno `z-index` esplicito e differente.
- **Classe `.open`:** la gestione JavaScript è coerente; aggiunge/rimuove la classe e sincronizza `body.menu-open`.
- **ARIA:** `aria-expanded` viene sincronizzato correttamente. L'`aria-label` resta però staticamente “Apri il menu di navigazione” anche quando il testo diventa “Chiudi”; è una lacuna accessibile secondaria da correggere nel fix minimo.
- **Focus:** dopo l'apertura il focus resta sul toggle. Il problema è di hit-testing pointer, non di perdita del focus.
- **Tastiera:** l'attivazione nativa del button può raggiungere l'handler quando il focus è già sul controllo; non esiste una gestione esplicita di `Escape`.
- **Click esterno:** esiste un listener documentale, ma la nav a tutto schermo contiene ogni punto disponibile; il click sullo sfondo della nav è considerato interno e non chiude il menu.
- **Resize/rotazione:** il resize chiude esplicitamente il menu soltanto sopra 950 px. Sotto la breakpoint, la nav resta full-screen e la collisione di stacking persiste in portrait e landscape.
- **Overflow/scroll:** `body.menu-open` blocca lo scroll della pagina e la nav usa `overflow-y:auto`; il comportamento è intenzionale e non è la causa del difetto.

## Root cause

La causa primaria è la precedenza di stacking della nav (`2000`) sul toggle (`1200`) mentre la nav occupa tutto il viewport e intercetta gli eventi pointer. Il controllo resta visivamente riconoscibile come “Chiudi” ma non è il target del click.

## Fix minimo previsto

1. elevare il toggle sopra la nav soltanto nelle media query mobile;
2. sincronizzare anche l'`aria-label` con lo stato;
3. supportare `Escape` e rendere effettiva la chiusura sullo sfondo della nav, ripristinando il focus al toggle;
4. non modificare file clinici, routing, bypass, prompt, Gemini, post-processing o validatore.

L'evidenza raw della prima esecuzione infrastrutturale non valida (WebKit non installato e modale consensi ancora aperta) è conservata separatamente; la misurazione riportata qui deriva dal rerun corretto 4/4 PASS della prova di riproduzione attesa.
