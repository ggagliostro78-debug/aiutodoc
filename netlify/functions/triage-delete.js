const {handleTriageDelete}=require('../../server/triage_store');
const {createRequestContext}=require('../../server/request_guard');
exports.handler=async event=>handleTriageDelete({method:event.httpMethod,body:event.body,context:createRequestContext(event)});
