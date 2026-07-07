# ANEMIA_01 - correzione clinico-funzionale

## Esito

**PASS CLINICO-FUNZIONALE** su output reale Gemini.

- Environment: `staging`
- Base URL: `http://127.0.0.1:4273`
- Browser: `chromium-desktop`
- Mock/intercettazioni: nessuno
- Test eseguiti: solo `ANEMIA_01`
- Playwright: `1 passed`
- Timeout proxy: `75000 ms`
- `/api/gemini`: HTTP `200`
- Durata `/api/gemini`: `10001.578 ms`
- Durata totale Playwright: `107447 ms`

## Output ottenuto

- Urgenza: `Urgenza bassa / non urgente: visita programmata a breve con Medico di Medicina Generale.`
- Branca/specialista: `Medico di Medicina Generale`
- `area_specialistica_piu_adatta.branca`: `Medicina Generale / Medicina Interna`
- `area_specialistica_piu_adatta.area_specialistica`: `Valutazione di possibile anemia/carenza marziale e possibili perdite mestruali`
- `area_specialistica_piu_adatta.eventuale_secondo_livello`: `Ginecologia per menorragia`
- Red flag negative strutturate:
  - `assenza di dolore toracico`
  - `assenza di svenimenti`
  - `assenza di sangue nelle feci`

## Controlli di sicurezza clinica

- Nessun alert clinico automatico 112/Pronto Soccorso; il riferimento al 112 resta esclusivamente nel disclaimer generale separato.
- Nessuna diagnosi certa di anemia.
- Nessuna prescrizione o indicazione ad assumere ferro.
- Possibile approfondimento ginecologico mantenuto come secondo livello per mestruazioni abbondanti.
- Specialista di primo riferimento coerente: Medico di Medicina Generale.

## Implementazione

- Timeout proxy ridotto dal valore sperimentale di 90 secondi a 75 secondi.
- Schema JSON Gemini esteso con `livello_urgenza`, `area_specialistica_piu_adatta` e `red_flags_rilevate`, evitando che il response schema del proxy elimini i campi richiesti.
- Normalizzazione prudenziale applicata soltanto ai quadri lievi con stanchezza/astenia, fragilita di unghie o capelli, mestruazioni abbondanti e tutte e tre le negazioni esplicite.
- L'area specialistica e esposta in un elemento semantico nascosto per i test; nessuna modifica visiva o CSS.

## Artefatti

- `artifacts/raw-output/staging-chromium-desktop-ANEMIA_01.json`
- `artifacts/playwright-results.json`

## Sicurezza Git

Il lavoro e stato eseguito esclusivamente su `aiutodoc-clinical-validation`. `main` e rimasto sul commit `f776bae225406bd05df9bbb95828ebefe0e16e81`. Nessun merge, push o deploy produzione.

