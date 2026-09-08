const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),source=path.resolve(root,'../AIutoDoc_main');
const base=JSON.parse(fs.readFileSync(path.join(root,'beta-audit/source-baseline.json'),'utf8').replace(/^\uFEFF/,''));
const changed=base.filter(f=>{try{return crypto.createHash('sha256').update(fs.readFileSync(path.join(source,f.path))).digest('hex').toUpperCase()!==f.hash;}catch{return true;}}).map(f=>f.path);
const before=fs.readFileSync(path.join(root,'beta-audit/source-status.txt'),'utf8').replace(/^\uFEFF/,'').trim().replace(/\r\n/g,'\n');
const after=cp.execFileSync('git',['status','--porcelain'],{cwd:source,encoding:'utf8'}).trim().replace(/\r\n/g,'\n');
if(changed.length||before!==after){console.error('Original differs:',changed);process.exit(1);}
if(cp.execFileSync('git',['remote'],{cwd:root,encoding:'utf8'}).trim())throw new Error('Beta must have no remote.');
console.log('Original file hashes and Git status unchanged; beta has no remote. Checked '+base.length+' files.');
