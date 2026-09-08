const {execFileSync}=require('node:child_process');const path=require('node:path');
const branch=execFileSync('git',['branch','--show-current'],{cwd:path.resolve(__dirname,'../..'),encoding:'utf8'}).trim();
if(!branch.startsWith('codex/aiutodoc-beta')||process.env.AIUTODOC_ENV==='live'||(process.env.AIUTODOC_BASE_URL&&!/^http:\/\/(?:127\.0\.0\.1|localhost):4274\/?$/.test(process.env.AIUTODOC_BASE_URL)))throw new Error('Beta validation only: local port 4274. Main/live forbidden.');
console.log('Isolated beta validation.');
