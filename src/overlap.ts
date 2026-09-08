import type { ScheduleEntry, ShiftType } from "./types";

export type TimeRange = { start: number; end: number };
export type EntryIssue =
  | { kind: "invalid"; message: string }
  | { kind: "overlap"; other: ScheduleEntry; range: TimeRange };

function parseClock(token: string): number | null {
  const t = token.trim().toLowerCase().replace(/h$/, ":00").replace("h", ":");
  const m = /^(\d{1,2})(?::(\d{2}))?$/.exec(t);
  if (!m) return null;
  const hours = Number(m[1]);
  const minutes = m[2] ? Number(m[2]) : 0;
  return hours <= 23 && minutes <= 59 ? hours * 60 + minutes : null;
}

function parseRangeToken(token: string): TimeRange | null {
  const parts = token.split("-");
  if (parts.length !== 2) return null;
  const start = parseClock(parts[0]);
  const end = parseClock(parts[1]);
  return start != null && end != null && end > start ? { start, end } : null;
}

export function rangesForEntry(
  entry: ScheduleEntry,
  shiftType: ShiftType | undefined,
): TimeRange[] {
  let label = shiftType?.label;
  if (entry.customStart != null || entry.customEnd != null) {
    if (!entry.customStart || !entry.customEnd) return [];
    label = `${entry.customStart}-${entry.customEnd}`;
  }
  if (!label) return [];
  const ranges = label.split("/").map(parseRangeToken);
  // Reject the whole shift if even one interval is malformed.
  return ranges.every((range): range is TimeRange => range !== null)
    ? ranges
    : [];
}

function intersection(a: TimeRange, b: TimeRange): TimeRange | null {
  const start = Math.max(a.start, b.start);
  const end = Math.min(a.end, b.end);
  return start < end ? { start, end } : null;
}

export function entryLabel(entry: ScheduleEntry, types: ShiftType[]): string {
  return entry.customStart && entry.customEnd
    ? `${entry.customStart}-${entry.customEnd}`
    : (types.find((type) => type.id === entry.shiftTypeId)?.label ??
        "Ca không xác định");
}

export function formatTimeRange(range: TimeRange): string {
  const clock = (minutes: number) =>
    `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  return `${clock(range.start)} – ${clock(range.end)}`;
}

export function getEntryIssue(
  candidate: ScheduleEntry,
  entries: ScheduleEntry[],
  types: ShiftType[],
): EntryIssue | null {
  const type = types.find((item) => item.id === candidate.shiftTypeId);
  if (!type)
    return { kind: "invalid", message: "Loại ca này không còn tồn tại." };
  const ranges = rangesForEntry(candidate, type);
  if (!ranges.length)
    return {
      kind: "invalid",
      message:
        "Giờ ca không hợp lệ. Ca phải nằm trong ngày, giờ kết thúc sau giờ bắt đầu.",
    };
  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      if (intersection(ranges[i], ranges[j]))
        return {
          kind: "invalid",
          message: "Hai khoảng giờ trong ca bị trùng nhau.",
        };
    }
  }
  for (const other of entries) {
    if (
      other.id === candidate.id ||
      other.employeeId !== candidate.employeeId ||
      other.dayOfWeek !== candidate.dayOfWeek
    )
      continue;
    const otherRanges = rangesForEntry(
      other,
      types.find((item) => item.id === other.shiftTypeId),
    );
    // Unknown existing hours cannot safely accept another assignment.
    if (!otherRanges.length)
      return {
        kind: "invalid",
        message: "Ô này có ca chưa rõ giờ. Hãy sửa hoặc xóa ca đó trước.",
      };
    for (const a of ranges) {
      for (const b of otherRanges) {
        const range = intersection(a, b);
        if (range) return { kind: "overlap", other, range };
      }
    }
  }
  return null;
}

export function issueDescription(issue: EntryIssue): string {
  return issue.kind === "overlap"
    ? `Trùng giờ ${formatTimeRange(issue.range)}`
    : issue.message;
}

export function cellHasOverlap(
  entries: ScheduleEntry[],
  types: ShiftType[],
): boolean {
  return entries.some((entry) => getEntryIssue(entry, entries, types) != null);
}
