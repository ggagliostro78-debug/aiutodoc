const fs = require('node:fs');
const path = require('node:path');

// Explicit opt-in for local development. Never inherit database, service-account,
// signing, origin, retention or activation settings from another environment.
const API_KEYS = new Set([
    'GEMINI_API_KEY', 'GOOGLE_PLACES_API_KEY', 'GOOGLE_MAPS_API_KEY',
    'GOOGLE_CSE_API_KEY', 'GOOGLE_CSE_ID', 'GOOGLE_SEARCH_ENGINE_ID', 'SERPAPI_API_KEY'
]);

function loadSharedApiEnv(root, target = process.env) {
    if (!target.AIUTODOC_SHARED_API_ENV) return [];
    if (target.NETLIFY || target.NODE_ENV === 'production' || target.AIUTODOC_LOCAL_MODE !== 'true') {
        throw new Error('Configurazione API condivisa consentita solo in sviluppo locale.');
    }
    let text;
    try { text = fs.readFileSync(path.resolve(root, target.AIUTODOC_SHARED_API_ENV), 'utf8'); }
    catch { throw new Error('File API condiviso non leggibile: verifica AIUTODOC_SHARED_API_ENV.'); }
    const loaded = [];
    for (const line of text.split(/\r?\n/)) {
        const match = line.trim().match(/^([A-Z_]+)\s*=\s*(.*)$/);
        if (!match || !API_KEYS.has(match[1]) || target[match[1]]) continue;
        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
        if (!value) continue;
        target[match[1]] = value;
        loaded.push(match[1]);
    }
    return loaded;
}
module.exports = { loadSharedApiEnv };
