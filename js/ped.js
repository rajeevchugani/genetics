'use strict';
/* ================= pedigrees: autosomal dominant or recessive only ================= */
const PED_LETTERS=['B','Q','D','F','G','K','M','R','T','W'];
function pedTrait(mode,L){
  return mode==='dom'
   ?domTrait('ped','a genetic condition',L,'affected person','unaffected person','affected people','unaffected people','affected','unaffected','people',true)
   :domTrait('ped','a genetic condition',L,'unaffected person','affected person','unaffected people','affected people','unaffected','affected','people',true);
}
const pedCompat=(gp,gq,gc)=>gp.some(a=>gq.some(b=>[a,b].sort().join('')===gc.slice().sort().join('')));
const wpick=(w,gs)=>{let r=Math.random()*w.reduce((a,b)=>a+b,0);for(let i=0;i<w.length;i++){r-=w[i];if(r<=0)return gs[i]}return gs[gs.length-1]};
function pedFamily(mode,L){
  const l=L.toLowerCase(),G=[[L,L],[L,l],[l,l]];
  const sexes=()=>Math.random()<.5?['M','F']:['F','M'];
  const P=[];const add=(o)=>{o.i=P.length;P.push(o);return o};
  const [s1,s2]=sexes();
  const f1=add({gen:1,sex:s1,par:null}),f2=add({gen:1,sex:s2,par:null});
  const nk=3+rnd(2),kids=[];
  for(let k=0;k<nk;k++)kids.push(add({gen:2,sex:Math.random()<.5?'M':'F',par:[f1.i,f2.i]}));
  const nm=Math.random()<.45?2:1,married=shuf(kids).slice(0,nm),couples=[];
  married.forEach(m=>{const p=add({gen:2,sex:m.sex==='M'?'F':'M',par:null,partner:true});m.mate=p.i;p.mate=m.i;couples.push({a:m.i,b:p.i,kids:[]})});
  couples.forEach(c=>{const n=2+rnd(2);for(let k=0;k<n;k++){const o=add({gen:3,sex:Math.random()<.5?'M':'F',par:[c.a,c.b]});c.kids.push(o.i)}});
  /* genotypes */
  const fw=mode==='rec'?[.25,.5,.25]:[.1,.5,.4],pw=mode==='rec'?[.55,.35,.1]:[.05,.25,.7];
  P.forEach(p=>{
    if(p.gen===1)p.g=wpick(fw,G);else if(p.partner)p.g=wpick(pw,G);
  });
  P.forEach(p=>{if(p.par){const a=pick(P[p.par[0]].g),b=pick(P[p.par[1]].g);p.g=a===L&&b===L?G[0]:(a===l&&b===l?G[2]:G[1])}});
  P.forEach(p=>{p.aff=mode==='dom'?p.g.includes(L):!p.g.includes(L)});
  return {P,couples,kids,G,L,l};
}
/* every genotype assignment consistent with the pictured phenotypes under the stated mode */
function pedPossible(F,mode){
  const {P,G,L}=F,aff=g=>mode==='dom'?g.includes(L):!g.includes(L);
  const opts=P.map(p=>G.filter(g=>aff(g)===p.aff)),cur=new Array(P.length),sets=P.map(()=>new Set());let n=0;
  (function go(i){
    if(n>4000)return;
    if(i===P.length){n++;P.forEach((p,k)=>sets[k].add(gk(cur[k])));return}
    const p=P[i];
    for(const g of opts[i]){
      if(p.par&&!pedCompat(cur[p.par[0]],cur[p.par[1]],g))continue;
      cur[i]=g;go(i+1);
    }
  })(0);
  return n>0?sets:null;
}
function pedEvidence(F,mode){
  const aff=i=>F.P[i].aff;
  const cs=[{a:0,b:1,kids:F.kids.map(k=>k.i)},...F.couples];
  return cs.filter(c=>c.kids.some(k=>mode==='rec'?(!aff(c.a)&&!aff(c.b)&&aff(k)):(aff(c.a)&&aff(c.b)&&!aff(k))));
}
function pedLabels(F){
  const cnt={1:0,2:0,3:0},R=['','I','II','III'];
  /* gen II order: [A,pA, plain..., pB,B] so partners sit beside their mate; gen III follows couple order */
  const g2=[],g3=[];
  const cp=F.couples,plain=F.kids.map(k=>k.i).filter(i=>!cp.some(c=>c.a===i));
  if(cp[0]){g2.push(cp[0].a,cp[0].b)}
  plain.forEach(i=>g2.push(i));
  if(cp[1]){g2.push(cp[1].b,cp[1].a)}
  cp.forEach(c=>c.kids.forEach(k=>g3.push(k)));
  const order={1:[0,1],2:g2,3:g3};
  [1,2,3].forEach(g=>order[g].forEach((i,n)=>{F.P[i].label=`${R[g]}-${n+1}`;F.P[i].pos=n}));
  return order;
}
function pedSVG(F,order){
  const gap=64,half=13,Y={1:46,2:166,3:286},xs={};
  order[2].forEach((i,n)=>xs[i]=n*gap);
  const mid=(a,b)=>(xs[a]+xs[b])/2;
  const kidsMid=F.kids.map(k=>xs[k.i]);
  const cx=(Math.min(...kidsMid)+Math.max(...kidsMid))/2;
  xs[0]=cx-40;xs[1]=cx+40;
  F.couples.forEach(c=>{const m=mid(c.a,c.b),n=c.kids.length;c.kids.forEach((k,j)=>xs[k]=m+(j-(n-1)/2)*58)});
  const all=Object.values(xs),minx=Math.min(...all),off=52-minx,W=Math.max(...all)+off+34;
  const X=i=>xs[i]+off;
  let s='';
  const line=(x1,y1,x2,y2)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  const sib=(px,py,kids,gy)=>{ /* descent line from couple to a sibship line then to each child */
    const sy=gy-half-14,xl=kids.map(X);
    let o=line(px,py,px,sy);
    o+=line(Math.min(...xl,px),sy,Math.max(...xl,px),sy);
    kids.forEach(k=>{o+=line(X(k),sy,X(k),gy-half)});
    return o;
  };
  s+=line(X(0)+half,Y[1],X(1)-half,Y[1]);
  s+=sib((X(0)+X(1))/2,Y[1],F.kids.map(k=>k.i),Y[2]);
  F.couples.forEach(c=>{
    s+=line(Math.min(X(c.a),X(c.b))+half,Y[2],Math.max(X(c.a),X(c.b))-half,Y[2]);
    s+=sib((X(c.a)+X(c.b))/2,Y[2],c.kids,Y[3]);
  });
  F.P.forEach(p=>{
    const x=X(p.i),y=Y[p.gen],fill=p.aff?'var(--accent)':'var(--panel)';
    s+=p.sex==='M'?`<rect x="${x-half}" y="${y-half}" width="${2*half}" height="${2*half}" fill="${fill}"/>`:`<circle cx="${x}" cy="${y}" r="${half}" fill="${fill}"/>`;
    s+=`<text x="${x}" y="${y+half+14}" class="plab">${p.label}</text>`;
  });
  [1,2,3].forEach(g=>{s+=`<text x="4" y="${Y[g]+4}" class="gl">${['','I','II','III'][g]}</text>`});
  const w=Math.max(W,300),H=376,pts={};F.P.forEach(p=>pts[p.i]={x:X(p.i),y:Y[p.gen]+half+34});
  const open=(extra)=>`<svg class="pedsvg" viewBox="0 0 ${w} ${H}" role="img" aria-label="Family pedigree with three generations" style="${extra}" fill="none" stroke="var(--ink)" stroke-width="1.6">${s}</svg>`;
  return {w,H,pts,svg:open(`width:100%;max-width:${Math.max(w,420)}px;height:auto`),fixed:open(`width:100%;height:100%;display:block`)};
}
const PED_TERM={dom:'Dominant',rec:'Recessive'};
function genPed(kind){
  for(let tries=0;tries<400;tries++){
    const mode=Math.random()<.5?'dom':'rec',L=pick(PED_LETTERS),F=pedFamily(mode,L),{P}=F;
    const ev=pedEvidence(F,mode);if(!ev.length)continue;
    const na=P.filter(p=>p.aff).length;if(na<3||P.length-na<3)continue;
    if(!(P.some(p=>p.aff&&p.sex==='M')&&P.some(p=>p.aff&&p.sex==='F')))continue;
    const poss=pedPossible(F,mode);if(!poss)continue;
    const det=P.filter(p=>poss[p.i].size===1);if(det.length<3)continue;
    const order=pedLabels(F),t=pedTrait(mode,L),l=L.toLowerCase(),CH=pedSVG(F,order);
    const c=pick(ev),pa=P[c.a],pb=P[c.b],ck=pick(c.kids.filter(k=>mode==='rec'?P[k].aff:!P[k].aff));
    const names=`${pa.label} and ${pb.label}`;
    /* step 3 individuals: prefer ones who are not the evidence parents so it is not repeated */
    const chosen=shuf(det).slice(0,Math.min(4,det.length)).sort((a,b)=>a.gen-b.gen||a.pos-b.pos);
    const mc=(ans,wrong)=>{const opts=shuf([ans,...wrong]);return {opts,letter:'ABCD'[opts.indexOf(ans)]}};
    const feat=mode==='rec'
      ?mc('Two unaffected parents have an affected child.',['Two affected parents have an unaffected child.','Only females are affected.','Every affected person has at least one affected parent.'])
      :mc('Two affected parents have an unaffected child.',['Two unaffected parents have an affected child.','Only males are affected.','Every unaffected person has two unaffected parents.']);
    const hetAns=mode==='rec'
      ?`Their child ${P[ck].label} is affected and must be ${t.gText([l,l])}, so got a recessive allele from each parent. ${pa.label} and ${pb.label} are unaffected, so each also has a dominant allele. Both are ${t.gText([L,l])}.`
      :`Their child ${P[ck].label} is unaffected and must be ${t.gText([l,l])}, so got a recessive allele from each parent. ${pa.label} and ${pb.label} are affected, so each also has a dominant allele. Both are ${t.gText([L,l])}.`;
    const het=mode==='rec'
      ?mc(hetAns,['Both parents are unaffected, and unaffected people are always heterozygous.',`Both parents must be ${t.gText([l,l])} because their child is affected.`,`Both parents must be ${t.gText([L,L])} so that none of their children can be affected.`])
      :mc(hetAns,['Both parents are affected, and affected people are always heterozygous.',`Both parents must be ${t.gText([L,L])} because they are affected.`,`Both parents must be ${t.gText([l,l])} because their child is unaffected.`]);
    const optHTML=m=>m.opts.map((o,i)=>`${'ABCD'[i]}. ${o}`);
    const q={kind,t,stages:[],special:true,N:0};
    q.qtext=`The pedigree below shows how a genetic condition is inherited in one family. Shaded symbols are affected, unshaded symbols are unaffected. Circles are females and squares are males. The condition is autosomal (it is not sex-linked) and is controlled by one gene with two alleles. Use the letter ${L} for the alleles.`;
    const gtxt=k=>k.split('|').join('');
    const geno=chosen.map(p=>({label:p.label,g:P[p.i].g,gi:poss[p.i]}));
    const people=P.map(p=>({i:p.i,label:p.label,g:p.g,keys:[...poss[p.i]],sure:poss[p.i].size===1,exp:t.gText(p.g)}));
    const ansAll=people.slice().sort((a,b)=>a.label.localeCompare(b.label)).map(x=>`${x.label} is ${x.sure?x.exp:x.keys.map(gtxt).join(' or ')}`).join(', ');
    q.sp={kind:'ped',sub:'ped',sig:'ped'+Math.random().toString(36).slice(2,8),mode,L,svg:CH.svg,chart:CH,
      keyHTML:`Key: shaded = affected, unshaded = unaffected, circle = female, square = male. Genotypes use the letter <b>${L}</b>.`,
      couple:names,feat,het,geno,people,optHTML,
      titles:{ped1:'Dominant or recessive?',ped2:'A feature of the pattern',ped3:'Genotypes',ped4:`Why ${names} must be heterozygous`},
      tips:{
       ped1:{tip:'Look for a couple whose children look different from them. Two unaffected parents with an affected child (or two affected parents with an unaffected child) tells you which allele is hidden.',ans:PED_TERM[mode]},
       ped2:{tip:'Find a family where a child shows a different phenotype from both parents. Which allele must that child have received from each parent?',ans:`${feat.letter}. ${feat.opts[feat.letter.charCodeAt(0)-65]}`},
       ped3:{tip:`Use your answer to step 1. If the trait is recessive, affected people are ${t.gText([l,l])} and unaffected parents of an affected child are ${t.gText([L,l])}. If it is dominant, unaffected people are ${t.gText([l,l])} and affected parents of an unaffected child are ${t.gText([L,l])}. Then work out the others from their parents and children.`,ans:ansAll},
       ped4:{tip:`Look at the child of ${names}. What genotype must the child have? Where did each of its alleles come from?`,ans:`${het.letter}. ${hetAns}`}
      }};
    q.sp.wk=[
      {title:'Read the pedigree',html:`<p>Shaded symbols are affected. ${P.filter(p=>p.aff).map(p=>p.label).join(', ')} are affected. Look for a couple with a child who looks different from both parents.</p>${q.sp.svg}`},
      {title:`Dominant or recessive?`,html:`<p>${names} ${mode==='rec'?'are both unaffected but have an affected child':'are both affected but have an unaffected child'} (${P[ck].label}). That can only happen if the trait is <b>${PED_TERM[mode].toLowerCase()}</b>.</p>`},
      {title:'Heterozygous parents',html:`<p>${hetAns}</p>`},
      {title:'Genotypes',html:`<p>Using the letter ${L}: ${people.map(x=>x.sure?`${x.label} is <b>${t.gHTML(x.g)}</b>`:`${x.label} is <b>${x.keys.map(k=>t.gHTML(k.split('|'))).join(' or ')}</b>`).join('; ')}.</p><p>${mode==='rec'?`Affected people are ${t.gHTML([l,l])}. Unaffected people with an affected parent or child must carry one ${t.tHTML(l)}.`:`Unaffected people are ${t.gHTML([l,l])}. Affected people with an unaffected parent or child must carry one ${t.tHTML(l)}.`}</p>`}
    ];
    return q;
  }
  return genAboq(kind);
}
