# Audit validazione mobile

Data: 2026-07-17  
Ambiente: staging locale, Chromium con emulazione dispositivo, Gemini reale, nessun mock clinico.

## Esito clinico-funzionale

**22/22 esecuzioni PASS** su 21 casi unici. Quindici percorsi ordinari hanno ricevuto Gemini HTTP 200; sette bypass non hanno chiamato Gemini. Ricerca specialisti esterna: zero chiamate.

| Viewport | Casi | PASS | FAIL clinico-funzionali |
|---|---:|---:|---:|
| iPhone 13 equivalente | 6 | 6 | 0 |
| iPhone SE | 6 | 6 | 0 |
| Pixel 7 | 5 | 5 | 0 |
| Android compatto / Galaxy S20-Pixel 5 equivalente | 5 | 5 | 0 |

Copertura: 10 input lunghi, 18 input con negazioni, 12 input con valori numerici, 22 flussi con screenshot full-page, 7 messaggi urgenti. Due prove portrait-landscape-portrait (iPhone 13 e Pixel 7) hanno preservato input e questionario senza overflow orizzontale. PED_02 e la coda pediatrica sono PASS.

## Evidenze UX

Per ciascun viewport sono presenti screenshot di home, consensi, menu, questionario, coda pediatrica, output ordinario e output urgente. Sono presenti inoltre landscape iOS e Android. Il campione visivo conferma testi urgenti leggibili, controlli e campi nel viewport, assenza di sovrapposizioni cliniche e assenza di overflow orizzontale evidente.

## Difetto bloccante

**FAIL UX mobile su 4/4 viewport:** dopo l'apertura del menu hamburger, il pannello `.main-nav.open` intercetta gli eventi puntatore e rende non cliccabile il controllo `#menu-toggle` visualizzato come “Chiudi”. Playwright ha riprodotto il timeout su iPhone 13, iPhone SE, Pixel 7 e Android compatto. La raccolta successiva è proseguita con reload solo per acquisire le restanti evidenze; ciò non costituisce PASS della chiusura menu.

Il comportamento non è stato introdotto dai commit clinici oggetto del confronto: il diff committato del branch non modifica il codice o il CSS di apertura/chiusura menu. Nessun fix è stato applicato per rispettare il divieto di modifiche prodotto durante l'audit.

## Gate e rerun minimo

Gate mobile: **FAIL**, nonostante i 22 casi clinico-funzionali PASS, perché gli errori mobili bloccanti devono essere zero.

Rerun minimo dopo fix autorizzato:

1. apertura e chiusura hamburger su tutti e quattro i viewport;
2. portrait-landscape-portrait su iPhone 13 e Pixel 7 con input preservato;
3. un output ordinario e uno urgente per viewport (8 esecuzioni), più PED_02 su almeno iPhone 13;
4. controllo overflow, focus, scroll e pulsanti nel viewport.

Risultati: `artifacts/consolidated-mobile-results.json`. Screenshot: `artifacts/consolidated-mobile-screenshots/`.
