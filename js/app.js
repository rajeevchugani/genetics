'use strict';
const $=s=>document.querySelector(s);
const MODES={
  guided:{label:'Guided',note:'Parent genotypes are given and two Punnett boxes are filled in. Tips sit under every step and each answer is checked as you type.'},
  practice:{label:'Practice',note:'Write the parent genotypes yourself. Hint buttons are there if you get stuck, and you check when you are ready.'},
  challenge:{label:'Challenge',note:'Every box is blank, even the labels on the Punnett square. There are no hints and an extra prediction question.'},
  watch:{label:'Watch the working',note:'No typing. Step through a full worked solution one step at a time.'}
};
const S={mode:'practice',kind:'mixed',q:null,groups:[],M:null,W:{i:0,all:false,open:false},hint:{},active:null,stats:{solved:0,first:0,streak:0}};

/* ---------- setup ---------- */
function init(){
  $('#modeSeg').innerHTML=Object.entries(MODES).map(([k,m])=>`<button type="button" data-mode="${k}" aria-pressed="${k===S.mode}">${m.label}</button>`).join('');
  $('#kindSel').innerHTML='<option value="mixed">Mixed (surprise me)</option>'+Object.entries(KINDS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');
  $('#modeSeg').addEventListener('click',e=>{const b=e.target.closest('button[data-mode]');if(b)setMode(b.dataset.mode)});
  $('#kindSel').addEventListener('change',e=>{S.kind=e.target.value;newQuestion()});
  $('#newBtn').addEventListener('click',newQuestion);
  const st=$('#stage');
  st.addEventListener('mousedown',e=>{if(e.target.closest('[data-pad]'))e.preventDefault()});
  st.addEventListener('click',onClick);
  st.addEventListener('input',onInput);
  st.addEventListener('focusout',onBlur);
  st.addEventListener('focusin',e=>{const el=e.target;if(el.matches&&el.matches('.f:not([readonly])'))S.active=el});
  newQuestion();
}
function setMode(m){if(S.test)return;S.mode=m;$('#modeSeg').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===m));resetAttempt();render()}
function newQuestion(){
  if(S.test)return;
  const k=S.kind==='mixed'?chooseKind(S.mode):S.kind;
  S.q=genQuestion(k);
  S.q.givenCells=shuf([0,1,2,3]).slice(0,2);
  resetAttempt();render();
}
function resetAttempt(){S.M={wrong:0,assisted:false,hints:0,done:false,revealed:false};S.W={i:0,all:false,open:S.mode==='watch'};S.hint={}}

/* ---------- which boxes are blank in each mode ---------- */
function cfgFor(mode,q,si){
  const last=si===q.stages.length-1;
  const c={par:'blank',head:'given',pun:'blank',pct:'blank',calc:'none'};
  if(mode==='guided'){c.par=q.rev?'blank':'given';c.pun='half';c.pct='none'}
  if(mode==='challenge'){c.head='blank';if(last)c.calc='blank'}
  return c;
}
const STEP_TITLE={ped1:'Dominant or recessive',ped2:'Feature of the pattern',ped3:'Genotypes',ped4:'Why heterozygous',sp1:'Possible genotypes',sp2:'Possible blood groups',par:'Parent genotypes',gam:'Gametes',pun:'Punnett square',gen:'Genotype ratio',phe:'Phenotype ratio',pct:'Probability',calc:'Predict the numbers'};

/* ---------- command terms (from the study guide) ---------- */
const CMD_DEF={State:'Give a specific name, value or other brief answer without explanation or calculation.',Deduce:'Reach a conclusion from the information given.',Determine:'Obtain the only possible answer.',Describe:'Give a detailed account.',Explain:'Give a detailed account including reasons or causes.',Predict:'Give an expected result.','Draw and label':'Represent by means of a labelled, accurate diagram.'};
const STEP_CMD={par:'State',gam:'State',pun:'Draw and label',gen:'State',phe:'State',pct:'Determine',calc:'Predict',sp1:'State',sp2:'Deduce',ped1:'Determine',ped2:'Describe',ped3:'State',ped4:'Explain'};
const cmdChip=(id,q)=>{const c=(id==='par'&&q&&q.rev)?'Deduce':STEP_CMD[id];return c?`<span class="cmd" title="${CMD_DEF[c]}">${c}</span>`:''};
/* ---------- building the page ---------- */
const fin=(gid,i,cls,ph,ml,aria,num)=>`<input class="f ${cls}" data-gid="${gid}" data-i="${i}" maxlength="${ml}" placeholder="${ph}" aria-label="${aria}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" ${num?'inputmode="numeric"':''}>`;
const sel=(gid,i,opts,aria)=>`<select class="f" data-gid="${gid}" data-i="${i}" aria-label="${aria}"><option value="">Choose…</option>${opts.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select>`;
const given=(v,aria,cls='')=>`<input class="f given ${cls}" value="${v}" readonly tabindex="-1" aria-label="${aria}">`;
function addG(gid,step,si,n,exp,test){S.groups.push({gid,step,si,n,exp,test})}
const propOK=(vals,exp)=>{
  const v=vals.map(x=>x.trim()===''?NaN:Number(x));
  if(v.some(x=>!Number.isInteger(x)||x<0))return false;
  const sv=v.reduce((a,b)=>a+b,0),se=exp.reduce((a,b)=>a+b,0);
  return sv>0&&v.every((x,i)=>x*se===exp[i]*sv);
};
const pnum=s=>{s=(s||'').trim().replace('%','');if(/^\d+\s*\/\s*\d+$/.test(s)){const[a,b]=s.split('/').map(Number);return b?a/b*100:NaN}const x=s===''?NaN:Number(s);return x>0&&x<1?x*100:x};

function pedSteps(q){
  const sp=q.sp,t=q.t,steps=[];
  addG('0_ped1','ped1',0,1,[PED_TERM[sp.mode]],v=>v[0]===PED_TERM[sp.mode]);
  steps.push({id:'ped1',body:`<div class="row"><span class="lab">The trait is:</span>${sel('0_ped1',0,[['Dominant','Dominant'],['Recessive','Recessive']],'Dominant or recessive')}</div>`});
  addG('0_ped2','ped2',0,1,[sp.feat.letter],v=>v[0]===sp.feat.letter);
  steps.push({id:'ped2',body:`<p class="pcap">Which feature of this pedigree shows whether the trait is dominant or recessive?</p><ul class="opts">${sp.optHTML(sp.feat).map(o=>`<li>${o}</li>`).join('')}</ul><div class="row">${sel('0_ped2',0,[['A','A'],['B','B'],['C','C'],['D','D']],'Choose A, B, C or D')}</div>`});
  const ch=sp.chart;let ins='';
  sp.people.forEach(x=>{x.pts=ch.pts[x.i];const gid=`0_ped3_${x.i}`,keys=new Set(x.keys);
    addG(gid,'ped3',0,1,[x.exp],v=>{const s=(v[0]||'').trim();if(new RegExp('^'+sp.L+'[_\\-?*]?$').test(s))return [...keys].every(k=>k.includes(sp.L));const g=parseG(t,s);return !!g&&keys.has(gk(g))});
    ins+=`<span class="pin" style="left:${x.pts.x}px;top:${x.pts.y}px">${fin(gid,0,'pg','',4,'Genotype of '+x.label)}</span>`});
  steps.push({id:'ped3',body:`<p class="pcap">Type each person's genotype straight onto the chart, using the letter ${sp.L}. If you cannot tell whether someone is ${sp.L}${sp.L} or ${sp.L}${sp.L.toLowerCase()}, write just ${sp.L} (or ${sp.L}_) to mean at least one ${sp.L}, or any genotype that could be true.</p><div class="ped"><div class="pedwrap" style="width:${ch.w}px;height:${ch.H}px">${ch.fixed}${ins}</div></div>`});
  addG('0_ped4','ped4',0,1,[sp.het.letter],v=>v[0]===sp.het.letter);
  steps.push({id:'ped4',body:`<p class="pcap">Explain why ${sp.couple} must be heterozygous.</p><ul class="opts">${sp.optHTML(sp.het).map(o=>`<li>${o}</li>`).join('')}</ul><div class="row">${sel('0_ped4',0,[['A','A'],['B','B'],['C','C'],['D','D']],'Choose A, B, C or D')}</div>`});
  return steps;
}
function specialHTML(q,mode){
  const sp=q.sp,t=q.t;
  const sameList=(a,b)=>!!a&&a.length===b.length&&a.every((x,i)=>x===b[i]);
  let steps=[];
  if(sp.kind==='ped')steps=pedSteps(q);
  else{
  const rows=sp.labels1.map((lb,i)=>{const gid=`0_sp1_${i}`;
    addG(gid,'sp1',0,1,[sp.exp1Text[i]],v=>sameList(parseGenoList(t,v[0]),sp.exp1[i]));
    return `<div><span class="lab">${lb}</span><br>${fin(gid,0,'w','e.g. IAIA, IAi',18,lb+' possible genotypes')}</div>`}).join('<span class="sep">and</span>');
  steps.push({id:'sp1',body:`<div class="row">${rows}</div><p class="pcap">Write every possible genotype, separated by commas. Use I then A for IA.</p>`});
  addG('0_sp2','sp2',0,1,[sp.ansText],v=>sameList(parseGroups(v[0]),sp.ans));
  steps.push({id:'sp2',body:`<div class="row"><span class="lab">${sp.sub==='possible'?'The child could have group:':'The father could have group:'}</span>${fin('0_sp2',0,'w','e.g. A, O',14,'Possible blood groups')}</div><p class="pcap">Separate groups with commas. Include every group that is possible and no others.</p>`});
  }
  const items=steps.map((st,n)=>{
    const ti=tipOf(st.id,q,0);let btn='',tip='';
    if(mode==='guided'){btn=`<button type="button" class="btn small" data-act="reveal" data-si="0" data-step="${st.id}">Show answer</button>`;tip=`<p class="tip">${ti.tip}</p>`}
    else if(mode==='practice'){btn=`<button type="button" class="btn small" data-act="hint" data-si="0" data-step="${st.id}">Hint</button>`;tip='<p class="tip" hidden></p>'}
    return `<li class="step" data-step="${st.id}" data-si="0"><div class="step-h"><span class="num">${n+1}</span><h3>${(q.special&&q.sp.titles&&q.sp.titles[st.id])||STEP_TITLE[st.id]}</h3>${cmdChip(st.id,q)}<span class="state" aria-live="polite"></span><span class="spacer"></span>${btn}</div><div class="step-b">${st.body}</div>${tip}</li>`}).join('');
  return `<section class="stage" aria-label="Reasoning steps"><div class="stage-h"><h2>Work it out</h2></div><ol class="steps">${items}</ol></section>`;
}
function stageHTML(q,si,mode){
  const s=q.stages[si],c=cfgFor(mode,q,si),r=s.res,t=q.t,before=S.groups.reduce((a,g)=>a+g.n,0);
  const steps=[],eg=t.gText(t.genos[t.multi?2:1]),lbl=tpLabel(t,s);
  /* parents */
  {let b;
   const lab=(i,g)=>`<span class="lab">Parent ${i}${q.rev?'':': '+t.pnp(g)}</span>`;
   if(c.par==='given')b=`<div class="row"><div>${lab(1,s.p1)}<br>${given(t.gText(s.p1),'Parent 1 genotype')}</div><span class="sep">×</span><div>${lab(2,s.p2)}<br>${given(t.gText(s.p2),'Parent 2 genotype')}</div></div>`;
   else if(q.rev){
     addG(`${si}_par`,'par',si,2,[t.gText(s.p1),t.gText(s.p2)],v=>{const a=parseG(t,v[0]),b2=parseG(t,v[1]);return !!a&&!!b2&&((sameG(a,s.p1)&&sameG(b2,s.p2))||(sameG(a,s.p2)&&sameG(b2,s.p1)))});
     b=`<div class="row"><div>${lab(1,s.p1)}<br>${fin(`${si}_par`,0,'','e.g. '+eg,10,'Parent 1 genotype')}</div><span class="sep">×</span><div>${lab(2,s.p2)}<br>${fin(`${si}_par`,1,'','e.g. '+eg,10,'Parent 2 genotype')}</div></div><p class="pcap">Either order is fine.</p>`}
   else{addG(`${si}_par_0`,'par',si,1,[t.gText(s.p1)],v=>sameG(parseG(t,v[0]),s.p1));addG(`${si}_par_1`,'par',si,1,[t.gText(s.p2)],v=>sameG(parseG(t,v[0]),s.p2));
     b=`<div class="row"><div>${lab(1,s.p1)}<br>${fin(`${si}_par_0`,0,'','e.g. '+eg,10,'Parent 1 genotype')}</div><span class="sep">×</span><div>${lab(2,s.p2)}<br>${fin(`${si}_par_1`,0,'','e.g. '+eg,10,'Parent 2 genotype')}</div></div>`}
   steps.push({id:'par',locked:c.par==='given',body:b})}
  /* gametes */
  {const key=a=>gamOf(t,a).slice().sort().join('|'),tg=E=>v=>{const a=tokenizeAll(t,v[0]);return !!a&&[...new Set(a)].sort().join('|')===E};
   addG(`${si}_gam_0`,'gam',si,1,[gamOf(t,s.p1).join(', ')],tg(key(s.p1)));addG(`${si}_gam_1`,'gam',si,1,[gamOf(t,s.p2).join(', ')],tg(key(s.p2)));
   const ex=`e.g. ${t.al[0]}, ${t.al[t.al.length-1]}`;
   steps.push({id:'gam',body:`<div class="row"><div><span class="lab">Parent 1 gametes</span><br>${fin(`${si}_gam_0`,0,'w',ex,16,'Parent 1 gametes')}</div><div><span class="lab">Parent 2 gametes</span><br>${fin(`${si}_gam_1`,0,'w',ex,16,'Parent 2 gametes')}</div></div>`})}
  /* punnett */
  {let g='<div class="pgrid"><div></div>';
   const hdr=(gid,tok,aria)=>{addG(gid,'pun',si,1,[tok],v=>{const a=tokenizeAll(t,v[0]);return !!a&&a.length===1&&a[0]===tok});return fin(gid,0,'hd','?',4,aria)};
   for(let j=0;j<2;j++)g+=c.head==='given'?`<div class="h">${t.tHTML(s.p1[j])}</div>`:hdr(`${si}_pun_hc${j}`,s.p1[j],`Column ${j+1} allele`);
   for(let i=0;i<2;i++){
     g+=c.head==='given'?`<div class="h">${t.tHTML(s.p2[i])}</div>`:hdr(`${si}_pun_hr${i}`,s.p2[i],`Row ${i+1} allele`);
     for(let j=0;j<2;j++){const k=i*2+j,E=r.cells[i][j];
       if(c.pun==='half'&&q.givenCells.includes(k))g+=given(t.gText(E),`Box row ${i+1} column ${j+1} (given)`);
       else{addG(`${si}_pun_${k}`,'pun',si,1,[t.gText(E)],v=>sameG(parseG(t,v[0]),E));g+=fin(`${si}_pun_${k}`,0,'',' ',10,`Box row ${i+1} column ${j+1}`)}}}
   g+='</div>';
   steps.push({id:'pun',body:`<p class="pcap">Parent 1 across the top, Parent 2 down the side.${c.head==='blank'?' Fill in the labels too.':''}</p>${g}`})}
  /* genotype ratio */
  {const gl=genList(t,r),e=gl.map(x=>r.gen[gk(x)]);addG(`${si}_gen`,'gen',si,gl.length,e.map(String),v=>propOK(v,e));
   steps.push({id:'gen',body:`<div class="row">${gl.map((x,i)=>`${fin(`${si}_gen`,i,'n','',2,'Number of '+t.gText(x),1)} ${t.gHTML(x)}${i<gl.length-1?'<span class="sep">:</span>':''}`).join(' ')}</div>`})}
  /* phenotype ratio */
  {const pl=phList(t,r),e=pl.map(p=>r.ph[p.k]);addG(`${si}_phe`,'phe',si,pl.length,e.map(String),v=>propOK(v,e));
   steps.push({id:'phe',body:`<div class="row">${pl.map((p,i)=>`${fin(`${si}_phe`,i,'n','',2,'Number with '+p.short,1)} <span class="lab">${p.short}</span>${i<pl.length-1?'<span class="sep">:</span>':''}`).join(' ')}</div>`})}
  if(c.pct==='blank'){addG(`${si}_pct`,'pct',si,1,[String(s.pctTp)],v=>Math.abs(pnum(v[0])-s.pctTp)<1e-9);
   steps.push({id:'pct',body:`<div class="row"><span class="lab">Chance of an offspring with ${lbl}:</span>${fin(`${si}_pct`,0,'n','',5,'Percentage chance',1)}<span class="sep">%</span></div>`})}
  if(c.calc==='blank'){const E=q.N*s.tpCount/4;addG(`${si}_calc`,'calc',si,1,[String(E)],v=>v[0].trim()!==''&&Number(v[0])===E);
   steps.push({id:'calc',body:`<div class="row"><span class="lab">If this cross produced ${q.N} offspring, how many would you expect to have ${lbl}?</span>${fin(`${si}_calc`,0,'n','',4,'Expected number',1)}</div>`})}
  const after=S.groups.reduce((a,g)=>a+g.n,0);
  const items=steps.map((st,n)=>{
    const ti=tipOf(st.id,q,si);let btn='',tip='';
    if(!st.locked){
      if(mode==='guided'){btn=`<button type="button" class="btn small" data-act="reveal" data-si="${si}" data-step="${st.id}">Show answer</button>`;tip=`<p class="tip">${ti.tip}</p>`}
      else if(mode==='practice'){btn=`<button type="button" class="btn small" data-act="hint" data-si="${si}" data-step="${st.id}">Hint</button>`;tip='<p class="tip" hidden></p>'}
    }
    return `<li class="step" data-step="${st.id}" data-si="${si}"><div class="step-h"><span class="num">${n+1}</span><h3>${(q.special&&q.sp.titles&&q.sp.titles[st.id])||STEP_TITLE[st.id]}</h3>${cmdChip(st.id,q)}<span class="state" aria-live="polite"></span><span class="spacer"></span>${btn}</div><div class="step-b">${st.body}</div>${tip}</li>`}).join('');
  const ctx=q.stages.length>1?(si===0?'The parents (P generation) make the F1 generation.':'Two of the F1 offspring are crossed to make the F2 generation.'):'';
  return `<section class="stage" aria-label="${s.label}"><div class="stage-h"><h2>${q.stages.length>1?`Cross ${si+1}: `:''}${s.label}</h2><span class="badge">${after-before} blanks</span></div>${ctx?`<p class="lab">${ctx}</p>`:''}<ol class="steps">${items}</ol></section>`;
}

function render(){
  const q=S.q,mode=S.mode,t=q.t;S.groups=[];
  const stages=mode==='watch'?'':q.special?specialHTML(q,mode):q.stages.map((_,si)=>stageHTML(q,si,mode)).join('');
  const blanks=S.groups.reduce((a,g)=>a+g.n,0);
  const pad=mode==='watch'?'':`<div class="pad"><span>Type with the keyboard, or tap to add to the box you are in:</span>${t.al.map(a=>`<button type="button" class="${t.domTok(a)?'d':'r'}" data-pad="${a}" aria-label="Add allele ${a}">${tokHTML(a)}</button>`).join('')}<button type="button" data-pad="back" aria-label="Backspace">⌫</button></div>`;
  const T=S.test;
  const actions=T?testActions():mode==='watch'?'':`<div class="actions"><button type="button" class="btn primary" data-act="check">Check answers</button><button type="button" class="btn" data-act="work">${mode==='challenge'?'Give up and show the working':'Show the step-by-step working'}</button><button type="button" class="btn" data-act="new">Skip to a new question</button></div><div id="result" role="status" aria-live="polite"></div>`;
  const head=q.special?`${KINDS[q.kind].split(' (')[0]} · ${t.name}`:`${KINDS[q.kind].split(' (')[0]}${q.rev&&q.kind!=='reverse'?': find the parents':''} · ${t.name}`;
  $('#stage').innerHTML=`<section class="sheet"><div class="sheet-h"><h2>${head}</h2>${mode==='watch'||T?'':`<span class="badge">${blanks} blanks in total</span>`}</div>${T?testBar():''}<p>${introHTML(q,mode)}</p><div class="keyline"><div>${q.special&&q.sp.keyHTML?q.sp.keyHTML:t.keyHTML()}</div></div>${q.special&&q.sp.svg?`<div class="ped">${q.sp.svg}</div>`:''}${pad}</section>${stages}${actions}<div id="work"></div>`;
  S.groups.forEach(g=>{g.els=[...document.querySelectorAll(`[data-gid="${g.gid}"]`)].sort((a,b)=>a.dataset.i-b.dataset.i)});
  if(T){restoreTestAns();if(!T.done)tTick()}
  $('#modeNote').textContent=MODES[mode].note;
  renderStats();renderWork();
}
function renderStats(){
  const s=S.stats;
  $('#stats').innerHTML=[['Solved',s.solved],['First try',s.first],['Streak',s.streak]].map(([l,v])=>`<div class="stat"><b>${v}</b><span>${l}</span></div>`).join('');
}

/* ---------- checking ---------- */
const filled=g=>g.els.every(e=>e.value.trim()!=='');
function paint(g,state){g.els.forEach(e=>{e.classList.toggle('ok',state==='ok');e.classList.toggle('bad',state==='bad');e.setAttribute('aria-invalid',state==='bad')})}
function refreshStates(){
  document.querySelectorAll('#stage li.step').forEach(li=>{
    const gs=S.groups.filter(g=>g.step===li.dataset.step&&String(g.si)===li.dataset.si),el=li.querySelector('.state');
    if(!gs.length||!el)return;
    const allOk=gs.every(g=>g.els[0].classList.contains('ok')),anyBad=gs.some(g=>g.els[0].classList.contains('bad'));
    el.className='state'+(allOk?' ok':anyBad?' bad':'');
    el.textContent=allOk?'✓ Correct':anyBad?'✗ Look again':'';
  });
}
function allOK(){return S.groups.every(g=>g.els[0].classList.contains('ok'))}
function showResult(kind,html){const r=$('#result');if(r)r.innerHTML=html?`<div class="result ${kind}">${html}</div>`:''}
function success(){
  const M=S.M,q=S.q;if(M.done)return;M.done=true;
  const clean=M.wrong===0&&!M.assisted&&M.hints===0&&!M.revealed;
  if(!q.counted){q.counted=true;S.stats.solved++;if(clean){S.stats.first++;S.stats.streak++}else S.stats.streak=0}
  renderStats();
  showResult('ok',`All ${S.groups.reduce((a,g)=>a+g.n,0)} blanks correct${clean?' with no help. Nice work.':'.'} <div class="actions" style="margin-top:8px"><button type="button" class="btn primary" data-act="new">Next question</button><button type="button" class="btn" data-act="work">See the working</button></div>`);
}
function checkAll(){
  const M=S.M;let ok=0,tot=0,empty=0;const badSteps=new Set();
  S.groups.forEach(g=>{
    tot+=g.n;const good=filled(g)&&g.test(g.els.map(e=>e.value));
    if(good){ok+=g.n;paint(g,'ok')}else{badSteps.add(g.step);if(filled(g))paint(g,'bad');else{paint(g,'');empty+=g.n}}
  });
  refreshStates();
  if(ok===tot){success();return}
  M.wrong++;
  const names=[...badSteps].map(k=>STEP_TITLE[k].toLowerCase()).join(', ');
  showResult('bad',`${ok} of ${tot} blanks correct. Look again at: ${names}.${empty?` ${empty} blank${empty===1?' is':'s are'} still empty.`:''}`);
}

/* ---------- events ---------- */
function onInput(e){
  const el=e.target;if(!el.matches||!el.matches('.f'))return;
  const g=S.groups.find(x=>x.gid===el.dataset.gid);if(!g)return;
  el.classList.remove('bad');el.removeAttribute('aria-invalid');
  if(S.mode!=='guided')return;
  if(filled(g)&&g.test(g.els.map(x=>x.value)))paint(g,'ok');else g.els.forEach(x=>x.classList.remove('ok'));
  refreshStates();
  if(allOK())success();
}
function onBlur(e){
  const el=e.target;if(S.mode!=='guided'||!el.matches||!el.matches('.f:not([readonly])'))return;
  const g=S.groups.find(x=>x.gid===el.dataset.gid);if(!g||!filled(g))return;
  if(!g.test(g.els.map(x=>x.value))){if(!el.classList.contains('bad'))S.M.wrong++;paint(g,'bad');refreshStates()}
}
function onClick(e){
  const pad=e.target.closest('[data-pad]');
  if(pad){
    const el=S.active;
    if(!el||!document.contains(el)||el.readOnly||el.tagName==='SELECT'||el.classList.contains('n')){showResult('info','Click in a genotype or gamete box first, then tap an allele.');return}
    const ch=pad.dataset.pad,ml=el.maxLength;
    if(ch==='back')el.value=el.value.slice(0,-1);else if(el.classList.contains('hd'))el.value=ch;else if(el.value.length+ch.length<=ml)el.value+=ch;
    el.dispatchEvent(new Event('input',{bubbles:true}));el.focus();return;
  }
  const b=e.target.closest('[data-act]');if(!b)return;
  const a=b.dataset.act;
  if(a==='new')newQuestion();
  else if(a==='check')checkAll();
  else if(a==='work'){S.M.revealed=true;if(!S.q.counted){S.q.counted=true;S.stats.streak=0;renderStats()}S.W.open=true;S.W.i=0;S.W.all=false;renderWork();$('#work').scrollIntoView({block:'start',behavior:'smooth'})}
  else if(a==='hint')doHint(b);
  else if(a==='reveal')doReveal(b);
  else if(a==='wnext'){S.W.i++;renderWork(true)}
  else if(a==='wback'){S.W.i=Math.max(0,S.W.i-1);S.W.all=false;renderWork()}
  else if(a==='wall'){S.W.all=true;renderWork()}
  else if(a==='wrestart'){S.W.i=0;S.W.all=false;renderWork()}
  else if(a==='whide'){S.W.open=false;renderWork()}
  else if(a==='tryit')setMode('practice');
}
function doHint(b){
  const key=b.dataset.si+'_'+b.dataset.step,li=b.closest('li.step'),tip=li.querySelector('.tip'),ti=tipOf(b.dataset.step,S.q,+b.dataset.si);
  const lvl=(S.hint[key]||0)+1;S.hint[key]=lvl;S.M.hints++;
  tip.hidden=false;tip.innerHTML=lvl===1?ti.tip:ti.tip+' <b>Answer:</b> '+ti.ans;
  if(lvl>=2){b.disabled=true;b.textContent='No more hints'}else b.textContent='Another hint';
}
function doReveal(b){
  S.M.assisted=true;
  S.groups.filter(g=>g.step===b.dataset.step&&String(g.si)===b.dataset.si).forEach(g=>{g.els.forEach((e,i)=>e.value=g.exp[i]);paint(g,'ok')});
  refreshStates();if(allOK())success();
}

/* ---------- worked solution ---------- */
function renderWork(animate){
  const box=$('#work');if(!box)return;
  if(!S.W.open){box.className='';box.innerHTML='';return}
  const steps=wkSteps(S.q),n=steps.length,i=S.W.all?n-1:Math.min(S.W.i,n-1);S.W.i=i;
  let h=`<div class="sheet-h"><h2>Step-by-step working</h2><span class="badge">Step ${i+1} of ${n}</span></div><div class="dots" aria-hidden="true">${steps.map((_,k)=>`<i class="${k<=i?'on':''}"></i>`).join('')}</div>`;
  steps.slice(0,i+1).forEach((st,k)=>{h+=`<div class="wstep${k===i&&!S.W.all?' cur':''}"><div class="step-h"><span class="num">${k+1}</span><h3>${st.title}</h3></div><div class="wbody">${st.html}</div></div>`});
  h+=`<div class="actions"><button type="button" class="btn" data-act="wback"${i===0?' disabled':''}>Back</button><button type="button" class="btn primary" data-act="wnext"${i>=n-1?' disabled':''}>Next step</button><button type="button" class="btn" data-act="wall"${i>=n-1?' disabled':''}>Show every step</button><button type="button" class="btn" data-act="wrestart">Restart</button>`;
  h+=S.mode==='watch'?`<button type="button" class="btn" data-act="tryit">Try this one myself</button><button type="button" class="btn" data-act="new">Another example</button>`:`<button type="button" class="btn" data-act="whide">Hide working</button>`;
  box.className='work';box.innerHTML=h+'</div>';
  if(animate){const cur=box.querySelector('.wstep.cur');if(cur)cur.scrollIntoView({block:'nearest',behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'})}
}
init();
