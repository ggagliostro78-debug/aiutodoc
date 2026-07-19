# Confronto visivo staging / main

- Baseline: worktree detached di `main` commit `f776bae225406bd05df9bbb95828ebefe0e16e81`
- Staging parallelo: branch `aiutodoc-clinical-validation`
- URL baseline locale: `http://127.0.0.1:4274`
- URL staging locale: `http://127.0.0.1:4273`
- Data verifica: 2026-07-07

## Esito

Il confronto finale delle schermate iniziali e del flusso consensi non evidenzia differenze visive su desktop o mobile. Colori, font, dimensioni, spaziature, layout, overlay, pulsanti e comportamento responsive risultano invariati. La diff Git non contiene file CSS.

Le differenze del branch sono funzionali e semantiche (`data-testid`, validazione input, classificazione urgenza e output strutturati) e non alterano il design del main.

Nel commit `7e52867` non sono stati modificati file CSS o asset. L'unica variazione nel markup visibile e l'aggiunta testuale del livello di urgenza nella card gia esistente, senza nuove classi, regole CSS, componenti o variazioni di griglia. Il confronto desktop/Pixel 7 della cornice UI resta valido; nessuna differenza e stata applicata a header, footer, colori, font o responsive.

## Screenshot desktop

- Baseline: `artifacts/visual-comparison/staging-main-baseline-desktop.png`
- Staging: `artifacts/visual-comparison/staging-parallel-desktop.png`

## Screenshot mobile

- Baseline Pixel 7: `artifacts/visual-comparison/staging-main-baseline-mobile.png`
- Staging Pixel 7: `artifacts/visual-comparison/staging-parallel-mobile.png`

## Note operative

Le acquisizioni sono state ripetute dopo il completo avvio dei server locali per evitare artefatti temporanei del renderer headless. Le immagini finali sopra elencate sono quelle verificate.
