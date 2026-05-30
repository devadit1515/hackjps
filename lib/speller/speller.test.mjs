import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRows, ROW_LABELS } from "./layout.mjs";
import { ScanMachine } from "./machine.mjs";
import { Editor } from "./editor.mjs";

/* ---------------- layout ---------------- */
test("layout: six rows, every row ends with a back cell", () => {
  const rows = buildRows([{ label: "water", text: "Water " }]);
  assert.equal(rows.length, 6);
  assert.equal(rows.length, ROW_LABELS.length);
  for (const r of rows) assert.equal(r[r.length - 1].kind, "back");
});

test("layout: suggestions occupy row 0, capped at 4", () => {
  const five = [1, 2, 3, 4, 5].map((n) => ({ label: "w" + n, text: "w" + n }));
  const rows = buildRows(five);
  const sugg = rows[0].filter((c) => c.kind === "suggestion");
  assert.equal(sugg.length, 4);
});

test("layout: letters are alphabetical and stationary", () => {
  const rows = buildRows([]);
  const all = rows.flat().filter((c) => c.kind === "letter").map((c) => c.value).join("");
  assert.equal(all, "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
});

/* ---------------- scan machine ---------------- */
test("machine: row tick wraps; select enters cell mode", () => {
  const rows = buildRows([]);
  const m = new ScanMachine(rows);
  assert.equal(m.state().mode, "row");
  m.tick(); assert.equal(m.state().row, 1);
  for (let i = 0; i < rows.length; i++) m.tick();
  assert.equal(m.state().row, 1); // wrapped fully around + 1
  m.reset();
  const ev = m.select();
  assert.equal(ev.type, "enterRow");
  assert.equal(m.state().mode, "cell");
});

test("machine: selecting a real cell returns it and resets to top row", () => {
  const rows = buildRows([]);
  const m = new ScanMachine(rows);
  m.select();          // enter row 0 (suggestions) -> cell mode
  m.toRows();
  // walk to the letters row (row 1) and enter it
  m.tick();            // row 1
  m.select();          // enter cell mode on row 1
  const ev = m.select(); // pick first cell (letter A)
  assert.equal(ev.type, "cell");
  assert.equal(ev.item.value, "A");
  assert.equal(m.state().mode, "row");
  assert.equal(m.state().row, 0); // restarted at predictions
});

test("machine: back cell escapes a wrong row without choosing", () => {
  const rows = buildRows([]);
  const m = new ScanMachine(rows);
  m.tick();            // row 1 (A–I)
  m.select();          // enter it
  // walk to the back cell (last) and select it
  const len = rows[1].length;
  for (let i = 0; i < len - 1; i++) m.tick();
  const ev = m.select();
  assert.equal(ev.type, "back");
  assert.equal(m.state().mode, "row");
});

/* ---------------- editor ---------------- */
test("editor: auto-caps sentence starts, lowercase mid-sentence", () => {
  const e = new Editor();
  e.addLetter("h"); assert.equal(e.text, "H");
  e.addLetter("i"); assert.equal(e.text, "Hi");
  e.addSpace();
  e.addLetter("t"); e.addLetter("h"); e.addLetter("e"); e.addLetter("r"); e.addLetter("e");
  assert.equal(e.text, "Hi there");
});

test("editor: punctuation, then next letter re-capitalizes", () => {
  const e = new Editor("yes");
  e.addPunct(".");
  assert.equal(e.text, "yes. ");
  assert.equal(e.capNext(), true);
  e.addLetter("o");
  assert.equal(e.text, "yes. O");
});

test("editor: delLetter drops a trailing space first, then characters", () => {
  const e = new Editor("I need ");
  e.delLetter(); assert.equal(e.text, "I need");
  e.delLetter(); assert.equal(e.text, "I nee");
});

test("editor: delWord removes the last word and keeps a trailing space", () => {
  const e = new Editor("I need water");
  e.delWord(); assert.equal(e.text, "I need ");
  e.delWord(); assert.equal(e.text, "I ");
});

test("editor: undo reverses the last change; clear empties", () => {
  const e = new Editor();
  e.addLetter("a"); e.addLetter("b");
  assert.equal(e.text, "Ab");
  e.undo(); assert.equal(e.text, "A");
  e.clear(); assert.equal(e.text, "");
  e.undo(); assert.equal(e.text, "A"); // clear was snapshotted
});

test("editor: setText (accepting a suggestion) is undoable", () => {
  const e = new Editor("wat");
  e.setText("Water ");
  assert.equal(e.text, "Water ");
  e.undo(); assert.equal(e.text, "wat");
});
