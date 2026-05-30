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

Choices are grouped into four boards, ordered by urgency so the scan reaches the most time-critical things first:

| Board | For saying things like |
| --- | --- |
| **I feel** | *I'm in pain* · *I can't breathe* · *I'm too cold* |
| **I need** | *I need some water* · *…the bathroom* · *…my medicine* |
| **Please** | *Could you come here?* · *…call my family* · *…the nurse* |
| **Yes / No** | *Yes* · *No* · *Please wait* · *Please stop* |

Every tile is already a complete, natural sentence — there's nothing to spell or assemble.

## How it works

| Layer | Technology |
| --- | --- |
| Hands-free input | **MediaPipe FaceLandmarker** (on-device neural network) reads facial blendshapes every frame to detect a deliberate long blink |
| Selection | **Single-switch auto-scanning** — an established AAC access method — with the scan frozen mid-blink so a selection lands on the option the highlight was resting on |
| Speech | The browser's **Web Speech API** speaks each sentence aloud, looping until dismissed |

### AI / ML disclosure (HackJPS)

- **Machine learning is the interface.** MediaPipe FaceLandmarker (a neural network) runs entirely on-device to power the blink control — it's the *only* way a user without hand movement operates the whole app. The ML isn't a feature bolted on; it *is* how Aloud is used.
- **No cloud, no API keys, fully private.** Everything — vision and voice — runs in the browser. A person's medical needs never leave their machine, and the app works with no internet.
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

## Tech

Next.js 16 (App Router) · React 19 · MediaPipe Tasks Vision · Web Speech API · Lucide · Atkinson Hyperlegible + Fraunces.
