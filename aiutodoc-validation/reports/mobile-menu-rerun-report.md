# Rerun mirato dopo fix menu mobile

Data: 2026-07-17

## Menu e accessibilità

| Viewport | Pulsante | Backdrop | Escape | ARIA | Focus | Overlay | Overflow | Esito |
|---|---|---|---|---|---|---|---|---|
| iPhone 13 equivalente | PASS | PASS | PASS | PASS | PASS | 0 | 0 | PASS |
| iPhone SE | PASS | PASS | PASS | PASS | PASS | 0 | 0 | PASS |
| Pixel 7 | PASS | PASS | PASS | PASS | PASS | 0 | 0 | PASS |
| Android compatto | PASS | PASS | PASS | PASS | PASS | 0 | 0 | PASS |

Il menu è stato aperto, chiuso dal pulsante, riaperto e chiuso con `Escape`, quindi riaperto e chiuso dallo sfondo. `aria-expanded` e `aria-label` seguono lo stato; il focus torna al toggle. L'hit test sul toggle aperto restituisce il button e non più la nav.

## Rotazione

| Viewport | Portrait | Landscape | Ritorno portrait | Input | Stato questionario | Overflow | Esito |
|---|---|---|---|---|---|---|---|
| iPhone 13 equivalente | PASS | PASS | PASS | preservato | preservato | 0 | PASS |
| Pixel 7 | PASS | PASS | PASS | preservato | preservato | 0 | PASS |

Il menu è stato aperto e chiuso in ogni orientamento. Nessuna perdita di input o blocco del questionario.

## Otto casi mobile

| Viewport | Ordinario | Bypass | Esito |
|---|---|---|---|
| iPhone 13 | `PED_02_FEBBRE_BAMBINO_PROGRAMMATA` | `PED_01_URGENTE_DIFFICOLTA_RESPIRATORIA` | 2/2 PASS |
| iPhone SE | `OCUL_05_NEGATIVO_AFFATICAMENTO_SCHERMI` | `OCUL_01_URGENTE_PERDITA_VISIVA_IMPROVVISA` | 2/2 PASS |
| Pixel 7 | `PED_05_NEGATIVO_STANCHEZZA_DOPO_SPORT` | `PNEUMO_01_URGENTE_DISPNEA` | 2/2 PASS |
| Android compatto | `PNEUMO_05_NEGATIVO_FIATO_CORTO_POST_SFORZO` | `GASTRO_02_MELENA_CAPOGIRI_URGENTE` | 2/2 PASS |

Totale 8/8 PASS: quattro ordinari con Gemini reale HTTP 200 e quattro bypass con zero chiamate Gemini. Ricerca specialisti esterna 0; route di ricerca e persistenza neutralizzate soltanto nel runner. Falsi positivi urgenti 0, falsi negativi 0, diagnosi/sospetti impropri 0, prescrizioni/dosaggi 0, casi con errori console 0.

`PED_05` ha richiesto un rerun minimo dopo una scelta contraddittoria del runner (`C`, sintomi ancora presenti) non coerente con l'input. È stata corretta soltanto la selezione del runner; il prodotto non è stato modificato. Il caso finale è PASS.

## PED_02

PASS su iPhone 13 e nello smoke desktop. Acquisiti 7 anni, 24 kg e 125 cm; completata la coda e ottenuto Gemini HTTP 200. Output pediatrico programmato, senza escalation impropria, diagnosi o prescrizioni.

## Smoke desktop

3/3 PASS: home e consensi, navigazione desktop, PED_02 ordinario con output lungo e Gemini 200, perdita visiva improvvisa con bypass e zero Gemini. Console senza errori e layout desktop invariato.

## Controlli statici

- `npm run check`: PASS.
- `npm run build`: PASS.
- `npm run test:validator`: 12/12 PASS.
- JSON rerun: 10/10 validi al controllo.
- Scan anti-segreti: 0 file; `.env` assente da `dist`.
- `git diff --check`: nessun nuovo errore; restano le due righe con trailing whitespace preesistenti in `clinical-functional-report.md`.

Risultati: `artifacts/mobile-menu-rerun-results.json`; raw: `artifacts/mobile-menu-fix-raw/`; screenshot: `artifacts/mobile-menu-fix-screenshots/after/`.
