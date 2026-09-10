import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(
  new URL("../src/employeeOrder.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
});
const { moveEmployee } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

const employee = (id, groupId, sortOrder) => ({
  id,
  name: id,
  shortName: id,
  groupId,
  sortOrder,
});

test("employees reorder inside their current group", () => {
  const employees = [employee("a", "meat", 0), employee("b", "meat", 1), employee("c", "meat", 2)];
  assert.equal(moveEmployee(employees, "c", "meat", "a"), true);
  assert.deepEqual(
    employees.filter((item) => item.groupId === "meat").sort((a, b) => a.sortOrder - b.sortOrder).map((item) => item.id),
    ["c", "a", "b"],
  );
  assert.equal(moveEmployee(employees, "c", "meat", "b"), true);
  assert.deepEqual(
    employees.filter((item) => item.groupId === "meat").sort((a, b) => a.sortOrder - b.sortOrder).map((item) => item.id),
    ["a", "b", "c"],
  );
});

test("employees move between groups and both orders are normalized", () => {
  const employees = [
    employee("a", "meat", 0),
    employee("b", "meat", 1),
    employee("c", "soup", 0),
    employee("d", "soup", 1),
  ];
  assert.equal(moveEmployee(employees, "b", "soup", "d"), true);
  assert.equal(employees[1].groupId, "soup");
  assert.deepEqual(
    employees.filter((item) => item.groupId === "meat").map((item) => item.sortOrder),
    [0],
  );
  assert.deepEqual(
    employees.filter((item) => item.groupId === "soup").sort((a, b) => a.sortOrder - b.sortOrder).map((item) => item.id),
    ["c", "b", "d"],
  );
});

test("dropping on a group header inserts at the start, including empty groups", () => {
  const employees = [employee("a", "meat", 0), employee("b", "soup", 0)];
  assert.equal(moveEmployee(employees, "a", "priority"), true);
  assert.equal(employees[0].groupId, "priority");
  assert.equal(employees[0].sortOrder, 0);
  assert.equal(moveEmployee(employees, "a", "soup"), true);
  assert.deepEqual(
    employees.filter((item) => item.groupId === "soup").sort((a, b) => a.sortOrder - b.sortOrder).map((item) => item.id),
    ["a", "b"],
  );
});
