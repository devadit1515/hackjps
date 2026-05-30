import { test } from "node:test";
import assert from "node:assert/strict";
import { suggest } from "./ondevice.mjs";

test("predict: empty message offers openers", () => {
  const s = suggest("");
  assert.ok(s.length > 0);
  assert.ok(s.some((x) => x.label === "I need help."));
});

test("predict: completes the current partial word, capitalized at sentence start", () => {
  const s = suggest("wat");
  const water = s.find((x) => x.label === "water");
  assert.ok(water, "expected a 'water' completion");
  assert.equal(water.text, "Water ");
});

test("predict: completes mid-sentence in lowercase", () => {
  const s = suggest("I need wat");
  const water = s.find((x) => x.label === "water");
  assert.ok(water);
  assert.equal(water.text, "I need water ");
});

test("predict: a whole phrase can be reached from a few letters", () => {
  const s = suggest("i need he");
  assert.ok(s.some((x) => x.text.trim() === "I need help."));
});

test("predict: after a space, offers an 'I need...' continuation (phrase or next-word)", () => {
  const s = suggest("I ");
  assert.ok(s.some((x) => x.text.startsWith("I need")));
});

test("predict: next-word bigram fires when no phrase matches", () => {
  const s = suggest("please ");
  assert.ok(s.some((x) => x.text === "please help "));
});

test("predict: never returns more than the limit", () => {
  assert.ok(suggest("i", 4).length <= 4);
});

test("predict: no two suggestions mean the same thing (medicine vs medication)", () => {
  const s = suggest("med");
  const meds = s.filter((x) => /^medic/i.test(x.label));
  assert.equal(meds.length, 1);
});
