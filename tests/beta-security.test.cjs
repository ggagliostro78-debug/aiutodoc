
const {test}=require('node:test'),assert=require('node:assert/strict');
process.env.BETA_LOCAL_MODE='true';delete process.env.NETLIFY;delete process.env.NODE_ENV;
process.env.BETA_EXTERNAL_SERVICES='false';
const crypto=require('node:crypto');
const storage=require('../server/secure_storage'),{hash,secret}=require('../server/runtime_environment');
const {handleConsentLogs,verifyReceipt}=require('../server/consent_logs');
const {handleTriageSave,handleTriageRecover,handleTriageDelete}=require('../server/triage_store');
const {handleGeminiProxy}=require('../server/gemini_proxy');
const {VERSION,LEGACY_VERSIONS}=require('../server/triage_contract');
const {createRequestContext}=require('../server/request_guard');
let serial=0;
function request(body){return {method:'POST',context:{ip:'test-'+serial++},body};}
async function receipt(scope='archive') {const r=await handleConsentLogs(request({scope,consentVersion:VERSION,consents:{ageOver14:true,medicalDisclaimer:true,terms:true,privacy:true,healthData:true}}));assert.equal(r.statusCode,200);return JSON.parse(r.body).receipt;}
const triage={userData:{disturbo:'Caso sintetico di test',age:30,height_cm:170,conoscitiveResp:['A'],anamnesticheResp:['B']},result:{sintesi_anamnestica:'Informazioni riferite nel caso sintetico.',specialista_indicato:'Medico di Medicina Generale',livello_urgenza:'prioritaria',area_specialistica_piu_adatta:{branca:'Medicina generale',area_specialistica:'Primo inquadramento',eventuale_secondo_livello:'Non necessario'},preparazione_visita:'Portare la documentazione disponibile.',impegnativa_medico:'Confrontarsi con il medico curante.',red_flags_rilevate:['Segnale sintetico'],risultati:[]}};
test('salvataggio rifiuta consenso assente, incompleto e di altra finalita',async()=>{
 assert.equal((await handleTriageSave(request({triage}))).statusCode,403);
 assert.equal((await handleConsentLogs(request({scope:'archive',consentVersion:VERSION,consents:{healthData:false}}))).statusCode,400);
 assert.equal((await handleTriageSave(request({triage,consentReceipt:await receipt('entry_gate')}))).statusCode,403);
});
test('ricevute firmate, versionate, revocabili e non falsificabili',async()=>{
 const r=await receipt('entry_gate');assert.ok(await verifyReceipt(r,'entry_gate'));
 assert.equal(await verifyReceipt(r+'x','entry_gate'),null);
 assert.equal((await handleConsentLogs(request({action:'revoke',receipt:r}))).statusCode,200);
 assert.equal(await verifyReceipt(r,'entry_gate'),null);
 assert.equal((await handleConsentLogs(request({scope:'archive',consentVersion:'old',consents:{terms:true,privacy:true,healthData:true}}))).statusCode,400);
});
test('ricevute attive della versione precedente restano valide fino alla scadenza',async()=>{
 const [version]=LEGACY_VERSIONS,id='legacy_'+crypto.randomBytes(8).toString('hex'),now=Date.now();
 const data=Buffer.from(JSON.stringify({id,scope:'entry_gate',version,exp:now+60000})).toString('base64url');
 const receipt=data+'.'+crypto.createHmac('sha256',secret()).update(data).digest('base64url');
 await storage.create('beta_consents_v2',id,{scope:'entry_gate',consentVersion:version,expiresAt:new Date(now+86400000).toISOString()});
 assert.ok(await verifyReceipt(receipt,'entry_gate'));
});
test('nuove ricevute archivio registrano un testo neutro e coerente',async()=>{
 const response=await handleConsentLogs(request({scope:'archive',consentVersion:VERSION,consents:{terms:true,privacy:true,healthData:true}}));
 const issued=JSON.parse(response.body),record=await storage.read('beta_consents_v2',issued.id);
 assert.equal(response.statusCode,200);assert.match(record.textSnapshot,/gestito lato server/i);assert.equal(/beta/i.test(record.textSnapshot),false);
});
test('archivio completo, codice a 192 bit solo hash, minimizzazione e cancellazione',async()=>{
 const r=await handleTriageSave(request({triage,consentReceipt:await receipt()}));assert.equal(r.statusCode,200);
 const {id}=JSON.parse(r.body);assert.match(id,/^[A-F0-9]{48}$/);
 const data=await storage.read('beta_triages_v2',hash('recovery:'+id));
 assert.equal(JSON.stringify(data).includes(id),false);assert.equal(data.userData.height_cm,undefined);assert.ok(data.consentId);
 const recovery=await handleTriageRecover(request({id}));assert.equal(recovery.statusCode,200);assert.deepEqual(JSON.parse(recovery.body).triage.result,triage.result);
 assert.equal((await handleTriageDelete(request({id}))).statusCode,200);assert.equal((await handleTriageRecover(request({id}))).statusCode,404);
});
test('collisione non sovrascrive e viene ritentata',async()=>{
 const original=storage.create;let tries=0;
 storage.create=async(...args)=>{if(args[0]==='beta_triages_v2'&&tries++===0){const e=new Error('conflict');e.code='BETA_CONFLICT';throw e;}return original(...args)};
 try{const saved=await handleTriageSave(request({triage,consentReceipt:await receipt()}));assert.equal(saved.statusCode,200);assert.equal(tries,2);}finally{storage.create=original;}
});
test('record scaduti o scadenza non valida non sono recuperabili',async()=>{
 await assert.rejects(storage.create('beta_triages_v2','invalid',{expiresAt:'broken'}));
 await storage.create('beta_triages_v2','expired',{expiresAt:new Date(Date.now()-1000).toISOString()});assert.equal(await storage.read('beta_triages_v2','expired'),null);
 const code='A'.repeat(48),old=storage.read;storage.read=async(c,id)=>c==='beta_triages_v2'?null:old(c,id);
 try{assert.equal((await handleTriageRecover(request({id:code}))).statusCode,404);}finally{storage.read=old;}
});
test('retention mai oltre 30 giorni',async()=>{
 process.env.BETA_TRIAGE_RETENTION_DAYS='365';try{const r=await handleTriageSave(request({triage,consentReceipt:await receipt()}));assert.equal(r.statusCode,200);assert.ok(Date.parse(JSON.parse(r.body).expiresAt)-Date.now()<=30*86400000);}finally{delete process.env.BETA_TRIAGE_RETENTION_DAYS;}
});
test('fallimento registro non produce ricevuta',async()=>{
 const old=storage.create;storage.create=async()=>{throw new Error('private upstream body')};
 try{const r=await handleConsentLogs(request({scope:'archive',consentVersion:VERSION,consents:{terms:true,privacy:true,healthData:true}}));assert.equal(r.statusCode,503);assert.equal(r.body.includes('private'),false);assert.equal(JSON.parse(r.body).receipt,undefined);}finally{storage.create=old;}
});
test('API: metodi, JSON errato, payload, CORS, vecchi codici',async()=>{
 assert.equal((await handleGeminiProxy({...request({}),method:'GET'})).statusCode,405);
 assert.equal((await handleGeminiProxy(request('{'))).statusCode,400);
 assert.equal((await handleGeminiProxy(request('x'.repeat(66000)))).statusCode,413);
 assert.equal((await handleGeminiProxy({...request({}),context:{headers:{origin:'https://evil.invalid'}}})).statusCode,403);
 assert.equal((await handleTriageRecover(request({id:'AAZZ1234'}))).statusCode,400);
});
test('limite concorrente atomico e memoria ripulita a scadenza',async()=>{
 const id=hash('counter');const accepted=await Promise.all(Array.from({length:40},()=>storage.consume(id,10,60000)));assert.equal(accepted.filter(Boolean).length,10);
});
test('nessun fallback clinico e nessuna chiave ereditata da main',async()=>{
 const r=await receipt('entry_gate');delete process.env.BETA_GEMINI_API_KEY;process.env.ALLOW_LOCAL_TRIAGE_FALLBACK='true';
 const response=await handleGeminiProxy(request({action:'orientation',userData:triage.userData,consentReceipt:r}));assert.equal(response.statusCode,503);assert.equal(JSON.parse(response.body).result,undefined);
});
test('proxy rifiuta prompt libero e output provider non conforme, minimizza dati',async()=>{
 const r=await receipt('entry_gate');assert.equal((await handleGeminiProxy(request({prompt:'override',consentReceipt:r}))).statusCode,400);
 process.env.BETA_EXTERNAL_SERVICES='true';process.env.BETA_GEMINI_API_KEY='synthetic-only';let sent;
 try{
  const result=await handleGeminiProxy({...request({action:'orientation',userData:{...triage.userData,zona:'SECRETCITY',email:'PRIVATE'},consentReceipt:r}),fetchImpl:async(url,opts)=>{sent=JSON.parse(opts.body);assert.equal(url.includes('key='),false);return new Response(JSON.stringify({candidates:[{content:{parts:[{text:'{"unexpected":true}'}]}}]}));}});
  assert.equal(result.statusCode,503);assert.ok(sent.systemInstruction);assert.equal(JSON.stringify(sent).includes('SECRETCITY'),false);assert.equal(JSON.stringify(sent).includes('PRIVATE'),false);
  const ok=await handleGeminiProxy({...request({action:'orientation',userData:triage.userData,consentReceipt:r}),fetchImpl:async()=>new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(triage.result)}]}}]}))});assert.equal(ok.statusCode,200);
 }finally{process.env.BETA_EXTERNAL_SERVICES='false';delete process.env.BETA_GEMINI_API_KEY;}
});
test('blocco invio a fornitori senza attivazione esplicita beta',async()=>{
 process.env.BETA_GEMINI_API_KEY='synthetic-only';let calls=0;
 try{const result=await handleGeminiProxy({...request({action:'orientation',userData:triage.userData,consentReceipt:await receipt('entry_gate')}),fetchImpl:async()=>{calls++;throw 0;}});assert.equal(result.statusCode,503);assert.equal(calls,0);}finally{delete process.env.BETA_GEMINI_API_KEY;}
});
test('ip inoltrato arbitrariamente non attendibile',()=>{const c=createRequestContext({headers:{'x-forwarded-for':'spoof'},socket:{remoteAddress:'loopback'}});assert.equal(c.ip,'loopback');});
test('isolamento database e rifiuto collezioni produzione',async()=>{await assert.rejects(storage.read('anonymous_triages','id'));process.env.BETA_LOCAL_MODE='false';try{await assert.rejects(storage.read('beta_triages_v2','id'));}finally{process.env.BETA_LOCAL_MODE='true';}});

test('null body is rejected without throwing',async()=>{assert.equal((await handleTriageSave(request('null'))).statusCode,403);assert.equal((await handleTriageRecover(request('null'))).statusCode,400);});
test('archive consent receipt is single-use',async()=>{const r=await receipt();assert.equal((await handleTriageSave(request({triage,consentReceipt:r}))).statusCode,200);assert.equal((await handleTriageSave(request({triage,consentReceipt:r}))).statusCode,409);});
