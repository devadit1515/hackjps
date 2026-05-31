"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { icons } from "lucide-react";
import { ScanMachine } from "@/lib/speller/machine.mjs";
import { Editor } from "@/lib/speller/editor.mjs";
import { buildRows, ROW_LABELS } from "@/lib/speller/layout.mjs";
import { suggest } from "@/lib/predict/ondevice.mjs";
import { geminiSuggest } from "@/lib/predict/gemini.mjs";
import { personalSuggest, recordMessage } from "@/lib/predict/personal.mjs";
import { dedupeByMeaning } from "@/lib/predict/dedupe.mjs";
import { cues } from "@/lib/audio/cues.mjs";

// Merge predictions from several sources in priority order, drop ones that mean
// the same thing (even if worded differently), and cap at 4.
function mergeSuggestions(...lists) {
  const all = [];
  for (const list of lists) for (const s of list || []) {
    if (s && s.label && (s.text || "").trim()) all.push(s);
  }
  return dedupeByMeaning(all).slice(0, 4);
}

function LIcon({ name, size = 22, stroke = 1.75 }) {
  const Cmp = icons[name] || icons.Circle;
  return <Cmp size={size} strokeWidth={stroke} aria-hidden />;
}

const SPEEDS = [1750, 1300, 950]; // slow · normal · fast (ms per scan step)
const SPEED_LABEL = ["slow", "normal", "fast"];

// Build the temporary single-row grid for the "recent messages" overlay.
function recentRows(recents) {
  const cells = (recents || []).slice(0, 5).map((t, i) => ({ kind: "recent", label: t, value: t, key: "rc" + i }));
  if (!cells.length) cells.push({ kind: "note", label: "No spoken messages yet", value: "", key: "rc-none" });
  cells.push({ kind: "back", label: "back", value: "back", icon: "CornerDownLeft", key: "rc-back" });
  return [cells];
}

const Speller = forwardRef(function Speller(
  { active, eyesClosed, startAnnounce, say, onExit, recents = [], onSpoke },
  ref
) {
  const editorRef = useRef(null);
  if (!editorRef.current) editorRef.current = new Editor();
  const machineRef = useRef(null);
  if (!machineRef.current) machineRef.current = new ScanMachine([]);

  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState(() => suggest("", 4));
  const [, force] = useState(0);
  const bump = useCallback(() => force((n) => n + 1), []);

  const [speedIdx, setSpeedIdx] = useState(1);
  const [resting, setResting] = useState(false);
  const [clearArmed, setClearArmed] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(false);     // soft per-scan tick (off by default)
  const speakLetters = false;                         // echo each letter aloud (kept off)

  const abortRef = useRef(null);

  /* ---------- predictions: on-device instantly, Gemini upgrades when reachable ---------- */
  const refreshSuggestions = useCallback((t) => {
    // instant, offline: what this person tends to say + the on-device model
    const personal = personalSuggest(t, 2);
    const base = suggest(t, 4);
    setSuggestions(mergeSuggestions(personal, base));
    if (abortRef.current) abortRef.current.abort();
    if (!t.trim()) return;
    // generative upgrade: AI turns sparse input into full sentences (when a key is set)
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const id = setTimeout(async () => {
      const g = await geminiSuggest(t, { signal: ctrl.signal });
      if (!g || ctrl.signal.aborted) return;
      // AI first (the showcase), then learned + on-device — dedupe removes overlap
      setSuggestions(mergeSuggestions(g, personal, base));
    }, 280);
    ctrl.signal.addEventListener("abort", () => clearTimeout(id));
  }, []);

  /* ---------- grid ---------- */
  const rows = useMemo(
    () => (recentOpen ? recentRows(recents) : buildRows(suggestions, text.trim().length > 0)),
    [recentOpen, recents, suggestions, text]
  );

  useEffect(() => {
    machineRef.current.setRows(rows);
    if (recentOpen) { machineRef.current.mode = "cell"; machineRef.current.row = 0; machineRef.current.cell = 0; }
    bump();
  }, [rows, recentOpen, bump]);

  /* ---------- auto-scan (frozen while eyes closed, resting, or inactive) ---------- */
  const scanMs = SPEEDS[speedIdx];
  useEffect(() => {
    if (!active || eyesClosed || resting) return;
    const id = setInterval(() => {
      machineRef.current.tick();
      if (soundOn) cues.tick();
      bump();
    }, scanMs);
    return () => clearInterval(id);
  }, [active, eyesClosed, resting, scanMs, soundOn, rows, bump]);

  // auto-disarm a pending "clear" after a few seconds
  useEffect(() => {
    if (!clearArmed) return;
    const id = setTimeout(() => setClearArmed(false), 7000);
    return () => clearTimeout(id);
  }, [clearArmed]);

  /* ---------- speaking ---------- */
  const doSpeakText = useCallback((t) => {
    const s = (t || "").trim();
    if (!s) return;
    onSpoke?.(s);
    recordMessage(s); // the model learns what this person actually says
    startAnnounce(s, { returnTo: "spell" });
  }, [onSpoke, startAnnounce]);

  const doSpeak = useCallback(() => doSpeakText(editorRef.current.text), [doSpeakText]);
  // The prominent "Say it" cell: announce, then return to Home when dismissed.
  const doSpeakHome = useCallback(() => {
    const t = editorRef.current.text.trim();
    if (!t) return;
    onSpoke?.(t);
    recordMessage(t);
    startAnnounce(t, { returnTo: "home" });
  }, [onSpoke, startAnnounce]);
  const doCall = useCallback(() => {
    cues.warn();
    startAnnounce("I need help. Please come quickly.", { urgent: true, returnTo: "spell" });
  }, [startAnnounce]);

  /* ---------- apply a chosen cell ---------- */
  const applyCell = useCallback((item) => {
    if (!item) return;
    const ed = editorRef.current;
    const isClear = item.kind === "edit" && item.value === "clear";
    if (!isClear && clearArmed) setClearArmed(false); // any other choice cancels a pending clear

    switch (item.kind) {
      case "letter": ed.addLetter(item.value); if (speakLetters) say(item.value); break;
      case "space": ed.addSpace(); break;
      case "punct": ed.addPunct(item.value); break;
      case "suggestion": ed.setText(item.value); break;
      case "say": doSpeakHome(); return;
      case "recent": doSpeakText(item.value); setRecentOpen(false); return;
      case "note": setRecentOpen(false); return;
      case "edit":
        if (item.value === "delLetter") ed.delLetter();
        else if (item.value === "delWord") ed.delWord();
        else if (item.value === "undo") ed.undo();
        else if (item.value === "clear") {
          if (clearArmed) { ed.clear(); setClearArmed(false); }
          else { setClearArmed(true); return; }
        }
        break;
      case "action":
        if (item.value === "speak") { doSpeak(); return; }
        if (item.value === "rest") { setResting(true); return; }
        if (item.value === "recent") { setRecentOpen(true); return; }
        if (item.value === "speed") { setSpeedIdx((i) => (i + 1) % SPEEDS.length); return; }
        if (item.value === "call") { doCall(); return; }
        break;
      default: break;
    }
    const t = ed.text;
    setText(t);
    refreshSuggestions(t);
  }, [clearArmed, speakLetters, say, doSpeak, doSpeakHome, doCall, doSpeakText, refreshSuggestions]);

  /* ---------- selection (long blink / Space / click) ---------- */
  const handleSelect = useCallback(() => {
    if (!active) return;
    if (resting) { setResting(false); return; } // BlinkCam already chimes on the blink
    const ev = machineRef.current.select();
    if (ev.type === "back") { if (recentOpen) setRecentOpen(false); else bump(); return; }
    if (ev.type === "enterRow") { bump(); return; }
    if (ev.type === "cell") applyCell(ev.item);
    bump();
  }, [active, resting, recentOpen, applyCell, bump]);

  // expose long-blink to the parent without re-subscribing the camera
  const selectRef = useRef(handleSelect);
  useEffect(() => { selectRef.current = handleSelect; }, [handleSelect]);
  useImperativeHandle(ref, () => ({ longBlink: () => selectRef.current() }), []);

  // mouse: hovering moves the highlight, clicking selects directly
  const moveTo = useCallback((r, c) => {
    const m = machineRef.current;
    m.mode = "cell"; m.row = r; m.cell = c; bump();
  }, [bump]);
  const directSelect = useCallback((r, c, item) => {
    const m = machineRef.current; m.mode = "cell"; m.row = r; m.cell = c;
    if (item.kind === "back") { if (recentOpen) setRecentOpen(false); else { m.toRows(); bump(); } return; }
    cues.select();
    applyCell(item);
    m.mode = "row"; m.cell = 0; m.row = 0; bump();
  }, [applyCell, recentOpen, bump]);

  /* ---------- keyboard fallback ---------- */
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); selectRef.current(); }
      else if (e.code === "ArrowRight" || e.code === "ArrowDown") {
        e.preventDefault();
        const m = machineRef.current;
        if (m.mode === "row") m.row = (m.row + 1) % m.rows.length;
        else { const rr = m.rows[m.row] || []; if (rr.length) m.cell = (m.cell + 1) % rr.length; }
        bump();
      } else if (e.code === "ArrowLeft" || e.code === "ArrowUp") {
        e.preventDefault();
        const m = machineRef.current;
        if (m.mode === "row") m.row = (m.row - 1 + m.rows.length) % m.rows.length;
        else { const rr = m.rows[m.row] || []; if (rr.length) m.cell = (m.cell - 1 + rr.length) % rr.length; }
        bump();
      } else if (e.code === "Escape") {
        e.preventDefault();
        if (recentOpen) setRecentOpen(false);
        else if (machineRef.current.mode === "cell") { machineRef.current.toRows(); bump(); }
        else onExit?.();
      } else if (e.code === "Backspace") { e.preventDefault(); editorRef.current.delLetter(); const t = editorRef.current.text; setText(t); refreshSuggestions(t); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, recentOpen, onExit, bump, refreshSuggestions]);

  /* ---------- render ---------- */
  const m = machineRef.current.state();
  const renderCell = (cell, r, c) => {
    const focused = m.mode === "cell" && r === m.row && c === m.cell;
    const isClearCell = cell.kind === "edit" && cell.value === "clear";
    const label = isClearCell && clearArmed ? "confirm?" : cell.label;
    const cls = [
      "sp-cell",
      "k-" + cell.kind,
      focused ? "on" : "",
      cell.urgent ? "urgent" : "",
      cell.ai ? "ai" : "",
      isClearCell && clearArmed ? "armed" : "",
    ].join(" ");
    return (
      <button
        key={cell.key + "-" + r + "-" + c}
        className={cls}
        onMouseEnter={() => moveTo(r, c)}
        onClick={() => directSelect(r, c, cell)}
        aria-label={cell.ai ? "AI suggestion: " + cell.label : cell.label}
      >
        {cell.ai
          ? <span className="sp-ico ai"><LIcon name="Sparkles" size={15} /></span>
          : cell.icon && cell.kind !== "letter" && cell.kind !== "space" && <span className="sp-ico"><LIcon name={cell.icon} size={cell.kind === "suggestion" ? 16 : 19} /></span>}
        <span className="sp-cap">{cell.kind === "space" ? "␣ space" : label}</span>
      </button>
    );
  };

  const rowFocused = (r) => m.mode === "row" && r === m.row;

  return (
    <div className="speller">
      <header className="sp-top">
        <button className="sp-exit" onClick={() => onExit?.()} aria-label="Back to home">
          <LIcon name="ChevronLeft" size={18} stroke={2} /> Home
        </button>
        <span className="sp-title">Spell it out</span>
        <span className="sp-speed"><LIcon name="Gauge" size={14} stroke={2} /> {SPEED_LABEL[speedIdx]}</span>
      </header>

      <div className="sp-screen">
        <span className="sp-eyebrow">Your message</span>
        <p className={`sp-message ${text ? "" : "empty"}`}>
          {text || "Pick a suggestion, or spell a word."}
          <span className="sp-cursor" />
        </p>
      </div>

      <div className="sp-grid" role="grid">
        {rows.map((row, r) => (
          <div key={"row" + r} className={`sp-row ${rowFocused(r) ? "row-on" : ""}`} role="row">
            {!recentOpen && (
              <span className="sp-rowtag">{ROW_LABELS[r] || ""}</span>
            )}
            <div className="sp-cells">
              {row.length === 1 && row[0].kind === "back" && !recentOpen
                ? <span className="sp-empty">no suggestions yet — keep spelling</span>
                : null}
              {row.map((cell, c) => renderCell(cell, r, c))}
            </div>
          </div>
        ))}
      </div>

      <footer className="sp-hint">
        {recentOpen
          ? <>Recent messages — long-blink one to say it again, or choose <b>back</b>.</>
          : m.mode === "row"
            ? <><span className="live" /> A row is highlighting — <b>long-blink</b> to open it</>
            : <><span className="live" /> Long-blink a letter or word · choose <b>back</b> to leave the row</>}
      </footer>

      {resting && (
        <div className="sp-rest" role="dialog" aria-label="Resting">
          <div className="sp-rest-card">
            <LIcon name="MoonStar" size={34} stroke={1.5} />
            <h3>Resting</h3>
            <p>Scanning is paused. Close your eyes for as long as you like.</p>
            <span className="sp-rest-hint">When you&apos;re ready, <b>long-blink</b> to carry on.</span>
            <button className="sp-rest-go" onClick={() => setResting(false)}>I&apos;m ready</button>
          </div>
        </div>
      )}
    </div>
  );
});

export default Speller;
