// Per-user blink calibration. We sample the blink blendshape with the eyes OPEN
// and then CLOSED, and place the close/open thresholds in the gap between the two
// — so detection adapts to each face and lighting instead of one fixed guess.
// Pure math here (unit-tested); storage helpers guard for the browser.

export const DEFAULTS = { close: 0.45, open: 0.25 };
const KEY = "aloud.blink.v1";

const round2 = (n) => Math.round(n * 100) / 100;

function percentile(arr, p) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.max(0, Math.round((p / 100) * (s.length - 1))));
  return s[i];
}

// Returns { close, open } tuned to the samples, or null if the two states aren't
// distinct enough to trust (caller should fall back to DEFAULTS).
export function computeThresholds(openSamples, closedSamples) {
  if (openSamples.length < 5 || closedSamples.length < 5) return null;
  const openLevel = percentile(openSamples, 85);    // upper edge of "open" noise
  const closedLevel = percentile(closedSamples, 65); // robust "closed" level
  const gap = closedLevel - openLevel;
  if (gap < 0.12) return null;                        // can't separate the two → defaults
  let close = openLevel + gap * 0.5;
  let open = openLevel + gap * 0.28;
  close = Math.min(0.9, Math.max(0.25, close));
  open = Math.min(close - 0.05, Math.max(0.1, open));
  return { close: round2(close), open: round2(open) };
}

export function loadThresholds() {
  try {
    const raw = typeof localStorage !== "undefined" && localStorage.getItem(KEY);
    if (!raw) return null;
    const t = JSON.parse(raw);
    if (typeof t?.close === "number" && typeof t?.open === "number") return t;
  } catch { /* ignore */ }
  return null;
}

export function saveThresholds(t) {
  try { localStorage.setItem(KEY, JSON.stringify(t)); } catch { /* ignore */ }
}
