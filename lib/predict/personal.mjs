// On-device personalization — a tiny adaptive model that learns the words and
// whole messages THIS person actually says, and surfaces them first next time.
// Everything stays on the device (localStorage); the scoring core is pure so it
// can be unit-tested. This is genuine online learning: usage updates the model.

const KEY = "aloud.personal.v1";
const ENDS_SENTENCE = /[.?!]\s*$/;
const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
const capWanted = (base) => base === "" || ENDS_SENTENCE.test(base);

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
