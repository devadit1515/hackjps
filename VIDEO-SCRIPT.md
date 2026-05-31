# Aloud — code walkthrough

**`lib/`** *(open the folder)*
"The whole thing's really one idea — someone blinks, and it talks. Everything that does the real work is these seven files; I kept them out of the interface so I could actually test them on their own."

**`components/BlinkCam.js`**
"This watches your eyes — it's a MediaPipe face model running right in the browser, so the webcam never leaves the laptop. The tricky thing is I can't just react to a blink, because everyone blinks constantly. So instead I wait for you to *hold* your eyes shut, about half a second, and that's what counts as a click."

**`lib/blink.mjs`**
"This one honestly took me the longest. How 'shut' your eyes look is totally different person to person, and it shifts with the lighting — so there's no number I can just hardcode. This learns it for you in about six seconds: it watches your eyes open, then closed, and drops the cutoff right in between."

**`lib/speller.mjs`**
"This runs the scanning. The keyboard's the interesting one — it's a little state machine, row by row: you pick a row, then it goes letter by letter. The part I really like is, the second your eyes start to close, it freezes — so you land on what you were actually looking at, not whatever it slid to next. And the letters never rearrange, because if you're exhausted, the layout moving on you is the worst thing."

**`lib/predict.mjs`**
"This is the part I'm proudest of. Spelling a whole sentence with your eyes is painfully slow, so the entire goal is that you barely have to. There are three things running at once here: a fast offline guesser, one that actually learns the phrases you use a lot and pushes them to the top, and Gemini — you give it something like 'cold water,' and it writes back 'could I please have some cold water.' Then it strips out the duplicates, so you're never staring at four versions of the same sentence."

**`lib/useSpeech.js`**
"Then this just reads it out loud, and keeps repeating it until they let it stop."

**`app/api/suggest/route.js`**
"And this is the only piece that ever touches a server — it's where the AI key lives, so it's never exposed in the browser. With no key at all, the whole thing falls back to the offline version, so it still works with zero internet."
