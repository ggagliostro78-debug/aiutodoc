const crypto = require('node:crypto');
const localSecret = crypto.randomBytes(32).toString('hex');
function env(...names) {
    for (const name of names) {
        const value = process.env[name];
        if (value) return value;
    }
    return '';
}
function isLocal() { return (process.env.AIUTODOC_LOCAL_MODE === 'true' || process.env.BETA_LOCAL_MODE === 'true') && !process.env.NETLIFY && process.env.NODE_ENV !== 'production'; }
function externalEnabled() {
    const flag = env('AIUTODOC_EXTERNAL_SERVICES', 'EXTERNAL_SERVICES', 'BETA_EXTERNAL_SERVICES');
    if (flag) return flag === 'true';
    return !isLocal() && Boolean(env('GEMINI_API_KEY', 'BETA_GEMINI_API_KEY'));
}
function secret() {
    const value = env('AIUTODOC_SIGNING_SECRET', 'SIGNING_SECRET', 'BETA_SIGNING_SECRET');
    if (value && value.length >= 64) return value;
    const serviceAccount = env('FIREBASE_SERVICE_ACCOUNT_JSON', 'BETA_FIREBASE_SERVICE_ACCOUNT_JSON');
    if (serviceAccount && serviceAccount.length >= 64) return serviceAccount;
    if (isLocal()) return localSecret;
    throw new Error('CONFIG_REQUIRED');
}
function hash(value) { return crypto.createHmac('sha256', secret()).update(String(value)).digest('hex'); }
function fail(code) { const error = new Error(code); error.code = code; return error; }
function requireExternal() { if (!externalEnabled()) throw fail('EXTERNAL_DISABLED'); }
module.exports = { env, isLocal, externalEnabled, secret, hash, fail, requireExternal };
