const crypto=require('node:crypto');
const storage=require('./beta_storage');const {secret,hash}=require('./beta_environment');
const {VERSION,DOCUMENTS}=require('./beta_contract');
const {validateBodySize,enforceRateLimit,validateOrigin}=require('./request_guard');
const COLLECTION='beta_consents_v2';
const snapshots={entry_gate:'Consenso esplicito al trattamento per orientamento informativo; disclaimer medico; termini; verifica eta.',archive:'Consenso esplicito al salvataggio facoltativo dei dati sanitari per massimo 30 giorni e recupero tramite codice. Beta locale: archivio volatile, cancellato al riavvio.',cookie_banner:'Cookie necessari; analytics facoltativi e disattivati nella beta; marketing non utilizzato.'};
function response(statusCode,payload){return {statusCode,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'},body:JSON.stringify(payload)};}
function sign(value){return crypto.createHmac('sha256',secret()).update(value).digest('base64url');}
async function verifyReceipt(receipt,scope){
 try {
  if(typeof receipt!=='string'||receipt.length>2048)return null;
  const [data,sig,...rest]=receipt.split('.');if(!sig||rest.length)return null;
  const expected=Buffer.from(sign(data));const received=Buffer.from(sig);if(expected.length!==received.length||!crypto.timingSafeEqual(expected,received))return null;
  const p=JSON.parse(Buffer.from(data,'base64url').toString());
  if(p.scope!==scope||p.version!==VERSION||!Number.isFinite(p.exp)||p.exp<=Date.now())return null;
  const record=await storage.read(COLLECTION,p.id);
  if(!record||record.scope!==scope||record.consentVersion!==VERSION)return null;
  return {id:p.id,scope,version:p.version};
 }catch{return null;}
}
async function handleConsentLogs({method,body,context={}}){
 const origin=validateOrigin(context);if(origin)return response(origin.statusCode,origin.payload);
 if(method==='OPTIONS')return response(204,{});if(method!=='POST')return response(405,{error:'Metodo non consentito.'});
 const guard=validateBodySize(body,16384)||await enforceRateLimit(context.ip||'anonymous',{scope:'consents',limit:20});if(guard)return {...response(guard.statusCode,guard.payload),headers:{...response(guard.statusCode,{}).headers,...guard.headers}};
 let p;try{p=typeof body==='string'?JSON.parse(body):body;if(!p||typeof p!=='object')throw 0;}catch{return response(400,{error:'Richiesta non valida.'});}
 if(p.action==='revoke'){
  const r=await verifyReceipt(p.receipt,'entry_gate');if(!r)return response(403,{error:'Ricevuta non valida o scaduta.'});
  try{await storage.remove(COLLECTION,r.id);return response(200,{ok:true});}catch{return response(503,{error:'Revoca temporaneamente non disponibile.'});}
 }
 const scope=p.scope,c=p.consents||{};
 const required=scope==='entry_gate'?['ageOver14','medicalDisclaimer','terms','healthData']:scope==='archive'?['terms','privacy','healthData']:[];
 if(!snapshots[scope]||p.consentVersion!==VERSION||required.some(k=>c[k]!==true)||(scope==='cookie_banner'&&typeof c.analytics!=='boolean'))return response(400,{error:'Consensi o versione non validi.'});
 const id=crypto.randomBytes(24).toString('hex'),now=Date.now();
 const flags=scope==='cookie_banner'?{necessary:true,analytics:c.analytics===true}:Object.fromEntries(required.map(k=>[k,true]));
 const record={scope,consents:flags,consentVersion:VERSION,documentVersions:DOCUMENTS,textSnapshot:snapshots[scope],createdAt:new Date(now).toISOString(),expiresAt:new Date(now+30*86400000).toISOString(),schemaVersion:2};
 try{
  await storage.create(COLLECTION,id,record);
  const data=Buffer.from(JSON.stringify({id,scope,version:VERSION,exp:now+30*60000})).toString('base64url');
  return response(200,{ok:true,id,receipt:data+'.'+sign(data),expiresAt:new Date(now+30*60000).toISOString()});
 }catch{return response(503,{error:'Registro consensi temporaneamente non disponibile.'});}
}
module.exports={handleConsentLogs,verifyReceipt};
