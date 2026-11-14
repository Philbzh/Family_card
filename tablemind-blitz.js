/* TABLE MIND — Act III "DER BLITZ" (the buzzer act): pure rules, no screens. Spec: TABLEMIND_BLITZ_SPEC.md
   Needs tablemind-engine.js (tmRand, tmShuffled, TM_CFG ...). The state lives in tm.blitz while tm.phase === 'blitz'.
   One question: intro (buzzers locked) -> clue (four clues, the prize drops with every clue) -> a buzz freezes the clues and the buzzer
   answers (7 s) -> if wrong the others may steal (5 s window, one attempt) -> result.
   Everything is driven by the time handed in (now), never by a clock of its own, so every device can replay it and the tests can check it.
   Questions come from TM_BZ_DE (tablemind-blitz-questions-de.js): [cat, level, scope, clue1, clue2, clue3, clue4, right, wrong1, wrong2, wrong3, explanation]. */
const TM_BZ_CFG={
  nq:5,
  prizes:[2500,2000,1500,1000],     // the prize at clue 1..4
  introMs:2500,stageMs:3500,tailMs:4000,   // locked intro, time per clue, extra time after the last clue
  answerMs:7000,stealMs:5000,resultMs:3500,
  wrongPen:500,stealFrac:.5,stealPen:250
};
function tmBzLib(tm){return(tm&&tm.bzlib)||(typeof TM_BZ_DE!=='undefined'?TM_BZ_DE:[]);}
// money for one player: the family handicap scales every amount (Schwer pays 75 %), rounded to 50
function tmBzAmt(tm,seat,base){return Math.round(base*(TM_CFG.hcapMult[String(tm.hcap[seat-1])]||1)/50)*50;}
function tmBzQ(tm,q){
  const e=tmBzLib(tm)[q.i];if(!e)return null;
  const all=[e[7],e[8],e[9],e[10]];
  return{c:e[0],d:e[1],clues:[e[3],e[4],e[5],e[6]],ans:q.ord.map(k=>all[k]),cor:q.cor,expl:e[11]};
}
function tmBzStanding(tm,s){return tm.bank[s-1]+tmSealCount(tm,s)*TM_CFG.sealValue;}
function tmBzStage(q,now){return Math.max(0,Math.min(3,Math.floor((now-q.t0)/TM_BZ_CFG.stageMs)));}
function tmBzClueEnd(q){return q.t0+4*TM_BZ_CFG.stageMs+TM_BZ_CFG.tailMs;}
function tmBzEligible(tm,q,s){return s>=1&&s<=tm.P&&q.locked.indexOf(s)<0&&!(typeof tmAway==='function'&&tmAway(tm,s));}
function tmBzStealers(tm,q){const r=[];for(let s=1;s<=tm.P;s++)if(tmBzEligible(tm,q,s)&&(!q.buzz||q.buzz.seat!==s))r.push(s);return r;}
// two buzzes in the very same moment on one device: the player who is further behind wins, then the lower seat
function tmBzTieWinner(tm,seats){
  return seats.slice().sort((a,b)=>tmBzStanding(tm,a)-tmBzStanding(tm,b)||a-b)[0];
}
// which question next: levels 2,3,3,3,4 over the act, the category used least so far; never one this device has shown before
function tmBzPick(tm){
  const lib=tmBzLib(tm),B=tm.blitz,plan=[2,3,3,3,4],d=plan[B.n%plan.length];
  const here=B.qs.map(q=>q.i),catN=[0,0,0,0,0,0];B.qs.forEach(q=>{catN[lib[q.i][0]]++;});
  const pool=(cc,dd)=>{const r=[];lib.forEach((e,i)=>{if((cc<0||e[0]===cc)&&(dd<0||e[1]===dd)&&tm.usedB.indexOf(i)<0&&here.indexOf(i)<0)r.push(i);});return r;};
  let c=[];
  for(let k=0;k<=3&&!c.length;k++){
    [d-k,d+k].forEach(dd=>{if(c.length||dd<1||dd>5)return;
      const cats=[0,1,2,3,4,5].filter(x=>pool(x,dd).length);if(!cats.length)return;
      const mn=Math.min.apply(null,cats.map(x=>catN[x])),best=cats.filter(x=>catN[x]===mn),cat=best[Math.floor(tmRand(tm)*best.length)];
      c=pool(cat,dd);});
  }
  if(!c.length){tm.usedB=[];c=pool(-1,-1);}
  if(!c.length)return -1;
  return c[Math.floor(tmRand(tm)*c.length)];
}
function tmBzNew(tm,now){
  const B=tm.blitz;
  if(B.n>=B.nq)return tmBlitzEnd(tm,now);
  const i=tmBzPick(tm);if(i<0)return tmBlitzEnd(tm,now);
  const ord=tmShuffled(tm,4);
  const q={i,ord,cor:ord.indexOf(0),ph:'intro',t0:now+TM_BZ_CFG.introMs,dl:now+TM_BZ_CFG.introMs,locked:[],fs:[],buzz:null,steal:null,res:null,elim:null,elimSeat:0};
  tm.usedB.push(i);B.qs.push(q);B.cur=q;B.n++;tm.moves++;
  return true;
}
// Opens the act (returns false when there are too few questions: the game then goes straight on to the hunt)
function tmBlitzOpen(tm,now){
  if(tmBzLib(tm).length<TM_BZ_CFG.nq*2)return false;
  tm.usedB=tm.usedB||[];
  tm.phase='blitz';tm.dl=0;
  tm.blitz={n:0,nq:TM_BZ_CFG.nq,qs:[],cur:null,done:false,earn:new Array(tm.P).fill(0),openedAt:now};
  tmBzNew(tm,now);
  return true;
}
function tmBlitzEnd(tm,now){
  tm.blitz.done=true;tm.blitz.cur=null;
  tmOpenOffer(tm,now);   // on to the hunt
  return true;
}
function tmBzEasy(tm,q,s){   // Leicht: two wrong answers disappear for the player who is answering
  if(tm.hcap[s-1]<0){const wrong=[0,1,2,3].filter(x=>x!==q.cor),keep=wrong[Math.floor(tmRand2(tm)*3)];q.elim=wrong.filter(x=>x!==keep);q.elimSeat=s;}
  else{q.elim=null;q.elimSeat=0;}
}
function tmBzResult(tm,q,now){q.ph='result';q.dl=now+TM_BZ_CFG.resultMs;tm.moves++;}
function tmBzSettle(tm,s,ok,now,late){
  const B=tm.blitz,q=B.cur,i=s-1;
  if(q.ph==='answer'){
    if(ok){
      const g=tmBzAmt(tm,s,q.buzz.pz);tm.bank[i]+=g;B.earn[i]+=g;
      q.res={kind:'right',seat:s,stage:q.buzz.stage,gain:g};tmBzResult(tm,q,now);
    }else{
      const lost=Math.min(tm.bank[i],tmBzAmt(tm,s,TM_BZ_CFG.wrongPen));tm.bank[i]-=lost;B.earn[i]-=lost;q.locked.push(s);
      q.res={kind:'wrong',seat:s,stage:q.buzz.stage,pen:lost,late:!!late};
      if(tmBzStealers(tm,q).length){q.ph='steal';q.dl=now+TM_BZ_CFG.stealMs;tm.moves++;}else tmBzResult(tm,q,now);
    }
  }else{   // a steal attempt
    const st=q.steal;
    if(ok){
      const g=tmBzAmt(tm,s,Math.round(st.pz*TM_BZ_CFG.stealFrac/50)*50);tm.bank[i]+=g;B.earn[i]+=g;
      q.res.steal={seat:s,ok:true,gain:g};
    }else{
      const lost=Math.min(tm.bank[i],tmBzAmt(tm,s,TM_BZ_CFG.stealPen));tm.bank[i]-=lost;B.earn[i]-=lost;
      q.res.steal={seat:s,ok:false,pen:lost,late:!!late};
    }
    q.locked.push(s);tmBzResult(tm,q,now);
  }
  return true;
}
// A buzz. Before the buzzers are armed it is a false start (that player is locked out of this question, no money lost).
function tmBzBuzz(tm,s,now){
  const B=tm.blitz;if(tm.phase!=='blitz'||!B||B.done||!B.cur)return false;
  const q=B.cur;if(s<1||s>tm.P||q.locked.indexOf(s)>=0)return false;
  if(q.ph==='intro'){
    if(now<q.t0){q.locked.push(s);q.fs.push(s);tm.moves++;if(q.locked.length>=tm.P){q.res={kind:'none'};tmBzResult(tm,q,now);}return true;}
    q.ph='clue';
  }
  if(q.ph==='clue'){
    if(now>=tmBzClueEnd(q))return false;
    const st=tmBzStage(q,now);
    q.buzz={seat:s,stage:st,pz:TM_BZ_CFG.prizes[st],at:now};
    q.ph='answer';q.dl=now+TM_BZ_CFG.answerMs;tmBzEasy(tm,q,s);tm.moves++;return true;
  }
  if(q.ph==='steal'){
    if(!q.buzz||s===q.buzz.seat)return false;
    q.steal={seat:s,pz:q.buzz.pz,at:now};
    q.ph='stealans';q.dl=now+TM_BZ_CFG.answerMs;tmBzEasy(tm,q,s);tm.moves++;return true;
  }
  return false;
}
function tmBzAnswer(tm,s,k,now){
  const B=tm.blitz;if(tm.phase!=='blitz'||!B||B.done||!B.cur)return false;
  const q=B.cur,who=q.ph==='answer'?q.buzz.seat:q.ph==='stealans'?q.steal.seat:0;
  if(!who||who!==s||!Number.isInteger(k)||k<0||k>3)return false;
  if(q.elim&&q.elimSeat===s&&q.elim.indexOf(k)>=0)return false;
  return tmBzSettle(tm,s,k===q.cor,now,false);
}
function tmBlitzTick(tm,now){
  const B=tm.blitz;if(!B||B.done||!B.cur)return false;
  const q=B.cur;
  let moved=false;
  if(q.ph==='intro'&&now>=q.t0){q.ph='clue';moved=true;}   // the buzzers arm; a late tick may go on to the next rule
  if(q.ph==='clue'&&now>=tmBzClueEnd(q)){q.res={kind:'none'};tmBzResult(tm,q,now);return true;}
  if(q.ph==='answer'&&now>=q.dl){return tmBzSettle(tm,q.buzz.seat,false,now,true);}
  if(q.ph==='steal'&&now>=q.dl){q.res.nosteal=1;tmBzResult(tm,q,now);return true;}
  if(q.ph==='stealans'&&now>=q.dl){return tmBzSettle(tm,q.steal.seat,false,now,true);}
  if(q.ph==='result'&&now>=q.dl){return tmBzNew(tm,now);}
  return moved;
}
