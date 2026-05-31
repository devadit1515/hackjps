# Aloud — code walkthrough

**`lib/`** *(open the folder)*
"It's built with Next.js, MediaPipe for reading the blinks, Gemini for the sentence suggestions, and the browser's speech API for the voice. The whole thing is one idea — a blink goes in, speech comes out — and all the real logic is in these files."

**`components/BlinkCam.js`**
"This watches your eyes — it's MediaPipe's face model, running in the browser so the webcam never leaves the laptop. I can't react to a blink, everyone blinks constantly, so I wait for you to hold your eyes shut about half a second, and that's a click."

**`lib/blink.mjs`**
"This calibrates the blink to each person in about six seconds, since everyone's eyes and lighting are different."

**`lib/speller.mjs`**
"This runs the scanning — a state machine that goes row by row: you pick a row, then it goes letter by letter. It freezes the second your eyes start to close, so you land on what you were actually looking at, and the letters never move around."

**`lib/predict.mjs`**
"This turns a few letters into a full sentence. Three things run at once: a fast offline guesser, one that learns the phrases you use most, and Gemini, which takes 'cold water' and writes back 'could I please have some cold water.' Then it strips out the duplicates so you don't see the same sentence twice."

**`lib/useSpeech.js`**
"And this reads the message out loud, and repeats it until they stop it."

**the rest** *(no need to open)*
"Everything else is supporting — `board.js` holds the ready-made phrases, `lexicon.mjs` is the offline word data, `cues.mjs` is the small confirmation sounds, and `page.js` and `Speller.js` are the screens themselves."
