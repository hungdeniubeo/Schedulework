import type { CSSProperties } from "react";

export const SEMANTIC_SHIFT_COLORS = {
  morning: "#70AD47",
  morningAfternoon: "#A6A6A6",
  afternoonNight: "#C55A5A",
  night: "#ED7D31",
  full: "#5B9BD5",
} as const;

type ShiftRange = { start: number; end: number };

function clockToMinutes(value: string): number | null {
  const match = /^(\d{1,2})(?:h(\d{2})?|:(\d{2}))?$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2] ?? match[3] ?? "0");
  return hour <= 23 && minute <= 59 ? hour * 60 + minute : null;
}

function rangesFromLabel(label: string): ShiftRange[] {
  return label.split("/").flatMap((part) => {
    const [startText, endText] = part.split("-");
    const start = clockToMinutes(startText ?? "");
    const end = clockToMinutes(endText ?? "");
    return start !== null && end !== null && end > start ? [{ start, end }] : [];
  });
}

/** Assign one of the five scheduling colours from the shift's actual coverage. */
export function semanticShiftColor(label: string): string {
  const ranges = rangesFromLabel(label);
  const covers = (start: number, end: number) =>
    ranges.some((range) => range.start < end && range.end > start);
  const morning = covers(10 * 60, 14 * 60);
  const afternoon = covers(14 * 60, 17 * 60);
  const night = covers(17 * 60, 24 * 60);

  if (morning && night) return SEMANTIC_SHIFT_COLORS.full;
  if (afternoon && night) return SEMANTIC_SHIFT_COLORS.afternoonNight;
  if (morning && afternoon) return SEMANTIC_SHIFT_COLORS.morningAfternoon;
  if (night) return SEMANTIC_SHIFT_COLORS.night;
  if (afternoon) return SEMANTIC_SHIFT_COLORS.morningAfternoon;
  return SEMANTIC_SHIFT_COLORS.morning;
}

export function shiftStyle(hex: string): CSSProperties {
  const value = /^#[\da-f]{6}$/i.test(hex) ? hex.slice(1) : "C5D9C7";
  const rgb = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
  const mix = (target: number, weight: number) =>
    `rgb(${rgb.map((channel) => Math.round(channel * (1 - weight) + target * weight)).join(", ")})`;
  return {
    "--shift-bg": mix(255, 0.58),
    "--shift-border": mix(255, 0.18),
    "--shift-ink": mix(0, 0.62),
    "--shift-dot": mix(0, 0.24),
  } as CSSProperties;
}

export function formatShiftLabel(label: string): string {
  return label
    .split("/")
    .map((range) =>
      range
        .split("-")
        .map((clock) => {
          const value = clock.trim();
          const match = /^(\d{1,2})(?:h(\d{2})?|:(\d{2}))?$/.exec(value);
          if (!match) return value;
          const minutes = match[2] ?? match[3] ?? "00";
          if (Number(match[1]) > 23 || Number(minutes) > 59) return value;
          return `${match[1].padStart(2, "0")}:${minutes}`;
        })
        .join(" – "),
    )
    .join(" / ");
}
