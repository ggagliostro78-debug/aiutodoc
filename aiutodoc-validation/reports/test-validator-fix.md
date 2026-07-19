# Correzione validatore CELIACHIA_02

## Esito

**PASS Playwright** sul raw output reale gia salvato.

- Test: `validatore sinonimi crescita - CELIACHIA_02 raw salvato`
- Browser project: `chromium-desktop`
- Durata test: `37 ms`
- Risultato: `1 passed`
- Chiamate Gemini: `0`
- Mock/intercettazioni: nessuno

## Correzione

Il validatore usa ora un insieme chiuso di equivalenze controllate per il concetto canonico `crescita rallentata`:

- `crescita rallentata`;
- `rallentamento della crescita`;
- `cresce poco`.

Le altre verifiche continuano a usare il matching normalizzato esistente. Non sono state introdotte equivalenze generiche o similarita semantiche libere.

## Rigidita clinica

Il criterio continua a richiedere almeno una delle tre formule esplicite relative alla scarsa crescita. Un controllo negativo con il testo `Stanchezza cronica e dolore addominale ricorrente`, privo di riferimenti alla crescita, restituisce correttamente `false`.

Il raw reale CELIACHIA_02 contiene `Rallentamento della crescita` e viene quindi riconosciuto come equivalente controllato di `crescita rallentata`.

## Ambito delle modifiche

- Nessuna modifica al motore clinico AiutoDoc.
- Nessuna modifica al prompt clinico.
- Nessuna modifica a proxy Gemini, timeout, API o output applicativo.
- Nessuna modifica a CSS, grafica o UX.
- Nessuna modifica a `main`.
- Nessun merge, push o deploy produzione.
- Nessuna nuova esecuzione clinica o chiamata Gemini.

Sono stati modificati soltanto il matcher testuale della suite, il test clinico esistente e un test offline di regressione sul raw salvato.

## Artefatto

- `artifacts/playwright-results.json`

