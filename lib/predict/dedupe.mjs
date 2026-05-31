// Drop suggestions that mean the same thing. Whole sentences can be worded
// differently yet carry one intent ("I'd like cold water" vs "get me some cold
// water please") — so we compare each suggestion's CONTENT words (ignoring
// function/politeness words) and treat a high overlap as a duplicate. Pure.

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
