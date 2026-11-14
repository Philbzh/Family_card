# TABLE MIND – DER BLITZ: real-room test plan (online)

Purpose: close the gaps from the spec (sections 16 and 19): the online Blitz has only been tested against a simulated room. This plan tests it on real devices, a real Supabase room and a real network.
Time needed: about 45 minutes. People: 2 testers minimum (3 is better: you plus the two kids).

## 0. Before you start

* App address: https://philbzh.github.io/Family_card/
* Every device must run the **same, newest build**. The version is shown at the bottom of the home screen ("Our Table · version N"). Expected: **448 or higher**. If a device shows a lower number, close the app completely and reopen it (on iPad/iPhone: swipe the app away, reopen). Do not test with an old version: an old device cannot play a room that contains the Blitz.
* Use at least **two different devices** on **different connections** if possible (for example iPad on Wi-Fi, phone on mobile data). One device with two browser tabs does NOT count for tests 2 and 5.
* One person keeps notes (use the table at the end). Write down the build number, the device, the browser and the connection of each tester.
* Start a TABLE MIND game with **Blitz on** (it is on by default). Choose any handicap. Note the room code.
* **Test overlay (build 450 or higher):** open the app on every test device ONCE with `?debug=1` at the end of the address, for example `https://philbzh.github.io/Family_card/?debug=1`. A small "DBG" pill appears at the left edge, halfway down. Tap it to open the panel: build, room, seat, how long ago the last news from the room arrived, the longest silence, reconnects, the last write time, and a log of every buzz tap, answer, write conflict, deadline tick, connection change and state change (who buzzed, money). "Copy log" puts the whole log on the clipboard so you can paste it into the notes table; "Clear" starts a new log (use it before each test). The overlay is remembered in that browser; to switch it off open the app with `?debug=0`. Normal players never see it.
* How to read the log: compare the "+seconds" of the different devices, not the clock times (device clocks differ). In T4 look for `[tap]` lines (how many ms after the buzzers armed), `[send] ... accepted / NOT accepted` (the loser's tap should be NOT accepted) and `[write] conflict` lines (the atomic claim at work). In T7 look for `[net] OFFLINE / back online`, `[sync] long gap` and how fast the `[state]` lines catch up afterwards.

## 1. Tests

### T1 Join and start (basic)
Steps: host creates an online TABLE MIND room, the others join with the invite link or the room code, host starts.
Pass: everybody reaches Act I; names and avatars are right on every device.

### T2 Reach the Blitz
Steps: play Acts I and II to the end (shorten with 2 players if possible: the game uses fewer rounds for 2 players).
Pass: after the last Act II reveal every device shows "AKT III · DER BLITZ" with Wiz as showmaster; nobody is stuck on a waiting screen; the order of acts on every device is the same.

### T3 Normal question, state identical on all devices (spec 14.12)
Steps: play one Blitz question normally; one tester buzzes, answers right.
Pass: all devices show the same clues at the same time (small delay is fine), the same prize when the buzz happens, the same winner, the same money afterwards. The question is the same on every device (same wording and the same four answers).

### T4 Simultaneous buzz (spec 14.1) — the most important test
Steps: two testers count down "3, 2, 1, now" and tap their buzzer zones at the same moment, as soon as the buzzers light up. Repeat **at least 5 times** (use the next questions).
Pass: every time exactly ONE player gets the question; the other device shows "zu spät" (too late); both devices show the same winner after the next sync. Never two winners, never nobody.
Fail examples to write down: both think they won; a buzzer does nothing; the winner differs between devices.

### T5 Wrong answer and steal (spec 3, 14.5)
Steps: buzz, answer wrong on purpose. Then the other player buzzes during the 5-second steal window and answers right. Next question: buzz, answer wrong, and the steal player is also wrong.
Pass: -500 for the first player (never below 0), steal pays half of the prize at the first buzz (rounded to 50), steal wrong costs -250; the question ends after one steal attempt; the money is the same on all devices.

### T6 Timeouts (spec 14.3, 14.6)
Steps: (a) buzz and then do nothing for 7 seconds. (b) On another question nobody buzzes at all.
Pass: (a) counts as a wrong answer (-500) and opens the steal window. (b) the question ends after the last clue plus about 4 seconds, the answer is shown, 0 money.

### T7 Connection loss during the act (not tested so far)
Steps: during a Blitz question, one tester switches the device to flight mode for about 10 seconds and then back on. Do it once while another player is on turn, once while that tester is the buzzing player.
Pass: the game does not crash; after reconnecting the device catches up to the current state within a few seconds; if the tester was the buzzing player, the 7-second rule applies (wrong answer, steal window). Write down how long catching up takes and what the screen shows meanwhile.

### T8 Player leaves or closes the app (spec 14.3, 14.4)
Steps: during a question one tester closes the browser tab or the app completely. Then reopen it and use the same invite link or room code.
Pass: the others can continue (the leaver's buzzer is skipped); after reopening the leaver is back in the same room and sees the current state. If only one player is left the act ends cleanly and the money so far stays.

### T9 Old version device (spec 19)
Steps (optional, only if you still have a device on an old build): open the room with that device.
Pass: it does not break the other devices. It is acceptable that the old device cannot play; it should not corrupt the room.

### T10 Finish: Golden Feather and the hunt
Steps: finish the Blitz (5 questions).
Pass: everyone lands on the hunt offer screen; the player in last place has the Golden Feather (small feather next to the name) on every device; the Chaser warning (red glow) appears on all devices when a double step is rolled; the end results match on all devices.

### T11 Feel (not pass or fail)
Ask each tester: Is the buzzer fast enough? Is the zone big enough on the phone? Is one message per situation enough? Were the clues readable in time? Were any questions wrong, unfair or too easy/hard?

## 2. Notes table (copy and fill in)

| Test | Result (pass / fail / unclear) | Devices and connections | What exactly happened | Screenshot / time |
|---|---|---|---|---|
| T1 | | | | |
| T2 | | | | |
| T3 | | | | |
| T4 (5 tries) | | | | |
| T5 | | | | |
| T6 | | | | |
| T7 | | | | |
| T8 | | | | |
| T9 | | | | |
| T10 | | | | |
| T11 | | | | |

## 3. Exit criteria

The online Blitz counts as tested when T3, T4, T5, T6, T8 and T10 pass without a fail, T7 does not crash and recovers, and the notes show no unexplained difference between devices. Anything that fails goes to Claude with the notes table and screenshots; one fix per failure, then the failed test is repeated.
