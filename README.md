# Aloud

A way to talk for people who can only move their eyes — like someone with ALS, locked-in syndrome, cerebral palsy, or paralysis.

Live: https://aloud-pink.vercel.app

Someone turns the camera on once. After that, a highlight moves across the choices on its own, and when it lands on what you want, you hold your eyes shut for about a second to pick it. Aloud builds the sentence and says it out loud.

There are two ways to talk. You can step through ready-made phrases — things like "I'm in pain" or "I love you" — or spell something out letter by letter. When you spell, you barely have to type it all: the AI takes a few letters and fills in the whole sentence.

Everything runs in the browser. The camera feed never leaves the device, and it works offline — the AI suggestions need a key, but the boards, spelling, and voice all work without one.

## Run it

```
npm install
npm run dev
```

Open http://localhost:3000 and allow the camera. To try it without a camera, use the arrow keys to move the highlight and space to select.

## Built with

Next.js and React, MediaPipe for reading the blinks, Google Gemini for the sentence suggestions, and the browser's Web Speech API for the voice.
