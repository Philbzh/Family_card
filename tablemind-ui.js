/* TABLE MIND -- screens, local game, online room and sounds. (Rules: tablemind-engine.js. Questions: tablemind-questions-de.js.)
   Everything on screen is German. The engine decides everything; this file only shows the state and sends the player's actions.
   Local play: one device, passed from hand to hand for the private parts (a pass screen hides the question until the player taps "Ich bin ...").
   Online play: every device shows the shared stage on top and ONLY its own player's controls below; each action is one compare-and-swap write of the
   whole room (oTmMutate), so several players can answer at the same moment without overwriting each other. */
(function(){
  if(typeof document==='undefined')return;
  const css=`
.game-tablemind{--tg:#e9c46a;--tg2:#b8892f;--tg3:#fff1c2;--tb:#3da5ff;--tv:#8b5cf6;--tm:#d946a8;--tn:#070b1f;color:#f4efe0;position:relative;overflow-x:hidden;}
#s-table.game-tablemind.scr{background:radial-gradient(120% 70% at 50% -10%,#1d2f86 0%,#0b1233 48%,#04060f 100%),#04060f;}
.game-tablemind::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.5;background:radial-gradient(1.5px 1.5px at 12% 18%,#fff9 50%,transparent 51%),radial-gradient(1px 1px at 72% 12%,#fff8 50%,transparent 51%),radial-gradient(1.4px 1.4px at 88% 40%,#bfd8ff9a 50%,transparent 51%),radial-gradient(1px 1px at 30% 62%,#fff7 50%,transparent 51%),radial-gradient(60% 40% at 85% 85%,rgba(139,92,246,.22),transparent 70%),radial-gradient(50% 35% at 8% 30%,rgba(61,165,255,.16),transparent 70%);}
.game-tablemind>*{position:relative;z-index:1;}
.game-tablemind .game-bar{background:linear-gradient(180deg,rgba(7,11,31,.92),rgba(7,11,31,.6));border-bottom:1px solid rgba(233,196,106,.35);}
.tm-logo{font:800 .95rem/1 var(--serif,Georgia,serif);letter-spacing:.18em;color:var(--tg);text-shadow:0 0 12px rgba(233,196,106,.4);}
.tm-main{display:flex;flex-direction:column;gap:.55rem;padding:.4rem .7rem 1rem;max-width:62rem;margin:0 auto;width:100%;}
@media(min-width:760px) and (orientation:landscape){.tm-main.split{display:grid;grid-template-columns:1.25fr 1fr;align-items:start;gap:.9rem;}}
.tm-act{display:flex;align-items:center;justify-content:center;gap:.6rem;flex-wrap:wrap;font-size:.68rem;letter-spacing:.2em;text-transform:uppercase;color:#9fb4ff;}
.tm-act b{padding:.28rem .95rem;border-radius:999px;font:700 .78rem/1 var(--serif,Georgia,serif);letter-spacing:.18em;color:#1a1300;background:linear-gradient(180deg,#fff1c2,#e9c46a 45%,#b8892f);box-shadow:0 0 16px rgba(233,196,106,.35),inset 0 1px 0 #fff8;}
.tm-pods{display:flex;gap:.45rem;justify-content:center;flex-wrap:wrap;}
.tm-pod{position:relative;display:flex;flex-direction:column;align-items:center;gap:.08rem;min-width:5.8rem;padding:.35rem .6rem .4rem;border-radius:14px;background:linear-gradient(180deg,rgba(24,36,100,.82),rgba(8,13,40,.92));border:1px solid rgba(233,196,106,.28);box-shadow:0 6px 18px -8px #000,inset 0 1px 0 rgba(255,255,255,.08);transition:transform .25s,box-shadow .25s,border-color .25s;}
.tm-pod.me{border-color:var(--tg);box-shadow:0 0 0 1px rgba(233,196,106,.45),0 0 22px 2px rgba(233,196,106,.25),0 6px 18px -8px #000;}
.tm-pod.lead .tm-nm::after{content:" 👑";}
.tm-pod.pulse{animation:tm-pop .7s cubic-bezier(.2,.9,.3,1.3);}
.tm-av{font-size:1.2rem;line-height:1;}.tm-av .av-img{width:1.7rem;height:1.7rem;border-radius:50%;}
.tm-nm{font-size:.72rem;color:#cfd7f5;max-width:6.5rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.tm-money{font:700 1.1rem/1.1 var(--serif,Georgia,serif);color:var(--tg);text-shadow:0 0 14px rgba(233,196,106,.45);font-variant-numeric:tabular-nums;}
.tm-unb{font-size:.62rem;color:#8fd0ff;letter-spacing:.06em;min-height:.8rem;font-variant-numeric:tabular-nums;}
.tm-seals{display:flex;gap:.12rem;}
.tm-seals i{font-style:normal;font-size:.7rem;opacity:.22;filter:grayscale(1);transition:opacity .4s,filter .4s,transform .4s;}
.tm-seals i.on{opacity:1;filter:none;transform:scale(1.15);}
.tm-state{font-size:.6rem;letter-spacing:.08em;color:#8fa2e8;min-height:.8rem;}
.tm-state.ok{color:#7ff0a8;}.tm-state.bad{color:#ff8e9d;}
.tm-card{border-radius:18px;padding:.8rem .9rem;background:linear-gradient(180deg,rgba(20,32,92,.88),rgba(6,10,32,.95));border:1px solid rgba(233,196,106,.45);box-shadow:0 0 0 3px rgba(7,11,31,.8),0 0 0 4px rgba(233,196,106,.2),0 16px 36px -16px #000,inset 0 0 36px rgba(61,165,255,.1);}
.tm-qchips{display:flex;gap:.4rem;flex-wrap:wrap;justify-content:center;align-items:center;margin-bottom:.45rem;}
.tm-chip{padding:.2rem .7rem;border-radius:999px;font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;background:rgba(61,165,255,.16);border:1px solid rgba(61,165,255,.45);color:#cfe6ff;}
.tm-chip.gold{background:rgba(233,196,106,.18);border-color:rgba(233,196,106,.55);color:var(--tg3);}
.tm-q{font:600 1.18rem/1.35 var(--serif,Georgia,serif);color:#fff6dc;text-align:center;margin:.2rem 0 .7rem;text-wrap:balance;}
@media(min-width:760px){.tm-q{font-size:1.4rem;}}
.tm-ans{display:grid;grid-template-columns:1fr;gap:.45rem;}
@media(min-width:620px){.tm-ans{grid-template-columns:1fr 1fr;}}
.tm-a{display:flex;align-items:center;gap:.6rem;text-align:left;min-height:3.1rem;padding:.55rem .75rem;border-radius:14px;border:1px solid rgba(143,162,232,.45);background:linear-gradient(180deg,rgba(30,46,128,.7),rgba(10,16,52,.85));color:#f4efe0;font:600 1rem/1.25 inherit;cursor:pointer;transition:transform .15s,box-shadow .2s,border-color .2s,background .2s,opacity .3s;touch-action:manipulation;}
.tm-a:active{transform:scale(.98);}
.tm-a .tm-l{flex:none;width:1.9rem;height:1.9rem;border-radius:50%;display:flex;align-items:center;justify-content:center;font:800 .95rem/1 var(--serif,Georgia,serif);color:#0c1646;background:linear-gradient(180deg,#fff1c2,#e9c46a 60%,#b8892f);}
.tm-a.sel{border-color:var(--tg);box-shadow:0 0 0 2px rgba(233,196,106,.55),0 0 22px rgba(233,196,106,.35);background:linear-gradient(180deg,rgba(60,70,150,.85),rgba(20,28,80,.9));}
.tm-a.lock{border-color:var(--tg);cursor:default;}
.tm-a.elim{opacity:.18;text-decoration:line-through;pointer-events:none;transform:scale(.97);}
.tm-a.cor{border-color:#4ade80;background:linear-gradient(180deg,rgba(22,120,70,.9),rgba(8,52,34,.95));box-shadow:0 0 0 2px rgba(74,222,128,.55),0 0 26px rgba(74,222,128,.4);}
.tm-a.wrg{border-color:#f97362;background:linear-gradient(180deg,rgba(120,30,40,.85),rgba(50,10,20,.95));}
.tm-a.dim{opacity:.55;}
.tm-a.stat{cursor:default;}
.tm-btn{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;padding:.7rem 1.2rem;border-radius:14px;border:1px solid var(--tg);font:800 1rem/1 var(--serif,Georgia,serif);letter-spacing:.12em;color:#1a1300;background:linear-gradient(180deg,#fff1c2,#e9c46a 45%,#b8892f);box-shadow:0 8px 20px -8px rgba(233,196,106,.6),inset 0 1px 0 #fff8;cursor:pointer;touch-action:manipulation;}
.tm-btn:active{transform:scale(.97);}
.tm-btn.ghost{background:rgba(30,46,128,.55);color:#e7eeff;border-color:rgba(143,162,232,.5);box-shadow:none;font-weight:700;}
.tm-btn.blue{background:linear-gradient(180deg,#9bd2ff,#3da5ff 55%,#1c6fc4);border-color:#9bd2ff;color:#04162e;}
.tm-btn.big{width:100%;padding:.95rem 1rem;font-size:1.15rem;}
.tm-btn[disabled]{opacity:.4;pointer-events:none;}
.tm-row{display:flex;gap:.5rem;flex-wrap:wrap;justify-content:center;}
.tm-lives{display:flex;gap:.35rem;flex-wrap:wrap;justify-content:center;margin-top:.55rem;}
.tm-life{display:flex;flex-direction:column;align-items:center;gap:.1rem;min-width:4.2rem;padding:.38rem .5rem;border-radius:12px;border:1px solid rgba(139,92,246,.55);background:rgba(60,30,120,.35);color:#e6dcff;font:600 .68rem/1.15 inherit;cursor:pointer;touch-action:manipulation;}
.tm-life b{font-size:1.05rem;}
.tm-life[disabled]{opacity:.28;pointer-events:none;filter:grayscale(.6);}
.tm-clue{margin-top:.5rem;padding:.5rem .7rem;border-radius:12px;background:rgba(139,92,246,.18);border:1px dashed rgba(139,92,246,.7);font-size:.92rem;color:#e6dcff;text-align:center;}
.tm-timer{display:flex;align-items:center;gap:.55rem;margin:.1rem 0 .4rem;}
.tm-timer b{min-width:2rem;text-align:right;font:800 1.2rem/1 var(--serif,Georgia,serif);color:#cfe6ff;font-variant-numeric:tabular-nums;}
.tm-timer i{flex:1;height:.5rem;border-radius:9px;background:rgba(255,255,255,.1);position:relative;overflow:hidden;}
.tm-timer i::after{content:"";position:absolute;left:0;top:0;bottom:0;width:var(--w,100%);border-radius:9px;background:linear-gradient(90deg,#3da5ff,#9bd2ff);transition:width .3s linear;}
.tm-timer.low b{color:#ff8e9d;}.tm-timer.low i::after{background:linear-gradient(90deg,#f97362,#ff8e9d);}
.tm-wait{text-align:center;color:#cfd7f5;padding:.5rem .3rem;}
.tm-wait b{color:var(--tg);}
.tm-wait .dots::after{content:"";animation:tm-dots 1.4s steps(4,end) infinite;}
@keyframes tm-dots{0%{content:""}25%{content:"."}50%{content:".."}75%{content:"..."}}
.tm-title{font:800 1.05rem/1.2 var(--serif,Georgia,serif);letter-spacing:.08em;color:var(--tg3);text-align:center;margin-bottom:.3rem;}
.tm-sub{font-size:.85rem;color:#b8c6f5;text-align:center;margin-bottom:.5rem;}
.tm-lad{display:flex;flex-direction:column-reverse;gap:.22rem;max-width:20rem;margin:0 auto;width:100%;}
.tm-rung{display:flex;align-items:center;gap:.5rem;padding:.22rem .6rem;border-radius:9px;background:rgba(14,22,72,.7);border:1px solid rgba(143,162,232,.25);font:700 .88rem/1 var(--serif,Georgia,serif);color:#9fb4ff;font-variant-numeric:tabular-nums;}
.tm-rung .amt{flex:1;}.tm-rung .who{display:flex;gap:.15rem;min-height:1.1rem;}
.tm-rung.top{border-color:rgba(233,196,106,.6);color:var(--tg);}
.tm-rung.on{background:linear-gradient(90deg,rgba(233,196,106,.28),rgba(14,22,72,.7));color:var(--tg3);border-color:var(--tg);}
.tm-realms{display:grid;grid-template-columns:repeat(3,1fr);gap:.45rem;}
.tm-realm{position:relative;display:flex;flex-direction:column;align-items:center;gap:.15rem;padding:.55rem .3rem;border-radius:14px;border:1px solid color-mix(in srgb,var(--c) 70%,#000);background:linear-gradient(180deg,color-mix(in srgb,var(--c) 28%,#0a1038),rgba(6,10,32,.95));color:#f4efe0;font:700 .72rem/1.15 inherit;text-align:center;cursor:pointer;touch-action:manipulation;transition:transform .2s,box-shadow .2s;}
.tm-realm .ic{font-size:1.7rem;line-height:1;}
.tm-realm.got::after{content:"✓";position:absolute;top:.2rem;right:.35rem;color:var(--tg);font-size:.8rem;}
.tm-realm.sel{box-shadow:0 0 0 2px var(--tg),0 0 24px color-mix(in srgb,var(--c) 70%,transparent);transform:translateY(-2px);}
.tm-realm.stat{cursor:default;}
.tm-offers{display:grid;grid-template-columns:1fr;gap:.5rem;}
@media(min-width:560px){.tm-offers{grid-template-columns:repeat(3,1fr);}}
.tm-offer{display:flex;flex-direction:column;align-items:center;gap:.25rem;padding:.8rem .6rem;border-radius:16px;border:1px solid rgba(143,162,232,.5);background:linear-gradient(180deg,rgba(30,46,128,.7),rgba(8,13,44,.92));color:#f4efe0;cursor:pointer;touch-action:manipulation;transition:transform .2s,box-shadow .2s;}
.tm-offer h4{margin:0;font:800 1.05rem/1 var(--serif,Georgia,serif);letter-spacing:.14em;color:var(--tg);}
.tm-offer .big{font:800 1.5rem/1 var(--serif,Georgia,serif);}
.tm-offer small{color:#b8c6f5;text-align:center;}
.tm-offer.risk{border-color:rgba(217,70,168,.7);}.tm-offer.risk h4{color:#ff8fd6;}
.tm-offer.safe{border-color:rgba(74,222,128,.6);}.tm-offer.safe h4{color:#7ff0a8;}
.tm-offer.sel{box-shadow:0 0 0 2px var(--tg),0 0 26px rgba(233,196,106,.35);transform:translateY(-2px);}
.tm-chaser{display:flex;align-items:center;gap:.6rem;justify-content:center;padding:.3rem .8rem;}
.tm-chaser .face{font-size:2.6rem;line-height:1;filter:drop-shadow(0 0 12px rgba(217,70,168,.55));animation:tm-breathe 3.2s ease-in-out infinite;}
.tm-chaser b{display:block;font:800 1rem/1.1 var(--serif,Georgia,serif);color:#ff8fd6;letter-spacing:.1em;}
.tm-chaser small{color:#b8c6f5;font-size:.72rem;}
@keyframes tm-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
.tm-lanes{display:flex;flex-direction:column;gap:.45rem;}
.tm-lane{position:relative;padding:.3rem .4rem .35rem;border-radius:12px;background:rgba(10,16,52,.7);border:1px solid rgba(143,162,232,.25);}
.tm-lane.esc{border-color:#4ade80;box-shadow:0 0 18px rgba(74,222,128,.3);}.tm-lane.cau{border-color:#f97362;opacity:.8;}
.tm-lane-h{display:flex;justify-content:space-between;font-size:.66rem;letter-spacing:.08em;color:#9fb4ff;margin-bottom:.15rem;}
.tm-track{position:relative;height:2.2rem;display:grid;grid-template-columns:repeat(8,1fr);gap:2px;}
.tm-cell{border-radius:5px;background:rgba(255,255,255,.07);display:flex;align-items:center;justify-content:center;font-size:.6rem;color:#6f82c8;}
.tm-cell.fin{background:repeating-conic-gradient(#fff 0 25%,#111 0 50%) 0 0/8px 8px;color:transparent;}
.tm-mk{position:absolute;top:50%;width:calc((100% - 14px)/8);display:flex;align-items:center;justify-content:center;font-size:1.4rem;line-height:1;transform:translateY(-50%);transition:left .9s cubic-bezier(.3,.8,.3,1);z-index:2;}
.tm-mk.pl .av-img{width:1.7rem;height:1.7rem;border-radius:50%;box-shadow:0 0 0 2px var(--tg);}
.tm-mk.ch{filter:drop-shadow(0 0 8px rgba(217,70,168,.8));z-index:3;}
.tm-banner{text-align:center;font:800 1.5rem/1.15 var(--serif,Georgia,serif);letter-spacing:.1em;color:var(--tg);text-shadow:0 0 18px rgba(233,196,106,.6);animation:tm-banner .9s cubic-bezier(.2,.9,.3,1.2) both;}
.tm-banner.bad{color:#ff8e9d;text-shadow:0 0 18px rgba(249,115,98,.6);}.tm-banner.hot{color:#ff8fd6;text-shadow:0 0 18px rgba(217,70,168,.6);}
.tm-res{display:flex;gap:.4rem;flex-wrap:wrap;justify-content:center;}
.tm-resc{padding:.25rem .65rem;border-radius:999px;font-size:.78rem;background:rgba(255,255,255,.08);}
.tm-resc.ok{background:rgba(74,222,128,.18);color:#9bf5bf;}.tm-resc.bad{background:rgba(249,115,98,.18);color:#ffb0a4;}
.tm-expl{margin-top:.5rem;padding:.55rem .7rem;border-radius:12px;background:rgba(61,165,255,.12);color:#d8e8ff;font-size:.92rem;text-align:center;}
.tm-pass{text-align:center;padding:1.4rem .8rem;}
.tm-pass .who{font:800 1.5rem/1.2 var(--serif,Georgia,serif);color:var(--tg);margin:.4rem 0 1rem;}
.tm-council{margin-bottom:.6rem;border-color:rgba(139,92,246,.8);}
.tm-bars{display:grid;gap:.3rem;margin-top:.4rem;}
.tm-bar{display:flex;align-items:center;gap:.5rem;font-size:.85rem;}
.tm-bar i{display:block;height:.9rem;border-radius:6px;background:linear-gradient(90deg,#8b5cf6,#d946a8);min-width:.2rem;transition:width .9s cubic-bezier(.2,.8,.2,1);}
.tm-intro{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.9rem;background:radial-gradient(120% 80% at 50% 20%,#1d2f86,#04060f 70%);cursor:pointer;animation:tm-fade .5s both;}
.tm-intro .t1{font:800 clamp(2rem,9vw,4.2rem)/1 var(--serif,Georgia,serif);letter-spacing:.2em;color:transparent;background:linear-gradient(100deg,#8a6a22 20%,#fff1c2 45%,#e9c46a 55%,#8a6a22 80%) 0 0/250% 100%;-webkit-background-clip:text;background-clip:text;animation:tm-shine 2.6s ease-out both;}
.tm-intro .t2{font-size:clamp(.8rem,3vw,1.2rem);letter-spacing:.4em;color:#9fb4ff;animation:tm-fade 1.2s .6s both;}
.tm-intro .ic{display:flex;gap:.7rem;font-size:clamp(1.4rem,6vw,2.4rem);}
.tm-intro .ic i{font-style:normal;opacity:0;animation:tm-pop .6s both;}
.tm-intro .hint{font-size:.7rem;color:#6f82c8;letter-spacing:.2em;animation:tm-fade 1s 1.6s both;}
.tm-pod .tm-delta{position:absolute;top:-.55rem;right:-.2rem;padding:.1rem .45rem;border-radius:999px;font:700 .68rem/1 inherit;background:#1d6b43;color:#d7ffe8;animation:tm-float 1.8s ease-out both;}
.tm-pod .tm-delta.neg{background:#7a2230;color:#ffd8de;}
@keyframes tm-shine{0%{background-position:100% 0;opacity:0;transform:scale(.92)}30%{opacity:1}100%{background-position:0 0;opacity:1;transform:none}}
@keyframes tm-fade{from{opacity:0}to{opacity:1}}
@keyframes tm-pop{0%{transform:scale(.4);opacity:0}60%{transform:scale(1.18);opacity:1}100%{transform:none;opacity:1}}
@keyframes tm-banner{0%{transform:scale(.5) translateY(10px);opacity:0}60%{transform:scale(1.08);opacity:1}100%{transform:none;opacity:1}}
@keyframes tm-float{0%{transform:translateY(8px);opacity:0}15%{opacity:1}100%{transform:translateY(-6px);opacity:.9}}
.game-tablemind.an-light *,.game-tablemind.an-off *,.game-tablemind.an-light *::before,.game-tablemind.an-off *::before{animation-duration:.01ms!important;animation-delay:0s!important;}
.game-tablemind.an-off *{transition:none!important;}
.game-tablemind.an-light .tm-chaser .face{animation:none!important;}
@media(prefers-reduced-motion:reduce){.game-tablemind *{animation-duration:.01ms!important;transition:none!important;}}
@media(max-width:759px){.tm-main{padding:.3rem .5rem 1rem;}.tm-right{order:-1;}.tm-pod{min-width:4.6rem;padding:.25rem .4rem .3rem;}.tm-pods{gap:.3rem;}.tm-money{font-size:.95rem;}.tm-seals i{font-size:.58rem;}.tm-unb{display:none;}.tm-stage .tm-lad{display:none;}.tm-q{font-size:1.05rem;margin:.1rem 0 .5rem;}.tm-a{min-height:2.7rem;padding:.4rem .6rem;}.game-tablemind .gb-turn{display:none;}.tm-pass .tm-av{display:flex;justify-content:center;}}
.tm-foot{display:flex;gap:.5rem;justify-content:center;margin-top:.4rem;}
.tm-opt{display:flex;gap:.4rem;flex-wrap:wrap;justify-content:center;align-items:center;margin:.4rem 0;font-size:.78rem;color:var(--paper2,#b8c6f5);}
.tm-opt button{padding:.3rem .7rem;border-radius:999px;border:1px solid rgba(143,162,232,.5);background:rgba(30,46,128,.4);color:inherit;font:inherit;cursor:pointer;}
.v10-gc--tablemind{background:linear-gradient(160deg,rgba(61,165,255,.28),rgba(7,11,31,.3));border-top-color:#e9c46a;box-shadow:0 10px 28px -12px rgba(233,196,106,.4);}
.v10-main .v10-gc--tablemind{background:linear-gradient(180deg,rgba(20,34,110,.85),rgba(5,8,26,.93));border-top-color:rgba(233,196,106,.6);--tile-glow:rgba(233,196,106,.6);}
`;
  const st=document.createElement('style');st.id='tm-css';st.textContent=css;document.head.appendChild(st);
})();

/* ───────── texts ───────── */
const TM_ACT_NAMES=['','DER AUFSTIEG','DIE SECHS WELTEN','DIE JAGD'];
const TM_OFFER_INFO={safe:{n:'SICHER',h:'3 Felder Vorsprung',m:1,t:'Beste Chance zu entkommen, kleine Belohnung.'},std:{n:'STANDARD',h:'2 Felder Vorsprung',m:2,t:'Ausgewogen: gute Chance, doppelte Belohnung.'},risk:{n:'RISIKO',h:'1 Feld Vorsprung',m:3,t:'Knapp! Aber dreifache Belohnung bei Erfolg.'}};
const TM_LIFE_INFO={cut:{n:'Der Schnitt',ic:'✂️',t:'Zwei falsche Antworten verschwinden'},council:{n:'Der Rat',ic:'🗳️',t:'Die anderen beraten dich — oder führen dich in die Irre'},archive:{n:'Das Archiv',ic:'📜',t:'Ein Hinweis zur Frage'},freeze:{n:'Zeit anhalten',ic:'⏸️',t:'10 Sekunden mehr'}};
const TM_LETTERS='ABCD';
function tmEur(n){return(n||0).toLocaleString('de-DE')+' €';}
function tmCatName(c){return TM_CATS[c].de;}
function tmPrefChaser(){let v='';try{v=localStorage.getItem('ct_tm_chaser')||'';}catch(e){}return TM_CH_KEYS.indexOf(v)>=0?v:'';}
function tmPrefRelaxed(){let v=0;try{v=+localStorage.getItem('ct_tm_relaxed')||0;}catch(e){}return v===1;}
function tmSetPref(k,v){try{localStorage.setItem('ct_tm_'+k,String(v));}catch(e){}}
function tmOptionsHTML(){
  const ch=tmPrefChaser(),rl=tmPrefRelaxed();
  return`<div class="tm-opt"><span>Zeit:</span><button data-a="tmopt" data-k="relaxed">${rl?'Entspannt':'Normal'}</button><span>Chaser:</span><button data-a="tmopt" data-k="chaser">${ch?TM_CFG.chasers[ch].name:'Zufällig'}</button></div>`;
}
function tmOptTap(k){
  if(k==='relaxed')tmSetPref('relaxed',tmPrefRelaxed()?0:1);
  else{const ch=tmPrefChaser(),i=ch?TM_CH_KEYS.indexOf(ch):-1;tmSetPref('chaser',i+1>=TM_CH_KEYS.length?'':TM_CH_KEYS[i+1]);}
  SFX.chip&&SFX.chip();render();
}
function tmNewGame(n){return tmNew(n,{seed:Date.now(),relaxed:tmPrefRelaxed(),chaser:tmPrefChaser()||undefined});}

/* ───────── sounds (built from the app's own tone/haptic) ───────── */
const TMSFX={
  pick(){tone(620,.05,'triangle');haptic(8);},
  lock(){tone(330,.08,'triangle');setTimeout(()=>tone(495,.1,'triangle'),70);haptic([14,20]);},
  ok(){[523,659,784].forEach((f,i)=>setTimeout(()=>tone(f,.14),i*90));haptic([12,24,12]);},
  bad(){tone(196,.22,'sawtooth');setTimeout(()=>tone(165,.3,'sawtooth'),160);haptic([30,40,30]);},
  bank(){[784,988,1318].forEach((f,i)=>setTimeout(()=>tone(f,.1,'square'),i*70));setTimeout(()=>tone(1568,.35,'triangle'),260);haptic([10,20,10,20]);},
  life(){tone(440,.07,'sine');setTimeout(()=>tone(880,.12,'sine'),80);haptic(10);},
  seal(){[659,784,988,1318].forEach((f,i)=>setTimeout(()=>tone(f,.16,'triangle'),i*100));haptic([20,30,20]);},
  chase(){tone(90,.14,'sine');setTimeout(()=>tone(80,.12,'sine'),150);haptic(16);},
  caught(){tone(260,.25,'sawtooth');setTimeout(()=>tone(170,.3,'sawtooth'),180);setTimeout(()=>tone(100,.5,'sawtooth'),380);haptic([60,40,60,40,140]);},
  escape(){[523,659,784,1046,1318].forEach((f,i)=>setTimeout(()=>tone(f,.22),i*110));setTimeout(()=>{tone(1568,.5);tone(784,.5,'triangle');},620);haptic([30,50,30,50,120]);},
  intro(){[196,247,294,392,494,587].forEach((f,i)=>setTimeout(()=>tone(f,.28,'triangle'),i*210));haptic([20,60,20,60,80]);},
  tick(){tone(1500,.02,'square');},
  open(){tone(380,.06,'triangle');setTimeout(()=>tone(570,.08,'triangle'),60);}
};

/* ───────── which game, which seat ───────── */
function tmObj(){return G.isOnline?(G.srv&&G.srv.gameId==='tablemind'?G.srv.tm:null):(G.selGame==='tablemind'?G.tm:null);}
function tmPlayers(){return G.isOnline?((G.srv&&G.srv.players)||[]):G.lp;}
function tmMySeat(){
  if(G.isOnline){const i=tmPlayers().findIndex(p=>p.id===G.myPid);return i+1;}
  return G.tmViewer||0;
}

/* ───────── local game ───────── */
function lDealTablemind(){
  G.lp.forEach(p=>{p.totalScore=0;p.c4Result=null;});
  G.tm=tmNewGame(G.lp.length);
  tmStart(G.tm,Date.now()+3200);
  G.tmViewer=null;G.tmReadyKey='';G.tmSel=-1;G.tmFxKey='';G.tmIntro=G.tm.seed;G.tmBotDue={};G.tmShown={};
  G.lcur=0;G.lres=null;
  SFX.deal();
  G.scr='table';
  tmLoopStart();
}
function tmLocalKey(tm,seat,mode){
  return[tm.act,tm.phase,tm.cycle,tm.round2,tm.hunt?tm.hunt.n:0,seat,mode||''].join('|');
}
// who should be holding the device right now? {seat, mode} or null (nobody: the shared stage only)
function tmLocalViewer(tm){
  const pl=G.lp,human=s=>!isBotPlayer(pl[s-1]);
  if(tm.over)return null;
  if(tm.phase==='ask'){
    const c=tm.council;
    if(c&&!c.done){
      for(let s=1;s<=tm.P;s++)if(s!==c.for&&human(s)&&c.votes[s]==null)return{seat:s,mode:'vote'};
      return null;
    }
    for(let s=1;s<=tm.P;s++)if(tmActiveSeat(tm,s)&&human(s)&&tm.ans[s-1]==null)return{seat:s,mode:'ask'};
    return null;
  }
  if(tm.phase==='decide'){for(let s=1;s<=tm.P;s++)if(human(s)&&tm.pendingDecide[s-1]===true)return{seat:s,mode:'decide'};return null;}
  if(tm.phase==='pick'){for(let s=1;s<=tm.P;s++)if(human(s)&&tm.pick[s-1]==null)return{seat:s,mode:'pick'};return null;}
  if(tm.phase==='offer'){for(let s=1;s<=tm.P;s++)if(human(s)&&tm.offer[s-1]==null)return{seat:s,mode:'offer'};return null;}
  return null;
}
function tmActiveSeat(tm,s){return tm.act!==3||(tm.lane[s-1]&&tm.lane[s-1].st==='run');}
function tmReady(){
  const tm=tmObj();if(!tm||G.isOnline)return;
  const v=tmLocalViewer(tm);if(!v)return;
  G.tmViewer=v.seat;G.tmReadyKey=tmLocalKey(tm,v.seat,v.mode);G.tmSel=-1;
  if(v.mode==='ask'){tm.dl=Date.now()+tmMs(tm,'ask'+tm.act);tm.ext=tm.ext.map(()=>0);}
  if(v.mode==='decide'||v.mode==='pick'||v.mode==='offer'){tm.dl=Math.max(tm.dl,Date.now()+(v.mode==='decide'?TM_CFG.ms.decide:v.mode==='pick'?TM_CFG.ms.pick:TM_CFG.ms.offer));}
  TMSFX.open();render();
}
function tmEndLocal(){
  const tm=G.tm;if(!tm||!tm.over||G.selGame!=='tablemind')return;
  const names=G.lp.map(p=>p.name);
  G.lp.forEach((p,i)=>{p.totalScore=tm.totals[i];p.c4Result=tm.win===i+1?'win':'loss';});
  const winner=G.lp[tm.win-1];
  G.tmMoment=tmMoment(tm,names);
  G.tw++;localStorage.setItem('ct_tw',G.tw);
  SFX.win();v14WinnerBurst();celebrateWin(winner.name,winner.avatar);fxPulse('gold');fxSeatGlow(tm.win-1,'gold');
  addHistory({game:'tablemind',winner:winner.name,winnerAvatar:winner.avatar,date:new Date().toISOString(),players:names,moment:G.tmMoment,
    stats:{cardsPlayed:G.matchStats.cardsPlayed,comebacks:G.matchStats.comebacks,reactions:G.matchStats.reactions,tm:tmStatsFor(tm,names)}});
  render();
  setTimeout(()=>{if(G.selGame==='tablemind'&&G.tm===tm&&G.scr==='table'){G.scr='matchend';render();}},3600);
}
function tmStatsFor(tm,names){
  const o={};
  names.forEach((nm,i)=>{const L=tm.lane[i],n=tm.stats.right[i]+tm.stats.wrong[i]+tm.stats.late[i];
    o[nm]={total:tm.totals[i],bank:tm.bank[i],seals:tmSealCount(tm,i+1),right:tm.stats.right[i],wrong:tm.stats.wrong[i]+tm.stats.late[i],acc:n?Math.round(tm.stats.right[i]/n*100):0,
      lifes:tm.stats.lifes[i],best:tm.stats.best[i],top:tm.stats.topHits[i],hunt:L?L.st:'',mult:L?L.mult:0,offer:tm.offer[i]||''};});
  return o;
}
function tmMoment(tm,names){
  const w=tm.win-1,L=tm.lane[w],nm=names[w]||'';
  if(L&&L.st==='escaped'&&L.mult===3)return nm+' entkommt dem Chaser auf der Risikostrecke und gewinnt TABLE MIND';
  if(tm.stats.topHits[w]>0)return nm+' erklimmt die höchste Stufe und gewinnt TABLE MIND';
  if(tmSealCount(tm,w+1)>=3)return nm+' sammelt drei Siegel und gewinnt TABLE MIND';
  return nm+' gewinnt TABLE MIND';
}
function tmMine(h){return h&&h.game==='tablemind'&&h.stats&&h.stats.tm?h.stats.tm[G.myName]:null;}

/* ───────── the loop: timers on screen, bots, and moving the game on when a deadline has passed ───────── */
function tmLoopStart(){
  if(G.tmLoopT)return;
  G.tmLoopT=setInterval(tmLoopTick,250);
}
function tmLoopStop(){if(G.tmLoopT){clearInterval(G.tmLoopT);G.tmLoopT=null;}}
function tmLoopTick(){
  const tm=tmObj();
  if(!tm||G.scr!=='table'||(G.isOnline?(G.srv&&G.srv.gameId)!=='tablemind':G.selGame!=='tablemind')){tmLoopStop();return;}
  const now=Date.now();
  // the clocks on screen
  const me=tmMySeat();
  document.querySelectorAll('.tm-timer').forEach(el=>{
    let ms=0,tot=1;
    if(tm.phase==='ask'){ms=(me?tmSeatDl(tm,me):tm.dl)-now;tot=tmMs(tm,'ask'+tm.act);}
    else if(tm.dl){ms=tm.dl-now;tot=tm.phase==='decide'?TM_CFG.ms.decide:tm.phase==='pick'?TM_CFG.ms.pick:TM_CFG.ms.offer;}
    const s=Math.max(0,Math.ceil(ms/1000));
    const b=el.querySelector('b'),i=el.querySelector('i');
    if(b&&b.textContent!==String(s)){b.textContent=s;if(s<=5&&s>0&&gtAnim()!=='off')TMSFX.tick();}
    if(i)i.style.setProperty('--w',Math.max(0,Math.min(100,ms/tot/10))+'%');
    el.classList.toggle('low',s<=5);
  });
  if(G.tmIntro===tm.seed&&now<tm.dl-tmMs(tm,'ask'+(tm.act||1))+200)return;   // the opening card is still showing
  if(!G.isOnline){tmLocalLoop(tm,now);return;}
  // online: any device may move the game on once a deadline has passed (the host first, the others after a short grace)
  if(!tm.over&&tmDueNow(tm,now)){
    const grace=G.isHost?0:2600+(tmMySeat()*400);
    if(!G.tmTickBusy&&now>tmDueAt(tm)+grace){G.tmTickBusy=true;oTmTick().finally(()=>{G.tmTickBusy=false;});}
  }
}
function tmDueAt(tm){
  if(tm.phase==='ask'){let m=0;for(let s=1;s<=tm.P;s++)if(tmActiveSeat(tm,s)&&tm.ans[s-1]==null)m=Math.max(m,tmSeatDl(tm,s));
    if(tm.council&&!tm.council.done)m=Math.max(m,tm.council.until);return m;}
  return tm.dl;
}
function tmDueNow(tm,now){
  if(tm.phase==='ask'){
    let open=false;for(let s=1;s<=tm.P;s++)if(tmActiveSeat(tm,s)&&tm.ans[s-1]==null)open=true;
    if(!open)return true;                         // everybody answered but nobody has resolved the question yet
    return now>=tmDueAt(tm);
  }
  return now>=tm.dl;
}
async function oTmTick(){
  await oTmMutate(st=>{const was=st.tm.phase+st.tm.cycle+st.tm.round2+(st.tm.hunt?st.tm.hunt.n:0);const ok=tmTick(st.tm,Date.now());if(ok)oTmAfter(st);return ok;});
}
function tmLocalLoop(tm,now){
  if(tm.over)return;
  // bots act after a thinking pause
  const pl=G.lp;let acted=false;
  for(let s=1;s<=tm.P&&!acted;s++){
    if(!isBotPlayer(pl[s-1]))continue;
    const key=tmLocalKey(tm,s,tm.council?'c'+Object.keys(tm.council.votes).length:'');
    if(G.tmBotDue[s]==null||G.tmBotDue[s].k!==key)G.tmBotDue[s]={k:key,at:now+1200+Math.random()*(tm.phase==='ask'?6500:2200)};
    if(now<G.tmBotDue[s].at)continue;
    const a=tmBotAct(tm,s,pl[s-1].bot==='sharp'?'sharp':'gentle',Math.random);
    if(a&&tmApply(tm,s,a,now)){acted=true;G.tmBotDue[s]=null;if(a.t==='life')TMSFX.life();}
  }
  // the player holding the device ran out of time
  const v=tmLocalViewer(tm);
  if(v&&v.mode==='ask'&&G.tmReadyKey===tmLocalKey(tm,v.seat,'ask')&&now>tmSeatDl(tm,v.seat)+300){tmApply(tm,v.seat,{t:'ans',to:1},now);acted=true;G.tmSel=-1;}
  if(v&&v.mode==='vote'&&G.tmReadyKey===tmLocalKey(tm,v.seat,'vote')&&tm.council&&now>tm.council.until){tmTick(tm,now);acted=true;}
  if(!acted&&tmDueNow(tm,now)&&!(v&&tm.phase!=='reveal'&&G.tmReadyKey!==tmLocalKey(tm,v.seat,v.mode)&&tm.phase==='ask'&&false)){
    // do not run the clock out on a player who has not even picked the device up yet (their clock starts at "Ich bin ...")
    if(tm.phase==='ask'&&v)return;
    if(tmTick(tm,now))acted=true;
  }
  if(acted){if(tm.over&&!G.tmEnded){G.tmEnded=tm.seed;tmEndLocal();}else render();}
}
function tmLocalAfterAction(){
  const tm=G.tm;G.tmSel=-1;
  if(tm.over&&G.tmEnded!==tm.seed){G.tmEnded=tm.seed;tmEndLocal();return;}
  render();
}

/* ───────── online ───────── */
async function oTmMutate(mutate){
  for(let i=0;i<6;i++){
    const state=await dbRead(G.roomId);if(!state||!state.tm||state.gameId!=='tablemind')return false;
    const expectedTs=state._ts;
    if(!mutate(state))return false;
    onSrv(state);
    if(await dbWriteIfUnchanged(G.roomId,expectedTs,state))return true;
  }
  toast('⚠️ Verbindung wackelt — bitte noch einmal');
  return false;
}
function oTmAfter(state){
  const tm=state.tm;
  if(tm.over&&!state.winner){
    state.players.forEach((p,i)=>{p.totalScore=tm.totals[i];p.c4Result=tm.win===i+1?'win':'loss';});
    const wp=state.players[tm.win-1];
    state.winner=wp.id;state.winnerName=wp.name;state.winnerAv=wp.avatar;
    state.moment=tmMoment(tm,state.players.map(p=>p.name));
    state.lastAct=esc(wp.name)+' gewinnt TABLE MIND.';
  }
}
function tmBuildRoom(rs,players){
  const tm=tmNewGame(players.length);tmStart(tm,Date.now()+3600);
  return{phase:'game',gameId:'tablemind',host:rs.host,hr:rs.hr||G.hr,players,curIdx:0,tm,winner:null,winnerName:null,winnerAv:null,lastAct:'',round:1,_ts:Date.now()};
}

/* ───────── what a tap does ───────── */
function tmSend(act){
  const tm=tmObj();if(!tm||tm.over)return;
  if(G.isOnline){
    const seat=tmMySeat();if(!seat)return;
    oTmMutate(st=>{const ok=tmApply(st.tm,seat,act,Date.now());if(ok)oTmAfter(st);return ok;}).then(ok=>{if(!ok)SFX.illegal();});
    G.tmSel=-1;
  }else{
    const seat=G.tmViewer;if(!seat)return;
    if(!tmApply(tm,seat,act,Date.now())){SFX.illegal();return;}
    if(act.t==='life'&&act.k==='council'&&tm.council){tm.council.until=Date.now()+600000;}
    tmLocalAfterAction();
  }
}
function tmTap(a,t){
  const tm=tmObj();if(!tm)return;
  const d=t&&t.dataset?t.dataset:{};
  if(a==='tmopt'){tmOptTap(d.k);return;}
  if(a==='tmanim'){gtAnimNext();SFX.chip&&SFX.chip();render();return;}
  if(a==='tmintro'){G.tmIntro=null;render();return;}
  if(a==='tmready'){tmReady();return;}
  if(tm.over)return;
  const i=+d.i;
  if(a==='tmans'){if(tm.phase!=='ask')return;G.tmSel=i;TMSFX.pick();render();return;}
  if(a==='tmlock'){if(G.tmSel<0)return;TMSFX.lock();tmSend({t:'ans',i:G.tmSel});return;}
  if(a==='tmlife'){TMSFX.life();tmSend({t:'life',k:d.k});return;}
  if(a==='tmvote'){TMSFX.lock();tmSend({t:'vote',i});return;}
  if(a==='tmbank'){TMSFX.bank();tmSend({t:'bank'});return;}
  if(a==='tmgo'){TMSFX.pick();tmSend({t:'go'});return;}
  if(a==='tmcat'){TMSFX.pick();tmSend({t:'cat',c:+d.c});return;}
  if(a==='tmoffer'){TMSFX.lock();tmSend({t:'offer',k:d.k});return;}
}

/* ───────── drawing ───────── */
function tmPodsHTML(tm,players,me,fx){
  const lead=tm.bank.some(b=>b>0)?tm.bank.indexOf(Math.max.apply(null,tm.bank))+1:0;
  return`<div class="tm-pods">${players.slice(0,tm.P).map((p,i)=>{
    const s=i+1,seals=new Set(tm.seals[i]);
    const o=fx&&fx.seats&&fx.seats[i];
    let state='',cls='';
    if(tm.phase==='ask'){
      if(!tmActiveSeat(tm,s))state=tm.lane[i].st==='escaped'?'entkommen':'gefangen';
      else if(tm.council&&!tm.council.done&&tm.council.for===s)state='fragt den Rat';
      else state=tm.ans[i]!=null?'gesperrt ✓':'denkt nach…';
    }else if(tm.phase==='decide')state=tm.pendingDecide[i]===true?'entscheidet…':'';
    else if(tm.phase==='pick')state=tm.pick[i]!=null?'gewählt ✓':'wählt…';
    else if(tm.phase==='offer')state=tm.offer[i]!=null?'gewählt ✓':'wählt…';
    else if(tm.phase==='reveal'&&o&&!o.skip){state=o.ok?'richtig':tm.res[i]==='late'?'keine Antwort':'falsch';cls=o.ok?'ok':'bad';}
    const delta=tm.phase==='reveal'&&o&&tm.act===1?(o.ok?(o.top||o.auto?'+'+tmEur(o.money):'+'+tmEur(o.money)):(o.lost?'−'+tmEur(o.lost):'')):'';
    const sealNew=tm.phase==='reveal'&&o&&o.seal&&tm.act===2;
    return`<div class="tm-pod${me===s?' me':''}${lead===s?' lead':''}${sealNew||(o&&o.ok&&tm.phase==='reveal')?' pulse':''}" data-s="${s}">
      <span class="tm-av">${avHTML(p.avatar)}</span><span class="tm-nm">${esc(p.name)}</span>
      <span class="tm-money">${tmEur(tm.act===3&&tm.lane[i]&&tm.lane[i].st==='escaped'?tmTotal(tm,s):tm.bank[i])}</span>
      <span class="tm-unb">${tm.unb[i]>0?'+'+tmEur(tm.unb[i])+' im Spiel':''}</span>
      <span class="tm-seals">${TM_CATS.map((c,k)=>`<i class="${seals.has(k)?'on':''}" title="${esc(c.de)}">${c.ic}</i>`).join('')}</span>
      <span class="tm-state ${cls}">${state}</span>${delta&&G&&gtAnim()!=='off'?`<span class="tm-delta${o.ok?'':' neg'}">${delta}</span>`:''}
    </div>`;}).join('')}</div>`;
}
function tmLadderHTML(tm,players){
  const L=TM_CFG.ladder;
  return`<div class="tm-lad">${L.map((v,k)=>{
    const here=players.slice(0,tm.P).map((p,i)=>tm.lvl[i]===k+1?`<span>${avHTML(p.avatar)}</span>`:'').join('');
    return`<div class="tm-rung${k===L.length-1?' top':''}${tm.lvl.some(l=>l===k+1)?' on':''}"><span class="amt">${k+1} · ${tmEur(v)}${k===L.length-1?' + Bonus':''}</span><span class="who">${here}</span></div>`;}).join('')}</div>`;
}
function tmRealmsHTML(tm,me,mode){   // mode 'pick' (buttons) or 'show' (who chose what)
  const have=new Set(me?tm.seals[me-1]:[]);
  return`<div class="tm-realms">${TM_CATS.map((c,k)=>`<${mode==='pick'?'button':'div'} class="tm-realm${have.has(k)?' got':''}${mode!=='pick'?' stat':''}" style="--c:${c.col}" ${mode==='pick'?`data-a="tmcat" data-c="${k}"`:''}><span class="ic">${c.ic}</span>${esc(c.de)}</${mode==='pick'?'button':'div'}>`).join('')}</div>`;
}
function tmChaserHTML(tm){
  const c=TM_CFG.chasers[tm.chaser];
  return`<div class="tm-chaser"><span class="face">${c.ic}</span><div><b>${esc(c.name)}</b><small>jagt euch alle</small></div></div>`;
}
function tmLanesHTML(tm,players,me){
  return`<div class="tm-lanes">${players.slice(0,tm.P).map((p,i)=>{
    const L=tm.lane[i];if(!L)return'';
    const cell=100/8,pos=x=>`calc(${x}*(100% - 14px)/8 + ${x}*2px)`;
    return`<div class="tm-lane${L.st==='escaped'?' esc':L.st==='caught'?' cau':''}"><div class="tm-lane-h"><span>${esc(p.name)}${me===i+1?' (du)':''} · ×${L.mult}</span><span>${L.st==='escaped'?'ENTKOMMEN':L.st==='caught'?'GEFANGEN':(TM_CFG.track-L.pl)+' bis zum Ziel · Abstand '+(L.pl-L.chp)}</span></div>
      <div class="tm-track">${Array.from({length:8},(_, k)=>`<div class="tm-cell${k===7?' fin':''}">${k===0?'START':k===7?'':k}</div>`).join('')}
      <span class="tm-mk ch" style="left:${pos(L.chp)}">${TM_CFG.chasers[tm.chaser].ic}</span>
      <span class="tm-mk pl" style="left:${pos(Math.min(7,L.pl))}">${avHTML(p.avatar)}</span></div></div>`;}).join('')}</div>`;
}
function tmBannerHTML(tm,players){
  const fx=tm.fx;if(!fx)return'';
  const nm=i=>esc((players[i]||{}).name||'');
  if(tm.act===1){
    const ok=fx.seats.filter(o=>o.ok),top=fx.seats.find(o=>o.top);
    if(top)return`<div class="tm-banner">EIN WISSENSSIEG!</div>`;
    return ok.length?`<div class="tm-banner">RICHTIG!</div>`:`<div class="tm-banner bad">LEIDER FALSCH</div>`;
  }
  if(tm.act===2){const got=fx.seats.filter(o=>o.seal);return got.length?`<div class="tm-banner">WISSENSSIEGEL!</div>`:`<div class="tm-banner bad">KEIN SIEGEL</div>`;}
  const esc_=fx.seats.findIndex(o=>o.escaped),cau=fx.seats.findIndex(o=>o.caught);
  if(esc_>=0)return`<div class="tm-banner">${nm(esc_).toUpperCase()} IST ENTKOMMEN!</div>`;
  if(cau>=0)return`<div class="tm-banner hot">DER CHASER HAT ${nm(cau).toUpperCase()} ERWISCHT!</div>`;
  return tm.ch&&tm.ch.mv>0?`<div class="tm-banner hot">DER JÄGER RÜCKT NÄHER!</div>`:`<div class="tm-banner">DER JÄGER STOLPERT!</div>`;
}
function tmStageHTML(tm,players,me){
  const fx=tm.phase==='reveal'?tm.fx:null;
  let body='';
  if(tm.act===1)body=tmLadderHTML(tm,players);
  else if(tm.act===2){
    if(tm.phase==='pick')body=`<div class="tm-sub">Jeder wählt heimlich eine Welt.</div>`+tmRealmsHTML(tm,0,'show');
    else body=`<div class="tm-qchips">${players.slice(0,tm.P).map((p,i)=>tm.pick[i]!=null?`<span class="tm-chip gold">${esc(p.name)}: ${TM_CATS[tm.pick[i]].ic} ${esc(TM_CATS[tm.pick[i]].short)}</span>`:'').join('')}</div>`;
  }else{
    body=tmChaserHTML(tm)+(tm.phase==='offer'?`<div class="tm-sub">Jeder wählt heimlich sein Angebot.</div>`:tmLanesHTML(tm,players,me));
    if(tm.phase==='ask'||tm.phase==='reveal'){
      const q=tm.q[0]&&tmQ(tm,tm.q[0]);
      if(q)body+=`<div class="tm-card" style="margin-top:.5rem"><div class="tm-qchips"><span class="tm-chip">${TM_CATS[q.c].ic} ${esc(TM_CATS[q.c].short)}</span><span class="tm-chip gold">Frage ${tm.hunt.n+(tm.phase==='reveal'?0:1)}</span></div><div class="tm-q">${esc(q.text)}</div>
        <div class="tm-ans">${q.ans.map((a,k)=>`<div class="tm-a stat${tm.phase==='reveal'?(k===q.cor?' cor':' dim'):''}"><span class="tm-l">${TM_LETTERS[k]}</span>${esc(a)}</div>`).join('')}</div>${tm.phase==='reveal'?`<div class="tm-expl">${esc(q.expl)}</div>`:''}</div>`;
    }
  }
  const banner=fx?tmBannerHTML(tm,players):'';
  return`<div class="tm-stage">${banner}${body}</div>`;
}
function tmQuestionPad(tm,me,players){
  const i=me-1,qq=tm.q[i];if(!qq)return'';
  const q=tmQ(tm,qq),L=tm.life[i],ans=tm.ans[i],locked=ans!=null,rev=tm.phase==='reveal';
  const chips=`<div class="tm-qchips"><span class="tm-chip">${TM_CATS[q.c].ic} ${esc(TM_CATS[q.c].short)}</span>${tm.act===1?`<span class="tm-chip gold">Stufe ${tm.lvl[i]+1} von 5 · ${tmEur(TM_CFG.ladder[tm.lvl[i]])}</span>`:tm.act===2?`<span class="tm-chip gold">Siegel ${tm.round2}/${TM_CFG.sealRounds}</span>`:`<span class="tm-chip gold">Vorsprung ${tm.lane[i].pl-tm.lane[i].chp} · ×${tm.lane[i].mult}</span>`}</div>`;
  const sel=G.tmSel;
  const answers=q.ans.map((a,k)=>{
    const el=tm.elim[i]&&tm.elim[i].indexOf(k)>=0;
    let c='';
    if(rev){c=k===q.cor?' cor':(ans===k?' wrg':' dim');}
    else if(locked&&ans===k)c=' lock sel';
    else if(!locked&&sel===k)c=' sel';
    if(el)c+=' elim';
    const dis=locked||rev;
    return`<button class="tm-a${c}${dis?' stat':''}" ${dis?'':`data-a="tmans" data-i="${k}"`} ${dis?'disabled':''}><span class="tm-l">${TM_LETTERS[k]}</span>${esc(a)}</button>`;
  }).join('');
  let extra='';
  if(!locked&&!rev){
    extra=`<div class="tm-row" style="margin-top:.6rem"><button class="tm-btn big" data-a="tmlock" ${sel<0?'disabled':''}>${sel<0?'WÄHLE EINE ANTWORT':'ANTWORT SPERREN'}</button></div>`;
    if(tm.clue[i])extra=`<div class="tm-clue">📜 ${esc(q.clue)}</div>`+extra;
    const keys=tm.act===1?['cut','council','archive','freeze']:['cut','archive','freeze'];
    extra+=`<div class="tm-lives">${keys.map(k=>{const dis=L[k]<1||(k==='cut'&&tm.elim[i])||(k==='archive'&&tm.clue[i])||(k==='council'&&(tm.council||tm.P<2));return`<button class="tm-life" data-a="tmlife" data-k="${k}" title="${esc(TM_LIFE_INFO[k].t)}" ${dis?'disabled':''}><span>${TM_LIFE_INFO[k].ic}</span><b>${L[k]}</b>${TM_LIFE_INFO[k].n}</button>`;}).join('')}</div>`;
  }else if(locked&&!rev){
    extra=`<div class="tm-wait">${ans>=0?`Deine Antwort <b>${TM_LETTERS[ans]}</b> ist gesperrt.`:'Die Zeit ist abgelaufen.'} <span class="dots">Warte auf die anderen</span></div>`;
  }
  if(tm.council&&tm.council.for===me){
    const c=tm.council;
    if(!c.done)extra+=`<div class="tm-clue">🗳️ Der Rat berät … (${Object.keys(c.votes).length}/${tm.P-1})</div>`;
    else{const mx=Math.max(1,...c.res);extra+=`<div class="tm-clue">🗳️ Der Rat hat entschieden — ${c.sources} Stimmen. <b>Denk dran: Sie dürfen auch schwindeln!</b><div class="tm-bars">${c.res.map((v,k)=>`<div class="tm-bar"><b>${TM_LETTERS[k]}</b><i style="width:${v/mx*70}%"></i><span>${v}</span></div>`).join('')}</div></div>`;}
  }
  let res='';
  if(rev){
    const o=tm.fx&&tm.fx.seats[i];
    const head=!o||o.skip?'':o.ok?`<div class="tm-banner">RICHTIG!</div>`:tm.res[i]==='late'?`<div class="tm-banner bad">ZEIT ABGELAUFEN</div>`:`<div class="tm-banner bad">LEIDER FALSCH</div>`;
    res=head+`<div class="tm-expl">${esc(q.expl)}</div>`;
  }
  return`<div class="tm-card">${chips}${locked||rev?'':'<div class="tm-timer"><b>--</b><i></i></div>'}<div class="tm-q">${esc(q.text)}</div><div class="tm-ans">${answers}</div>${extra}${res}</div>`;
}
function tmCouncilCard(tm,me,players){
  const c=tm.council;
  if(!c||c.done||c.for===me||c.votes[me]!=null)return'';
  const q=tmQ(tm,tm.q[c.for-1]),asker=players[c.for-1]||{name:'?'};
  return`<div class="tm-card tm-council"><div class="tm-title">🗳️ ${esc(asker.name)} fragt den Rat</div><div class="tm-sub">Gib deinen Tipp ab — geheim. Du darfst auch schwindeln …</div><div class="tm-q">${esc(q.text)}</div>
    <div class="tm-ans">${q.ans.map((a,k)=>`<button class="tm-a" data-a="tmvote" data-i="${k}"><span class="tm-l">${TM_LETTERS[k]}</span>${esc(a)}</button>`).join('')}</div></div>`;
}
function tmDecidePad(tm,me){
  const i=me-1;
  if(tm.pendingDecide[i]!==true)return`<div class="tm-card tm-wait">${tm.res[i]==='ok'?'':'Diesmal nichts zu entscheiden. '}<span class="dots">Die anderen entscheiden</span></div>`;
  const nxt=TM_CFG.ladder[tm.lvl[i]];
  return`<div class="tm-card"><div class="tm-title">BANKEN ODER WEITER?</div><div class="tm-timer"><b>--</b><i></i></div>
    <div class="tm-sub">Du hast <b>${tmEur(tm.unb[i])}</b> im Spiel. Gesichert sind ${tmEur(tm.bank[i])}.</div>
    <div class="tm-row"><button class="tm-btn big" data-a="tmbank">BANKEN · ${tmEur(tm.unb[i])} sichern</button><button class="tm-btn big ghost" data-a="tmgo">WEITER · für ${tmEur(nxt)}${tm.lvl[i]===TM_CFG.ladder.length-1?' + Bonus':''}</button></div>
    <div class="tm-sub" style="margin-top:.5rem">Wer weitermacht und falsch antwortet, verliert das ungesicherte Geld.</div></div>`;
}
function tmPickPad(tm,me){
  const i=me-1;
  if(tm.pick[i]!=null)return`<div class="tm-card tm-wait">Du hast <b>${TM_CATS[tm.pick[i]].ic} ${esc(TM_CATS[tm.pick[i]].de)}</b> gewählt. <span class="dots">Warte auf die anderen</span></div>`;
  return`<div class="tm-card"><div class="tm-title">WÄHLE DEINE WELT</div><div class="tm-timer"><b>--</b><i></i></div><div class="tm-sub">Siegel ${tm.round2} von ${TM_CFG.sealRounds}. Eine richtige Antwort bringt das Siegel — verschiedene Welten zählen mehr als gleiche.</div>${tmRealmsHTML(tm,me,'pick')}</div>`;
}
function tmOfferPad(tm,me){
  const i=me-1;
  if(tm.offer[i]!=null)return`<div class="tm-card tm-wait">Dein Angebot: <b>${TM_OFFER_INFO[tm.offer[i]].n}</b>. <span class="dots">Warte auf die anderen</span></div>`;
  const n=tmSealCount(tm,me),bonus=[];
  if(n>=1)bonus.push('1 zusätzliches Archiv');if(n>=2)bonus.push('+1 Feld Vorsprung');if(n>=3)bonus.push('Schutzschild (fängt einen Fang ab)');
  return`<div class="tm-card"><div class="tm-title">DIE JAGD — DEIN ANGEBOT</div><div class="tm-timer"><b>--</b><i></i></div>
    <div class="tm-sub">Sieben Felder bis zum Ziel. ${bonus.length?'Deine Siegel schenken dir: <b>'+bonus.join(', ')+'</b>.':'Ohne Siegel keine Zusatzvorteile.'}</div>
    <div class="tm-offers">${['safe','std','risk'].map(k=>{const o=TM_OFFER_INFO[k];return`<button class="tm-offer ${k}" data-a="tmoffer" data-k="${k}"><h4>${o.n}</h4><span class="big">×${o.m}</span><b>${o.h}</b><small>${o.t}</small></button>`;}).join('')}</div></div>`;
}
function tmPassHTML(tm,players,v){
  const p=players[v.seat-1];
  const what=v.mode==='vote'?'Du gibst einen Tipp für den Rat ab.':v.mode==='ask'?'Die Frage wartet auf dich.':v.mode==='decide'?'Du musst dich entscheiden.':v.mode==='pick'?'Du wählst deine Welt.':'Du wählst dein Angebot.';
  return`<div class="tm-card tm-pass"><div class="tm-sub">Gerät weitergeben an</div><div class="tm-av" style="font-size:2rem">${avHTML(p.avatar)}</div><div class="who">${esc(p.name)}</div><div class="tm-sub">${what} Die anderen schauen bitte weg.</div><button class="tm-btn big" data-a="tmready">ICH BIN ${esc(p.name).toUpperCase()}</button></div>`;
}
function tmPadHTML(tm,players,me){
  if(tm.over)return`<div class="tm-card tm-wait"><div class="tm-title">TABLE MIND ENTSCHIEDEN</div>Die Ergebnisse folgen …</div>`;
  if(!G.isOnline){
    const v=tmLocalViewer(tm);
    if(!v)return tm.phase==='reveal'?'':`<div class="tm-card tm-wait"><span class="dots">Computergegner denken nach</span></div>`;
    if(G.tmReadyKey!==tmLocalKey(tm,v.seat,v.mode))return tmPassHTML(tm,players,v);
    G.tmViewer=v.seat;me=v.seat;
    if(v.mode==='vote')return tmCouncilCard(tm,me,players)||'';
  }
  if(!me)return`<div class="tm-card tm-wait">Du schaust zu.</div>`;
  if(tm.phase==='ask'){
    if(!tmActiveSeat(tm,me))return`<div class="tm-card tm-wait">Du bist ${tm.lane[me-1].st==='escaped'?'<b>entkommen</b>!':'<b>gefangen</b>.'} <span class="dots">Die anderen jagen weiter</span></div>`;
    return(G.isOnline?tmCouncilCard(tm,me,players):'')+tmQuestionPad(tm,me,players);
  }
  if(tm.phase==='reveal')return tmActiveSeat(tm,me)||tm.fx&&tm.fx.seats[me-1]&&!tm.fx.seats[me-1].skip?tmQuestionPad(tm,me,players):'';
  if(tm.phase==='decide')return tmDecidePad(tm,me);
  if(tm.phase==='pick')return tmPickPad(tm,me);
  if(tm.phase==='offer')return tmOfferPad(tm,me);
  return'';
}
function tmIntroHTML(){
  return`<div class="tm-intro" data-a="tmintro"><div class="ic">${TM_CATS.map((c,k)=>`<i style="animation-delay:${.9+k*.18}s">${c.ic}</i>`).join('')}</div><div class="t1">TABLE MIND</div><div class="t2">WISSEN. STRATEGIE. RUHM.</div><div class="hint">TIPPEN ZUM ÜBERSPRINGEN</div></div>`;
}
function rTablemindTable(){
  const tm=tmObj();
  const players=tmPlayers();
  if(!tm)return`<div id="s-table" class="scr on game-tablemind"><div class="tm-main"><div class="tm-card tm-wait">Lade TABLE MIND …</div></div></div>`;
  const me=G.isOnline?tmMySeat():(tmLocalViewer(tm)?G.tmViewer:0);
  const an=gtAnim();
  const pad=tmPadHTML(tm,players,me);
  const showIntro=G.tmIntro===tm.seed&&Date.now()<tm.dl&&tm.moves===0&&tm.act===1&&tm.cycle===1;
  const actTxt=tm.act===1?`Frage ${Math.min(tm.cycle,TM_CFG.cycles1)} von ${TM_CFG.cycles1}`:tm.act===2?`Siegel ${tm.round2} von ${TM_CFG.sealRounds}`:`Jagd · Frage ${(tm.hunt?tm.hunt.n:0)+(tm.phase==='ask'?1:0)}`;
  queueMicrotask(tmPostRender);
  return`<div id="s-table" class="scr on game-tablemind an-${an}">
    <div class="game-bar"><div class="gb-game"><span class="tm-logo">TABLE MIND</span></div><div class="gb-turn">${esc(actTxt)}</div><div class="gb-right">${rulesBtn()}${quitBtn()}${sndBtn()}</div></div>
    <div class="tm-main ${tm.act===3&&tm.phase!=='offer'?'':'split'}">
      <div class="tm-left"><div class="tm-act"><b>AKT ${['','I','II','III'][tm.act]}</b> ${TM_ACT_NAMES[tm.act]}</div>${tmPodsHTML(tm,players,me,tm.phase==='reveal'?tm.fx:null)}${tmStageHTML(tm,players,me)}</div>
      <div class="tm-right">${pad}<div class="tm-foot"><button class="tm-btn ghost" data-a="tmanim">Animation: ${an==='full'?'Voll':an==='light'?'Leicht':'Aus'}</button></div></div>
    </div>
    ${showIntro?tmIntroHTML():''}
  </div>`;
}

/* ───────── effects when the state moves on ───────── */
function tmPostRender(){
  const tm=tmObj();if(!tm||!document.querySelector('.game-tablemind'))return;
  tmLoopStart();
  const key=[tm.seed,tm.act,tm.phase,tm.cycle,tm.round2,tm.hunt?tm.hunt.n:0,''].join('|');
  if(G.tmFxKey===key)return;
  const first=G.tmFxKey==='';G.tmFxKey=key;
  if(first&&G.tmIntro===tm.seed){TMSFX.intro();return;}
  if(tm.phase==='reveal'&&tm.fx){
    const fx=tm.fx,me=tmMySeat()||0;
    if(tm.act===3){
      const mineO=fx.seats[me-1];
      if(fx.seats.some(o=>o.escaped)){TMSFX.escape();fxPulse('gold');}
      else if(fx.seats.some(o=>o.caught)){TMSFX.caught();fxPulse('red');}
      else if(fx.ch&&fx.ch.mv>0)TMSFX.chase();
      else TMSFX.ok();
    }else if(tm.act===2){if(fx.seats.some(o=>o.seal))TMSFX.seal();else TMSFX.bad();}
    else{if(fx.seats.some(o=>o.top)){TMSFX.escape();fxPulse('gold');}else if(fx.seats.some(o=>o.ok))TMSFX.ok();else TMSFX.bad();}
  }else if(tm.phase==='ask'||tm.phase==='pick'||tm.phase==='offer'){TMSFX.open();}
}

/* ───────── the results card ───────── */
function tmChipsHTML(){
  const tm=tmObj();if(!tm||!tm.over)return'';
  const sum=a=>a.reduce((x,y)=>x+y,0),esc_=tm.lane.filter(l=>l.st==='escaped').length;
  const tot=sum(tm.stats.right)+sum(tm.stats.wrong)+sum(tm.stats.late);
  return`<div class="tonight-stats">
    <div class="tonight-stat"><div class="ts-val">${tot}</div><div class="ts-lbl">❓ Fragen gestellt</div></div>
    <div class="tonight-stat"><div class="ts-val">${tot?Math.round(sum(tm.stats.right)/tot*100):0}%</div><div class="ts-lbl">🎯 richtig</div></div>
    <div class="tonight-stat"><div class="ts-val">${esc_}/${tm.P}</div><div class="ts-lbl">🏃 dem Chaser entkommen</div></div>
    <div class="tonight-stat"><div class="ts-val">${sum(tm.stats.lifes)}</div><div class="ts-lbl">🃏 Joker benutzt</div></div>
    <div class="tonight-stat"><div class="ts-val">${fmtPlayTime(Date.now()-G.matchStats.startedAt)}</div><div class="ts-lbl">⏱ Spielzeit</div></div>
  </div>`;
}
function tmResultsHTML(){
  const tm=tmObj();if(!tm||!tm.over)return'';
  const players=tmPlayers(),c=TM_CFG.chasers[tm.chaser];
  const rows=tmStandings(tm).map(r=>{const i=r.s-1,p=players[i]||{name:'?',avatar:null},L=tm.lane[i],n=tm.stats.right[i]+tm.stats.wrong[i]+tm.stats.late[i];
    return`<tr><td>${avChar(p.avatar)} ${esc(p.name)}</td><td>${tmEur(tm.bank[i])}</td><td>${r.seals}</td><td>${L.st==='escaped'?'✅ ×'+L.mult:'❌'}</td><td>${n?Math.round(tm.stats.right[i]/n*100):0}%</td><td><b>${tmEur(r.total)}</b></td></tr>`;}).join('');
  return`<div class="panel ws-res"><div class="panel-lbl">DAS ERGEBNIS · Chaser: ${c.ic} ${esc(c.name)}</div>
    <table><tr><th>Spieler</th><th>Gesichert</th><th>Siegel</th><th>Jagd</th><th>Treffer</th><th>Gesamt</th></tr>${rows}</table></div>`;
}
