# Aloud — code walkthrough

**`lib/`** *(open the folder)*
"Built with Next.js and React. MediaPipe handles the eye input, Gemini generates the sentence suggestions, and the Web Speech API handles output. The core logic is in these files."

**`components/BlinkCam.js`**
"Runs MediaPipe's FaceLandmarker on the webcam feed in the browser, reading the eye-blink blendshape every frame. A selection fires when the eyes stay shut past about 500 milliseconds, which filters out normal involuntary blinks."

**`lib/blink.mjs`**
"Calibrates the blink threshold per user by sampling open- and closed-eye values and setting the cutoff between them."

**`lib/speller.mjs`**
"A two-level scan state machine: it scans the rows, selecting one drops into that row, then it scans that row's letters. Scanning pauses while the eyes are closed, and the letter layout stays fixed."

**`lib/predict.mjs`**
"Builds suggestions from three sources — an offline word and phrase predictor, a personalization model trained on the user's own phrases, and a Gemini call that expands partial input into full sentences — then deduplicates them by meaning."

**`lib/useSpeech.js`**
"Wraps the Web Speech API: synthesizes the message and repeats it until dismissed."

**the rest** *(no need to open)*
"`board.js` holds the preset phrases, `lexicon.mjs` is the offline word data, `cues.mjs` the audio cues, and `page.js` and `Speller.js` render the screens."

**frontend & deployment** *(no need to open)*
"The frontend is React with a hand-written CSS design system in `globals.css`, built for accessibility — the Atkinson Hyperlegible low-vision typeface, large scan targets, and a full keyboard fallback. The Gemini call runs in a serverless API route so the key never reaches the client, the core logic is covered by 33 unit tests, and it's deployed on Vercel, auto-deploying on every push to GitHub."
