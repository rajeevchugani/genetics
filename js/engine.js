'use strict';
/* ================= helpers ================= */
const rnd=n=>Math.floor(Math.random()*n);
const pick=a=>a[rnd(a.length)];
const shuf=a=>a.slice().sort(()=>Math.random()-.5);
const lc=s=>s.toLowerCase();
const cap=s=>s[0].toUpperCase()+s.slice(1);
const art=s=>(/^[aeiou]/i.test(s)?'an ':'a ')+s;
const gcd=(a,b)=>b?gcd(b,a%b):a;
const ratioText=arr=>{const g=arr.reduce((a,b)=>gcd(a,b),0)||1;return arr.map(x=>x/g).join(' : ')};
const gk=g=>g.join('|');
const tokHTML=tok=>tok.length===2?`${tok[0]}<sup>${tok[1]}</sup>`:tok;
const tokMark=tok=>tok.length===2?`${tok[0]}^${tok[1]}`:tok;

/* ================= traits ================= */
function mkTrait(o){
  const t=Object.assign({},o);
  t.tokLen=Math.max(...t.al.map(a=>a.length));
  t.tokCls=tok=>t.domTok(tok)?'al-d':'al-r';
  t.gHTML=g=>g.map(a=>`<span class="${t.tokCls(a)}">${tokHTML(a)}</span>`).join('');
  t.tHTML=a=>`<span class="${t.tokCls(a)}">${tokHTML(a)}</span>`;
  t.gMark=g=>g.map(tokMark).join('');
  t.gText=g=>g.join('');
  t.sort=g=>g.slice().sort((a,b)=>t.al.indexOf(a)-t.al.indexOf(b));
  t.pheno=g=>t.phenos.find(p=>p.k===t.phenoOf(g));
  return t;
}
function domTrait(id,name,L,domNP,recNP,domPL,recPL,domS,recS,orgPL,human){
  const l=lc(L);
  return mkTrait({id,name,sys:'dom',human:!!human,orgPL,al:[L,l],domNP,recNP,domPL,recPL,domS,recS,
    genos:[[L,L],[L,l],[l,l]],
    phenos:[{k:'dom',label:domS,short:domS},{k:'rec',label:recS,short:recS}],
    phenoOf:g=>g.includes(L)?'dom':'rec',
    domTok:tok=>tok===L,
    matchTok:s=>(s[0]===L||s[0]===l)?[s[0],1]:null,
    describe:g=>{const k=g.filter(a=>a===L).length;return k===2?'homozygous '+domNP:k===1?'heterozygous '+domNP:recNP},
    pnp:g=>g.includes(L)?domNP:recNP,
    keyHTML:()=>`<span class="chip dom">${L}</span> = ${domS} (dominant) &nbsp; <span class="chip rec">${l}</span> = ${recS} (recessive)`,
    keyMark:()=>`Key: ${L} = ${domS} (dominant),  ${l} = ${recS} (recessive)`});
}
function incTrait(id,name,sys,orgSing,orgPL,A,B,pheA,pheM,pheB,labA,labM,labB){
  const a=A,b=B;
  return mkTrait({id,name,sys,human:false,orgSing,orgPL,al:[a,b],
    genos:[[a,a],[a,b],[b,b]],
    phenos:[{k:'AA',label:labA,short:pheA},{k:'AB',label:labM,short:pheM},{k:'BB',label:labB,short:pheB}],
    phenoOf:g=>g[0]!==g[1]?'AB':(g[0]===a?'AA':'BB'),
    domTok:tok=>tok===a,
    matchTok:s=>{const u=s.toUpperCase();for(const [txt,tok] of [[a,a],[b,b],[a[1],a],[b[1],b]])if(u.startsWith(txt))return [tok,txt.length];return null},
    describe:g=>`${t_short(g,[pheA,pheM,pheB],a,b)} ${orgSing}`,
    pnp:g=>`${t_short(g,[pheA,pheM,pheB],a,b)} ${orgSing}`,
    keyHTML:()=>`<span class="chip dom">${tokHTML(a)}</span> = ${labA} &nbsp; <span class="chip rec">${tokHTML(b)}</span> = ${labB} &nbsp; ${sys==='cod'?`Both alleles show in ${tokHTML(a)}${tokHTML(b)} (${labM}).`:`Neither allele is fully dominant. ${tokHTML(a)}${tokHTML(b)} gives ${labM}.`}`,
    keyMark:()=>`Key: ${tokMark(a)} = ${labA},  ${tokMark(b)} = ${labB}.  `+(sys==='cod'?`Both alleles show in ${tokMark(a)}${tokMark(b)} (${labM}).`:`Neither allele is fully dominant. ${tokMark(a)}${tokMark(b)} gives ${labM}.`)});
}
function t_short(g,names,a,b){return g[0]!==g[1]?names[1]:(g[0]===a?names[0]:names[2])}
const ABO=mkTrait({id:'abo',name:'ABO blood group (human)',sys:'abo',human:true,orgPL:'people',al:['IA','IB','i'],
  genos:[['IA','IA'],['IA','IB'],['IA','i'],['IB','IB'],['IB','i'],['i','i']],
  phenos:[{k:'A',label:'blood group A',short:'A'},{k:'B',label:'blood group B',short:'B'},{k:'AB',label:'blood group AB',short:'AB'},{k:'O',label:'blood group O',short:'O'}],
  phenoOf:g=>{const a=g.includes('IA'),b=g.includes('IB');return a&&b?'AB':a?'A':b?'B':'O'},
  domTok:tok=>tok!=='i',
  matchTok:s=>{
    if(s[0]==='I'&&/[ABab]/.test(s[1]||''))return ['I'+s[1].toUpperCase(),2];
    if(s[0]==='I'&&/[Oo]/.test(s[1]||''))return ['i',2];
    if(s[0]==='i'||s[0]==='O'||s[0]==='o')return ['i',1];
    return null},
  describe:g=>{const k=gk(g);return k==='IA|IA'?'blood group A (homozygous)':k==='IA|i'?'blood group A (heterozygous)':k==='IB|IB'?'blood group B (homozygous)':k==='IB|i'?'blood group B (heterozygous)':k==='IA|IB'?'blood group AB':'blood group O'},
  pnp:g=>'blood group '+ABO_short(g),
  keyHTML:()=>`<span class="chip dom">${tokHTML('IA')}</span> = antigen A &nbsp; <span class="chip dom">${tokHTML('IB')}</span> = antigen B &nbsp; <span class="chip rec">i</span> = no antigen. ${tokHTML('IA')} and ${tokHTML('IB')} are codominant, and both are dominant to i.`,
  keyMark:()=>`Key: I^A = antigen A,  I^B = antigen B,  i = no antigen.  I^A and I^B are codominant. Both are dominant to i.`});
ABO.multi=true;
function ABO_short(g){const a=g.includes('IA'),b=g.includes('IB');return a&&b?'AB':a?'A':b?'B':'O'}

const DOM_TRAITS=[
 domTrait('height','Pea plant height','T','tall pea plant','dwarf pea plant','tall pea plants','dwarf pea plants','tall','dwarf','pea plants'),
 domTrait('seedshape','Pea seed shape','R','round-seeded pea plant','wrinkled-seeded pea plant','round-seeded pea plants','wrinkled-seeded pea plants','round seeds','wrinkled seeds','pea plants'),
 domTrait('seedcolour','Pea seed colour','Y','yellow-seeded pea plant','green-seeded pea plant','yellow-seeded pea plants','green-seeded pea plants','yellow seeds','green seeds','pea plants'),
 domTrait('flower','Pea flower colour','P','purple-flowered pea plant','white-flowered pea plant','purple-flowered pea plants','white-flowered pea plants','purple flowers','white flowers','pea plants'),
 domTrait('podcolour','Pea pod colour','G','green-podded pea plant','yellow-podded pea plant','green-podded pea plants','yellow-podded pea plants','green pods','yellow pods','pea plants'),
 domTrait('podshape','Pea pod shape','F','pea plant with inflated pods','pea plant with constricted pods','pea plants with inflated pods','pea plants with constricted pods','inflated pods','constricted pods','pea plants'),
 domTrait('flowerpos','Pea flower position','A','axial-flowered pea plant','terminal-flowered pea plant','axial-flowered pea plants','terminal-flowered pea plants','axial flowers','terminal flowers','pea plants'),
 domTrait('fur','Guinea pig fur colour','B','black guinea pig','brown guinea pig','black guinea pigs','brown guinea pigs','black fur','brown fur','guinea pigs'),
 domTrait('cf','Cystic fibrosis (human)','N','person without cystic fibrosis','person with cystic fibrosis','people without cystic fibrosis','people with cystic fibrosis','no cystic fibrosis','cystic fibrosis','people',true),
 domTrait('hd',"Huntington's disease (human)",'H',"person with Huntington's disease","person without Huntington's disease","people with Huntington's disease","people without Huntington's disease","Huntington's disease","no Huntington's disease",'people',true)
];
/* rabbit coat colour: four alleles in a dominance order */
const RAB_NAMES={CA:'agouti',CC:'chinchilla',CH:'Himalayan',c:'albino'};
const RABBIT=mkTrait({id:'rabbit',name:'Rabbit coat colour (four alleles)',sys:'multi',multi:true,human:false,orgPL:'rabbits',al:['CA','CC','CH','c'],
  genos:[['CA','CA'],['CA','CC'],['CA','CH'],['CA','c'],['CC','CC'],['CC','CH'],['CC','c'],['CH','CH'],['CH','c'],['c','c']],
  phenos:[{k:'ag',label:'agouti coat',short:'agouti'},{k:'ch',label:'chinchilla coat',short:'chinchilla'},{k:'hi',label:'Himalayan coat',short:'Himalayan'},{k:'al',label:'albino (white) coat',short:'albino'}],
  phenoOf:g=>['ag','ch','hi','al'][Math.min(...g.map(a=>['CA','CC','CH','c'].indexOf(a)))],
  domTok:tok=>tok!=='c',
  matchTok:s=>{if(s[0]==='c')return ['c',1];if(s[0]==='C'&&/[ACH]/.test(s[1]||''))return ['C'+s[1],2];return null},
  describe:g=>g[0]===g[1]?(g[0]==='c'?'albino rabbit':`homozygous ${RAB_NAMES[g[0]]} rabbit`):`${RAB_NAMES[g[0]]}/${RAB_NAMES[g[1]]} rabbit`,
  pnp:g=>g[0]===g[1]?RAB_NAMES[g[0]]+(g[0]==='c'?'':' (homozygous)'):RAB_NAMES[g[0]]+'/'+RAB_NAMES[g[1]],
  keyHTML:()=>['CA','CC','CH','c'].map(a=>`<span class="chip ${a==='c'?'rec':'dom'}">${tokHTML(a)}</span> = ${RAB_NAMES[a]}`).join(' &nbsp; ')+'<br>Dominance order: '+['CA','CC','CH','c'].map(tokHTML).join(' > ')+'. Each allele is dominant to every allele after it.',
  keyMark:()=>'Key: C^A = agouti, C^C = chinchilla, C^H = Himalayan, c = albino. Dominance order: C^A > C^C > C^H > c.'});
const INC_TRAITS=[
 incTrait('snap','Snapdragon flower colour','inc','snapdragon plant','snapdragon plants','CR','CW','red','pink','white','red flowers','pink flowers','white flowers'),
 incTrait('fouro','Four o\'clock flower colour','inc','four o\'clock plant','four o\'clock plants','CR','CW','red','pink','white','red flowers','pink flowers','white flowers'),
 incTrait('fowl','Andalusian chicken feathers','inc','chicken','chickens','CB','CW','black','blue','white','black feathers','blue feathers','white feathers')
];
const SICKLE=incTrait('sickle','Sickle-cell disease (human)','cod','person','people','HA','HS','healthy','carrier','sickle-cell disease','healthy (normal haemoglobin only)','sickle-cell carrier (healthy, makes both kinds)','sickle-cell disease');
SICKLE.human=true;SICKLE.sickle=true;
SICKLE.describe=g=>g[0]!==g[1]?'sickle-cell carrier':g[0]==='HA'?'healthy person (no sickle allele)':'person with sickle-cell disease';
SICKLE.pnp=SICKLE.describe;
const COD_TRAITS=[incTrait('cattle','Cattle coat colour','cod','cow','cattle','CR','CW','red','roan','white','red coat','roan coat (red and white hairs)','white coat'),SICKLE];
const KINDS={f1:'F1 generation (P → F1)',f2:'F2 generation (F1 × F1)',full:'Full experiment (P → F1 → F2)',cross:'Other crosses (test cross and more)',reverse:'Find the parents (work backwards)',inc:'Incomplete dominance',cod:'Codominance',abo:'ABO blood groups',aboq:'ABO: possible or impossible?',multi:'Multiple alleles (rabbit coat colour)',ped:'Pedigrees (dominant or recessive)'};

/* ================= parsing student input ================= */
function tokenizeAll(t,str){
  let s=String(str||'').replace(/\b(and|or)\b/gi,' ').replace(/[\s,;\/^{}_&+]/g,'');
  const out=[];
  while(s.length){const m=t.matchTok(s);if(!m)return null;out.push(m[0]);s=s.slice(m[1])}
  return out;
}
function parseG(t,str){const a=tokenizeAll(t,str);return a&&a.length===2?t.sort(a):null}
const sameG=(a,b)=>!!a&&!!b&&gk(a)===gk(b);
const gamOf=(t,p)=>t.sort([...new Set(p)]);

/* ================= crosses ================= */
function doCross(t,p1,p2){
  const cells=[0,1].map(r=>[0,1].map(c=>t.sort([p1[c],p2[r]])));
  const gen={},ph={};
  t.genos.forEach(g=>gen[gk(g)]=0);t.phenos.forEach(p=>ph[p.k]=0);
  cells.flat().forEach(g=>{gen[gk(g)]++;ph[t.phenoOf(g)]++});
  return {cells,gen,ph};
}
const genList=(t,res)=>t.multi?t.genos.filter(g=>res.gen[gk(g)]>0):t.genos;
const phList=(t,res)=>t.multi?t.phenos.filter(p=>res.ph[p.k]>0):t.phenos;
function mkStage(t,p1,p2,label,off){
  p1=t.sort(p1);p2=t.sort(p2);
  const res=doCross(t,p1,p2),present=t.phenos.filter(p=>res.ph[p.k]>0).map(p=>p.k);
  const tp=t.multi?pick(present):t.sys==='dom'?(Math.random()<.75?'rec':'dom'):pick(t.phenos).k;
  return {p1,p2,label,off,res,tp,tpCount:res.ph[tp],pctTp:res.ph[tp]*25};
}
const tpLabel=(t,s)=>t.phenos.find(p=>p.k===s.tp).label;

/* ================= ABO reasoning (possible / impossible) ================= */
const GROUPS=['A','B','AB','O'];
const GROUP_GENOS={A:[['IA','IA'],['IA','i']],B:[['IB','IB'],['IB','i']],AB:[['IA','IB']],O:[['i','i']]};
function childGroups(mg,fg){
  const set=new Set();
  GROUP_GENOS[mg].forEach(a=>GROUP_GENOS[fg].forEach(b=>doCross(ABO,a,b).cells.flat().forEach(g=>set.add(ABO.phenoOf(g)))));
  return GROUPS.filter(x=>set.has(x));
}
const fatherGroups=(cg,mg)=>GROUPS.filter(fg=>childGroups(mg,fg).includes(cg));
function parseGroups(str){
  const parts=String(str||'').toUpperCase().replace(/BLOOD|GROUPS?/g,' ').split(/[\s,;\/&+]+|\bAND\b|\bOR\b/).filter(Boolean).map(x=>x==='0'?'O':x);
  if(!parts.length||parts.some(x=>!GROUPS.includes(x)))return null;
  return GROUPS.filter(x=>parts.includes(x));
}
function parseGenoList(t,str){
  const tk=tokenizeAll(t,str);if(!tk||!tk.length||tk.length%2)return null;
  const keys=new Set();for(let i=0;i<tk.length;i+=2)keys.add(gk(t.sort([tk[i],tk[i+1]])));
  return t.genos.map(gk).filter(k=>keys.has(k));
}
const genoKeys=list=>ABO.genos.map(gk).filter(k=>list.map(gk).includes(k));
