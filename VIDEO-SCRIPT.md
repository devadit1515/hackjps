# Aloud — video script (3 min)

Lines in quotes are what you actually say — say them like you talk. Italic lines are what to do on screen.

**Time:** Problem 0:00–0:25 · Demo 0:25–1:55 · Code 1:55–2:50 · Close 2:50–3:00.

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

## 3. The code (1:55 – 2:50)

*Switch to VS Code. Don't read code — open each file as you mention it. This is where you show you actually understand what you built, so practice it until it's smooth.*

"It's a Next.js app, and I kept it small on purpose — one input, one output. All the real logic is seven files in `lib/`, with unit tests."
*(open the `lib/` folder)*

"The input is the eyes. `BlinkCam` runs MediaPipe's face model right in the browser and reads how shut my eyes are every frame. Holding past about half a second counts as one pick."
*(BlinkCam.js)*

"Everyone's different, so `blink.mjs` calibrates per person — it samples your eyes open, then closed, and sets the cutoff in between."
*(blink.mjs)*

"That one pick drives the scanning. On the boards it's the moving highlight; in the speller it's a two-level scan — it goes through the rows, you pick a row, then it goes through the letters. That's `speller.mjs`."
*(speller.mjs)*

"The hardest part is turning a few letters into a real sentence. `predict.mjs` combines three things — an instant offline model, a part that learns your own phrases, and an optional Gemini call for full sentences — then drops duplicates so you don't see the same idea twice."
*(predict.mjs)*

"`useSpeech` reads it out with the browser's speech API, and the Gemini key stays on the server in this one route — never in the browser. With no key, everything still works offline."
*(useSpeech.js, then api/suggest/route.js)*

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
