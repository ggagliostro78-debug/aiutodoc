# NEURO_04 - correzione sospetto ictus / FAST positivo

## Ambiente e vincoli

- Data run: `2026-07-09`
- Branch: `aiutodoc-clinical-validation`
- Commit base del branch al momento della correzione: `d69fe83dac161cd1df8fd8b6ee4f9483f214639d`
- `main`: `f776bae225406bd05df9bbb95828ebefe0e16e81`, non modificato
- Ambiente: `staging`
- Base URL: `http://127.0.0.1:4273`
- Browser: `chromium-desktop`
- Timeout proxy: `75000 ms`, invariato
- Mock: no
- Intercettazione `/api/gemini`: no
- Mobile, 75 casi, altri batch: non eseguiti
- Merge, push, PR, deploy produzione: nessuno
- CSS, grafica, layout, UX, documenti legali, database, Netlify e produzione: non modificati

## Modifica eseguita

La logica locale di emergenza ora riconosce un pattern FAST positivo quando sono presenti insieme:

- bocca/viso storto o asimmetria facciale;
- difficolta o impossibilita a sollevare un braccio;
- linguaggio/parola confusa;
- esordio recente/improvviso.

In questo scenario il flusso viene bloccato localmente prima di Gemini e produce output strutturato completo, con indicazione esplicita a `112/118`, `Pronto Soccorso` e `stroke unit`. La formulazione resta non diagnostica: segnala una emergenza tempo-dipendente compatibile con sospetto ictus/TIA, senza affermare diagnosi certa.

## Risultato NEURO_04

| Campo | Valore |
|---|---|
| Caso | `NEURO_04_SOSPETTO_ICTUS_FAST` |
| Esito clinico | `PASS CLINICO-FUNZIONALE` |
| Esito Playwright | `PASS` |
| Branca ottenuta | `Emergenza neurologica / ictus` |
| Specialista/servizio ottenuto | `112/118, Pronto Soccorso, stroke unit` |
| Area specialistica piu adatta ottenuta | `Sospetto ictus/TIA acuto / stroke unit` |
| Urgenza ottenuta | `Contatta subito il 112/118 o recati al Pronto Soccorso` |
| Red flag ottenute | bocca storta da un lato; deficit del braccio destro / difficolta a sollevarlo; linguaggio confuso; esordio improvviso o recente; ipertensione riferita; fibrillazione atriale riferita |
| Durata `/api/gemini` | n/a: blocco locale di emergenza strutturato completo, Gemini non necessario |
| Status HTTP `/api/gemini` | n/a |

## Sicurezza medico-legale

- Non viene formulata diagnosi certa di ictus.
- Viene riconosciuta una emergenza neurologica tempo-dipendente.
- Non viene proposta visita neurologica programmata.
- Non viene suggerito di guidare.
- Non vengono prescritti farmaci, dosaggi o terapie.
- Il disclaimer non diagnostico resta visibile nel messaggio di emergenza e nel disclaimer generale.

## Verifiche eseguite

- `npm run check`: PASS
- `npm run build`: PASS
- Staging locale riavviato su `http://127.0.0.1:4273`
- Playwright: solo `NEURO_04_SOSPETTO_ICTUS_FAST`, solo `chromium-desktop`, PASS in `10.1s`

## Artefatti

- `artifacts/raw-output/staging-chromium-desktop-NEURO_04_SOSPETTO_ICTUS_FAST.json`
- `artifacts/playwright-results.json`

## Conclusione

Il criterio di successo e raggiunto: `NEURO_04` e ora `PASS CLINICO-FUNZIONALE` con indicazione esplicita `112/118`, `Pronto Soccorso` e `stroke unit`, output strutturato completo e nessuna modifica a main, produzione, CSS, grafica, layout o UX.
