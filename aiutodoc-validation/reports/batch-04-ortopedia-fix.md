# Batch 04 Ortopedia - fix e rerun controllato

- Data run: 9 luglio 2026
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
- CSS/grafica/layout/UX/documenti legali/database/Netlify: non modificati

## Correzioni applicate

- `ORTO_01`: normalizzazione circoscritta della lombalgia post-sforzo stabile senza red flag a urgenza bassa/programmata.
- `ORTO_03`: normalizzazione circoscritta del trauma distorsivo di ginocchio con carico ancora possibile; red flag positive e negative strutturate; testo operativo ridotto a prudenza generale.
- `ORTO_04`: normalizzazione circoscritta del dolore cronico di spalla verso area spalla/cuffia/impingement/tendinopatia.
- `ORTO_05`: nessuna modifica al triage clinico; corretto solo il mapping fonti per trauma caviglia/frattura-lussazione.
- Fonti: introdotte fonti muscoloscheletriche specifiche per lombalgia, ginocchio, spalla e caviglia; rimossa la caduta impropria su `Low back pain and sciatica` per ginocchio/spalla/caviglia.
- Validatore: corretto falso positivo su `diagnosi certa` quando la frase è negata, per esempio `senza diagnosi certa`.

## Tabella risultati finali

| Caso | Esito clinico | Esito Playwright | Branca | Area specialistica | Urgenza | Red flag | Fonti | Durata /api/gemini | Problema residuo |
|---|---|---|---|---|---|---|---|---:|---|
| ORTO_01_LOMBALGIA_MECCANICA_NON_URGENTE | PASS CLINICO-FUNZIONALE | PASS | Ortopedia / Fisiatria | Lombalgia meccanica / rachide lombare / medicina fisica e riabilitativa | Urgenza bassa / visita programmata se persiste o limita le attività; escalation solo per red flag | Dolore lombare post-sforzo; assenza febbre, perdita peso, trauma importante, dolore sotto ginocchio, debolezza gambe, anestesia a sella/sensibilità genitale, problemi urinari/fecali | Low back pain and sciatica: assessment and management, NICE NG59 | 16901.961 ms | Nessuno bloccante |
| ORTO_03_TRAUMA_GINOCCHIO_SOSPETTA_LESIONE_LEGAMENTOSA | PASS CLINICO-FUNZIONALE | PASS | Ortopedia e Traumatologia | Traumatologia sportiva / ginocchio / sospetta lesione legamentosa o meniscale | Prioritaria / valutazione ortopedica non da rimandare; nessun 112 automatico se stabile | Trauma distorsivo, crack, gonfiore rapido, instabilità/cedimento, limitazione movimento; assenza deformità, ferite aperte, febbre, impossibilità completa di carico | Knee Pain in Adults and Adolescents: The Initial Evaluation, American Family Physician 2018 | 5889.625 ms | Nessuno bloccante |
| ORTO_04_SPALLA_CRONICA_CUFFIA_POSSIBILE | PASS CLINICO-FUNZIONALE | PASS | Ortopedia / Fisiatria | Spalla / cuffia dei rotatori / impingement / tendinopatia | Urgenza bassa / visita programmata; escalation solo per trauma importante, deformità, perdita forza, febbre/rossore/calore, dolore improvviso, arto freddo/pallido o deficit neurologici | Dolore cronico spalla, dolore sopra la testa, dolore notturno sul lato, limitazione funzionale; assenza trauma, deformità, formicolii/deficit neurologici, febbre | Shoulder pain: Management, NICE Clinical Knowledge Summary | 6264.897 ms | Nessuno bloccante |
| ORTO_05_TRAUMA_CAVIGLIA_FRATTURA_SOSPETTA_URGENTE | PASS CLINICO-FUNZIONALE | PASS | Ortopedia e Traumatologia | Trauma acuto caviglia con sospetta lesione ossea/legamentosa e potenziale compromissione vascolare | Alta / urgente: Pronto Soccorso immediato | Dolore forte, caviglia gonfia/storta, impossibilità di carico, dita fredde e pallide | Fractures (non-complex): assessment and management, NICE NG38 | 14463.884 ms | Triage mantenuto; nessuna fonte lombalgia impropria |

## Conteggio

- Casi rilanciati nel consolidamento finale: 4/4
- PASS CLINICO-FUNZIONALE: 4
- WARNING: 0
- FAIL CLINICO-FUNZIONALE: 0
- FAIL TECNICO VALIDATORE: 0
- NON VALUTABILE - BLOCCO INFRASTRUTTURALE: 0
- Gemini HTTP 200: 4/4
- Falsi negativi su urgenze ortopediche: 0
- Falsi 112/PS su casi non acuti: 0

## Verifiche

- `npm run check`: PASS
- `npm run build`: PASS
- Playwright finale: `4 passed (3.8m)`
- `artifacts/playwright-results.json`: `expected=4`, `unexpected=0`, `flaky=0`, `skipped=0`

## Artefatti finali

- `artifacts/raw-output/staging-chromium-desktop-ORTO_01_LOMBALGIA_MECCANICA_NON_URGENTE.json`
- `artifacts/raw-output/staging-chromium-desktop-ORTO_03_TRAUMA_GINOCCHIO_SOSPETTA_LESIONE_LEGAMENTOSA.json`
- `artifacts/raw-output/staging-chromium-desktop-ORTO_04_SPALLA_CRONICA_CUFFIA_POSSIBILE.json`
- `artifacts/raw-output/staging-chromium-desktop-ORTO_05_TRAUMA_CAVIGLIA_FRATTURA_SOSPETTA_URGENTE.json`
- `artifacts/playwright-results.json`

## Raccomandazione

Il fix del Batch 04 soddisfa i criteri richiesti. Non ho avviato Dermatologia; il prossimo batch può essere valutato solo dopo approvazione del founder.
