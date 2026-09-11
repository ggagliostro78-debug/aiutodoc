
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function engine(){const c={window:{addEventListener(){}},console:{log(){},warn(){}},document:{getElementById:()=>null},};vm.createContext(c);for(const p of ['src/app_shared.js','src/clinical_rules.js','src/questionnaire_rules.js','src/app_v3_standalone.js'])vm.runInContext(fs.readFileSync(p,'utf8'),c);return vm.runInContext('new TriageEngine(()=>{})',c);}
const invented=[
 ['Ho un forte dolore toracico improvviso e non riesco a respirare.',true],
 ['Non ho dolore toracico. Ho un lieve fastidio al ginocchio da mesi.',false],
 ['Nessun dolore al petto e nessuna difficolta respiratoria. Il ginocchio fa male quando cammino.',false],
 ['Ho difficolta a respirare a riposo e dolore al petto.',true]
];
for(const [text,expected] of invented)test('holdout urgenza: '+invented.findIndex(x=>x[0]===text),()=>{for(const age of [27,43,61]){const e=engine();e.userData={age,disturbo:text,conoscitiveResp:[],anamnesticheResp:[]};assert.equal(Boolean(e._detectUrgency(text)),expected,'age='+age);}});
test('domande: variazioni sintattiche del disturbo non producono una diagnosi',()=>{for(const text of ['Ho male al ginocchio quando cammino.','Il ginocchio mi fa male camminando.','Da tempo avverto dolore al ginocchio.']){const e=engine();e.userData.disturbo=text;const q=e._generaDomandeAnamnestiche(text);assert.ok(Array.isArray(q)&&q.length>=3);assert.ok(q.every(s=>typeof s==='string'&&s.includes('?')));}});

test('domande: dolore di spalla non viene deviato verso il questionario emotivo da negazioni o parole incidentali',()=>{
 const e=engine();
 const q=e._generaDomandeAnamnestiche('Caso simulato, nessun dato reale: da sei settimane dolore alla spalla dopo palestra e lavoro al computer; peggiora in alcuni movimenti ma non c\'è stato trauma, non ho febbre, deformità, perdita di forza improvvisa o dolore notturno importante.');
 assert.match(q[0],/movimenti.*spalla/i);
 assert.match(q[1],/perdita improvvisa di forza.*deformità/i);
 assert.match(q[2],/Riducendo il carico/i);
 assert.ok(q.every(question=>! /malessere emotivo|vissuti|rapporto con gli altri/i.test(question)));
});

test('negazioni non cancellano la frase avversativa',()=>{const e=engine();assert.match(e._stripNegatedClinicalClauses('Non ho dolore al petto ma ho difficolta a respirare a riposo.'),/difficolta a respirare/);assert.equal(e._detectUrgency('Non ho dolore al petto ma ho difficolta a respirare a riposo.'),true);});

test('altezza richiesta solo nei contesti anamnestici pertinenti e facoltativa',()=>{
 const e=engine();
 e.userData={age_range:'18_39',disturbo:'Vorrei un orientamento per obesità e nutrizione.',conoscitiveResp:[],anamnesticheResp:[]};
 assert.deepEqual([...e._prepareConditionalDetailsQueue()],['weight_kg','height_cm']);
 e.currentConditionalDetail='height_cm';e.conditionalDetailsQueue=[];
 e._handleConditionalDetailInput('non lo so');
 assert.equal(e.userData.height_cm,undefined);
 const ordinary=engine();ordinary.userData={age_range:'18_39',disturbo:'Dolore al ginocchio dopo una camminata.',conoscitiveResp:[],anamnesticheResp:[]};
 assert.equal(ordinary._needsHeight(),false);
});

test('scheda Calafiore pertinente resta entro le prime cinque proposte',()=>{
 const e=engine();
 e.userData={zona:'Reggio Calabria',disturbo:'Dolore al ginocchio dopo distorsione.',conoscitiveResp:[],anamnesticheResp:[]};
 const curated=e._buildCuratedSearchResults('Ortopedico');
 assert.equal(curated.length,1);
 const results=Array.from({length:20},(_,i)=>({nome:'Scheda pubblica '+i}));
 const output=e._includeCuratedResults(results,curated,(a,b)=>String(a).toLowerCase()===String(b).toLowerCase());
 assert.equal(output.length,20);
 assert.equal(output.findIndex(entry=>entry.nome==='Dott. Vincenzo Calafiore'),4);
});

test('research failure does not report completion and offers restart',()=>{let output='';const input={};const c={window:{addEventListener(){}},console,document:{getElementById:id=>id==='chat-input'?input:null,querySelector:()=>null},clearTimeout,clearInterval};vm.createContext(c);for(const p of ['src/app_shared.js','src/clinical_rules.js','src/questionnaire_rules.js','src/app_v3_standalone.js'])vm.runInContext(fs.readFileSync(p,'utf8'),c);const e=vm.runInContext('new TriageEngine(()=>{})',c);e.onMessage=s=>output=s;e.state='6_RICERCA_SCIENTIFICA';e._showResearchFailure('Servizio non configurato.');assert.equal(e.state,'7_ERRORE');assert.match(output,/Servizio non configurato/);assert.doesNotMatch(output,/Orientamento completato/);});
