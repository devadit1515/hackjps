# Aloud — 3-minute video script & teleprompter

> Goal: empathetic, powerful, and unmistakably *real* — a project that earns its place. Front-load the human story, let the **spoken-aloud moment** land, then prove you own the code.

---

## The plan (time budget)

| Segment | Time | Length | What's on screen |
| --- | --- | --- | --- |
| **1. The problem** | 0:00 – 0:25 | 25s | You to camera / simple title |
| **2. Product + live demo** | 0:25 – 1:55 | 90s | The live app (aloud-pink.vercel.app) |
| **3. The code** | 1:55 – 2:50 | 55s | VS Code (the `aloud` folder) |
| **4. Close** | 2:50 – 3:00 | 10s | Back to the app |

The **demo is the star**, so it gets the extra time — ≈90s, about 10s longer than before. The problem stays a punchy 25s and the code is the final ~55s. Empathy first, the live demo carries the middle, the code is scripted word-for-word below. *(Want the full +15s on the demo instead? Trim the problem to 0:20 and start the demo at 0:20.)*

### Pre-flight checklist (do these before recording)
- [x] **Folder is named `aloud`** — done (matches the app name on screen).
- [ ] **Bump VS Code font size** (Ctrl + `=` a few times) so code is legible on video; collapse the terminal.
- [ ] Use the **live site** for the demo so the **AI suggestions work** (the Gemini key is set on Vercel). Keep `npm run dev` as a backup.
- [ ] Silence notifications, close stray tabs, test mic + screen recorder, record at 1080p.
- [ ] Rehearse the **"In one breath"** paragraph (Segment 3) until it's automatic.

---

## Segment 1 — The problem (0:00 – 0:25)

**[SAY]** *(calm, human, unhurried)*
> "Imagine being completely awake — every thought, every feeling intact — but unable to move, speak, or even nod. For people with ALS, locked-in syndrome, or advanced cerebral palsy, that's everyday life. They have urgent things to say — *I'm in pain*, *I love you* — and no way to say them. The tools that exist are slow, expensive, and exhausting — many make you spell out every single letter, sometimes in Morse code."

**[SHOW]** You speaking to camera, or a plain "Aloud" title card. Authenticity beats production value here.

---

## Segment 2 — Product + live demo (0:25 – 1:55)  ← *the star: run it on the live site so the AI works*

> Drive it with your eyes if you can; if blinking on camera is fiddly, press **Space** to select and tell them *the blink is the real switch*. **Golden rule: let every spoken sentence finish before you talk again** — the silence is what sells it.

**Beat A — In control in six seconds (0:25 – 0:42)**
**[SAY]**
> "This is Aloud. A helper taps the camera on once — and from this moment, everything here is mine to control with one movement: a blink. First, it tunes itself to my eyes and my lighting…"

**[SHOW]** Intro screen → click **Begin with eye control** → the quick calibration runs (*keep your eyes open* → *now close your eyes* → **All set**) → the home board appears. *Don't cut the ~6-second calibration — a system that adapts itself to each person is part of the wow.*

**Beat B — One blink, a real voice (0:42 – 1:08)**  ← *the emotional peak; do not rush this*
**[SAY]**
> "Now watch the whole interface. The highlight moves through the choices **on its own** — I don't aim, I don't reach, I don't press. When it lands on what I need… I just close my eyes, and hold."

**[SHOW]** Let the highlight auto-scan the home board → land on **I feel** → long-blink → it opens → scan to **in pain** → long-blink → the screen fills with **"I'm in pain,"** spoken aloud in a real voice.
**[PAUSE — two full seconds of silence. Let it speak. This is the entire point of the project.]**
**[SAY]** *(quietly, once it finishes)*
> "A whole sentence. A real voice. From a single blink — no typing, no spelling, no Morse code."

**Beat C — Not just survival (1:08 – 1:25)**  ← *the beat that wins hearts*
**[SAY]**
> "And it isn't only emergencies. When you lose your voice, the hardest thing to lose isn't asking for water — it's everyone you can no longer reach."

**[SHOW]** Long-blink back home → scan to **People** (the whole board shifts to green) → open it → land on **I love you** → long-blink → **"I love you."** speaks. **[PAUSE — let it land.]**

**Beat D — A few letters become a sentence (1:25 – 1:46)**  ← *the technical wow judges remember*
**[SAY]**
> "When the words aren't ready-made, I can spell anything — but I almost never type the whole thing. Watch: I choose just a few letters…"

**[SHOW]** Open **Spell it out** → pick a handful of letters (e.g. `c o l d  w`) → the **✨ AI suggestions** appear in the top row.
**[SAY]**
> "…and the AI reads those fragments and writes the full, natural sentence I was reaching for."

**[SHOW]** Choose the ✨ suggestion → it speaks something like **"Could I please have some cold water?"**

**Beat E — Learns you, guards you, needs no internet (1:46 – 1:55)**
**[SAY]**
> "It learns the words I use most, so they rise to the top over time. There's always a one-blink **call for help**, because they may be alone. And every bit of this runs on the laptop — my face never leaves the device, and it works with no internet at all. The AI is an upgrade, never a crutch."

**[SHOW]** Gesture to the learned suggestions and the red **call for help** action; if it's easy, drop Wi-Fi for a second to show a board still speaks.

---

## Segment 3 — The code (1:55 – 2:50)  ← *the memorized ~55 seconds*

Switch to **VS Code**. Don't read code line-by-line — **point at files and tell the story.** Click each file as you reach it.

> **Memorize this. ~60 seconds. Each sentence = one file to click.**

**[POINT: the `lib/` folder in the Explorer]**
> "The whole thing is a Next.js app, and I kept it deliberately small — one input, one output, and a clean path between them. All the real logic is these **seven files in `lib/`**, and it's covered by unit tests."

**[POINT: `components/BlinkCam.js`]**
> "The input is the eyes. **BlinkCam** runs **MediaPipe's FaceLandmarker** — a neural network — on-device, and reads a blink score every frame. Holding your eyes shut past half a second fires **one 'select'**."

**[POINT: `lib/blink.mjs`]**
> "Because everyone's eyes and lighting differ, **`blink.mjs`** calibrates that threshold to each person in about six seconds — it samples eyes-open, then eyes-closed, and puts the cutoff in the gap."

**[POINT: `lib/speller.mjs`]**
> "That single select drives an auto-scanner. On the boards it's a moving highlight; in the speller it's this **two-level state machine** — it scans the rows, you blink to open a row, then it scans the letters."

**[POINT: `lib/predict.mjs`]**
> "Then the hardest part — turning a few eye-picks into a real sentence. **`predict.mjs`** is a **hybrid**: an instant offline model for words and phrases, a **personalization** model that learns what you actually say, and an optional **Gemini** call that turns sparse keywords into full sentences — all merged and **de-duplicated by meaning** so you never see the same idea twice."

**[POINT: `lib/useSpeech.js`, then `app/api/suggest/route.js`]**
> "Finally **`useSpeech`** speaks it with the browser's speech API. The Gemini key stays **server-side** in this one route, never in the browser — and offline, everything still works. The AI is an upgrade, not a dependency."

---

## Segment 4 — Close (2:50 – 3:00)

**[SAY]**
> "Aloud is private by default, runs on any laptop with a webcam, and gives people their voice back with nothing but a blink. I built it solo, in two days — for the people who have everything to say, and no way to say it."

**[SHOW]** Back to the app — long-blink **People → I love you** and let it speak, or land on the Aloud title.

---

## Q&A defense cheat-sheet
*Read this twice before recording. If a judge asks, you answer cold — this is what proves it's yours.*

**One line per file:**
| File | "What does this do?" |
| --- | --- |
| `app/page.js` | The app shell — the intro, the boards, the auto-scan timer, and the full-screen *announce* overlay that speaks and repeats until I signal I'm okay. |
| `components/BlinkCam.js` | Webcam + MediaPipe blink detection; turns a *held* blink into one select; also runs calibration. |
| `components/Speller.js` | The "Spell it out" screen — owns the scan timing and rendering, pulls predictions from `predict.mjs`. |
| `lib/board.js` | The four ready-made boards (feel / need / people / answer), ordered by urgency so pain and breathing scan first. |
| `lib/speller.mjs` | Three pure pieces — the row→cell scan state machine, the text editor (auto-caps, auto-space, undo), and the grid layout. |
| `lib/predict.mjs` | The suggestion engine — on-device n-gram + phrases, personalization, Gemini, and dedupe-by-meaning. |
| `lib/lexicon.mjs` | The small built-in dictionary — word list, bigrams, and whole care-phrases, tuned for someone communicating needs. |
| `lib/blink.mjs` | The calibration math — samples open vs. closed and puts the threshold in the gap, with a fallback if they're too similar. |
| `lib/cues.mjs` | Tiny Web Audio confirmation tones. |
| `lib/useSpeech.js` | The Web Speech API hook — picks a natural voice and loops the announcement. |
| `app/api/suggest/route.js` | The only server code — holds the Gemini key, calls `gemini-2.5-flash`; with no key it returns a *disabled* flag and the app stays fully offline. |

**Anticipated questions:**
- **"Did AI write this?"** → "I used AI as a coding assistant — which the rules allow — but I designed the architecture, made every product decision, and can walk you through any line. The README and the design are mine."
- **"How is a deliberate blink different from a normal one?"** → "Duration. A natural blink is ~100–150 ms; I require the eyes held shut past **500 ms**, with a short lockout after firing, so one hold = one action and you never select by accident."
- **"What if the camera or AI fails?"** → "It degrades gracefully — a full **keyboard fallback** (arrows + Space), and the Gemini AI is optional; on-device prediction, the boards, the speller, and speech all work **fully offline**."
- **"Why blink detection, not eye-gaze tracking?"** → "Gaze tracking needs fragile, calibration-heavy hardware. A blink is the single most reliable movement these users retain, and MediaPipe gives me robust blink data on **any webcam, on-device, privately**."
- **"Is it private?"** → "The **video never leaves the device** — vision, prediction, personalization, and speech all run in the browser. Only the optional Gemini *text* call touches a server, and the key lives only there."
- **"What was genuinely hard?"** → "Two things — making selection **accurate** for someone who can only blink (the calibration + hold-to-fire with the scan frozen mid-blink), and collapsing a few eye-picks into a **fluent sentence** (the hybrid predictor). Those are the two files I'd point you to: `blink.mjs` and `predict.mjs`."

---

## Delivery tips
- **Segment 1:** slow down. Land each phrase. This is the empathy that wins.
- **Segment 2:** after the message speaks aloud, **stay silent for a beat.** Let it hit.
- **Segment 3:** point, don't read. The story *is* the file tour.
- **Demo input:** if live-blinking is fiddly on camera, drive it with **Space** and say the blink is the real switch — totally fine.
- **Total:** rehearse once end-to-end with a timer; trim Segment 2 first if you run long.

---

### Reference — the README "In one breath" paragraph (same idea, prose form)
> Aloud is a Next.js app with one input and one output. The input is a webcam frame: MediaPipe's FaceLandmarker neural network runs on-device and returns a blink score every frame; a quick per-user calibration places the close/open thresholds in the gap between eyes-open and eyes-closed, and holding the eyes shut past half a second fires a single *select*. That select drives an auto-scanner — a moving highlight on the boards, and a two-level *row → cell* state machine in the speller. Whatever is selected becomes a sentence through a hybrid predictor: an instant offline phrase/word/next-word model, a personalization model that learns what this person actually says, and an optional Gemini call that turns sparse keywords into full sentences — all merged and de-duplicated by meaning. The Web Speech API speaks the result and repeats it until dismissed. Every part of that logic lives in a small framework-free module under `lib/`, covered by unit tests.
