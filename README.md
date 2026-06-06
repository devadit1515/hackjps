# Aloud

A communication tool for people who can only move their eyes — ALS, locked-in syndrome, cerebral palsy, paralysis.

Live: https://aloud-pink.vercel.app

A caregiver turns the camera on once. After that, a highlight moves across the screen by itself. When it lands on what the person wants, they hold their eyes shut for about a second — that's a selection. Aloud builds the sentence and reads it aloud.

There are two ways to say something. Quick phrases handle the things that come up most: pain levels, basic needs, emotional things like "I love you" or "hold my hand." For anything else, there's a letter-by-letter spelling mode — but you rarely have to finish the word. The AI watches what you're spelling and offers to complete it, so a few letters usually gets you a full sentence.

The scanning speed, blink thresholds, and phrase categories were all tuned around one constraint: the person using it is tired. Cognitive load is real. Too many choices and the whole thing becomes exhausting. The goal was something a caregiver could hand off after a two-minute explanation and never have to touch again.

The face detection runs on-device through MediaPipe. Nothing from the camera touches a server. The boards, spelling, and voice all work offline — only the AI suggestions call out, and those need a Gemini API key set in `.env.local`.

## Run it

```
npm install
npm run dev
```

Allow the camera at http://localhost:3000. No camera? Arrow keys move the highlight, space selects.

## Built with

Next.js, React, MediaPipe FaceLandmarker (blink detection), Google Gemini (sentence suggestions), Web Speech API (voice output).
