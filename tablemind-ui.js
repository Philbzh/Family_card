/* TABLE MIND -- screens, local game, online room and sounds. (Rules: tablemind-engine.js. Questions: tablemind-questions-de.js.)
   Everything on screen is German. The engine decides everything; this file only shows the state and sends the player's actions.
   Local play: one device, passed from hand to hand for the private parts (a pass screen hides the question until the player taps "Ich bin ...").
   Online play: every device shows the shared stage on top and ONLY its own player's controls below; each action is one compare-and-swap write of the
   whole room (oTmMutate), so several players can answer at the same moment without overwriting each other. */
(function(){
  if(typeof document==='undefined')return;
  const css=`
.game-tablemind{--tg:#c9a45c;--tg2:#8f6f2f;--tg3:#f3deaa;--tb:#c9a45c;--tv:#8b5cf6;--tm:#d946a8;--tn:#07140d;color:#f4efe0;position:relative;overflow-x:hidden;}
#s-table.game-tablemind.scr{background:linear-gradient(180deg,rgba(4,18,12,.55),rgba(4,18,12,.9) 62%,#04120c),url(assets/games/tm_studio.jpg) center top/cover no-repeat,radial-gradient(120% 75% at 50% -10%,#1a6840 0%,#0e4028 42%,#062018 78%,#04120c 100%),#04120c;}
.game-tablemind::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.5;background:radial-gradient(1.5px 1.5px at 12% 18%,#fff9 50%,transparent 51%),radial-gradient(1px 1px at 72% 12%,#fff8 50%,transparent 51%),radial-gradient(1.4px 1.4px at 88% 40%,#bfd8ff9a 50%,transparent 51%),radial-gradient(1px 1px at 30% 62%,#fff7 50%,transparent 51%),radial-gradient(60% 40% at 85% 85%,rgba(201,164,92,.22),transparent 70%),radial-gradient(50% 35% at 8% 30%,rgba(201,164,92,.16),transparent 70%);}
.game-tablemind>*{position:relative;z-index:1;}
.game-tablemind .game-bar{background:linear-gradient(180deg,rgba(7,20,13,.92),rgba(7,20,13,.6));border-bottom:1px solid rgba(201,164,92,.35);}
.tm-logo{font:800 .95rem/1 var(--serif,Georgia,serif);letter-spacing:.18em;color:var(--tg);text-shadow:0 0 12px rgba(201,164,92,.4);}
.tm-main{display:flex;flex-direction:column;gap:.55rem;padding:.4rem .7rem 1rem;max-width:62rem;margin:0 auto;width:100%;}
@media(min-width:760px) and (orientation:landscape){.tm-main.split{display:grid;grid-template-columns:1.25fr 1fr;align-items:start;gap:.9rem;}}
.tm-act{display:flex;align-items:center;justify-content:center;gap:.6rem;flex-wrap:wrap;font-size:.68rem;letter-spacing:.2em;text-transform:uppercase;color:#cdbf94;}
.tm-act b{padding:.28rem .95rem;border-radius:999px;font:700 .78rem/1 var(--serif,Georgia,serif);letter-spacing:.18em;color:#1a1300;background:linear-gradient(180deg,#f3deaa,#c9a45c 45%,#8f6f2f);box-shadow:0 0 16px rgba(201,164,92,.35),inset 0 1px 0 #fff8;}
.tm-pods{margin-top:.9rem;display:flex;gap:.45rem;justify-content:center;flex-wrap:wrap;}
.tm-pod{position:relative;display:flex;flex-direction:column;align-items:center;gap:.08rem;min-width:5.8rem;padding:.35rem .6rem .4rem;border-radius:14px;background:linear-gradient(180deg,rgba(22,65,43,.82),rgba(9,25,16,.92));border:1px solid rgba(201,164,92,.28);box-shadow:0 6px 18px -8px #000,inset 0 1px 0 rgba(255,255,255,.08);transition:transform .25s,box-shadow .25s,border-color .25s;}
.tm-pod.me{border-color:var(--tg);box-shadow:0 0 0 1px rgba(201,164,92,.45),0 0 22px 2px rgba(201,164,92,.25),0 6px 18px -8px #000;}
.tm-pod.lead .tm-nm::after{content:" 👑";}
.tm-pod.pulse{animation:tm-pop .7s cubic-bezier(.2,.9,.3,1.3);}
.tm-av{font-size:1.2rem;line-height:1;}.tm-av .av-img{width:1.7rem;height:1.7rem;border-radius:50%;}
.tm-nm{font-size:.72rem;color:#e2d9c4;max-width:6.5rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.tm-money{font:700 1.1rem/1.1 var(--serif,Georgia,serif);color:var(--tg);text-shadow:0 0 14px rgba(201,164,92,.45);font-variant-numeric:tabular-nums;}
.tm-unb{font-size:.62rem;color:#8fd0ff;letter-spacing:.06em;min-height:.8rem;font-variant-numeric:tabular-nums;}
.tm-seals{display:flex;gap:.12rem;}
.tm-seals i{font-style:normal;font-size:.7rem;opacity:.22;filter:grayscale(1);transition:opacity .4s,filter .4s,transform .4s;}
.tm-seals i.on{opacity:1;filter:none;transform:scale(1.15);}
.tm-state{font-size:.6rem;letter-spacing:.08em;color:#a99d78;min-height:.8rem;}
.tm-state.ok{color:#7ff0a8;}.tm-state.bad{color:#ff8e9d;}
.tm-card{border-radius:18px;padding:.8rem .9rem;background:linear-gradient(180deg,rgba(20,59,38,.88),rgba(7,20,13,.95));border:1px solid rgba(201,164,92,.45);box-shadow:0 0 0 3px rgba(7,20,13,.8),0 0 0 4px rgba(201,164,92,.2),0 16px 36px -16px #000,inset 0 0 36px rgba(201,164,92,.1);}
.tm-qchips{display:flex;gap:.4rem;flex-wrap:wrap;justify-content:center;align-items:center;margin-bottom:.45rem;}
.tm-chip{padding:.2rem .7rem;border-radius:999px;font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;background:rgba(201,164,92,.16);border:1px solid rgba(201,164,92,.45);color:#ead08a;}
.tm-chip.gold{background:rgba(201,164,92,.18);border-color:rgba(201,164,92,.55);color:var(--tg3);}
.tm-q{font:600 1.18rem/1.35 var(--serif,Georgia,serif);color:#fbf7ed;text-align:center;margin:.2rem 0 .7rem;text-wrap:balance;}
@media(min-width:760px){.tm-q{font-size:1.4rem;}}
.tm-ans{display:grid;grid-template-columns:1fr 1fr;gap:.5rem;}
.tm-a{min-width:0;overflow-wrap:anywhere;hyphens:auto;}
.tm-a{display:flex;align-items:center;gap:.6rem;text-align:left;min-height:3.1rem;padding:.55rem .75rem;border-radius:14px;border:1px solid rgba(201,164,92,.45);background:linear-gradient(180deg,rgba(29,83,54,.7),rgba(11,32,21,.85));color:#f4efe0;font-weight:600;font-size:1rem;line-height:1.25;font-family:inherit;cursor:pointer;transition:transform .15s,box-shadow .2s,border-color .2s,background .2s,opacity .3s;touch-action:manipulation;}
.tm-a:active{transform:scale(.98);}
.tm-a .tm-l{flex:none;width:1.9rem;height:1.9rem;border-radius:50%;display:flex;align-items:center;justify-content:center;font:800 .95rem/1 var(--serif,Georgia,serif);color:#0f2a1c;background:linear-gradient(180deg,#f3deaa,#c9a45c 60%,#8f6f2f);}
.tm-a.sel{border-color:var(--tg);box-shadow:0 0 0 2px rgba(201,164,92,.55),0 0 22px rgba(201,164,92,.35);background:linear-gradient(180deg,rgba(39,114,75,.85),rgba(18,52,34,.9));}
.tm-a.lock{border-color:var(--tg);cursor:default;}
.tm-a.elim{opacity:.18;text-decoration:line-through;pointer-events:none;transform:scale(.97);}
.tm-a.cor{border-color:#4ade80;background:linear-gradient(180deg,rgba(22,120,70,.9),rgba(8,52,34,.95));box-shadow:0 0 0 2px rgba(74,222,128,.55),0 0 26px rgba(74,222,128,.4);}
.tm-a.wrg{border-color:#f97362;background:linear-gradient(180deg,rgba(120,30,40,.85),rgba(50,10,20,.95));}
.tm-a.dim{opacity:.55;}
.tm-a.stat{cursor:default;}
.tm-btn{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;padding:.7rem 1.2rem;border-radius:14px;border:1px solid var(--tg);font:800 1rem/1 var(--serif,Georgia,serif);letter-spacing:.12em;color:#1a1300;background:linear-gradient(180deg,#f3deaa,#c9a45c 45%,#8f6f2f);box-shadow:0 8px 20px -8px rgba(201,164,92,.6),inset 0 1px 0 #fff8;cursor:pointer;touch-action:manipulation;}
.tm-btn:active{transform:scale(.97);}
.tm-btn.ghost{background:rgba(29,83,54,.55);color:#f3ead2;border-color:rgba(201,164,92,.5);box-shadow:none;font-weight:700;}
.tm-btn.blue{background:linear-gradient(180deg,#f3e2b0,#d8b56a 55%,#9c7a38);border-color:#ead08a;color:#1a1300;}
.tm-btn.big{width:100%;padding:.95rem 1rem;font-size:1.15rem;}
#s-table .tm-host .tm-wiz,#s-table .tm-host.big .tm-wiz,#s-table .tm-host.ask .tm-wiz,#s-table .tm-host:not(.big) .tm-wiz{width:7.2rem!important;height:7.2rem!important;}
.tm-host.ask .tm-say{font-size:1.25rem;line-height:1.3;}
.tm-verd{display:inline-block;margin-right:.3rem;font:800 1.15em/1.2 var(--serif,Georgia,serif);letter-spacing:.04em;}
.tm-verd.ok{color:#8be6a8;}.tm-verd.bad{color:#ff9a8f;}
.tm-host.ask .tm-wq{display:block;font-family:var(--serif,Georgia,serif);}
.tm-host.ask{max-width:none!important;width:100%;justify-content:flex-start!important;}
.tm-host.ask .tm-say{flex:1 1 auto;max-width:none!important;}
@media(min-width:760px) and (orientation:landscape){.tm-host.ask{grid-column:2!important;}}
@media(min-width:760px){#s-table .tm-host .tm-wiz,#s-table .tm-host.big .tm-wiz,#s-table .tm-host.ask .tm-wiz,#s-table .tm-host:not(.big) .tm-wiz{width:8.6rem!important;height:8.6rem!important;}.tm-host.ask .tm-say{font-size:1.6rem;}}
.tm-nextwrap{display:flex;justify-content:flex-end;position:sticky;bottom:.7rem;z-index:6;}.tm-nextwrap .tm-row{justify-content:flex-end!important;margin:0!important;}.tm-nextwrap .tm-wait,.tm-nextwrap .tm-wlist{text-align:right;justify-content:flex-end;}
.tm-hcbox{margin:.5rem auto;max-width:26rem;padding:.55rem .7rem;border:1px solid rgba(201,164,92,.35);border-radius:14px;background:rgba(8,28,18,.45);}
.tm-hct{font:700 .72rem/1 var(--serif,Georgia,serif);letter-spacing:.14em;text-transform:uppercase;color:var(--tg,#c9a45c);text-align:center;margin-bottom:.4rem;}
.tm-hcrow{display:flex;gap:.35rem;align-items:center;justify-content:center;flex-wrap:wrap;margin:.25rem 0;font-size:.8rem;}.tm-hcrow>span{min-width:4.5rem;text-align:right;color:var(--paper2,#d8cfbd);}
.tm-hcrow button{padding:.3rem .75rem;border-radius:999px;border:1px solid rgba(201,164,92,.5);background:rgba(29,83,54,.4);color:inherit;font:inherit;cursor:pointer;}.tm-hcrow button.on{background:linear-gradient(180deg,#f3deaa,#c9a45c);color:#1a2a1d;font-weight:700;}
/* the step row: a thin strip, amount and tiny player dots on ONE line */
.tm-stage .tm-lad{gap:.2rem!important;}
.tm-lad .tm-rung{flex-direction:row!important;justify-content:center!important;align-items:center!important;gap:.25rem!important;padding:.12rem .2rem!important;min-height:0!important;height:1.5rem!important;border-radius:999px!important;border-bottom-width:1px!important;}
.tm-lad .tm-rung b{font-size:.68rem!important;}
.tm-lad .tm-rung .who{min-height:0!important;gap:.05rem!important;}.tm-lad .tm-rung .who .av-img{width:.8rem!important;height:.8rem!important;}
/* (older rules of the step row follow, kept for the narrow layouts) */
.tm-left{margin-top:1.2rem!important;}
@media(min-width:760px) and (orientation:landscape){.tm-left{margin-top:0!important;}}
.tm-stage .tm-lad{margin:.2rem 0 .2rem!important;}
.tm-nextwrap{margin-top:.7rem;margin-bottom:.4rem;}
.tm-main{padding-left:max(1rem,4vw)!important;padding-right:max(1rem,4vw)!important;}
.tm-stage .tm-lad{gap:.25rem!important;}
.tm-lad .tm-rung{padding:.18rem .15rem!important;gap:.1rem!important;font-size:.7rem!important;border-radius:8px!important;min-height:0!important;line-height:1.1!important;}
.tm-lad .tm-rung b{font-size:.72rem!important;letter-spacing:.04em;}
.tm-lad .tm-rung .who{min-height:.9rem!important;}.tm-lad .tm-rung .who .av-img{width:.9rem!important;height:.9rem!important;}
.tm-lad .tm-rung.on{transform:none!important;box-shadow:0 0 8px rgba(233,196,106,.45)!important;}
/* round 2 (review): readable questions, clear right/wrong marks, bigger small print */
#s-table .tm-wq{font-family:Georgia,'Times New Roman',serif!important;font-weight:600;font-size:1.2rem!important;line-height:1.3;text-transform:none!important;letter-spacing:0!important;font-variant:normal!important;}
@media(min-width:760px){#s-table .tm-wq{font-size:1.6rem!important;}}
#s-table .tm-q{font-family:Georgia,'Times New Roman',serif!important;text-transform:none!important;letter-spacing:0!important;font-variant:normal!important;}
#s-table .tm-a{font-size:1.05rem;min-height:3.4rem;overflow-wrap:break-word!important;word-break:normal!important;hyphens:manual;}
@media(max-width:459px){#s-table .tm-a{font-size:.95rem;padding:.5rem .55rem;gap:.45rem;}#s-table .tm-a .tm-l{width:1.6rem;height:1.6rem;font-size:.85rem;}}
#s-table .tm-a.cor::after{content:'✓';margin-left:auto;font-weight:800;font-size:1.2em;color:#9af0b4;}
#s-table .tm-a.wrg::after{content:'✗';margin-left:auto;font-weight:800;font-size:1.2em;color:#ffb0a6;}
#s-table .tm-a.dim{opacity:.35;}
#s-table .tm-state,#s-table .tm-pod .tm-state{font-size:.74rem!important;color:#c9bf9c!important;}
.game-tablemind .react-strip .rb{width:2.75rem!important;height:2.75rem!important;}
.tm-fins{display:flex;flex-direction:column;gap:.4rem;margin:.6rem 0;}
.tm-fin{display:grid;grid-template-columns:1.6rem 1fr auto;gap:.1rem .5rem;align-items:center;padding:.5rem .7rem;border-radius:12px;border:1px solid rgba(201,164,92,.3);background:rgba(10,36,24,.55);}
.tm-fin.first{border-color:#e9c46a;background:linear-gradient(180deg,rgba(233,196,106,.2),rgba(10,36,24,.6));}
.tm-fin .rk{font:800 1rem/1 var(--serif,Georgia,serif);color:var(--tg,#c9a45c);text-align:center;}
.tm-fin .nm{font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.tm-fin .tt{font:800 1.05rem/1 var(--serif,Georgia,serif);color:#f3deaa;}
.tm-fin small{grid-column:2/4;font-size:.74rem;color:#c9bf9c;}
.tm-more{margin-top:.5rem;}.tm-more>summary{cursor:pointer;padding:.5rem .2rem;color:#c9bf9c;font-size:.85rem;}
/* the Hunt on phones/portrait: the race first, then Wiz and the question */
@media not all and (min-width:760px) and (orientation:landscape){.tm-main.act3 .tm-pods{order:-4;}.tm-main.act3 .tm-left{order:-3;margin-top:0!important;}.tm-main.act3 .tm-host{order:-2;}.tm-main.act3 .tm-right{order:-1;}}
@media(max-width:559px){.tm-main.act3 .tm-vcol{--rh:1.25rem;}.tm-main.act3 .tm-chaser{display:none;}}
/* round 4 */
@keyframes tmCor{0%{transform:scale(.97);filter:brightness(1)}35%{transform:scale(1.045);filter:brightness(1.45)}100%{transform:scale(1.015);filter:brightness(1.1)}}
#s-table .tm-a.cor{animation:tmCor .75s ease both;}
@keyframes tmFill{from{transform:scaleX(1)}to{transform:scaleX(0)}}
.tm-menu{position:absolute;right:.8rem;top:3.4rem;z-index:40;display:flex;flex-direction:column;gap:.35rem;padding:.6rem;border-radius:14px;border:1px solid rgba(201,164,92,.5);background:rgba(6,26,17,.97);box-shadow:0 14px 30px -10px #000;min-width:13rem;}
.tm-menu>button{padding:.55rem .8rem;border-radius:10px;border:1px solid rgba(201,164,92,.35);background:rgba(29,83,54,.45);color:#f4efe0;font-weight:600;font-size:.9rem;line-height:1.1;font-family:inherit;text-align:left;cursor:pointer;}
.tm-menu .tm-mr{display:flex;align-items:center;gap:.5rem;color:#d8cfbd;font-size:.9rem;}
@media(min-width:1100px){#app>#s-table.game-tablemind{max-width:none;width:100%;margin-right:0;}#s-table.game-tablemind>*{width:100%;max-width:60rem;margin-left:auto;margin-right:auto;}}
.tm-crown{position:fixed;inset:0;z-index:90;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.5rem;text-align:center;background:linear-gradient(180deg,rgba(4,18,12,.35),rgba(4,18,12,.9)),url(assets/games/tm_bg_victory.jpg) center/cover no-repeat,#04120c;animation:crIn .6s ease both;cursor:pointer;}
@keyframes crIn{from{opacity:0}to{opacity:1}}
.cr-orbit{position:relative;width:13rem;height:13rem;display:flex;align-items:center;justify-content:center;}
.cr-ring{position:absolute;inset:0;animation:crSpin 5s cubic-bezier(.2,.7,.2,1) both;}
.cr-ring img{position:absolute;left:50%;top:50%;width:3.6rem;height:3.6rem;margin:-1.8rem 0 0 -1.8rem;transform:rotate(var(--a)) translateY(-5.9rem) rotate(calc(-1*var(--a)));filter:drop-shadow(0 4px 10px rgba(0,0,0,.6));}
@keyframes crSpin{from{transform:rotate(-540deg) scale(.4);opacity:0}25%{opacity:1}to{transform:rotate(0) scale(1)}}
.cr-av{width:7rem;height:7rem;border-radius:50%;border:3px solid #e9c46a;box-shadow:0 0 0 6px rgba(233,196,106,.25),0 0 60px rgba(233,196,106,.6);overflow:hidden;display:flex;align-items:center;justify-content:center;background:#0b2a1b;animation:crPop .8s .3s cubic-bezier(.2,1.4,.3,1) both;}
.cr-av img{width:100%;height:100%;object-fit:cover;}
@keyframes crPop{from{transform:scale(.2);opacity:0}to{transform:scale(1);opacity:1}}
.cr-name{font:800 2rem/1.1 var(--serif,Georgia,serif);color:#f3deaa;text-shadow:0 0 24px rgba(233,196,106,.7);animation:crIn 1s .9s both;}
.cr-sub{font:600 .85rem/1 var(--serif,Georgia,serif);letter-spacing:.3em;text-transform:uppercase;color:#d8cfbd;animation:crIn 1s 1.1s both;}
.cr-total{font:800 2.6rem/1.1 var(--serif,Georgia,serif);color:#fff6d6;font-variant-numeric:tabular-nums;margin-top:.4rem;animation:crIn 1s 1.2s both;}
.cr-wiz{width:7rem;height:7rem;border-radius:50%;border:2px solid #c9a45c;margin-top:.8rem;animation:crPop .8s 1.5s both;}
@media(prefers-reduced-motion:reduce){.cr-ring,.cr-av,.cr-name,.cr-sub,.cr-total,.cr-wiz{animation:none;}}
.tm-btn.next{position:relative;overflow:hidden;}.tm-btn.next .fill{position:absolute;inset:0;background:rgba(40,25,0,.28);transform-origin:left;animation:tmFill linear forwards;pointer-events:none;}.tm-btn.next span{position:relative;}
@keyframes tmChZoom{from{transform:scale(1);opacity:.1}30%{opacity:.6}to{transform:scale(1.22);opacity:.5}}
.tm-titlecard .chbg{position:absolute;inset:0;background-size:cover;background-position:center 20%;animation:tmChZoom 2.6s ease-out both;z-index:-1;}
@media(prefers-reduced-motion:reduce){#s-table .tm-a.cor,.tm-titlecard .chbg{animation:none;}}
.tm-btn.next{width:auto;min-width:9rem;padding:.5rem 1.3rem;font-size:.9rem;border-radius:999px;}
.tm-row:has(.tm-btn.next){justify-content:flex-end;}
.tm-btn[disabled]{opacity:.4;pointer-events:none;}
.tm-row{display:flex;gap:.5rem;flex-wrap:wrap;justify-content:center;}
.tm-lives{display:flex;gap:.35rem;flex-wrap:wrap;justify-content:center;margin-top:.55rem;}
.tm-life{display:flex;flex-direction:column;align-items:center;gap:.1rem;min-width:4.2rem;padding:.38rem .5rem;border-radius:12px;border:1px solid rgba(201,164,92,.55);background:rgba(29,85,56,.35);color:#e6dcff;font-weight:600;font-size:.68rem;line-height:1.15;font-family:inherit;cursor:pointer;touch-action:manipulation;}
.tm-life b{font-size:1.05rem;}
.tm-life[disabled]{opacity:.28;pointer-events:none;filter:grayscale(.6);}
.tm-clue{margin-top:.5rem;padding:.5rem .7rem;border-radius:12px;background:rgba(201,164,92,.18);border:1px dashed rgba(201,164,92,.7);font-size:.92rem;color:#e6dcff;text-align:center;}
.tm-timer{display:flex;align-items:center;gap:.55rem;margin:.1rem 0 .4rem;}
.tm-timer b{min-width:2rem;text-align:right;font:800 1.2rem/1 var(--serif,Georgia,serif);color:#ead08a;font-variant-numeric:tabular-nums;}
.tm-timer i{flex:1;height:.5rem;border-radius:9px;background:rgba(255,255,255,.1);position:relative;overflow:hidden;}
.tm-timer.low b{color:#ff8e9d;}.tm-timer.low i::after{background:linear-gradient(90deg,#b8382c,#ff8e7d);}
.tm-wait{text-align:center;color:#e2d9c4;padding:.5rem .3rem;}
.tm-wait b{color:var(--tg);}
.tm-wait .dots::after{content:"";animation:tm-dots 1.4s steps(4,end) infinite;}
@keyframes tm-dots{0%{content:""}25%{content:"."}50%{content:".."}75%{content:"..."}}
.tm-title{font:800 1.05rem/1.2 var(--serif,Georgia,serif);letter-spacing:.08em;color:var(--tg3);text-align:center;margin-bottom:.3rem;}
.tm-sub{font-size:.85rem;color:#d8cfbd;text-align:center;margin-bottom:.5rem;}
.tm-lad{display:flex;flex-direction:column-reverse;gap:.22rem;max-width:20rem;margin:0 auto;width:100%;}
.tm-rung{display:flex;align-items:center;gap:.5rem;padding:.22rem .6rem;border-radius:9px;background:rgba(15,44,29,.7);border:1px solid rgba(201,164,92,.25);font:700 .88rem/1 var(--serif,Georgia,serif);color:#cdbf94;font-variant-numeric:tabular-nums;}
.tm-rung .amt{flex:1;}.tm-rung .who{display:flex;gap:.15rem;min-height:1.1rem;}
.tm-rung.top{border-color:rgba(201,164,92,.6);color:var(--tg);}
.tm-rung.on{background:linear-gradient(90deg,rgba(201,164,92,.28),rgba(15,44,29,.7));color:var(--tg3);border-color:var(--tg);}
.tm-realms{display:grid;grid-template-columns:repeat(3,1fr);gap:.45rem;}
.tm-realm{position:relative;display:flex;flex-direction:column;align-items:center;gap:.15rem;padding:.55rem .3rem;border-radius:14px;border:1px solid color-mix(in srgb,var(--c) 70%,#000);background:linear-gradient(180deg,color-mix(in srgb,var(--c) 28%,#0b2116),rgba(7,20,13,.95));color:#f4efe0;font-weight:700;font-size:.72rem;line-height:1.15;font-family:inherit;text-align:center;cursor:pointer;touch-action:manipulation;transition:transform .2s,box-shadow .2s;}
.tm-realm .ic{font-size:1.7rem;line-height:1;}
.tm-realm.got::after{content:"✓";position:absolute;top:.2rem;right:.35rem;color:var(--tg);font-size:.8rem;}
.tm-realm.sel{box-shadow:0 0 0 2px var(--tg),0 0 24px color-mix(in srgb,var(--c) 70%,transparent);transform:translateY(-2px);}
.tm-realm.stat{cursor:default;}
.tm-offers{display:grid;grid-template-columns:1fr;gap:.5rem;}
@media(min-width:560px){.tm-offers{grid-template-columns:repeat(3,1fr);}}
.tm-offer{display:flex;flex-direction:column;align-items:center;gap:.25rem;padding:.8rem .6rem;border-radius:16px;border:1px solid rgba(201,164,92,.5);background:linear-gradient(180deg,rgba(29,83,54,.7),rgba(9,26,17,.92));color:#f4efe0;cursor:pointer;touch-action:manipulation;transition:transform .2s,box-shadow .2s;}
.tm-offer h4{margin:0;font:800 1.05rem/1 var(--serif,Georgia,serif);letter-spacing:.14em;color:var(--tg);}
.tm-offer .big{font:800 1.5rem/1 var(--serif,Georgia,serif);}
.tm-offer small{color:#d8cfbd;text-align:center;}
.tm-offer.risk{border-color:rgba(217,70,168,.7);}.tm-offer.risk h4{color:#ff8fd6;}
.tm-offer.safe{border-color:rgba(74,222,128,.6);}.tm-offer.safe h4{color:#7ff0a8;}
.tm-offer.sel{box-shadow:0 0 0 2px var(--tg),0 0 26px rgba(201,164,92,.35);transform:translateY(-2px);}
.tm-chaser{display:flex;align-items:center;gap:.6rem;justify-content:center;padding:.3rem .8rem;}
.tm-chaser .face{display:block;line-height:0;filter:drop-shadow(0 0 12px rgba(217,70,168,.55));animation:tm-breathe 3.2s ease-in-out infinite;}
.tm-chaser b{display:block;font:800 1rem/1.1 var(--serif,Georgia,serif);color:#ff8fd6;letter-spacing:.1em;}
.tm-chaser small{color:#d8cfbd;font-size:.72rem;}
@keyframes tm-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
.tm-lanes{display:flex;flex-direction:column;gap:.45rem;}
.tm-lane{position:relative;padding:.3rem .4rem .35rem;border-radius:12px;background:rgba(11,32,21,.7);border:1px solid rgba(201,164,92,.25);}
.tm-lane.esc{border-color:#4ade80;box-shadow:0 0 18px rgba(74,222,128,.3);}.tm-lane.cau{border-color:#f97362;opacity:.8;}
.tm-lane-h{display:flex;justify-content:space-between;font-size:.66rem;letter-spacing:.08em;color:#cdbf94;margin-bottom:.15rem;}
.tm-track{position:relative;height:2.2rem;display:grid;grid-template-columns:repeat(8,1fr);gap:2px;}
.tm-cell{border-radius:5px;background:rgba(255,255,255,.07);display:flex;align-items:center;justify-content:center;font-size:.6rem;color:#8a7f5e;}
.tm-cell.fin{background:repeating-conic-gradient(#fff 0 25%,#111 0 50%) 0 0/8px 8px;color:transparent;}
.tm-mk{position:absolute;top:50%;width:calc((100% - 14px)/8);display:flex;align-items:center;justify-content:center;font-size:1.4rem;line-height:1;transform:translateY(-50%);transition:left .9s cubic-bezier(.3,.8,.3,1);z-index:2;}
.tm-mk.pl .av-img{width:1.7rem;height:1.7rem;border-radius:50%;box-shadow:0 0 0 2px var(--tg);}
.tm-mk.ch{filter:drop-shadow(0 0 8px rgba(217,70,168,.8));z-index:3;}
.tm-banner{text-align:center;font:800 1.5rem/1.15 var(--serif,Georgia,serif);letter-spacing:.1em;color:var(--tg);text-shadow:0 0 18px rgba(201,164,92,.6);animation:tm-banner .9s cubic-bezier(.2,.9,.3,1.2) both;}
.tm-banner.bad{color:#ff8e9d;text-shadow:0 0 18px rgba(249,115,98,.6);}.tm-banner.hot{color:#ff8fd6;text-shadow:0 0 18px rgba(217,70,168,.6);}
.tm-res{display:flex;gap:.4rem;flex-wrap:wrap;justify-content:center;}
.tm-resc{padding:.25rem .65rem;border-radius:999px;font-size:.78rem;background:rgba(255,255,255,.08);}
.tm-resc.ok{background:rgba(74,222,128,.18);color:#9bf5bf;}.tm-resc.bad{background:rgba(249,115,98,.18);color:#ffb0a4;}
.tm-expl{margin-top:.5rem;padding:.55rem .7rem;border-radius:12px;background:rgba(201,164,92,.12);color:#e8dfc6;font-size:.92rem;text-align:center;}
.tm-pass{text-align:center;padding:1.4rem .8rem;}
.tm-pass .who{font:800 1.5rem/1.2 var(--serif,Georgia,serif);color:var(--tg);margin:.4rem 0 1rem;}
.tm-council{margin-bottom:.6rem;border-color:rgba(201,164,92,.8);}
.tm-bars{display:grid;gap:.3rem;margin-top:.4rem;}
.tm-bar{display:flex;align-items:center;gap:.5rem;font-size:.85rem;}
.tm-bar i{display:block;height:.9rem;border-radius:6px;background:linear-gradient(90deg,#8b5cf6,#d946a8);min-width:.2rem;transition:width .9s cubic-bezier(.2,.8,.2,1);}
.tm-intro{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.9rem;background:radial-gradient(120% 80% at 50% 20%,#1d5538,#04060f 70%);cursor:pointer;animation:tm-fade .5s both;}
.tm-intro .t1{font:800 clamp(2rem,9vw,4.2rem)/1 var(--serif,Georgia,serif);letter-spacing:.2em;color:transparent;background:linear-gradient(100deg,#8a6a22 20%,#f3deaa 45%,#c9a45c 55%,#8a6a22 80%) 0 0/250% 100%;-webkit-background-clip:text;background-clip:text;animation:tm-shine 2.6s ease-out both;}
.tm-intro .t2{font-size:clamp(.8rem,3vw,1.2rem);letter-spacing:.4em;color:#cdbf94;animation:tm-fade 1.2s .6s both;}
.tm-intro .ic{display:flex;gap:.7rem;font-size:clamp(1.4rem,6vw,2.4rem);}
.tm-intro .ic i{font-style:normal;opacity:0;animation:tm-pop .6s both;}
.tm-intro .hint{font-size:.7rem;color:#8a7f5e;letter-spacing:.2em;animation:tm-fade 1s 1.6s both;}
.tm-pod .tm-delta{position:absolute;top:-.55rem;right:-.2rem;padding:.1rem .45rem;border-radius:999px;font-weight:700;font-size:.68rem;line-height:1;font-family:inherit;background:#1d6b43;color:#d7ffe8;animation:tm-float 1.8s ease-out both;}
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
@media(max-width:759px){.tm-pod{min-width:4.6rem;padding:.25rem .4rem .3rem;}.tm-pods{gap:.3rem;}.tm-money{font-size:.95rem;}.tm-seals i{font-size:.58rem;}.tm-unb{display:none;}.tm-stage .tm-lad{display:none;}.tm-q{font-size:1.05rem;margin:.1rem 0 .5rem;}.tm-a{min-height:2.7rem;padding:.4rem .6rem;}.tm-pass .tm-av{display:flex;justify-content:center;}}
.tm-host{grid-column:1/-1;display:flex;align-items:center;gap:.7rem;justify-content:center;margin:.1rem auto .25rem;max-width:34rem;}
.tm-wiz{flex:none;width:4.4rem;height:4.4rem;border-radius:50%;object-fit:cover;border:2px solid #c9a45c;box-shadow:0 0 22px rgba(201,164,92,.55),0 4px 12px rgba(0,0,0,.6);background:#0b2115;}
.tm-wiz.hop{animation:tm-hop .6s cubic-bezier(.3,1.6,.5,1) 1;}
.tm-say{position:relative;flex:1;padding:.55rem .8rem;border-radius:14px;background:linear-gradient(180deg,rgba(30,87,57,.92),rgba(11,32,21,.95));border:1px solid rgba(201,164,92,.55);font:600 .92rem/1.3 var(--serif,Georgia,serif);color:#fbf7ed;box-shadow:0 8px 20px -10px #000;}
.tm-say::before{content:"";position:absolute;left:-.42rem;top:1.3rem;width:.8rem;height:.8rem;background:#1b4d33;border-left:1px solid rgba(201,164,92,.55);border-bottom:1px solid rgba(201,164,92,.55);transform:rotate(45deg);}
.tm-say small{display:block;font-weight:700;font-size:.6rem;line-height:1;font-family:inherit;letter-spacing:.2em;color:var(--tg);margin-bottom:.2rem;}
@keyframes tm-hop{0%{transform:translateY(0)}40%{transform:translateY(-.7rem) scale(1.06)}100%{transform:none}}
@media(min-width:760px){.tm-wiz{width:5.6rem;height:5.6rem;}.tm-say{font-size:1.05rem;}}
.tm-intro .wiz{width:min(40vw,11rem);height:min(40vw,11rem);border-radius:50%;object-fit:cover;border:3px solid #c9a45c;box-shadow:0 0 40px rgba(201,164,92,.6);animation:tm-pop .8s .3s both;}
.game-tablemind.an-off .tm-wiz.hop,.game-tablemind.an-light .tm-wiz.hop{animation:none;}
#s-table.game-tablemind.scr::after{content:"";position:fixed;left:0;right:0;top:0;height:60vh;pointer-events:none;z-index:0;opacity:.45;-webkit-mask-image:linear-gradient(180deg,#000 10%,transparent 95%);mask-image:linear-gradient(180deg,#000 10%,transparent 95%);background:conic-gradient(from 200deg at 50% -8%,transparent 0deg,rgba(120,170,255,.22) 14deg,transparent 28deg,rgba(201,164,92,.2) 40deg,transparent 54deg,rgba(201,164,92,.2) 66deg,transparent 80deg,rgba(201,164,92,.22) 94deg,transparent 108deg);animation:tm-sweep 9s ease-in-out infinite alternate;}
@keyframes tm-sweep{from{transform:translateX(-3%) scale(1)}to{transform:translateX(3%) scale(1.05)}}
.game-tablemind.an-off.scr::after,.game-tablemind.an-light.scr::after{animation:none;}
.tm-pod{background:linear-gradient(180deg,rgba(31,91,60,.9),rgba(9,26,17,.95) 70%);border-bottom:4px solid rgba(201,164,92,.55);}
.tm-pod.me{border-bottom-color:var(--tg);}
.tm-pod::after{content:"";position:absolute;left:12%;right:12%;bottom:-.7rem;height:.5rem;border-radius:50%;background:radial-gradient(closest-side,rgba(201,164,92,.45),transparent);}
.tm-titlecard{position:fixed;inset:0;z-index:70;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.6rem;background:radial-gradient(100% 70% at 50% 40%,rgba(29,85,56,.96),rgba(3,5,15,.98));animation:tm-card 2.6s both;pointer-events:none;}
.tm-titlecard .a{font:700 .8rem/1 var(--serif,Georgia,serif);letter-spacing:.5em;color:#cdbf94;}
.tm-titlecard .n{font:800 clamp(1.8rem,8vw,3.6rem)/1.1 var(--serif,Georgia,serif);letter-spacing:.14em;color:var(--tg);text-shadow:0 0 30px rgba(201,164,92,.6);text-align:center;padding:0 1rem;}
.tm-titlecard .s{color:#e2d9c4;font-size:clamp(.9rem,3.5vw,1.2rem);text-align:center;max-width:26rem;padding:0 1rem;}
.tm-titlecard img{width:5rem;height:5rem;border-radius:50%;border:2px solid var(--tg);box-shadow:0 0 30px rgba(201,164,92,.5);}
@keyframes tm-card{0%{opacity:0;transform:scale(1.08)}14%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}
@media(min-width:900px){.tm-pods{flex-wrap:nowrap;}.tm-pod{flex:1 1 0;max-width:9.5rem;}.tm-main{max-width:74rem;padding-top:1rem;gap:.8rem;}.tm-host{margin-bottom:.6rem;}.tm-wiz{width:6.4rem;height:6.4rem;}.tm-say{font-size:1.15rem;padding:.8rem 1rem;}.tm-pod{min-width:0;padding:.55rem .5rem .6rem;}.tm-av .av-img{width:2.6rem;height:2.6rem;}.tm-money{font-size:1.4rem;}.tm-seals i{font-size:.95rem;}.tm-q{font-size:1.6rem;}.tm-a{font-size:1.1rem;min-height:3.4rem;}.tm-rung{padding:.4rem .8rem;font-size:1.02rem;}.tm-lad{max-width:26rem;}.tm-rung .who .av-img{width:1.5rem;height:1.5rem;border-radius:50%;}}
@media(min-width:1500px){.tm-main{max-width:96rem;}.tm-q{font-size:2rem;}.tm-a{font-size:1.25rem;min-height:3.8rem;}.tm-wiz{width:8rem;height:8rem;}.tm-say{font-size:1.35rem;}}
@media not all and (min-width:760px) and (orientation:landscape){.tm-pods{order:-3;}.tm-host{order:-2;}.tm-right{order:-1;}}
@media(min-width:0px){.tm-main{padding:.6rem max(.9rem,3.5vw) 1.4rem!important;gap:.9rem;}.tm-left,.tm-right{display:flex;flex-direction:column;gap:.8rem;min-width:0;}.tm-pods{margin:.9rem 0 1rem;}.tm-lad{max-width:30rem;gap:.3rem;padding:0 .2rem;}.tm-rung{padding:.5rem .9rem;border-left:3px solid rgba(201,164,92,.5);}.tm-rung.on{border-left-color:#ead08a;}.tm-pass{padding:1.6rem 1rem;}.tm-pass .tm-av{display:flex;justify-content:center;font-size:1rem;}.tm-pass .tm-av .av-img{width:4rem;height:4rem;border:2px solid #c9a45c;}.tm-foot{margin-top:.2rem;}.tm-card{margin:0;}}
/* compact score strip: one slim line per player, right under Wiz */
.tm-pods{grid-column:1/-1;margin:.1rem 0 .2rem!important;gap:.4rem!important;flex-wrap:wrap!important;}
.tm-pod{display:grid!important;grid-template-columns:auto 1fr auto;grid-template-areas:"av nm money" "av st money" "se se se";column-gap:.5rem;row-gap:0;align-items:center;text-align:left;flex:1 1 9.5rem!important;max-width:14rem!important;min-width:0!important;padding:.3rem .65rem!important;border-bottom-width:3px!important;}
.tm-pod::after{display:none!important;}
.tm-pod .tm-av{grid-area:av;}.tm-pod .tm-av .av-img{width:2rem!important;height:2rem!important;}
.tm-pod .tm-nm{grid-area:nm;max-width:none;font-size:.78rem;}
.tm-pod .tm-state{grid-area:st;min-height:0;font-size:.62rem;}
.tm-pod .tm-money{grid-area:money;font-size:1.05rem!important;}
.tm-pod .tm-unb{display:none!important;}
.tm-pod .tm-seals{grid-area:se;margin-top:.1rem;}.tm-pod .tm-seals i{font-size:.78rem!important;}
.tm-pod .tm-delta{top:-.7rem;}
.tm-main{padding-top:.4rem!important;}
/* ===== lean pass: bar title, small Wiz, ring timer, slim lifelines ===== */
.tm-bartitle{display:flex!important;flex-direction:column;align-items:center;justify-content:center;line-height:1.15;font-family:var(--serif,Georgia,serif);letter-spacing:.14em;color:var(--tg3);font-size:.7rem;text-transform:uppercase;min-width:0;}
.tm-bartitle b{color:var(--tg);}
.tm-bartitle small{font-weight:500;font-size:.62rem;line-height:1.2;font-family:inherit;letter-spacing:.12em;color:var(--paper3,#8e887d);}
.tm-animbtn{font-size:1.15rem;line-height:1;}
.tm-host{gap:.55rem!important;margin:0!important;}
.tm-host:not(.big) .tm-wiz{width:4.6rem!important;height:4.6rem!important;border-width:2px;}
@media(min-width:760px){.tm-host:not(.big) .tm-wiz{width:5.6rem!important;height:5.6rem!important;}}
.tm-host:not(.big) .tm-say{padding:.55rem .85rem!important;font-size:.95rem!important;line-height:1.3;}
.tm-host:not(.big) .tm-say small{display:block;}
.tm-host.big .tm-wiz{width:7rem!important;height:7rem!important;}
.tm-host .tm-wiz,.tm-host .tm-say{transition:width .3s,height .3s,font-size .3s;}
.tm-card{position:relative;}
.tm-timer{position:absolute!important;top:.55rem;right:.7rem;width:2.7rem;height:2.7rem;margin:0!important;display:flex;align-items:center;justify-content:center;gap:0!important;z-index:2;}
.tm-timer b{position:relative;min-width:0!important;text-align:center!important;font:800 .95rem/1 var(--serif,Georgia,serif)!important;color:var(--tg3)!important;z-index:1;}
.tm-timer i{position:absolute!important;inset:0;height:auto!important;border-radius:50%!important;background:conic-gradient(#ead08a var(--w,100%),rgba(255,255,255,.12) 0)!important;-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 5px),#000 calc(100% - 4px));mask:radial-gradient(farthest-side,transparent calc(100% - 5px),#000 calc(100% - 4px));overflow:visible!important;}
.tm-timer i::after{display:none!important;}
.tm-timer.low b{color:#ff9d8a!important;}.tm-timer.low i{background:conic-gradient(#ff7a68 var(--w,100%),rgba(255,255,255,.12) 0)!important;}
.tm-qchips{justify-content:flex-start!important;padding-right:3.4rem;margin-bottom:.6rem!important;}
.tm-lives{gap:.3rem!important;margin-top:.7rem!important;}
.tm-life{min-width:0!important;flex:1 1 0;padding:.35rem .2rem!important;font-size:.62rem!important;border-radius:11px!important;}
.tm-life b{font-size:.9rem!important;}
.tm-q{margin:.1rem 0 .8rem!important;}
.tm-title{padding-right:3.2rem;}
/* horizontal prize ladder */
.tm-lad{display:grid!important;grid-template-columns:repeat(5,1fr);gap:.35rem!important;max-width:none!important;padding:0!important;flex-direction:row!important;}
.tm-rung{flex-direction:column!important;align-items:center;gap:.2rem!important;padding:.4rem .2rem!important;border-left:0!important;border-bottom:3px solid rgba(201,164,92,.4);font-size:.85rem!important;text-align:center;}
.tm-rung.on{border-bottom-color:#ead08a;}
.tm-rung.on{background:linear-gradient(180deg,#f3deaa,#c9a45c 70%,#9a7a35)!important;color:#1a2a1d!important;border-color:#ffe9a8!important;box-shadow:0 0 16px rgba(233,196,106,.55);transform:translateY(-2px);}
.tm-title small{font-size:.6em;opacity:.7;letter-spacing:.1em;margin-left:.4rem;}
.tm-rung .who{min-height:1.3rem;justify-content:center;}.tm-rung .who .av-img{width:1.3rem!important;height:1.3rem!important;border-radius:50%;}
.tm-stage .tm-lad{display:grid!important;}
.tm-actline{grid-column:1/-1;display:none;text-align:center;font:600 .62rem/1 var(--serif,Georgia,serif);letter-spacing:.16em;text-transform:uppercase;color:var(--paper3,#8e887d);margin-bottom:-.2rem;}
.tm-actline b{color:var(--tg);}
@media(max-width:559px){.tm-bartitle{display:none!important;}.tm-actline{display:block;order:-4;}}
@media(max-width:559px){.tm-pods{flex-wrap:nowrap!important;gap:.3rem!important;}.tm-pod{flex:1 1 0!important;max-width:none!important;grid-template-columns:auto 1fr!important;grid-template-areas:"av money" "nm nm" "se se"!important;padding:.3rem .4rem!important;text-align:left;}.tm-pod .tm-state{display:none!important;}.tm-pod .tm-money{font-size:.8rem!important;text-align:right;white-space:nowrap;letter-spacing:-.01em;}.tm-pod .tm-av .av-img{width:1.7rem!important;height:1.7rem!important;}.tm-pod .tm-nm{font-size:.68rem;}}
/* ===== The Hunt: tall ladders, TV-style ===== */
.tm-vcols{display:grid;grid-template-columns:repeat(var(--cols,2),1fr);gap:.5rem;}
.tm-vcol{--rh:1.75rem;border-radius:14px;padding:.4rem .35rem .5rem;background:linear-gradient(180deg,rgba(14,50,36,.8),rgba(5,22,15,.92));border:1px solid rgba(201,164,92,.28);min-width:0;}
.tm-vcol.me{border-color:#ead08a;box-shadow:0 0 0 1px rgba(201,164,92,.4),0 0 22px rgba(201,164,92,.2);}
.tm-vcol.cau{opacity:.65;filter:saturate(.6);}.tm-vcol.esc{border-color:#4ade80;box-shadow:0 0 20px rgba(74,222,128,.3);}
.tm-vh{display:flex;flex-direction:column;align-items:center;gap:.05rem;margin-bottom:.35rem;min-width:0;}
.tm-vh .a .av-img{width:1.7rem;height:1.7rem;border-radius:50%;}
.tm-vh b{font-size:.7rem;color:#f3ead2;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.tm-vh small{font-size:.56rem;letter-spacing:.06em;color:var(--paper3,#8e887d);text-transform:uppercase;}
.tm-vl{position:relative;display:flex;flex-direction:column;gap:3px;}
.tm-vr{height:calc(var(--rh) - 3px);border-radius:7px;display:flex;align-items:center;justify-content:center;font:700 .62rem/1 var(--serif,Georgia,serif);letter-spacing:.1em;color:#8a7f5e;background:linear-gradient(180deg,#143b2b,#0a2418);border:1px solid rgba(201,164,92,.22);}
.tm-vr.fin{background:linear-gradient(180deg,#f3deaa,#c9a45c 60%,#8f6f2f);color:#1a1300;border-color:#ead08a;}
.tm-vr.st{color:#6e6648;}
.tm-vmk{position:absolute;left:0;right:0;height:calc(var(--rh) - 3px);top:calc((var(--n) - 1 - var(--pos)) * var(--rh));transition:top .95s cubic-bezier(.3,.8,.3,1);display:flex;align-items:center;justify-content:center;gap:.25rem;border-radius:7px;font:800 .8rem/1 var(--serif,Georgia,serif);color:#1a1300;z-index:2;}
.tm-vmk.pl{background:linear-gradient(180deg,#fff1c2,#e9c46a 55%,#b8892f);box-shadow:0 0 14px rgba(255,236,160,.6);}
.tm-vmk.pl .a .av-img{width:1.25rem;height:1.25rem;border-radius:50%;display:block;}
.tm-vmk.ch{background:linear-gradient(180deg,#7a1f2c,#3d0c16);box-shadow:0 0 16px rgba(255,70,80,.55);border:1px solid #ff6b6b;z-index:3;color:#ffd0d0;}
.tm-vmk.ch .tm-chsvg{height:1.3rem;width:auto;}
.tm-vmk.half{width:50%;}.tm-vmk.half.r{left:auto;right:0;}.tm-vmk.half.l{right:auto;left:0;}
.tm-vmk.half.pl{font-size:.6rem;}.tm-vmk.half.pl .a{display:none;}
.game-tablemind.an-off .tm-vmk,.game-tablemind.an-light .tm-vmk{transition-duration:.2s;}
@media(min-width:900px){.tm-vcol{--rh:2.1rem;padding:.6rem .6rem .7rem;}.tm-vr{font-size:.72rem;}.tm-vh b{font-size:.85rem;}.tm-vh .a .av-img{width:2.2rem;height:2.2rem;}.tm-vmk{font-size:1rem;}.tm-vmk.pl .a .av-img{width:1.6rem;height:1.6rem;}.tm-vmk.ch .tm-chsvg{height:1.7rem;}}
/* waiting chips, lunge, shake, results podium */
.tm-wlist{display:flex;flex-wrap:wrap;gap:.35rem;justify-content:center;margin-top:.55rem;}
.tm-wchip{display:inline-flex;align-items:center;gap:.3rem;padding:.2rem .6rem .2rem .25rem;border-radius:999px;font-size:.72rem;background:rgba(255,255,255,.07);color:#d8cfbd;}
.tm-wchip .a .av-img{width:1.2rem;height:1.2rem;border-radius:50%;display:block;}
.tm-wchip.ok{background:rgba(74,222,128,.16);color:#a8f0c4;}
.tm-vmk.lunge{animation:tm-lunge .9s ease-out 1;}
@keyframes tm-lunge{0%{filter:brightness(1)}30%{filter:brightness(2.2);transform:scale(1.08)}100%{filter:none;transform:none}}
.tm-vcol.hit{animation:tm-shake .7s ease-in-out 1;}
@keyframes tm-shake{0%,100%{transform:none}15%{transform:translateX(-6px) rotate(-1deg)}30%{transform:translateX(6px) rotate(1deg)}45%{transform:translateX(-5px)}60%{transform:translateX(4px)}80%{transform:translateX(-2px)}}
.game-tablemind.an-off .tm-vcol.hit,.game-tablemind.an-light .tm-vcol.hit,.game-tablemind.an-off .tm-vmk.lunge,.game-tablemind.an-light .tm-vmk.lunge{animation:none;}
.tm-podium{display:flex;flex-direction:column;align-items:center;gap:.6rem;margin-bottom:.8rem;}
.tm-podium img{width:7rem;height:7rem;border-radius:50%;object-fit:cover;border:3px solid #ead08a;box-shadow:0 0 34px rgba(201,164,92,.6);}
.tm-podium .t{font:800 1.15rem/1.2 var(--serif,Georgia,serif);letter-spacing:.08em;color:#ead08a;text-align:center;}
.tm-pbars{display:flex;align-items:flex-end;justify-content:center;gap:.5rem;width:100%;max-width:26rem;}
.tm-pb{flex:1;display:flex;flex-direction:column;align-items:center;gap:.15rem;}
.tm-pb .bar{width:100%;border-radius:10px 10px 0 0;background:linear-gradient(180deg,#f3deaa,#c9a45c 60%,#8f6f2f);display:flex;align-items:flex-start;justify-content:center;padding-top:.3rem;font:800 1rem/1 var(--serif,Georgia,serif);color:#1a1300;}
.tm-pb.p2 .bar{background:linear-gradient(180deg,#e6e6e6,#b4b4b4 60%,#7d7d7d);}.tm-pb.p3 .bar{background:linear-gradient(180deg,#e8b98a,#b87a44 60%,#7a4a22);}
.tm-pb small{font-size:.7rem;color:#d8cfbd;}.tm-pb b{font-size:.78rem;color:#fbf7ed;}
.tm-flag{display:block;margin:.5rem auto 0;padding:.25rem .8rem;border-radius:999px;border:1px solid rgba(201,164,92,.35);background:transparent;color:#a99d78;font-weight:600;font-size:.68rem;line-height:1;font-family:inherit;letter-spacing:.06em;cursor:pointer;}
.tm-learn{margin-top:.8rem;text-align:left;font-size:.82rem;color:var(--paper2,#d8cfbd);}.tm-learn summary{cursor:pointer;color:#ead08a;font-weight:700;letter-spacing:.04em;}.tm-learn ol{margin:.5rem 0 0;padding-left:1.2rem;display:grid;gap:.45rem;}.tm-learn li b{color:#fbf7ed;font-weight:600;}
/* text size and contrast */
.tm-aa{font:800 .85rem/1 var(--serif,Georgia,serif);color:var(--tg);}
.game-tablemind.tx-l .tm-q{font-size:1.45rem!important;}.game-tablemind.tx-l .tm-a{font-size:1.15rem!important;min-height:3.4rem!important;}.game-tablemind.tx-l .tm-say{font-size:1.05rem!important;}.game-tablemind.tx-l .tm-expl,.game-tablemind.tx-l .tm-sub{font-size:1.05rem;}
.game-tablemind.tx-xl .tm-q{font-size:1.8rem!important;line-height:1.3;}.game-tablemind.tx-xl .tm-a{font-size:1.4rem!important;min-height:4rem!important;}.game-tablemind.tx-xl .tm-say{font-size:1.2rem!important;}.game-tablemind.tx-xl .tm-expl,.game-tablemind.tx-xl .tm-sub{font-size:1.2rem;}.game-tablemind.tx-xl .tm-btn{font-size:1.25rem;}
.game-tablemind.tx-hc{color:#fff;}.game-tablemind.tx-hc .tm-q,.game-tablemind.tx-hc .tm-say{color:#fff!important;}.game-tablemind.tx-hc .tm-q{font-size:1.5rem!important;}.game-tablemind.tx-hc .tm-a{font-size:1.2rem!important;min-height:3.5rem!important;background:#04140d!important;border:2px solid #ead08a!important;color:#fff!important;}.game-tablemind.tx-hc .tm-a.cor{background:#0b6b3a!important;border-color:#7dffb0!important;}.game-tablemind.tx-hc .tm-a.wrg{background:#7a1020!important;border-color:#ff9aa6!important;}.game-tablemind.tx-hc .tm-card{background:#030d09!important;border:2px solid #ead08a!important;}.game-tablemind.tx-hc .tm-pod{background:#030d09!important;border-color:#ead08a!important;}.game-tablemind.tx-hc .tm-chip,.game-tablemind.tx-hc .tm-wchip{color:#fff;}
.tm-hcap{display:flex;flex-wrap:wrap;gap:.35rem;align-items:center;justify-content:center;margin:0 0 .6rem;font-size:.7rem;color:var(--paper3,#8e887d);}
.tm-hc{padding:.28rem .65rem;border-radius:999px;border:1px solid rgba(201,164,92,.4);background:transparent;color:#d8cfbd;font-weight:600;font-size:.7rem;line-height:1;font-family:inherit;cursor:pointer;touch-action:manipulation;}
.tm-hc.on{background:linear-gradient(180deg,#f3deaa,#c9a45c);color:#1a1300;border-color:#ead08a;}
.tm-realm.used{opacity:.4;filter:grayscale(.7);cursor:not-allowed;}.tm-realm small{font-size:.58rem;letter-spacing:.06em;color:#a99d78;}
/* the "… is thinking" pill must not cover the reaction row (all games with a reaction strip) */
body:has(.react-strip) .peer-think{bottom:calc(9rem + env(safe-area-inset-bottom,0px));}
.tm-emb{display:inline-block;border-radius:50%;object-fit:cover;vertical-align:middle;flex:none;}
.tm-emb.xs{width:1.05rem;height:1.05rem;}.tm-emb.sm{width:1.35rem;height:1.35rem;}.tm-emb.lg{width:3.1rem;height:3.1rem;filter:drop-shadow(0 2px 6px rgba(0,0,0,.5));}.tm-emb.intro{width:clamp(2.6rem,11vw,4.2rem);height:clamp(2.6rem,11vw,4.2rem);}
.tm-seals i .tm-emb{width:.95rem;height:.95rem;}
.tm-realm .ic{display:flex;justify-content:center;}
.tm-realm:not(.stat):not(.used):hover .tm-emb{transform:scale(1.08);transition:transform .2s;}
.tm-ico{display:inline-block;object-fit:cover;vertical-align:middle;flex:none;}
.tm-ico.life{width:2.1rem;height:2.1rem;border-radius:.4rem;}.tm-ico.inl{width:1.15rem;height:1.15rem;border-radius:50%;vertical-align:-.2em;}.tm-ico.inl.big{width:1.9rem;height:1.9rem;vertical-align:-.45em;}.tm-ico.gate{width:1.4rem;height:1.4rem;border-radius:4px;margin-right:.25rem;vertical-align:middle;}
.tm-life[disabled] .tm-ico{filter:grayscale(.8) brightness(.7);}
.tm-chimg{display:block;width:4.8rem;height:4.8rem;border-radius:18px;object-fit:cover;object-position:50% 20%;border:2px solid #c9a45c;box-shadow:0 0 26px rgba(255,120,90,.35),0 6px 14px rgba(0,0,0,.6);animation:tm-breathe 3.2s ease-in-out infinite;}
.tm-chm{width:100%;height:100%;max-width:1.5rem;max-height:1.5rem;border-radius:50%;object-fit:cover;object-position:50% 20%;border:1px solid #ff9a8a;}
.tm-chaser{background:linear-gradient(90deg,rgba(0,0,0,.78),rgba(0,0,0,.35)),url(assets/games/tm_ch_loom.jpg) right center/cover no-repeat;border-radius:16px;border:1px solid rgba(255,120,90,.35);padding:.5rem 1rem!important;}
@media(min-width:900px){.tm-emb.lg{width:3.6rem;height:3.6rem;}.tm-chimg{width:6rem;height:6rem;}}
/* ===== stage pictures (sheet 2): one backdrop per act, ornate question frame, gold ribbon banners ===== */
#s-table.game-tablemind.tm-bg-act1.scr{background:linear-gradient(180deg,rgba(4,18,12,.5),rgba(4,18,12,.9) 64%,#04120c),url(assets/games/tm_bg_act1.jpg) center top/cover no-repeat,#04120c;}
#s-table.game-tablemind.tm-bg-act2.scr{background:linear-gradient(180deg,rgba(4,18,12,.5),rgba(4,18,12,.9) 64%,#04120c),url(assets/games/tm_bg_act2.jpg) center top/cover no-repeat,#04120c;}
#s-table.game-tablemind.tm-bg-act3.scr{background:linear-gradient(180deg,rgba(4,10,8,.45),rgba(4,10,8,.9) 62%,#030806),url(assets/games/tm_bg_act3.jpg) center top/cover no-repeat,#030806;}
#s-table.game-tablemind.tm-bg-duel.scr{background:linear-gradient(180deg,rgba(4,18,12,.45),rgba(4,18,12,.9) 62%,#04120c),url(assets/games/tm_bg_duel.jpg) center top/cover no-repeat,#04120c;}
#s-table.game-tablemind.tm-bg-over.scr{background:linear-gradient(180deg,rgba(4,18,12,.35),rgba(4,18,12,.85) 66%,#04120c),url(assets/games/tm_bg_victory.jpg) center top/cover no-repeat,#04120c;}
.tm-intro{background:linear-gradient(180deg,rgba(3,12,8,.35),rgba(3,12,8,.88)),url(assets/games/tm_bg_opening.jpg) center/cover no-repeat,#04120c!important;}
.tm-titlecard{background:linear-gradient(180deg,rgba(3,12,8,.55),rgba(3,12,8,.9)),url(assets/games/tm_bg_opening.jpg) center/cover no-repeat,#04120c!important;}
.tm-qcard{border:1px solid rgba(201,164,92,.35)!important;border-image:none!important;border-radius:18px!important;background:linear-gradient(180deg,rgba(14,52,38,.86),rgba(6,24,16,.92))!important;box-shadow:0 10px 26px -16px #000!important;padding:.8rem .9rem 1rem!important;}
@media(min-width:760px){.tm-qcard{padding:1rem 1.2rem 1.2rem!important;}}
.tm-banner{display:flex;align-items:center;justify-content:center;gap:.4rem;min-height:3.4rem;padding:.2rem 0 .35rem;border-style:solid;border-width:0 27px;border-color:transparent;border-image:url(assets/games/tm_ui_ribbon.png) 0 80 0 80 fill / 0 27px 0 27px stretch;color:#3a2100!important;text-shadow:0 1px 0 rgba(255,244,190,.7)!important;font-size:clamp(1rem,4.2vw,1.45rem)!important;letter-spacing:.07em;filter:drop-shadow(0 6px 10px rgba(0,0,0,.5));}
.tm-banner.bad{color:#5b0f1e!important;}.tm-banner.hot{color:#4a1236!important;}
.tm-banner .tm-ico{filter:none;}
/* reactions float up over the whole screen (the shared reaction code looks for this host) */
.tm-react-host{position:fixed;inset:0;pointer-events:none;z-index:60;overflow:hidden;}
.tm-foot{display:flex;gap:.5rem;justify-content:center;margin-top:.4rem;}
.tm-opt{display:flex;gap:.4rem;flex-wrap:wrap;justify-content:center;align-items:center;margin:.4rem 0;font-size:.78rem;color:var(--paper2,#d8cfbd);}
.tm-opt button{padding:.3rem .7rem;border-radius:999px;border:1px solid rgba(201,164,92,.5);background:rgba(29,83,54,.4);color:inherit;font:inherit;cursor:pointer;}
.v10-gc--tablemind{border-top-color:#e9c46a;box-shadow:0 10px 28px -12px rgba(233,196,106,.4);}
.v10-main .v10-gc--tablemind{border-top-color:rgba(233,196,106,.6);--tile-glow:rgba(233,196,106,.6);}
`;
  const st=document.createElement('style');st.id='tm-css';st.textContent=css;document.head.appendChild(st);
})();

/* ───────── texts ───────── */
const TM_ACT_NAMES=['','DER AUFSTIEG','DIE SECHS WELTEN','DIE JAGD'];
const TM_OFFER_INFO={safe:{n:'SICHER',h:'3 Felder Vorsprung',m:1,t:'Beste Chance zu entkommen, kleine Belohnung.'},std:{n:'STANDARD',h:'2 Felder Vorsprung',m:2,t:'Ausgewogen: gute Chance, doppelte Belohnung.'},risk:{n:'RISIKO',h:'1 Feld Vorsprung',m:3,t:'Knapp! Aber dreifache Belohnung bei Erfolg.'}};
const TM_LIFE_INFO={cut:{n:'Der Schnitt',ic:'✂️',t:'Zwei falsche Antworten verschwinden'},council:{n:'Der Rat',ic:'🗳️',t:'Die anderen beraten dich — oder führen dich in die Irre'},archive:{n:'Das Archiv',ic:'📜',t:'Ein Hinweis zur Frage'},freeze:{n:'Zeit anhalten',ic:'⏸️',t:'10 Sekunden mehr'}};
const TM_LETTERS='ABCD';
/* pictures from the master sheet: realm emblems tm_realm_0..5, lifelines tm_life_*, Chasers tm_ch_*, badges tm_seal / tm_gold / tm_duel / tm_streak, tm_gate, tm_studio */
function tmEmb(k,cls){return`<img class="tm-emb${cls?' '+cls:''}" src="assets/games/tm_realm_${k}.png" alt="" draggable="false">`;}
function tmStreakIco(n){const k=n>=12?'diamond':n>=9?'gold':n>=6?'silver':'bronze';return`<img class="tm-ico inl" src="assets/ui/streak_${k}.png" alt="" draggable="false">`;}
function tmIco(n,cls){return`<img class="tm-ico${cls?' '+cls:''}" src="assets/games/tm_${n}.jpg" alt="" draggable="false">`;}
function tmEur(n){return(n||0).toLocaleString('de-DE')+' €';}
function tmCatName(c){return TM_CATS[c].de;}
function tmPrefChaser(){let v='';try{v=localStorage.getItem('ct_tm_chaser')||'';}catch(e){}return TM_CH_KEYS.indexOf(v)>=0?v:'';}
function tmPrefRelaxed(){let v=0;try{v=+localStorage.getItem('ct_tm_relaxed')||0;}catch(e){}return v===1;}
function tmSetPref(k,v){try{localStorage.setItem('ct_tm_'+k,String(v));}catch(e){}}
function tmOptionsHTML(){
  const ch=tmPrefChaser(),rl=tmPrefRelaxed();
  return`<div class="tm-opt"><span>Zeit:</span><button data-a="tmopt" data-k="relaxed">${rl?'Entspannt':'Normal'}</button><span>Chaser:</span><button data-a="tmopt" data-k="chaser">${ch?TM_CFG.chasers[ch].name:'Zufällig'}</button></div>${G.isOnline?'':tmHcapSetupHTML()}`;
}
/* the handicap is chosen BEFORE the game starts (setup / lobby), per player; it cannot be changed during the game */
const TM_HC=[[-1,'Leicht'],[0,'Normal'],[1,'Schwer']];
function tmHcMap(){try{const m=JSON.parse(localStorage.getItem('ct_tm_hcl')||'{}');return m&&typeof m==='object'?m:{};}catch(e){return{};}}
function tmHcKey(p,i){return 'seat'+(i+1);}   // by seat, so it also works before names are typed
function tmHcOf(name){const v=+tmHcMap()[String(name||'')];return v===-1||v===1?v:0;}
function tmHcSet(name,v){const m=tmHcMap();m[String(name||'')]=v;try{localStorage.setItem('ct_tm_hcl',JSON.stringify(m));}catch(e){}SFX.chip&&SFX.chip();render();}
function tmHcSelfSet(v){try{localStorage.setItem('ct_tm_hcap',String(v));}catch(e){}SFX.chip&&SFX.chip();render();}
function tmHcapChips(cur,attrs){return TM_HC.map(([v,l])=>`<button class="${cur===v?'on':''}" ${attrs(v)}>${l}</button>`).join('');}
function tmHcapSetupHTML(){   // one row per human player on this device
  const rows=(G.lp||[]).map((p,i)=>isBotPlayer(p)?'':`<div class="tm-hcrow"><span>${esc(p.name||('Spieler '+(i+1)))}</span>${tmHcapChips(tmHcOf(tmHcKey(p,i)),v=>`data-a="tmhcl" data-n="${esc(tmHcKey(p,i))}" data-v="${v}"`)}</div>`).join('');
  return rows?`<div class="tm-hcbox"><div class="tm-hct">Stufe</div>${rows}</div>`:'';
}
function tmHcapSelfHTML(){   // online lobby: my own level
  let v=0;try{v=+localStorage.getItem('ct_tm_hcap')||0;}catch(e){}
  return`<div class="tm-hcbox"><div class="tm-hct">Deine Stufe</div><div class="tm-hcrow">${tmHcapChips(v,x=>`data-a="tmhcs" data-v="${x}"`)}</div></div>`;
}
function tmTextMode(){let v='';try{v=localStorage.getItem('ct_tm_text')||'';}catch(e){}return['l','xl','hc'].indexOf(v)>=0?v:'';}
function tmTextNext(){const m=tmTextMode(),n={'':'l',l:'xl',xl:'hc',hc:''}[m];try{localStorage.setItem('ct_tm_text',n);}catch(e){}}
function tmOptTap(k){
  if(k==='relaxed')tmSetPref('relaxed',tmPrefRelaxed()?0:1);
  else{const ch=tmPrefChaser(),i=ch?TM_CH_KEYS.indexOf(ch):-1;tmSetPref('chaser',i+1>=TM_CH_KEYS.length?'':TM_CH_KEYS[i+1]);}
  SFX.chip&&SFX.chip();render();
}

/* ───────── remembered mistakes ("Wiz brings back a question you got wrong") ───────── */
function tmMissedList(){try{const l=JSON.parse(localStorage.getItem('ct_tm_missed')||'[]');return Array.isArray(l)?l:[];}catch(e){return[];}}
function tmMissedIdx(){const lib=tmLib(null),l=tmMissedList();return l.map(t=>lib.findIndex(e=>e[3]===t)).filter(i=>i>=0);}
function tmRecordResults(tm,seats){
  try{
    const lib=tmLib(tm);let l=tmMissedList();
    seats.forEach(s=>{const qq=tm.q[s-1],r=tm.res[s-1];if(!qq||!r)return;const e=lib[qq.i];if(!e)return;
      if(r==='ok')l=l.filter(t=>t!==e[3]);else if(l.indexOf(e[3])<0)l.push(e[3]);});
    localStorage.setItem('ct_tm_missed',JSON.stringify(l.slice(-40)));
  }catch(e){}
}
/* QUESTIONS NEVER REPEAT: every question this device has shown is remembered (by its text) and left out of the next games until
   nearly the whole library has been seen; only then the memory starts again. Old mistakes are no longer brought back. */
function tmSeenList(){try{const l=JSON.parse(localStorage.getItem('ct_tm_seen')||'[]');return Array.isArray(l)?l:[];}catch(e){return[];}}
function tmSeenIdx(){const lib=tmLib(null);let l=tmSeenList();if(l.length>=lib.length-100){l=[];try{localStorage.setItem('ct_tm_seen','[]');}catch(e){}}
  const m=new Map();lib.forEach((e,i)=>m.set(e[3],i));return l.map(t=>m.get(t)).filter(i=>i!=null);}
function tmRecordSeen(tm){
  try{const lib=tmLib(tm);let l=tmSeenList();
    tm.q.forEach(qq=>{if(!qq)return;const e=lib[qq.i];if(e&&l.indexOf(e[3])<0)l.push(e[3]);});
    localStorage.setItem('ct_tm_seen',JSON.stringify(l));}catch(e){}
}
function tmNewGame(n,local){const tm=tmNew(n,{c1:n<=2?8:undefined,sr:n<=2?3:undefined,seed:Date.now(),relaxed:tmPrefRelaxed(),chaser:tmPrefChaser()||undefined,review:[],seen:tmSeenIdx()});
  if(local&&G.lp)tm.hcap=G.lp.slice(0,n).map((p,i)=>isBotPlayer(p)?0:tmHcOf(tmHcKey(p,i)));
  return tm;}

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
  open(){tone(380,.06,'triangle');setTimeout(()=>tone(570,.08,'triangle'),60);},
  drum(){for(let i=0;i<9;i++)setTimeout(()=>tone(150+i*14,.04,'triangle'),i*65);haptic([8,30,8,30,8]);},
  beat(){tone(62,.16,'sine');setTimeout(()=>tone(54,.14,'sine'),170);haptic([18,60,18]);},
  act(n){const t=[[392,494,587],[330,415,523,659],[220,262,330,440,277]][n-1]||[392];t.forEach((f,i)=>setTimeout(()=>tone(f,.2,'triangle'),i*130));},
  streak(){[523,659,784,1046].forEach((f,i)=>setTimeout(()=>tone(f,.1,'square'),i*70));haptic([10,20,10]);}
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
  G.tm=tmNewGame(G.lp.length,true);
  tmStart(G.tm,Date.now()+3200);
  G.tmViewer=null;G.tmReadyKey='';G.tmSel=-1;G.tmFxKey='';G.tmIntro=G.tm.seed;G.tmBotDue={};G.tmShown={};G.tmAct=0;G.tmPose=null;
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
function tmActiveSeat(tm,s){if(tm.duel&&tm.duel.indexOf(s)<0)return false;return tm.act!==3||(tm.lane[s-1]&&tm.lane[s-1].st==='run');}
// with only ONE human at the device (everybody else is a computer player) nobody has to hand the device over: the pass screen is skipped
function tmSoloHuman(){return G.lp.filter(p=>!isBotPlayer(p)).length===1;}
function tmReady(quiet){
  const tm=tmObj();if(!tm||G.isOnline)return;
  const v=tmLocalViewer(tm);if(!v)return;
  G.tmViewer=v.seat;G.tmReadyKey=tmLocalKey(tm,v.seat,v.mode);G.tmSel=-1;
  if(v.mode==='ask'){tm.dl=Date.now()+tmMs(tm,'ask'+tm.act);tm.ext=tm.ext.map(()=>0);}
  if(v.mode==='decide'||v.mode==='pick'||v.mode==='offer'){tm.dl=Math.max(tm.dl,Date.now()+(v.mode==='decide'?TM_CFG.ms.decide:v.mode==='pick'?TM_CFG.ms.pick:TM_CFG.ms.offer));}
  if(quiet)return;
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
  setTimeout(()=>{if(G.selGame==='tablemind'&&G.tm===tm&&G.scr==='table'){G.scr='matchend';render();}},5600);
}
function tmStatsFor(tm,names){
  const o={};
  names.forEach((nm,i)=>{const L=tm.lane[i],n=tm.stats.right[i]+tm.stats.wrong[i]+tm.stats.late[i];
    o[nm]={total:tm.totals[i],bank:tm.bank[i],seals:tmSealCount(tm,i+1),right:tm.stats.right[i],wrong:tm.stats.wrong[i]+tm.stats.late[i],acc:n?Math.round(tm.stats.right[i]/n*100):0,
      lifes:tm.stats.lifes[i],duels:tm.stats.duels[i],cr:tm.stats.catR[i].slice(),cn:tm.stats.catN[i].slice(),best:tm.stats.best[i],top:tm.stats.topHits[i],hunt:L?L.st:'',mult:L?L.mult:0,offer:tm.offer[i]||''};});
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
if(typeof document!=='undefined'&&!window.__tmVis){window.__tmVis=1;document.addEventListener('visibilitychange',()=>{if(!document.hidden&&typeof tmObj==='function'&&tmObj()&&G.scr==='table'){try{tmLoopTick();render();}catch(e){}}});}
function tmLoopStart(){
  if(G.tmLoopT)return;
  G.tmLoopT=setInterval(tmLoopTick,250);
}
function tmLoopStop(){if(G.tmLoopT){clearInterval(G.tmLoopT);G.tmLoopT=null;}document.body.classList.remove('tm-on');}
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
  if(!acted&&tmDueNow(tm,now)){
    // do not run the clock out on a player who has not even picked the device up yet (their clock starts at "Ich bin ...")
    if(v&&tm.phase!=='reveal'&&G.tmReadyKey!==tmLocalKey(tm,v.seat,v.mode))return;   // their clock starts at LOS
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
  const d=t&&t.dataset?t.dataset:{};
  if(a==='tmopt'){tmOptTap(d.k);return;}
  if(a==='tmhcl'){tmHcSet(d.n,+d.v);return;}
  if(a==='tmhcs'){tmHcSelfSet(+d.v);return;}
  const tm=tmObj();if(!tm)return;
  if(a==='tmhcap'){TMSFX.pick();try{localStorage.setItem('ct_tm_hcap',String(+d.v));}catch(e){}tmSend({t:'hcap',v:+d.v});return;}
  if(a==='tmmenu'){G.tmMenu=!G.tmMenu;SFX.chip&&SFX.chip();render();return;}
  if(a==='tmtext'){tmTextNext();SFX.chip&&SFX.chip();render();return;}
  if(a==='tmanim'){gtAnimNext();SFX.chip&&SFX.chip();render();return;}
  if(a==='tmintro'){G.tmIntro=null;render();return;}
  if(a==='tmready'){tmReady();return;}
  if(tm.over)return;
  const i=+d.i;
  if(a==='tmans'){if(tm.phase!=='ask')return;G.tmSel=-1;TMSFX.lock();tmSend({t:'ans',i});return;}
  if(a==='tmlock'){if(G.tmSel<0)return;TMSFX.lock();tmSend({t:'ans',i:G.tmSel});return;}
  if(a==='tmflag'){tmFlagQuestion(+d.i);return;}
  if(a==='tmnext'){TMSFX.pick();if(G.isOnline)tmSend({t:'next'});else{for(let k=1;k<=tm.P;k++)tmApply(tm,k,{t:'next'},Date.now());tmLocalAfterAction();}return;}
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
      if(!tmActiveSeat(tm,s))state=tm.duel?'schaut zu':(tm.lane[i]&&tm.lane[i].st==='escaped'?'entkommen':'gefangen');
      else if(tm.council&&!tm.council.done&&tm.council.for===s)state='fragt den Rat';
      else state=tm.ans[i]!=null?'fertig ✓':'denkt nach…';
    }else if(tm.phase==='decide')state=tm.pendingDecide[i]===true?'entscheidet…':'';
    else if(tm.phase==='pick')state=tm.pick[i]!=null?'gewählt ✓':'wählt…';
    else if(tm.phase==='offer')state=tm.offer[i]!=null?'gewählt ✓':'wählt…';
    else if(tm.phase==='reveal'&&o&&!o.skip){state=o.ok?'richtig':tm.res[i]==='late'?'keine Antwort':'falsch';cls=o.ok?'ok':'bad';}
    const delta=tm.phase==='reveal'&&o&&tm.act===1&&!tm.duel?(o.ok?'+'+tmEur(o.money)+(o.bonus?' '+tmStreakIco(o.streak||3)+'+'+tmEur(o.bonus):'')+(o.gold?' '+tmIco('gold','inl')+'+'+tmEur(o.gold):''):(o.lost?'−'+tmEur(o.lost):'')):(tm.phase==='reveal'&&o&&tm.act===2&&o.side?'+'+tmEur(o.side):'');
    const sealNew=tm.phase==='reveal'&&o&&o.seal&&tm.act===2;
    return`<div class="tm-pod${me===s?' me':''}${lead===s?' lead':''}${sealNew||(o&&o.ok&&tm.phase==='reveal')?' pulse':''}" data-s="${s}">
      <span class="tm-av">${avHTML(p.avatar)}</span><span class="tm-nm">${esc(p.name)}</span>
      <span class="tm-money">${tmEur(tm.act===3&&tm.lane[i]&&tm.lane[i].st==='escaped'?tmTotal(tm,s):tm.bank[i])}</span>
      <span class="tm-unb">${tm.unb[i]>0?'+'+tmEur(tm.unb[i])+' im Spiel':''}</span>
      ${seals.size?`<span class="tm-seals">${TM_CATS.map((c,k)=>seals.has(k)?`<i class="on" title="${esc(c.de)}">${tmEmb(k,'xs')}</i>`:'').join('')}</span>`:''}
      <span class="tm-state ${cls}">${state}</span>${delta&&G&&gtAnim()!=='off'?`<span class="tm-delta${o.ok?'':' neg'}">${delta}</span>`:''}
    </div>`;}).join('')}</div>`;
}
function tmLadderHTML(tm,players){
  const L=TM_CFG.ladder,short=v=>v>=1000?(v/1000).toLocaleString('de-DE')+'K':v;
  return`<div class="tm-lad">${L.map((v,k)=>{
    const here=players.slice(0,tm.P).map((p,i)=>tm.lvl[i]===k?`<span>${avHTML(p.avatar)}</span>`:'').join('');
    return`<div class="tm-rung${k===L.length-1?' top':''}${tm.lvl.some(l=>l===k)?' on':''}"><b>${short(v)}</b><span class="who">${here}</span></div>`;}).join('')}</div>`;
}
function tmRealmsHTML(tm,me,mode){   // mode 'pick' (buttons) or 'show' (who chose what)
  const have=new Set(me?tm.seals[me-1]:[]),used=new Set(me&&tm.picked?tm.picked[me-1]:[]);
  return`<div class="tm-realms">${TM_CATS.map((c,k)=>`<${mode==='pick'?'button':'div'} class="tm-realm${have.has(k)?' got':''}${mode!=='pick'?' stat':''}${mode==='pick'&&used.has(k)?' used':''}" style="--c:${c.col}" ${mode==='pick'&&!used.has(k)?`data-a="tmcat" data-c="${k}"`:''} ${mode==='pick'&&used.has(k)?'disabled':''}><span class="ic">${tmEmb(k,'lg')}</span>${esc(c.de)}${mode==='pick'&&used.has(k)?'<small>schon gewählt</small>':''}</${mode==='pick'?'button':'div'}>`).join('')}</div>`;
}

/* ───────── the Chaser: a hooded figure drawn in code (one per profile) ───────── */
function tmChaserSVG(key,px){
  const col={professor:'#6ec1ff',jaeger:'#ff5a4e',strategin:'#c77dff'}[key]||'#6ec1ff';
  const extra=key==='professor'?`<circle cx="40" cy="52" r="9" fill="none" stroke="#c9a45c" stroke-width="2"/><circle cx="60" cy="52" r="9" fill="none" stroke="#c9a45c" stroke-width="2"/><path d="M49 52h2" stroke="#c9a45c" stroke-width="2"/>`
    :key==='jaeger'?`<path d="M31 40l12 6M69 40l-12 6" stroke="${col}" stroke-width="2.5" stroke-linecap="round"/><path d="M62 30l-6 22" stroke="#c9a45c" stroke-width="1.5" opacity=".7"/>`
    :`<path d="M22 24l-4-22 20 14zM78 24l4-22-20 14z" fill="#0a1c12" stroke="#c9a45c" stroke-width="1.5"/>`;
  return`<svg class="tm-chsvg" viewBox="0 0 100 120" width="${px||64}" height="${Math.round((px||64)*1.2)}" aria-hidden="true"><defs><filter id="tmg${key}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter><linearGradient id="tmc${key}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#163f2a"/><stop offset="1" stop-color="#050f0a"/></linearGradient></defs>
  <path d="M50 6C26 6 13 28 13 52c0 28-6 48-10 66h94c-4-18-10-38-10-66C87 28 74 6 50 6z" fill="url(#tmc${key})" stroke="#c9a45c" stroke-width="2"/>
  ${key==='strategin'?'':''}<ellipse cx="50" cy="50" rx="21" ry="25" fill="#010208"/>
  <ellipse cx="40" cy="52" rx="5.5" ry="3.4" fill="${col}" filter="url(#tmg${key})" opacity=".9"/><ellipse cx="60" cy="52" rx="5.5" ry="3.4" fill="${col}" filter="url(#tmg${key})" opacity=".9"/>
  <ellipse cx="40" cy="52" rx="4" ry="2.2" fill="#fff"/><ellipse cx="60" cy="52" rx="4" ry="2.2" fill="#fff"/>${extra}
  <path d="M30 96h40" stroke="#c9a45c" stroke-opacity=".5" stroke-width="1.5"/></svg>`;
}
function tmChaserHTML(tm){
  const c=TM_CFG.chasers[tm.chaser];
  return`<div class="tm-chaser"><span class="face"><img class="tm-chimg" src="assets/games/tm_ch_${tm.chaser}.jpg" alt="" draggable="false"></span><div><b>${esc(c.name)}</b><small>jagt euch alle</small></div></div>`;
}
function tmLanesHTML(tm,players,me){
  // The Hunt as a tall ladder per player (finish at the top, start at the bottom). The lit bars are the player and the Chaser; they slide between rungs.
  const N=TM_CFG.track;
  if(G.tmMkSeed!==tm.seed){G.tmMkSeed=tm.seed;G.tmMk={};}
  const cols=players.slice(0,tm.P).map((p,i)=>{
    const L=tm.lane[i];if(!L)return'';
    const plPos=Math.min(N,L.pl),chPos=Math.max(0,L.chp);
    const fxo=tm.phase==='reveal'&&tm.fx&&tm.fx.seats?tm.fx.seats[i]:null,lunge=fxo&&fxo.chTo!=null&&fxo.chTo>fxo.chFrom,hit=fxo&&fxo.caught;
    const prize=Math.round(TM_CFG.escapeBase*L.mult/1000)+'K';
    const rungs=[];for(let k=N;k>=0;k--)rungs.push(`<div class="tm-vr${k===N?' fin':''}${k===0?' st':''}">${k===N?tmIco('gate','gate')+' ZIEL · '+prize:k===0?'START':k}</div>`);
    const kp='p'+i,kc='c'+i,prevP=G.tmMk[kp]==null?plPos:G.tmMk[kp],prevC=G.tmMk[kc]==null?chPos:G.tmMk[kc];
    const shared=plPos===chPos;
    const st=L.st==='escaped'?' esc':L.st==='caught'?' cau':'';
    return`<div class="tm-vcol${st}${me===i+1?' me':''}${hit?' hit':''}"><div class="tm-vh"><span class="a">${avHTML(p.avatar)}</span><b>${esc(p.name)}</b><small>${L.st==='escaped'?'ENTKOMMEN':L.st==='caught'?'GEFANGEN':'×'+L.mult+' · Abstand '+(L.pl-L.chp)}</small></div>
      <div class="tm-vl" style="--n:${N+1}">${rungs.join('')}
        <div class="tm-vmk ch${shared?' half r':''}${lunge?' lunge':''}" data-k="${kc}" data-pos="${chPos}" style="--pos:${prevC}"><img class="tm-chm" src="assets/games/tm_ch_${tm.chaser}.jpg" alt="" draggable="false"></div>
        <div class="tm-vmk pl${shared?' half l':''}" data-k="${kp}" data-pos="${plPos}" style="--pos:${prevP}">❯ <span class="a">${avHTML(p.avatar)}</span> ❮</div>
      </div></div>`;}).join('');
  return`<div class="tm-vcols" style="--cols:${tm.P}">${cols}</div>`;
}
function tmMoveMarkers(){
  const els=document.querySelectorAll('.tm-vmk[data-k]');if(!els.length)return;
  G.tmMk=G.tmMk||{};
  const go=()=>els.forEach(el=>{const pos=+el.dataset.pos;el.style.setProperty('--pos',pos);G.tmMk[el.dataset.k]=pos;});
  if(gtAnim()==='off')go();else requestAnimationFrame(()=>requestAnimationFrame(go));
}
function tmBannerHTML(tm,players){
  const fx=tm.fx;if(!fx)return'';
  const nm=i=>esc((players[i]||{}).name||'');
  if(fx.duel){const d=fx.duel;return d.w?`<div class="tm-banner">${tmIco('duel','inl big')} ${nm(d.w-1).toUpperCase()} GEWINNT DAS DUELL!</div>`:d.tie?`<div class="tm-banner">${tmIco('duel','inl big')} DUELL UNENTSCHIEDEN — GETEILT!</div>`:`<div class="tm-banner bad">${tmIco('duel','inl big')} DUELL OHNE SIEGER</div>`;}
  if(tm.act===1){
    const ok=fx.seats.filter(o=>o.ok),top=fx.seats.find(o=>o.top);
    if(top)return`<div class="tm-banner">EIN WISSENSSIEG!</div>`;
    return'';   // Wiz says right or wrong himself
  }
  if(tm.act===2)return'';   // Wiz says it
  const esc_=fx.seats.findIndex(o=>o.escaped),cau=fx.seats.findIndex(o=>o.caught);
  if(esc_>=0)return`<div class="tm-banner">${nm(esc_).toUpperCase()} IST ENTKOMMEN!</div>`;
  if(cau>=0)return`<div class="tm-banner hot">DER CHASER HAT ${nm(cau).toUpperCase()} ERWISCHT!</div>`;
  return tm.ch&&tm.ch.mv>0?`<div class="tm-banner hot">DER JÄGER RÜCKT NÄHER!</div>`:`<div class="tm-banner">DER JÄGER STOLPERT!</div>`;
}
function tmRevealAllHTML(tm,players){
  const seen=new Set(),out=[];
  for(let s=1;s<=tm.P;s++){
    const qq=tm.q[s-1];if(!qq||seen.has(qq.i)||!tmActiveSeat(tm,s)||(tm.fx&&tm.fx.seats[s-1]&&tm.fx.seats[s-1].skip))continue;seen.add(qq.i);
    const q=tmQ(tm,qq),who=[];
    for(let k=1;k<=tm.P;k++)if(tm.q[k-1]&&tm.q[k-1].i===qq.i&&tm.res[k-1])who.push(`<span class="tm-resc ${tm.res[k-1]==='ok'?'ok':'bad'}">${esc(players[k-1].name)} ${tm.res[k-1]==='ok'?'✓':tm.res[k-1]==='late'?'⏱':'✗'}</span>`);
    const chosen=new Set();for(let k=1;k<=tm.P;k++)if(tm.q[k-1]&&tm.q[k-1].i===qq.i&&tm.ans[k-1]!=null&&tm.ans[k-1]>=0)chosen.add(tm.ans[k-1]);
    const grid=q.ans.map((a,k)=>`<div class="tm-a stat ${k===q.cor?'cor':chosen.has(k)?'wrg':'dim'}"><span class="tm-l">${TM_LETTERS[k]}</span>${esc(a)}</div>`).join('');
    out.push(`<div class="tm-card"><div class="tm-qchips"><span class="tm-chip">${tmEmb(q.c,'sm')} ${esc(TM_CATS[q.c].short)}</span></div><div class="tm-q">${esc(q.text)}</div><div class="tm-ans">${grid}</div></div>`);
  }
  return out.join('');
}
function tmStageHTML(tm,players,me,padHasQ){
  const fx=tm.phase==='reveal'?tm.fx:null;
  let body='';
  if(tm.duel)body=`<div class="tm-sub" style="text-align:center"><b>${tm.duel.map(x=>esc(players[x-1].name)).join('</b> gegen <b>')}</b></div>`;
  else if(tm.act===1)body=tmLadderHTML(tm,players);
  else if(tm.act===2){
    if(tm.phase==='pick')body='';
    else body='';
  }else{
    body=tmChaserHTML(tm)+(tm.phase==='offer'?`<div class="tm-sub">Jeder wählt heimlich sein Angebot.</div>`:tmLanesHTML(tm,players,me));
    if((tm.phase==='ask'||tm.phase==='reveal')&&!padHasQ){
      const q=tm.q[0]&&tmQ(tm,tm.q[0]);
      if(q)body+=`<div class="tm-card" style="margin-top:.5rem"><div class="tm-qchips"><span class="tm-chip">${tmEmb(q.c,'sm')} ${esc(TM_CATS[q.c].short)}</span><span class="tm-chip gold">Frage ${tm.hunt.n+(tm.phase==='reveal'?0:1)}</span></div><div class="tm-q">${esc(q.text)}</div>
        <div class="tm-ans">${q.ans.map((a,k)=>`<div class="tm-a stat${tm.phase==='reveal'?(k===q.cor?' cor':' dim'):''}"><span class="tm-l">${TM_LETTERS[k]}</span>${esc(a)}</div>`).join('')}</div></div>`;
    }
  }
  const banner=fx?tmBannerHTML(tm,players):'';
  const learn=(fx&&!G.isOnline&&!padHasQ&&tm.act!==3)?tmRevealAllHTML(tm,players):'';
  return`<div class="tm-stage">${banner}${learn}${body}</div>`;
}
function tmQuestionPad(tm,me,players){
  const i=me-1,qq=tm.q[i];if(!qq)return'';
  const q=tmQ(tm,qq),L=tm.life[i],ans=tm.ans[i],locked=ans!=null,rev=tm.phase==='reveal';
  const chips=`<div class="tm-qchips"><span class="tm-chip">${tmEmb(q.c,'sm')} ${esc(TM_CATS[q.c].short)}</span>${(!tm.duel&&tm.act===1&&tm.cycle===tm.gold)?`<span class="tm-chip gold">${tmIco('gold','inl')} Goldene Frage ×2</span>`:''}${tm.duel?`<span class="tm-chip gold">${tmIco('duel','inl')} DUELL · ${tmEur(TM_CFG.duelPrize)}</span>`:tm.act===1?`<span class="tm-chip gold">${tmEur(tmAmt(tm,i,tm.lvl[i]))}</span>`:tm.act===2?`<span class="tm-chip gold">${tm.owner===me?'Dein Siegel':'+'+tmEur(TM_CFG.sideBonus)}</span>`:''}</div>`;
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
  const hc='';
  if(!locked&&!rev){
    if(tm.clue[i])extra=`<div class="tm-clue">📜 ${esc(q.clue)}</div>`;
  }else if(locked&&!rev){
    extra=`<div class="tm-wait">${ans>=0?`<b>${TM_LETTERS[ans]}</b> ✓`:'Zeit abgelaufen'}</div>`+tmWaitList(tm,players,me);
  }
  if(tm.council&&tm.council.for===me){
    const c=tm.council;
    if(!c.done)extra+=`<div class="tm-clue">🗳️ Der Rat berät … (${Object.keys(c.votes).length}/${tm.P-1})</div>`;
    else{const mx=Math.max(1,...c.res);extra+=`<div class="tm-clue">🗳️ Der Rat hat entschieden — ${c.sources} Stimmen. <b>Denk dran: Sie dürfen auch schwindeln!</b><div class="tm-bars">${c.res.map((v,k)=>`<div class="tm-bar"><b>${TM_LETTERS[k]}</b><i style="width:${v/mx*70}%"></i><span>${v}</span></div>`).join('')}</div></div>`;}
  }
  let res='';
  if(rev){
    const o=tm.fx&&tm.fx.seats[i];
    res=`<button class="tm-flag" data-a="tmflag" data-i="${qq.i}" title="Frage melden" aria-label="Frage melden">⚑</button>`;
  }
  return`<div class="tm-card tm-qcard">${chips}${locked||rev?'':'<div class="tm-timer"><b>--</b><i></i></div>'}${hc}${rev?`<div class="tm-q">${esc(q.text)}</div>`:''}<div class="tm-ans">${answers}</div>${extra}${res}</div>`;
}

/* who has locked in? small chips with a tick, instead of a vague "waiting" line */
function tmWaitList(tm,players,me){
  const done=i=>tm.phase==='ask'?tm.ans[i]!=null:tm.phase==='pick'?tm.pick[i]!=null:tm.phase==='offer'?tm.offer[i]!=null:tm.phase==='decide'?tm.pendingDecide[i]!==true:tm.phase==='reveal'?(tm.rdy[i]||(tm.fx&&tm.fx.seats[i]&&tm.fx.seats[i].skip)):true;
  const chips=players.slice(0,tm.P).map((p,i)=>{const s=i+1;if(s===me)return'';if(tm.phase==='ask'&&!tmActiveSeat(tm,s))return'';const d=done(i);return`<span class="tm-wchip${d?' ok':''}"><span class="a">${avHTML(p.avatar)}</span>${esc(p.name)} ${d?'✓':'…'}</span>`;}).join('');
  return chips?`<div class="tm-wlist">${chips}</div>`:'';
}

/* "Frage melden": remembers a question that looked wrong, on this device, so it can be checked and corrected later */

/* ───────── keyboard (desktop): A-D or 1-4 pick an answer, Enter locks in / continues, N = Weiter ───────── */
function tmKey(e){
  const tm=tmObj();if(!tm||G.scr!=='table'||tm.over||e.ctrlKey||e.metaKey||e.altKey)return false;
  const tg=e.target&&e.target.tagName;if(tg==='INPUT'||tg==='TEXTAREA'||tg==='SELECT')return false;
  if(document.querySelector&&document.querySelector('.ov,.tour-ov'))return false;   // an overlay (rules, tour) has the keyboard
  const k=String(e.key||'').toLowerCase(),me=tmMySeat();
  if(!G.isOnline){const v=tmLocalViewer(tm);if(v&&G.tmReadyKey!==tmLocalKey(tm,v.seat,v.mode)){if(k==='enter'||k===' '){tmReady();return true;}return false;}}
  const idx='abcd'.indexOf(k)>=0&&k.length===1?'abcd'.indexOf(k):('1234'.indexOf(k)>=0&&k.length===1?'1234'.indexOf(k):-1);
  if(tm.phase==='ask'&&idx>=0){
    const seat=G.isOnline?me:G.tmViewer;if(!seat||!tmActiveSeat(tm,seat)||tm.ans[seat-1]!=null)return false;
    if(tm.elim[seat-1]&&tm.elim[seat-1].indexOf(idx)>=0)return false;
    tmTap('tmans',{dataset:{i:idx}});return true;
  }
  if(tm.phase==='ask'&&(k==='enter'||k===' ')&&G.tmSel>=0){tmTap('tmlock',{dataset:{}});return true;}
  if(tm.phase==='reveal'&&(k==='n'||k==='enter'||k==='arrowright')){tmTap('tmnext',{dataset:{}});return true;}
  return false;
}
if(typeof document!=='undefined'&&!window.__tmKeys){window.__tmKeys=1;document.addEventListener('keydown',e=>{try{if(tmKey(e))e.preventDefault();}catch(err){}});}
function tmFlagQuestion(i){
  try{
    const e=tmLib(null)[i];if(!e)return;
    const list=JSON.parse(localStorage.getItem('ct_tm_flags')||'[]');
    if(!list.some(x=>x.i===i)){list.push({i,q:e[3],a:e[4],at:new Date().toISOString().slice(0,10)});localStorage.setItem('ct_tm_flags',JSON.stringify(list.slice(-60)));}
    toast('Danke — die Frage ist gemerkt und wird geprüft.');
  }catch(err){toast('Gemerkt.');}
}

/* "Das habt ihr gelernt": every question of the match with its right answer */
function tmLearnedHTML(tm){
  const lib=tmLib(tm),rows=(tm.log||[]).map(i=>lib[i]).filter(Boolean).map(e=>`<li><b>${esc(e[3])}</b><br>→ ${esc(e[4])}</li>`).join('');
  return rows?`<details class="tm-learn"><summary>📖 Das habt ihr gelernt (${tm.log.length} Fragen)</summary><ol>${rows}</ol></details>`:'';
}

/* ───────── family strengths: who is best in which realm, from every TABLE MIND game in the family history ───────── */
function tmStrengthsFrom(history,minQ){
  minQ=minQ||5;const by={};
  (history||[]).forEach(h=>{if(!h||h.game!=='tablemind'||!h.stats||!h.stats.tm)return;
    Object.keys(h.stats.tm).forEach(nm=>{const st=h.stats.tm[nm];if(!st||!st.cn||!st.cr)return;
      const o=by[nm]||(by[nm]={r:[0,0,0,0,0,0],n:[0,0,0,0,0,0]});
      for(let c=0;c<6;c++){o.r[c]+=st.cr[c]||0;o.n[c]+=st.cn[c]||0;}});});
  const names=Object.keys(by),best=[];
  for(let c=0;c<6;c++){let b=null,bp=-1;names.forEach(nm=>{const n=by[nm].n[c];if(n<minQ)return;const p=by[nm].r[c]/n;if(p>bp){bp=p;b=nm;}});best.push(b);}
  return{by,names,best};
}
function tmStrengthsHTML(){
  let hist=[];try{hist=getHistory();}catch(e){}
  const S=tmStrengthsFrom(hist);if(!S.names.length)return'';
  const rows=S.names.map(nm=>`<tr><td>${esc(nm)}</td>${TM_CATS.map((c,k)=>{const n=S.by[nm].n[k];if(!n)return'<td>–</td>';const p=Math.round(S.by[nm].r[k]/n*100);return`<td>${S.best[k]===nm?'🥇 ':''}${p}%</td>`;}).join('')}</tr>`).join('');
  return`<details class="tm-learn"><summary>🏅 Familien-Stärken</summary><table style="width:100%;font-size:.78rem;margin-top:.4rem"><tr><th></th>${TM_CATS.map((c,k)=>`<th title="${esc(c.de)}">${tmEmb(k,'sm')}</th>`).join('')}</tr>${rows}</table><div style="font-size:.68rem;color:var(--paper3,#8e887d);margin-top:.3rem">🥇 = beste Trefferquote (mindestens 5 Fragen in dieser Welt)</div></details>`;
}
function tmFlaggedHTML(){
  let list=[];try{list=JSON.parse(localStorage.getItem('ct_tm_flags')||'[]');}catch(e){}
  if(!list.length)return'';
  return`<div class="panel-lbl" style="margin-top:.8rem">GEMERKTE FRAGEN (${list.length})</div><div style="font-size:.78rem;color:var(--paper2);text-align:left">${list.slice(-5).map(x=>'• '+esc(x.q)+' → '+esc(x.a)).join('<br>')}</div>`;
}
function tmSharedQCard(tm,reveal){
  const q=tm.q[0]&&tmQ(tm,tm.q[0]);if(!q)return'';
  return`<div class="tm-card"><div class="tm-qchips"><span class="tm-chip">${tmEmb(q.c,'sm')} ${esc(TM_CATS[q.c].short)}</span><span class="tm-chip gold">Frage ${tm.hunt.n+(tm.phase==='reveal'?0:1)}</span></div><div class="tm-q">${esc(q.text)}</div>
    <div class="tm-ans">${q.ans.map((a,k)=>`<div class="tm-a stat${tm.phase==='reveal'?(k===q.cor?' cor':' dim'):''}"><span class="tm-l">${TM_LETTERS[k]}</span>${esc(a)}</div>`).join('')}</div></div>`;
}
function tmNextHTML(tm,me,players){
  if(tm.phase!=='reveal')return'';
  if(!G.isOnline)return`<div class="tm-row" style="margin-top:.6rem"><button class="tm-btn next" data-a="tmnext"><i class="fill" style="animation-duration:${Math.max(800,(tm.dl||0)-Date.now())}ms"></i><span>WEITER ▶</span></button></div>`;
  if(!me)return'';
  if(tm.rdy[me-1])return`<div class="tm-wait">Bereit ✓</div>`+tmWaitList(tm,players,me);
  return`<div class="tm-row" style="margin-top:.6rem"><button class="tm-btn next" data-a="tmnext"><i class="fill" style="animation-duration:${Math.max(800,(tm.dl||0)-Date.now())}ms"></i><span>WEITER ▶</span></button></div>`+tmWaitList(tm,players,me);
}
function tmCouncilCard(tm,me,players){
  const c=tm.council;
  if(!c||c.done||c.for===me||c.votes[me]!=null)return'';
  const q=tmQ(tm,tm.q[c.for-1]),asker=players[c.for-1]||{name:'?'};
  return`<div class="tm-card tm-council"><div class="tm-title">🗳️ ${esc(asker.name)} fragt den Rat</div><div class="tm-sub">Gib deinen Tipp ab — geheim. Du darfst auch schwindeln …</div><div class="tm-q">${esc(q.text)}</div>
    <div class="tm-ans">${q.ans.map((a,k)=>`<button class="tm-a" data-a="tmvote" data-i="${k}"><span class="tm-l">${TM_LETTERS[k]}</span>${esc(a)}</button>`).join('')}</div></div>`;
}
function tmDecidePad(tm,me,players){
  const i=me-1;
  if(tm.pendingDecide[i]!==true)return`<div class="tm-card tm-wait">${tm.res[i]==='ok'?'Entschieden ✓':'Diesmal nichts zu entscheiden.'}${tmWaitList(tm,players,me)}</div>`;
  const nxt=tmAmt(tm,i,tm.lvl[i]),lq=tm.q[i]?tmQ(tm,tm.q[i]):null;
  return`<div class="tm-card"><div class="tm-title">BANKEN ODER WEITER?</div><div class="tm-timer"><b>--</b><i></i></div>
    <div class="tm-sub">Du hast <b>${tmEur(tm.unb[i])}</b> im Spiel. Gesichert sind ${tmEur(tm.bank[i])}.</div>
    <div class="tm-row"><button class="tm-btn big" data-a="tmbank">BANKEN · ${tmEur(tm.unb[i])} sichern</button><button class="tm-btn big ghost" data-a="tmgo">WEITER · für ${tmEur(nxt)}${tm.lvl[i]===TM_CFG.ladder.length-1?' + Bonus':''}</button></div>
    <div class="tm-sub" style="margin-top:.5rem">Wer weitermacht und falsch antwortet, verliert das ungesicherte Geld.</div></div>`;
}
function tmPickPad(tm,me,players){
  const i=me-1;
  if(tm.pick[i]!=null)return`<div class="tm-card tm-wait"><div class="tm-title">Bestätigt ✓</div><div class="tm-realm sel stat" style="--c:${TM_CATS[tm.pick[i]].col};max-width:14rem;margin:.3rem auto"><span class="ic">${tmEmb(tm.pick[i],'lg')}</span>${esc(TM_CATS[tm.pick[i]].de)}</div>${tmWaitList(tm,players,me)}</div>`;
  return`<div class="tm-card"><div class="tm-title">WÄHLE DEINE WELT <small>${tm.round2} von ${tm.sr||TM_CFG.sealRounds}</small></div><div class="tm-timer"><b>--</b><i></i></div>${tmRealmsHTML(tm,me,'pick')}</div>`;
}
function tmOfferPad(tm,me,players){
  const i=me-1;
  if(tm.offer[i]!=null){const o=TM_OFFER_INFO[tm.offer[i]];return`<div class="tm-card tm-wait"><div class="tm-title">Bestätigt ✓</div><div class="tm-offer ${tm.offer[i]} sel" style="max-width:15rem;margin:.3rem auto;cursor:default"><h4>${o.n}</h4><span class="big">${tmEur(TM_CFG.escapeBase*o.m)}</span><b>${o.h}</b></div>${tmWaitList(tm,players,me)}</div>`;}
  const n=tmSealCount(tm,me),bonus=[];
  if(n>=1)bonus.push('+1 Feld Vorsprung');if(n>=2)bonus.push('Schutzschild');
  return`<div class="tm-card"><div class="tm-title">DIE JAGD — DEIN ANGEBOT</div><div class="tm-timer"><b>--</b><i></i></div>
    ${bonus.length?'<div class="tm-sub">Siegel-Bonus: <b>'+bonus.join(', ')+'</b></div>':''}
    <div class="tm-offers">${['safe','std','risk'].map(k=>{const o=TM_OFFER_INFO[k];return`<button class="tm-offer ${k}" data-a="tmoffer" data-k="${k}"><h4>${o.n}</h4><span class="big">${tmEur(TM_CFG.escapeBase*o.m)}</span><b>${o.h}</b></button>`;}).join('')}</div></div>`;
}
function tmPassHTML(tm,players,v){
  const p=players[v.seat-1];
  const what=v.mode==='vote'?'Du gibst einen Tipp für den Rat ab.':v.mode==='ask'?'Die Frage wartet auf dich.':v.mode==='decide'?'Du musst dich entscheiden.':v.mode==='pick'?'Du wählst deine Welt.':'Du wählst dein Angebot.';
  return`<div class="tm-card tm-pass"><div class="tm-sub">Gib das Gerät an</div><div class="tm-av" style="font-size:2rem">${avHTML(p.avatar)}</div><div class="who">${esc(p.name)}</div><button class="tm-btn big" data-a="tmready">LOS</button></div>`;
}
function tmPadHTML(tm,players,me){
  if(tm.over)return`<div class="tm-card tm-wait"><div class="tm-title">TABLE MIND ENTSCHIEDEN</div>Die Ergebnisse folgen …</div>`;
  if(!G.isOnline){
    const v=tmLocalViewer(tm);
    if(!v)return tm.phase==='reveal'?'':`<div class="tm-card tm-wait"><span class="dots">Computergegner denken nach</span></div>`;
    if(G.tmReadyKey!==tmLocalKey(tm,v.seat,v.mode)&&tmSoloHuman())tmReady(true);
    if(G.tmReadyKey!==tmLocalKey(tm,v.seat,v.mode))return tmPassHTML(tm,players,v);
    G.tmViewer=v.seat;me=v.seat;
    if(v.mode==='vote')return tmCouncilCard(tm,me,players)||'';
  }
  if(!me)return`<div class="tm-card tm-wait">Du schaust zu.</div>`;
  if(tm.phase==='ask'){
    if(!tmActiveSeat(tm,me)){
    if(tm.act===3&&tm.q[0])return`<div class="tm-card tm-wait">Du bist ${tm.lane[me-1].st==='escaped'?'<b>entkommen</b>!':'<b>gefangen</b>.'} Die anderen jagen weiter — schau zu.</div>`+tmSharedQCard(tm,false);
    return tm.duel?`<div class="tm-card tm-wait">Das <b>Duell</b> läuft: ${tm.duel.map(x=>esc(players[x-1].name)).join(' gegen ')}. <span class="dots">Du schaust zu</span></div>`:`<div class="tm-card tm-wait">Du bist ${tm.lane[me-1].st==='escaped'?'<b>entkommen</b>!':'<b>gefangen</b>.'} <span class="dots">Die anderen jagen weiter</span></div>`;
    }
    return(G.isOnline?tmCouncilCard(tm,me,players):'')+tmQuestionPad(tm,me,players);
  }
  if(tm.phase==='reveal'){if(tmActiveSeat(tm,me)||(tm.fx&&tm.fx.seats[me-1]&&!tm.fx.seats[me-1].skip))return tmQuestionPad(tm,me,players);return tm.act===3?tmSharedQCard(tm,true):'';}
  if(tm.phase==='decide')return tmDecidePad(tm,me,players);
  if(tm.phase==='pick')return tmPickPad(tm,me,players);
  if(tm.phase==='offer')return tmOfferPad(tm,me,players);
  return'';
}
function tmIntroHTML(){
  return`<div class="tm-intro" data-a="tmintro"><img class="wiz" src="assets/games/ws_owl_1.jpg" alt=""><div class="ic">${TM_CATS.map((c,k)=>`<i style="animation-delay:${.9+k*.18}s">${tmEmb(k,'intro')}</i>`).join('')}</div><div class="t1">TABLE MIND</div><div class="t2">WISSEN. STRATEGIE. RUHM.</div><div class="hint">TIPPEN ZUM ÜBERSPRINGEN</div></div>`;
}

/* ───────── Wiz, the owl from WORDSPIN, hosts the show ───────── */
function tmWizPose(tm){
  if(tm.over)return 6;
  const fx=tm.phase==='reveal'?tm.fx:null;
  if(fx&&fx.duel)return fx.duel.w?'bow':3;   // the Duel winner gets a bow from Wiz
  if(fx){
    if(tm.act===1){
      if(fx.seats.some(o=>o.top))return 6;
      if(fx.seats.some(o=>o.gold))return'rich';
      if(fx.seats.some(o=>o.bonus))return'applause';
      return fx.seats.some(o=>o.ok)?2:3;
    }
    if(tm.act===2)return fx.seats.some(o=>o.seal)?2:3;
    if(fx.seats.some(o=>o.escaped))return'laugh';
    if(fx.seats.some(o=>o.caught))return 3;
    return fx.ch&&fx.ch.mv>0?'tense':2;
  }
  if(tm.phase==='ask'){
    if(tm.duel)return'ready';
    if(tm.act===1&&tm.cycle===tm.gold)return'rich';
    if(tm.act===3)return'hope';   // in the Hunt Wiz keeps his wings crossed for the runners
    return 4;
  }
  if(tm.phase==='decide')return'smug';
  if(tm.phase==='pick'||tm.phase==='offer')return'detective';
  return 1;
}
function tmWizSay(tm,players){
  const v=(a)=>a[(tm.moves+tm.cycle+(tm.hunt?tm.hunt.n:0))%a.length],nm=i=>esc((players[i]||{}).name||'');
  if(tm.over){const w=tm.win-1;return`${nm(w)} ist der TABLE MIND! Glückwunsch!`;}
  const fx=tm.phase==='reveal'?tm.fx:null;
  if(fx&&fx.duel)return fx.duel.w?`${nm(fx.duel.w-1)} gewinnt das Duell und holt ${tmEur(fx.duel.prize)}!`:fx.duel.tie?'Unentschieden! Das Preisgeld wird geteilt.':'Kein Sieger im Duell — beide verpassen die Chance.';
  if(tm.act===1&&!tm.duel&&tm.phase==='ask'&&tm.cycle===tm.gold)return'⭐ Goldene Frage! Wer richtig liegt, bekommt doppelt.';
  if(tm.act===1&&!tm.duel&&tm.phase==='ask'&&tm.q.some(q=>q&&q.rv))return'🔁 Die kenne ich doch: Diese Frage hattet ihr schon einmal falsch!';
  if(tm.duel&&tm.phase==='ask')return`Das große Duell! ${nm(tm.duel[0]-1)} gegen ${nm(tm.duel[1]-1)} — nur einer kann gewinnen.`;
  if(fx){
    if(tm.act===1){if(fx.seats.some(o=>o.top))return'Die höchste Stufe! Ein echter Wissenssieg!';const sb=fx.seats.findIndex(o=>o.bonus);if(sb>=0)return`🔥 ${nm(sb)} hat eine Serie — ${tmEur(TM_CFG.streakBonus)} Bonus!`;return fx.seats.some(o=>o.ok)?v(['Richtig! Das war stark.','Wunderbar — das Wissen sitzt!']):v(['Autsch! Diesmal nicht.','Knapp daneben — weiter geht’s.']);}
    if(tm.act===2)return fx.seats.some(o=>o.seal)?v(['Ein Siegel! Es glänzt am Podium.','Schön gesammelt!']):v(['Kein Siegel diesmal.','Die nächste Chance kommt bestimmt!']);
    const e=fx.seats.findIndex(o=>o.escaped),c=fx.seats.findIndex(o=>o.caught);
    if(e>=0)return`${nm(e)} ist entkommen! Bravo!`;
    if(c>=0)return`Oje — ${nm(c)} wurde erwischt!`;
    return fx.ch&&fx.ch.mv>0?v(['Der Chaser rückt näher …','Hört ihr die Schritte hinter euch?']):v(['Der Jäger stolpert! Nutzt den Vorsprung.','Durchatmen — der Chaser kam nicht vorwärts.']);
  }
  if(tm.phase==='decide')return v(['Mut oder Vorsicht?']);
  if(tm.phase==='pick')return 'Wähl dein Thema. Richtig = Siegel!';
  if(tm.phase==='offer')return 'Renn ins Ziel, bevor er dich fängt!';
  if(tm.act===1&&tm.cycle>=2&&tm.P>=2){
    const b=tm.bank.map((x,i)=>[x,i]).sort((a,c)=>c[0]-a[0]);
    if(b[0][0]>0&&b[0][0]>=b[1][0]*2&&(tm.cycle+tm.moves)%3===0)return`${nm(b[0][1])} läuft davon … wer holt ihn ein?`;
    if(b[0][0]>0&&b[0][0]===b[1][0]&&(tm.cycle+tm.moves)%3===0)return'Gleichstand an der Spitze! Das wird spannend.';
  }
  if(tm.act===1)return tm.moves===0?'Willkommen! Ich bin Wiz.':v(['Konzentration!','Gleich geht es los!']);
  if(tm.act===2)return`Die Welt von ${nm(tm.owner-1)}: ${(TM_CATS[tm.pick[tm.owner-1]]||{short:''}).short}`;
  return v(['Wer behält die Nerven?','Jede Antwort zählt!']);
}
function tmAskLabel(tm){
  if(tm.act===1&&tm.cycle>=2){try{localStorage.setItem('ct_tm_hint1','1');}catch(e){}}
  if(tm.duel)return'Duell · '+esc(tmEur(TM_CFG.duelPrize));
  if(tm.act===1&&tm.cycle===tm.gold)return'Goldene Frage – doppelt!';
  if(tm.act===1&&tm.cycle===1){let seen=0;try{seen=+localStorage.getItem('ct_tm_hint1')||0;}catch(e){}if(!seen)return'Richtig = Geld. Klettere bis '+esc(tmEur(TM_CFG.ladder[TM_CFG.ladder.length-1]))+'!';}
  if(tm.act===2)return'Welt von '+esc(((tmPlayers()[tm.owner-1])||{}).name||'');
  return'WIZ';
}
function tmHostHTML(tm,players,askText,verdict){
  let pose=tmWizPose(tm);if(verdict){const good=[2,6,'rich','applause','bow','laugh'];pose=verdict.ok?(good.indexOf(pose)>=0?pose:2):3;}   // Wiz's mood follows the viewer's own result
  const hop=G.tmPose!=null&&G.tmPose!==pose;G.tmPose=pose;
  const big=tm.over||pose===6||(tm.phase==='reveal'&&tm.fx&&(tm.fx.duel||(tm.act===3&&tm.fx.seats.some(o=>o.escaped||o.caught))||(tm.act===2&&tm.fx.seats.some(o=>o.seal))));
  return`<div class="tm-host${big?' big':''}${askText?' ask':''}"><img class="tm-wiz${hop?' hop':''}" src="${wizSrc(pose)}" alt="Wiz" width="64" height="64"><div class="tm-say"><small>${askText?tmAskLabel(tm):'WIZ'}</small>${askText?`<span class="tm-wq">${esc(askText)}</span>`:(verdict?`<b class="tm-verd ${verdict.ok?'ok':'bad'}">${verdict.t}</b> ${verdict.x||''}`:tmWizSay(tm,players))}</div></div>`;
}
function rTablemindTable(){
  const tm=tmObj();
  const players=tmPlayers();
  if(!tm)return`<div id="s-table" class="scr on game-tablemind"><div class="tm-main"><div class="tm-card tm-wait">Lade TABLE MIND …</div></div></div>`;
  const me=G.isOnline?tmMySeat():(tmLocalViewer(tm)?G.tmViewer:0);
  const an=gtAnim();
  const pad=tmPadHTML(tm,players,me);
  let verdict=null;if(tm.phase==='reveal'&&tm.fx&&tm.fx.seats&&!tm.fx.duel&&tm.act!==3){
    const vs=me||(!G.isOnline&&tmSoloHuman()?G.lp.findIndex(p=>!isBotPlayer(p))+1:0);
    if(vs){const o=tm.fx.seats[vs-1];if(o&&!o.skip)verdict=o.ok?{ok:1,t:'Richtig!'}:tm.res[vs-1]==='late'?{ok:0,t:'Zeit abgelaufen!'}:{ok:0,t:'Leider falsch.'};}
    else if(tm.act===1){const names=tm.fx.seats.map((o,k)=>o&&o.ok?esc((players[k]||{}).name||''):'').filter(Boolean);verdict=names.length?{ok:1,t:names.join(' & ')+' liegt richtig!'}:{ok:0,t:'Leider falsch.'};}
  }
  if(verdict&&tm.act===2){const g=tm.fx.seats.findIndex(o=>o.seal);verdict.x=g>=0?'Siegel für '+esc((players[g]||{}).name||'')+'.':'Kein Siegel.';}
  let askText='';if(tm.phase==='ask'&&pad.indexOf('tm-qcard')>=0){const mq=me&&tm.q[me-1];if(mq)askText=tmQ(tm,mq).text;}
  const showIntro=G.tmIntro===tm.seed&&Date.now()<tm.dl&&tm.moves===0&&tm.act===1&&tm.cycle===1;
  const actTxt=tm.act===1?`Frage ${Math.min(tm.cycle,tm.c1||TM_CFG.cycles1)} von ${tm.c1||TM_CFG.cycles1}`:tm.act===2?`Siegel ${tm.round2} von ${tm.sr||TM_CFG.sealRounds}`:`Jagd · Frage ${(tm.hunt?tm.hunt.n:0)+(tm.phase==='ask'?1:0)}`;
  queueMicrotask(tmPostRender);
  return`<div id="s-table" class="scr on game-tablemind an-${an} tm-bg-${tm.over?'over':tm.duel?'duel':'act'+tm.act}${tmTextMode()?' tx-'+tmTextMode():''}">
    <div class="game-bar"><div class="gb-game"><span class="tm-logo">TABLE MIND</span></div><div class="gb-turn tm-bartitle"><span><b>AKT ${['','I','II','III'][tm.act]}</b> · ${TM_ACT_NAMES[tm.act]}</span><small>${esc(actTxt)}</small></div><div class="gb-right"><button class="ico-btn tm-animbtn tm-aa" data-a="tmmenu" aria-label="Menü" aria-expanded="${G.tmMenu?'true':'false'}" title="Menü">⋯</button>${quitBtn()}${sndBtn()}</div></div>${G.tmMenu?`<div class="tm-menu"><button data-a="tmtext">Textgröße · ${({'':'normal',l:'groß',xl:'sehr groß',hc:'Kontrast'})[tmTextMode()]}</button><button data-a="tmanim">Animation · ${an==='full'?'voll':an==='light'?'leicht':'aus'}</button><span class="tm-mr">${rulesBtn()} Spielregeln</span></div>`:''}
    <div class="tm-main ${tm.act===3&&tm.phase!=='offer'?'':'split'}${tm.act===3?' act3':''}">
      <div class="tm-actline"><b>AKT ${['','I','II','III'][tm.act]}</b> · ${TM_ACT_NAMES[tm.act]} · ${esc(actTxt)}</div>
      ${tmPodsHTML(tm,players,me,tm.phase==='reveal'?tm.fx:null)}
      ${tmHostHTML(tm,players,askText,verdict)}
      <div class="tm-left">${tmStageHTML(tm,players,me,pad.indexOf('tm-q')>=0)}${tm.phase==='reveal'?'<div class="tm-nextwrap">'+tmNextHTML(tm,me,players)+'</div>':''}</div>
      <div class="tm-right">${pad}</div>
    </div>
    ${showIntro?tmIntroHTML():''}
    <div class="tm-react-host"></div>
    ${typeof talkStripHTML==='function'?talkStripHTML():''}
  </div>`;
}


const TM_ACT_SUB=['','Beantworte Fragen und steige auf.','Sammle Siegel aus den sechs Welten.','Der Chaser kommt. Lauft ins Ziel!'];
function tmActCard(tm){
  if(gtAnim()==='off')return;
  const old=document.getElementById('tm-titlecard');if(old)old.remove();
  const d=document.createElement('div');d.id='tm-titlecard';d.className='tm-titlecard';
  TMSFX.act(tm.act);
  d.innerHTML=(tm.act===3&&tm.chaser?`<div class="chbg" style="background-image:url(assets/games/tm_ch_${tm.chaser}.jpg)"></div>`:'')+`<div class="a">AKT ${['','I','II','III'][tm.act]}</div><div class="n">${TM_ACT_NAMES[tm.act]}</div><div class="s">${TM_ACT_SUB[tm.act]}</div>`;
  document.body.appendChild(d);setTimeout(()=>{d.remove();},2700);
}
/* ───────── effects when the state moves on ───────── */
/* the crowning: the winner's seals circle the avatar, the total counts up, Wiz celebrates (tap to skip) */
function tmCrown(tm){
  if(gtAnim()==='off'||document.getElementById('tm-crown'))return;
  const players=tmPlayers(),w=tm.win-1,p=players[w]||{name:'',avatar:null};
  const seals=[...new Set(tm.seals[w]||[])];
  const total=(tm.totals&&tm.totals[w]!=null)?tm.totals[w]:tmTotal(tm,tm.win);
  const d=document.createElement('div');d.id='tm-crown';d.className='tm-crown';
  d.innerHTML=`<div class="cr-orbit"><div class="cr-ring">${seals.map((k,i)=>`<img src="assets/games/tm_realm_${k}.png" alt="" style="--a:${Math.round(i/Math.max(1,seals.length)*360)}deg">`).join('')}</div><div class="cr-av">${avHTML(p.avatar)}</div></div><div class="cr-name">${esc(p.name)}</div><div class="cr-sub">ist der TABLE MIND</div><div class="cr-total">0 €</div><img class="cr-wiz" src="${wizSrc(6)}" alt="" draggable="false">`;
  d.onclick=()=>d.remove();
  document.body.appendChild(d);
  try{TMSFX.act(3);}catch(e){}
  const el=d.querySelector('.cr-total'),t0=Date.now();
  const iv=setInterval(()=>{if(!document.body.contains(d)){clearInterval(iv);return;}const k=Math.min(1,(Date.now()-t0)/1600);el.textContent=tmEur(Math.round(total*k*k*(3-2*k)/50)*50);if(k>=1)clearInterval(iv);},40);
  setTimeout(()=>{d.remove();},5200);
}
function tmPostRender(){
  const tm=tmObj();if(!tm||!document.querySelector('.game-tablemind'))return;
  if(tm.over&&G.tmCrownSeed!==tm.seed){G.tmCrownSeed=tm.seed;tmCrown(tm);}
  tmMoveMarkers();
  tmLoopStart();document.body.classList.add('tm-on');
  const key=[tm.seed,tm.act,tm.phase,tm.cycle,tm.round2,tm.hunt?tm.hunt.n:0,''].join('|');
  if(G.tmFxKey===key)return;
  const first=G.tmFxKey==='';G.tmFxKey=key;G.tmMenu=false;if(first){G.tmAct=tm.act;G.tmHcapSent=0;}
  if(G.isOnline&&tm.act===1&&tm.cycle===1&&tm.phase==='ask'&&!tm.duel&&!G.tmHcapSent){const me=tmMySeat();let v=0;try{v=+localStorage.getItem('ct_tm_hcap')||0;}catch(e){}if(me&&v&&tm.hcap[me-1]!==v&&tm.ans[me-1]==null){G.tmHcapSent=1;tmSend({t:'hcap',v});}}
  if(first&&G.tmIntro===tm.seed){TMSFX.intro();return;}
  if(G.tmAct!==tm.act){const prev=G.tmAct;G.tmAct=tm.act;if(prev&&tm.act>1)tmActCard(tm);}
  if(tm.phase==='reveal'&&tm.fx){
    const fx=tm.fx,me=tmMySeat()||0;
    tmRecordSeen(tm);
    if(G.isOnline){if(me)tmRecordResults(tm,[me]);}else tmRecordResults(tm,tm.fx.seats.map((o,k)=>k+1).filter(k=>!isBotPlayer(G.lp[k-1])));
    const result=()=>{
    if(tm.act===3){
      const mineO=fx.seats[me-1];
      if(fx.seats.some(o=>o.escaped)){TMSFX.escape();fxPulse('gold');}
      else if(fx.seats.some(o=>o.caught)){TMSFX.caught();fxPulse('red');}
      else if(fx.ch&&fx.ch.mv>0){if(tm.lane.some(L=>L.st==='run'&&L.pl-L.chp<=1))TMSFX.beat();else TMSFX.chase();}
      else TMSFX.ok();
    }else if(tm.act===2){if(fx.seats.some(o=>o.seal))TMSFX.seal();else TMSFX.bad();}
    else{if(fx.seats.some(o=>o.top)){TMSFX.escape();fxPulse('gold');}else if(fx.seats.some(o=>o.ok))TMSFX.ok();else TMSFX.bad();}
    if(tm.act===1&&fx.seats.some(o=>o.bonus))setTimeout(()=>TMSFX.streak(),500);};
    if(gtAnim()==='off')result();else{TMSFX.drum();setTimeout(result,560);}
  }else if(tm.phase==='ask'||tm.phase==='pick'||tm.phase==='offer'){TMSFX.open();}
}

/* ───────── the results card ───────── */
function tmChipsHTML(){
  const tm=tmObj();if(!tm||!tm.over)return'';
  const sum=a=>a.reduce((x,y)=>x+y,0),esc_=tm.lane.filter(l=>l.st==='escaped').length;
  const tot=sum(tm.stats.right)+sum(tm.stats.wrong)+sum(tm.stats.late);
  return`<div class="tonight-stats">
    <div class="tonight-stat"><div class="ts-val">${tot}</div><div class="ts-lbl">❓ Antworten</div></div>
    <div class="tonight-stat"><div class="ts-val">${tot?Math.round(sum(tm.stats.right)/tot*100):0}%</div><div class="ts-lbl">🎯 richtig</div></div>
    <div class="tonight-stat"><div class="ts-val">${esc_}/${tm.P}</div><div class="ts-lbl">🏃 dem Chaser entkommen</div></div>
    <div class="tonight-stat"><div class="ts-val">${fmtPlayTime(Date.now()-G.matchStats.startedAt)}</div><div class="ts-lbl">⏱ Spielzeit</div></div>
  </div>`;
}
function tmResultsHTML(){
  const tm=tmObj();if(!tm||!tm.over)return'';
  const players=tmPlayers(),c=TM_CFG.chasers[tm.chaser];
  const st=tmStandings(tm);
  const rows=st.map((r,k)=>{const i=r.s-1,p=players[i]||{name:'?',avatar:null},L=tm.lane[i],n=tm.stats.right[i]+tm.stats.wrong[i]+tm.stats.late[i];
    return`<div class="tm-fin${k===0?' first':''}"><span class="rk">${k<3?`<img src="assets/ui/reward_${['gold','silver','bronze'][k]}.png" alt="${k+1}" style="width:1.7rem;height:1.7rem;object-fit:contain;vertical-align:middle">`:k+1}</span><span class="nm">${avChar(p.avatar)} ${esc(p.name)}</span><b class="tt">${tmEur(r.total)}</b><small>${tm.stats.streaks[i]?tmStreakIco(tm.stats.streaks[i]*3)+' '+tm.stats.streaks[i]+'× · ':''}Konto ${tmEur(tm.bank[i])} · ${r.seals} Siegel · ${L.st==='escaped'?'entkommen':'gefangen'} · ${n?Math.round(tm.stats.right[i]/n*100):0}% richtig</small></div>`;}).join('');
  const hero=`<div class="tm-podium"><img src="assets/games/${(G.isOnline&&G.myPid&&(tmPlayers().findIndex(q=>q.id===G.myPid)+1)&&(tmPlayers().findIndex(q=>q.id===G.myPid)+1)!==tm.win)?'tm_res_lose':'tm_res_win'}.jpg" alt="" onerror="this.src='assets/games/ws_owl_6.jpg'"><div class="t">${esc((players[tm.win-1]||{}).name||'')} ist der TABLE MIND!</div></div>`;
  return`<div class="panel ws-res">${hero}<div class="tm-fins">${rows}</div><details class="tm-more"><summary>Details · Chaser: ${esc(c.name)}</summary>${tmFlaggedHTML()}${tmStrengthsHTML()}${tmLearnedHTML(tm)}</details></div>`;
}
