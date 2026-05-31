# Aloud — a voice for anyone who can speak only with their eyes

> Watch a highlight move across a few calm choices, hold your eyes shut for a moment, and Aloud says what you need **out loud** — full sentence, real voice. No typing. No spelling. No Morse code.

Built for **HackJPS 2026**.

---

## The problem

Millions of people — with ALS, cerebral palsy, locked-in syndrome, late-stage Parkinson's, or paralysis — cannot speak or use their hands, yet are fully present and have urgent things to say. Existing tools are slow and exhausting: many make you spell letter-by-letter, sometimes in Morse code, with a steep learning curve.

## What Aloud does

Aloud asks for **one small, reliable movement: a deliberate blink.** A helper taps **Begin** once to turn on the camera — after that, the person controls everything with their eyes alone.

- **The highlight scans for you.** A border walks across the choices on its own. Nothing to aim, nothing to press.
- **A long blink chooses.** When the highlight lands on what you want, hold your eyes shut for about a second. A quick, involuntary blink does nothing — so you never select by accident.
- **It speaks, big and out loud.** Your message fills the screen in bold and repeats in a clear voice until you signal you're okay (another long blink, or *I got help*).

There are **two ways to speak**, both driven by the same scan + long blink.

### 1. Quick Phrases — ready-made sentences

Four boards, ordered by urgency so the scan reaches the most time-critical things first. Every tile is already a complete, natural sentence — nothing to spell or assemble.

| Board | For saying things like |
| --- | --- |
| **I feel** | *I'm in pain* · *I can't breathe* · *I'm too cold* |
| **I need** | *I need some water* · *…the bathroom* · *…my medicine* |
| **People** | *Please come closer* · *call my family* · *hold my hand* · *I love you* |
| **Answers** | *Yes* · *No* · *I'm okay* · *Please wait* · *Stop* |

### 2. Spell it out — say anything

When the right sentence isn't on a board, **Spell it out** composes any message, eyes-only, with a two-level scan:

- **Row → cell.** The highlight first walks the rows (suggestions, A–I, J–R, S–Z, edit, actions); a long blink opens a row, then the highlight walks its cells and a long blink picks one. Every row has a **back** cell, so a wrong choice is never a dead end.
- **Predictions do the work.** A live suggestions row sits **first** (fastest to reach): on-device word-completion, next-word prediction, and whole-phrase matches appear instantly and offline; when a free Gemini key is present, smarter full-sentence completions are merged in. Accepting one inserts the whole word/sentence with **automatic spacing and capitalization**.
- **Forgiving & safe.** Backspace a letter or word, one-level undo, a **confirmed** clear (two selections, so a stray blink can't wipe the message), a **Rest** mode that pauses scanning so the user can close their eyes, re-sayable **recent** messages, and an always-present **🔔 Call for help** that flashes the screen and loudly loops a help message — because the user may be alone.

## How it works — AI from input to output

Aloud is AI end-to-end: a neural network reads the eyes, generative AI turns a few selections into fluent speech, and the system adapts to each person.

| Layer | Technology |
| --- | --- |
| **Vision AI (input)** | **MediaPipe FaceLandmarker** — an on-device neural network — reads facial blendshapes every frame to detect a deliberate blink. This *is* the interface for someone who can't move their hands. |
| **Adaptive calibration** | A quick per-user "eyes open → eyes closed" sample places the detection thresholds in the gap between the two, so a strong or faint blinker both work — the model tunes itself to each face and lighting. |
| Selection | **Single-switch auto-scanning** (one level for boards, two for the speller) — an established AAC access method — with the scan frozen mid-blink so a selection lands where the highlight was resting. |
| **Generative AI (composition)** | In "Spell it out", **Google Gemini** turns sparse, keyword-style input into complete natural sentences (*"cold water" → "Could I please have some cold water?"*) — AI does the typing's heavy lifting, marked with ✨ in the suggestions. Degrades to an instant on-device predictor (word-completion + next-word n-gram + phrase matching) with no key, fully offline. |
| **On-device personalization** | A tiny adaptive model learns the words and whole messages this person actually says and surfaces them first next time — online learning that stays on the device. |
| Speech (output) | The browser's **Web Speech API** speaks each message aloud, looping until dismissed. |

The pure logic — the scan state machine, the editor, the predictor, the personalization, and the calibration math — lives in framework-free modules under `lib/` and is covered by `node --test` unit tests.

### AI / ML disclosure (HackJPS)

- **ML is the interface, not a feature.** The MediaPipe neural network is the *only* way a user without hand movement operates the whole app — and it tunes its thresholds to each individual.
- **Generative AI does the hardest part:** collapsing a few eye-selected keywords into a fluent, ready-to-speak sentence — directly attacking the fatigue that makes existing tools unusable.
- **It also learns the person** over time, on-device, so the people they love and the things they need rise to the top.
- **Private by default:** vision, on-device prediction, personalization, and voice all run in the browser. The Gemini key lives only on the server; with no key the app still works fully offline.

## Architecture — how the code is organized

One input, one output; everything else is the path between them.

**Data flow:** webcam frame → **MediaPipe** blink score (per-frame, on-device) → per-user **calibration** thresholds → a long blink = one **select** → **auto-scan** (boards: a single moving highlight; speller: a two-level *row → cell* state machine) → **hybrid predictor** (instant on-device + personalization + optional Gemini, de-duplicated by meaning) → **Web Speech** says it aloud.

```
app/
  page.js               the app shell: intro, the auto-scanning boards, selection, announce + help overlays
  layout.js             fonts (Atkinson Hyperlegible, designed for low vision) + metadata
  globals.css           design system — warm paper, per-board colour, the dwell animation
  api/suggest/route.js  server route that holds the Gemini key and turns the message-so-far into sentences

components/
  BlinkCam.js           webcam + MediaPipe blink detection + the ~6-second calibration flow — the "eye switch"
  Speller.js            the "Spell it out" screen: drives the scan machine, merges predictions, edits the message

lib/  — pure, framework-free, unit-tested
  board.js              the four quick-phrase boards, ordered by urgency
  speller.mjs           scan state machine + message editor + grid layout
  predict.mjs           suggestion engine: on-device + personalization + Gemini + dedupe-by-meaning
  lexicon.mjs           the on-device dictionary (words, bigrams, whole phrases)
  blink.mjs             per-user blink-calibration math
  cues.mjs              optional Web Audio confirmation tones
  useSpeech.js          Web Speech API hook (speaks each message, loops the announcement)

test/                   node --test suites for the speller, predictor, and calibration (33 tests)
```

**In one breath.** Aloud is a Next.js app with one input and one output. The input is a webcam frame: MediaPipe's FaceLandmarker neural network runs on-device and returns a blink score every frame; a quick per-user calibration places the close/open thresholds in the gap between eyes-open and eyes-closed, and holding the eyes shut past half a second fires a single *select*. That select drives an auto-scanner — a moving highlight on the boards, and a two-level *row → cell* state machine in the speller. Whatever is selected becomes a sentence through a hybrid predictor: an instant offline phrase/word/next-word model, a personalization model that learns what this person actually says, and an optional Gemini call that turns sparse keywords into full sentences — all merged and de-duplicated by meaning. The Web Speech API speaks the result and repeats it until dismissed. Every part of that logic lives in a small framework-free module under `lib/`, covered by unit tests.

## Accessibility by design

- **Atkinson Hyperlegible** — the typeface engineered by the Braille Institute for low-vision readers — is used throughout.
- **Single-switch scanning + long blink** is a recognised access method for severe motor impairment; the scan freezes the instant the eyes close so selection is accurate.
- **No scrolling, ever** — every screen fits the viewport, because the audience can't scroll.
- Few, large, high-contrast targets; urgent messages (pain, breathing) get a distinct red treatment.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
```

Allow camera access when prompted — it's the only input the app needs. (A keyboard works too for testing: arrow keys move the highlight, Space selects.)

Optional — upgrade "Spell it out" suggestions with a free [Google AI Studio](https://aistudio.google.com/apikey) key (the app works fully without it):

```bash
# .env.local
GEMINI_API_KEY=your_key_here
```

Run the engine's unit tests — the pure logic in `lib/` (33 tests):

```bash
npm test
```

## Tech

Next.js 16 (App Router) · React 19 · MediaPipe Tasks Vision · Web Speech API · optional Google Gemini (`@google/genai`) · Lucide · Atkinson Hyperlegible + Fraunces.
