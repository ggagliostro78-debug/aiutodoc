const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

function loader(text) {
    const context = { module: { exports: {} }, require(name) {
        return name === 'node:fs' ? { readFileSync: () => text } : require(name);
    } };
    vm.runInNewContext(fs.readFileSync('scripts/shared-api-env.cjs', 'utf8'), context);
    return context.module.exports.loadSharedApiEnv;
}
test('shared API config imports only allowed API keys, preserving local overrides', () => {
    const load = loader('GOOGLE_PLACES_API_KEY="synthetic-places"\nSERPAPI_API_KEY=synthetic-web\nFIREBASE_SERVICE_ACCOUNT_JSON=forbidden\nFIREBASE_PROJECT_ID=forbidden\nAIUTODOC_SIGNING_SECRET=forbidden\nAIUTODOC_EXTERNAL_SERVICES=true\nAIUTODOC_SHARED_API_ENV=recursive');
    const target = { AIUTODOC_LOCAL_MODE: 'true', AIUTODOC_SHARED_API_ENV: '../main/.env', SERPAPI_API_KEY: 'local-value' };
    load('.', target);
    assert.equal(target.GOOGLE_PLACES_API_KEY, 'synthetic-places');
    assert.equal(target.SERPAPI_API_KEY, 'local-value');
    assert.equal(target.FIREBASE_SERVICE_ACCOUNT_JSON, undefined);
    assert.equal(target.FIREBASE_PROJECT_ID, undefined);
    assert.equal(target.AIUTODOC_SIGNING_SECRET, undefined);
    assert.equal(target.AIUTODOC_EXTERNAL_SERVICES, undefined);
    assert.equal(target.AIUTODOC_SHARED_API_ENV, '../main/.env');
});
test('shared API config is opt-in and unavailable in production or Netlify', () => {
    const load = loader('GOOGLE_PLACES_API_KEY=synthetic');
    const target = {};
    load('.', target); assert.deepEqual(target, {});
    for (const extra of [{}, { AIUTODOC_LOCAL_MODE: 'true', NODE_ENV: 'production' }, { AIUTODOC_LOCAL_MODE: 'true', NETLIFY: 'true' }]) {
        assert.throws(() => load('.', { AIUTODOC_SHARED_API_ENV: '../main/.env', ...extra }));
    }
});
