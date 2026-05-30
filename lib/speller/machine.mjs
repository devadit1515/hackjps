// Two-level scan state machine — pure, deterministic, framework-free.
//
//   row mode : the highlight walks rows top-to-bottom; select() enters that row.
//   cell mode: the highlight walks cells left-to-right; select() picks the cell
//              and returns to row mode (restarting at the top, so the freshly
//              updated predictions are the first thing scanned again).
//
// A "back" cell returns to row mode without choosing anything. The owning
// component drives this: a timer calls tick() (paused while eyes are closed or
// resting), and a long blink calls select().

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
