import { test } from "node:test";
import assert from "node:assert/strict";
import { sameMeaning, dedupeByMeaning } from "./dedupe.mjs";

test("dedupe: paraphrases of one intent are treated as the same", () => {
  assert.equal(sameMeaning("I would like cold water.", "Could you get me some cold water, please?"), true);
  assert.equal(sameMeaning("I need help now.", "Please help me."), true);
});

test("dedupe: genuinely different needs are kept apart", () => {
  assert.equal(sameMeaning("I'm cold.", "Could I have a blanket?"), false);
  assert.equal(sameMeaning("I need water.", "I need the bathroom."), false);
});

test("dedupe: collapses a list of cold-water rewordings to one, keeps distinct ones", () => {
  const out = dedupeByMeaning([
    "I would like cold water.",
    "Get me some cold water please.",
    "Could I have a glass of cold water?",
    "Could I have a blanket?",
    "I need to warm up.",
  ]);
  assert.equal(out.length, 3); // one cold-water + blanket + warm up
  assert.ok(out.includes("Could I have a blanket?"));
});

test("dedupe: short function-only phrases compare exactly (Yes vs No stay)", () => {
  const out = dedupeByMeaning(["Yes", "No", "Yes"]);
  assert.deepEqual(out, ["Yes", "No"]);
});
