(function(){
 'use strict';
 window.AIUTODOC_BETA=true;
 window.AIUTODOC_ANALYTICS_ID='';
 const VERSION='2026-09-08-beta-v2',KEY='aiutodoc_beta_entry_receipt';
 const rawFetch=window.fetch.bind(window),active=new Set();
 window.betaEntryReceipt=function(){try{const r=JSON.parse(sessionStorage.getItem(KEY)||'null');return r&&Date.parse(r.expiresAt)>Date.now()?r.receipt:'';}catch{return '';}};
 window.betaRegisterConsent=async function(scope,consents){
  const response=await window.fetch('/api/consent-logs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scope,consents,consentVersion:VERSION})});
  if(!response.ok)throw new Error('Il consenso non e stato registrato. Riprova prima di proseguire.');
  const r=await response.json();if(!r.receipt)throw new Error('Ricevuta consenso non disponibile.');
  if(scope==='entry_gate')sessionStorage.setItem(KEY,JSON.stringify(r));return r;
 };
 window.betaAbortRequests=function(){for(const c of active)c.abort();active.clear();};
 window.fetch=async function(url,options={}){
  const target=new URL(typeof url==='string'?url:url.url,location.href);
  if(target.origin!==location.origin)return rawFetch(url,options);
  if(!target.pathname.startsWith('/api/'))return rawFetch(url,options);
  let body=options.body;
  if(target.pathname==='/api/gemini'&&typeof body==='string'){
   const p=JSON.parse(body);p.consentReceipt=window.betaEntryReceipt();
   if(!p.consentReceipt){const modal=document.getElementById('privacy-modal');if(modal){modal.style.display='flex';modal.classList.remove('hidden');}throw new Error('Consenso scaduto: conferma nuovamente per continuare.');}
   body=JSON.stringify(p);
  }
  const controller=new AbortController();active.add(controller);
  const abort=()=>controller.abort();if(options.signal?.aborted)abort();else options.signal?.addEventListener('abort',abort,{once:true});
  const timer=setTimeout(abort,target.pathname==='/api/gemini'?35000:16000);
  try{
   const response=await rawFetch(url,{...options,body,signal:controller.signal});
   if(response.status===403 && target.pathname==='/api/gemini'){sessionStorage.removeItem(KEY);const modal=document.getElementById('privacy-modal');if(modal){modal.style.display='flex';modal.classList.remove('hidden');}}
   const buffered=await response.arrayBuffer();return new Response(buffered,{status:response.status,statusText:response.statusText,headers:response.headers});
  }finally{clearTimeout(timer);active.delete(controller);options.signal?.removeEventListener('abort',abort);}
 };
 window.betaEndSession=async function(){
  const receipt=window.betaEntryReceipt();window.betaAbortRequests();
  let revoked=true;try{if(receipt){const r=await window.fetch('/api/consent-logs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'revoke',receipt})});revoked=r.ok;}}catch{revoked=false;}
  if(!revoked)alert('La sessione locale verra chiusa. Il server non ha confermato la revoca: la ricevuta scade comunque entro 30 minuti.');
  sessionStorage.removeItem(KEY);sessionStorage.removeItem('aiutodoc_beta_entry_consents');
  if(window.clearBetaTriages)window.clearBetaTriages();window._currentTriageData=null;window._pendingTriageSave=null;location.reload();
 };
 document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('beta-end-session')?.addEventListener('click',window.betaEndSession);
  document.addEventListener('click',async event=>{
   const button=event.target.closest('[data-beta-delete]');if(!button)return;
   button.disabled=true;
   try{const response=await window.fetch('/api/triage-delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:button.dataset.betaDelete})});if(!response.ok)throw 0;window._currentTriageData=null;if(window.clearBetaTriages)window.clearBetaTriages();button.textContent='Ricerca cancellata';document.getElementById('printable-area')?.replaceChildren(document.createTextNode('Ricerca cancellata.'));
   }catch{button.disabled=false;button.textContent='Cancellazione non riuscita: riprova';}
  });
 });
})();
