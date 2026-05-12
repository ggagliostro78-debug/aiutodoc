# Guida sviluppo e deploy AIutoDoc

Questa guida spiega come mantenere due versioni del progetto:

- `main`: versione stabile/pubblicata.
- `dev`: versione di sviluppo, ricerca e prove.

## 1. Aprire PowerShell nella cartella progetto

```powershell
cd Z:\ProgettiAI\GPTCodex\AIutoDoc_portatile
```

## 2. Controllare lo stato del progetto

Prima di cambiare branch o pubblicare:

```powershell
git status
```

Se tutto e' pulito, Git mostra:

```text
nothing to commit, working tree clean
```

## 3. Creare il branch di sviluppo

Da fare una sola volta:

```powershell
git checkout -b dev
git push -u origin dev
```

Dopo questi comandi GitHub avra' due branch:

- `main`
- `dev`

## 4. Lavorare sulla versione di sviluppo

Quando vuoi fare modifiche sperimentali:

```powershell
git checkout dev
```

Dopo aver modificato i file, salva su GitHub:

```powershell
git add .
git commit -m "Descrizione breve della modifica"
git push
```

## 5. Tornare alla versione stabile

Per tornare alla versione pubblicata:

```powershell
git checkout main
```

## 6. Portare le modifiche da dev a main

Quando la versione `dev` e' testata e pronta per andare online:

```powershell
git checkout main
git merge dev
git push
```

Netlify pubblichera' automaticamente il branch `main`, se il sito di produzione e' configurato su `main`.

## 7. Configurazione Netlify produzione

Sito pubblico:

```text
Branch to deploy: main
Build command: node scripts/build-netlify.js
Publish directory: dist
Functions directory: netlify/functions
```

Variabili ambiente minime:

```text
GEMINI_API_KEY
```

Variabili Firebase opzionali per salvataggio/recupero ID cloud:

```text
FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN
FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID
FIREBASE_MEASUREMENT_ID
```

## 8. Creare un sito Netlify di test

Puoi creare un secondo sito Netlify collegato allo stesso repository GitHub, ma usando il branch `dev`.

Impostazioni:

```text
Branch to deploy: dev
Build command: node scripts/build-netlify.js
Publish directory: dist
Functions directory: netlify/functions
```

In questo modo:

- sito pubblico = branch `main`
- sito test = branch `dev`

## 9. Test locale prima di pubblicare

Genera la build:

```powershell
node scripts/build-netlify.js
```

Se vuoi testare localmente la cartella pubblicabile:

```powershell
cd dist
python -m http.server 4174
```

Poi apri:

```text
http://127.0.0.1:4174
```

Per tornare alla cartella progetto:

```powershell
cd ..
```

## 10. Regola pratica

- Sperimenta sempre su `dev`.
- Pubblica solo da `main`.
- Prima di fare merge in `main`, prova il sito in locale o sul Netlify di test.
