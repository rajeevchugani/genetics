'use strict';
/* ================= question generator ================= */
const Nopts=[40,80,120,160,200,400];
function traitFor(sys,type){
  if(sys==='dom')return pick(type==='cross'||type==='rev'?DOM_TRAITS:DOM_TRAITS.filter(x=>!x.human));
  if(sys==='inc')return pick(INC_TRAITS);
  if(sys==='cod')return type==='rev'?COD_TRAITS[0]:pick(COD_TRAITS);
  if(sys==='multi')return RABBIT;
  return ABO;
}
function genFwd(sys,type,kind){
  const t=traitFor(sys,type),q={kind,t,stages:[],N:pick(Nopts)},swap=Math.random()<.5;
  if(sys==='multi'){
    const G=t.genos;let a,b;
    do{a=pick(G);b=pick(G)}while(gk(a)===gk(b)&&Math.random()<.7);
    q.stages=[mkStage(t,a,b,'Cross','offspring')];
    q.qtext=`In rabbits, coat colour is controlled by one gene with four alleles. Agouti is dominant to all the others, chinchilla is dominant to Himalayan and albino, and Himalayan is dominant to albino. ${cap(art(t.describe(a)))} is mated with ${art(t.describe(b))}. Show the cross and predict the possible offspring.`;
    return q;
  }
  if(t.sickle){
    const [H1,Het,H2]=t.genos,c=pick([[Het,Het],[Het,Het],[H1,Het],[Het,H1],[Het,H2],[H2,Het],[H1,H2],[H2,H2]]);
    q.stages=[mkStage(t,c[0],c[1],'Cross','offspring')];
    q.qtext=`Two alleles at one gene decide whether a person gets sickle-cell disease. The normal allele and the sickle allele are codominant, and a person needs at least one normal allele to be healthy. ${cap(art(t.describe(c[0])))} and ${art(t.describe(c[1]))} have children together. Show the cross and predict the possible children.`;
    return q;
  }
  if(sys==='abo'){
    const G=t.genos,pr=pick([[2,4],[2,2],[4,4],[1,5],[0,3],[2,5],[4,5],[1,2],[1,4],[1,1],[0,4],[0,5]]);
    let a=G[pr[0]],b=G[pr[1]];if(swap)[a,b]=[b,a];
    q.stages=[mkStage(t,a,b,'Cross','offspring')];
    q.qtext=`A woman with ${t.describe(a)} and a man with ${t.describe(b)} have children. Predict the possible blood groups of their children.`;
    return q;
  }
  const [H1,Het,H2]=t.genos,d=g=>t.describe(g),inc=sys!=='dom';
  const note=sys==='inc'?' Neither allele is fully dominant.':sys==='cod'?' Both alleles are expressed in the heterozygote.':'';
  const pf=(a,b)=>swap?[b,a]:[a,b];
  if(type==='f1'){
    const [a,b]=pf(H1,H2);q.stages=[mkStage(t,a,b,'P generation → F1','F1')];
    q.qtext=`${cap(art(d(a)))} is crossed with ${art(d(b))}. Predict the offspring of this cross (the F1 generation).${note}`;
  }else if(type==='f2'){
    q.stages=[mkStage(t,Het,Het,'F1 × F1 → F2','F2')];
    q.qtext=`Two F1 ${t.orgPL} are crossed with each other. ${inc?`Both have ${t.phenos[1].label}.`:'Both are heterozygous.'} Predict the F2 generation.${note}`;
  }else if(type==='full'){
    const [a,b]=pf(H1,H2);
    q.stages=[mkStage(t,a,b,'P generation → F1','F1'),mkStage(t,Het,Het,'F1 × F1 → F2','F2')];
    q.qtext=`${cap(art(d(a)))} is crossed with ${art(d(b))} to make the F1 generation. Two of the F1 ${t.orgPL} are then crossed with each other to make the F2 generation. Predict both generations.${note}`;
  }else{
    const c=pick([[Het,H2],[H2,Het],[H1,Het],[Het,H1],[Het,Het]]);
    q.stages=[mkStage(t,c[0],c[1],'Cross','offspring')];
    q.qtext=t.human?`${cap(art(d(c[0])))} and ${art(d(c[1]))} have children together. Predict the possible children.`:`${cap(art(d(c[0])))} is crossed with ${art(d(c[1]))}. Predict the offspring.${note}`;
  }
  return q;
}
const spreadCounts=(base,jit)=>{ // base: array of exact counts; jitter keeps the sum
  const out=base.slice(),nz=out.map((v,i)=>v>0?i:-1).filter(i=>i>=0);
  if(nz.length>1){const j=pick([-2,-1,0,1,2]);out[nz[0]]+=j;out[nz[nz.length-1]]-=j}
  return out;
};
const listCounts=(t,cnt,T)=>{const parts=t.phenos.map((p,i)=>cnt[i]>0?`${cnt[i]} ${t.sys==='abo'?'have '+p.label:'have '+p.label}`:null).filter(Boolean);
  return parts.length===1?`all ${T} offspring have ${t.phenos[cnt.findIndex(v=>v>0)].label}`:`${parts.slice(0,-1).join(', ')} and ${parts[parts.length-1]}`};

function genRev(sys,kind){
  const t=traitFor(sys,'rev'),q={kind,t,stages:[],N:pick(Nopts)};
  let p,intro,reason;
  if(sys==='dom'){
    const [DD,Dd,dd]=t.genos,T=pick([40,60,80,100,120,160,200]),jit=pick([-3,-2,-1,0,1,2,3]),tpl=pick(['r1','r2','r3','r4']);
    const tail=(d,r)=>`Among the ${T} offspring, ${d} show the dominant phenotype (${t.domS}) and ${r} show the recessive phenotype (${t.recS}).`;
    if(tpl==='r1'){p=[Dd,Dd];const dom=Math.round(T*.75)+jit;
      intro=`Two ${t.domPL} are crossed. ${tail(dom,T-dom)} Work out the genotypes of the two parents.`;
      reason=`Both parents show the dominant trait, yet some offspring show the recessive trait. Those offspring must be ${t.gHTML(dd)}, so each parent carries a hidden ${t.tHTML(dd[0])}. The ratio is close to 3 : 1, which is what ${t.gHTML(Dd)} × ${t.gHTML(Dd)} gives.`}
    else if(tpl==='r2'){p=[Dd,dd];const dom=Math.round(T/2)+jit;
      intro=`${cap(art(t.domNP))} is crossed with ${art(t.recNP)}. ${tail(dom,T-dom)} Work out the genotypes of the two parents.`;
      reason=`The recessive parent is ${t.gHTML(dd)} and can only pass on ${t.tHTML(dd[0])}. About half the offspring show the recessive trait, so the other parent must pass on ${t.tHTML(dd[0])} half the time too. It must be ${t.gHTML(Dd)}. A ratio close to 1 : 1 is the sign of a test cross.`}
    else if(tpl==='r3'){p=[DD,dd];
      intro=`${cap(art(t.domNP))} is crossed with ${art(t.recNP)}. All ${T} offspring show the dominant phenotype (${t.domS}). Work out the genotypes of the two parents.`;
      reason=`The recessive parent is ${t.gHTML(dd)} and can only pass on ${t.tHTML(dd[0])}. No offspring show the recessive trait, so the other parent never passes on ${t.tHTML(dd[0])}. It must be ${t.gHTML(DD)}. If it were ${t.gHTML(Dd)}, about half the offspring would be recessive.`}
    else{p=[Dd,Dd];
      intro=`Two ${t.domPL} ${t.human?'have a child':'produce an offspring'} with the recessive phenotype (${t.recS}). Work out the genotypes of the two parents.`;
      reason=`The offspring must be ${t.gHTML(dd)}, so it received a ${t.tHTML(dd[0])} from each parent. Both parents show the dominant trait, so each must also have the dominant allele. Both parents are ${t.gHTML(Dd)}.`}
    q.rev={tpl,intro,reason};q.stages=[mkStage(t,p[0],p[1],'Cross','offspring')];
  }else if(sys==='inc'||sys==='cod'){
    const [A,M,B]=t.genos,T=pick([40,60,80,100,120]),tpl=pick(['i1','i2','i3','i4']),a=A[0],b=B[0],L=t.phenos;
    let cnt;
    if(tpl==='i1'){p=[A,B];cnt=[0,T,0];
      reason=`Every offspring has ${L[1].label}, the in-between phenotype. That happens when one parent can only pass on ${t.tHTML(a)} and the other can only pass on ${t.tHTML(b)}. The parents must be ${t.gHTML(A)} (${L[0].label}) and ${t.gHTML(B)} (${L[2].label}).`}
    else if(tpl==='i2'){p=[M,M];cnt=[T/4,T/2,T/4];
      reason=`All three phenotypes appear in a ratio close to 1 : 2 : 1. That ratio comes from two heterozygous parents, ${t.gHTML(M)} × ${t.gHTML(M)}. Each parent has ${L[1].label}.`}
    else if(tpl==='i3'){p=[M,B];cnt=[0,T/2,T/2];
      reason=`There is no ${L[0].label} among the offspring, so no parent is ${t.gHTML(A)}. A 1 : 1 ratio of ${L[1].label} to ${L[2].label} comes from a heterozygous parent ${t.gHTML(M)} crossed with ${t.gHTML(B)}.`}
    else{p=[A,M];cnt=[T/2,T/2,0];
      reason=`There is no ${L[2].label} among the offspring, so no parent is ${t.gHTML(B)}. A 1 : 1 ratio of ${L[0].label} to ${L[1].label} comes from ${t.gHTML(A)} crossed with a heterozygous parent ${t.gHTML(M)}.`}
    cnt=spreadCounts(cnt);
    intro=`Two ${t.orgPL} are crossed. Among the ${T} offspring, ${listCounts(t,cnt,T)}. Work out the genotypes of the two parents.`;
    q.rev={tpl,intro,reason};q.stages=[mkStage(t,p[0],p[1],'Cross','offspring')];
  }else{
    const [AA,AB,Ai,BB,Bi,ii]=t.genos,tpl=pick(['b1','b2','b3','b4','b5','b6']),I=k=>t.tHTML(k);
    if(tpl==='b1'){p=[Ai,Bi];
      intro='A woman with blood group A and a man with blood group B have four children. One child has blood group A, one has blood group B, one has blood group AB and one has blood group O. Work out the genotypes of the two parents.';
      reason=`A child with group O must be ${t.gHTML(ii)}, so each parent passed on an ${I('i')}. Neither parent is group O, so each also carries an antigen allele. The group A parent is ${t.gHTML(Ai)} and the group B parent is ${t.gHTML(Bi)}. These genotypes can also make groups A, B and AB.`}
    else if(tpl==='b2'){p=[Ai,Ai];
      intro='Two parents with blood group A have a child with blood group O. Work out the genotypes of the two parents.';
      reason=`Group O is ${t.gHTML(ii)}, so each parent passed on an ${I('i')}. Both parents show group A, so each also has ${I('IA')}. Both parents are ${t.gHTML(Ai)}.`}
    else if(tpl==='b3'){p=[AB,ii];
      intro='Two parents have several children. Every child has blood group A or blood group B. None have group AB or group O. Work out the genotypes of the two parents.';
      reason=`No child has group O, so at most one parent passes on ${I('i')}. No child has group AB, so no single parent gives ${I('IA')} while the other gives ${I('IB')} to the same child. One parent must be ${t.gHTML(AB)} and the other ${t.gHTML(ii)}: every child gets either ${I('IA')} or ${I('IB')} from one parent and ${I('i')} from the other.`}
    else if(tpl==='b4'){p=[Ai,ii];const T=pick([6,8,10,12]);
      intro=`A woman with blood group A and a man with blood group O have ${T} children. ${T/2} have blood group A and ${T/2} have blood group O. Work out the genotypes of the two parents.`;
      reason=`The father is group O, so he is ${t.gHTML(ii)}. Half the children are group O, so the mother must pass on ${I('i')} about half the time. She is ${t.gHTML(Ai)}.`}
    else if(tpl==='b5'){p=[AB,AB];const T=pick([20,40,60]);
      intro=`Two parents have ${T} children. ${T/4} have blood group A, ${T/2} have blood group AB and ${T/4} have blood group B. No child has group O. Work out the genotypes of the two parents.`;
      reason=`A ratio of 1 : 2 : 1 for A : AB : B means both parents are ${t.gHTML(AB)}. Each parent can only pass on ${I('IA')} or ${I('IB')}, which is why no child has group O.`}
    else{p=[AA,BB];
      intro='A woman with blood group A and a man with blood group B have five children. All five children have blood group AB. Work out the genotypes of the two parents.';
      reason=`Every child is ${t.gHTML(AB)}. The mother can only pass on ${I('IA')} and the father can only pass on ${I('IB')}. The mother is ${t.gHTML(AA)} and the father is ${t.gHTML(BB)}.`}
    q.rev={tpl,intro,reason};q.stages=[mkStage(t,p[0],p[1],'Cross','offspring')];
  }
  q.qtext=q.rev.intro;
  return q;
}

function genAboq(kind){
  const t=ABO,sub=Math.random()<.55?'possible':'father',I=k=>t.tHTML(k);
  const q={kind,t,stages:[],special:true,N:0};
  const gl=g=>GROUP_GENOS[g].map(x=>t.gHTML(x)).join(' or ');
  const listTxt=g=>GROUP_GENOS[g].map(x=>t.gText(x)).join(', ');
  if(sub==='possible'){
    let mg,fg,ans;
    do{mg=pick(GROUPS);fg=pick(GROUPS);ans=childGroups(mg,fg)}while((ans.length===1&&Math.random()<.6)||(ans.length===4&&Math.random()<.4));
    const lines=[];
    GROUP_GENOS[mg].forEach(a=>GROUP_GENOS[fg].forEach(b=>lines.push(`${t.gHTML(a)} × ${t.gHTML(b)} can make group ${doCross(t,a,b).cells.flat().map(c=>t.phenoOf(c)).filter((v,i,arr)=>arr.indexOf(v)===i).sort((x,y)=>GROUPS.indexOf(x)-GROUPS.indexOf(y)).join(', ')}`)));
    q.qtext=`A woman has blood group ${mg} and a man has blood group ${fg}. They have a child. Work out which blood groups the child could have.`;
    q.sp={sub,sig:'p'+mg+fg,titles:{sp1:'Possible genotypes',sp2:'Possible blood groups'},
      exp1:[genoKeys(GROUP_GENOS[mg]),genoKeys(GROUP_GENOS[fg])],exp1Text:[listTxt(mg),listTxt(fg)],
      labels1:['Mother (group '+mg+')','Father (group '+fg+')'],ans,ansText:ans.join(', '),
      ref:'Group A is I^AI^A or I^Ai. Group B is I^BI^B or I^Bi. Group AB is I^AI^B. Group O is ii.',
      tips:{sp1:{tip:`Group A can be ${t.gHTML(['IA','IA'])} or ${t.gHTML(['IA','i'])}, group B can be ${t.gHTML(['IB','IB'])} or ${t.gHTML(['IB','i'])}, group AB is ${t.gHTML(['IA','IB'])} and group O is ${t.gHTML(['i','i'])}. Write every genotype that is possible for each parent.`,ans:`Mother: ${gl(mg)}. Father: ${gl(fg)}.`},
            sp2:{tip:"Try every pairing of the parents' possible genotypes in a Punnett square and collect all the blood groups that appear.",ans:ans.join(', ')}},
      work:{lines,gl:gl(mg)+'|'+gl(fg)},
      reason:`The mother (group ${mg}) could be ${gl(mg)}. The father (group ${fg}) could be ${gl(fg)}. Trying every pairing gives: ${lines.join('; ')}. Putting all the results together, the child could have group ${ans.join(', ')}.`};
  }else{
    let mg,cg,fa;
    do{mg=pick(GROUPS);const poss=GROUPS.filter(c=>GROUPS.some(f=>childGroups(mg,f).includes(c)));cg=pick(poss);fa=fatherGroups(cg,mg)}while(fa.length<1||fa.length>3);
    q.qtext=`A woman with blood group ${mg} has a child with blood group ${cg}. Work out which blood groups the child's father could have.`;
    const yes=fa,no=GROUPS.filter(x=>!fa.includes(x));
    const lines=GROUPS.map(f=>`Father group ${f}: ${fa.includes(f)?'possible':'not possible (the child could only be group '+childGroups(mg,f).join(', ')+')'}`);
    q.sp={sub,sig:'f'+mg+cg,titles:{sp1:'Possible genotypes of the child',sp2:'Possible blood groups of the father'},
      exp1:[genoKeys(GROUP_GENOS[cg])],exp1Text:[listTxt(cg)],labels1:['Child (group '+cg+')'],ans:fa,ansText:fa.join(', '),
      ref:'Group A is I^AI^A or I^Ai. Group B is I^BI^B or I^Bi. Group AB is I^AI^B. Group O is ii.',
      tips:{sp1:{tip:`Write every genotype that gives blood group ${cg}. Group A can be ${t.gHTML(['IA','IA'])} or ${t.gHTML(['IA','i'])}, group B can be ${t.gHTML(['IB','IB'])} or ${t.gHTML(['IB','i'])}, group AB is ${t.gHTML(['IA','IB'])} and group O is ${t.gHTML(['i','i'])}.`,ans:`Child: ${gl(cg)}.`},
            sp2:{tip:'The child got one allele from the mother and one from the father. Work out which alleles the father must have passed on, then decide which blood groups could do that. Check each of A, B, AB and O in turn.',ans:fa.join(', ')}},
      work:{lines,gl:gl(cg)},
      reason:`The child (group ${cg}) could be ${gl(cg)}. The mother (group ${mg}) could be ${gl(mg)}. Checking each possible father: ${lines.join('; ')}. So the father could have group ${fa.join(', ')}${no.length?`, but not group ${no.join(', ')}`:''}.`};
  }
  return q;
}
function genQuestion(kind){
  const R=Math.random();
  if(kind==='aboq')return genAboq(kind);
  if(kind==='multi')return genFwd('multi','cross',kind);
  if(kind==='ped')return genPed(kind);
  if(kind==='reverse')return genRev(R<.5?'dom':R<.68?'inc':R<.78?'cod':'abo',kind);
  if(kind==='inc')return R<.35?genRev('inc',kind):genFwd('inc',pick(['f1','f2','full','cross','cross']),kind);
  if(kind==='cod'){const abo=Math.random()<.35;return R<.3?genRev(abo?'abo':'cod',kind):(abo?genFwd('abo','cross',kind):genFwd('cod',pick(['f1','f2','full','cross','cross','cross']),kind))}
  if(kind==='abo')return R<.3?genRev('abo',kind):R<.6?genAboq(kind):genFwd('abo','cross',kind);
  return genFwd('dom',kind,kind);
}
function chooseKind(mode){
  const W={guided:{f1:3,f2:3,full:1,cross:2,reverse:1,inc:1,cod:1,abo:1,aboq:1,multi:1,ped:2},practice:{f1:2,f2:2,full:1,cross:3,reverse:3,inc:2,cod:1,abo:3,aboq:2,multi:2,ped:3},
           challenge:{f1:1,f2:1,full:2,cross:3,reverse:4,inc:2,cod:2,abo:4,aboq:3,multi:3,ped:4},watch:{f1:2,f2:2,full:1,cross:2,reverse:2,inc:2,cod:1,abo:2,aboq:1,multi:1,ped:2}}[mode];
  const bag=[];Object.entries(W).forEach(([k,n])=>{for(let i=0;i<n;i++)bag.push(k)});return pick(bag);
}
function introHTML(q,mode){
  let h=q.qtext;
  if((mode==='guided'||mode==='watch')&&!q.rev&&!q.special)h+=` <b>Genotypes:</b> ${q.stages.map(s=>q.t.gHTML(s.p1)+' × '+q.t.gHTML(s.p2)).join(' then ')}.`;
  return h;
}
