(function(){
 'use strict';
 window.AIUTODOC_OFFLINE_CACHE_DISABLED=true;
 window.AIUTODOC_ANALYTICS_ID='';
 const VERSION='2026-09-11-v3',KEY='aiutodoc_entry_receipt',LEGACY_KEY='aiutodoc_beta_entry_receipt',ENTRY_CONSENT_KEY='aiutodoc_entry_consents',LEGACY_ENTRY_CONSENT_KEY='aiutodoc_beta_entry_consents';
 function migrateSessionKey(legacyKey,key){try{const legacyValue=sessionStorage.getItem(legacyKey);if(sessionStorage.getItem(key)===null&&legacyValue!==null)sessionStorage.setItem(key,legacyValue);sessionStorage.removeItem(legacyKey);}catch{return;}}
 migrateSessionKey(LEGACY_KEY,KEY);migrateSessionKey(LEGACY_ENTRY_CONSENT_KEY,ENTRY_CONSENT_KEY);
 const rawFetch=window.fetch.bind(window),active=new Set();
 window.aiutodocEntryReceipt=function(){try{const r=JSON.parse(sessionStorage.getItem(KEY)||'null');return r&&Date.parse(r.expiresAt)>Date.now()?r.receipt:'';}catch{return '';}};
 window.aiutodocRegisterConsent=async function(scope,consents){
  const response=await window.fetch('/api/consent-logs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scope,consents,consentVersion:VERSION})});
  if(!response.ok)throw new Error('Il consenso non e stato registrato. Riprova prima di proseguire.');
  const r=await response.json();if(!r.receipt)throw new Error('Ricevuta consenso non disponibile.');
  if(scope==='entry_gate')sessionStorage.setItem(KEY,JSON.stringify(r));return r;
 };
 window.aiutodocAbortRequests=function(){for(const c of active)c.abort();active.clear();};
 window.fetch=async function(url,options={}){
  const target=new URL(typeof url==='string'?url:url.url,location.href);
  if(target.origin!==location.origin)return rawFetch(url,options);
  if(!target.pathname.startsWith('/api/'))return rawFetch(url,options);
  let body=options.body;
  if(target.pathname==='/api/gemini'&&typeof body==='string'){
   const p=JSON.parse(body);p.consentReceipt=window.aiutodocEntryReceipt();
   if(!p.consentReceipt){const modal=document.getElementById('privacy-modal');if(modal){modal.style.display='flex';modal.classList.remove('hidden');}throw new Error('Consenso scaduto: conferma nuovamente per continuare.');}
   body=JSON.stringify(p);
  }
  const controller=new AbortController();active.add(controller);
  const abort=()=>controller.abort();if(options.signal?.aborted)abort();else options.signal?.addEventListener('abort',abort,{once:true});
  const timer=setTimeout(abort,target.pathname==='/api/gemini'?35000:16000);
  try{
   const response=await rawFetch(url,{...options,body,signal:controller.signal});
   if(response.status===403&&target.pathname==='/api/gemini'){sessionStorage.removeItem(KEY);const modal=document.getElementById('privacy-modal');if(modal){modal.style.display='flex';modal.classList.remove('hidden');}}
   const buffered=await response.arrayBuffer();return new Response(buffered,{status:response.status,statusText:response.statusText,headers:response.headers});
  }finally{clearTimeout(timer);active.delete(controller);options.signal?.removeEventListener('abort',abort);}
 };
 window.aiutodocEndSession=async function(){
  const receipt=window.aiutodocEntryReceipt();window.aiutodocAbortRequests();
  let revoked=true;try{if(receipt){const r=await window.fetch('/api/consent-logs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'revoke',receipt})});revoked=r.ok;}}catch{revoked=false;}
  if(!revoked)alert('La sessione locale verra chiusa. Il server non ha confermato la revoca: la ricevuta scade comunque entro 30 minuti.');
  for(const key of [KEY,LEGACY_KEY,ENTRY_CONSENT_KEY,LEGACY_ENTRY_CONSENT_KEY])sessionStorage.removeItem(key);
  if(window.clearSessionTriages)window.clearSessionTriages();window._currentTriageData=null;window._pendingTriageSave=null;location.reload();
 };
 document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('end-session')?.addEventListener('click',window.aiutodocEndSession);
  document.addEventListener('click',async event=>{
   const button=event.target.closest('[data-archive-delete]');if(!button)return;
   button.disabled=true;
   try{const response=await window.fetch('/api/triage-delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:button.dataset.archiveDelete})});if(!response.ok)throw 0;window._currentTriageData=null;if(window.clearSessionTriages)window.clearSessionTriages();button.textContent='Ricerca cancellata';document.getElementById('printable-area')?.replaceChildren(document.createTextNode('Ricerca cancellata.'));
   }catch{button.disabled=false;button.textContent='Cancellazione non riuscita: riprova';}
  });
 });
})();
