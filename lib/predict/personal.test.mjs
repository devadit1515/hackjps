import { test } from "node:test";
import assert from "node:assert/strict";
import { learn, personalFrom } from "./personal.mjs";

const empty = { words: {}, phrases: [] };

test("personal: learns a spoken message and suggests it back from its start", () => {
  const d = learn(empty, "I need my wheelchair.");
  const s = personalFrom(d, "I need my wh");
  assert.ok(s.some((x) => x.text.trim() === "I need my wheelchair."));
  assert.ok(s.every((x) => x.personal));
});

test("personal: repeated use ranks a phrase higher", () => {
  let d = learn(empty, "Turn me over, please.");
  d = learn(d, "Water.");
  d = learn(d, "Turn me over, please.");
  assert.equal(d.phrases[0].text, "Turn me over, please.");
  assert.equal(d.phrases[0].n, 2);
});

test("personal: completes a learned word in a fresh context", () => {
  const d = learn(empty, "I want my wheelchair");
  const s = personalFrom(d, "Please bring my wh");
  assert.ok(s.some((x) => x.label === "wheelchair" && x.text === "Please bring my wheelchair "));
});

test("personal: empty model returns nothing", () => {
  assert.equal(personalFrom(empty, "I need").length, 0);
});
