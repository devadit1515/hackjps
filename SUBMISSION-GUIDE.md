# 🏆 Aloud — Submission Guide (everything you need to do)

> Your private prep doc. Don't put this in the public repo or video.
> **Deadline: today, May 31 2026, 11:45 PM EDT.** Submit early — Devpost gets slow at the buzzer.

---

## 0) Key facts (paste-ready)

- **Live demo:** https://aloud-pink.vercel.app  ← always share THIS clean URL
- **Repo:** https://github.com/devadit1515/hackjps  *(currently PRIVATE — see checklist step 2)*
- **One-line:** *A voice for anyone who can speak only with their eyes — on-device AI reads your blink, generative AI writes your sentence.*
- **Built with:** Next.js 16 · React 19 · MediaPipe Tasks Vision · Google Gemini · Web Speech API · Vercel

---

## 1) ✅ Submission checklist (do these in order)

1. **[ ] Test the live site on YOUR webcam + lighting.** Open the link, click *Begin*, do the calibration (eyes open → eyes closed), then confirm a long blink reliably selects. If a blink ever misses, redo calibration from **Help → Recalibrate**.
2. **[ ] Repo visibility.** Judges often want the code. Either:
   - Make `hackjps` **public** right before submitting (Settings → Danger Zone → Change visibility), **or**
   - Keep it private and add the judges/organizers as collaborators if they ask.
   - ⚠️ The repo has **no secrets in it** (the Gemini key lives only in Vercel + your local `.env.local`), so it's safe to make public.
3. **[ ] Record the demo video** (script in §2). Keep it under the event's limit (check the rules — usually ≤ 3 min). Upload to YouTube (unlisted is fine) or whatever Devpost accepts.
4. **[ ] Fill the Devpost** with the copy in §3. Add the live link + repo link + video.
5. **[ ] Pick your award categories** — make sure to opt into **Best Use of AI/ML** (and any accessibility / social-impact / overall tracks).
6. **[ ] Final live check** right before submitting: load the URL fresh, spell a word, confirm the **✨ AI suggestions** appear. (They need the Gemini key, which is set in Vercel — already done.)
7. **[ ] Submit.** Then reload the submission page to confirm it saved.

🔒 **Never** show or paste your Gemini API key in the video, Devpost, or repo.

---

## 2) 🎬 The demo video script (~90–110s)

Record your screen (the live site), and ideally a small webcam inset of your face so judges see the **real blinks** driving it. Speak calmly; let the moments land.

| Time | On screen | Say (voiceover) |
| --- | --- | --- |
| 0:00–0:10 | The intro screen: *"Aloud."* | "Imagine being fully awake and aware — but unable to move, speak, or type. For people with ALS, cerebral palsy, or paralysis, that's every day." |
| 0:10–0:20 | Still on intro / your face in frame | "The tools they have are brutal — spelling letter by letter, sometimes in Morse code. Aloud needs just one movement: a blink." |
| 0:20–0:30 | Click **Begin** → calibration runs | "A helper turns on the camera once. Aloud calibrates to *your* eyes and lighting — then you control everything alone." |
| 0:30–0:48 | Home board scanning → **long-blink on "I'm in pain"** → it fills the screen and speaks | "The highlight moves on its own. Hold your eyes shut to choose — and Aloud says it out loud, instantly." |
| 0:48–1:00 | Open **People** → choose **"I love you"** (or "stay with me") → it speaks | "It's not just needs. It's the things that become impossible to say once your body fails." *(let "I love you" speak)* |
| 1:00–1:20 | Open **Spell it out** → type `c o l d` → **✨ AI suggestions** appear ("Could I have a blanket?") → select → **Say it** | "When the words aren't on a board, you spell — but the AI does the work. A few letters, and Gemini composes the whole sentence. It even understood that *cold* means I want a blanket." |
| 1:20–1:32 | Trigger **🔔 Call for help** → red screen + looping alarm | "And if you're alone and something's wrong — one blink calls for help, loudly, until someone comes." |
| 1:32–1:45 | Back to a calm screen / tagline | "On-device AI reads your eyes. Generative AI writes your words. It learns who you are. All private, all in the browser. **Aloud — everyone deserves a voice.**" |

**Recording tips**
- Calibrate *before* you hit record so blinks are crisp on camera.
- Good, even lighting on your face; don't sit backlit by a window.
- If a blink misses on the first take, just re-shoot — it should be reliable after calibration.
- Keyboard works as a backup (arrows + Space) if you ever need a clean take without the camera.

---

## 3) 📝 Devpost copy (paste & lightly edit)

**Tagline**
> A voice for anyone who can speak only with their eyes — on-device AI reads your blink, generative AI writes your sentence.

**Inspiration**
> Hundreds of thousands of people — with ALS, locked-in syndrome, cerebral palsy, late-stage Parkinson's, or paralysis — are fully present but can't speak or use their hands. The tools that exist make them spell letter-by-letter, sometimes in Morse code: slow, exhausting, and easy to give up on. I wanted to build something that needs only one reliable movement — a blink — and lets AI carry the rest.

**What it does**
> Aloud turns a blink into speech. A helper turns on the webcam once and the app calibrates to the user's eyes; after that it's fully hands-free. A highlight scans through calm boards of ready-made sentences, and a deliberate long blink selects one — Aloud shows it full-screen and says it aloud. When the right words aren't on a board, "Spell it out" lets the user compose anything by scanning a keyboard, with **AI turning a few letters into complete, natural sentences**. It includes a loud **call-for-help** alarm, a rest mode, and learns the phrases each person uses most.

**How we built it**
> Next.js 16 + React 19. The eye control is **MediaPipe FaceLandmarker**, an on-device neural network reading facial blendshapes every frame to detect a held blink — with a per-user calibration that places the detection thresholds in the gap between "eyes open" and "eyes closed." Predictions come from an instant on-device engine (frequency completion + n-gram + phrase matching), upgraded by **Google Gemini** (server-side route) that turns sparse, keyword-style input into full sentences. Speech is the Web Speech API. The scan state machine, editor, predictor, personalization, calibration math, and a semantic de-duplicator are all framework-free modules with `node --test` unit tests. Deployed on Vercel.

**Challenges we ran into**
> Making blink detection *reliable* across faces and lighting was the hard part — fixed thresholds missed too often, so I switched to a short "hold" that fires as soon as the eyes have been shut past a dwell, plus a per-user calibration. Fitting a full keyboard, predictions, and safety controls on one screen with **no scrolling** (the users can't scroll) took careful layout. And keeping AI suggestions genuinely distinct — not four rewordings of "cold water" — needed a content-word de-duplicator on top of prompt tuning.

**Accomplishments we're proud of**
> It's genuinely usable with nothing but your eyes, it runs private and on-device by default, and the AI meaningfully reduces effort — one word can become a full spoken sentence. The emotional vocabulary ("hold my hand", "stay with me", "I love you") gives back things people lose when they lose their voice.

**What we learned**
> How much accessibility design is about *removing* choices, not adding them — every extra button is a cost when each selection takes effort. And that the best use of AI here isn't flashy; it's quietly doing the typing so a person with one movement can speak fluently.

**What's next for Aloud**
> Personalized name/contact setup ("call Sarah"), a pain-scale and numbers, voice selection, saved custom phrases, and an installable offline PWA for a bedside tablet.

**Built with:** `nextjs` `react` `mediapipe` `google-gemini` `web-speech-api` `javascript` `vercel` `accessibility`

---

## 4) 🤖 The "Best Use of AI/ML" paragraph (say/write this verbatim)

> Aloud is AI from input to output. A **MediaPipe neural network** reads the user's eyes on-device and **calibrates its thresholds to each individual** — the ML *is* the interface, the only way someone without hand movement operates the app. **Google Gemini** then does the hardest part: it turns a few eye-selected keywords into a complete, natural sentence ("cold" → "Could I have a blanket?"), collapsing the physical effort that makes existing tools unusable — and it's marked with a ✨ so you can see it working. A small **on-device model also learns** the words and messages each person says most. Vision in, generative composition out, personalization on top — all private, all in the browser.

---

## 5) If a judge asks "what's actually novel?"

> Other eye-typing tools make you spell. Aloud lets you say *anything* with eyes alone — instant boards for urgent needs, and an **AI-assisted speller** for everything else — and the AI turns minimal input into fluent speech, fully on-device and private. It also calibrates and personalizes to the individual.

Go win it. 🚀
