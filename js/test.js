'use strict';
/* ---------- Test mode: a mixed paper, marked at the end ---------- */
const TST={sel:{n:8,timed:true},tick:null};
const tq=()=>S.test.qs[S.test.i];
const fkey=(g,i)=>g.gid+'#'+i;
function tGenerate(n){
  const qs=[],seen=new Set(),used={},cap=Math.max(1,Math.ceil(n/4));let guard=0;
  while(qs.length<n&&guard++<600){
    let k;for(let i=0;i<30;i++){k=chooseKind('challenge');if((used[k]||0)<cap)break}
    const q=genQuestion(k);
    const sig=k+q.t.id+(q.special?q.sp.sig:q.stages.map(s=>gk(s.p1)+gk(s.p2)+s.tp).join('/')+(q.rev?q.rev.tpl:''));
    if(seen.has(sig)&&guard<500)continue;
    seen.add(sig);used[k]=(used[k]||0)+1;
    q.givenCells=shuf([0,1,2,3]).slice(0,2);qs.push(q);
  }
  return shuf(qs);
}
function testStart(){
  const n=TST.sel.n;
  S.test={qs:tGenerate(n),i:0,ans:{},done:false,review:false,warned:false,t0:Date.now(),limit:TST.sel.timed?Math.round(n*3):0,prevMode:S.mode,res:null};
  S.test.ans=S.test.qs.map(()=>({}));
  S.mode='challenge';
  document.querySelector('.controls').hidden=true;$('#modeNote').hidden=true;$('#testPanel').hidden=true;
  clearInterval(TST.tick);
  if(S.test.limit)TST.tick=setInterval(tTick,1000);
  loadTestQ();
}
function tTick(){
  const T=S.test;if(!T||T.done){clearInterval(TST.tick);return}
  const left=T.limit*60-Math.floor((Date.now()-T.t0)/1000),el=document.querySelector('#tTimer');
  if(left<=0){clearInterval(TST.tick);testSubmit(true);return}
  if(el){el.textContent=`${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}`;el.classList.toggle('bad',left<=60)}
}
function loadTestQ(){S.q=tq();resetAttempt();S.W.open=false;render()}
function saveTestAns(){
  const T=S.test;if(!T||T.done)return;const m=T.ans[T.i];
  S.groups.forEach(g=>g.els.forEach((e,i)=>{m[fkey(g,i)]=e.value}));
}
function restoreTestAns(){
  const T=S.test,m=T.ans[T.i];
  S.groups.forEach(g=>g.els.forEach((e,i)=>{if(m[fkey(g,i)]!=null)e.value=m[fkey(g,i)];if(T.done){e.readOnly=true;if(e.tagName==='SELECT')e.disabled=true}}));
}
function qStatus(qi){ /* 'blank' | 'part' | 'full' by how many boxes have text */
  const m=S.test.ans[qi],v=Object.values(m);if(!v.length||v.every(x=>!x.trim()))return '';
  return v.every(x=>x.trim())?'has':'part';
}
function testNavHTML(){
  const T=S.test,n=T.qs.length;
  const btns=T.qs.map((_,k)=>{
    let c=T.done?(T.res[k].got===T.res[k].tot?'ok':T.res[k].got===0?'bad':'part'):qStatus(k);
    return `<button type="button" class="${c}${k===T.i?' cur':''}" data-tgo="${k}" aria-label="Question ${k+1}">${k+1}</button>`}).join('');
  return `<div class="tnav" role="group" aria-label="Questions">${btns}</div>`;
}
function testBar(){
  const T=S.test,n=T.qs.length;
  if(T.done)return `<div class="tbar"><span class="badge">Review: question ${T.i+1} of ${n} · ${T.res[T.i].got}/${T.res[T.i].tot} marks</span>${testNavHTML()}</div>`;
  return `<div class="tbar"><span class="badge">Question ${T.i+1} of ${n}</span>${T.limit?'<span class="badge" id="tTimer" aria-label="Time left">--:--</span>':''}${testNavHTML()}</div>`;
}
function testActions(){
  const T=S.test,n=T.qs.length;
  if(T.done)return `<div class="actions"><button type="button" class="btn" data-tgo="${Math.max(0,T.i-1)}"${T.i===0?' disabled':''}>Previous</button><button type="button" class="btn" data-tgo="${Math.min(n-1,T.i+1)}"${T.i===n-1?' disabled':''}>Next</button><button type="button" class="btn primary" data-tact="results">Back to my results</button></div>`;
  return `<div class="actions"><button type="button" class="btn" data-tgo="${Math.max(0,T.i-1)}"${T.i===0?' disabled':''}>Previous</button><button type="button" class="btn" data-tgo="${Math.min(n-1,T.i+1)}"${T.i===n-1?' disabled':''}>Next</button><button type="button" class="btn primary" data-tact="submit">Hand in test</button></div><div id="result" role="status" aria-live="polite"></div>`;
}
/* grade every question: render it, load saved answers, run each box's test */
function gradeAll(){
  const T=S.test,keepI=T.i,out=[];
  T.qs.forEach((q,k)=>{
    T.i=k;S.q=q;T.done=false;render();   /* builds groups with saved answers */
    let got=0,tot=0;const bad=[];
    S.groups.forEach(g=>{tot++;const ok=filled(g)&&g.test(g.els.map(e=>e.value));if(ok)got++;else bad.push(g.step)});
    out.push({got,tot,bad:[...new Set(bad)]});
  });
  T.i=keepI;return out;
}
function testSubmit(force){
  const T=S.test;if(!T||T.done)return;saveTestAns();
  const unanswered=T.qs.filter((_,k)=>qStatus(k)!=='has').length;
  if(!force&&unanswered&&!T.warned){T.warned=true;showResult('info',`${unanswered} question${unanswered===1?' has':'s have'} blank boxes. Press "Hand in test" again to finish anyway, or keep working.`);return}
  clearInterval(TST.tick);
  T.res=gradeAll();T.done=true;T.secs=Math.floor((Date.now()-T.t0)/1000);T.timedOut=!!force;
  showResults();
}
function showResults(){
  const T=S.test,got=T.res.reduce((a,r)=>a+r.got,0),tot=T.res.reduce((a,r)=>a+r.tot,0),pct=Math.round(got/tot*100);
  const band=pct>=90?'Excellent':pct>=75?'Secure':pct>=55?'Developing':'Needs more practice';
  const nm=[...new Set(T.res.flatMap(r=>r.bad))];
  const tipTxt={par:'working out parent genotypes',gam:'gametes',pun:'completing Punnett squares',gen:'genotype ratios',phe:'phenotype ratios',pct:'percentage chances',calc:'predicting numbers',sp1:'listing possible genotypes',sp2:'deciding which blood groups are possible'};
  const weak=nm.map(k=>tipTxt[k]).filter(Boolean);
  const mins=Math.floor(T.secs/60),sec=T.secs%60;
  $('#stage').innerHTML=`<section class="sheet"><div class="sheet-h"><h2>Your results</h2><span class="badge">${mins} min ${sec} s${T.timedOut?' · time ran out':''}</span></div>
  <div class="score">${got}<span style="font-size:1.4rem"> / ${tot}</span></div>
  <p><b>${pct}%</b> · ${band}</p>
  ${weak.length?`<p>Look again at: ${weak.join(', ')}.</p>`:'<p>Every box was correct. Well done.</p>'}
  ${(()=>{const byK={};T.qs.forEach((q,k)=>{const o=byK[q.kind]||(byK[q.kind]={got:0,tot:0});o.got+=T.res[k].got;o.tot+=T.res[k].tot});
    const wk=Object.entries(byK).filter(([k,o])=>o.got<o.tot).sort((a,b)=>a[1].got/a[1].tot-b[1].got/b[1].tot).slice(0,3);
    return wk.length?`<div class="prac"><h3>Practise your weakest areas</h3><div class="actions">${wk.map(([k,o])=>`<button type="button" class="btn" data-tprac="${k}" data-pm="${o.got/o.tot<.5?'guided':'practice'}">${KINDS[k].split(' (')[0]} · ${Math.round(o.got/o.tot*100)}%</button>`).join('')}</div><p class="pcap">Each button opens practice questions of that type. Guided mode (with tips) opens when you scored under half.</p></div>`:''})()}
  <ul class="rlist">${T.qs.map((q,k)=>`<li><b>Q${k+1}</b><span>${KINDS[q.kind].split(' (')[0]}${q.rev&&q.kind!=='reverse'?' (find the parents)':''} · ${q.t.name}</span><span class="badge ${T.res[k].got===T.res[k].tot?'ok':'bad'}">${T.res[k].got===T.res[k].tot?'✓':'✗'} ${T.res[k].got}/${T.res[k].tot}</span><button type="button" class="btn small" data-tgo="${k}">Review</button></li>`).join('')}</ul>
  <div class="actions"><button type="button" class="btn primary" data-tact="again">Take another test</button><button type="button" class="btn" data-tact="exit">Back to practice</button></div></section>`;
  window.scrollTo({top:0,behavior:'smooth'});
}
function reviewQ(k){
  const T=S.test;T.i=k;S.q=T.qs[k];resetAttempt();S.W.open=true;render();
  S.groups.forEach(g=>{const ok=filled(g)&&g.test(g.els.map(e=>e.value));paint(g,ok?'ok':'bad')});
  refreshStates();
}
function testExit(){
  clearInterval(TST.tick);
  const pm=S.test?S.test.prevMode:'practice';S.test=null;
  document.querySelector('.controls').hidden=false;$('#modeNote').hidden=false;
  S.mode=pm;setMode(pm);newQuestion();
}
function testPractise(k,m){
  clearInterval(TST.tick);S.test=null;
  document.querySelector('.controls').hidden=false;$('#modeNote').hidden=false;
  S.kind=k;$('#kindSel').value=k;setMode(m);newQuestion();window.scrollTo({top:0,behavior:'smooth'});
}
function testInit(){
  $('#testN').innerHTML=[6,8,10,12,15].map(n=>`<option value="${n}"${n===8?' selected':''}>${n} questions</option>`).join('');
  $('#testOpen').addEventListener('click',()=>{const p=$('#testPanel');p.hidden=!p.hidden;if(!p.hidden)p.scrollIntoView({block:'start',behavior:'smooth'})});
  $('#testClose').addEventListener('click',()=>{$('#testPanel').hidden=true});
  $('#testN').addEventListener('change',e=>{TST.sel.n=+e.target.value});
  $('#testT').addEventListener('change',e=>{TST.sel.timed=e.target.value==='on'});
  $('#testStart').addEventListener('click',testStart);
  const st=$('#stage');
  st.addEventListener('click',e=>{
    const pr=e.target.closest('[data-tprac]');if(pr){testPractise(pr.dataset.tprac,pr.dataset.pm);return}
    const g=e.target.closest('[data-tgo]'),a=e.target.closest('[data-tact]');
    if(g&&S.test){const k=+g.dataset.tgo;if(S.test.done)reviewQ(k);else{saveTestAns();S.test.i=k;S.test.warned=false;loadTestQ()}}
    else if(a){const x=a.dataset.tact;if(x==='submit')testSubmit();else if(x==='results')showResults();else if(x==='again'){testStart()}else if(x==='exit')testExit()}
  });
  st.addEventListener('input',()=>{if(S.test&&!S.test.done){saveTestAns();S.test.warned=false;const nav=document.querySelector('.tnav');if(nav)nav.outerHTML=testNavHTML()}});
}
testInit();
