import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(
  new URL("../src/defaultData.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
});
const { ensurePriorityGroup, PRIORITY_GROUP_ID } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

test("old group data gains one priority group without changing existing groups", () => {
  const oldGroups = [
    { id: "g-1", name: "Meat", sortOrder: 0 },
    { id: "g-2", name: "Soup", sortOrder: 1 },
    { id: "g-3", name: "Salad", sortOrder: 2 },
  ];

  const groups = ensurePriorityGroup(oldGroups);

  assert.equal(groups[0].id, PRIORITY_GROUP_ID);
  assert.equal(groups[0].sortOrder, -1);
  assert.deepEqual(groups.slice(1), oldGroups);
});

test("existing priority group is reused and kept above regular groups", () => {
  const groups = ensurePriorityGroup([
    { id: "g-1", name: "Meat", sortOrder: 0 },
    { id: PRIORITY_GROUP_ID, name: "Priority", sortOrder: 4 },
  ]);

  assert.equal(groups.filter((group) => group.id === PRIORITY_GROUP_ID).length, 1);
  assert.equal(groups[0].id, PRIORITY_GROUP_ID);
  assert.equal(groups[0].sortOrder, -1);
  assert.equal(groups[1].id, "g-1");
});
