const crypto = require('node:crypto');
const {env, isLocal, requireExternal, fail} = require('./runtime_environment');
const memory = new Map();
const collections = new Set(['beta_triages_v2','beta_consents_v2','beta_limits_v1']);
let cachedToken;
function purge() { for (const [key,value] of memory) if (!Number.isFinite(Date.parse(value.expiresAt)) || Date.parse(value.expiresAt) <= Date.now()) memory.delete(key); }
const timer = setInterval(purge, 30000); timer.unref();
function account() {
    requireExternal();
    const a = JSON.parse(env('FIREBASE_SERVICE_ACCOUNT_JSON', 'BETA_FIREBASE_SERVICE_ACCOUNT_JSON') || '{}');
    const expected = env('FIREBASE_PROJECT_ID', 'BETA_FIREBASE_PROJECT_ID') || a.project_id || '';
    if (a.project_id !== expected || !a.client_email || !a.private_key) throw fail('DATABASE_CONFIG_INVALID');
    return a;
}
async function request(url, options = {}) {
    const controller = new AbortController(); const timeout = setTimeout(()=>controller.abort(),5000);
    try { return await fetch(url,{...options,signal:controller.signal,redirect:'error'}); }
    finally { clearTimeout(timeout); }
}
async function token(a) {
    if(cachedToken && cachedToken.project===a.project_id && cachedToken.expires>Date.now()+60000) return cachedToken.value;
    const now=Math.floor(Date.now()/1000);
    const enc=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
    const unsigned=enc({alg:'RS256',typ:'JWT'})+'.'+enc({iss:a.client_email,scope:'https://www.googleapis.com/auth/datastore',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600});
    const signed=crypto.createSign('RSA-SHA256').update(unsigned).sign(a.private_key.replace(/\\n/g,'\n'),'base64url');
    const response=await request('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:unsigned+'.'+signed}).toString()});
    if(!response.ok) throw fail('BETA_STORAGE_UNAVAILABLE');
    const result=await response.json();
    cachedToken={project:a.project_id,value:result.access_token,expires:Date.now()+Number(result.expires_in||3600)*1000};return result.access_token;
}
function validate(collection,id) { if(!collections.has(collection)|| !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) throw fail('BETA_STORAGE_INPUT_INVALID'); }
async function cloud(collection,id,action,data,precondition) {
    const a=account();const name='projects/'+a.project_id+'/databases/(default)/documents/'+collection+'/'+id;
    const headers={Authorization:'Bearer '+await token(a),'Content-Type':'application/json'};
    if(action==='read') {
        const response=await request('https://firestore.googleapis.com/v1/'+name,{headers});
        if(response.status===404) return null;
        if(!response.ok) throw fail('BETA_STORAGE_UNAVAILABLE');
        const doc=await response.json();return {value:JSON.parse(doc.fields.payloadJson.stringValue),version:doc.updateTime};
    }
    const write=action==='delete'?{delete:name}:{update:{name,fields:{payloadJson:{stringValue:JSON.stringify(data)},expiresAt:{timestampValue:data.expiresAt}}}};
    if(precondition) write.currentDocument=precondition;
    const response=await request('https://firestore.googleapis.com/v1/projects/'+a.project_id+'/databases/(default)/documents:commit',{method:'POST',headers,body:JSON.stringify({writes:[write]})});
    if([409,412].includes(response.status)) throw fail('BETA_CONFLICT');
    if(response.status===400){const e=await response.json();if(['FAILED_PRECONDITION','ALREADY_EXISTS','ABORTED'].includes(e.error?.status))throw fail('BETA_CONFLICT');}
    if(!response.ok) throw fail('BETA_STORAGE_UNAVAILABLE');
}
async function readRaw(collection,id) {
    validate(collection,id);
    if(!isLocal())return cloud(collection,id,'read');
    purge(); const value=memory.get(collection+'/'+id);return value?{value:structuredClone(value),version:null}:null;
}
async function read(collection,id) {
    const record=await readRaw(collection,id);if(!record)return null;
    if(!Number.isFinite(Date.parse(record.value.expiresAt))||Date.parse(record.value.expiresAt)<=Date.now()) { await remove(collection,id);return null; }
    return record.value;
}
async function create(collection,id,data) {
    validate(collection,id);if(!Number.isFinite(Date.parse(data.expiresAt)))throw fail('BETA_EXPIRY_INVALID');
    if(!isLocal())return cloud(collection,id,'write',data,{exists:false});
    purge();const key=collection+'/'+id;if(memory.has(key))throw fail('BETA_CONFLICT');
    if(memory.size>=10000)throw fail('BETA_STORAGE_CAPACITY');memory.set(key,structuredClone(data));
}
async function remove(collection,id) { validate(collection,id);if(isLocal()){memory.delete(collection+'/'+id);return;}await cloud(collection,id,'delete'); }
async function consume(id,limit,windowMs) {
    const collection='beta_limits_v1'; validate(collection,id);
    // No await between read/update in local mode: atomic within the single development process.
    if(isLocal()) {
        purge();const key=collection+'/'+id;const old=memory.get(key);const now=Date.now();
        const v=old && old.resetAt>now ? old : {count:0,resetAt:now+windowMs,expiresAt:new Date(now+windowMs*2).toISOString()};
        if(v.count>=limit)return false;if(memory.size>=10000&&!old)throw fail('BETA_STORAGE_CAPACITY');v.count++;memory.set(key,v);return true;
    }
    for(let attempt=0;attempt<6;attempt++) {
        const old=await readRaw(collection,id);const now=Date.now();
        const v=old && old.value.resetAt>now ? old.value : {count:0,resetAt:now+windowMs,expiresAt:new Date(now+windowMs*2).toISOString()};
        if(v.count>=limit)return false;v.count++;
        try{await cloud(collection,id,'write',v,old?{updateTime:old.version}:{exists:false});return true;}
        catch(e){if(e.code!=='BETA_CONFLICT')throw e;}
    }
    throw fail('BETA_LIMIT_UNAVAILABLE');
}
module.exports={read,create,remove,consume};
