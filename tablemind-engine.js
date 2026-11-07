/* TABLE MIND -- the rules engine. PURE: no screen code, no timers, no DOM. Runs in the browser and in node (tests / balance simulation).
   One plain state object `tm`; tmApply(tm, seat, act, now) changes it by ONE action and returns true / false (false = illegal, nothing changed).
   Seats are 1..P. Every random choice comes from the game's own seeded streams (tm.rng for questions + the Chaser, tm.rng2 for lifeline effects),
   so a match is reproducible from its seed and the order of its actions, and the Chaser's rolls never depend on what a player answers.
   The questions live in tablemind-questions-de.js (data only). Time is passed in as `now` (ms) and compared with the deadlines stored in the state.

   Acts:  1 = DER AUFSTIEG (money ladder, bank or risk)  2 = DIE SECHS WELTEN (collect seals)  3 = DIE JAGD (race the Chaser).
   Phases: 'ask'     everybody answers their own question at once (act 1: one each at their own level, act 2: one each from the chosen realm,
                     act 3: ONE question for all lanes)
           'reveal'  the answers are shown; the table plays its animations; 'tick' after tm.dl moves on
           'decide'  act 1 only: BANKEN or WEITER for every player who just answered right
           'pick'    act 2: everybody privately chooses a realm
           'offer'   act 3: everybody privately chooses SICHER / STANDARD / RISIKO
           'over'    final scores.
   Actions:  {t:'ans',i}  {t:'life',k:'cut'|'archive'|'freeze'|'council'}  {t:'vote',i}  {t:'bank'} {t:'go'}  {t:'cat',c}  {t:'offer',k}  {t:'tick'}   */
const TM_CATS=[
  {k:'geo',de:'Geographie & Länder',short:'Geografie',ic:'🧭',col:'#3da5ff'},
  {k:'his',de:'Geschichte & Politik',short:'Geschichte',ic:'🏛️',col:'#e9c46a'},
  {k:'kul',de:'Kultur & Kunst',short:'Kultur',ic:'🎭',col:'#d946a8'},
  {k:'spo',de:'Sport & Freizeit',short:'Sport',ic:'🏅',col:'#4ade80'},
  {k:'ess',de:'Essen & Lebensart',short:'Lebensart',ic:'🍷',col:'#f97362'},
  {k:'wis',de:'Wissenschaft & Technik',short:'Wissen',ic:'🔬',col:'#8b5cf6'}
];
/* Every balancing number is here, nowhere else. */
const TM_CFG={
  ladder:[1000,2500,5000,10000,25000],topBonus:5000,
  cycles1:6,                        // questions per player in act 1 (a "climb" may be restarted after banking)
  sealRounds:3,                     // realm challenges per player in act 2
  sealValue:2500,
  duelPrize:5000,                   // the head-to-head after act 1: the two richest players, one hard question
  track:7,
  offers:{safe:{adv:3,mult:1},std:{adv:2,mult:2},risk:{adv:1,mult:3}},
  escapeBase:10000,
  maxAdv:4,                         // a head start can never be bigger than this
  maxHunt:16,                       // after this many hunt questions everybody still running is caught
  huntDiff:[2,2,3,3,3,4,3,4,4,3,4,4,5,4,5,5],
  lives:{cut:1,archive:1,freeze:1,council:1},
  grace:1500,
  ms:{ask1:30000,ask2:25000,ask3:22000,decide:12000,pick:15000,offer:15000,reveal:5200,freeze:10000,council:15000},
  chasers:{
    professor:{name:'Der Professor',ic:'🎓',p:.70,dbl:.03,cat:{his:.07,wis:.07,spo:-.09,ess:-.03}},
    jaeger:{name:'Der Jäger',ic:'🐺',p:.67,dbl:.10,cat:{geo:.05,spo:.08,kul:-.08,wis:-.04}},
    strategin:{name:'Die Strategin',ic:'🦊',p:.685,dbl:.06,cat:{},hard:-.10}
  },
  diffAdj:.07                       // the Chaser's chance changes by this much per difficulty step away from 3
};
const TM_CH_KEYS=['professor','jaeger','strategin'];
const TM_BOT_SKILL={gentle:.52,sharp:.76};

function tmRand(tm){tm.rng=(tm.rng*48271)%2147483647;return tm.rng/2147483647;}
function tmRand2(tm){tm.rng2=(tm.rng2*48271)%2147483647;return tm.rng2/2147483647;}
function tmShuffled(tm,n,use2){const a=[];for(let i=0;i<n;i++)a.push(i);for(let i=n-1;i>0;i--){const j=Math.floor((use2?tmRand2(tm):tmRand(tm))*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}return a;}
function tmLib(tm){return(tm&&tm.lib)||(typeof TM_Q_DE!=='undefined'?TM_Q_DE:[]);}
// Library entry: [cat 0-5, difficulty 1-5, scope 'E'|'I', question, right, wrong1, wrong2, wrong3, explanation, clue]
function tmQ(tm,q){const e=tmLib(tm)[q.i];return e?{c:e[0],d:e[1],scope:e[2],text:e[3],ans:q.ord.map(k=>e[4+k]),cor:q.cor,expl:e[8],clue:e[9]}:null;}

function tmNew(P,opts){
  opts=opts||{};
  const n=Math.max(2,Math.min(4,(P|0)||2)),seed=((opts.seed||Date.now())%2147483646)+1;
  const z=()=>new Array(n).fill(0),nl=()=>new Array(n).fill(null);
  const tm={v:1,P:n,seed,rng:seed,rng2:(seed*7+13)%2147483646+1,lang:'de',act:1,phase:'ask',cycle:0,round2:0,used:[],catN:[0,0,0,0,0,0],
    lib:opts.lib||null,relaxed:!!opts.relaxed,
    lvl:z(),unb:z(),bank:z(),q:nl(),ans:nl(),ansAt:z(),res:nl(),pick:nl(),ext:z(),elim:nl(),clue:z(),gain:z(),
    life:[],council:null,duel:null,duelDone:false,pendingDecide:new Array(n).fill(false),seals:[],sealNew:z(),
    chaser:opts.chaser&&TM_CFG.chasers[opts.chaser]?opts.chaser:null,ch:null,lane:[],offer:nl(),
    dl:0,moves:0,fx:null,over:false,win:0,
    stats:{right:z(),wrong:z(),late:z(),lifes:z(),best:z(),topHits:z(),duels:z(),banks:z(),councilFor:z(),hardRight:z(),mislead:z()}};
  for(let i=0;i<n;i++){tm.life.push(Object.assign({},TM_CFG.lives));tm.seals.push([]);}
  for(let i=0;i<7;i++){tmRand(tm);tmRand2(tm);}
  if(!tm.chaser)tm.chaser=TM_CH_KEYS[Math.floor(tmRand(tm)*TM_CH_KEYS.length)];
  return tm;
}
// Start (or restart) the game: opens the first act 1 question for everybody.
function tmStart(tm,now){tm.act=1;tm.cycle=0;tmOpenCycle1(tm,now||0);return tm;}

/* ───── choosing a question ───── */
// cat: wanted category or -1 (= the least used one); d: difficulty. Never repeats inside a match; relaxes difficulty only when a pool is empty.
function tmPickQ(tm,cat,d){
  const lib=tmLib(tm);
  const pool=(cc,dd)=>{const r=[];lib.forEach((e,i)=>{if((cc<0||e[0]===cc)&&e[1]===dd&&tm.used.indexOf(i)<0)r.push(i);});return r;};
  if(cat<0){const mn=Math.min.apply(null,tm.catN);const cs=[];tm.catN.forEach((v,c)=>{if(v===mn&&pool(c,d).length)cs.push(c);});
    if(cs.length)cat=cs[Math.floor(tmRand(tm)*cs.length)];
    else{const any=[0,1,2,3,4,5].filter(c=>pool(c,d).length);cat=any.length?any[Math.floor(tmRand(tm)*any.length)]:-1;}}
  let c=cat>=0?pool(cat,d):[];
  for(let k=1;!c.length&&k<=4;k++){[d-k,d+k].forEach(dd=>{if(!c.length&&dd>=1&&dd<=5)c=cat>=0?pool(cat,dd):pool(-1,dd);});}
  if(!c.length&&cat>=0){c=pool(-1,d);for(let k=1;!c.length&&k<=4;k++)[d-k,d+k].forEach(dd=>{if(!c.length&&dd>=1&&dd<=5)c=pool(-1,dd);});}
  if(!c.length){tm.used=[];c=lib.map((e,i)=>i).filter(i=>(cat<0||lib[i][0]===cat));if(!c.length)c=lib.map((e,i)=>i);}
  if(!c.length)return null;
  const i=c[Math.floor(tmRand(tm)*c.length)];tm.used.push(i);tm.catN[lib[i][0]]++;
  const ord=tmShuffled(tm,4);
  return{i,ord,cor:ord.indexOf(0)};
}

/* ───── opening a question round ───── */
function tmMs(tm,key){return Math.round(TM_CFG.ms[key]*(tm.relaxed&&/^ask/.test(key)?1.6:1));}
function tmResetAsk(tm){tm.ans=tm.ans.map(()=>null);tm.ansAt=tm.ansAt.map(()=>0);tm.res=tm.res.map(()=>null);tm.ext=tm.ext.map(()=>0);tm.elim=tm.elim.map(()=>null);tm.clue=tm.clue.map(()=>0);tm.gain=tm.gain.map(()=>0);tm.council=null;tm.fx=null;}
function tmOpenCycle1(tm,now){
  tm.cycle++;tm.act=1;tm.phase='ask';tmResetAsk(tm);
  // players on the same level get the very same question (they play at the same time); different levels, different questions
  const byLvl={};
  for(let s=0;s<tm.P;s++){const k=tm.lvl[s];if(!byLvl[k])byLvl[k]=tmPickQ(tm,-1,k+1);tm.q[s]=byLvl[k];}
  tm.dl=now+tmMs(tm,'ask1');
}
function tmOpenDuel(tm,now){
  const order=[];for(let s=1;s<=tm.P;s++)order.push(s);
  order.sort((a,b)=>tm.bank[b-1]-tm.bank[a-1]||a-b);
  tm.duel=order.slice(0,2).sort((a,b)=>a-b);tm.act=1;tm.phase='ask';tmResetAsk(tm);
  const q=tmPickQ(tm,-1,4);
  for(let s=0;s<tm.P;s++)tm.q[s]=tm.duel.indexOf(s+1)>=0?q:null;
  tm.dl=now+tmMs(tm,'ask1');
}
function tmOpenPick(tm,now){tm.act=2;tm.phase='pick';tm.round2++;tmResetAsk(tm);tm.pick=tm.pick.map(()=>null);tm.q=tm.q.map(()=>null);tm.dl=now+tmMs(tm,'pick');
  if(tm.round2===1)tm.life.forEach(l=>{l.cut=TM_CFG.lives.cut;l.archive=TM_CFG.lives.archive;l.freeze=TM_CFG.lives.freeze;});}
function tmOpenAsk2(tm,now){
  tm.phase='ask';tmResetAsk(tm);
  // players who chose the same realm get the very same question
  const byCat={};
  for(let s=0;s<tm.P;s++){const k=tm.pick[s];if(!byCat[k])byCat[k]=tmPickQ(tm,k,3);tm.q[s]=byCat[k];}
  tm.dl=now+tmMs(tm,'ask2');
}
function tmOpenOffer(tm,now){tm.act=3;tm.phase='offer';tmResetAsk(tm);tm.q=tm.q.map(()=>null);tm.offer=tm.offer.map(()=>null);tm.dl=now+tmMs(tm,'offer');
  tm.life.forEach(l=>{l.cut=TM_CFG.lives.cut;l.archive=TM_CFG.lives.archive;l.freeze=TM_CFG.lives.freeze;});}
function tmSealCount(tm,s){return new Set(tm.seals[s-1]).size;}
function tmStartHunt(tm,now){
  tm.hunt={n:0};tm.lane=[];
  for(let s=1;s<=tm.P;s++){
    const o=TM_CFG.offers[tm.offer[s-1]||'std'],n=tmSealCount(tm,s);
    let adv=o.adv;if(n>=2)adv=Math.min(TM_CFG.maxAdv,adv+1);
    tm.lane.push({pl:adv,chp:0,st:'run',mult:o.mult,shield:n>=3?1:0,start:adv,steps:0});
    if(n>=1)tm.life[s-1].archive+=1;
  }
  tmOpenHunt(tm,now);
}
function tmOpenHunt(tm,now){
  tm.phase='ask';tm.act=3;tmResetAsk(tm);
  const d=TM_CFG.huntDiff[Math.min(tm.hunt.n,TM_CFG.huntDiff.length-1)];
  const q=tmPickQ(tm,-1,d);
  for(let s=0;s<tm.P;s++)tm.q[s]=q;
  // The Chaser's result is rolled NOW from the game's own stream: it cannot depend on any player's answer, and animation timing never decides it.
  const cat=tmLib(tm)[q.i][0],dd=tmLib(tm)[q.i][1],p=tmChaserP(tm.chaser,cat,dd);
  const roll=tmRand(tm),rd=tmRand(tm),ok=roll<p;
  tm.ch={ok,mv:ok?(rd<TM_CFG.chasers[tm.chaser].dbl?2:1):0,p:Math.round(p*100)};
  // an extra clue for the player on a hard question (Extra Hinweis ability is the archive life, so nothing automatic here)
  tm.dl=now+tmMs(tm,'ask3');
}
function tmChaserP(key,cat,d){
  const c=TM_CFG.chasers[key];let p=c.p+(c.cat[TM_CATS[cat].k]||0)-(d-3)*TM_CFG.diffAdj;
  if(c.hard&&d>=5)p+=c.hard;
  return Math.max(.12,Math.min(.95,p));
}

/* ───── queries ───── */
function tmActive(tm,s){if(tm.duel&&tm.duel.indexOf(s)<0)return false;return tm.act!==3||tm.lane[s-1].st==='run';}
function tmSeatDl(tm,s){return tm.dl+tm.ext[s-1];}
function tmAskDone(tm,now){
  for(let s=1;s<=tm.P;s++){if(!tmActive(tm,s))continue;if(tm.ans[s-1]==null&&now<tmSeatDl(tm,s))return false;}
  return true;
}
function tmUnbanked(tm,s){return tm.unb[s-1];}
function tmTotal(tm,s){
  let t=tm.bank[s-1]+tmSealCount(tm,s)*TM_CFG.sealValue;
  const L=tm.lane[s-1];if(L&&L.st==='escaped')t+=TM_CFG.escapeBase*L.mult;
  return t;
}
function tmWho(tm,s){return tm.ans[s-1];}

/* ───── the single entry point ───── */
function tmApply(tm,seat,act,now){
  if(!tm||tm.over||!act)return false;
  now=now||0;
  const s=seat,i=s-1,ph=tm.phase;
  switch(act.t){
    case'ans':{
      if(ph!=='ask'||s<1||s>tm.P||!tmActive(tm,s)||tm.ans[i]!=null)return false;
      if(act.to){tm.ans[i]=-1;tm.ansAt[i]=now;tm.moves++;if(tmAskDone(tm,now))tmResolveAsk(tm,now);return true;}   // hot-seat: this player's own clock ran out
      const k=act.i|0;if(k<0||k>3||(tm.elim[i]&&tm.elim[i].indexOf(k)>=0))return false;
      if(now>tmSeatDl(tm,s)+TM_CFG.grace)return false;       // too late: the question already closed for this player (a little grace for clocks that differ between devices)
      tm.ans[i]=k;tm.ansAt[i]=now;tm.moves++;
      if(tmAskDone(tm,now))tmResolveAsk(tm,now);
      return true;}
    case'life':{
      if(ph!=='ask'||s<1||s>tm.P||!tmActive(tm,s)||tm.ans[i]!=null||now>tmSeatDl(tm,s))return false;
      const k=act.k;if(!(k in TM_CFG.lives)||tm.life[i][k]<1)return false;
      if(k==='council'&&(tm.act!==1||tm.council||tm.P<2))return false;
      if(k==='cut'&&tm.elim[i])return false;
      if(k==='archive'&&tm.clue[i])return false;
      tm.life[i][k]--;tm.stats.lifes[i]++;tm.moves++;
      if(k==='cut'){const q=tm.q[i],wrong=[0,1,2,3].filter(x=>x!==q.cor);const keep=wrong[Math.floor(tmRand2(tm)*3)];tm.elim[i]=wrong.filter(x=>x!==keep);}
      else if(k==='archive')tm.clue[i]=1;
      else if(k==='freeze')tm.ext[i]+=tmMs(tm,'freeze');
      else{tm.council={for:s,votes:{},until:now+tmMs(tm,'council'),done:false,res:[0,0,0,0]};tm.ext[i]+=tmMs(tm,'council');tm.stats.councilFor[i]++;}
      return true;}
    case'vote':{
      const c=tm.council;
      if(ph!=='ask'||!c||c.done||s===c.for||s<1||s>tm.P||c.votes[s]!=null||now>c.until)return false;
      const k=act.i|0;if(k<0||k>3)return false;
      c.votes[s]=k;tm.moves++;tmCouncilCheck(tm,now);return true;}
    case'bank':case'go':{
      if(ph!=='decide'||s<1||s>tm.P||tm.res[i]!=='ok'||tm.pendingDecide[i]!==true)return false;
      tmDecide(tm,s,act.t==='bank');tm.moves++;
      if(tm.pendingDecide.every(v=>v!==true))tmAfterDecide(tm,now);
      return true;}
    case'cat':{
      if(ph!=='pick'||s<1||s>tm.P||tm.pick[i]!=null)return false;
      const c=act.c|0;if(c<0||c>5)return false;
      tm.pick[i]=c;tm.moves++;
      if(tm.pick.every(v=>v!=null))tmOpenAsk2(tm,now);
      return true;}
    case'offer':{
      if(ph!=='offer'||s<1||s>tm.P||tm.offer[i]!=null||!TM_CFG.offers[act.k])return false;
      tm.offer[i]=act.k;tm.moves++;
      if(tm.offer.every(v=>v!=null))tmStartHunt(tm,now);
      return true;}
    case'tick':return tmTick(tm,now);
  }
  return false;
}

// Time moves the game on. Safe to call from any device any number of times: it only does something when a deadline has really passed.
function tmTick(tm,now){
  if(tm.over)return false;
  const ph=tm.phase;
  if(ph==='ask'){
    if(tm.council&&!tm.council.done&&now>=tm.council.until){tmCouncilCheck(tm,now);}
    if(tmAskDone(tm,now)){tmResolveAsk(tm,now);return true;}
    return false;
  }
  if(now<tm.dl)return false;
  if(ph==='reveal'){tmAfterReveal(tm,now);return true;}
  if(ph==='decide'){for(let s=1;s<=tm.P;s++)if(tm.pendingDecide[s-1]===true)tmDecide(tm,s,true);tmAfterDecide(tm,now);return true;}
  if(ph==='pick'){tm.pick=tm.pick.map((v,k)=>v!=null?v:tmLeastSeal(tm,k+1));tmOpenAsk2(tm,now);return true;}
  if(ph==='offer'){tm.offer=tm.offer.map(v=>v||'std');tmStartHunt(tm,now);return true;}
  return false;
}
function tmLeastSeal(tm,s){const have=new Set(tm.seals[s-1]);for(let c=0;c<6;c++)if(!have.has(c))return c;return 0;}
function tmCouncilCheck(tm,now){
  const c=tm.council;if(!c||c.done)return;
  const need=tm.P-1;
  if(Object.keys(c.votes).length>=need||now>=c.until){
    c.done=true;c.res=[0,0,0,0];Object.keys(c.votes).forEach(k=>c.res[c.votes[k]]++);
    c.sources=Object.keys(c.votes).length;
  }
}

/* ───── resolving a question ───── */
function tmResolveAsk(tm,now){
  if(tm.council)tmCouncilCheck(tm,Infinity);
  const act=tm.act,fx={kind:'reveal',act,seats:[]};
  tm.pendingDecide=new Array(tm.P).fill(false);
  for(let s=1;s<=tm.P;s++){
    const i=s-1;
    if(!tmActive(tm,s)){tm.res[i]=null;fx.seats.push({s,skip:1});continue;}
    const q=tm.q[i],a=tm.ans[i],ok=a!=null&&a===q.cor;
    tm.res[i]=(a==null||a<0)?'late':ok?'ok':'bad';
    if(a==null||a<0)tm.stats.late[i]++;else if(ok)tm.stats.right[i]++;else tm.stats.wrong[i]++;
    const e=tmLib(tm)[q.i];if(ok&&e&&e[1]>=4)tm.stats.hardRight[i]++;
    const o={s,ok,a,cor:q.cor,money:0,seal:0,steps:0};
    if(act===1&&tm.duel){
      // the duel has its own prize, settled below
    }else if(act===1){
      if(ok){
        const top=tm.lvl[i]>=TM_CFG.ladder.length-1;
        tm.unb[i]=TM_CFG.ladder[tm.lvl[i]];tm.stats.best[i]=Math.max(tm.stats.best[i],tm.unb[i]);
        if(top){tm.unb[i]+=TM_CFG.topBonus;tm.bank[i]+=tm.unb[i];o.money=tm.unb[i];o.top=1;tm.stats.topHits[i]++;tm.unb[i]=0;tm.lvl[i]=0;}
        else{o.money=tm.unb[i];tm.lvl[i]++;tm.pendingDecide[i]=tm.cycle<TM_CFG.cycles1;if(!tm.pendingDecide[i]){tm.bank[i]+=tm.unb[i];tm.unb[i]=0;o.auto=1;}}
      }else{o.lost=tm.unb[i];tm.unb[i]=0;tm.lvl[i]=0;}
    }else if(act===2){
      if(ok){const have=tm.seals[i].indexOf(tm.pick[i])>=0;tm.seals[i].push(tm.pick[i]);o.seal=1;o.dup=have?1:0;}
    }
    fx.seats.push(o);
  }
  if(tm.duel){
    const oks=tm.duel.filter(s=>tm.res[s-1]==='ok');let w=0;
    if(oks.length===1)w=oks[0];
    else if(oks.length===2)w=tm.ansAt[oks[0]-1]<tm.ansAt[oks[1]-1]?oks[0]:tm.ansAt[oks[1]-1]<tm.ansAt[oks[0]-1]?oks[1]:0;
    const share=oks.length===2&&!w?oks:[];
    if(w){tm.bank[w-1]+=TM_CFG.duelPrize;tm.stats.duels[w-1]++;}
    share.forEach(s=>{tm.bank[s-1]+=TM_CFG.duelPrize/2;});
    fx.duel={w,seats:tm.duel.slice(),prize:TM_CFG.duelPrize,tie:share.length>0};
  }
  if(act===3)tmHuntMove(tm,fx);
  tm.fx=fx;tm.phase='reveal';tm.dl=now+tmMs(tm,'reveal')+(act===3?1800:0);
}
function tmHuntMove(tm,fx){
  fx.ch=tm.ch;
  for(let s=1;s<=tm.P;s++){
    const L=tm.lane[s-1],o=fx.seats[s-1];if(L.st!=='run')continue;
    if(tm.res[s-1]==='ok'){L.pl++;L.steps++;o.steps=1;}
    o.pl=L.pl;
    if(L.pl>=TM_CFG.track){L.st='escaped';o.escaped=1;o.chFrom=L.chp;o.chTo=L.chp;continue;}
    o.chFrom=L.chp;L.chp+=tm.ch.mv;
    if(L.chp>=L.pl){
      if(L.shield>0){L.shield--;L.chp=L.pl-1;o.shield=1;}
      else{L.st='caught';o.caught=1;}
    }
    o.chTo=L.chp;
  }
  tm.hunt.n++;
  if(tm.hunt.n>=TM_CFG.maxHunt)for(let s=1;s<=tm.P;s++){const L=tm.lane[s-1];if(L.st==='run'){L.st='caught';fx.seats[s-1].caught=1;fx.seats[s-1].timeout=1;}}
}
function tmDecide(tm,s,bank){
  const i=s-1;tm.pendingDecide[i]=false;
  if(bank){tm.bank[i]+=tm.unb[i];tm.stats.banks[i]++;tm.unb[i]=0;tm.lvl[i]=0;tm.gain[i]=1;}
  else tm.gain[i]=2;
}
function tmAfterDecide(tm,now){
  if(tm.cycle>=TM_CFG.cycles1){if(tm.P>=2&&!tm.duelDone){tmOpenDuel(tm,now);return;}tmOpenPick(tm,now);return;}
  tmOpenCycle1(tm,now);
}
function tmAfterReveal(tm,now){
  if(tm.duel){tm.duel=null;tm.duelDone=true;tmOpenPick(tm,now);return;}
  if(tm.act===1){
    if(tm.pendingDecide&&tm.pendingDecide.some(v=>v===true)){tm.phase='decide';tm.dl=now+tmMs(tm,'decide');return;}
    tmAfterDecide(tm,now);return;
  }
  if(tm.act===2){
    if(tm.round2>=TM_CFG.sealRounds)tmOpenOffer(tm,now);else tmOpenPick(tm,now);
    return;
  }
  // act 3
  if(tm.lane.every(L=>L.st!=='run'))tmFinish(tm);else tmOpenHunt(tm,now);
}
function tmFinish(tm){
  tm.over=true;tm.phase='over';tm.dl=0;
  let b=1,bt=-1;
  for(let s=1;s<=tm.P;s++){const t=tmTotal(tm,s);if(t>bt){bt=t;b=s;}}
  tm.win=b;
  tm.totals=[];for(let s=1;s<=tm.P;s++)tm.totals.push(tmTotal(tm,s));
}

/* ───── bots (answer from a skill number; the caller adds thinking time) ───── */
function tmBotAct(tm,seat,level,r){
  r=r||Math.random;
  const skill=TM_BOT_SKILL[level]||TM_BOT_SKILL.gentle,i=seat-1;
  if(tm.phase==='ask'){
    if(tm.council&&!tm.council.done&&tm.council.for!==seat&&tm.council.votes[seat]==null){
      const cq=tm.q[tm.council.for-1],good=r()<(.55+skill*.3);return{t:'vote',i:good?cq.cor:Math.floor(r()*4)};
    }
    if(tm.ans[i]!=null||!tmActive(tm,seat))return null;
    const q=tm.q[i],e=tmLib(tm)[q.i],d=e?e[1]:3;
    if(tm.act===1&&tm.life[i].council>0&&!tm.council&&d>=4&&r()<.3&&level==='sharp')return{t:'life',k:'council'};
    if(tm.act===1&&tm.council&&tm.council.for===seat&&!tm.council.done)return null;
    let p=Math.max(.2,Math.min(.97,skill+.12-(d-1)*.1));
    if(tm.elim[i])p=Math.max(p,.55+skill*.2);
    if(tm.clue[i])p=Math.min(.97,p+.1);
    if(!tm.elim[i]&&d>=4&&tm.life[i].cut>0&&r()<.5)return{t:'life',k:'cut'};
    if(tm.council&&tm.council.for===seat&&tm.council.done){let m=0;tm.council.res.forEach((v,k)=>{if(v>tm.council.res[m])m=k;});if(r()<.6)return{t:'ans',i:m};}
    if(r()<p)return{t:'ans',i:q.cor};
    let w=Math.floor(r()*4);if(w===q.cor)w=(w+1)%4;if(tm.elim[i]&&tm.elim[i].indexOf(w)>=0){w=[0,1,2,3].find(x=>x!==q.cor&&tm.elim[i].indexOf(x)<0);}
    return{t:'ans',i:w};
  }
  if(tm.phase==='decide'){
    if(tm.pendingDecide&&tm.pendingDecide[i]!==true)return null;
    const lv=tm.lvl[i];   // levels already climbed
    const want=level==='sharp'?(lv>=3?'bank':r()<.45?'bank':'go'):(lv>=2?'bank':r()<.35?'bank':'go');
    return{t:want};
  }
  if(tm.phase==='pick'){
    if(tm.pick[i]!=null)return null;
    const have=new Set(tm.seals[i]),opts=[0,1,2,3,4,5].filter(c=>!have.has(c));
    return{t:'cat',c:opts[Math.floor(r()*opts.length)]};
  }
  if(tm.phase==='offer'){
    if(tm.offer[i]!=null)return null;
    const n=tmSealCount(tm,seat),x=r();
    const risk=level==='sharp'?.35+n*.1:.15;
    return{t:'offer',k:x<risk?'risk':x<risk+.4?'std':'safe'};
  }
  return null;
}

/* ───── summaries ───── */
function tmStandings(tm){
  const a=[];for(let s=1;s<=tm.P;s++)a.push({s,total:tmTotal(tm,s),bank:tm.bank[s-1],seals:tmSealCount(tm,s),escaped:tm.lane[s-1]&&tm.lane[s-1].st==='escaped'});
  return a.sort((x,y)=>y.total-x.total||(+y.escaped)-(+x.escaped)||x.s-y.s);
}

/* ───── balance simulation: how often does a player of a given skill escape? ─────
   Runs the real hunt rules (not a copy): one lane, one chaser, a player who answers right with probability `skill`. */
function tmSimHunt(chaser,offer,skill,n,seed,extra){
  extra=extra||{};
  let esc=0,len=0,seeds=seed||1,rs=(seeds*31+17)%2147483646+1;
  for(let k=0;k<n;k++){
    const tm=tmNew(2,{seed:seeds+k*7919,chaser,lib:extra.lib||null});
    tm.offer=[offer,offer];tm.seals=[[],[]];
    if(extra.seals){tm.seals[0]=extra.seals.slice();}
    tmStartHunt(tm,0);
    let guard=0;
    while(tm.lane[0].st==='run'&&guard++<40){
      const q=tm.q[0],e=tmLib(tm)[q.i],d=e?e[1]:3;
      // the player: skill drops with difficulty the same way a typical player does
      const p=Math.max(.1,Math.min(.97,skill-(d-3)*.09));
      rs=(rs*48271)%2147483647;const r=rs/2147483647;
      tm.ans[0]=r<p?q.cor:(q.cor+1)%4;tm.ans[1]=q.cor;
      tmResolveAsk(tm,1);
      if(tm.lane[0].st==='run')tm.phase='ask',tmOpenHunt(tm,1);
    }
    if(tm.lane[0].st==='escaped')esc++;
    len+=tm.hunt.n;
  }
  return{escape:esc/n,avgLen:len/n};
}
if(typeof module!=='undefined')module.exports={TM_CATS,TM_CFG,tmNew,tmStart,tmApply,tmTick,tmBotAct,tmPickQ,tmQ,tmTotal,tmSealCount,tmStandings,tmSimHunt,tmChaserP,tmStartHunt,tmOpenHunt,tmResolveAsk};
