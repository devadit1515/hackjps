# Aloud — 3-minute video script & teleprompter

> Goal: empathetic, powerful, and unmistakably *real* — a project that earns its place. Front-load the human story, let the **spoken-aloud moment** land, then prove you own the code.

---

## The plan (time budget)

| Segment | Time | Length | What's on screen |
| --- | --- | --- | --- |
| **1. The problem** | 0:00 – 0:30 | 30s | You to camera / simple title |
| **2. Product + live demo** | 0:30 – 1:50 | 80s | The live app (aloud-pink.vercel.app) |
| **3. The code** | 1:50 – 2:50 | 60s | VS Code (the `aloud` folder) |
| **4. Close** | 2:50 – 3:00 | 10s | Back to the app |

This keeps your 2-minute "problem + product" half (0:00–1:50) and your 1-minute "code" half (1:50–3:00) — the demo is the star, empathy comes first, and the code minute is scripted word-for-word below.

### Pre-flight checklist (do these before recording)
- [ ] **Rename the folder to `aloud`** — in the VS Code Explorer, right-click the `alibi` folder → **Rename** → type `aloud`. (VS Code does this cleanly even though the OS lock blocks a terminal rename.)
- [ ] **Bump VS Code font size** (Ctrl + `=` a few times) so code is legible on video; collapse the terminal.
- [ ] Use the **live site** for the demo so the **AI suggestions work** (the Gemini key is set on Vercel). Keep `npm run dev` as a backup.
- [ ] Silence notifications, close stray tabs, test mic + screen recorder, record at 1080p.
- [ ] Rehearse the **"In one breath"** paragraph (Segment 3) until it's automatic.

---

## Segment 1 — The problem (0:00 – 0:30)

**[SAY]** *(calm, human, unhurried)*
> "Imagine being completely awake — every thought, every feeling intact — but unable to move, speak, or even nod. For people with ALS, locked-in syndrome, or advanced cerebral palsy, that's everyday life. They have urgent things to say — *I'm in pain*, *I love you* — and no way to say them. The tools that exist are slow, expensive, and exhausting — many make you spell out every single letter, sometimes in Morse code."

**[SHOW]** You speaking to camera, or a plain "Aloud" title card. Authenticity beats production value here.

---

## Segment 2 — Product + live demo (0:30 – 1:50)

**Beat A — what it is (0:30–0:50)**
**[SAY]**
> "So I built **Aloud** — a voice for anyone who can speak only with their eyes. It needs one reliable movement: a blink. A helper taps the camera on once — and from then on, the person controls everything themselves, and Aloud speaks for them, out loud, in full sentences."

**[SHOW]** The intro screen → click **Begin with eye control**. Mention: *"It tunes the blink detection to my eyes and lighting in about six seconds."*

**Beat B — the core magic: scan → blink → speech (0:50–1:20)**
**[SAY]**
> "Here's the whole interface. The highlight moves across the choices **on its own** — nothing to aim at, nothing to press. When it lands on what I want, I just **hold my eyes shut** for a moment…"

**[SHOW]** On the home board, let the highlight scan, then long-blink **I feel → in pain**. Let the full-screen **"I'm in pain."** speak aloud — **pause and let it breathe.** This is the emotional peak.
> *(If blinking on camera is awkward, press **Space** to select — the blink is the real input; the keyboard is just the fallback.)*

**Beat C — the AI (1:20–1:50)**
**[SAY]**
> "And when the sentence I need isn't ready-made, I can spell anything — but I almost never type it all. Watch: I pick just a few letters, and **AI turns them into full, natural sentences** to choose from."

**[SHOW]** Open **Spell it out**, pick a few letters (e.g. `c o l d  w`), let the ✨ AI suggestions appear → choose **"Could I please have some cold water?"** → it speaks.
**[SAY]**
> "It even **learns the words and phrases I use most** — and it works **fully offline** if there's no internet. The AI is an upgrade, not a crutch."

---

## Segment 3 — The code (1:50 – 2:50)  ← *the memorized minute*

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
