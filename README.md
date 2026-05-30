# Aloud — a voice for anyone who can speak only with their eyes

> Choose a few words with the smallest movement — a gaze, a dwell, or a blink — and Aloud turns them into a full, natural sentence and **says it out loud.** No typing. No spelling. No Morse code.

Built for **HackJPS 2026**.

---

## The problem

Millions of people — with ALS, cerebral palsy, locked-in syndrome, late-stage Parkinson's, or paralysis — cannot speak or use their hands, yet are fully present and have things to say. Existing tools are slow: many make you spell letter-by-letter, sometimes in Morse code, which is exhausting and has a steep learning curve.

## What Aloud does

Aloud needs only **one reliable signal**. You move through a small, calm board of choices and select with whatever you can do:

- **Gaze / dwell** — rest on a choice and a line fills; it selects itself. Nothing to press.
- **Blink** — turn on *Eyes* and a deliberate blink chooses the highlighted card (detected on-device with a webcam).
- **Any switch** — Space, a click, or arrow keys work too.

You pick two or three words like *cold* and *a blanket*, and Aloud composes and speaks:

> *"I'm cold — could you bring me a blanket, please?"*

A couple of eye-movements become a fluent, spoken sentence.

## How it works

| Layer | Technology |
| --- | --- |
| Hands-free input | **MediaPipe FaceLandmarker** (on-device ML) reads facial blendshapes to detect deliberate blinks, plus dwell-to-select and single-switch scanning |
| Sentence composition | An **on-device grammar engine** turns selected words into a natural first-person sentence — instant, free, and fully private |
| Speech | The browser's **Web Speech API** speaks the sentence aloud |
| Optional "Smart AI" | A **Google Gemini** route can phrase sentences with an LLM — entirely optional and **off by default** |

### AI / ML disclosure (HackJPS)

- **Machine learning is core, on-device, and key-free:** MediaPipe FaceLandmarker (a neural network) powers the blink / eye control — the way a user without hand movement operates the entire app.
- **Generative AI is optional:** the Google Gemini sentence-composer can be toggled on, but the app is fully functional with it off (the on-device composer is the default).
- This README and the design were written by the author; AI coding tools assisted with implementation.

## Accessibility by design

- **Atkinson Hyperlegible** — the typeface engineered by the Braille Institute for low-vision readers — is used for every control and word.
- **Single-switch scanning** and **dwell** are established access methods for people with severe motor impairment; an anti-"Midas-touch" re-arm prevents accidental selections.
- Few, large, high-contrast targets; respects `prefers-reduced-motion`.
- Works **100% on-device** by default — a person's words never leave their machine.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
```

Optional — enable the "Smart AI" phrasing toggle with a free
[Google AI Studio](https://aistudio.google.com/apikey) key:

```bash
# .env.local
GEMINI_API_KEY=your_key_here
```

## Tech

Next.js 16 (App Router) · React 19 · MediaPipe Tasks Vision · Web Speech API · Lucide · optional Google Gemini (`@google/genai`).
