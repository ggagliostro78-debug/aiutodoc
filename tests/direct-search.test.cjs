const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { searchSpecialists, handleSpecialistSearch } = require('../server/specialist_search');
const { handlePlacesSearch } = require('../server/places');

test('direct provider queries stay in requested area and exclude clinical narrative', async () => {
    process.env.SERPAPI_API_KEY = 'synthetic-test-key';
    const queries = [];
    try {
        const result = await searchSpecialists({ searchMode: 'direct', specialista: 'Cardiologia', zona: 'Milano', disturbo: 'PRIVATE_NARRATIVE', regione: 'OTHER_REGION' }, async url => {
            queries.push(new URL(url).searchParams.get('q'));
            return { ok: true, json: async () => ({ organic_results: [] }) };
        });
        assert.equal(queries.length, 3);
        assert.ok(queries.every(q => q.includes('Cardiologia Milano') && !/Italia|PRIVATE_NARRATIVE|OTHER_REGION/.test(q)));
        assert.deepEqual(result.results, []);
    } finally { delete process.env.SERPAPI_API_KEY; }
});

test('direct API rejects missing and oversized location, bad method and origin', async () => {
    process.env.AIUTODOC_LOCAL_MODE = 'true';
    for (const zona of ['', ' ', 'x'.repeat(161)]) {
        const result = await handleSpecialistSearch({ method: 'POST', body: { searchMode: 'direct', specialista: 'Cardiologia', zona }, context: { ip: 'direct-test' } });
        assert.equal(result.statusCode, 400);
    }
    assert.equal((await handleSpecialistSearch({ method: 'GET' })).statusCode, 405);
    assert.equal((await handleSpecialistSearch({ method: 'POST', context: { headers: { origin: 'https://untrusted.invalid' } } })).statusCode, 403);
});

test('direct Google Places lookup uses only specialty and requested area', async () => {
    const oldExternal = process.env.AIUTODOC_EXTERNAL_SERVICES;
    const oldKey = process.env.GOOGLE_PLACES_API_KEY;
    const queries = [];
    process.env.AIUTODOC_EXTERNAL_SERVICES = 'true';
    process.env.GOOGLE_PLACES_API_KEY = 'synthetic-test-key';
    try {
        const response = await handlePlacesSearch({
            method: 'POST', body: { searchMode: 'direct', specialista: 'Cardiologia', zona: 'Milano', disturbo: 'PRIVATE_NARRATIVE' }, context: { ip: 'places-direct-test' },
            fetchImpl: async (url, options) => {
                queries.push(JSON.parse(options.body).textQuery);
                return { ok: true, status: 200, headers: {}, text: async () => JSON.stringify({ places: [{ displayName: { text: 'Ospedale San Carlo Milano' }, formattedAddress: 'Via Roma, Milano', types: ['hospital'] }] }) };
            }
        });
        const payload = JSON.parse(response.body);
        assert.equal(response.statusCode, 200);
        assert.equal(queries.length, 3);
        assert.ok(queries.every(query => query.includes('Cardiologia') && query.includes('Milano') && !query.includes('PRIVATE_NARRATIVE')));
        assert.equal(payload.risultati.length, 1);
        assert.equal(payload.risultati[0].indirizzo_modalita, 'Via Roma, Milano');
    } finally {
        if (oldExternal === undefined) delete process.env.AIUTODOC_EXTERNAL_SERVICES; else process.env.AIUTODOC_EXTERNAL_SERVICES = oldExternal;
        if (oldKey === undefined) delete process.env.GOOGLE_PLACES_API_KEY; else process.env.GOOGLE_PLACES_API_KEY = oldKey;
    }
});

test('direct Places rejects invalid raw fields and reports provider failure instead of empty success', async () => {
    for (const zona of ['', 'x', 'x'.repeat(161), 123]) {
        const response = await handlePlacesSearch({ method: 'POST', body: { searchMode: 'direct', specialista: 'Cardiologia', zona }, context: { ip: 'places-invalid' } });
        assert.equal(response.statusCode, 400);
    }
    const oldExternal = process.env.AIUTODOC_EXTERNAL_SERVICES;
    const oldKey = process.env.GOOGLE_PLACES_API_KEY;
    process.env.AIUTODOC_EXTERNAL_SERVICES = 'true';
    process.env.GOOGLE_PLACES_API_KEY = 'synthetic-test-key';
    try {
        const response = await handlePlacesSearch({ method: 'POST', body: { searchMode: 'direct', specialista: 'Cardiologia', zona: 'Milano' }, context: { ip: 'places-error-test' },
            fetchImpl: async () => ({ ok: false, status: 403, headers: {}, text: async () => 'PRIVATE_PROVIDER_DETAIL' }) });
        assert.equal(response.statusCode, 502);
        assert.equal(response.body.includes('PRIVATE_PROVIDER_DETAIL'), false);
    } finally {
        if (oldExternal === undefined) delete process.env.AIUTODOC_EXTERNAL_SERVICES; else process.env.AIUTODOC_EXTERNAL_SERVICES = oldExternal;
        if (oldKey === undefined) delete process.env.GOOGLE_PLACES_API_KEY; else process.env.GOOGLE_PLACES_API_KEY = oldKey;
    }
});

function ui(fetchImpl, receipt = 'synthetic') {
    const elements = new Map();
    const get = id => {
        if (!elements.has(id)) elements.set(id, {
            hidden: true, value: '', disabled: false, textContent: '', innerHTML: '', style: {},
            handlers: {}, classList: { remove() {} },
            addEventListener(name, fn) { this.handlers[name] = fn; },
            appendChild() {}, setAttribute() {}, focus() {}, scrollIntoView() {},
            reportValidity() { return true; }, querySelector() { return get('age-input'); },
            replaceChildren() { this.innerHTML = ''; }
        });
        return elements.get(id);
    };
    const engine = { state: '1_SESSO_ETA', _buildCard: card => card.nome === 'valid' ? '<p>Public card</p>' : '' };
    const context = { document: { getElementById: get, createElement: () => ({}) }, window: { aiutodocEntryReceipt: () => receipt }, fetch: fetchImpl, AbortController, setTimeout, clearTimeout, engine };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync('src/direct_search.js', 'utf8') + '\nsetupEntryPaths(engine);', context);
    get('direct-specialty').value = 'Cardiologia'; get('direct-location').value = 'Milano';
    return { get, engine, submit: () => get('direct-search-form').handlers.submit({ preventDefault() {} }) };
}

test('direct UI sends only specialty/area and invites guided flow after success', async () => {
    let payload;
    const app = ui(async (url, options) => { assert.equal(url, '/api/places'); payload = JSON.parse(options.body); return { ok: true, json: async () => ({ risultati: [{ nome: 'valid' }, { nome: 'filtered' }] }) }; });
    await app.submit();
    assert.deepEqual(payload, { specialista: 'Cardiologia', zona: 'Milano', searchMode: 'direct' });
    assert.match(app.get('direct-search-status').textContent, /^1 schede/);
    assert.equal(app.get('direct-orientation-invite').hidden, false);
    app.get('direct-start-guided').handlers.click();
    assert.equal(app.get('initial-medical-form').hidden, false);
    assert.equal(app.get('direct-search-panel').hidden, true);
    assert.equal(app.engine.state, '1_SESSO_ETA');
});

test('direct UI falls back to existing web search when Places is not configured', async () => {
    const requests = [];
    const app = ui(async (url, options) => {
        requests.push({ url, body: JSON.parse(options.body) });
        if (url === '/api/places') return { ok: false, json: async () => ({ code: 'GOOGLE_PLACES_CONFIG_MISSING' }) };
        return { ok: true, json: async () => ({ results: [{ nome: 'valid' }] }) };
    });
    await app.submit();
    assert.deepEqual(requests.map(request => request.url), ['/api/places', '/api/specialist-search']);
    assert.ok(requests.every(request => Object.keys(request.body).sort().join(',') === 'searchMode,specialista,zona'));
    assert.match(app.get('direct-search-status').textContent, /^1 schede/);
});

test('direct UI handles empty, provider errors and network failures without invented cards', async () => {
    for (const fetchImpl of [async () => ({ ok: true, json: async () => ({ results: [] }) }), async () => ({ ok: false, json: async () => ({ code: 'GOOGLE_SEARCH_CONFIG_MISSING' }) }), async () => { throw new Error('network'); }]) {
        const app = ui(fetchImpl); await app.submit();
        assert.equal(app.get('direct-search-results').innerHTML, '');
        assert.equal(app.get('direct-orientation-invite').hidden, false);
        assert.equal(app.get('direct-search-submit').disabled, false);
    }
});

test('expired entry consent prevents direct request', async () => {
    let called = false; const app = ui(async () => { called = true; }, '');
    await app.submit(); assert.equal(called, false);
    assert.equal(app.get('privacy-modal').style.display, 'flex');
});

test('switching path ignores stale results and prevents duplicate requests', async () => {
    let finish, calls = 0;
    const app = ui(() => { calls++; return new Promise(resolve => { finish = resolve; }); });
    const pending = app.submit(); await app.submit(); assert.equal(calls, 1);
    app.get('choose-guided').handlers.click();
    finish({ ok: true, json: async () => ({ results: [{ nome: 'valid' }] }) });
    await pending;
    assert.equal(app.get('direct-search-results').innerHTML, '');
    assert.equal(app.get('direct-orientation-invite').hidden, true);
});
