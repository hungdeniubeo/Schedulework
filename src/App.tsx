import { useCallback, useEffect, useMemo, useState } from "react";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { makeShortName } from "./defaultData";
import { exportScheduleJpg } from "./exportJpg";
import { ScheduleTable, SheetDnd } from "./ScheduleTable";
import { ShiftSidebar } from "./ShiftSidebar";
import { ensureWeekSchedule, getData, saveData } from "./storage";
import type { AppData, WeekRef } from "./types";
import {
  currentWeekRef,
  parseWeekKey,
  shiftWeek,
  weekKey,
  weekStart,
} from "./week";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const yearNow = new Date().getFullYear();
const YEARS = Array.from({ length: 11 }, (_, i) => yearNow - 5 + i);

function pickInitialWeek(data: AppData): WeekRef {
  const current = currentWeekRef();
  const filled = Object.entries(data.schedules)
    .filter(([, s]) => s.entries.length > 0)
    .map(([k]) => parseWeekKey(k))
    .filter((x): x is WeekRef => x != null);
  if (!filled.length) return current;
  const now = weekStart(current).getTime();
  filled.sort(
    (a, b) =>
      Math.abs(weekStart(a).getTime() - now) -
      Math.abs(weekStart(b).getTime() - now),
  );
  return filled[0];
}

function newId(): string {
  return crypto.randomUUID();
}

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [week, setWeek] = useState<WeekRef>(currentWeekRef());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [addingGroup, setAddingGroup] = useState(false);
  const [addingEmployeeGroupId, setAddingEmployeeGroupId] = useState<string | null>(
    null,
  );
  const [dragLabel, setDragLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const persist = useCallback(async (next: AppData) => {
    setData(next);
    await saveData(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let loaded = await getData();
        const initial = pickInitialWeek(loaded);
        loaded = ensureWeekSchedule(loaded, initial);
        if (cancelled) return;
        await saveData(loaded);
        setData(loaded);
        setWeek(initial);
      } catch (e) {
        console.error(e);
        setError("Không đọc được data.json. Hãy chạy bằng Tauri (npm run tauri dev), không mở bằng trình duyệt.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const changeWeek = useCallback(
    async (next: WeekRef) => {
      if (!data) return;
      const withWeek = ensureWeekSchedule(data, next);
      if (withWeek !== data) await persist(withWeek);
      setWeek(next);
    },
    [data, persist],
  );

  const key = weekKey(week);
  const entries = data?.schedules[key]?.entries ?? [];

  function patch(mut: (draft: AppData) => void) {
    if (!data) return;
    const draft = structuredClone(data);
    mut(draft);
    void persist(draft);
  }

  const overlay = useMemo(() => {
    if (!dragLabel) return null;
    return (
      <div className="rounded-md border border-line bg-white px-2.5 py-1.5 text-[12px] font-medium tabular-nums text-ink shadow-sm">
        {dragLabel}
      </div>
    );
  }, [dragLabel]);

  function onDragStart(e: DragStartEvent) {
    const kind = e.active.data.current?.kind;
    if (kind === "palette") {
      const id = e.active.data.current?.shiftTypeId as string;
      setDragLabel(data?.shiftTypes.find((s) => s.id === id)?.label ?? "");
    } else if (kind === "entry") {
      const id = e.active.data.current?.entryId as string;
      const entry = entries.find((x) => x.id === id);
      const label =
        entry?.customStart && entry.customEnd
          ? `${entry.customStart}-${entry.customEnd}`
          : data?.shiftTypes.find((s) => s.id === entry?.shiftTypeId)?.label;
      setDragLabel(label ?? "");
    }
  }

  function onDragEnd(e: DragEndEvent) {
    setDragLabel(null);
    const over = e.over;
    if (!over || !data) return;
    const employeeId = over.data.current?.employeeId as string | undefined;
    const dayOfWeek = over.data.current?.dayOfWeek as number | undefined;
    if (!employeeId || !dayOfWeek) return;
    const kind = e.active.data.current?.kind;

    patch((draft) => {
      const sched = draft.schedules[key] ?? { entries: [] };
      draft.schedules[key] = sched;
      const inCell = sched.entries.filter(
        (x) => x.employeeId === employeeId && x.dayOfWeek === dayOfWeek,
      );
      const nextOrder =
        inCell.reduce((m, x) => Math.max(m, x.sortOrderInCell), -1) + 1;

      if (kind === "palette") {
        const shiftTypeId = e.active.data.current?.shiftTypeId as string;
        sched.entries.push({
          id: newId(),
          employeeId,
          dayOfWeek,
          shiftTypeId,
          customStart: null,
          customEnd: null,
          sortOrderInCell: nextOrder,
        });
      }
      if (kind === "entry") {
        const entryId = e.active.data.current?.entryId as string;
        const entry = sched.entries.find((x) => x.id === entryId);
        if (!entry) return;
        entry.employeeId = employeeId;
        entry.dayOfWeek = dayOfWeek;
        entry.sortOrderInCell = nextOrder;
      }
    });
  }

  async function onExport() {
    setExporting(true);
    await new Promise<void>((r) =>
      requestAnimationFrame(() => requestAnimationFrame(() => r())),
    );
    try {
      await exportScheduleJpg(week);
    } finally {
      setExporting(false);
    }
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-canvas p-8 text-[14px] text-ink-muted">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center bg-canvas p-8 text-[14px] text-ink-faint">
        Đang tải...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-canvas">
      <header className="flex items-center gap-3 border-b border-line bg-white px-4 py-2.5">
        <div className="text-[14px] font-semibold tracking-tight text-ink">
          Lịch ca
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-line bg-panel px-2 py-1">
        <button
          type="button"
          className="ui-btn h-7 w-7 px-0"
          onClick={() => void changeWeek(shiftWeek(week, -1))}
        >
          ‹
        </button>
        <label className="ui-label">
          Tháng
          <select
            className="ui-select h-7 w-14"
            value={week.month}
            onChange={(e) =>
              void changeWeek({ ...week, month: Number(e.target.value) })
            }
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="ui-label">
          Năm
          <select
            className="ui-select h-7 w-[4.5rem]"
            value={week.year}
            onChange={(e) =>
              void changeWeek({ ...week, year: Number(e.target.value) })
            }
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label className="ui-label">
          Tuần
          <select
            className="ui-select h-7 w-12"
            value={week.week}
            onChange={(e) =>
              void changeWeek({ ...week, week: Number(e.target.value) })
            }
          >
            {[1, 2, 3, 4, 5].map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="ui-btn h-7 w-7 px-0"
          onClick={() => void changeWeek(shiftWeek(week, 1))}
        >
          ›
        </button>
        </div>
        <div className="flex-1" />
        <button
          type="button"
          className={`ui-btn-primary ${exporting ? "opacity-50" : ""}`}
          onClick={() => void onExport()}
        >
          Xuất ảnh
        </button>
      </header>

      <SheetDnd onDragStart={onDragStart} onDragEnd={onDragEnd} overlay={overlay}>
        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1 overflow-auto p-4">
            <ScheduleTable
              data={data}
              week={week}
              exporting={exporting}
              addingGroup={addingGroup}
              addingEmployeeGroupId={addingEmployeeGroupId}
              onRenameGroup={(id, name) =>
                patch((d) => {
                  const g = d.groups.find((x) => x.id === id);
                  if (g) g.name = name;
                })
              }
              onDeleteGroup={(id) => {
                const count = data.employees.filter((e) => e.groupId === id).length;
                if (count > 0 && !window.confirm(`Xóa nhóm và ${count} nhân viên bên trong?`)) {
                  return;
                }
                patch((d) => {
                  const empIds = new Set(
                    d.employees.filter((e) => e.groupId === id).map((e) => e.id),
                  );
                  d.groups = d.groups.filter((g) => g.id !== id);
                  d.employees = d.employees.filter((e) => e.groupId !== id);
                  for (const s of Object.values(d.schedules)) {
                    s.entries = s.entries.filter((x) => !empIds.has(x.employeeId));
                  }
                });
              }}
              onRenameEmployee={(id, name) =>
                patch((d) => {
                  const e = d.employees.find((x) => x.id === id);
                  if (e) {
                    e.name = name;
                    e.shortName = makeShortName(name);
                  }
                })
              }
              onDeleteEmployee={(id) =>
                patch((d) => {
                  d.employees = d.employees.filter((e) => e.id !== id);
                  for (const s of Object.values(d.schedules)) {
                    s.entries = s.entries.filter((x) => x.employeeId !== id);
                  }
                })
              }
              onStartAddEmployee={(groupId) => setAddingEmployeeGroupId(groupId)}
              onCommitAddEmployee={(groupId, name) => {
                patch((d) => {
                  const order = d.employees.filter((e) => e.groupId === groupId).length;
                  d.employees.push({
                    id: newId(),
                    name,
                    shortName: makeShortName(name),
                    groupId,
                    sortOrder: order,
                  });
                });
                setAddingEmployeeGroupId(null);
              }}
              onCancelAddEmployee={() => setAddingEmployeeGroupId(null)}
              onStartAddGroup={() => setAddingGroup(true)}
              onCommitAddGroup={(name) => {
                patch((d) => {
                  d.groups.push({
                    id: newId(),
                    name,
                    sortOrder: d.groups.length,
                  });
                });
                setAddingGroup(false);
              }}
              onCancelAddGroup={() => setAddingGroup(false)}
              onRemoveEntry={(id) =>
                patch((d) => {
                  const s = d.schedules[key];
                  if (s) s.entries = s.entries.filter((x) => x.id !== id);
                })
              }
            />
          </div>
          <ShiftSidebar
            open={sidebarOpen}
            onToggle={() => setSidebarOpen((v) => !v)}
            shifts={data.shiftTypes}
            onSave={(shift) =>
              patch((d) => {
                if (shift.id) {
                  const found = d.shiftTypes.find((s) => s.id === shift.id);
                  if (found) {
                    found.label = shift.label;
                    found.color = shift.color;
                  }
                } else {
                  d.shiftTypes.push({
                    id: newId(),
                    label: shift.label,
                    color: shift.color,
                    isPreset: false,
                  });
                }
              })
            }
            onDelete={(id) =>
              patch((d) => {
                d.shiftTypes = d.shiftTypes.filter((s) => s.id !== id);
                for (const s of Object.values(d.schedules)) {
                  s.entries = s.entries.filter((x) => x.shiftTypeId !== id);
                }
              })
            }
          />
        </div>
      </SheetDnd>
    </div>
  );
}
