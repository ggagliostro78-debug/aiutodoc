# Batch 05 Dermatologia - validazione clinico-funzionale reale

- Data run: 10 luglio 2026
- Branch: `aiutodoc-clinical-validation`
- Commit testato: `f5b58abffa615ab04ec0a6acf83392e08e7fc52b` con modifiche locali non deployate
- Ambiente: `staging`
- Base URL: `http://127.0.0.1:4273`
- Browser: `chromium-desktop`
- Timeout proxy: 75s
- Mock: no
- Intercettazione `/api/gemini`: no
- Produzione: non testata
- Merge/push/PR/deploy: non eseguiti
- Mobile: non eseguito
- Suite completa 75 casi: non eseguita
- CSS/grafica/layout/UX/documenti legali/database/Netlify: non modificati

## Nota di suite

I casi dermatologici non erano ancora presenti nella suite espansa locale. Ho aggiunto solo fixture e attesi del validatore Playwright per `DERM_01`-`DERM_05`, senza modificare il motore AiutoDoc, il prompt clinico, CSS o UX durante il batch.

## Tabella risultati

| Caso | Esito clinico | Esito Playwright | Branca | Area specialistica | Urgenza | Red flag | Fonti | Durata /api/gemini | Problema |
|---|---|---|---|---|---|---|---|---:|---|
| DERM_01_NEO_SOSPETTO_MELANOMA | WARNING | PASS | Dermatologia | Valutazione di lesione cutanea pigmentata in evoluzione | Prioritaria | Neo in evoluzione, asimmetria, bordi irregolari, colori disomogenei, prurito | Non pertinenti: `Low back pain and sciatica`, NICE NG59 | 9724.755 ms | Triage corretto e nessun PS/112 automatico, ma fonti completamente non dermatologiche; mancano red flag negative strutturate sanguinamento/febbre. |
| DERM_02_DERMATITE_ECZEMA_NON_URGENTE | WARNING | PASS | Dermatologia | Dermatite da contatto o eczema cronico delle mani | Non urgente / visita programmata a breve | Campo red flag non valorizzato: `Nessuno esplicitamente rilevato` | Non pertinenti: melanoma NICE NG14 | 10171.472 ms | Urgenza corretta e nessun 112/PS, ma fonti melanoma non pertinenti; red flag positive/negative mancanti; testo operativo su creme/emollienti da rendere più prudenziale. |
| DERM_03_CELLULITE_ERISIPELA_GAMBA | WARNING | PASS | Medicina Interna | Infezione cutanea e sottocutanea con sintomi sistemici in paziente diabetico | Alta / urgente: valutazione medica immediata | Area rossa/calda/gonfia/dolorosa in allargamento, febbre, brividi, debolezza, diabete | Non specifiche: multimorbidity NICE NG56 | 10748.008 ms | Urgenza alta intercettata; nessun falso negativo grave. Warning per branca/specialista non esplicitamente `Dermatologia / Medicina d'urgenza / Infettivologia` e fonti non pertinenti a cellulitis/erysipelas. |
| DERM_04_ORTICARIA_CON_ANAFILASSI | WARNING | PASS | Allergologia e Immunologia Clinica | Reazione anafilattica acuta e allergia alimentare | Alta / urgente: accesso immediato al Pronto Soccorso | Frutta secca, orticaria diffusa, gonfiore labbra/lingua, gola che si chiude, respiro difficile, stordimento | Generiche: catalogo specifico in aggiornamento | 15328.704 ms | PS immediato indicato, quindi nessun falso negativo sostanziale; warning perché non indica esplicitamente `112/118`, specialista/servizio resta Allergologo e fonti non pertinenti ad anafilassi. Linguaggio `altamente suggestivi di reazione anafilattica` da rendere più prudente. |
| DERM_05_IMPETIGINE_PEDIATRICA_NON_URGENTE | WARNING | PASS | Pediatria | Lesioni cutanee periorali con croste/prurito, possibile natura infettiva/contagiosa | Bassa / visita programmata a breve con Pediatra | Red flag negative: assenza febbre, gonfiore viso, dolore importante, difficoltà respiratoria; comportamento normale | Non pertinenti: Fever in under 5s NICE NG143 per bambino di 6 anni con lesioni cutanee | 13264.566 ms | Urgenza corretta e nessun 112/PS automatico, ma fonti pediatriche non pertinenti; red flag positive croste giallastre/contatti scolastici non strutturate nel campo red flag; testo operativo da rendere più prudenziale. |

## Conteggio

- Casi eseguiti: 5/5
- PASS CLINICO-FUNZIONALE: 0
- WARNING: 5
- FAIL CLINICO-FUNZIONALE: 0
- FAIL TECNICO VALIDATORE: 0
- NON VALUTABILE - BLOCCO INFRASTRUTTURALE: 0
- Playwright: 5/5 PASS
- Gemini HTTP 200: 5/5
- `area_specialistica_piu_adatta`: presente in 5/5
- Fonti pertinenti: 0/5 secondo revisione clinico-funzionale del batch

## Esito criteri minimi

Il Batch 05 non supera i criteri minimi.

Motivi principali:

1. Le fonti non sono pertinenti in 5/5 casi.
2. `DERM_04` riconosce l'urgenza e indirizza al Pronto Soccorso, ma non esplicita `112/118` e non struttura il servizio come emergenza allergologica/PS.
3. `DERM_02` e `DERM_05` non strutturano adeguatamente red flag positive e negative.
4. Alcuni testi contengono consigli operativi non prescrittivi ma da rendere più prudenti, soprattutto dermatite/impetigine.

## Raccomandazione

Non procedere ad altri batch prima di correggere i problemi dermatologici:

- mapping fonti specifiche per melanoma/lesioni pigmentate, dermatite/eczema, cellulitis/erysipelas, anafilassi e impetigine;
- normalizzazione strutturata delle red flag per dermatite e impetigine;
- esplicitazione `112/118` per sospetta anafilassi;
- evitare fonti pediatriche non pertinenti come `Fever in under 5s` per bambino di 6 anni con sospetta impetigine;
- evitare fonte lombalgia per neo sulla schiena.

## Verifiche

- `npm run check`: PASS
- `npm run build`: PASS
- Playwright Batch 05: `5 passed (5.8m)`
- `artifacts/playwright-results.json`: `expected=5`, `unexpected=0`, `flaky=0`, `skipped=0`

## Artefatti finali

- `artifacts/raw-output/staging-chromium-desktop-DERM_01_NEO_SOSPETTO_MELANOMA.json`
- `artifacts/raw-output/staging-chromium-desktop-DERM_02_DERMATITE_ECZEMA_NON_URGENTE.json`
- `artifacts/raw-output/staging-chromium-desktop-DERM_03_CELLULITE_ERISIPELA_GAMBA.json`
- `artifacts/raw-output/staging-chromium-desktop-DERM_04_ORTICARIA_CON_ANAFILASSI.json`
- `artifacts/raw-output/staging-chromium-desktop-DERM_05_IMPETIGINE_PEDIATRICA_NON_URGENTE.json`
- `artifacts/playwright-results.json`
