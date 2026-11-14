# WORDSPIN — implementation report

A wheel-and-word game for 2–4 players (local on one device, against bots, or online on separate devices). Original look and name.

## Rules as built
- **Wheel:** 24 fixed wedges — points 250–1000, 2 × BANKRUPT, LOSE A TURN, FREE PLAY, WILD.
- **A turn:** spin; a point wedge means name a consonant (wedge value × number of tiles). A wrong letter, a wrong vowel or a wrong solve passes the turn.
- **Vowels** cost 250, paid from the *round* score.
- **BANKRUPT** clears only the current round score (banked totals are safe) and passes the turn.
- **FREE PLAY:** any letter, a wrong one costs nothing. **WILD:** any letter at 500 per tile, a vowel is free.
- **Solving** ignores case, spaces, punctuation and accents. Only the round winner banks (at least 500).
- **Rounds:** 2, 3 or 4, then the bank leader plays the **final puzzle**: R S T L N E are given, 3 more consonants and 1 vowel, then a 5 second get-ready moment (the keyboard opens by itself, autocorrect off) and 60 seconds on the clock, +5000 if solved. In the final one slip (a wrong, missing or extra letter) is forgiven from 12 letters up and two from 25 letters up; the normal rounds stay exact. (Changed 2026-11-14: typing on an iPad against 30 seconds was too hard.)
- **Puzzle level:** Mixed, Easy, Medium or Hard (chosen before the game; the host online).
- **Language:** English or Deutsch, chosen before the game (the host online) and stored in the game state, so every device shows the same language. German: Ä Ö Ü are letters of their own and count as vowels (250), ß is read as SS, answers may be typed with AE OE UE; all WORDSPIN buttons, hints, banners, results and the rules page are German (the rest of the app stays English).

## Where things are
- **Engine (pure, no screen code):** `ws*` functions in `CardTableV17_2fixed.html` — `wsNew`, `wsApply`, `wsBotAct`, `wsLayout`, `wsNorm`. One action per call, every call returns a record (`ws.fx`) of what happened so any device can replay it.
- **Puzzle libraries (data only):** `wordspin-puzzles.js` (230 English) and `wordspin-puzzles-de.js` (1146 German), 11 categories, 3 difficulties each; both listed in `sw.js`. The texts on screen are in `WS_TX` (en / de).
- **Wheel result:** drawn once from the game's own random stream (`ws.rng`, seeded in the state) inside the room update, and stored as wedge + final angle. Every device animates to the same angle.
- **Screens:** `rWordspinTable`. Per-device choice: everything / the stage only / my controls.
- **Local:** `lDealWordspin`, `wsDoLocal`, `botWordspinAct`, `wsEndLocal`. **Online:** `oWsDo`, `oWsFinish`, `oWsAuto` (away players), start and rematch in `oStartGame`.
- **Presentation:** intro overlay, rAF wheel with tick sounds and pointer flick, tile flips, score count-up, Full / Light / Off animations, haptics through the existing `SFX`.
- **Extras:** results card, 4 trophies, how-to-play tour, family-history entry with per-player stats, cover `assets/games/wordspin.jpg`.

## Tests (tests.html)
Puzzle library (size, variety, fits the board, no duplicates), wheel (24 wedges, same seed = same spin, pointer lands on the chosen wedge), consonant scoring, wrong letters, BANKRUPT, LOSE A TURN, FREE PLAY, WILD, vowels, solve spelling, turn order, rounds, the final puzzle (clock, retries, timeout, prize), 80 bot-only games, online with the fake database (room, host-drawn spin, away player, end, lobby start, rematch), a local game played through the real buttons, wiring and the screen choice.

## Not done
- Not yet played on real devices.
- The stage backdrop and textures from the first picture sheet are not used (the sheet was never saved as a file).
- Nothing known; every WORDSPIN text exists in English and German.
