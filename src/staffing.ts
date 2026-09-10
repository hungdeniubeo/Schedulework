export type StaffingStatus = "unset" | "critical" | "warning" | "good";

export const STAFFING_SHIFT_THRESHOLDS = {
  redMax: 2,
  yellowMax: 4,
} as const;

export function staffingStatusForShiftCount(shiftCount: number): StaffingStatus {
  if (shiftCount <= 0) return "unset";
  if (shiftCount <= STAFFING_SHIFT_THRESHOLDS.redMax) return "critical";
  if (shiftCount <= STAFFING_SHIFT_THRESHOLDS.yellowMax) return "warning";
  return "good";
}
