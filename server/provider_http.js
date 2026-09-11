const {requireExternal,hash,fail}=require('./runtime_environment');
const {env}=require('./runtime_environment');
const storage=require('./secure_storage');
const allowed=new Set(['generativelanguage.googleapis.com','places.googleapis.com','www.googleapis.com','serpapi.com','nominatim.openstreetmap.org']);
function providerFetch(fetchImpl=fetch) {
    const deadline=Date.now()+30000;let calls=0;
    return async (url,options={})=>{
        requireExternal();const target=new URL(url);
        if(target.protocol!=='https:'||!allowed.has(target.hostname)||target.username||target.password)throw fail('BETA_DESTINATION_BLOCKED');
        if(++calls>16 || Date.now()>=deadline)throw fail('BETA_REQUEST_BUDGET');
        const day=new Date().toISOString().slice(0,10);
        const cap=Number(env('PROVIDER_CALLS_PER_DAY','BETA_PROVIDER_CALLS_PER_DAY')||1000);
        if(!Number.isInteger(cap)||cap<1||cap>10000)throw fail('BETA_BUDGET_CONFIG_INVALID');
        if(!await storage.consume(hash('provider:'+target.hostname+':'+day),cap,86400000))throw fail('BETA_DAILY_BUDGET');
        const controller=new AbortController();const abort=()=>controller.abort();
        if(options.signal?.aborted)abort();else options.signal?.addEventListener('abort',abort,{once:true});
        const timeout=setTimeout(abort,Math.max(1,Math.min(20000,deadline-Date.now())));const start=Date.now();
        try {
            const response=await fetchImpl(url,{...options,signal:controller.signal,redirect:'error'});
            // Buffer a bounded provider response inside the deadline, including the response body.
            let text='';
            if(response.body?.getReader){const reader=response.body.getReader();let bytes=0;const chunks=[];while(true){const part=await reader.read();if(part.done)break;bytes+=part.value.length;if(bytes>2*1024*1024){await reader.cancel();throw fail('BETA_RESPONSE_TOO_LARGE');}chunks.push(Buffer.from(part.value));}text=Buffer.concat(chunks).toString('utf8');}
            else text=await response.text();
            if(Buffer.byteLength(text)>2*1024*1024)throw fail('BETA_RESPONSE_TOO_LARGE');
            console.info(JSON.stringify({event:'provider_request',provider:target.hostname,status:response.status,durationMs:Date.now()-start}));
            return {ok:response.ok,status:response.status,headers:response.headers,text:async()=>text,json:async()=>JSON.parse(text)};
        } finally {clearTimeout(timeout);options.signal?.removeEventListener('abort',abort);}
    };
}
module.exports={providerFetch};
