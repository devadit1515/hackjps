// Suggestion engine — everything that turns the message-so-far into candidate
// completions. Four cooperating parts kept in one place:
//   1. on-device — instant, offline phrase / word-completion / next-word prediction
//   2. personal  — a tiny model that learns what THIS person actually says
//   3. gemini    — optional generative upgrade (server-side key) → full sentences
//   4. dedupe    — drop suggestions that mean the same thing, however worded
// Everything except the Gemini fetch is pure and unit-tested (test/predict.test.mjs).
import { WORDS, BIGRAMS, PHRASES, STARTERS, SYNONYMS } from "./lexicon.mjs";

// Shared text helpers — auto-capitalisation at sentence starts.
const ENDS_SENTENCE = /[.?!]\s*$/;
const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
const capWanted = (base) => base === "" || ENDS_SENTENCE.test(base);

/* ============================================================
   1. On-device predictor — pure, instant, offline. Given the message so far,
   returns up to `limit` suggestions, each { label (what shows), text (the FULL
   message after acceptance, already spaced + capitalized) }. Priority order:
     1. whole AAC phrases that match what's typed (biggest jump forward)
     2. completing the word currently being typed
     3. predicting the next word from the last one
   ============================================================ */
const groupOf = (w) => SYNONYMS[w] || w;

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

  // 2) complete the current partial word (one word per meaning — no near-duplicates)
  if (partial) {
    const pl = partial.toLowerCase();
    const groups = new Set();
    for (const w of WORDS) {
      if (w.includes(" ")) continue; // skip multi-word entries here
      if (w.length > pl.length && w.startsWith(pl)) {
        const grp = groupOf(w);
        if (groups.has(grp)) continue; // a same-meaning word is already suggested
        groups.add(grp);
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

/* ============================================================
   2. On-device personalization — a tiny adaptive model that learns the words and
   whole messages THIS person actually says, and surfaces them first next time.
   Everything stays on the device (localStorage); the scoring core is pure so it
   can be unit-tested. This is genuine online learning: usage updates the model.
   ============================================================ */
const KEY = "aloud.personal.v1";

function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && d.words && Array.isArray(d.phrases)) return d;
  } catch { /* ignore */ }
  return { words: {}, phrases: [] };
}
function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* ignore */ } }

// Pure: fold a freshly-spoken message into the model.
export function learn(data, text) {
  const t = (text || "").trim();
  if (!t) return data;
  const words = { ...data.words };
  for (const w of (t.toLowerCase().match(/[a-z']{2,}/g) || [])) words[w] = (words[w] || 0) + 1;
  const phrases = data.phrases.map((p) => ({ ...p }));
  const hit = phrases.find((p) => p.text.toLowerCase() === t.toLowerCase());
  if (hit) hit.n += 1;
  else phrases.push({ text: t, n: 1 });
  phrases.sort((a, b) => b.n - a.n);
  return { words, phrases: phrases.slice(0, 40) };
}

// Pure: suggestions from the learned model for the message so far.
export function personalFrom(data, text, limit = 2) {
  const out = [];
  const seen = new Set();
  const push = (label, full) => {
    const k = full.trim().toLowerCase();
    if (!label || seen.has(k)) return;
    seen.add(k); out.push({ label, text: full, personal: true });
  };
  const raw = text || "";
  const trimmedEnd = raw.replace(/\s+$/, "");

  if (!trimmedEnd) {
    for (const p of data.phrases.slice(0, limit)) push(p.text, p.text.endsWith(" ") ? p.text : p.text + " ");
    return out.slice(0, limit);
  }
  const low = trimmedEnd.toLowerCase();
  // a whole learned message that begins with what's typed
  for (const p of data.phrases) {
    if (p.text.toLowerCase().startsWith(low) && p.text.toLowerCase() !== low) push(p.text, p.text + " ");
    if (out.length >= limit) return out.slice(0, limit);
  }
  // a learned word completing the current partial
  const m = raw.match(/[A-Za-z']+$/);
  if (m) {
    const partial = m[0].toLowerCase();
    const base = raw.slice(0, raw.length - m[0].length);
    const cands = Object.entries(data.words)
      .filter(([w]) => w.length > partial.length && w.startsWith(partial))
      .sort((a, b) => b[1] - a[1]);
    for (const [w] of cands) {
      push(w, base + (capWanted(base) ? cap(w) : w) + " ");
      if (out.length >= limit) break;
    }
  }
  return out.slice(0, limit);
}

// Browser-facing wrappers.
export function recordMessage(text) { save(learn(load(), text)); }
export function personalSuggest(text, limit = 2) { return personalFrom(load(), text, limit); }

/* ============================================================
   3. Client-side facade for the optional Gemini upgrade. Calls our own server
   route (the key lives there, never in the browser). Returns suggestion objects
   shaped like the on-device ones, or null on any failure / missing key — the
   caller then just keeps the on-device suggestions. Never throws. Once we learn
   there's no key (or the route is unreachable), stop probing for the rest of the
   session so we never spam the network or the console.
   ============================================================ */
let disabled = false;

export async function geminiSuggest(text, { signal } = {}) {
  if (disabled) return null;
  try {
    const res = await fetch("/api/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal,
    });
    if (!res.ok) return null; // 502 = call failed → fall back silently
    const data = await res.json();
    if (data?.disabled) { disabled = true; return null; } // no server key configured
    if (!Array.isArray(data?.suggestions)) return null;
    return data.suggestions
      .filter((s) => typeof s === "string" && s.trim())
      .map((s) => {
        const t = s.trim();
        return { label: t, text: /\s$/.test(t) ? t : t + " ", ai: true }; // marked so the UI can show it's AI
      });
  } catch {
    return null; // includes AbortError when a newer keystroke supersedes this one
  }
}

/* ============================================================
   4. Drop suggestions that mean the same thing. Whole sentences can be worded
   differently yet carry one intent ("I'd like cold water" vs "get me some cold
   water please") — so we compare each suggestion's CONTENT words (ignoring
   function/politeness words) and treat a high overlap as a duplicate. Pure.
   ============================================================ */
const STOP = new Set((
  "a an the and or but so as if then of in on at by to for from with about into over under " +
  "i you he she it we they me him her us them my your his its our their mine yours this that these those " +
  "is am are be been being was were do does did done have has had having " +
  "can could would should will shall may might must not no yes please " +
  "want wants need needs like would get got give gives bring brings let lets take " +
  "some any more most very really just now here there thing things"
).split(" "));

export function contentWords(text) {
  return new Set((String(text).toLowerCase().match(/[a-z]+/g) || []).filter((w) => w.length >= 3 && !STOP.has(w)));
}

// Two suggestions mean ~the same thing if their content words overlap a lot.
export function sameMeaning(a, b) {
  const A = contentWords(a), B = contentWords(b);
  if (!A.size || !B.size) return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  const union = A.size + B.size - inter;
  return union > 0 && inter / union >= 0.6;
}

// Keep the first of each meaning; later near-duplicates are dropped.
export function dedupeByMeaning(items, textOf = (x) => (typeof x === "string" ? x : x.text)) {
  const kept = [];
  for (const it of items) {
    if (it == null) continue;
    if (kept.some((k) => sameMeaning(textOf(k), textOf(it)))) continue;
    kept.push(it);
  }
  return kept;
}
