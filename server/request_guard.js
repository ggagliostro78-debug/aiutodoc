const {hash,isLocal}=require('./beta_environment');
const {env}=require('./beta_environment');
const storage=require('./beta_storage');
function createRequestContext(event={}) {
 const headers=Object.fromEntries(Object.entries(event.headers||{}).map(([k,v])=>[k.toLowerCase(),v]));
 return {headers,ip:isLocal()?(event.socket?.remoteAddress||event.ip||'local'):(headers['x-nf-client-connection-ip']||'unknown')};
}
function validateBodySize(body,maxBytes=65536){try{if(Buffer.byteLength(typeof body==='string'?body:JSON.stringify(body||{}))<=maxBytes)return null;}catch{}return {statusCode:413,payload:{error:'Payload troppo grande.'}};}
function truncateText(value,maxLength=4000){return String(value||'').replace(/\s+/g,' ').trim().slice(0,maxLength);}
function validateOrigin(context={}) {
 const origin=context.headers?.origin||context.headers?.Origin;
 if(!origin)return null;
 const localPort=Number(env('AIUTODOC_PORT','PORT','BETA_PORT') || 4284);
 const productionOrigins = [
  env('AIUTODOC_ALLOWED_ORIGIN','GEMINI_ALLOWED_ORIGIN','SEARCH_ALLOWED_ORIGIN','BETA_ALLOWED_ORIGIN'),
  'https://aiutodoc.it',
  'https://www.aiutodoc.it'
 ].filter(Boolean);
 const origins=isLocal()?[`http://127.0.0.1:${localPort}`,`http://localhost:${localPort}`]:productionOrigins;
 if(origins.includes(origin))return null;
 return {statusCode:403,payload:{error:'Origine non consentita.'}};
}
async function enforceRateLimit(key,options={}) {
 const limit=Number(options.limit||20),windowMs=Number(options.windowMs||60000);
 try {
  if(!Number.isInteger(limit)||limit<1||limit>1000||!Number.isFinite(windowMs)||windowMs<1000)throw new Error('CONFIG');
  const accepted=await storage.consume(hash('rate:'+options.scope+':'+key),limit,windowMs);
  return accepted?null:{statusCode:429,payload:{error:'Troppe richieste. Riprova tra poco.'},headers:{'Retry-After':String(Math.ceil(windowMs/1000))}};
 }catch{return {statusCode:503,payload:{error:'Protezione richieste temporaneamente non disponibile.'}};}
}
module.exports={createRequestContext,validateBodySize,truncateText,enforceRateLimit,validateOrigin};
