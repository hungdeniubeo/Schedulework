import type { AppData } from "./types";

export const SHIFT_COLORS = [
  "#70AD47",
  "#C00000",
  "#ED7D31",
  "#A6A6A6",
  "#5B9BD5",
  "#FFC000",
  "#7030A0",
  "#00B0F0",
  "#00B050",
  "#F4B183",
];

function id(prefix: string, n: number): string {
  return `${prefix}-${n}`;
}

export function makeShortName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts[parts.length - 1] || name.trim();
}

export function createDefaultData(): AppData {
  return {
    groups: [
      { id: id("g", 1), name: "Meat", sortOrder: 0 },
      { id: id("g", 2), name: "Soup", sortOrder: 1 },
      { id: id("g", 3), name: "Salad", sortOrder: 2 },
    ],
    employees: [
      { id: id("e", 1), name: "An", shortName: "An", groupId: id("g", 1), sortOrder: 0 },
      { id: id("e", 2), name: "Bình", shortName: "Bình", groupId: id("g", 1), sortOrder: 1 },
      { id: id("e", 3), name: "Cường", shortName: "Cường", groupId: id("g", 1), sortOrder: 2 },
      { id: id("e", 4), name: "Dung", shortName: "Dung", groupId: id("g", 2), sortOrder: 0 },
      { id: id("e", 5), name: "Em", shortName: "Em", groupId: id("g", 2), sortOrder: 1 },
      { id: id("e", 6), name: "Giang", shortName: "Giang", groupId: id("g", 3), sortOrder: 0 },
      { id: id("e", 7), name: "Hoa", shortName: "Hoa", groupId: id("g", 3), sortOrder: 1 },
    ],
    shiftTypes: [
      { id: id("s", 1), label: "10:00-14:00", color: "#70AD47", isPreset: true },
      { id: id("s", 2), label: "14:00-23:00", color: "#C00000", isPreset: true },
      { id: id("s", 3), label: "17:00-23:00", color: "#ED7D31", isPreset: true },
      { id: id("s", 4), label: "18:00-23:00", color: "#A6A6A6", isPreset: true },
      { id: id("s", 5), label: "10h-14h/18h-23h", color: "#5B9BD5", isPreset: true },
      { id: id("s", 6), label: "11h-15h/18h-22h", color: "#FFC000", isPreset: true },
      { id: id("s", 7), label: "10h-14h/17h-23h", color: "#7030A0", isPreset: true },
    ],
    schedules: {},
  };
}
