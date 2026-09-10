import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(
  new URL("../src/shiftStyle.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
});
const { isLongShift, semanticShiftColor, SEMANTIC_SHIFT_COLORS } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

test("10:00-18:00 uses the neutral morning and afternoon colour", () => {
  assert.equal(
    semanticShiftColor("10:00-18:00"),
    SEMANTIC_SHIFT_COLORS.morningAfternoon,
  );
});

test("10:00-23:00 is recognized as a long shift and uses its own purple", () => {
  assert.equal(isLongShift("10:00-23:00"), true);
  assert.equal(semanticShiftColor("10:00-23:00"), SEMANTIC_SHIFT_COLORS.long);
});
