let ctx = null;

function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { ctx = null; }
  }
  return ctx;
}

function blip(freq, dur, gain) {
  const c = ac();
  if (!c) return;
  try {
    if (c.state === "suspended") c.resume();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    o.connect(g); g.connect(c.destination);
    const t = c.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch {  }
}

export const cues = {
  tick() { blip(640, 0.035, 0.035); },
  select() { blip(880, 0.09, 0.09); },
  add() { blip(1040, 0.06, 0.07); },
  warn() { blip(420, 0.20, 0.12); },
};
