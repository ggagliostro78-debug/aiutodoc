# CARDIO_04 - correzione crisi ipertensiva sintomatica

## Ambiente e vincoli

- Data run: `2026-07-09`
- Branch: `aiutodoc-clinical-validation`
- Commit base del branch al momento della correzione: `29e240f47acd1e6455694c746f2ba8d8a54d81af`
- Commit finale della correzione: commit corrente del branch `aiutodoc-clinical-validation` contenente questo report
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

La logica locale di rilevamento emergenze ora riconosce una pressione severa anche quando il valore non e immediatamente accanto alla parola `pressione`, per esempio:

`pressione piu volte oggi ed e circa 190/115`

Il blocco 112/118 o Pronto Soccorso scatta solo se la pressione severa e associata a sintomi d'allarme neurologici o cardiorespiratori, tra cui cefalea intensa, vista offuscata, confusione, dolore toracico, dispnea, sincope o peggioramento importante. L'ipertensione isolata senza questi sintomi non viene trasformata automaticamente in emergenza.

## Risultato CARDIO_04

| Campo | Valore |
|---|---|
| Caso | `CARDIO_04_IPERTENSIONE_SEVERA_CON_SINTOMI` |
| Esito clinico | `PASS CLINICO-FUNZIONALE` |
| Esito Playwright | `PASS` |
| Branca | `Emergenza cardiovascolare / emergenza medica` |
| Specialista/output operativo | `Emergenza cardiovascolare / Pronto Soccorso` |
| Area specialistica piu adatta | `Crisi ipertensiva sintomatica / possibile emergenza ipertensiva` |
| Urgenza ottenuta | `Contatta subito il 112/118 o recati al Pronto Soccorso` |
| Red flag ottenute | pressione arteriosa `190/115`; cefalea intensa; vista offuscata; confusione; terapia antipertensiva riferita come inefficace |
| Durata `/api/gemini` | n/a: blocco locale di emergenza strutturato completo, Gemini non necessario |
| Status HTTP `/api/gemini` | n/a |

## Sicurezza medico-legale

- Non viene formulata diagnosi certa di ictus, infarto o emergenza ipertensiva.
- Non vengono prescritti farmaci.
- Non viene suggerita modifica autonoma della terapia antipertensiva.
- Il contatto MMG non sostituisce l'indicazione immediata a 112/118 o Pronto Soccorso.
- Il messaggio resta un avviso prudenziale di orientamento, separato dal disclaimer generico.

## Verifiche eseguite

- `npm run check`: PASS
- `npm run build`: PASS
- Staging locale riavviato su `http://127.0.0.1:4273`
- Playwright: solo `CARDIO_04_IPERTENSIONE_SEVERA_CON_SINTOMI`, solo `chromium-desktop`, PASS in `28.8s`

## Artefatti

- `artifacts/raw-output/staging-chromium-desktop-CARDIO_04_IPERTENSIONE_SEVERA_CON_SINTOMI.json`
- `artifacts/playwright-results.json`

## Conclusione

Il criterio di successo e raggiunto: CARDIO_04 e ora `PASS CLINICO-FUNZIONALE` con indicazione esplicita `112/118` o `Pronto Soccorso`, output strutturato completo e nessuna modifica a main, produzione, CSS, grafica, layout o UX.
