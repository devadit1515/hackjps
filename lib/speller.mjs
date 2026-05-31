export class ScanMachine {
  constructor(rows = []) {
    this.rows = rows;
    this.mode = "row";
    this.row = 0;
    this.cell = 0;
  }
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

  tick() {
    if (!this.rows.length) return;
    if (this.mode === "row") {
      this.row = (this.row + 1) % this.rows.length;
    } else {
      const r = this.rows[this.row] || [];
      if (r.length) this.cell = (this.cell + 1) % r.length;
    }
  }

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
    this.mode = "row"; this.cell = 0; this.row = 0;
    return { type: "cell", item };
  }

  toRows() { this.mode = "row"; this.cell = 0; }

  state() { return { mode: this.mode, row: this.row, cell: this.cell }; }
}
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
  capNext() {
    return this.text === "" || ENDS_SENTENCE.test(this.text);
  }

  addLetter(ch) {
    this._snapshot();
    this.text += this.capNext() ? ch.toUpperCase() : ch.toLowerCase();
  }

  addSpace() {
    if (!this.text || this.text.endsWith(" ")) return;
    this._snapshot();
    this.text += " ";
  }

  addPunct(p) {
    this._snapshot();
    this.text = this.text.replace(/\s+$/, "") + p + " ";
  }
  setText(full) {
    this._snapshot();
    this.text = full;
  }

  delLetter() {
    if (!this.text) return;
    this._snapshot();
    if (/\s$/.test(this.text)) this.text = this.text.replace(/\s+$/, "");
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
const back = (key) => ({ kind: "back", label: "back", value: "back", icon: "CornerDownLeft", key: "back-" + key });

function letters(str, extra = [], rowKey = str) {
  const cells = str.split("").map((ch) => ({ kind: "letter", label: ch, value: ch, key: "L" + ch }));
  return [...cells, ...extra, back(rowKey)];
}

export const ROW_LABELS = ["Suggestions", "A–I", "J–R", "S–Z", "Edit", "Actions"];

export function buildRows(suggestions = [], canSay = false) {
  const sg = suggestions.slice(0, canSay ? 3 : 4).map((s, i) => ({
    kind: "suggestion", label: s.label, value: s.text, ai: !!s.ai, key: "sg" + i,
  }));
  const sayCell = canSay ? [{ kind: "say", label: "Say it", value: "say", icon: "Megaphone", key: "sayit" }] : [];

  return [
    [...sayCell, ...sg, back("sg")],
    letters("ABCDEFGHI", [], "ai"),
    letters("JKLMNOPQR", [], "jr"),
    letters("STUVWXYZ", [{ kind: "space", label: "space", value: " ", icon: "Space", key: "space" }], "sz"),
    [
      { kind: "edit", label: "letter", value: "delLetter", icon: "Delete", key: "delLetter" },
      { kind: "edit", label: "word", value: "delWord", icon: "Eraser", key: "delWord" },
      { kind: "edit", label: "undo", value: "undo", icon: "Undo2", key: "undo" },
      { kind: "edit", label: "clear", value: "clear", icon: "Trash2", key: "clear" },
      { kind: "punct", label: ".", value: ".", key: "dot" },
      { kind: "punct", label: ",", value: ",", key: "comma" },
      { kind: "punct", label: "?", value: "?", key: "qmark" },
      back("edit"),
    ],
    [
      { kind: "action", label: "speak", value: "speak", icon: "Volume2", key: "speak" },
      { kind: "action", label: "rest", value: "rest", icon: "PauseCircle", key: "rest" },
      { kind: "action", label: "recent", value: "recent", icon: "History", key: "recent" },
      { kind: "action", label: "speed", value: "speed", icon: "Gauge", key: "speed" },
      { kind: "action", label: "call for help", value: "call", icon: "Siren", urgent: true, key: "call" },
      back("act"),
    ],
  ];
}
