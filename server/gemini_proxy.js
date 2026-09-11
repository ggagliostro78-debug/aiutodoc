const contract=require('./triage_contract');const {verifyReceipt}=require('./consent_logs');
const {validateBodySize,validateOrigin,enforceRateLimit}=require('./request_guard');
const {providerFetch}=require('./provider_http');
const {env, externalEnabled}=require('./runtime_environment');
const TRIAGE_RESPONSE_SCHEMA = {
    type: "OBJECT",
    required: ["sintesi_anamnestica", "specialista_indicato", "livello_urgenza", "area_specialistica_piu_adatta", "preparazione_visita", "impegnativa_medico", "red_flags_rilevate"],
    properties: {
        sintesi_anamnestica: { type: "STRING" },
        specialista_indicato: { type: "STRING" },
        livello_urgenza: { type: "STRING", enum: ["programmata", "prioritaria", "urgente", "emergenza", "da chiarire con il medico"] },
        area_specialistica_piu_adatta: {
            type: "OBJECT",
            required: ["branca", "area_specialistica", "eventuale_secondo_livello"],
            properties: {
                branca: { type: "STRING" },
                area_specialistica: { type: "STRING" },
                eventuale_secondo_livello: { type: "STRING" }
            }
        },
        preparazione_visita: { type: "STRING" },
        impegnativa_medico: { type: "STRING" },
        red_flags_rilevate: { type: "ARRAY", items: { type: "STRING" } }
    }
};

const SYMPTOM_VALIDATION_RESPONSE_SCHEMA = {
    type: "OBJECT",
    required: ["is_medical_request", "is_possible_emergency"],
    properties: {
        is_medical_request: { type: "BOOLEAN" },
        is_possible_emergency: { type: "BOOLEAN" }
    }
};


function response(statusCode,payload,headers={}){return {statusCode,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers},body:JSON.stringify(payload)};}
async function handleGeminiProxy({method,body,context={},fetchImpl=fetch}){
 const g=validateOrigin(context);if(g)return response(g.statusCode,g.payload);
 if(method==='OPTIONS')return response(204,{});if(method!=='POST')return response(405,{error:'Metodo non consentito.'});
 const guard=validateBodySize(body)||await enforceRateLimit(context.ip||'anonymous',{scope:'gemini',limit:20});if(guard)return response(guard.statusCode,guard.payload,guard.headers);
 let p;try{p=typeof body==='string'?JSON.parse(body):body;if(!p||typeof p!=='object'||p.prompt!==undefined)throw 0;}catch{return response(400,{error:'Usa dati strutturati, non un prompt libero.'});}
 if(!await verifyReceipt(p.consentReceipt,'entry_gate'))return response(403,{error:'Conferma nuovamente il consenso prima di continuare.',code:'CONSENT_REQUIRED'});
 const validation=p.action==='validate_symptom';let data;
 try{
  if(validation)data={disturbo:contract.text(p.symptom,1200,true)};
  else {if(p.action!=='orientation')throw 0;data=contract.input(p.userData);}
 }catch{return response(400,{error:'Dati non validi o troppo lunghi.'});}
 if(!externalEnabled())return response(503,{error:'Servizio di orientamento temporaneamente non disponibile.',code:'EXTERNAL_DISABLED'});
 const key=env('GEMINI_API_KEY','BETA_GEMINI_API_KEY');
 if(!key)return response(503,{error:'Servizio di orientamento temporaneamente non disponibile.',code:'CONFIG_REQUIRED'});
 try{
  const call=providerFetch(fetchImpl);
  const upstream=await call('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',{
   method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},
   body:JSON.stringify({systemInstruction:{parts:[{text:contract.INSTRUCTIONS+(validation?' Classifica se il testo e sanitario e se contiene possibili segnali urgenti attuali; non dedurre gravita da dati mancanti.':'')}]},contents:[{role:'user',parts:[{text:JSON.stringify(data)}]}],generationConfig:{temperature:0.2,maxOutputTokens:4096,responseMimeType:'application/json',responseSchema:validation?SYMPTOM_VALIDATION_RESPONSE_SCHEMA:TRIAGE_RESPONSE_SCHEMA}})
  });
  if(!upstream.ok)throw 0;const output=await upstream.json();const raw=(output.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join('');
  const parsed=JSON.parse(raw);let result;
  if(validation){if(typeof parsed.is_medical_request!=='boolean'||typeof parsed.is_possible_emergency!=='boolean')throw 0;result={is_medical_request:parsed.is_medical_request,is_possible_emergency:parsed.is_possible_emergency};}
  else { if(!['programmata','prioritaria','urgente','emergenza','da chiarire con il medico'].includes(parsed.livello_urgenza))throw 0;result=contract.result(parsed); }
  return response(200,{result});
 }catch{return response(503,{error:'Orientamento automatico temporaneamente non disponibile. Per assistenza rivolgiti al medico; in emergenza chiama il 112/118.',code:'GEMINI_UNAVAILABLE'});}
}
module.exports={handleGeminiProxy};
