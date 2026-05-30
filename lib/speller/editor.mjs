// The composed-message buffer — pure, with a one-level (actually full) undo stack.
// Handles auto-capitalization (sentence starts) and auto-spacing so the user never
// has to manage them. Suggestions arrive pre-formatted as a full message via setText.

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
