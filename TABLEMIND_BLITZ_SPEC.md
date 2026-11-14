# TABLE MIND — Act III "DER BLITZ" (buzzer act): rules, scoring and edge cases

Status: PHASE 1 RULES ACCEPTED (owner delegated D1-D7 on 2026-11-14: all taken as proposed). Nothing of this is built yet.
Decided so far (owner + ChatGPT review): Variant 2 "Der schrumpfende Preis" as the new Act III, the Hunt becomes Act IV; Golden Feather and Chaser warning are part of the same programme; NO show modifiers, adaptive difficulty, buzzer duel or statistics; player bets ("Ich setze auf dich") maybe later.
Principles: premium TV-show feel, lean screen (Wiz, question, four prize levels, avatars/scores, big buzzer zones, nothing else), emotions through Wiz, simple rules, fairness first, the adult keeps a small edge (target 55–60 % adult / 40–45 % child, a goal to test, not a guarantee).

## 1. Place in the game
Act I Der Aufstieg → Act II Die sechs Welten → **Act III Der Blitz (new, about 3–4 min)** → Act IV Die Jagd.
Internal numbering: the Hunt stays `tm.act === 3` inside the engine (old rooms, tests and saved results keep working). The new act is a separate phase family `tm.blitz` that runs between the last Act II reveal and `tmOpenOffer`. Only the displayed names change (TM_ACT_NAMES / title card: "AKT III · DER BLITZ", "AKT IV · DIE JAGD").
Money won in the Blitz is ordinary banked money (`tm.bank`). No seals, shields or head starts for the Blitz winner. Maximum 12,500 per game; Act I is worth up to about 28,000, a seal 4,000, a Hunt offer 10,000–30,000.

## 2. The rules in words a child understands
"A question appears piece by piece. The sooner you know the answer, the more money it is worth. Slap your buzzer when you know it, then pick the right answer. If you are wrong you lose a little money and somebody else may steal the question."

## 3. One question, step by step (target 35–40 s)
| Time | What happens |
|---|---|
| 0–2 s | Studio goes dark, Wiz looks tense: "Auf die Plätze …". Buzzers are dark and locked. |
| 2 s | Stage 1: clue 1 appears. Prize 2,500. Buzzers light up and are active. |
| +3.5 s | Stage 2: clue 2 appears. Prize 2,000 (the number drops with a falling note). |
| +3.5 s | Stage 3: clue 3. Prize 1,500. |
| +3.5 s | Stage 4: clue 4 (makes the answer unmistakable). Prize 1,000. |
| +4 s | If nobody has buzzed: the question expires, Wiz shrugs, the answer is shown (0 €). |
| buzz | The first valid buzz freezes the clues and the prize ("current prize"). Other buzzers go dark. The buzzing player sees the four answers (Leicht: two removed) and has **7 s** to tap one. |
| right | Player gets the current prize. Wiz reacts. Next question. |
| wrong or no answer in 7 s | Player loses **500** (floor: bank never below 0). **Steal window: 5 s** for the others (all remaining players may buzz, the first valid buzz wins). |
| steal right | 50 % of the *current prize at the first buzz*, rounded to 50. |
| steal wrong | −250 (floor 0). The question ends, the answer is shown. One steal attempt only. |

A question takes about 25 s when somebody buzzes early, 35–40 s with a steal. Five questions ≈ 3–4 minutes. If the act runs past 4:30 the remaining questions are dropped.
Prize ladder is shown as four small chips (2,500 / 2,000 / 1,500 / 1,000), the current one lit.

## 4. Handicap (existing Leicht / Normal / Schwer)
* Leicht: after buzzing, two wrong answers are removed; full prizes.
* Normal: four answers; full prizes.
* Schwer: all amounts ×0.75, rounded to the nearest 50: prizes 1,900 / 1,500 / 1,150 / 750, wrong-answer penalty 400, wrong-steal penalty 200; shown to that player. **Open decision D1.**

## 5. Buzzing rules
* A buzz counts only if the pointer goes DOWN after the buzzers became active. A finger already resting on the screen does not count.
* False start (touch while locked): that player's zone stays locked for the rest of THIS question, no money lost. No escalation across questions (kept simple). **Open decision D2.**
* The first valid buzz locks all other zones at once. Zones are equal in size and sensitivity.
* A player who has already given a wrong answer on this question cannot buzz again on it.
* A buzz needs a lifted finger before the next question starts (zones re-arm on pointer-up or on the next question).

## 6. Hot-seat on one device
The iPad lies flat in the middle of the table. It must NOT be handed over during the act (Wiz says so once in the intro card).
Zones: 2 players = top half (rotated 180°) and bottom half; 3 players = bottom, left, right; 4 players = four edges. Each zone is a large area (about 20 % of the screen), not a small button. The question, the clues and the prize chips sit in the centre.
First valid pointerdown wins by `event.timeStamp`. A dead heat (same millisecond) goes to the player with the lower total standing (bank + seals); then to the lower seat number.
With one human and bots: the human uses the bottom zone, bots buzz on their own timers (section 8).

## 7. Online (each player on their own device)
Architecture stays as it is: one shared room row, writes are compare-and-swap (`room_cas`), the first successful write wins.
* The question opens with a start time `t0` written into the room state by the host; devices light their buzzers when their clock reaches `t0` (clocks are only used for the clue timeline and the 7 s / 5 s limits, never to decide who was first).
* A buzz is an atomic conditional write: "set `blitz.claim = {seat, q}` only if `blitz.claim` is still empty for question `q`". The database decides the order; the loser's write fails and that device shows "zu spät".
* All devices show the same winner. Wording: **"Buzzer gesichert!"** (we do not claim to know who was physically fastest).
* No tie window, no latency compensation.
* A small connection check before the act (round trip of a harmless write). If a device is slow, Wiz warns that player once before question 1.
* The 7 s answer limit and the 5 s steal window are deadlines in the room state; any device may advance the game after a deadline (as today, host first, others after a grace time).

## 8. Computer players
Each question: the bot decides once whether it "knows" the answer: probability = skill (gentle .52, sharp .76) adjusted by −0.07 per difficulty step above 3, +0.07 below. If it knows, it buzzes in a stage drawn from: gentle (stage 1: 10 %, 2: 25 %, 3: 35 %, 4: 30 %), sharp (stage 1: 30 %, 2: 35 %, 3: 25 %, 4: 10 %), plus ±0.8 s random delay. If it does not know it still gambles with probability 8 % (gentle 15 %) and then answers wrong. A bot never buzzes before the clue it "needs" is shown and obeys lockout, penalty and steal rules like a human. Bot steals: same logic with half the probability. Reaction times and wrong-buzz rates will be tuned in play-tests. **Open decision D3.**

## 9. Wiz as showmaster (existing poses only)
| Moment | Pose | Line |
|---|---|---|
| Act intro | tense | "Auf die Plätze …" |
| Early buzz, right | smug | "Das ging schnell!" |
| False start | smug | "Hoppla! Zu früh!" |
| Wrong first answer | sad | "Oh nein! Zu früh gewagt!" |
| Successful steal | applause | "Was für ein Reflex!" |
| Nobody buzzes | sleepy | "Niemand? Wirklich?" |
| Act ends, last place | hope | "Noch ist alles drin!" |
Not every event gets a line; sometimes only the pose.

## 10. Sound, light, haptics
Sounds: studio intro, metallic tick per clue, falling note when the prize drops, sharp pulse when buzzers arm, bright sting (right), short descending tone (wrong), brass accent (steal). Light: the pressed zone lights up, the others darken, money flies to the winner's plate. Vibration is optional only (Safari on iPad does not support it); sound and light carry every message.

## 11. Question library for the Blitz (separate from the 812)
About 100 questions. Fields:
`[cat 0–5, difficulty 2–4, scope E/I, clue1, clue2, clue3, clue4, right, wrong1, wrong2, wrong3, explanation]`
Rules for clues: German; each clue at most 80 characters; clue 1 is broad but meaningful and fits at least three of the four answers; clue 2 narrows; clue 3 gives a strong identifying feature; clue 4 makes the answer almost unmistakable; no clue contains the answer or a form of it; all four answers stay plausible until clue 3; reading time of one clue under 3 s. Mix: 20 % level 2, 50 % level 3, 30 % level 4; about 17 per category; about 75 % European. Separate "seen" memory `ct_tm_seen_blitz`, rolling like the main one. Each question is reviewed twice (facts, clue order).
Examples:
* Eiffelturm: "Es ist ein berühmtes Bauwerk aus Eisen." / "Es wurde für eine Weltausstellung gebaut." / "Es wurde 1889 fertig und war lange das höchste Bauwerk der Welt." / "Es steht an der Seine in Paris und ist rund 330 Meter hoch." Answers: Eiffelturm, Big Ben, Brandenburger Tor, Schiefer Turm von Pisa.
* Nil: "Dieser Fluss gehört zu den längsten der Welt." / "Er fließt von Süden nach Norden." / "Er mündet in einem großen Delta ins Mittelmeer." / "Ohne ihn gäbe es in Ägypten kaum Landwirtschaft." Answers: Nil, Amazonas, Kongo, Niger.
* Beethoven: "Er wurde 1770 in Bonn geboren." / "Er schrieb neun Sinfonien." / "Er wurde im Laufe seines Lebens fast taub." / "Seine Neunte enthält die „Ode an die Freude“." Answers: Ludwig van Beethoven, Wolfgang Amadeus Mozart, Joseph Haydn, Franz Schubert.

## 12. Golden Feather (comeback, part of Act IV)
* After the Blitz the player in last place gets one feather. Measure: total standing = bank + 4,000 per seal (what the final score uses before the Hunt). Tie for last: the one with less banked money; still tied: nobody. **Open decision D4.**
* In the Hunt the owner can arm the feather before a question (one tap on a feather icon). It stays armed through wrong answers (not used up) and is consumed by the first RIGHT answer: that answer moves the runner **one extra field** (so two). It cannot move a player beyond the top (reaching the top is a normal escape), and it cannot undo a capture that was already decided: order is runner moves (with the feather), then the Chaser moves. It is not a shield and cannot be combined with a shield for the same move. **Open decision D5.**

## 13. Chaser warning (Act IV)
The Chaser's move is already rolled when the question opens (`tm.ch`). When that roll is a DOUBLE step the Chaser's picture gets red glowing eyes and the lane border flickers red during the whole question, before anybody answers. No warning for 0 or 1 steps (so the absence of a warning does not give anything away about a stop). The roll and the random stream stay exactly as they are.

## 14. Edge cases (to be covered by tests before the next phase)
1. Two devices buzz in the same instant (online): exactly one atomic write succeeds; the other shows "zu spät"; both devices show the same winner after the next sync.
2. Two players tap the same millisecond (hot-seat): lower standing wins, then lower seat.
3. The buzzing player closes the tab or loses connection: after 7 s the answer counts as wrong (−500), the steal window opens. If that player is gone for good the existing "away" handling applies to later questions (their buzzer is skipped, bots do not take over).
4. A player leaves the room during the act: their lane is dropped; if only one player remains the act ends and the money so far stays.
5. All players wrong: question ends, answer shown, 0 for others.
6. Nobody buzzes: question expires after the final clue plus 4 s.
7. A steal window with only one other player who is locked out (false start earlier on this question): window skipped.
8. A player with bank 0 gets a penalty: bank stays 0.
9. Last question of the act: transition to the offer screen of the Hunt; the feather appears there.
10. Old saved rooms from before the Blitz: `tm.blitz` is absent → the game goes straight from Act II to the Hunt as before.
11. Handicap: Leicht removes the two wrong answers only when the player buzzes (not shown to others); Schwer scales amounts.
12. Questions are never repeated within a match; the shared question stays identical for everybody.

## 15. Decisions D1-D7 (accepted as proposed on 2026-11-14)
* D1 Schwer: scale penalties too (my proposal: yes, ×0.75).
* D2 False start: lock for this question only (my proposal) versus also next question.
* D3 Bot numbers: accept the starting numbers above and tune in play-tests.
* D4 "Last place" measured by bank + seals (my proposal) versus bank only.
* D5 Feather: armed by the player, not used up by a wrong answer (my proposal).
* D6 Number of questions: always 5, also with 3–4 players (my proposal).
* D7 Hot-seat zones for 3–4 players as described (bottom/left/right, four edges).

## 16. Build phases and exit criteria
1. Rules and scoring in the pure engine (`tmBlitz*`), with tests for every edge case above. Exit: all tests green, a balance simulation over 2,000 games shows the Blitz winner wins the whole game less than about 60 % of the time and a comeback is possible.
2. The 100-question clue library, reviewed. Exit: format check passes (lengths, no answer in clues, 4 distinct answers).
3. Hot-seat screen: zones, clue reveal, answer panel, Wiz, sounds. Exit: played at 834×1112 and on a laptop; no scrolling; one message per situation.
4. Online: atomic claim, deadlines, connection check. Exit: two real browsers on a real room, 5 questions, state identical on both; forced simultaneous buzz tested.
5. Computer players tuned.
6. Golden Feather and Chaser warning.
7. Family play-test on the iPad, then balance tuning.

## 17. Phase 1 results (2026-11-14)
Built: `tablemind-blitz.js` (pure rules, switched off by default via `tm.blitzOn`), `tablemind-blitz-questions-de.js` (60 questions so far), 38 node checks plus two suites in `tests.html`.
First balance simulation (3,000 acts, two players, crude model: a strong player knows 76 % of the questions and buzzes early, a weaker one knows 52 % and waits):
* equal players: 48.9 % / 46.4 % (balanced);
* strong versus weak: the strong player earns more in about 85 % of the acts (6,400 versus 2,200 on average);
* with Schwer for the strong and Leicht for the weak player, flatter prizes (2,000 down to 1,250) and both together it is still about 78-80 %.
Meaning: the act rewards knowledge AND speed at the same time, so a big skill gap snowballs. This is below the family goal (adult about 55-60 %). The model does not yet reflect that Leicht lets a player answer safely after buzzing earlier. Options to test next (phase 5): no wrong-answer penalty for Leicht players; a 50 % smaller penalty for the player behind; steal for the player behind pays full prize; a catch-up bonus of +250 per right answer for the player in last place. Decide after the hot-seat prototype is playable, with real play-tests.

## 18. Phase 3 results (2026-11-14): hot-seat screen built
`tablemind-blitz-ui.js`: big buzzer zones on each player's edge (2 players top/bottom, 3 players bottom/left/right, 4 players four edges, text turned toward the player), clues appear one by one with their prize in the same row, answer panel turned toward the answering player, countdown bar, Wiz as showmaster, sounds, zones show money and the +/- of each question, computer players (plans per question, gentle/sharp), seen-question memory `ct_tm_seen_blitz`. Switched on for hot-seat games only (`tmNewGame(n,true)`); online games skip the act until phase 4. Act numbers on screen: Blitz is Act III, the hunt Act IV. A scripted full act (5 questions, four players, two computer players) ran to the hunt offer without errors; looked at on an iPad-sized and a narrow screen. Not yet done: Golden Feather, Chaser warning, online play, tuning of the computer players, family play-test.
