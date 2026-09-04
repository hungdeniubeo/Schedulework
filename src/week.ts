import { addDays, addWeeks, format, startOfWeek } from "date-fns";
import type { WeekRef } from "./types";

export type { WeekRef };

export function weekKey({ year, month, week }: WeekRef): string {
  return `${year}-${month}-${week}`;
}

export function parseWeekKey(key: string): WeekRef | null {
  const m = /^(\d+)-(\d+)-(\d+)$/.exec(key);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), week: Number(m[3]) };
}

export function weekStart({ year, month, week }: WeekRef): Date {
  const first = new Date(year, month - 1, 1);
  const start = startOfWeek(first, { weekStartsOn: 1 });
  return addWeeks(start, week - 1);
}

export function weekDays(ref: WeekRef): Date[] {
  const start = weekStart(ref);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function currentWeekRef(date = new Date()): WeekRef {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const monthStartMonday = startOfWeek(new Date(year, month - 1, 1), {
    weekStartsOn: 1,
  });
  const thisMonday = startOfWeek(date, { weekStartsOn: 1 });
  const week =
    Math.floor(
      (thisMonday.getTime() - monthStartMonday.getTime()) / (7 * 86_400_000),
    ) + 1;
  return { year, month, week: Math.min(5, Math.max(1, week)) };
}

export function shiftWeek(ref: WeekRef, delta: number): WeekRef {
  let { year, month, week } = ref;
  week += delta;
  while (week > 5) {
    week -= 5;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  while (week < 1) {
    week += 5;
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
  }
  return { year, month, week };
}

export function formatDayHeader(date: Date): string {
  return format(date, "dd/MM");
}

export const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
