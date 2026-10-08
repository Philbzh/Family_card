# OUR TABLE — THE GAUNTLET · Design specification (draft 1)

> **Status (October 2026):** this is the original design draft. The game was built from it and has changed since — later modes (Sprint, Turbo with item boxes and push-your-luck turns), animations and rules differ from what is written below. Treat it as history, not as the current rules (the in-game Rules page is the current version).

*RUN. RISK. OUTSMART. SURVIVE.* A race game for 2–6 players (ideal 3–5), 15–25 minutes. Online with private devices, or one person against bots.
This is the "design before code" document from the brief (§64). Nothing here is built yet. Numbers marked **[tune]** are starting values to be changed after play-testing.

---

## 0. Decisions (all five settled: owner accepted the recommendations; plus Play Together on one device)

## 1. The idea in one paragraph
A race around a ring board. Roll two dice, then either move **one runner by the total** or **two runners by one die each**. Shortcuts are faster but more dangerous. Landing on a lone enemy **captures** it. Each player secretly sets **traps**, owns one **shield**, can take **dares**, and gets **revenge** when captured. The board changes every few rounds and **remembers** what happened. First to bring **2 of 3 runners home** triggers a **final round**.

## 2. The board
A ring of **48 spaces** (numbered 0–47 clockwise) plus a private **final run** of 6 spaces per seat leading to **Home**.

| Space type | Count | Rule |
|---|---|---|
| **Entry / safe** | 6 | One per seat position. Runners here cannot be captured, blockades cannot form here. Unused seats' entries are still safe. |
| **Safe** | 6 | Cannot be captured. Both colours may share (max 2 per colour). |
| **Risk** | 4 | Landing here offers PLAY SAFE or 😈 DARE (§9). |
| **Hazard** | 6 | Marked. Used by SLIP, STORM and BLAST references. No effect by themselves. |
| **Trap-capable** | 16 (seeded) | The only spaces a trap can be placed on. |
| Plain | rest | |

**Seats** are spaced evenly: 2 players → entries at 0 and 24; 3 → 0, 16, 32; 4 → 0, 12, 24, 36; 5 → 0, 10, 20, 30, 40; 6 → every 8.
**A runner's lap:** it enters at its seat's entry space, runs **42 spaces clockwise** (relative positions 0–41), leaves the ring into its **final run** (relative 42–47), and reaches **Home** at relative 48. Reaching Home does **not** need an exact roll (passing it counts) — this avoids the classic "stuck on the last step" frustration.
**Final run** is private to the seat: nobody else can enter it, no traps there, no capture there. It is lit gold. Entering it shows **FINAL RUN**.

### Shortcuts (three, fixed shapes; the seed rotates where the set starts)
Positions below are ring offsets from the board's seeded "north"; they never overlap.

| Name | From → to | Main route | Shortcut | Gain | Special |
|---|---|---|---|---|---|
| **The Bridge** | 4 → 12 | 8 | 5 | 3 | 1 hazard space on it |
| **The Tunnel** | 16 → 26 | 10 | 5 | 5 | All 5 spaces trap-capable; no blockades inside |
| **The Rooftops** | 30 → 42 | 12 | 5 | 7 | Gate opens only if a runner **lands exactly** on its entrance, or while OPEN GATE is active |

A runner standing **on or passing** an entrance with movement left may **choose** shortcut or main route (a prompt on its owner's device; the table highlights both). Movement along the shortcut uses 1 step per shortcut space; on leaving it the runner's lap progress jumps by the main-route distance, so the gain is "free" progress.
Fairness: each lap passes all three entrances (the lap is 42 of 48 spaces), in a different order per seat. Shortcut shapes are identical for everyone.

## 3. Runners
3 per player, mechanically identical (colour + shape: ● red, ◆ gold, ▲ green, ■ blue, ★ white, ⬢ violet), each with a small personal marking. States: **Start area** (off board), **Ring**, **Shortcut**, **Final run**, **Home**.

## 4. A turn
1. **Roll** two dice (physical animation).
2. **Choose** how to use them (only legal options are shown):
   - **Sum:** move one runner by *a + b* (moves are made die by die; both steps must be legal; landing/passing rules apply at each step), **or**
   - **Split:** move runner X by *a* and runner Y (or the same one again) by *b* — in either order, **or**
   - **Enter:** use a die showing **4, 5 or 6** to bring a runner from the Start area onto its entry space (the other die can be used normally).
3. **Shortcut / Dare / Trap prompts** appear when they apply.
4. **Resolve** the landing space (capture, trap, risk, safe).
5. **Other players react** (one tap, optional).
6. **Double** (both dice equal): choose ONE bonus **[tune]**: *recover one used trap* **or** *+1 movement on any one runner*. (Not both; no extra turn.)
7. Turn passes.

**Nothing useful to do?** If no legal move exists, the player may **BANK**: gain 1 **Risk Token** (max 3). Risk Token = "reroll one die once per turn" or "disarm a trap (§7)". A player never passes with nothing: they bank, and the table shows "BANK +1".
**No frustration rule:** if a player has had no runner on the ring for 2 consecutive turns, their next entry needs only a **3, 4, 5 or 6** [tune].

## 5. Movement, capture, blockade
- A runner may stop on a plain/hazard/risk/trap-capable space that is **empty** or holds **its own colour** (max 2 own per space = **blockade**).
- **Capture:** landing exactly on a **single** enemy runner on a non-safe space sends it back to its owner's **Start area** and gives that owner **Revenge** (§10). A runner is never captured while on a safe/entry space, in a blockade, in a final run, or while **shielded**.
- **Blockade** (2 own runners on one space, not on safe/entry/final): enemies **cannot land on it or pass through it**; the attempt shows 🚫 BLOCKED and that die/step is simply illegal. Gold outline on the space.
  - **Anti-deadlock:** a blockade **dissolves** at the start of its owner's 3rd turn after forming (it becomes a normal pair). A player may not **re-form** a blockade on the same space for 2 turns. If the owner has **no other legal move**, they must move one of the pair.
  - A blockade also cannot be formed within 3 spaces *before* an enemy's entry space [tune] so it cannot lock a seat out of its own start.
- A runner can be forced to pass a lone enemy; passing never captures.

## 6. Shield (one per player per game)
- Armed **on your own turn, before rolling**, on one of your runners (free action). The runner shows a shield (public — everyone can see *who* is shielded, which is part of the tactics).
- It absorbs **one** capture **or** one trap effect, then breaks (visible cracked-shield tile "board memory").
- **Why pre-armed and not a "pop-up in the middle of someone else's turn":** it keeps online play fast and avoids waiting for another player's reply (see decision 1).

## 7. Traps — the signature mechanic
Each player has **3 traps** per game [Mayhem: 5]. **Placing** is a free action on your own turn, before or after the roll, but at most **one per turn**:
- Choose a **trap-capable** space that is empty, not within 2 spaces *ahead of an enemy runner* **[tune]**, and not already trapped; choose the **type** (private device).
- Your private device shows your traps (type + place). Everyone else's table shows only: **"a trap was set in the (Bridge / Tunnel / Rooftops / sector 3)"** — the **region** and a counter, never the exact space or type or owner.

**The six traps** (each is a one-shot; after firing it leaves a revealed mechanism on the board):

| Trap | Effect on the runner that lands exactly on it | Tell (public clue) |
|---|---|---|
| 🪤 **SHOCK** | Thrown back **3** spaces. | Tiny sparks on the space when a runner is within 2 behind it. |
| 🌀 **SLIP** | Slides **forward to the next hazard space** (usually 3–7). No second trap fires; it is revealed. | Floor shimmers / faint tilt. |
| 🔀 **DETOUR** | The track rotates: the runner is carried back to the **previous junction** (nearest shortcut entrance or sector gate behind it, 4–8 spaces). In a shortcut: thrown back to its entrance. | A visible mechanical seam in the board. |
| 💣 **BLAST** | Sent back to the **nearest safe space behind** it (never to Start). | Subtle vibration of the space. |
| 🧲 **MAGNET** | Pulled up to **4** spaces toward the nearest runner (any colour) within 6; if it lands on a lone enemy that is a **capture**, on an ally it forms a pair. | Metallic hum + a faint pull on nearby runners. |
| 🎭 **DECOY** | Nothing. The runner (and everyone) only learns this when the animation ends with a click. | **No tell.** |

- **Reading the board:** a tell shows on a trapped space when *any* runner stands within 2 spaces behind it. If the table knows "there is a trap in the Tunnel" and a runner has walked up to it and **nothing** appears, it was probably a decoy — attentive players are rewarded.
- **Anyone's** runner triggers it, including its owner's ("OOPS" — stat and achievement).
- **Play safe:** at a junction the owner of the runner may take the long way round instead of a shortcut region with traps.
- **Disarm:** spend **1 Risk Token** to defuse a space within 2 ahead of one of your runners **where a tell is visible**. It is removed and its type revealed. (Cannot disarm a space without a tell — keeps decoys meaningful.)
- **Shield** absorbs the trap effect (the trap is still used up and revealed).
- A trap never captures by itself (except MAGNET's pull landing), and effects never push a runner onto an enemy: if the target is occupied, it stops on the next free space.

## 8. Shortcuts and traps together
The Tunnel is the fast, dangerous route: every one of its spaces can hold a trap. The brief's rule "never obviously bad": the Tunnel gains 5 spaces for the price of up to a few hidden traps; the Bridge is the mild option.

## 9. Risk spaces and 😈 DARE (4 on the board)
Landing exactly on a risk space: **PLAY SAFE** (nothing happens) or **DARE**. A dare rolls one hidden die **d6** (shown on the table, tension beat):

| d6 | Result |
|---|---|
| 1 | Backfire: thrown back 3 (shield absorbs). |
| 2 | Nothing. |
| 3–4 | **+3** bonus movement for that runner (may chain into a capture). |
| 5 | **Shield:** recover your shield if used, otherwise +1 Risk Token. |
| 6 | **Jackpot:** jump to the exit of the next shortcut ahead (free). |

4 of 6 outcomes help, 1 hurts mildly, 1 is neutral: tempting, never a free win. Each risk space can be dared once per runner per lap.

## 10. Revenge
When your runner is captured: **REVENGE vs the capturer** is set (shown on your device and as a small red mark next to your avatar). The **next time you capture a runner of that player** (within 4 rounds), choose **one**: *recover one used trap* / *+2 movement on any runner* / *recover your shield*. **Only one Revenge is active at a time** (a newer capture replaces the older). Capturing many times does not stack it. No other rewards, no rubber-banding.

## 11. Board events (every 4–6 rounds, Classic)
- A **WARNING** appears one round before: *"⚠️ SYSTEM EVENT IN 1 ROUND"* with the event name.
- Exactly one event is active at a time, lasting 1–2 rounds. Classic uses: 🌪️ **Storm** (landing on a hazard space = back 2), 🚪 **Open Gate** (the Rooftops gate opens for everyone, 2 rounds), 🔒 **Lockdown** (one shortcut closes for 2 rounds; runners inside finish it), 🌑 **Blackout** (tells disappear for 1 round).
- Mayhem adds ⚡ **Overcharge** (dare results 5–6 become jackpot) and 💥 **Collapse** (two main spaces permanently become hazard spaces).
- Event order comes from the game **seed** and is not random per turn.

## 12. Board memory
Triggered traps leave a revealed mechanism (type icon, scorched or sparked); a blast leaves a cracked tile; opened gates stay visibly open; collapsed spaces stay changed; a broken shield leaves a mark. By the end the board shows what happened.

## 13. Winning
- Bring **2 of 3 runners Home** → **FINAL ROUND**: every *other* player gets exactly one more turn; whoever then has the most runners Home wins; ties → the one with the furthest-advanced third runner; still tied → shared victory (both celebrate).
- Victory is shown in ≈4–5 s; **PLAY AGAIN** is the primary button immediately after.

## 14. Modes (initial release only)
- **Classic Gauntlet:** rules above, 3 traps, events every 5–6 rounds.
- **Mayhem:** 5 traps, 4 shortcut-region trap-capable spaces more, events every 4–5 rounds.
- **Chaos:** events every 3 rounds, Dare odds slightly riskier. (Experienced players.)

## 15. Information & authority (honest note)
- **Public:** board, runners, dice, shields, pairs/blockades, trap *region counters*, revealed mechanisms, events, Revenge marks.
- **Private (own device only):** where your traps are and their types, your Risk Tokens, upcoming personal prompts.
- **Authority:** like Liar's Dice and Flower or Skull, the shared room row holds the full state; the game logic is a set of **pure functions** (legality, resolution) that every device runs and that reject illegal moves, so honest play is guaranteed and honest mistakes cannot corrupt a game. A technically skilled cheater could still read the hidden trap data from the room (no server code exists in this app). This is the same trust level as the existing hidden-information games.
- **Play Together (one device, 2–6 people, any mix of humans and bots)** — decided with the owner: fully supported. Until traps exist (Phase C) nothing is secret, so it just works. From Phase C on, anything private (placing a trap, viewing your own traps) happens in a **🔒 Secret panel** behind a hand-over cover ("Hand the device to Anna — everybody else look away"), shown only when that player chooses to open it; the shared table never shows private information. Bots keep their traps internally.
- **Online (private devices):** each player uses their own phone/tablet; private information is shown only on that player's device.

## 16. Pacing check (arithmetic)
Average roll = 7 pips per turn. 2 runners × 48 steps = 96 pips ≈ 14 turns, plus entering and set-backs ≈ 17–19 turns per player. At ≈ 13–15 s per turn (decision 5–8 s, movement 2–4 s, resolve 2–4 s): **4 players ≈ 17–19 min; 6 players ≈ 27 min** (slightly over — tunable by shortening the ring to 40 for 5–6 players).

## 17. Edge cases (decisions already made)
- Cannot move at all → BANK (+1 Risk Token, max 3).
- Only one legal die usage → the other die is forfeited (shown).
- Two enemies on one space: only possible on safe spaces; no capture there.
- A move that would end on an own blockade (3rd runner) is illegal.
- A runner shocked/slipped onto a safe space is simply safe there.
- Trap on a space that becomes a blockade space: the pair triggers it only if one runner *lands* there (the trap fires on the lander, the other runner is unaffected).
- Disconnected player: after 20 s the existing "skip" button appears; an away player's turn is played by a simple bot move (no traps placed, no dare, no shield use).
- Reconnect: state is the room row; private info is restored from it.
- Game restart / rematch: same players, new seed.

## 18. Presentation (what must be spectacular)
Dice that roll, bounce and settle; runners that hop with weight; capture = *land, thunk, 1-second pause, impact, runner flung back with a particle trail, board shudders, "CAPTURE!"*; each trap has its own animation (sparks / tilt-slide / rotating track / pressure wave / pull / soft click); shortcuts unlock with a mechanical sound; FINAL RUN glows gold; board events announced with a warning; victory: pause, winners' runners light, gold light, push-in. Everything respects "reduced motion". Sound: dice clatter, wood/metal clicks, low impacts; no cartoon boings.

## 19. Statistics, moments, achievements (compact)
Stats: games, wins, captures, traps triggered/survived, shortcuts taken, dares won, biggest comeback, fastest win. Moments are generated from the event log ("Philippe won after taking the dangerous tunnel in the final round"). Achievements (rare, humorous): Trap Master, No Mercy, Survivor, Revenge Is Mine, High Roller, Dangerous Route, Oops.

## 20. Build plan (phases — each is playable and pushed only after your OK)
| Phase | Contents | Size |
|---|---|---|
| **A — The race** | Board, 2 dice, enter/move/split, capture + animation, safe spaces, blockades, final run, 2-of-3 + final round, bank/risk tokens, bots (Gentle/Sharp), online + vs-bot, results, tests | large |
| **B — Choices** | Three shortcuts, risk spaces + Dare, shield, Revenge | medium |
| **C — Traps** | Six traps, private placement, region counters, tells, disarm, board memory | large |
| **D — The living board** | Events + warnings, modes, Moments/stats/achievements, interactive tutorial, sound polish, cover | medium |

## 21. Open decisions for you
1. **Shield:** pre-armed on your turn (public, fast — my recommendation) or reactive pop-up on the victim's device when hit (more dramatic, but the game must pause and wait for that player).
2. **Trap visibility:** table shows only the **region** and a counter (my recommendation: clues + deduction), or the exact space is shown with only the *type* hidden (easier, less mystery).
3. ~~No hot-seat~~ **Decided: both modes** — online with private devices AND Play Together on one device (humans and/or bots), with a privacy cover for secret actions.
4. **Capture sends the runner back to the Start area** (classic, spec) — OK, with the no-frustration entry rule (§4)?
5. **Build order:** start with Phase A only, and have you play it before B–D?

## 22. Phase B as built (choices, shield, dare, revenge)
Where the build differs from or fills in the text above:
- **Shortcut lanes** have **4 spaces** and cost **5 steps** (entrance → 4 spaces → exit), so the gain is *main route − 5* (Bridge 3, Tunnel 5, Rooftops 7). Positions are fixed per player count (`GT_SC_AT`), found by a search so that every seat's 42-space lap contains all three entrances and the total gain per seat is nearly equal. A shortcut whose exit lies **beyond a seat's last ring space** carries that runner into its **final run** (or home) — e.g. with 6 players the Rooftops from rel 41 ends at home.
- Passing/standing: the choice is offered whenever a step starts on an entrance. **Rooftops gate:** only for a runner that *stands* on the entrance at the start of its action (or while the future Open Gate event is on).
- **Lanes are shared and capturable**: a single enemy in a lane space is captured by landing exactly on it; a lane space holds at most two runners (no blockade effect); a blockade on the *exit* space blocks the shortcut.
- **Risk spaces** (4, fixed per player count `GT_RISK`) open DARE / PLAY SAFE for a runner that *stops* there; each runner may dare each space once per lap (reset on capture/entry). Dare results as in §9; **5** restores a used shield, otherwise +1 Risk Token; **6** jumps to the exit of the next shortcut ahead (fallback +6 steps); **3–4** and the fallback move by the main route and never open another dare.
- **Shield**: armed before the roll on a runner on the ring/in a lane; public; a landing on a shielded runner **captures nothing, the shield breaks, and both runners share the space** (so a third runner can't land there); also absorbs a dare backfire; handed back unused when the runner enters its final run.
- **Revenge**: set for the victim against the capturer (valid 4 rounds, one at a time, shown with 😡 in the standings). Capturing back opens the choice **+2 steps** (a bonus move for any runner) or **restore the shield** (only if it was used). *Recover a trap* arrives with Phase C.
- Open questions (dare, revenge) are part of the game state (`gt.pq`), so an online room, a bot and an away-player auto-move all handle them; an away player never dares.

## 23. Phase C as built (secret traps)
- **Board:** 6 hazard spaces (`GT_HAZ`, yellow stripes) and 16 trap-capable spaces (`GT_TCAP`: 12 on the ring, marked with a four-rivet plate, plus the 4 Tunnel lane spaces). Fixed per player count, chosen by a search for an even spread (not "seeded per game" — simpler, and the board stays learnable).
- **Placing:** free action, one per turn, before or after the roll, never while a question is open. Allowed on an empty trap-capable space that has never held a trap (a spent trap stays as a memory) and is not within 2 spaces ahead of an enemy runner (nor the first two Tunnel spaces when an enemy stands on its entrance). 3 traps per player (Mayhem 5).
- **Public information:** the *region counters* (the Tunnel, or the north-east / south-east / south-west / north-west quarter of the ring) as a strip under the prompt; **tells** drawn on a trapped space when any runner stands within 2 spaces behind it (⚡ sparks, 〰 shimmer, ⚙ seam, ≋ vibration, ∩ hum; a decoy has none; `gt.blackout` will switch them off in Phase D); **revealed mechanisms** (board memory) for fired (🔥 ring) and defused (dashed ring) traps.
- **Private information:** where each trap is and its kind live in `gt.traps` (so the room row holds them — the honest-trust note in §15). They are shown only in the **🔒 secret panel**: online on the player's own device (their armed traps are also marked on their own board); on one shared device behind a **hand-over cover** ("Hand the device to Anna. Everybody else: look away.") — skipped when only one human sits at the device. The shared table never draws anything private.
- **Effects** (fire when a runner *stops* exactly on an armed trap — anybody's, including the owner's; passing does nothing; displaced runners trigger nothing): Shock back 3 · Slip forward to the next hazard (no hazard ahead: +3) · Detour back to the previous junction (a shortcut entrance or one of the four sector gates at 0/12/24/36; in a lane: to its entrance) · Blast to the nearest safe space behind · Magnet up to 4 spaces toward the nearest runner within 6 (onto an ally: a pair; onto a lone enemy: a capture; ring only) · Decoy nothing. A displacement never ends on an enemy on an ordinary space (it stops on the next free space further back/on). A shield absorbs the whole effect (the trap is still spent).
- **Defusing:** 1 Risk Token, a trap with a visible tell within 2 spaces ahead of one of your own runners; it is revealed as defused. **Recovering a used trap:** instead of the +1 step of a double, or as a Revenge reward.
- **Bots** lay traps before they roll (Sharp aims at the spaces 3–10 ahead of enemy runners), defuse visible traps now and then, steer clear of their own traps and of tells, and think ahead on a copy of the board **without the other players' hidden traps**.
- Pacing check: with traps on, a bot game takes about half a round to one round longer (≈16 rounds against ≈15).

## 24. Phase D as built (the living board)
- **Events** (`GT_EVENTS`): 🌪️ Storm (2 rounds; a runner that *stops* on a hazard space is thrown back 2 — weather, a shield does not stop it) · 🚪 Open Gate (2; the Rooftops are open to passing runners too) · 🔒 Lockdown (2; one shortcut, chosen by the seed, cannot be entered, runners inside finish it) · 🌑 Blackout (1; no tells) · ⚡ Overcharge (2; a dare that rolls 5 or 6 is a jackpot, the die still shows what was rolled) · 💥 Collapse (1; two ordinary spaces become hazards for good, drawn cracked).
- **Timing** comes from `gt.seed` (a plain LCG stored in the state, so every device and every replay agrees): the first event after 5–6 rounds (Classic), 4–5 (Mayhem), 3 (Chaos); the next is scheduled when one ends, never the same twice in a row. A **warning** (`⚠️ SYSTEM EVENT IN 1 ROUND`) appears one round before; the running event has a banner with its rounds left. Events tick when a round begins (`gtEndTurn` → `gtTickEvents`) and ride on the last action's `fx.ev` so the other devices announce them.
- **Modes** (`GT_MODES`, picked before the game — by the host online — in the setup screen like Chain Reaction's version): Classic (3 traps, 4 events), Mayhem (5 traps, the Rooftops' 4 spaces are trap-capable too, all 6 events), Chaos (events every 3 rounds, a dare roll of 2 backfires too).
- **After the game:** the history row stores what each player did (`stats.gt[name]`, plus the mode); the results screen shows a small table (captures, shortcuts, dares, traps set, runners caught by their traps); 8 trophies (Off the Starting Pad, Trap Master, No Mercy, Survivor, Revenge Is Mine, High Roller, Dangerous Route, and the secret Oops).
- **Not built, on purpose:** an *interactive* tutorial (the quick tour — now 9 slides — and the rules cover it) and the cover picture (needs an image from the owner).

## 25. The living board — animations (`gtAnim()` = Full / Light / Off)
Chosen with the ✨ button at the bottom of the panel (`ct_gt_anim`); the iPad's reduced-motion setting turns everything extra off. Off keeps only the core motion (dice, hops, capture, banners).
- **Turn:** the runners of the player on turn pulse with a halo (Full, Light); when the turn passes, a ring of the next player's colour sweeps across the board.
- **Shortcuts:** the lane lights up in its own colour under the runner, sparks follow every step, a flash marks the exit; the Tunnel darkens the rest of the board while a runner is inside (Full).
- **Weather:** Storm = rain and flickering lightning (Full) plus rings round the hazards; Blackout = a dark veil with a soft flashlight round every runner (Full; Light has a plain veil); event starts get a show — lightning flash, gate rings, a red lane flash and shake for Lockdown, bolts on the risk spaces for Overcharge, debris and a shake for Collapse, an amber edge flash for a warning.
- **Traps:** each kind has its own show — Shock sparks and bolts, Slip ripples, Detour a turning seam, Blast a shockwave with debris and a shake, Magnet an inward pull, Decoy a harmless "pop!"; a shield-absorbed trap shows a blue ring. The tells move too (sparks flicker, shimmer, a turning gear, a vibration, a pulling ring).
- **Life while waiting (Full):** runners bob (each at its own phase), the hub's gears turn, the 😈 tiles blink now and then, the safe tiles shimmer.
- **Entering and arriving:** a runner brought onto the board drops in from above with a puff of dust; a runner reaching Home leaps into the hub with a flash and sparks, and the **hub rim** — one segment per runner of each player — lights up in the player's colour.
