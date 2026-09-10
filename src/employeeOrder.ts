import type { Employee } from "./types";

function employeesInGroup(employees: Employee[], groupId: string): Employee[] {
  return employees
    .filter((employee) => employee.groupId === groupId)
    .sort((first, second) => first.sortOrder - second.sortOrder);
}

function applyOrder(employees: Employee[]): void {
  employees.forEach((employee, index) => {
    employee.sortOrder = index;
  });
}

export function moveEmployee(
  employees: Employee[],
  employeeId: string,
  targetGroupId: string,
  beforeEmployeeId?: string,
): boolean {
  const moved = employees.find((employee) => employee.id === employeeId);
  if (!moved || beforeEmployeeId === employeeId) return false;

  const sourceGroupId = moved.groupId;
  if (sourceGroupId === targetGroupId) {
    const reordered = employeesInGroup(employees, sourceGroupId);
    const sourceIndex = reordered.findIndex((employee) => employee.id === employeeId);
    const targetIndex = beforeEmployeeId
      ? reordered.findIndex((employee) => employee.id === beforeEmployeeId)
      : 0;
    if (sourceIndex < 0 || targetIndex < 0) return false;
    reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    applyOrder(reordered);
    return true;
  }

  const sourceEmployees = employeesInGroup(employees, sourceGroupId).filter(
    (employee) => employee.id !== employeeId,
  );
  const targetEmployees = employeesInGroup(employees, targetGroupId);
  const targetIndex = beforeEmployeeId
    ? targetEmployees.findIndex((employee) => employee.id === beforeEmployeeId)
    : 0;
  if (targetIndex < 0) return false;

  moved.groupId = targetGroupId;
  targetEmployees.splice(targetIndex, 0, moved);
  applyOrder(sourceEmployees);
  applyOrder(targetEmployees);
  return true;
}
