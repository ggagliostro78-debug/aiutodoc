
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function analytics(preferences=null,id='TEST-BETA'){
 const events=[],scripts=[];const window={AIUTODOC_ANALYTICS_ID:id,localStorage:{getItem:()=>JSON.stringify(preferences)},gtag:(...v)=>events.push(v)};
 vm.runInNewContext(fs.readFileSync('src/ga_bootstrap.js','utf8'),{window,document:{querySelector:()=>null,createElement:()=>({dataset:{}}),head:{appendChild:x=>scripts.push(x)}},Date,JSON,Number,encodeURIComponent});return {window,events,scripts};
}
test('analytics accept/revoke/accept restores granted',()=>{const a=analytics();a.window.aiutodocSetAnalyticsConsent(true);a.window.aiutodocSetAnalyticsConsent(false);a.window.aiutodocSetAnalyticsConsent(true);assert.equal(a.events.filter(x=>x[0]==='consent').at(-1)[2].analytics_storage,'granted');assert.equal(a.scripts.length,1);});
test('expired or malformed preference never loads analytics',()=>{for(const expiresAt of ['broken',new Date(0).toISOString(),undefined])assert.equal(analytics({analytics:true,expiresAt}).scripts.length,0);});
test('beta has no analytics property, even after consent',()=>{const a=analytics(null,'');a.window.aiutodocSetAnalyticsConsent(true);assert.equal(a.scripts.length,0);});
test('API timeout wrapper fails on HTTP consent error',async()=>{
 const window={fetch:async()=>new Response('{}',{status:503})};const data=new Map();const sessionStorage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 vm.runInNewContext(fs.readFileSync('src/beta_client.js','utf8'),{window,document:{addEventListener:()=>{}},location:{href:'http://127.0.0.1:4274/',origin:'http://127.0.0.1:4274'},sessionStorage,URL,Response,AbortController,setTimeout,clearTimeout});
 await assert.rejects(window.betaRegisterConsent('entry_gate',{}));assert.equal(data.size,0);
});
