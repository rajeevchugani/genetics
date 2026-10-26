'use strict';
/* ================= explanations, tips and the worked solution ================= */
function parentWhy(t,g){
  const h=t.gHTML(g);
  if(t.sys==='dom'){const k=g.filter(a=>a===t.al[0]).length;
    if(k===2)return `<b>homozygous</b> means two identical alleles, and ${t.domS} is dominant, so two capitals: ${h}.`;
    if(k===1)return `<b>heterozygous</b> means two different alleles, one of each: ${h}. It shows the dominant trait because the capital letter wins.`;
    return `a recessive trait only appears when there is no dominant allele, so two small letters: ${h}.`}
  if(t.sys==='multi'){const [x,y]=g;
    if(x===y)return x==='c'?`albino is the most recessive coat colour, so it needs two copies of ${t.tHTML('c')}: ${h}.`:`homozygous ${RAB_NAMES[x]} means two identical alleles: ${h}.`;
    return `${RAB_NAMES[x]}/${RAB_NAMES[y]} means one of each allele, so the genotype is ${h}.`}
  if(t.sys==='abo'){const k=gk(g);
    if(k==='i|i')return `group O means no A or B antigen is made, so the genotype is ${h}.`;
    if(k==='IA|IB')return `group AB means both antigens are made. ${t.tHTML('IA')} and ${t.tHTML('IB')} are codominant, so the genotype is ${h}.`;
    return `${k.includes('IA')?'group A':'group B'}, and the question says it is ${g[0]===g[1]?'homozygous':'heterozygous'}, so the genotype is ${h}.`}
  return `each phenotype has its own genotype here, and ${t.pheno(g).label} is ${h}.`;
}
function ruleHTML(t){
  const [a,m,b]=t.genos;
  if(t.sys==='dom')return `A box with at least one capital letter shows the dominant phenotype (${t.domS}). Only two small letters show the recessive phenotype (${t.recS}).`;
  if(t.sys==='multi')return `The dominance order is ${['CA','CC','CH','c'].map(t.tHTML).join(' > ')}. Each rabbit shows the coat colour of the allele highest in this order that it carries: ${t.tHTML('CA')} gives agouti, ${t.tHTML('CC')} (without ${t.tHTML('CA')}) gives chinchilla, ${t.tHTML('CH')} (without ${t.tHTML('CA')} or ${t.tHTML('CC')}) gives Himalayan, and ${t.gHTML(['c','c'])} gives albino.`;
  const P=t.phenos;
  if(t.sys==='inc')return `Neither allele is fully dominant, so the heterozygote is in between. ${t.gHTML(a)} gives ${P[0].label}, ${t.gHTML(m)} gives ${P[1].label} (a blend), and ${t.gHTML(b)} gives ${P[2].label}. Every genotype has its own phenotype.`;
  if(t.sys==='cod')return `Both alleles are expressed in the heterozygote, so nothing is blended. ${t.gHTML(a)} gives ${P[0].label}, ${t.gHTML(b)} gives ${P[2].label}, and ${t.gHTML(m)} gives ${P[1].label} because both colours show at the same time.`;
  const I=x=>t.tHTML(x);
  return `${I('IA')} and ${I('IB')} are both dominant to ${I('i')}, so ${t.gHTML(['IA','IA'])} and ${t.gHTML(['IA','i'])} give group A, and ${t.gHTML(['IB','IB'])} and ${t.gHTML(['IB','i'])} give group B. ${I('IA')} and ${I('IB')} are codominant, so ${t.gHTML(['IA','IB'])} makes both antigens: group AB. ${t.gHTML(['i','i'])} gives group O.`;
}
function keyExtra(t){
  if(t.sys==='multi')return '<p>This gene has <b>four alleles</b> (multiple alleles) but each rabbit only has two. The alleles follow a dominance order, so an allele is dominant to every allele after it in the list.</p>';
  if(t.sys==='dom')return '<p>A capital letter is the <b>dominant</b> allele. It shows in the phenotype whenever it is present. The small letter is <b>recessive</b> and only shows when there is no capital.</p>';
  if(t.sys==='inc')return '<p>This is <b>incomplete dominance</b>. Neither allele fully hides the other, so a heterozygote has an in-between phenotype. We use capital C with a small raised letter for each allele.</p>';
  if(t.sys==='cod')return '<p>This is <b>codominance</b>. Both alleles are expressed in a heterozygote and both show, so nothing is blended. We use capital C with a small raised letter for each allele.</p>';
  return '<p>The ABO group is controlled by a gene with <b>three alleles</b> (multiple alleles), but each person only has two. Group A is '+t.gHTML(['IA','IA'])+' or '+t.gHTML(['IA','i'])+', group B is '+t.gHTML(['IB','IB'])+' or '+t.gHTML(['IB','i'])+', group AB is '+t.gHTML(['IA','IB'])+' and group O is '+t.gHTML(['i','i'])+'.</p>';
}
function tipOf(step,q,si){
  if(q.special)return q.sp.tips[step];
  const s=q.stages[si],r=s.res,t=q.t,rev=!!q.rev,h=t.gHTML;
  const lab=tpLabel(t,s);
  switch(step){
    case 'par':{
      let tip;
      if(rev)tip=t.sys==='abo'?'Work backwards from the children. A child with group O must be ii, so both parents passed on an i. Look at which groups appear and which are missing.':'Work backwards from the offspring. Ask which alleles the parents must have passed on to give these results, and look for ratios such as 1 : 1, 3 : 1 or 1 : 2 : 1.';
      else if(t.sys==='dom')tip='"Homozygous" means two identical alleles. "Heterozygous" means one of each. A plain recessive phenotype can only be two small letters.';
      else if(t.sys==='multi')tip='Use the dominance order in the key. A homozygous rabbit has two identical alleles. A rabbit described as X/Y has one X allele and one Y allele.';
      else if(t.sys==='abo')tip='Group O is ii and group AB is IAIB. Group A can be IAIA or IAi and group B can be IBIB or IBi. The question tells you which.';
      else tip='With '+(t.sys==='inc'?'incomplete dominance':'codominance')+' each phenotype matches exactly one genotype. The two homozygotes show the pure phenotypes and the heterozygote shows the mixed one.';
      return {tip,ans:`Parent 1 is ${h(s.p1)} and Parent 2 is ${h(s.p2)}.`}}
    case 'gam':return {tip:'A gamete carries just one allele from the pair. Split each parent into its two alleles. A homozygous parent can only make one kind of gamete.',ans:`Parent 1 makes ${gamOf(t,s.p1).map(t.tHTML).join(' and ')}. Parent 2 makes ${gamOf(t,s.p2).map(t.tHTML).join(' and ')}.`};
    case 'pun':return {tip:"Put Parent 1's alleles across the top and Parent 2's down the side. Each box joins the top allele to the side allele. Write the alleles in the same order each time"+(t.sys==='dom'?' (capital first).':t.sys==='abo'?' (IA, then IB, then i).':t.sys==='multi'?' (follow the dominance order in the key).':'.'),ans:`Top row: ${r.cells[0].map(h).join(', ')}. Bottom row: ${r.cells[1].map(h).join(', ')}.`};
    case 'gen':return {tip:'Count how many of the 4 boxes show each genotype.'+(t.multi?' Only the genotypes that appear in the square are listed.':' The numbers should add up to 4, or to a smaller ratio that means the same thing.'),ans:genList(t,r).map(g=>`${r.gen[gk(g)]} ${h(g)}`).join(' : ')};
    case 'phe':return {tip:ruleHTML(t),ans:phList(t,r).map(p=>`${r.ph[p.k]} ${p.short}`).join(' : ')};
    case 'pct':return {tip:`Each of the 4 boxes is worth 25%. Count the boxes that show ${lab} and multiply by 25.`,ans:`${s.tpCount} box${s.tpCount===1?'':'es'} × 25% = ${s.pctTp}%.`};
    default:return {tip:`Chance of ${lab} × the number of offspring. Here that is ${q.N} × ${s.tpCount}/4.`,ans:`${q.N*s.tpCount/4}`};
  }
}

/* ---------- worked solution ---------- */
function punnettStatic(t,s,fill,anim){
  const r=s.res;let h='<div class="pgrid"><div></div>'+s.p1.map(a=>`<div class="h">${t.tHTML(a)}</div>`).join('');
  [0,1].forEach(i=>{h+=`<div class="h">${t.tHTML(s.p2[i])}</div>`;[0,1].forEach(j=>{
    h+=fill?`<div class="cell${anim?' pop':''}" style="animation-delay:${(i*2+j)*.25}s">${t.gHTML(r.cells[i][j])}</div>`:'<div class="cell empty">?</div>'})});
  return h+'</div>';
}
function wkSteps(q){
  if(q.special&&q.sp.kind==='ped')return q.sp.wk;
  const t=q.t,out=[],h=t.gHTML;
  out.push({title:'Write the key',html:`<p>${t.keyHTML()}</p>${keyExtra(t)}`});
  if(q.special){
    const sp=q.sp;
    out.push({title:sp.titles.sp1,html:`<p>${sp.tips.sp1.tip}</p><p><b>So:</b> ${sp.tips.sp1.ans}</p>`});
    out.push({title:sp.sub==='possible'?'Test every pairing':'Check each possible father',html:sp.sub==='possible'?`<p>Make a Punnett square for each pairing of the parents' genotypes.</p><ul>${sp.work.lines.map(l=>`<li>${l}</li>`).join('')}</ul>`:`<p>Test each blood group the father could have.</p><ul>${sp.work.lines.map(l=>`<li>${l}</li>`).join('')}</ul>`});
    out.push({title:'Answer',html:`<p>${sp.reason}</p><p><span class="ratio">${sp.ansText}</span></p>`});
    return out;
  }
  if(q.rev)out.push({title:'Read the clue',html:`<p>${q.rev.intro}</p><p>${q.rev.reason}</p>`});
  q.stages.forEach((s,si)=>{
    const r=s.res,pre=q.stages.length>1?`Cross ${si+1} · `:'',last=si===q.stages.length-1;
    out.push({title:pre+'Parent genotypes',html:q.rev
      ?`<p>The parents must be ${h(s.p1)} × ${h(s.p2)}.</p>`
      :`<p>Parent 1 is ${art(t.describe(s.p1))}: ${parentWhy(t,s.p1)}</p><p>Parent 2 is ${art(t.describe(s.p2))}: ${parentWhy(t,s.p2)}</p>`});
    const g1=gamOf(t,s.p1),g2=gamOf(t,s.p2),gl=a=>a.map(t.tHTML).join(' or ');
    out.push({title:pre+'Gametes',html:`<p>Each gamete carries <b>one</b> allele from the pair.</p><p>Parent 1 (${h(s.p1)}) makes gametes with ${gl(g1)}${g1.length===1?' only':''}.</p><p>Parent 2 (${h(s.p2)}) makes gametes with ${gl(g2)}${g2.length===1?' only':''}.</p>`});
    out.push({title:pre+'Set up the Punnett square',html:`<p>Parent 1's alleles go across the top, Parent 2's down the side.</p>${punnettStatic(t,s,false)}`});
    out.push({title:pre+'Fill every box',html:`<p>Each box is the allele at the top of its column joined to the allele at the side of its row.</p>${punnettStatic(t,s,true,true)}`});
    const gl2=genList(t,r),gc=gl2.map(g=>r.gen[gk(g)]);
    out.push({title:pre+'Count the genotypes',html:`<p>Out of 4 boxes: <span class="ratio">${gl2.map(g=>`${r.gen[gk(g)]} ${h(g)}`).join(' : ')}</span></p>${ratioText(gc)!==gc.join(' : ')?`<p>Simplified, that is <span class="ratio">${ratioText(gc)}</span>.</p>`:''}`});
    const pl=phList(t,r),pc=pl.map(p=>r.ph[p.k]);
    out.push({title:pre+'Read off the phenotypes',html:`<p>${ruleHTML(t)}</p><p><span class="ratio">${pl.map(p=>`${r.ph[p.k]} ${p.short}`).join(' : ')}</span>${ratioText(pc)!==pc.join(' : ')?` which simplifies to <span class="ratio">${ratioText(pc)}</span>`:''}</p><p>Each box is 25%, so the chance of an offspring with ${tpLabel(t,s)} is ${s.tpCount} × 25% = <b>${s.pctTp}%</b>.</p>`});
    if(last)out.push({title:pre+'Predict real numbers',html:`<p>If this cross produced ${q.N} offspring, expect ${q.N} × ${s.tpCount}/4 = <b>${q.N*s.tpCount/4}</b> with ${tpLabel(t,s)}. Real results vary a little, but large numbers get close to the prediction.</p>`});
    else out.push({title:'Choose the F1 parents',html:`<p>Every F1 offspring is ${h(r.cells[0][0])}. Take any two of them and cross them. That cross is the next stage.</p>`});
  });
  return out;
}
