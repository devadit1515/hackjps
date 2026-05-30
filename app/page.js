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

// How long the highlight rests on each choice before walking to the next one.
const SCAN_MS = 1700;

export default function Aloud() {
  const [started, setStarted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [toast, setToast] = useState("");

  const [view, setView] = useState("home"); // home | feel | need | do | social | quick
  const [announce, setAnnounce] = useState(null); // { text, urgent } | null
  const [speaking, setSpeaking] = useState(false);

  const [focusIdx, setFocusIdx] = useState(null);
  const [hovering, setHovering] = useState(false);
  const [dwellLocked, setDwellLocked] = useState(false);
  const [eyesClosed, setEyesClosed] = useState(false); // freeze the scan while a blink is in progress

  const voiceRef = useRef(null);
  const announcingRef = useRef(false);

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

  const speakOnce = useCallback((text, onend) => {
    if (typeof window === "undefined" || !window.speechSynthesis || !text) { onend && onend(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US"; u.rate = 1; u.pitch = 1;
    if (voiceRef.current) u.voice = voiceRef.current;
    u.onstart = () => setSpeaking(true);
    u.onend = () => { setSpeaking(false); onend && onend(); };
    u.onerror = () => { setSpeaking(false); onend && onend(); };
    window.speechSynthesis.speak(u);
  }, []);

  /* ---------- announce (full-screen, looping until Done) ---------- */
  const startAnnounce = useCallback((text, urgent) => {
    if (!text) return;
    setAnnounce({ text, urgent: !!urgent });
    setFocusIdx(0);
    announcingRef.current = true;
    const loop = () => {
      if (!announcingRef.current) return;
      speakOnce(text, () => { if (announcingRef.current) setTimeout(loop, 550); });
    };
    loop();
  }, [speakOnce]);

  const stopAnnounce = useCallback(() => {
    announcingRef.current = false;
    try { window.speechSynthesis.cancel(); } catch {}
    setSpeaking(false);
    setAnnounce(null);
    setView("home");
    setFocusIdx(null);
  }, []);

  /* ---------- targets ---------- */
  const { primary, secondary, targets } = useMemo(() => {
    const primary = [], secondary = [];
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
    return { primary, secondary, targets: [...primary, ...secondary] };
  }, [view]);

  const cols = primary.length === 4 ? 2 : primary.length === 6 ? 3 : primary.length <= 2 ? 2 : 3;

  // Whenever the screen changes, put the highlight back on the first choice.
  useEffect(() => { setFocusIdx(started ? 0 : null); }, [view, started]);

  /* ---------- auto-scan: the highlight walks the choices on its own ----------
     Pauses while a blink is in progress (eyesClosed) so a long blink selects the
     option the border was resting on — not one it drifted to while eyes were shut.
     Also pauses during an announcement, the help sheet, or a mouse hover. */
  useEffect(() => {
    if (!started || announce || showHelp || hovering || eyesClosed) return;
    const n = targets.length;
    if (!n) return;
    const id = setInterval(() => {
      setFocusIdx((i) => (i == null ? 0 : (i + 1) % n));
    }, SCAN_MS);
    return () => clearInterval(id);
  }, [started, announce, showHelp, hovering, eyesClosed, targets.length]);

  /* ---------- selection ---------- */
  const select = useCallback((item) => {
    if (!item) return;
    setFocusIdx(null);
    setDwellLocked(true);
    switch (item.type) {
      case "cat": setView(item.id); break;
      case "open-quick": setView("quick"); break;
      case "word": startAnnounce(composeLocal([item.label]), false); break;
      case "say": startAnnounce(item.say || item.label, item.urgent); break;
      case "back": setView("home"); break;
      default: break;
    }
  }, [startAnnounce]);

  const selectFocused = useCallback(() => {
    if (focusIdx != null && targets[focusIdx]) select(targets[focusIdx]);
  }, [focusIdx, targets, select]);

  // Keyboard moves the highlight (for testing / a helper); kept simple.
  const moveFocus = useCallback((dir) => {
    setHovering(false);
    const n = targets.length;
    if (!n) return;
    setFocusIdx((i) => {
      if (i == null) return 0;
      if (dir === "left") return (i - 1 + n) % n;
      if (dir === "right") return (i + 1) % n;
      if (dir === "up") return Math.max(0, i - cols);
      if (dir === "down") return Math.min(n - 1, i + cols);
      return i;
    });
  }, [targets.length, cols]);

  /* ---------- keyboard ---------- */
  useEffect(() => {
    if (!started) return;
    function onKey(e) {
      if (showHelp) return;
      if (announce) {
        if (["Space", "Enter", "Escape"].includes(e.code)) { e.preventDefault(); stopAnnounce(); }
        return;
      }
      if (e.code === "ArrowRight") { e.preventDefault(); moveFocus("right"); }
      else if (e.code === "ArrowLeft") { e.preventDefault(); moveFocus("left"); }
      else if (e.code === "ArrowDown") { e.preventDefault(); moveFocus("down"); }
      else if (e.code === "ArrowUp") { e.preventDefault(); moveFocus("up"); }
      else if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); selectFocused(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, showHelp, announce, moveFocus, selectFocused, stopAnnounce]);

  /* ---------- eye control (latest via refs) ----------
     The whole interface is one switch: a deliberate LONG blink.
     - on the boards: it selects whatever the scanning highlight is resting on.
     - on an announcement: it clears the message ("I'm okay now").
     A normal quick blink does nothing, so involuntary blinks never select. */
  const longBlinkRef = useRef(() => {});
  useEffect(() => {
    longBlinkRef.current = () => {
      if (!started || showHelp) return;
      if (announce) { stopAnnounce(); return; }
      selectFocused();
    };
  });

  function flashToast(m) { setToast(m); setTimeout(() => setToast(""), 4000); }

  /* ============================================================ */
  if (!started) {
    return (
      <Intro
        onBegin={() => {
          setStarted(true);
          setCamOn(true); // eye control is the only mode — request the camera immediately
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
        onMouseLeave={() => { setHovering(false); setDwellLocked(false); }}
        onClick={() => select(item)}
        aria-label={item.label}
      >
        <span className="c-ico"><LIcon name={item.icon} size={item.type === "cat" ? 30 : 26} /></span>
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
          <span className="eye-status" data-on={camOn}>
            <LIcon name="Eye" size={15} stroke={2} /> {camOn ? "Eye control on" : "Camera off"}
          </span>
          <button className="ghost-btn" onClick={() => setShowHelp(true)}>
            <LIcon name="HelpCircle" size={16} stroke={2} /> Help
          </button>
        </div>
      </header>

      <main className="canvas">
        <span className="crumb">{crumb}</span>
        <div className="choices" data-cols={cols}>
          {primary.map((it) => renderChoice(it))}
        </div>
        {secondary.length > 0 && (
          <div className="sub-actions">{secondary.map((it) => renderChoice(it, "sub"))}</div>
        )}
      </main>

      <footer className="hint">
        {camOn ? <><span className="live" /> The highlight moves on its own · long-blink to choose</> : <>Hover to dwell, or use <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> then <kbd>Space</kbd></>}
      </footer>

      {camOn && (
        <BlinkCam
          onLongBlink={() => longBlinkRef.current()}
          onEyesClosed={(c) => setEyesClosed(c)}
          onError={(m) => { flashToast(m); setCamOn(false); }}
        />
      )}

      {announce && <Announce data={announce} speaking={speaking} onDone={stopAnnounce} />}
      {toast && <div className="toast">{toast}</div>}
      {showHelp && <HelpSheet onClose={() => setShowHelp(false)} />}
    </div>
  );
}

/* ============================================================ */
function Announce({ data, speaking, onDone }) {
  const [dwell, setDwell] = useState(false);
  return (
    <div className={`announce ${data.urgent ? "urgent" : ""}`}>
      <div className={`a-pulse ${speaking ? "on" : ""}`} aria-hidden><span /><span /><span /><span /><span /></div>
      <p className="a-text">{data.text}</p>
      <button
        className="a-done"
        onMouseEnter={() => setDwell(true)}
        onMouseLeave={() => setDwell(false)}
        onClick={onDone}
      >
        <LIcon name="Check" size={22} stroke={2.2} /> Done — I&apos;m okay now
        {dwell && <span className="dwell-bar" onAnimationEnd={onDone} />}
      </button>
      <span className="a-hint">When you&apos;re okay again, just hold your eyes shut for a moment — or look at <b>Done</b> and long-blink.</span>
    </div>
  );
}

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
          Begin with eye control
          {dwell && <span className="dwell-bar" onAnimationEnd={onBegin} />}
        </button>
        <span className="i-hint">A helper taps once to turn on the camera. After that the highlight moves through the choices on its own — when it lands on what you want, <b>hold your eyes shut for a moment</b> to choose.</span>
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
        <p>Choose a word and Aloud says it aloud — then shows it big and repeats it until you signal you&apos;re okay. No typing, no hands.</p>
        <div className="steps">
          <div className="st"><span className="si"><LIcon name="ScanLine" size={20} /></span><span><div className="stt">It scans for you</div><div className="std">The highlight moves through the choices on its own — you just watch and wait.</div></span></div>
          <div className="st"><span className="si"><LIcon name="Eye" size={20} /></span><span><div className="stt">Long-blink to choose</div><div className="std">When the highlight lands on what you want, hold your eyes shut for about a second.</div></span></div>
          <div className="st"><span className="si"><LIcon name="Volume2" size={20} /></span><span><div className="stt">It speaks for you</div><div className="std">Your words fill the screen and repeat aloud — long-blink again to clear them.</div></span></div>
        </div>
        <button className="close" onClick={onClose}>Got it</button>
      </div>
    </div>
  );
}
