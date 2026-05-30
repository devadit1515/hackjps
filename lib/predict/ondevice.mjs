// On-device predictor — pure, instant, offline. Given the message so far, returns
// up to `limit` suggestions, each as { label (what shows), text (the FULL message
// after acceptance, already spaced + capitalized) }. Order of priority:
//   1. whole AAC phrases that match what's typed (biggest jump forward)
//   2. completing the word currently being typed
//   3. predicting the next word from the last one
import { WORDS, BIGRAMS, PHRASES, STARTERS } from "./data/lexicon.mjs";

const ENDS_SENTENCE = /[.?!]\s*$/;
const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
const capWanted = (base) => base === "" || ENDS_SENTENCE.test(base);

export function suggest(text, limit = 4) {
  const out = [];
  const seen = new Set();
  const push = (label, full) => {
    const key = full.trim().toLowerCase();
    if (!label || !full.trim() || seen.has(key)) return;
    seen.add(key);
    out.push({ label, text: full });
  };

  const raw = text || "";
  const trimmedEnd = raw.replace(/\s+$/, "");

  // empty message → common openers
  if (!trimmedEnd) {
    for (const s of STARTERS) push(s, ENDS_SENTENCE.test(s) ? s + " " : s + " ");
    return out.slice(0, limit);
  }

  // the partial word currently being typed (trailing letters)
  const m = raw.match(/[A-Za-z']+$/);
  const partial = m ? m[0] : "";
  const base = m ? raw.slice(0, raw.length - partial.length) : raw;
  const low = trimmedEnd.toLowerCase();

  // 1) whole-phrase matches (cap at 3 so completions still get a slot)
  let phraseCount = 0;
  for (const p of PHRASES) {
    const pl = p.toLowerCase();
    if (pl.startsWith(low) && pl !== low) {
      push(p, p + " ");
      if (++phraseCount >= 3) break;
    }
  }

  // 2) complete the current partial word
  if (partial) {
    const pl = partial.toLowerCase();
    for (const w of WORDS) {
      if (w.includes(" ")) continue; // skip multi-word entries here
      if (w.length > pl.length && w.startsWith(pl)) {
        push(w, base + (capWanted(base) ? cap(w) : w) + " ");
      }
      if (out.length >= limit) break;
    }
  } else {
    // 3) next-word prediction from the last completed word
    const parts = trimmedEnd.split(/\s+/);
    const last = (parts[parts.length - 1] || "").toLowerCase().replace(/[^a-z']/g, "");
    const nexts = BIGRAMS[last] || [];
    const spaced = trimmedEnd + " ";
    for (const w of nexts) {
      push(w, spaced + (capWanted(spaced) ? cap(w) : w) + " ");
      if (out.length >= limit) break;
    }
  }

  return out.slice(0, limit);
}
