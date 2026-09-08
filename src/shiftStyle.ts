import type { CSSProperties } from "react";

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
