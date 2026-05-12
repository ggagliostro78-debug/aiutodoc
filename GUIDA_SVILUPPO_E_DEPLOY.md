# Guida sviluppo e deploy AIutoDoc

Questa guida spiega come mantenere due versioni del progetto:

- `main`: versione stabile/pubblicata.
- `dev`: versione di sviluppo, ricerca e prove.

## 1. Aprire PowerShell nella cartella progetto

```powershell
cd Z:\ProgettiAI\GPTCodex\AIutoDoc_portatile
```

## 2. Controllare su quale branch sei

```powershell
git branch --show-current
```

Risultato possibile:

```text
main
```

oppure:

```text
dev
```

Puoi anche usare:

```powershell
git branch
```

Il branch attivo ha un asterisco `*`.

## 3. Controllare lo stato del progetto

```powershell
git status
```

Se tutto e' pulito, Git mostra:

```text
nothing to commit, working tree clean
```

## 4. Creare il branch di sviluppo

Da fare una sola volta:

```powershell
git checkout -b dev
git push -u origin dev
```

Dopo questi comandi GitHub avra' due branch:

- `main`
- `dev`

## 5. Lavorare sulla versione di sviluppo

Quando vuoi fare modifiche sperimentali:

```powershell
git checkout dev
```

Dopo aver modificato i file:

```powershell
git add .
git commit -m "Descrizione breve della modifica"
git push
```

## 6. Tornare alla versione stabile

```powershell
git checkout main
```

## 7. Portare le modifiche da dev a main

Quando la versione `dev` e' testata e pronta:

```powershell
git checkout main
git merge dev
git push
```

Netlify pubblichera' automaticamente il branch `main`, se il sito di produzione e' configurato su `main`.

## 8. Configurazione Netlify produzione

```text
Branch to deploy: main
Build command: node scripts/build-netlify.js
Publish directory: dist
Functions directory: netlify/functions
```

Variabile ambiente minima:

```text
GEMINI_API_KEY
```

Variabili Firebase opzionali:

```text
FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN
FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID
FIREBASE_MEASUREMENT_ID
```

## 9. Sito Netlify di test

Puoi creare un secondo sito Netlify collegato allo stesso repository GitHub, ma usando `dev`.

```text
Branch to deploy: dev
Build command: node scripts/build-netlify.js
Publish directory: dist
Functions directory: netlify/functions
```

In questo modo:

- sito pubblico = branch `main`
- sito test = branch `dev`

## 10. Test locale prima di pubblicare

Genera la build:

```powershell
node scripts/build-netlify.js
```

Testa la cartella pubblicabile:

```powershell
cd dist
python -m http.server 4174
```

Apri:

```text
http://127.0.0.1:4174
```

Poi torna alla cartella progetto:

```powershell
cd ..
```

## 11. Regola pratica

- Sperimenta su `dev`.
- Pubblica da `main`.
- Prima di unire `dev` in `main`, testa in locale o sul Netlify di test.
