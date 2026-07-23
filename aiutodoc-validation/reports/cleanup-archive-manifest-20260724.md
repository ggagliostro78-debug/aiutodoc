# Manifest pulizia repository - 2026-07-24

## Perimetro

- Branch interessato: `aiutodoc-clinical-validation`.
- Branch `main`: non modificato dalla pulizia.
- Operazione: separazione delle evidenze testuali/JSON dagli output pesanti e dal materiale locale.
- Eliminazioni definitive: nessuna.

## Archivio esterno

Percorso:

`\\100.73.165.109\truenasGG\ProgettiAI\Antigravity\Futuro\AIutoDoc_cleanup_archive_20260724_clinical-validation`

Contenuto archiviato:

| Gruppo | File | Dimensione |
|---|---:|---:|
| `validation-archives` | 3 | 235,75 MB |
| `validation-artifacts` | 215 | 152,28 MB |
| `validation-delivery` | 92 | 20,80 MB |
| `regenerable` | 492 | 52,54 MB |
| `repository-root` | 18 | 0,49 MB |
| `press-automation` | 3 | 0,05 MB |

`regenerable` contiene esclusivamente `dist` e `aiutodoc-validation/node_modules`, ricreabili rispettivamente con `npm run build` e `npm install`.

`repository-root` contiene materiale locale o temporaneo precedentemente presente nella radice del repository, inclusi allegati Codex, memoria di automazione, output della rassegna stampa e file temporanei. Gli allegati sono trattati come potenzialmente forniti dall'utente e non devono essere pubblicati o committati senza revisione.

## Integrità degli archivi ZIP

| File | Byte | SHA-256 |
|---|---:|---|
| `aiutodoc-validation.zip` | 231793712 | `54613B23B8DA5252A27099F0F177A1CD7B52CEBE3A198B282D0412DECA2D1B4F` |
| `AIutoDoc-clinical-validation-staging-20260707.zip` | 12843075 | `A268F1285DEDB2DAEBB236808FD64F8DD2B6808D775C193F3BE959A44E5E5800` |
| `AIutoDoc-clinical-validation-revision-20260707.zip` | 2564035 | `1F268EF759115290842F068139F1E446FA5E63F2047B903AA5A8B951A9B70CBD` |

I due ZIP staging/revision erano copie esatte, verificate file per file tramite SHA-256, delle rispettive cartelle presenti in `delivery`.

Il file `aiutodoc-validation.zip` è invece un archivio storico: rispetto alla cartella corrente conteneva 521 file identici, 16 versioni differenti e 136 file non più presenti. Per questo è stato conservato integralmente.

## Evidenze mantenute nel repository

Sono mantenuti per il versionamento:

- report Markdown di batch, cicli, audit e consolidamento;
- output raw JSON richiamati dai report;
- raw consolidati;
- manifest, hash e risultati JSON dei validatori;
- specifiche di sicurezza sanitaria in `Feedback`;
- regole operative del repository in `AGENTS.md`.

Screenshot, report HTML, risultati runtime, pacchetti `delivery`, ZIP e dipendenze installate restano fuori dal repository. Le regole `.gitignore` impediscono che vengano aggiunti accidentalmente in futuro.

## Riferimenti storici già mancanti

Il controllo dei riferimenti ha individuato due percorsi già assenti prima della pulizia, entrambi citati esclusivamente dal report storico `batch-01-cardiologia.md`:

- `artifacts/raw-output/staging-chromium-desktop-CARDIO_03_PALPITAZIONI_RICORRENTI.json`;
- `artifacts/raw-output/staging-chromium-desktop-CARDIO_04_IPERTENSIONE_SEVERA_CON_SINTOMI.error.json`.

Nessuno dei due file è presente nell'archivio esterno. Il risultato ordinario di `CARDIO_04` è invece conservato come `staging-chromium-desktop-CARDIO_04_IPERTENSIONE_SEVERA_CON_SINTOMI.json`. La mancanza dei due riferimenti storici non è stata mascherata né sostituita durante la pulizia.

## Ripristino

Per ripristinare un gruppo, copiarlo dal percorso di archivio alla posizione originaria indicata dal nome del gruppo. Prima di ripristinare gli ZIP, verificarne l'hash SHA-256 usando i valori riportati sopra.
