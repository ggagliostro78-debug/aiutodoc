// The beta uses only the isolated adapter. Production collections and credentials are unsupported.
const storage=require('./beta_storage');
module.exports={getFirestoreAdmin:()=>({collection:name=>({doc:id=>({set:data=>storage.create(name,id,data),get:async()=>{const data=await storage.read(name,id);return {exists:!!data,data:()=>data};}})})})};
