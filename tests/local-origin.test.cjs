const {test}=require('node:test');
const assert=require('node:assert/strict');
const {validateOrigin}=require('../server/request_guard');

test('local origin follows the configured port; production remains restricted',()=>{
 const keys=['BETA_LOCAL_MODE','BETA_PORT','BETA_ALLOWED_ORIGIN','NETLIFY','NODE_ENV'];
 const previous=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
 const origin=value=>validateOrigin({headers:{origin:value}});
 try {
  process.env.BETA_LOCAL_MODE='true';delete process.env.NETLIFY;delete process.env.NODE_ENV;delete process.env.BETA_PORT;
  assert.equal(origin('http://127.0.0.1:4284'),null);
  assert.equal(origin('http://localhost:4284'),null);
  assert.equal(origin('http://127.0.0.1:4274').statusCode,403);
  assert.equal(origin('https://example.com').statusCode,403);
  process.env.BETA_PORT='4384';
  assert.equal(origin('http://127.0.0.1:4384'),null);
  assert.equal(origin('http://127.0.0.1:4284').statusCode,403);
  process.env.NETLIFY='true';process.env.BETA_ALLOWED_ORIGIN='https://aiutodoc.it';
  assert.equal(origin('https://aiutodoc.it'),null);
  assert.equal(origin('http://127.0.0.1:4384').statusCode,403);
 } finally {
  for(const key of keys)if(previous[key]===undefined)delete process.env[key];else process.env[key]=previous[key];
 }
});
