
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {privateKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048,privateKeyEncoding:{type:'pkcs8',format:'pem'},publicKeyEncoding:{type:'spki',format:'pem'}});
process.env.BETA_LOCAL_MODE='false';process.env.BETA_EXTERNAL_SERVICES='true';process.env.BETA_FIREBASE_PROJECT_ID='synthetic-audit-beta';
process.env.BETA_FIREBASE_SERVICE_ACCOUNT_JSON=JSON.stringify({project_id:'synthetic-audit-beta',client_email:'synthetic@example.invalid',private_key:privateKey});
const storage=require('../server/beta_storage');
test('cloud uses beta project and create-if-absent; never upsert',async()=>{
 const old=global.fetch;let write;
 global.fetch=async(url,opts)=>{assert.ok(!url.includes('/anonymous_triages/'));if(url.includes('oauth2'))return new Response(JSON.stringify({access_token:'synthetic',expires_in:3600}));write=JSON.parse(opts.body).writes[0];return new Response('{}');};
 try{await storage.create('beta_triages_v2','sample',{expiresAt:new Date(Date.now()+60000).toISOString()});assert.deepEqual(write.currentDocument,{exists:false});assert.ok(write.update.name.includes('synthetic-audit-beta'));assert.ok(write.update.fields.expiresAt.timestampValue);}finally{global.fetch=old;}
});
test('cloud counter uses CAS, retries conflict, honors exhaustion',async()=>{
 const old=global.fetch;let commits=0,version=0,count=0;
 global.fetch=async(url,opts)=>{
  if(url.includes('oauth2'))return new Response(JSON.stringify({access_token:'synthetic',expires_in:3600}));
  if(!opts.method)return new Response(JSON.stringify({fields:{payloadJson:{stringValue:JSON.stringify({count,resetAt:Date.now()+60000,expiresAt:new Date(Date.now()+120000).toISOString()})}},updateTime:'v'+version}));
  const w=JSON.parse(opts.body).writes[0];assert.equal(w.currentDocument.updateTime,'v'+version);commits++;
  if(commits===1)return new Response('{}',{status:409});count=JSON.parse(w.update.fields.payloadJson.stringValue).count;version++;return new Response('{}');
 };
 try{assert.equal(await storage.consume('shared-counter',1,60000),true);assert.equal(commits,2);assert.equal(await storage.consume('shared-counter',1,60000),false);}finally{global.fetch=old;}
});
test('production account rejected before any network call',async()=>{
 const old=process.env.BETA_FIREBASE_PROJECT_ID;process.env.BETA_FIREBASE_PROJECT_ID='production';const f=global.fetch;let calls=0;global.fetch=async()=>{calls++;throw 0};
 try{await assert.rejects(storage.read('beta_triages_v2','sample'));assert.equal(calls,0);}finally{process.env.BETA_FIREBASE_PROJECT_ID=old;global.fetch=f;}
});
