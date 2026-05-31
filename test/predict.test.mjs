import { test } from "node:test";
import assert from "node:assert/strict";
import { suggest, learn, personalFrom, sameMeaning, dedupeByMeaning } from "../lib/predict.mjs";

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
  assert.equal(out.length, 3);
  assert.ok(out.includes("Could I have a blanket?"));
});

test("dedupe: short function-only phrases compare exactly (Yes vs No stay)", () => {
  const out = dedupeByMeaning(["Yes", "No", "Yes"]);
  assert.deepEqual(out, ["Yes", "No"]);
});
