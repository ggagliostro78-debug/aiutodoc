# PSY_01 - correzione urgenza attacchi di panico/ansia ricorrente stabile

## Ambiente e vincoli

- Data run: `2026-07-09`
- Branch: `aiutodoc-clinical-validation`
- Commit base del branch al momento della correzione: `17e49f303c530246cba9408d613d2a97932e63b5`
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

La normalizzazione clinico-funzionale post-Gemini ora riconosce il contesto stabile di ansia/attacchi di panico ricorrenti quando sono presenti episodi brevi che passano, ricorrenza da settimane/mesi e assenza esplicita di dolore toracico persistente, svenimenti, grave difficolta respiratoria e pensieri autolesivi.

In questo scenario l'urgenza viene mantenuta bassa/programmata. L'escalation a 112/118 o Pronto Soccorso resta solo condizionale se compaiono dolore toracico persistente, difficolta respiratoria grave, svenimento, confusione, rischio autolesivo/suicidario o peggioramento improvviso.

## Risultato PSY_01

| Campo | Valore |
|---|---|
| Caso | `PSY_01_ATTACCHI_PANICO_NON_URGENTE` |
| Esito clinico | `PASS CLINICO-FUNZIONALE` |
| Esito Playwright | `PASS` |
| Branca ottenuta | `Psicologia / Psichiatria` |
| Specialista ottenuto | `Psicologo o Psicoterapeuta; Psichiatra se sintomi frequenti, invalidanti o per valutazione farmacologica` |
| Area specialistica piu adatta ottenuta | `Ansia / attacchi di panico / disturbi d'ansia` |
| Urgenza ottenuta | `Urgenza bassa / visita psicologica o psichiatrica programmata` |
| Red flag ottenute | ansia intensa ricorrente; tachicardia/battito accelerato; tremori; sudorazione; paura di perdere il controllo; assenza dolore toracico persistente; assenza svenimenti; assenza difficolta respiratoria grave; assenza ideazione autolesiva |
| Durata `/api/gemini` | `10551.245 ms`, HTTP `200` |

## Sicurezza medico-legale

- Nessun 112/PS automatico.
- Nessuna diagnosi certa di disturbo di panico.
- Nessuna prescrizione di ansiolitici o altri farmaci.
- Escalation 112/118 o PS solo condizionale a red flag cardiopolmonari, confusione, rischio autolesivo/suicidario o peggioramento improvviso.
- Disclaimer medico e non sostituzione della visita restano visibili.

## Verifiche eseguite

- `npm run check`: PASS
- `npm run build`: PASS
- Staging locale riavviato su `http://127.0.0.1:4273`
- Playwright: solo `PSY_01_ATTACCHI_PANICO_NON_URGENTE`, solo `chromium-desktop`, PASS in `1.3m`

## Artefatti

- `artifacts/raw-output/staging-chromium-desktop-PSY_01_ATTACCHI_PANICO_NON_URGENTE.json`
- `artifacts/playwright-results.json`

## Conclusione

Il criterio di successo e raggiunto: `PSY_01` e ora `PASS CLINICO-FUNZIONALE` con urgenza bassa/programmata e nessun falso 112/PS. Main, produzione, CSS, grafica, layout e UX non sono stati modificati.
