import type { ScheduleEntry, ShiftType } from "./types";

export type TimeRange = { start: number; end: number };

function parseClock(token: string): number | null {
  const t = token.trim().toLowerCase().replace("h", ":");
  const m = /^(\d{1,2})(?::(\d{2}))?$/.exec(t);
  if (!m) return null;
  const h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

function parseRangeToken(token: string): TimeRange | null {
  const parts = token.split("-").map((s) => s.trim());
  if (parts.length !== 2) return null;
  const start = parseClock(parts[0]);
  const end = parseClock(parts[1]);
  if (start == null || end == null || end <= start) return null;
  return { start, end };
}

export function rangesForEntry(
  entry: ScheduleEntry,
  shiftType: ShiftType | undefined,
): TimeRange[] {
  if (entry.customStart && entry.customEnd) {
    const start = parseClock(entry.customStart);
    const end = parseClock(entry.customEnd);
    if (start != null && end != null && end > start) {
      return [{ start, end }];
    }
  }
  if (!shiftType?.label) return [];
  return shiftType.label
    .split("/")
    .map(parseRangeToken)
    .filter((r): r is TimeRange => r != null);
}

function overlaps(a: TimeRange, b: TimeRange): boolean {
  return a.start < b.end && b.start < a.end;
}

export function cellHasOverlap(
  entries: ScheduleEntry[],
  shiftTypes: ShiftType[],
): boolean {
  const ranges = entries.flatMap((e) =>
    rangesForEntry(
      e,
      shiftTypes.find((s) => s.id === e.shiftTypeId),
    ),
  );
  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      if (overlaps(ranges[i], ranges[j])) return true;
    }
  }
  return false;
}
