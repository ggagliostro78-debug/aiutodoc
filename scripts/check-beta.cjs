const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const branch=process.env.BRANCH || cp.execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim();
if(!['main','codex/aiutodoc-beta'].includes(branch))throw new Error('Run checks from main or the beta branch.');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)])}
for(const file of ['index.html',...['src','server','api','netlify/functions','scripts'].flatMap(walk)]){
 if(/\.(js|cjs)$/.test(file))cp.execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
 if(file.endsWith('.html')){const text=fs.readFileSync(file,'utf8');for(const [,attrs,code] of text.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi))if(!/src=|ld\+json/i.test(attrs))new(require('node:vm').Script)(code);}
}
console.log('Syntax and branch checks passed.');
