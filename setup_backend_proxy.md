# Setup Proxy Gemini

Il frontend non usa piu la chiave Gemini direttamente.

## Cosa impostare

1. Crea una variabile ambiente `GEMINI_API_KEY` sul tuo hosting.
2. Facoltativamente imposta `GEMINI_ALLOWED_ORIGIN` con il dominio pubblico del sito.

## File coinvolti

- `src/config.js`: il browser usa solo `/api/gemini`
- `api/gemini.js`: entrypoint serverless per ambienti compatibili con Vercel
- `netlify/functions/gemini.js`: entrypoint serverless per Netlify
- `server/gemini_proxy.js`: logica condivisa del proxy
- `netlify.toml`: redirect da `/api/gemini` alla funzione Netlify

## Nota locale

Aprire `index.html` direttamente da disco non basta piu per usare l'AI. Serve un server locale oppure un deploy che esponga l'endpoint `/api/gemini`.
