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

## How it works

| Layer | Technology |
| --- | --- |
| Hands-free input | **MediaPipe FaceLandmarker** (on-device neural network) reads facial blendshapes every frame to detect a deliberate long blink |
| Selection | **Single-switch auto-scanning** (one level for boards, two for the speller) — an established AAC access method — with the scan frozen mid-blink so a selection lands on the option the highlight was resting on |
| Prediction | An **on-device predictor** (frequency word-completion + a small next-word n-gram + AAC phrase matching) suggests instantly and offline; an optional **Google Gemini** route upgrades it to full-sentence completions |
| Speech | The browser's **Web Speech API** speaks each message aloud, looping until dismissed |

The pure logic — the scan state machine, the editor, and the predictor — lives in framework-free modules under `lib/` and is covered by `node --test` unit tests.

### AI / ML disclosure (HackJPS)

- **Machine learning is the interface.** MediaPipe FaceLandmarker (a neural network) runs entirely on-device to power the blink control — it's the *only* way a user without hand movement operates the whole app. The ML isn't a feature bolted on; it *is* how Aloud is used.
- **AI does the typing's heavy lifting.** In "Spell it out", on-device prediction (and optionally Gemini) collapses a sentence into a few selections.
- **Works fully offline; private by default.** Vision, prediction, and voice all run in the browser with no key. The optional Gemini key lives only on the server and merely sharpens suggestions — the app never depends on the network.
- This README and the design were written by the author; AI coding tools assisted with implementation.

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

Run the engine's unit tests:

```bash
node --test lib/speller/speller.test.mjs lib/predict/predict.test.mjs
```

## Tech

Next.js 16 (App Router) · React 19 · MediaPipe Tasks Vision · Web Speech API · optional Google Gemini (`@google/genai`) · Lucide · Atkinson Hyperlegible + Fraunces.
