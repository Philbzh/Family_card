/* TABLE MIND — Act III "DER BLITZ": the screen for one shared device (hot-seat) and the computer players.
   The rules live in tablemind-blitz.js. This file only draws the state, turns touches into actions and plays sounds.
   The device lies flat in the middle of the table: every player has a large buzzer zone on their own edge. */
(function(){
const css=`
#s-table.game-tablemind.tm-bg-blitz.scr{background:linear-gradient(180deg,rgba(3,8,6,.55),rgba(3,8,6,.9) 60%,#030806),url(assets/games/tm_bg_act3.jpg) center top/cover no-repeat,#030806;}
.bz-wrap{position:relative;display:grid;gap:.55rem;padding:.5rem .6rem .7rem;height:calc(100svh - 3.6rem);min-height:30rem;max-width:64rem;margin:0 auto;box-sizing:border-box;}
.bz-wrap.p2{grid-template-columns:1fr;grid-template-rows:minmax(5.6rem,21%) minmax(0,1fr) minmax(5.6rem,21%);grid-template-areas:"t" "m" "b";}
.bz-wrap.p3{grid-template-columns:minmax(5.2rem,16%) minmax(0,1fr) minmax(5.2rem,16%);grid-template-rows:minmax(0,1fr) minmax(5.6rem,20%);grid-template-areas:"l m r" "b b b";}
.bz-wrap.p4{grid-template-columns:minmax(5.2rem,16%) minmax(0,1fr) minmax(5.2rem,16%);grid-template-rows:minmax(5.6rem,18%) minmax(0,1fr) minmax(5.6rem,18%);grid-template-areas:"t t t" "l m r" "b b b";}
.bz-wrap.online{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr) minmax(7rem,24%);}
.bz-wrap.online .bz-zone,.bz-wrap.online .bz-mid{grid-area:auto;}
.bz-actline{grid-column:auto;margin:0 0 .1rem;}
.bz-chips{display:flex;gap:.5rem;flex-wrap:wrap;justify-content:center;}
.bz-chip{position:relative;display:flex;align-items:center;gap:.5rem;padding:.35rem .7rem;border-radius:14px;border:1px solid rgba(201,164,92,.45);background:linear-gradient(180deg,rgba(24,70,48,.9),rgba(8,26,18,.95));color:#fbf7ed;}
.bz-chip .bz-av .av-img{width:2.2rem;height:2.2rem;}
.bz-cl{font:800 .85rem/1 var(--serif,Georgia,serif);letter-spacing:.12em;color:#ffe9a8;}
.bz-chip.st-turn{background:linear-gradient(180deg,#f3deaa,#c9a45c);color:#1a1300;}.bz-chip.st-turn .bz-nm,.bz-chip.st-turn .bz-money,.bz-chip.st-turn .bz-cl{color:#1a1300;}
.bz-chip.st-out,.bz-chip.st-locked{opacity:.45;}
.bz-zone.pressed{filter:brightness(1.5);transform:scale(.985);}
.bz-zone.pos-t{grid-area:t;}.bz-zone.pos-b{grid-area:b;}.bz-zone.pos-l{grid-area:l;}.bz-zone.pos-r{grid-area:r;}
.bz-mid{grid-area:m;display:flex;flex-direction:column;gap:.5rem;min-height:0;justify-content:center;}
.bz-zone{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;border-radius:18px;border:2px solid rgba(201,164,92,.5);background:linear-gradient(180deg,rgba(24,70,48,.92),rgba(8,26,18,.96));color:#fbf7ed;font:inherit;cursor:pointer;touch-action:manipulation;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;padding:.3rem;transition:filter .2s,opacity .2s,transform .08s;}
.bz-zone:disabled{cursor:default;}
.bz-zone:active:not(:disabled){transform:scale(.985);}
.bz-in{display:flex;align-items:center;gap:.8rem;white-space:nowrap;}
.pos-t .bz-in{transform:rotate(180deg);}
.pos-l .bz-in{transform:rotate(90deg);}
.pos-r .bz-in{transform:rotate(-90deg);}
.bz-av .av-img{width:3.2rem;height:3.2rem;display:block;}
.bz-who{display:flex;flex-direction:column;align-items:flex-start;gap:.05rem;min-width:0;}
.bz-nm{font:700 .95rem/1.1 var(--serif,Georgia,serif);color:#f3deaa;letter-spacing:.04em;}
.bz-money{font:700 1.1rem/1.1 var(--serif,Georgia,serif);color:var(--tg,#c9a45c);text-shadow:0 0 14px rgba(201,164,92,.45);font-variant-numeric:tabular-nums;}
.bz-lbl{font:800 1.35rem/1 var(--serif,Georgia,serif);letter-spacing:.18em;color:#fff1c2;text-shadow:0 2px 8px rgba(0,0,0,.6);min-width:7.5rem;text-align:center;}
.bz-zone.st-armed{border-color:#ffe08a;box-shadow:0 0 0 2px rgba(255,224,138,.45),0 0 30px rgba(255,224,138,.5);animation:bzPulse 1.1s ease-in-out infinite;}
.bz-zone.st-steal{border-color:#ff8e7d;box-shadow:0 0 0 2px rgba(255,142,125,.45),0 0 30px rgba(255,110,90,.55);animation:bzPulse .75s ease-in-out infinite;}
.bz-zone.st-turn{background:linear-gradient(180deg,#f3deaa,#c9a45c 70%,#8f6f2f);border-color:#fff1c2;color:#1a1300;box-shadow:0 0 40px rgba(255,224,138,.8);}
.bz-zone.st-turn .bz-nm,.bz-zone.st-turn .bz-money,.bz-zone.st-turn .bz-lbl{color:#1a1300;text-shadow:none;}
.bz-zone.st-out,.bz-zone.st-locked{opacity:.4;filter:saturate(.45);}
.bz-zone.st-wait{opacity:.8;}
.bz-zone.st-fs{border-color:#ff6b6b;animation:bzShake .45s ease-in-out 1;}
@keyframes bzPulse{0%,100%{filter:brightness(1);}50%{filter:brightness(1.35);}}
@keyframes bzShake{20%{transform:translateX(-7px);}40%{transform:translateX(7px);}60%{transform:translateX(-4px);}80%{transform:translateX(3px);}}
.bz-delta{position:absolute;top:.35rem;right:.7rem;font:800 1.15rem/1 var(--serif,Georgia,serif);padding:.15rem .5rem;border-radius:999px;animation:bzDelta 1.8s ease-out both;}
.bz-delta.pos{background:#1d6b43;color:#d7ffe8;}.bz-delta.neg{background:#7a2230;color:#ffd8de;}
.pos-t .bz-delta{top:auto;bottom:.35rem;right:auto;left:.7rem;}
@keyframes bzDelta{0%{transform:translateY(8px) scale(.7);opacity:0;}20%{transform:none;opacity:1;}80%{opacity:1;}100%{opacity:.0;}}
.bz-host{display:flex;align-items:center;gap:.7rem;min-height:4.6rem;}
.bz-wiz{width:4.4rem;height:4.4rem;border-radius:50%;object-fit:cover;border:2px solid #e9c46a;box-shadow:0 0 16px rgba(233,196,106,.45);flex:none;background:#0b1233;}
.bz-wiz.hop{animation:tmHop .5s ease-out 1;}
.bz-say{flex:1;padding:.5rem .8rem;border-radius:14px;background:linear-gradient(180deg,rgba(30,87,57,.92),rgba(11,32,21,.95));border:1px solid rgba(201,164,92,.55);font:600 1.25rem/1.3 var(--serif,Georgia,serif);color:#fbf7ed;min-height:2.4rem;display:flex;align-items:center;}
.bz-clues{display:flex;flex-direction:column;gap:.4rem;}
.bz-clue{display:grid;grid-template-columns:5.2rem 1fr;gap:.6rem;align-items:center;padding:.55rem .75rem;border-radius:12px;background:rgba(10,36,24,.72);border:1px solid rgba(201,164,92,.22);font:600 1.18rem/1.35 var(--serif,Georgia,serif);color:#fbf7ed;opacity:.5;transition:opacity .3s,border-color .3s;}
.bz-clue.show{opacity:.78;}
.bz-clue.on{opacity:1;border-color:#ffe08a;background:linear-gradient(90deg,rgba(201,164,92,.28),rgba(10,36,24,.82));animation:bzIn .45s ease-out 1;}
.bz-clue.hid .bz-tx{color:#6e6648;letter-spacing:.35em;}
.bz-pz{font:800 .98rem/1 var(--serif,Georgia,serif);color:#ead08a;font-variant-numeric:tabular-nums;}
.bz-clue.past .bz-pz{text-decoration:line-through;opacity:.5;}
@keyframes bzIn{0%{transform:translateX(-12px);opacity:0;}100%{transform:none;opacity:1;}}
.bz-ans{display:grid;grid-template-columns:1fr 1fr;gap:.5rem;}
.bz-ans.rot{transform:rotate(180deg);}
.bz-ans .tm-a{min-height:3rem;}
.bz-ans .tm-a.gone{visibility:hidden;}
.bz-bar{height:.42rem;border-radius:9px;background:rgba(255,255,255,.12);overflow:hidden;}
.bz-bar i{display:block;height:100%;width:100%;transform-origin:left;background:linear-gradient(90deg,#e9c46a,#ff8e7d);animation:bzBar linear forwards;}
@keyframes bzBar{from{transform:scaleX(1);}to{transform:scaleX(0);}}
@media(max-width:559px){.bz-clue{grid-template-columns:4.2rem 1fr;font-size:.95rem;padding:.45rem .55rem;}.bz-lbl{font-size:1.1rem;min-width:5.5rem;}.bz-av .av-img{width:2.6rem;height:2.6rem;}}
@media(prefers-reduced-motion:reduce){.bz-zone.st-armed,.bz-zone.st-steal,.bz-clue.on,.bz-zone.st-fs{animation:none!important;}}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

// sounds for the act, built from the app's own tone()
Object.assign(TMSFX,{
  arm(){tone(1250,.06,'square');setTimeout(()=>tone(1650,.08,'square'),60);haptic(8);},
  buzz(){tone(520,.14,'sawtooth');tone(790,.2,'square');haptic([30]);},
  clue(){tone(1900,.025,'square');},
  drop(){tone(660,.1,'triangle');setTimeout(()=>tone(494,.14,'triangle'),90);},
  steal(){[392,523,659].forEach((f,i)=>setTimeout(()=>tone(f,.12,'sawtooth'),i*70));haptic([12,20,12]);},
  nobody(){tone(300,.18,'sine');setTimeout(()=>tone(240,.25,'sine'),140);}
});

const Z={2:['b','t'],3:['b','l','r'],4:['b','l','t','r']};
function human(s){return G.isOnline?s===tmMySeat():!isBotPlayer(G.lp[s-1]);}
// the buzzers arm by the clock (nobody has to write that into the room): an 'intro' whose time has come is a 'clue' phase
function eph(q,now){return(q.ph==='intro'&&now>=q.t0)?'clue':q.ph;}
function nm(players,s){return esc((players[s-1]||{}).name||'');}

// what Wiz shows and says (only his existing pictures)
function wiz(tm,q,players){
  if(!q)return{pose:'bow',line:''};
  const r=q.res;
  switch(eph(q,Date.now())){
    case'intro':return{pose:'host',line:q.fs.length?'Hoppla! Zu früh!':(tm.blitz.n<=1?'Auf die Plätze …':'Weiter geht es …')};
    case'clue':return{pose:q.fs.length?'smug':'host',line:q.fs.length?'Hoppla! Zu früh!':''};
    case'answer':return{pose:'tense',line:nm(players,q.buzz.seat)+' antwortet'};
    case'steal':return{pose:'sad',line:'Oh nein! Wer klaut sie?'};
    case'stealans':return{pose:'tense',line:nm(players,q.steal.seat)+' versucht es'};
    case'result':
      if(!r||r.kind==='none')return{pose:'sleepy',line:q.locked.length>=tm.P?'Alle zu früh!':'Niemand? Wirklich?'};
      if(r.kind==='right')return r.stage===0?{pose:'smug',line:'Das ging schnell!'}:{pose:'applause',line:nm(players,r.seat)+' hat es!'};
      if(r.steal&&r.steal.ok)return{pose:'applause',line:'Was für ein Reflex!'};
      if(r.steal&&!r.steal.ok)return{pose:'dizzy',line:'Beide daneben!'};
      return{pose:'sad',line:'Oh nein! Zu früh gewagt!'};
  }
  return{pose:'hope',line:''};
}
function zoneState(tm,q,s){
  if(!q)return'wait';
  const locked=q.locked.indexOf(s)>=0;
  switch(eph(q,Date.now())){
    case'intro':return locked?'fs':'wait';
    case'clue':return locked?'locked':'armed';
    case'answer':return q.buzz.seat===s?'turn':'out';
    case'steal':return(!locked&&(!q.buzz||q.buzz.seat!==s))?'steal':'locked';
    case'stealans':return q.steal.seat===s?'turn':'out';
    default:return'out';
  }
}
const LBL={wait:'· · ·',armed:'BUZZER',steal:'KLAUEN!',turn:'DU BIST DRAN',fs:'ZU FRÜH!',locked:'gesperrt',out:''};
const LBL_OTHER={wait:'',armed:'',steal:'KLAUT?',turn:'ANTWORTET',fs:'ZU FRÜH',locked:'gesperrt',out:''};   // the small chips of the other players online
function deltaFor(q,s,players){
  if(!q||q.ph!=='result'||!q.res)return'';
  const r=q.res;let v=null;
  if(r.seat===s&&r.kind==='right')v=r.gain;
  else if(r.seat===s&&r.kind==='wrong')v=-r.pen;
  else if(r.steal&&r.steal.seat===s)v=r.steal.ok?r.steal.gain:-r.steal.pen;
  if(!v)return'';
  return`<b class="bz-delta ${v>0?'pos':'neg'}">${v>0?'+':'−'}${tmEur(Math.abs(v))}</b>`;
}
function zoneHTML(tm,q,s,pos,players){
  const state=zoneState(tm,q,s),p=players[s-1]||{name:'?',avatar:null};
  const live=human(s)&&(state==='armed'||state==='steal'||state==='wait');
  const label=LBL[state]||'';
  const inner=`<span class="bz-in"><span class="bz-av">${avHTML(p.avatar)}</span><span class="bz-who"><span class="bz-nm">${esc(p.name)}</span><span class="bz-money" data-s="${s}">${tmEur(tm.bank[s-1])}</span></span>${label?`<span class="bz-lbl">${label}</span>`:''}</span>${deltaFor(q,s,players)}`;
  return live?`<button class="bz-zone pos-${pos} st-${state}" data-bzs="${s}" aria-label="Buzzer ${esc(p.name)}">${inner}</button>`:`<div class="bz-zone pos-${pos} st-${state}">${inner}</div>`;
}
function cluesHTML(tm,q,view){
  const prizes=TM_BZ_CFG.prizes,now=Date.now();
  let upto=-1,cur=-1;
  if(eph(q,now)==='clue'){cur=tmBzStage(q,now);upto=cur;}
  else if(q.buzz&&q.ph!=='result'){upto=q.buzz.stage;cur=q.buzz.stage;}
  else if(q.ph==='result'){upto=3;cur=q.buzz?q.buzz.stage:-1;}
  return`<div class="bz-clues">${view.clues.map((c,k)=>{
    const shown=k<=upto,cls=['bz-clue',shown?'show':'hid',k===cur&&q.ph!=='result'?'on':'',(eph(q,now)==='clue'&&k<cur)?'past':''].join(' ');
    return`<div class="${cls}"><span class="bz-pz">${tmEur(prizes[k])}</span><span class="bz-tx">${shown?esc(c):'· · ·'}</span></div>`;}).join('')}</div>`;
}
function ansHTML(tm,q,view,players){
  const who=q.ph==='answer'?q.buzz.seat:q.ph==='stealans'?q.steal.seat:0;
  if(who){
    const mine=human(who),pos=G.isOnline?'b':Z[tm.P][who-1],rot=pos==='t'?' rot':'';
    const body=view.ans.map((a,i)=>{const gone=q.elim&&q.elimSeat===who&&q.elim.indexOf(i)>=0;
      return mine?`<button class="tm-a${gone?' gone':''}" data-a="tmbzans" data-i="${i}"${gone?' disabled':''}><span class="tm-l">${TM_LETTERS[i]}</span>${esc(a)}</button>`:`<div class="tm-a stat${gone?' gone':''}"><span class="tm-l">${TM_LETTERS[i]}</span>${esc(a)}</div>`;}).join('');
    const bar=`<div class="bz-bar"><i style="animation-duration:${Math.max(300,q.dl-Date.now())}ms"></i></div>`;
    return`<div class="bz-ans${rot}">${body}</div>${bar}`;
  }
  if(q.ph==='result'){
    const picks=[q.pick,q.pick2];
    return`<div class="bz-ans">${view.ans.map((a,i)=>{const c=i===q.cor?' cor':picks.indexOf(i)>=0?' wrg':' dim';return`<div class="tm-a stat${c}"><span class="tm-l">${TM_LETTERS[i]}</span>${esc(a)}</div>`;}).join('')}</div>`;
  }
  return'';
}
window.rTablemindBlitz=function(tm,players){
  const B=tm.blitz,q=B.cur||B.qs[B.qs.length-1],view=q?tmBzQ(tm,q):null,an=gtAnim();
  const w=wiz(tm,q,players),hop=G.bzPose!=null&&G.bzPose!==w.pose;G.bzPose=w.pose;
  const pos=Z[tm.P]||Z[2],me=G.isOnline?tmMySeat():0;
  const zones=[];
  if(G.isOnline){
    const chips=[];
    for(let s=1;s<=tm.P;s++){if(s===me)continue;const p=players[s-1]||{name:'?'},state=zoneState(tm,q,s);
      chips.push(`<div class="bz-chip st-${state}"><span class="bz-av">${avHTML(p.avatar)}</span><span class="bz-who"><span class="bz-nm">${esc(p.name)}</span><span class="bz-money" data-s="${s}">${tmEur(tm.bank[s-1])}</span></span>${LBL_OTHER[state]?`<span class="bz-cl">${LBL_OTHER[state]}</span>`:''}${deltaFor(q,s,players)}</div>`);}
    zones.push(`<div class="bz-chips">${chips.join('')}</div>`);
    if(me)zones.push(zoneHTML(tm,q,me,'b',players));
  }else for(let s=1;s<=tm.P;s++)zones.push(zoneHTML(tm,q,s,pos[s-1],players));
  const actTxt='Frage '+Math.min(B.n,B.nq)+' von '+B.nq;
  queueMicrotask(tmPostRender);
  return`<div id="s-table" class="scr on game-tablemind an-${an} tm-bg-blitz">
    <div class="game-bar"><div class="gb-game"><span class="tm-logo">TABLE MIND</span></div><div class="gb-turn tm-bartitle"><span><b>AKT III</b> · DER BLITZ</span><small>${esc(actTxt)}</small></div><div class="gb-right"><button class="ico-btn tm-animbtn tm-aa" data-a="tmmenu" aria-label="Menü" aria-expanded="${G.tmMenu?'true':'false'}" title="Menü">⋯</button>${quitBtn()}${sndBtn()}</div></div>${G.tmMenu?`<div class="tm-menu"><button data-a="tmanim">Animation · ${an==='full'?'voll':an==='light'?'leicht':'aus'}</button><span class="tm-mr">${rulesBtn()} Spielregeln</span></div>`:''}
    <div class="bz-wrap ${G.isOnline?'online':'p'+tm.P}">
      ${G.isOnline?zones[0]:''}
      <div class="bz-mid">
        <div class="tm-actline bz-actline"><b>AKT III</b> · DER BLITZ · ${esc(actTxt)}</div>
        <div class="bz-host"><img class="bz-wiz${hop?' hop':''}" src="${wizSrc(w.pose)}" alt="Wiz" width="64" height="64">${w.line?`<div class="bz-say">${w.line}</div>`:''}</div>
        ${view?cluesHTML(tm,q,view):''}
        ${view?ansHTML(tm,q,view,players):''}
      </div>
      ${G.isOnline?(zones[1]||''):zones.join('')}
    </div>
    <div class="tm-react-host"></div>
  </div>`;
};

// ── clock: deadlines, computer players, and a new picture only when something changed ──
function key(tm,now){
  const B=tm.blitz,q=B.cur;if(!q)return'end';
  return[B.n,eph(q,now),eph(q,now)==='clue'?tmBzStage(q,now):'',q.locked.join(','),q.buzz?q.buzz.seat:'',q.steal?q.steal.seat:'',q.res?1:0].join('|');
}
window.tmBlitzOnlineLoop=function(tm,now){
  const k=tm.phase==='blitz'&&tm.blitz?key(tm,now):'x';
  if(G.bzKey!==k){G.bzKey=k;render();}
};
window.tmBlitzLocalLoop=function(tm,now){
  let acted=tmBlitzTick(tm,now);
  acted=bots(tm,now)||acted;
  if(tm.phase!=='blitz')acted=true;
  const k=tm.phase==='blitz'?key(tm,now):'x';
  if(acted||G.bzKey!==k){G.bzKey=k;render();}
};
function botLevel(s){return G.lp[s-1].bot==='sharp'?'sharp':'gentle';}
function bots(tm,now){
  const B=tm.blitz,q=B&&B.cur;if(!q)return false;
  let acted=false;
  q.bz=q.bz||{};
  for(let s=1;s<=tm.P;s++){
    if(human(s))continue;
    const lvl=botLevel(s),skill=TM_BOT_SKILL[lvl],d=tmBzLib(tm)[q.i][1];
    let p=q.bz[s];
    if(!p){   // one plan per question and bot: does it know it, when does it buzz, how fast does it answer
      const knows=Math.random()<skill-.07*(d-3);
      const dist=lvl==='sharp'?[.30,.35,.25,.10]:[.10,.25,.35,.30];
      let r=Math.random(),st=3,a=0;for(let k=0;k<4;k++){a+=dist[k];if(r<a){st=k;break;}}
      const gamble=!knows&&Math.random()<(lvl==='sharp'?.08:.15);
      p={knows,buzz:(knows||gamble),t:q.t0+st*TM_BZ_CFG.stageMs+300+Math.random()*2400,thinkMs:1200+Math.random()*2600,stealP:knows?.6:.1};
      q.bz[s]=p;
    }
    const eligible=q.locked.indexOf(s)<0;
    if(q.ph==='clue'&&p.buzz&&eligible&&now>=p.t){if(tmApply(tm,s,{t:'buzz'},now)){acted=true;TMSFX.buzz();}}
    else if(q.ph==='answer'&&q.buzz.seat===s){
      if(!p.ansAt)p.ansAt=now+p.thinkMs;
      if(now>=p.ansAt){const ok=p.knows||Math.random()<.25;
        let k=q.cor;if(!ok){const wrong=[0,1,2,3].filter(x=>x!==q.cor);k=wrong[Math.floor(Math.random()*wrong.length)];}
        if(tmApply(tm,s,{t:'bans',i:k},now))acted=true;}
    }else if(q.ph==='steal'&&eligible&&(!q.buzz||q.buzz.seat!==s)){
      if(!p.stealAt)p.stealAt=now+700+Math.random()*2500;
      if(now>=p.stealAt&&Math.random()<p.stealP&&tmApply(tm,s,{t:'buzz'},now)){acted=true;TMSFX.buzz();}
      else if(now>=p.stealAt)p.stealAt=now+600;
    }else if(q.ph==='stealans'&&q.steal.seat===s){
      if(!p.ans2At)p.ans2At=now+p.thinkMs;
      if(now>=p.ans2At){const ok=p.knows||Math.random()<.25;
        let k=q.cor;if(!ok){const wrong=[0,1,2,3].filter(x=>x!==q.cor);k=wrong[Math.floor(Math.random()*wrong.length)];}
        if(tmApply(tm,s,{t:'bans',i:k},now))acted=true;}
    }
  }
  return acted;
}

// ── the player's touches ──
(function(){
  let pend=[],timer=null;
  document.addEventListener('pointerdown',e=>{
    const z=e.target&&e.target.closest?e.target.closest('.bz-zone[data-bzs]'):null;if(!z)return;
    const tm=tmObj();if(!tm||tm.phase!=='blitz')return;
    if(G.isOnline){   // one device, one zone: the claim is an atomic write into the room; the first one to land wins
      e.preventDefault();const s=+z.getAttribute('data-bzs');if(s!==tmMySeat())return;
      const q=tm.blitz.cur;if(!q)return;
      TMSFX.buzz();z.classList.add('pressed');setTimeout(()=>z.classList.remove('pressed'),500);
      tmSend({t:'buzz'});return;
    }
    e.preventDefault();
    pend.push({s:+z.getAttribute('data-bzs'),t:e.timeStamp});
    if(!timer)timer=setTimeout(()=>{const list=pend;pend=[];timer=null;settle(list);},12);
  },{passive:false});
  function settle(list){
    const tm=tmObj();if(!tm||tm.phase!=='blitz')return;
    list.sort((a,b)=>a.t-b.t);
    const first=list[0].t,tie=list.filter(x=>x.t-first<1.5).map(x=>x.s);
    const s=tie.length>1?tmBzTieWinner(tm,tie):list[0].s;
    const q=tm.blitz.cur,before=q?q.ph:'';
    const ok=tmApply(tm,s,{t:'buzz'},Date.now());
    if(ok){
      if(q&&q.fs.indexOf(s)>=0&&before==='intro'){TMSFX.bad();}else if(before==='steal'){TMSFX.steal();}else TMSFX.buzz();
      G.bzKey='';render();
    }
  }
})();
window.tmBzUiAnswer=function(i){
  const tm=tmObj();if(!tm||tm.phase!=='blitz')return;
  const q=tm.blitz.cur;if(!q)return;
  const who=q.ph==='answer'?q.buzz.seat:q.ph==='stealans'?q.steal.seat:0;if(!who||!human(who))return;
  if(G.isOnline){tmSend({t:'bans',i});return;}
  if(tmApply(tm,who,{t:'bans',i},Date.now())){G.bzKey='';render();}
};

// ── what happens after each render: sounds, the act card, money counting, the memory of seen questions ──
let last='';
window.tmBzPost=function(tm){
  tmLoopStart();document.body.classList.add('tm-on');
  const B=tm.blitz;if(!B)return;
  if(G.tmBzCard!==tm.seed){G.tmBzCard=tm.seed;tmActCard(tm);}
  const q=B.cur||B.qs[B.qs.length-1];if(!q)return;
  const k=[B.n,q.ph,q.ph==='clue'?tmBzStage(q,Date.now()):'',q.locked.length].join('|');
  if(k!==last){
    const prev=last.split('|');last=k;
    if(q.ph==='clue'&&prev[1]==='intro'&&prev[0]==String(B.n))TMSFX.arm();
    else if(q.ph==='clue'&&prev[1]==='clue'&&prev[0]==String(B.n)&&gtAnim()!=='off'){TMSFX.drop();TMSFX.clue();}
    else if(q.ph==='result'&&prev[1]!=='result'){
      const r=q.res;
      if(r&&r.kind==='right'){TMSFX.ok();}
      else if(r&&r.steal&&r.steal.ok){TMSFX.steal();}
      else if(r&&(r.kind==='wrong')){TMSFX.bad();}
      else TMSFX.nobody();
      recordSeen(tm,q);
    }
  }
  // the money counts up
  G.bzShown=G.bzShown||{};
  document.querySelectorAll('.bz-money[data-s]').forEach(el=>{
    const s=el.getAttribute('data-s'),to=tm.bank[+s-1],from=G.bzShown[s];
    G.bzShown[s]=to;
    if(from==null||from===to||gtAnim()==='off')return;
    const t0=performance.now(),dur=Math.min(1100,400+Math.abs(to-from)/3);
    const step=t=>{if(!el.isConnected)return;const u=Math.min(1,(t-t0)/dur);el.textContent=tmEur(Math.round(from+(to-from)*(1-Math.pow(1-u,3))));if(u<1)requestAnimationFrame(step);};
    requestAnimationFrame(step);
  });
};
function recordSeen(tm,q){
  try{
    const lib=tmBzLib(tm),e=lib[q.i];if(!e||q._rec)return;q._rec=1;
    let l=[];try{l=JSON.parse(localStorage.getItem('ct_tm_seen_blitz')||'[]');}catch(x){}
    if(l.indexOf(e[3])<0)l.push(e[3]);
    const cap=Math.round(lib.length*.7);if(l.length>cap)l=l.slice(l.length-cap);
    localStorage.setItem('ct_tm_seen_blitz',JSON.stringify(l));
  }catch(x){}
}
window.tmBzSeenIdx=function(){
  try{const l=JSON.parse(localStorage.getItem('ct_tm_seen_blitz')||'[]'),m=new Map();tmBzLib(null).forEach((e,i)=>m.set(e[3],i));return l.map(t=>m.get(t)).filter(i=>i!=null);}catch(x){return[];}
};
})();
