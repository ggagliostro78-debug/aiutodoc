const crypto=require('node:crypto');const storage=require('./secure_storage');
const {hash,isLocal}=require('./runtime_environment');const contract=require('./triage_contract');
const {verifyReceipt}=require('./consent_logs');const {validateBodySize,validateOrigin,enforceRateLimit}=require('./request_guard');
const COLLECTION='beta_triages_v2';
function normalizeRecoveryCode(v){return String(v||'').toUpperCase().replace(/[\s-]/g,'');}
function normalizeUserCodePrefix(v){return String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,2);}
function generateRecoveryCode(){return crypto.randomBytes(24).toString('hex').toUpperCase();}
function response(statusCode,payload,headers={}){return {statusCode,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers},body:JSON.stringify(payload)};}
async function guard(method,body,context,scope){
 const g=validateOrigin(context)||validateBodySize(body,scope==='save'?81920:8192)||await enforceRateLimit(context.ip||'anonymous',{scope:'triage-'+scope,limit:10});
 if(g)return response(g.statusCode,g.payload,g.headers);
 if(method==='OPTIONS')return response(204,{});if(method!=='POST')return response(405,{error:'Metodo non consentito.'});return null;
}
function parse(body){try{const p=typeof body==='string'?JSON.parse(body):body;return p&&typeof p==='object'&&!Array.isArray(p)?p:{};}catch{return {};}}
async function handleTriageSave({method,body,context={}}){
 const denied=await guard(method,body,context,'save');if(denied)return denied;
 const p=parse(body);const consent=await verifyReceipt(p.consentReceipt,'archive');if(!consent)return response(403,{error:'Consenso al salvataggio mancante, scaduto o non valido.'});
 let triage;try{
  const t=p.triage||{};const userData=contract.input(t.userData);delete userData.height_cm;
  triage={date:new Date().toISOString(),userData,result:{...contract.result(t.result),risultati:contract.cards(t.result.risultati)},source:'beta',schemaVersion:2,consentId:consent.id,consentVersion:consent.version};
 }catch{return response(400,{error:'Dati orientamento incompleti o non validi.'});}
 const configured=Number((process.env.TRIAGE_RETENTION_DAYS||process.env.BETA_TRIAGE_RETENTION_DAYS)||30);const days=Number.isInteger(configured)&&configured>0?Math.min(configured,30):30;
 const expiresAt=new Date(Date.now()+days*86400000).toISOString();
 const claim='used_'+consent.id;
 try{await storage.create('beta_consents_v2',claim,{expiresAt,scope:'archive_claim'});}catch(e){return response(e.code==='BETA_CONFLICT'?409:503,{error:'Richiedi una nuova ricevuta di consenso al salvataggio.'});}
 for(let attempt=0;attempt<3;attempt++){
  const code=generateRecoveryCode();
  try{await storage.create(COLLECTION,hash('recovery:'+code),{...triage,expiresAt});return response(200,{id:code,recoveryCode:code,expiresAt,storageMode:isLocal()?'volatile':'cloud'});}
  catch(e){if(e.code==='BETA_CONFLICT')continue;await storage.remove('beta_consents_v2',claim).catch(()=>{});return response(503,{error:'Archivio temporaneamente non disponibile.'});}
 }
 await storage.remove('beta_consents_v2',claim).catch(()=>{});
 return response(503,{error:'Impossibile generare il codice. Riprova.'});
}
async function recover({method,body,context={}},remove=false){
 const denied=await guard(method,body,context,'recover');if(denied)return denied;
 const p=parse(body),code=normalizeRecoveryCode(p.id||p.recoveryCode);
 if(!/^[A-F0-9]{48}$/.test(code))return response(400,{error:'Codice di recupero non valido.'});
 try{
  const id=hash('recovery:'+code),t=await storage.read(COLLECTION,id);
  if(!t)return response(404,{error:'Codice non trovato o scaduto.'});
  if(remove){await storage.remove(COLLECTION,id);if(t.consentId){await storage.remove('beta_consents_v2',t.consentId);await storage.remove('beta_consents_v2','used_'+t.consentId);}return response(200,{ok:true});}
  if(t.schemaVersion!==2)return response(409,{error:'Versione archivio non supportata.'});
  const {consentId,...safe}=t;return response(200,{triage:{...safe,id:code}});
 }catch{return response(503,{error:'Archivio temporaneamente non disponibile.'});}
}
module.exports={handleTriageSave,handleTriageRecover:args=>recover(args),handleTriageDelete:args=>recover(args,true),generateRecoveryCode,normalizeRecoveryCode,normalizeUserCodePrefix};
