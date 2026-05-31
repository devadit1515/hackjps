# Aloud — video script (3 min)

Lines in quotes are what you actually say — say them like you talk. Italic lines are what to do on screen.

**Time:** Problem ~20s · Demo ~80s · Code **~1:20** · Close ~5s. The code section is timed to your 1:20, which puts the whole video around 3:05 — trim a few seconds off the problem and demo if you need an exact 3:00.

**Before you record**
- Folder is named `aloud` ✓
- Bump the VS Code font size so code is readable on video; hide the terminal.
- Run the demo on the **live site** (aloud-pink.vercel.app) so the AI suggestions work. `npm run dev` as backup.
- Mute notifications, close extra tabs, test your mic, record at 1080p.
- If blinking to the camera is awkward on video, drive it with the keyboard (arrows + Space) and just say the blink is the real input.

---

## 1. The problem (0:00 – 0:25)

"Some people can't move or speak at all — ALS, locked-in syndrome, late-stage cerebral palsy — but they're fully awake, with things they need to say. The tools for this are slow and expensive, and a lot of them make you spell out every letter, sometimes in Morse code. So I built something faster."

*On screen: you talking, or a plain Aloud title card.*

---

## 2. The demo (0:25 – 1:55)

*Run it on the live site. Let each spoken line finish before you keep talking.*

**0:25 — Turning it on**
"This is Aloud. Someone turns the camera on once, and after that I run the whole thing with my eyes. It spends about six seconds learning my blink first — everyone's eyes and lighting are different, so it tunes itself to me."
*Click Begin → let the setup run (eyes open, then eyes closed) → land on the home screen.*

**0:42 — How you actually use it**
"The highlight moves on its own. When it's on what I want, I close my eyes and hold for about a second. A normal blink is too quick to count, so I never pick something by accident."
*Let it scan to **I feel**, hold → it opens → scan to **in pain**, hold → it says "I'm in pain" out loud.*
"A full sentence, out loud, from one blink. And the most urgent things — pain, breathing — are first, so they're the fastest to reach."

**1:08 — Not just medical**
"It's not all emergencies either. When you can't talk, the part you miss most isn't asking for water — it's the people."
*Go back → open **People** (the board turns green) → land on **I love you**, hold → it speaks.*

**1:25 — The AI does the hard part**
"If what I want isn't already a button, I can spell it — but spelling letter by letter with your eyes is exhausting, so I barely have to. I pick a couple of letters…"
*Open **Spell it out** → choose a few letters (`c o l d  w`) → the ✨ AI suggestions appear.*
"…and the AI writes the full sentence for me."
*Pick the suggestion → it says something like "Could I please have some cold water?"*

**1:46 — Why it holds up**
"It also remembers what I say a lot and pushes it to the top, there's a call-for-help button that's always one blink away in case I'm alone, and it all runs on the laptop — no internet needed, and the camera feed never leaves the device."
*Point at the suggestions and the red **call for help** key.*

---

## 3. The code (~1 min 20s)

*Open VS Code and open each file as you name it — like a tour you've given a hundred times. This is ~80 seconds at a confident pace; if you run long, drop the calibration line (beat 3).*

"It's a Next.js app, one idea start to finish — one input, a blink, into one output, speech. The real logic's in seven small files in `lib/`, kept out of the UI so I can unit-test it — 33 tests on the core."
*(open the `lib/` folder)*

"`BlinkCam` runs MediaPipe's face model on the GPU, in the browser — the camera feed never leaves the laptop. Every frame it reads how shut each eye is and takes the stronger one. I don't fire on a blink — that's too fast, you'd trigger it by accident — I fire on a half-second *hold*, so one hold is one clean pick."
*(BlinkCam.js)*

"A strong blinker and a faint one read totally differently, so `blink.mjs` tunes to each person in about six seconds — it samples your eyes open and closed, takes percentiles so one bad frame can't skew it, and sets the cutoff in the gap between them."
*(blink.mjs)*

"That pick drives the scanning. The boards step a highlight every 1.4 seconds; the speller's a two-level state machine — it scans the rows, you pick one, then it scans the letters inside it. It freezes the instant your eyes start to close, so the pick lands where the highlight actually was — and the letters never move, because when you're exhausted, predictable beats fast."
*(speller.mjs)*

"The hardest part is turning a few letters into a real sentence — that's `predict.mjs`. It runs three predictors at once: an instant offline one with a word list and a word-pair table, one that learns the exact phrases you use and floats them to the top, and Gemini, which turns something like 'cold water' into a full, polite sentence. Then it drops anything more than sixty percent the same idea, and cancels the previous AI call on every keystroke so it stays instant."
*(predict.mjs)*

"Then `useSpeech` reads it out and repeats it until I dismiss it — and the Gemini key lives only here, on the server, so with no key it just falls back to the offline model and the whole app runs with zero internet."
*(useSpeech.js → api/suggest/route.js)*

**Reserve — drop any of these in if you have a few seconds, or get asked. They prove you know the corners:**
- "It fires on the *hold*, not on re-opening the eyes — so it still works for someone who can't fully open them again — and there's a lockout so one hold can't double-fire."
- "The thresholds use hysteresis — it takes more to count as 'closed' than to count as 'open' again — so it never flickers between the two."
- "The scan engine is a pure state machine with no UI inside it — that's how it's unit-tested; the 33 tests cover the machine, the text editor, the predictor, and the calibration math."
- "Every row in the speller ends in a 'back' cell, so a wrong pick is never a dead end — and the editor auto-capitalizes and spaces the message for you."
- "Gemini runs at low temperature with reasoning turned off and a strict JSON schema, so it's fast and always parseable — and it's the only thing that ever touches a server."

---

## 4. Close (2:50 – 3:00)

"It runs on any laptop with a webcam, keeps everything private, and gives someone their voice back with just a blink. I built it solo, in two days."
*Back to the app — say "I love you" one more time, or land on the title.*

---

## If a judge asks (know these cold)

**What each file does:**
| File | What it does |
| --- | --- |
| `app/page.js` | The app shell — intro, the boards, the auto-scan timer, and the full-screen message that speaks and repeats until I say I'm okay. |
| `components/BlinkCam.js` | Webcam + MediaPipe blink detection; turns a held blink into one pick; also runs calibration. |
| `components/Speller.js` | The spell screen — handles the scan timing and rendering, and pulls suggestions from `predict.mjs`. |
| `lib/board.js` | The four ready-made boards (feel / need / people / answer), ordered by urgency so pain and breathing come first. |
| `lib/speller.mjs` | Three pieces — the row-then-cell scan, the text editor (auto-caps, spacing, undo), and the grid layout. |
| `lib/predict.mjs` | The suggestion engine — offline model, personalization, Gemini, and dedupe. |
| `lib/lexicon.mjs` | The built-in word list, common word pairs, and whole care-phrases. |
| `lib/blink.mjs` | The calibration math — samples open vs. closed and sets the threshold between them. |
| `lib/cues.mjs` | Small confirmation sounds. |
| `lib/useSpeech.js` | The speech part — picks a voice and repeats the message. |
| `app/api/suggest/route.js` | The only server code — holds the Gemini key, calls the model; with no key it returns a "disabled" flag and the app stays offline. |

**Likely questions:**
- **"Did AI write this?"** — "I used AI to help write code, which the rules allow, but I designed it and made every decision, and I can walk you through any file. The README and design are mine."
- **"How's a real blink different from a normal one?"** — "Time. A normal blink is about a tenth of a second; I need the eyes held shut past half a second, with a short cooldown after, so one hold is one action."
- **"What if the camera or AI fails?"** — "There's a full keyboard fallback, and the Gemini part is optional — the boards, the speller, the offline suggestions, and the speech all work without internet."
- **"Why blinks and not eye-gaze tracking?"** — "Gaze tracking needs fragile, heavily-calibrated hardware. A blink is the most reliable movement these users still have, and MediaPipe reads it on any webcam, on-device."
- **"Is it private?"** — "The video never leaves the device. Only the optional Gemini text call hits a server, and the key lives only there."
- **"What was actually hard?"** — "Two things: making the pick accurate for someone who can only blink, and turning a few letters into a fluent sentence. Those are `blink.mjs` and `predict.mjs`."

---

## Backup: the code part as one paragraph (if you'd rather say it straight through)

"Aloud is a Next.js app with one input and one output. The input is the webcam: MediaPipe reads a blink score every frame, a quick calibration sets the threshold for each person, and holding your eyes shut past half a second counts as one pick. That pick drives the scanning — a moving highlight on the boards, and a two-level row-then-letter scan in the speller. Whatever you pick becomes a sentence through three combined predictors — an instant offline model, one that learns your own phrases, and an optional Gemini call for full sentences — with duplicates removed. The browser's speech API reads it out. All of that logic is in small files under `lib/`, with unit tests."
