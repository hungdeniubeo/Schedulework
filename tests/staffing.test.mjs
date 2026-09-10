import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(
  new URL("../src/staffing.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
});
const { staffingStatusForShiftCount, STAFFING_SHIFT_THRESHOLDS } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

test("staffing thresholds remain explicit and easy to adjust", () => {
  assert.deepEqual(STAFFING_SHIFT_THRESHOLDS, {
    redMax: 2,
    yellowMax: 4,
  });
});

test("actual daily shift counts map to empty, red, yellow and green", () => {
  assert.equal(staffingStatusForShiftCount(0), "unset");
  assert.equal(staffingStatusForShiftCount(1), "critical");
  assert.equal(staffingStatusForShiftCount(2), "critical");
  assert.equal(staffingStatusForShiftCount(3), "warning");
  assert.equal(staffingStatusForShiftCount(4), "warning");
  assert.equal(staffingStatusForShiftCount(5), "good");
  assert.equal(staffingStatusForShiftCount(12), "good");
});
