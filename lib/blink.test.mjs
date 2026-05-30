import { test } from "node:test";
import assert from "node:assert/strict";
import { computeThresholds } from "./blinkCalibration.mjs";

const open = [0.05, 0.08, 0.06, 0.1, 0.07, 0.12, 0.09, 0.06];
const closed = [0.7, 0.85, 0.9, 0.78, 0.82, 0.95, 0.8, 0.76];

test("calibration: places thresholds inside the open→closed gap", () => {
  const t = computeThresholds(open, closed);
  assert.ok(t, "expected thresholds");
  assert.ok(t.open < t.close, "open must sit below close");
  assert.ok(t.close > 0.12 && t.close < 0.9);
  assert.ok(t.open >= 0.1);
});

test("calibration: a weak blinker (low closed peak) still gets usable thresholds", () => {
  const t = computeThresholds([0.03, 0.05, 0.04, 0.06, 0.05, 0.04], [0.35, 0.42, 0.4, 0.38, 0.45, 0.39]);
  assert.ok(t);
  assert.ok(t.close < 0.45, "threshold should adapt below the fixed 0.45 default");
});

test("calibration: indistinguishable states return null (fall back to defaults)", () => {
  assert.equal(computeThresholds([0.2, 0.25, 0.22, 0.3, 0.28], [0.26, 0.29, 0.31, 0.27, 0.3]), null);
});

test("calibration: too few samples returns null", () => {
  assert.equal(computeThresholds([0.05], [0.8]), null);
});
