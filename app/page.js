"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { icons } from "lucide-react";
import { CATEGORIES, WORDS, QUICK } from "@/lib/board";
import { composeLocal } from "@/lib/compose-local";

const BlinkCam = dynamic(() => import("@/components/BlinkCam"), { ssr: false });

function LIcon({ name, size = 30, stroke = 1.5 }) {
  const Cmp = icons[name] || icons.Circle;
  return <Cmp size={size} strokeWidth={stroke} aria-hidden />;
}

const SCAN_MS = 1700;

export default function Aloud() {
  const [started, setStarted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [toast, setToast] = useState("");

  const [view, setView] = useState("home"); // home | feel | need | do | social | quick
  const [strip, setStrip] = useState([]);
  const [sentence, setSentence] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [composing, setComposing] = useState(false);
  const [history, setHistory] = useState([]);

  const [focusIdx, setFocusIdx] = useState(null);
  const [hovering, setHovering] = useState(false);
  const [dwellLocked, setDwellLocked] = useState(false); // re-arm after a selection (anti "Midas touch")

  const voiceRef = useRef(null);

  /* ---------- speech ---------- */
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const pick = () => {
      const v = window.speechSynthesis.getVoices();
      if (!v.length) return;
      voiceRef.current =
        v.find((x) => /Google US English/i.test(x.name)) ||
        v.find((x) => /Natural/i.test(x.name) && /^en/i.test(x.lang)) ||
        v.find((x) => x.lang === "en-US") ||
        v.find((x) => /^en/i.test(x.lang)) || v[0];
    };
    pick();
    window.speechSynthesis.onvoiceschanged = pick;
  }, []);

  const speak = useCallback((text) => {
    if (typeof window === "undefined" || !window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US"; u.rate = 1; u.pitch = 1;
    if (voiceRef.current) u.voice = voiceRef.current;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }, []);

  /* ---------- targets ---------- */
  const { primary, secondary, targets } = useMemo(() => {
    const primary = [];
    const secondary = [];
    if (view === "home") {
      for (const c of CATEGORIES) primary.push({ key: "cat-" + c.id, type: "cat", ...c });
      secondary.push({ key: "open-quick", type: "open-quick", label: "Quick", icon: "Zap", ghost: true });
      secondary.push({ key: "sos", type: "say", label: "SOS", icon: "Siren", say: "I need help, please.", urgent: true });
    } else if (view === "quick") {
      for (const q of QUICK) primary.push({ key: "q-" + q.label, type: "say", ...q });
      secondary.push({ key: "back", type: "back", label: "Back", icon: "ChevronLeft", ghost: true });
    } else {
      for (const w of WORDS[view] || []) primary.push({ key: "w-" + w.label, type: "word", ...w });
      secondary.push({ key: "back", type: "back", label: "Back", icon: "ChevronLeft", ghost: true });
    }
    if (strip.length) {
      secondary.unshift({ key: "speak", type: "speak", label: "Speak", icon: "Volume2", accent: true });
      secondary.push({ key: "clear", type: "clear", label: "Start over", icon: "RotateCcw", ghost: true });
    }
    return { primary, secondary, targets: [...primary, ...secondary] };
  }, [view, strip.length]);

  const cols = primary.length === 4 ? 4 : primary.length === 6 ? 3 : primary.length <= 2 ? 2 : 3;

  useEffect(() => { setFocusIdx(null); }, [view, strip.length]);

  /* ---------- compose + speak ---------- */
  const finishSpeak = useCallback((line) => {
    setSentence(line); setHistory((h) => [...h, line]); speak(line); setStrip([]); setView("home");
  }, [speak]);

  const doSpeak = useCallback(async () => {
    if (!strip.length || composing) return;
    setComposing(true);
    // a beat of "composing" so the sentence feels considered, then on-device compose
    const line = composeLocal(strip);
    setSentence("");
    await new Promise((r) => setTimeout(r, 480));
    setComposing(false);
    finishSpeak(line);
  }, [strip, composing, finishSpeak]);

  /* ---------- selection ---------- */
  const select = useCallback((item) => {
    if (!item) return;
    setFocusIdx(null);
    setDwellLocked(true); // must look away once before another dwell can fire
    switch (item.type) {
      case "cat": setView(item.id); break;
      case "word": setStrip((s) => [...s, item.label]); setView("home"); break;
      case "open-quick": setView("quick"); break;
      case "say": setSentence(item.say || item.label); setHistory((h) => [...h, item.say || item.label]); speak(item.say || item.label); if (view === "quick") setView("home"); break;
      case "speak": doSpeak(); break;
      case "clear": setStrip([]); setSentence(""); break;
      case "back": setView("home"); break;
      default: break;
    }
  }, [doSpeak, speak, view]);

  const selectFocused = useCallback(() => {
    if (focusIdx != null && targets[focusIdx]) select(targets[focusIdx]);
  }, [focusIdx, targets, select]);

  /* ---------- keyboard (arrows move, space/enter select) ---------- */
  useEffect(() => {
    if (!started) return;
    function onKey(e) {
      if (showHelp) return;
      const n = targets.length;
      if (e.code === "ArrowRight" || e.code === "ArrowDown") { e.preventDefault(); setHovering(false); setFocusIdx((i) => (i == null ? 0 : (i + 1) % n)); }
      else if (e.code === "ArrowLeft" || e.code === "ArrowUp") { e.preventDefault(); setHovering(false); setFocusIdx((i) => (i == null ? n - 1 : (i - 1 + n) % n)); }
      else if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); selectFocused(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, showHelp, targets.length, selectFocused]);

  /* ---------- gentle scan for eyes-only users ---------- */
  useEffect(() => {
    if (!started || !camOn || hovering || showHelp || composing) return;
    if (!targets.length) return;
    const id = setInterval(() => setFocusIdx((i) => (i == null ? 0 : (i + 1) % targets.length)), SCAN_MS);
    return () => clearInterval(id);
  }, [started, camOn, hovering, showHelp, composing, targets.length]);

  /* ---------- blink select (latest) ---------- */
  const blinkRef = useRef(() => {});
  useEffect(() => { blinkRef.current = () => { if (started && !showHelp) selectFocused(); }; });

  function flashToast(m) { setToast(m); setTimeout(() => setToast(""), 4000); }

  /* ============================================================ */
  if (!started) {
    return (
      <Intro
        onBegin={() => {
          setStarted(true);
          if (typeof window !== "undefined" && window.speechSynthesis) {
            try { window.speechSynthesis.speak(new SpeechSynthesisUtterance("")); } catch {}
          }
        }}
      />
    );
  }

  const renderChoice = (item, extraClass) => {
    const idx = targets.indexOf(item);
    const isFocus = idx === focusIdx;
    const isDwell = isFocus && hovering && !dwellLocked;
    const cls = [
      "choice",
      item.type === "word" || item.type === "say" ? "is-word" : "",
      item.ghost ? "ghost" : "",
      item.accent ? "accent" : "",
      item.urgent ? "urgent" : "",
      isFocus ? "focus" : "",
      isDwell ? "dwell" : "",
      extraClass || "",
    ].join(" ");
    return (
      <button
        key={item.key}
        className={cls}
        onMouseEnter={() => { setFocusIdx(idx); setHovering(true); }}
        onMouseLeave={() => { setFocusIdx(null); setHovering(false); setDwellLocked(false); }}
        onClick={() => select(item)}
        aria-label={item.label}
      >
        <span className="c-ico"><LIcon name={item.icon} size={item.accent || (!item.ghost && (item.type === "cat")) ? 30 : 26} /></span>
        <span className="c-label">{item.label}</span>
        <span className="dwell-bar" onAnimationEnd={() => { if (isDwell) select(item); }} />
      </button>
    );
  };

  const crumb = view === "home" ? "What would you like to say?" : view === "quick" ? "Quick replies" : (CATEGORIES.find((c) => c.id === view)?.label || "");

  return (
    <div className="app-light">
      <header className="top">
        <div className="mark"><span className="dot" />Aloud</div>
        <div className="top-actions">
          <button className="ghost-btn" data-on={camOn} onClick={() => setCamOn((v) => !v)}>
            <LIcon name={camOn ? "Eye" : "EyeOff"} size={16} stroke={2} /> {camOn ? "Eyes on" : "Eyes"}
          </button>
          <button className="ghost-btn" onClick={() => setShowHelp(true)}>
            <LIcon name="HelpCircle" size={16} stroke={2} /> Help
          </button>
        </div>
      </header>

      <main className="canvas">
        <div className={`voice ${speaking ? "speaking" : ""}`}>
          <span className="eyebrow">{speaking ? "Speaking" : composing ? "Finding the words" : "Your voice"}</span>
          <p className={`voice-line ${sentence ? "" : "ph"}`}>
            {composing ? "…" : sentence || "Look at a word to begin."}
          </p>
          {strip.length > 0 && (
            <div className="trail">{strip.map((w, i) => <span className="tw" key={i}>{w}</span>)}</div>
          )}
        </div>

        <span className="crumb">{crumb}</span>

        <div className="choices" data-cols={cols}>
          {primary.map((it) => renderChoice(it))}
        </div>

        {secondary.length > 0 && (
          <div className="sub-actions">{secondary.map((it) => renderChoice(it, "sub"))}</div>
        )}
      </main>

      <footer className="hint">
        {camOn ? <><span className="live" /> Look &amp; blink to choose</> : <>Hover to dwell, or press <kbd>←</kbd> <kbd>→</kbd> then <kbd>Space</kbd></>}
      </footer>

      {camOn && <BlinkCam onBlink={() => blinkRef.current()} onError={(m) => { flashToast(m); setCamOn(false); }} />}
      {toast && <div className="toast">{toast}</div>}
      {showHelp && <HelpSheet onClose={() => setShowHelp(false)} />}
    </div>
  );
}

/* ============================================================ */
function Intro({ onBegin }) {
  const [dwell, setDwell] = useState(false);
  return (
    <div className="intro">
      <h1 className="i-mark">Aloud<span className="dot">.</span></h1>
      <p className="i-sub">A voice for anyone who can speak only with their eyes.</p>
      <div className="i-go">
        <button
          className="begin"
          onMouseEnter={() => setDwell(true)}
          onMouseLeave={() => setDwell(false)}
          onClick={onBegin}
        >
          Begin
          {dwell && <span className="dwell-bar" onAnimationEnd={onBegin} />}
        </button>
        <span className="i-hint">Look here, or press any key</span>
      </div>
      <KeyStart onBegin={onBegin} />
    </div>
  );
}

function KeyStart({ onBegin }) {
  useEffect(() => {
    const f = () => onBegin();
    window.addEventListener("keydown", f, { once: true });
    return () => window.removeEventListener("keydown", f);
  }, [onBegin]);
  return null;
}

function HelpSheet({ onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h2>Speaking with your eyes</h2>
        <p>Aloud needs only one small, reliable movement. Choose a few words and they become a full spoken sentence — no typing, no spelling.</p>
        <div className="steps">
          <div className="st"><span className="si"><LIcon name="Eye" size={20} /></span><span><div className="stt">Look or hover</div><div className="std">Rest on a choice — a line fills and it selects itself. No clicking.</div></span></div>
          <div className="st"><span className="si"><LIcon name="Sparkle" size={20} /></span><span><div className="stt">Or blink</div><div className="std">Turn on “Eyes”, and a deliberate blink chooses the highlighted card.</div></span></div>
          <div className="st"><span className="si"><LIcon name="Volume2" size={20} /></span><span><div className="stt">It speaks for you</div><div className="std">Your words become a natural sentence, said out loud — fully on your device.</div></span></div>
        </div>
        <button className="close" onClick={onClose}>Got it</button>
      </div>
    </div>
  );
}
