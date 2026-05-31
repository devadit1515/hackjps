// Spelling engine — pure, deterministic, framework-free. Three cooperating parts:
//   1. ScanMachine — the two-level row→cell scan that the long-blink drives
//   2. Editor      — the composed-message buffer (auto-caps, auto-space, undo)
//   3. buildRows   — the static grid the scanner walks (predictions + letters)
// No DOM here; the Speller component owns timing and rendering. Unit-tested
// (test/speller.test.mjs).

/* ============================================================
   1. Two-level scan state machine.

   row mode : the highlight walks rows top-to-bottom; select() enters that row.
   cell mode: the highlight walks cells left-to-right; select() picks the cell
              and returns to row mode (restarting at the top, so the freshly
              updated predictions are the first thing scanned again).

   A "back" cell returns to row mode without choosing anything. The owning
   component drives this: a timer calls tick() (paused while eyes are closed or
   resting), and a long blink calls select().
   ============================================================ */
export class ScanMachine {
  constructor(rows = []) {
    this.rows = rows;
    this.mode = "row"; // "row" | "cell"
    this.row = 0;
    this.cell = 0;
  }

  // Swap in fresh rows (e.g. when predictions change) without losing position.
  setRows(rows) {
    this.rows = rows;
    if (this.mode === "row") {
      if (this.row >= rows.length) this.row = 0;
    } else {
      const r = rows[this.row] || [];
      if (this.cell >= r.length) this.cell = 0;
    }
  }

  reset() { this.mode = "row"; this.row = 0; this.cell = 0; }

  // One scan step at the current level.
  tick() {
    if (!this.rows.length) return;
    if (this.mode === "row") {
      this.row = (this.row + 1) % this.rows.length;
    } else {
      const r = this.rows[this.row] || [];
      if (r.length) this.cell = (this.cell + 1) % r.length;
    }
  }

  // A deliberate long blink.
  select() {
    if (!this.rows.length) return { type: "none" };
    if (this.mode === "row") {
      this.mode = "cell";
      this.cell = 0;
      return { type: "enterRow", row: this.row };
    }
    const item = this.rows[this.row]?.[this.cell] || null;
    if (item && item.kind === "back") {
      this.mode = "row"; this.cell = 0;
      return { type: "back" };
    }
    // a real cell — apply it, then return to row mode at the top
    this.mode = "row"; this.cell = 0; this.row = 0;
    return { type: "cell", item };
  }

  // Escape hatch (e.g. the keyboard Esc / a forced back-to-rows).
  toRows() { this.mode = "row"; this.cell = 0; }

  state() { return { mode: this.mode, row: this.row, cell: this.cell }; }
}

/* ============================================================
   2. The composed-message buffer — pure, with a full undo stack. Handles
   auto-capitalization (sentence starts) and auto-spacing so the user never has
   to manage them. Suggestions arrive pre-formatted as a full message via setText.
   ============================================================ */
const ENDS_SENTENCE = /[.?!]\s*$/;

export class Editor {
  constructor(initial = "") {
    this.text = initial;
    this.history = [];
  }

  _snapshot() {
    this.history.push(this.text);
    if (this.history.length > 80) this.history.shift();
  }

  // True when the next typed letter begins a sentence (start, or after . ? !).
  capNext() {
    return this.text === "" || ENDS_SENTENCE.test(this.text);
  }

  addLetter(ch) {
    this._snapshot();
    this.text += this.capNext() ? ch.toUpperCase() : ch.toLowerCase();
  }

  addSpace() {
    if (!this.text || this.text.endsWith(" ")) return; // never lead or double-space
    this._snapshot();
    this.text += " ";
  }

  addPunct(p) {
    this._snapshot();
    this.text = this.text.replace(/\s+$/, "") + p + " ";
  }

  // Accept a suggestion: the predictor already encodes the full, formatted message.
  setText(full) {
    this._snapshot();
    this.text = full;
  }

  delLetter() {
    if (!this.text) return;
    this._snapshot();
    if (/\s$/.test(this.text)) this.text = this.text.replace(/\s+$/, ""); // one delete = drop trailing space
    else this.text = this.text.slice(0, -1);
  }

  delWord() {
    if (!this.text.trim()) { if (this.text) { this._snapshot(); this.text = ""; } return; }
    this._snapshot();
    let t = this.text.replace(/\s+$/, "").replace(/\S+$/, "").replace(/\s+$/, "");
    this.text = t ? t + " " : "";
  }

  undo() {
    if (!this.history.length) return false;
    this.text = this.history.pop();
    return true;
  }

  clear() {
    if (!this.text) return;
    this._snapshot();
    this.text = "";
  }
}

/* ============================================================
   3. The Speller grid — pure data, no DOM. Letters stay alphabetical and
   stationary (predictability beats raw speed for a tiring, often-alone user — the
   AI does the speed work). Predictions are row 0 so a guessed word is the fastest
   thing to reach. Every row ends with a "back" cell so a mis-entered row is never
   a dead end.
   ============================================================ */
const back = (key) => ({ kind: "back", label: "back", value: "back", icon: "CornerDownLeft", key: "back-" + key });

function letters(str, extra = [], rowKey = str) {
  const cells = str.split("").map((ch) => ({ kind: "letter", label: ch, value: ch, key: "L" + ch }));
  return [...cells, ...extra, back(rowKey)];
}

// Stable labels for the row-mode highlight / ARIA.
export const ROW_LABELS = ["Suggestions", "A–I", "J–R", "S–Z", "Edit", "Actions"];

// Build the full grid for the current suggestions. `suggestions` is an array of
// { label, text } where `text` is the FULL composed message after acceptance.
// When `canSay` is true (the message has content), a prominent "Say it" cell is
// placed first — the fastest thing to reach once a message is ready to speak.
export function buildRows(suggestions = [], canSay = false) {
  const sg = suggestions.slice(0, canSay ? 3 : 4).map((s, i) => ({
    kind: "suggestion", label: s.label, value: s.text, ai: !!s.ai, key: "sg" + i,
  }));
  const sayCell = canSay ? [{ kind: "say", label: "Say it", value: "say", icon: "Megaphone", key: "sayit" }] : [];

  return [
    [...sayCell, ...sg, back("sg")],                                              // 0 — say-it + predictions (scanned first)
    letters("ABCDEFGHI", [], "ai"),                                              // 1
    letters("JKLMNOPQR", [], "jr"),                                              // 2
    letters("STUVWXYZ", [{ kind: "space", label: "space", value: " ", icon: "Space", key: "space" }], "sz"), // 3
    [                                                                            // 4 — edit + punctuation
      { kind: "edit", label: "letter", value: "delLetter", icon: "Delete", key: "delLetter" },
      { kind: "edit", label: "word", value: "delWord", icon: "Eraser", key: "delWord" },
      { kind: "edit", label: "undo", value: "undo", icon: "Undo2", key: "undo" },
      { kind: "edit", label: "clear", value: "clear", icon: "Trash2", key: "clear" },
      { kind: "punct", label: ".", value: ".", key: "dot" },
      { kind: "punct", label: ",", value: ",", key: "comma" },
      { kind: "punct", label: "?", value: "?", key: "qmark" },
      back("edit"),
    ],
    [                                                                            // 5 — actions + safety
      { kind: "action", label: "speak", value: "speak", icon: "Volume2", key: "speak" },
      { kind: "action", label: "rest", value: "rest", icon: "PauseCircle", key: "rest" },
      { kind: "action", label: "recent", value: "recent", icon: "History", key: "recent" },
      { kind: "action", label: "speed", value: "speed", icon: "Gauge", key: "speed" },
      { kind: "action", label: "call for help", value: "call", icon: "Siren", urgent: true, key: "call" },
      back("act"),
    ],
  ];
}
