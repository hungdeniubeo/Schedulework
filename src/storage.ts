import { appDataDir } from "@tauri-apps/api/path";
import { BaseDirectory, exists, mkdir, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { createDefaultData } from "./defaultData";
import type { AppData, WeekRef } from "./types";
import { weekKey } from "./week";

const FILE = "data.json";
const FS = { baseDir: BaseDirectory.AppData };

async function ensureAppDataDir(): Promise<void> {
  const dir = await appDataDir();
  await mkdir(dir, { recursive: true });
}

export async function getData(): Promise<AppData> {
  await ensureAppDataDir();
  const fileExists = await exists(FILE, FS);
  if (!fileExists) {
    const initial = createDefaultData();
    await writeTextFile(FILE, JSON.stringify(initial, null, 2), FS);
    return initial;
  }
  const text = await readTextFile(FILE, FS);
  const parsed = JSON.parse(text) as AppData;
  return {
    groups: parsed.groups ?? [],
    employees: parsed.employees ?? [],
    shiftTypes: parsed.shiftTypes ?? [],
    schedules: parsed.schedules ?? {},
  };
}

export async function saveData(data: AppData): Promise<void> {
  await ensureAppDataDir();
  await writeTextFile(FILE, JSON.stringify(data, null, 2), FS);
}

export function ensureWeekSchedule(data: AppData, ref: WeekRef): AppData {
  const key = weekKey(ref);
  if (data.schedules[key]) return data;
  return {
    ...data,
    schedules: {
      ...data.schedules,
      [key]: { entries: [] },
    },
  };
}
