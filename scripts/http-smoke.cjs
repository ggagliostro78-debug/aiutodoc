
const assert=require('node:assert/strict');
const base=process.env.AIUTODOC_BASE_URL || 'http://127.0.0.1:4284';
async function post(path,body){return fetch(base+'/api/'+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify(body)})}
(async()=>{
 for(const url of ['/','/src/session_client.js','/privacy-policy/'])assert.equal((await fetch(base+url)).status,200);
 for(const url of ['/.env','/server/secure_storage.js','/.git/config','/src/..%2Fserver/secure_storage.js'])assert.equal((await fetch(base+url)).status,404);
 assert.equal((await fetch(base+'/api/gemini')).status,405);
 assert.equal((await post('triage-save',{})).status,403);
 const consent=await post('consent-logs',{scope:'archive',consentVersion:'2026-09-08-v2',consents:{terms:true,privacy:true,healthData:true}});assert.equal(consent.status,200);
 const {receipt}=await consent.json();
 const triage={userData:{disturbo:'Caso sintetico per verifica interfaccia',conoscitiveResp:[],anamnesticheResp:[]},result:{sintesi_anamnestica:'CASO INVENTATO: verifica tecnica del recupero. Nessuna valutazione sanitaria reale.',specialista_indicato:'Medico di Medicina Generale',livello_urgenza:'prioritaria',area_specialistica_piu_adatta:{branca:'Medicina generale',area_specialistica:'Verifica interfaccia',eventuale_secondo_livello:'Non necessario'},red_flags_rilevate:['Segnale sintetico di prova'],preparazione_visita:'Test della conservazione del risultato.',impegnativa_medico:'Test senza indicazioni cliniche.',risultati:[]}};
 const saved=await post('triage-save',{triage,consentReceipt:receipt});assert.equal(saved.status,200);const {id}=await saved.json();
 assert.equal((await post('triage-save',{triage,consentReceipt:receipt})).status,409);
 const recovered=await post('triage-recover',{id});assert.equal(recovered.status,200);assert.deepEqual((await recovered.json()).triage.result,triage.result);
 assert.equal((await post('triage-delete',{id})).status,200);
 assert.equal((await post('triage-recover',{id})).status,404);
 console.log('HTTP smoke passed: static allowlist, API, consent, single-use, round-trip and deletion. No recovery code persisted.');
})().catch(e=>{console.error(e);process.exitCode=1});
