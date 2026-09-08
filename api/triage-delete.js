const {handleTriageDelete}=require('../server/triage_store');
const {createRequestContext}=require('../server/request_guard');
module.exports=async(req,res)=>{const r=await handleTriageDelete({method:req.method,body:req.body,context:createRequestContext(req)});for(const [k,v] of Object.entries(r.headers))res.setHeader(k,v);res.status(r.statusCode).send(r.body);};
