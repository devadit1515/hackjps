"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { icons } from "lucide-react";
import { CATEGORIES, WORDS } from "@/lib/board";
import { useSpeech } from "@/lib/useSpeech";
import Speller from "@/components/Speller";

const BlinkCam = dynamic(() => import("@/components/BlinkCam"), { ssr: false });

function LIcon({ name, size = 30, stroke = 1.5 }) {
  const Cmp = icons[name] || icons.Circle;
  return <Cmp size={size} strokeWidth={stroke} aria-hidden />;
}

const SCAN_MS = 1450;

export default function Aloud() {
  const [started, setStarted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [camReady, setCamReady] = useState(false);
  const [toast, setToast] = useState("");

  const [view, setView] = useState("home");
  const [focusIdx, setFocusIdx] = useState(null);
  const [hovering, setHovering] = useState(false);
  const [dwellLocked, setDwellLocked] = useState(false);
  const [eyesClosed, setEyesClosed] = useState(false);
  const [recents, setRecents] = useState([]);
  const [calibrating, setCalibrating] = useState(false);
  const [recalNonce, setRecalNonce] = useState(0);

  const speech = useSpeech();
  const spellRef = useRef(null);

  const pushRecent = useCallback((t) => {
    setRecents((r) => [t, ...r.filter((x) => x !== t)].slice(0, 5));
  }, []);

  const dismissAnnounce = useCallback(() => {
    const rt = speech.announce?.returnTo || "home";
    speech.stopAnnounce();
    setView(rt);
    if (rt !== "spell") setFocusIdx(null);
  }, [speech]);

  const { primary, secondary, targets } = useMemo(() => {
    const primary = [], secondary = [];
    if (view === "home") {
      for (const c of CATEGORIES) primary.push({ key: "cat-" + c.id, type: "cat", ...c });
      primary.push({ key: "spell", type: "spell", label: "Spell it out", icon: "Keyboard", wide: true, sub: "Build any message, letter by letter" });
    } else if (WORDS[view]) {
      for (const w of WORDS[view]) primary.push({ key: "w-" + view + "-" + w.label, type: "say", ...w });
      secondary.push({ key: "back", type: "back", label: "Back", icon: "ChevronLeft", ghost: true });
    }
    return { primary, secondary, targets: [...primary, ...secondary] };
  }, [view]);

  const cols = view === "home" ? 2 : primary.length === 6 ? 3 : primary.length <= 2 ? 2 : 3;

  useEffect(() => { setFocusIdx(started ? 0 : null); }, [view, started]);

  useEffect(() => {
    if (!started || view === "spell" || speech.announce || showHelp || hovering || eyesClosed || calibrating || (camOn && !camReady)) return;
    const n = targets.length;
    if (!n) return;
    const id = setInterval(() => {
      setFocusIdx((i) => (i == null ? 0 : (i + 1) % n));
    }, SCAN_MS);
    return () => clearInterval(id);
  }, [started, view, speech.announce, showHelp, hovering, eyesClosed, calibrating, camOn, camReady, targets.length]);

  const select = useCallback((item) => {
    if (!item) return;
    setFocusIdx(null);
    setDwellLocked(true);
    switch (item.type) {
      case "cat": setView(item.id); break;
      case "spell": setView("spell"); break;
      case "say": speech.startAnnounce(item.say || item.label, { urgent: item.urgent, returnTo: "home" }); break;
      case "back": setView("home"); break;
      default: break;
    }
  }, [speech]);

  const selectFocused = useCallback(() => {
    if (focusIdx != null && targets[focusIdx]) select(targets[focusIdx]);
  }, [focusIdx, targets, select]);

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

  useEffect(() => {
    if (!started) return;
    function onKey(e) {
      if (showHelp) return;
      if (speech.announce) {
        if (["Space", "Enter", "Escape"].includes(e.code)) { e.preventDefault(); dismissAnnounce(); }
        return;
      }
      if (view === "spell") return;
      if (camOn && !camReady) return;
      if (e.code === "ArrowRight") { e.preventDefault(); moveFocus("right"); }
      else if (e.code === "ArrowLeft") { e.preventDefault(); moveFocus("left"); }
      else if (e.code === "ArrowDown") { e.preventDefault(); moveFocus("down"); }
      else if (e.code === "ArrowUp") { e.preventDefault(); moveFocus("up"); }
      else if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); selectFocused(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, showHelp, speech.announce, view, camOn, camReady, moveFocus, selectFocused, dismissAnnounce]);

  const longBlinkRef = useRef(() => {});
  useEffect(() => {
    longBlinkRef.current = () => {
      if (!started || showHelp) return;
      if (speech.announce) { dismissAnnounce(); return; }
      if (view === "spell") { spellRef.current?.longBlink(); return; }
      selectFocused();
    };
  });

  function flashToast(m) { setToast(m); setTimeout(() => setToast(""), 4000); }

  if (!started) {
    return (
      <Intro
        onBegin={() => {
          setStarted(true);
          setCamOn(true);
          speech.primeSpeech();
        }}
      />
    );
  }

  const camLoading = camOn && !camReady;

  const renderChoice = (item, extraClass) => {
    const idx = targets.indexOf(item);
    const isFocus = idx === focusIdx;
    const isDwell = isFocus && hovering && !dwellLocked;
    const cls = [
      "choice",
      item.type === "say" ? "is-word" : "",
      item.type === "spell" ? "spell-tile" : "",
      item.wide ? "wide" : "",
      item.ghost ? "ghost" : "",
      item.urgent ? "urgent" : "",
      isFocus ? "focus" : "",
      isDwell ? "dwell" : "",
      extraClass || "",
    ].join(" ");

    const catKey =
      item.id ||
      (item.type === "spell" ? "spell" : (view !== "home" && item.type === "say" ? view : undefined));

    return (
      <button
        key={item.key}
        className={cls}
        data-cat={catKey}
        onMouseEnter={() => { if (camLoading) return; setFocusIdx(idx); setHovering(true); }}
        onMouseLeave={() => { setHovering(false); setDwellLocked(false); }}
        onClick={() => { if (camLoading) return; select(item); }}
        aria-label={item.label}
      >
        <span className="c-ico"><LIcon name={item.icon} size={item.type === "cat" ? 30 : 26} /></span>
        <span className="c-label">{item.label}</span>
        {item.sub && <span className="c-sub">{item.sub}</span>}
        <span className="dwell-bar" onAnimationEnd={() => { if (isDwell && !camLoading) select(item); }} />
      </button>
    );
  };

  const crumb = view === "home" ? "What would you like to say?" : (CATEGORIES.find((c) => c.id === view)?.label || "");

  return (
    <div className="app-light">
      {view === "spell" ? (
        <Speller
          ref={spellRef}
          active={started && !speech.announce && !showHelp && !calibrating}
          eyesClosed={eyesClosed}
          startAnnounce={speech.startAnnounce}
          say={speech.say}
          onExit={() => { setView("home"); setFocusIdx(0); }}
          recents={recents}
          onSpoke={pushRecent}
        />
      ) : (
        <>
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

          <main className="canvas" data-board={view}>
            <span className="crumb">{crumb}</span>
            <div className="choices" data-cols={cols}>
              {primary.map((it) => renderChoice(it))}
            </div>
            {secondary.length > 0 && (
              <div className="sub-actions">{secondary.map((it) => renderChoice(it, "sub"))}</div>
            )}
          </main>

          <footer className="hint">
            {camOn ? <><span className="live" /> The highlight moves on its own · take a long blink to select</> : <>Hover to dwell, or use <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> then <kbd>Space</kbd></>}
          </footer>
        </>
      )}

      {camOn && (
        <BlinkCam
          onLongBlink={() => longBlinkRef.current()}
          onEyesClosed={(c) => setEyesClosed(c)}
          onCalibrating={(c) => setCalibrating(c)}
          onReady={() => setCamReady(true)}
          recalNonce={recalNonce}
          say={speech.say}
          onError={(m) => { flashToast(m); setCamOn(false); setCamReady(false); }}
        />
      )}

      {camLoading && (
        <div className="calib" role="dialog" aria-label="Starting camera">
          <div className="calib-card">
            <span className="calib-ico"><LIcon name="Camera" size={34} /></span>
            <h2>Starting camera…</h2>
            <p>One moment — getting eye control ready. Allow the camera if your browser asks.</p>
          </div>
        </div>
      )}

      {speech.announce && <Announce data={speech.announce} speaking={speech.speaking} onDone={dismissAnnounce} />}
      {toast && <div className="toast">{toast}</div>}
      {showHelp && <HelpSheet onClose={() => setShowHelp(false)} onRecalibrate={() => { setShowHelp(false); setRecalNonce((n) => n + 1); }} />}
    </div>
  );
}

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
        <LIcon name="Check" size={22} stroke={2.2} /> I got help
        {dwell && <span className="dwell-bar" onAnimationEnd={onDone} />}
      </button>
      <span className="a-hint">This will keep playing until you long-blink again — or choose <b>I got help</b>.</span>
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

function HelpSheet({ onClose, onRecalibrate }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h2>Speaking with your eyes</h2>
        <p>Choose a ready-made line, or open <b>Spell it out</b> to build any message — then Aloud says it aloud and repeats it until you signal you&apos;re okay. No typing, no hands.</p>
        <div className="steps">
          <div className="st"><span className="si"><LIcon name="ScanLine" size={20} /></span><span><div className="stt">It scans for you</div><div className="std">The highlight moves through the choices on its own — you just watch and wait.</div></span></div>
          <div className="st"><span className="si"><LIcon name="Eye" size={20} /></span><span><div className="stt">Long-blink to choose</div><div className="std">When the highlight lands on what you want, hold your eyes shut for about a second.</div></span></div>
          <div className="st"><span className="si"><LIcon name="Keyboard" size={20} /></span><span><div className="stt">Spell anything</div><div className="std">Open “Spell it out” to compose a custom message — predictions do most of the work.</div></span></div>
        </div>
        <div className="sheet-actions">
          {onRecalibrate && (
            <button className="recal" onClick={onRecalibrate}>
              <LIcon name="ScanFace" size={17} stroke={2} /> Recalibrate eye control
            </button>
          )}
          <button className="close" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  );
}
