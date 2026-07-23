# AiutoDoc - main manual smoke test

## Identificazione

- Data: 2026-07-17.
- Branch/commit osservato: `main` al commit `f776bae225406bd05df9bbb95828ebefe0e16e81` (`Implementa aggiornamenti compliance cookie e ADR`, 2026-07-02).
- Metodo di isolamento: worktree temporanea pulita in detached HEAD sul commit esatto di `main`; il branch clinico non e stato spostato.
- Ambiente: staging locale `http://127.0.0.1:4273`.
- Browser: Chromium desktop.
- Produzione e mobile: non testati.
- Dati: esclusivamente testi inventati previsti dal mandato.

Questo smoke test non equivale a una validazione scientifica completa di `main`.

## Controlli preliminari

- Working tree di `main`: pulito.
- Porta 4273: libera prima dell'avvio.
- `npm run check`: PASS.
- `npm run build`: PASS; nessuna modifica tracciata prodotta.
- `npm run test:validator`: non disponibile nel `package.json` di `main` e quindi non eseguito.
- Hash SHA-256 iniziali acquisiti per 10 file principali.

## Risultati

| Caso | Comportamento osservato su main | Confronto con atteso | Gemini | Ricerca specialisti | Esito |
|---|---|---|---|---|---|
| 1 - Urgenza respiratoria pediatrica | Bypass immediato con messaggio `contatta il 112 o recati immediatamente al Pronto Soccorso`; nessuna intervista | Conforme ai requisiti minimi. Nessuna diagnosi o prescrizione osservata | Non chiamato | 0 chiamate | CONFORME |
| 2 - Perdita visiva improvvisa | Nessun bypass: il flusso avvia le 3 domande conoscitive, iniziando dalla durata del disturbo | Non conforme: atteso PS o servizio oculistico urgente prima dell'intervista | Non chiamato, test fermato all'avvio dell'intervista | 0 chiamate | NON CONFORME |
| 3 - Controllo negativo dopo sport | Bypass immediato generico verso 112/PS nonostante recupero completo e negazioni di dolore toracico, svenimenti, difficolta respiratoria e sintomi a riposo | Non conforme: falso positivo urgente; atteso percorso non emergenziale | Non chiamato per il bypass | 0 chiamate | NON CONFORME |

Playwright ha completato l'acquisizione finale dei tre casi: 3/3. Un tentativo preliminare del solo primo caso non riconosceva il selettore storico dell'avviso urgente; e stato corretto esclusivamente il runner temporaneo, senza modificare `main`.

## Differenze dal branch clinico

- Il caso respiratorio pediatrico e coerente con il bypass di `PED_01` sul branch clinico, sebbene `main` mostri un messaggio urgente generico.
- Il branch clinico chiude `OCUL_01` con bypass verso Pronto Soccorso/servizio oculistico urgente; `main` avvia invece l'intervista.
- Il branch clinico chiude `PED_05` come non urgente dopo recupero completo; `main` attiva invece 112/PS. L'osservazione e coerente con un mancato rispetto delle negazioni nel matcher urgente di `main`, ma non e stato eseguito debugging mutativo.

Non sono stati copiati fix o file dal branch clinico.

## Ricerca specialisti e servizi esterni

`RICERCA SPECIALISTI NON ESEGUITA PER SCELTA METODOLOGICA`

- SerpApi, Google, `specialist-search`, `places` ed enrichment: 0 chiamate esterne.
- I test sono terminati al bypass o all'avvio dell'intervista, prima della ricerca.
- Le route di ricerca erano protette nel runner temporaneo, ma non sono state raggiunte.
- Gemini: 0 chiamate complessive; non e stato usato alcun mock o fallback clinico.
- Il server locale ha registrato errori non bloccanti `FIREBASE_ADMIN_CONFIG_MISSING` durante il tentativo di log del consenso. Nessun dato e stato persistito; l'evento non spiega i due scostamenti clinici osservati.

## Integrita finale

- Working tree di `main` dopo check, build e test: pulito.
- Commit finale: identico a quello iniziale, `f776bae225406bd05df9bbb95828ebefe0e16e81`.
- Hash iniziali/finali dei 10 file principali: 10/10 identici.
- Modifiche a `main`: 0.
- Merge, cherry-pick, commit, push, PR e deploy: 0.
- Staging arrestato; porta 4273 libera; processi Node/Chromium/Playwright della worktree: 0.

## Conclusione

**MAIN SMOKE TEST NON CONFORME**

Motivo: 2 casi su 3 divergono dall'atteso e dal comportamento chiuso sul branch clinico. Nessun fix e stato applicato.
