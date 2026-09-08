export type Group = {
  id: string;
  name: string;
  sortOrder: number;
};

export type Employee = {
  id: string;
  name: string;
  shortName: string;
  groupId: string;
  sortOrder: number;
};

export type ShiftType = {
  id: string;
  label: string;
  color: string;
  isPreset: boolean;
};

export type ScheduleEntry = {
  id: string;
  employeeId: string;
  dayOfWeek: number;
  shiftTypeId: string;
  customStart: string | null;
  customEnd: string | null;
  customLabel?: string | null;
  sortOrderInCell: number;
};

export type WeekSchedule = {
  entries: ScheduleEntry[];
  countOverrides?: Record<string, number>;
};

export type AppData = {
  groups: Group[];
  employees: Employee[];
  shiftTypes: ShiftType[];
  schedules: Record<string, WeekSchedule>;
};

export type WeekRef = {
  year: number;
  month: number;
  week: number;
};
