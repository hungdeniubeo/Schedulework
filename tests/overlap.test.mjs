import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

// Compile the production module with the project's existing TypeScript dependency.
const source = await readFile(
  new URL("../src/overlap.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
});
const { getEntryIssue, rangesForEntry, formatTimeRange } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
const type = (id, label) => ({ id, label, color: "#C5D9C7", isPreset: false });
const types = [
  type("morning", "10:00-14:00"),
  type("afternoon", "14:00-18:00"),
  type("overlap", "13:00-17:00"),
  type("split", "10h-14h/18h-23h"),
  type("gap", "14:00-18:00"),
];
const entry = (id, shiftTypeId, overrides = {}) => ({
  id,
  shiftTypeId,
  employeeId: "an",
  dayOfWeek: 1,
  customStart: null,
  customEnd: null,
  sortOrderInCell: 0,
  ...overrides,
});

test("touching endpoints are allowed; a real overlap returns its exact interval", () => {
  const morning = entry("a", "morning");
  assert.equal(getEntryIssue(entry("b", "afternoon"), [morning], types), null);
  const issue = getEntryIssue(entry("b", "overlap"), [morning], types);
  assert.equal(issue.kind, "overlap");
  assert.equal(formatTimeRange(issue.range), "13:00 – 14:00");
});
test("duplicates and containment are rejected", () => {
  const morning = entry("a", "morning");
  assert.equal(
    getEntryIssue(entry("b", "morning"), [morning], types).kind,
    "overlap",
  );
  const inside = entry("b", "morning", {
    customStart: "11:00",
    customEnd: "12:00",
  });
  assert.equal(getEntryIssue(inside, [morning], types).kind, "overlap");
  assert.equal(getEntryIssue(morning, [inside], types).kind, "overlap");
});
test("split shifts reserve only their two intervals and allow a shift in the gap", () => {
  const split = entry("a", "split");
  assert.equal(getEntryIssue(entry("b", "gap"), [split], types), null);
  assert.equal(
    getEntryIssue(entry("b", "morning"), [split], types).kind,
    "overlap",
  );
  const evening = entry("b", "morning", {
    customStart: "20:00",
    customEnd: "21:00",
  });
  assert.equal(
    formatTimeRange(getEntryIssue(evening, [split], types).range),
    "20:00 – 21:00",
  );
});
test("validation is scoped to employee and day and excludes the entry being moved", () => {
  const original = entry("a", "morning");
  assert.equal(getEntryIssue(original, [original], types), null);
  assert.equal(
    getEntryIssue(
      entry("b", "morning", { employeeId: "binh" }),
      [original],
      types,
    ),
    null,
  );
  assert.equal(
    getEntryIssue(entry("b", "morning", { dayOfWeek: 2 }), [original], types),
    null,
  );
});
test("malformed, missing, overnight, zero-duration and internally overlapping hours fail closed", () => {
  for (const label of [
    "nope",
    "10:00-14:00/nope",
    "24:00-25:00",
    "10:60-14:00",
    "22:00-02:00",
    "10:00-10:00",
    "10:00-14:00/13:00-18:00",
  ]) {
    assert.equal(
      getEntryIssue(entry("a", "bad"), [], [type("bad", label)]).kind,
      "invalid",
      label,
    );
  }
  assert.equal(getEntryIssue(entry("a", "missing"), [], types).kind, "invalid");
  assert.deepEqual(
    rangesForEntry(entry("a", "morning", { customStart: "10:00" }), types[0]),
    [],
  );
  const invalidExisting = entry("a", "bad");
  assert.equal(
    getEntryIssue(
      entry("b", "morning"),
      [invalidExisting],
      [...types, type("bad", "broken")],
    ).kind,
    "invalid",
  );
});
test("custom hours override the template, and h notation is parsed completely", () => {
  assert.deepEqual(rangesForEntry(entry("a", "split"), types[3]), [
    { start: 600, end: 840 },
    { start: 1080, end: 1380 },
  ]);
  const custom = entry("a", "morning", {
    customStart: "15:00",
    customEnd: "17:00",
  });
  assert.equal(getEntryIssue(custom, [entry("b", "morning")], types), null);
});

test("a consolidated custom label is parsed as the entry's effective hours", () => {
  const consolidated = entry("a", "morning", {
    customLabel: "10:00-17:00/18:00-23:00",
  });
  assert.deepEqual(rangesForEntry(consolidated, types[0]), [
    { start: 600, end: 1020 },
    { start: 1080, end: 1380 },
  ]);
  assert.equal(
    getEntryIssue(
      entry("b", "morning", { customStart: "17:00", customEnd: "18:00" }),
      [consolidated],
      types,
    ),
    null,
  );
});
