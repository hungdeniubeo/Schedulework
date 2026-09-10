import { useCallback, useEffect, useRef, useState } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import { makeShortName, normalizeEmployeeName } from "./defaultData";
import { moveEmployee } from "./employeeOrder";
import { exportScheduleJpg } from "./exportJpg";
import { ScheduleTable, SheetDnd } from "./ScheduleTable";
import { ShiftSidebar } from "./ShiftSidebar";
import { Icon } from "./Icon";
import { formatShiftLabel, semanticShiftColor } from "./shiftStyle";
import type { EmployeeDetails } from "./EmployeeEditor";
import { ensureWeekSchedule, getData, saveData } from "./storage";
import {
  entryLabel,
  getEntryIssue,
  issueDescription,
  rangesForEntry,
  type EntryIssue,
} from "./overlap";
import type { AppData, ScheduleEntry, ShiftType, WeekRef } from "./types";
import {
  currentWeekRef,
  formatDayHeader,
  weekDays,
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

function clockLabel(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function consolidatedLabel(ranges: { start: number; end: number }[]): string {
  const merged: { start: number; end: number }[] = [];
  for (const range of [...ranges].sort(
    (a, b) => a.start - b.start || a.end - b.end,
  )) {
    const previous = merged[merged.length - 1];
    if (previous && range.start <= previous.end) {
      previous.end = Math.max(previous.end, range.end);
    } else {
      merged.push({ ...range });
    }
  }
  return merged
    .map((range) => `${clockLabel(range.start)}-${clockLabel(range.end)}`)
    .join("/");
}

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [week, setWeek] = useState<WeekRef>(currentWeekRef());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saving" | "saved" | "error">(
    "saved",
  );
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const dataRef = useRef<AppData | null>(null);
  const saveRevision = useRef(0);
  const resetDialog = useRef<HTMLDialogElement>(null);

  const persist = useCallback(async (next: AppData) => {
    dataRef.current = next;
    setData(next);
    const revision = ++saveRevision.current;
    setSaveStatus("saving");
    try {
      await saveData(next);
      if (revision === saveRevision.current) setSaveStatus("saved");
    } catch (e) {
      console.error(e);
      if (revision !== saveRevision.current) return;
      setSaveStatus("error");
      setNotice(
        "Chưa lưu được thay đổi. Vui lòng kiểm tra dung lượng và quyền truy cập thiết bị.",
      );
    }
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
        dataRef.current = loaded;
        setData(loaded);
        setWeek(initial);
      } catch (e) {
        console.error(e);
        setError("Không đọc được dữ liệu lịch. Vui lòng thử mở lại ứng dụng.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const changeWeek = useCallback(
    async (next: WeekRef) => {
      const current = dataRef.current;
      if (!current) return;
      const withWeek = ensureWeekSchedule(current, next);
      setWeek(next);
      setNotice(null);
      if (withWeek !== current) await persist(withWeek);
    },
    [persist],
  );

  const key = weekKey(week);
  const entries = data?.schedules[key]?.entries ?? [];

  const weekIssues = entries.flatMap((entry) => {
    const issue = getEntryIssue(entry, entries, data?.shiftTypes ?? []);
    return issue ? [{ entry, issue }] : [];
  });

  function patch(mut: (draft: AppData) => void) {
    if (!dataRef.current) return;
    const draft = structuredClone(dataRef.current);
    mut(draft);
    setNotice(null);
    void persist(draft);
  }

  function describeIssue(
    entry: ScheduleEntry,
    issue: EntryIssue,
    ref: WeekRef,
    current: AppData,
    includeEmployee = true,
  ): string {
    const name =
      current.employees.find((employee) => employee.id === entry.employeeId)
        ?.name ?? "Nhân viên";
    const date = weekDays(ref)[entry.dayOfWeek - 1];
    const when = date ? formatDayHeader(date) : `ngày ${entry.dayOfWeek}`;
    const other =
      issue.kind === "overlap"
        ? ` với ca ${formatShiftLabel(entryLabel(issue.other, current.shiftTypes))}`
        : "";
    const detail = issueDescription(issue)
      .replace(/[.!?]+$/, "")
      .replace(/^./u, (letter) => letter.toLocaleLowerCase("vi"));
    return `${includeEmployee ? `${name} · ` : ""}${when}: ${detail}${other}`;
  }

  function placeEntry(candidate: ScheduleEntry) {
    const current = dataRef.current;
    if (
      !current ||
      !current.employees.some(
        (employee) => employee.id === candidate.employeeId,
      ) ||
      candidate.dayOfWeek < 1 ||
      candidate.dayOfWeek > 7
    )
      return;
    const scheduleEntries = current.schedules[key]?.entries ?? [];
    const issue = getEntryIssue(candidate, scheduleEntries, current.shiftTypes);
    if (issue) {
      setNotice(
        `Không thể xếp ca. ${describeIssue(candidate, issue, week, current, false)}.${issue.kind === "overlap" ? " Hãy chọn giờ khác hoặc sửa ca cũ." : ""}`,
      );
      return;
    }
    setNotice(null);
    patch((draft) => {
      const schedule = draft.schedules[key] ?? { entries: [] };
      draft.schedules[key] = schedule;
      schedule.entries = schedule.entries.filter(
        (entry) => entry.id !== candidate.id,
      );
      const inCell = schedule.entries.filter(
        (entry) =>
          entry.employeeId === candidate.employeeId &&
          entry.dayOfWeek === candidate.dayOfWeek,
      );
      if (inCell.length > 0) {
        const combinedEntries = [...inCell, candidate];
        const ranges = combinedEntries.flatMap((entry) =>
          rangesForEntry(
            entry,
            draft.shiftTypes.find((type) => type.id === entry.shiftTypeId),
          ),
        );
        const earliestEntry = combinedEntries.reduce((earliest, entry) => {
          const entryStart = rangesForEntry(
            entry,
            draft.shiftTypes.find((type) => type.id === entry.shiftTypeId),
          )[0]?.start;
          const earliestStart = rangesForEntry(
            earliest,
            draft.shiftTypes.find((type) => type.id === earliest.shiftTypeId),
          )[0]?.start;
          return (entryStart ?? Infinity) < (earliestStart ?? Infinity)
            ? entry
            : earliest;
        });
        const ids = new Set(inCell.map((entry) => entry.id));
        schedule.entries = schedule.entries.filter(
          (entry) => !ids.has(entry.id),
        );
        schedule.entries.push({
          ...candidate,
          shiftTypeId: earliestEntry.shiftTypeId,
          customStart: null,
          customEnd: null,
          customLabel: consolidatedLabel(ranges),
          sortOrderInCell: Math.min(
            candidate.sortOrderInCell,
            ...inCell.map((entry) => entry.sortOrderInCell),
          ),
        });
        return;
      }
      schedule.entries.push({
        ...candidate,
        sortOrderInCell:
          inCell.reduce(
            (max, entry) => Math.max(max, entry.sortOrderInCell),
            -1,
          ) + 1,
      });
    });
  }

  function onDragEnd(event: DragEndEvent) {
    const target = event.over?.data.current;
    const source = event.active.data.current;
    if (source?.kind === "employee") {
      if (target?.kind !== "employee" && target?.kind !== "employee-group") return;
      const beforeEmployeeId = target.kind === "employee" ? target.employeeId : undefined;
      if (beforeEmployeeId === source.employeeId) return;
      patch((draft) => {
        moveEmployee(
          draft.employees,
          source.employeeId,
          target.groupId,
          beforeEmployeeId,
        );
      });
      return;
    }
    if (!target?.employeeId || !target?.dayOfWeek || !source) return;
    if (source.kind === "palette") {
      placeEntry({
        id: newId(),
        employeeId: target.employeeId,
        dayOfWeek: target.dayOfWeek,
        shiftTypeId: source.shiftTypeId,
        customStart: null,
        customEnd: null,
        sortOrderInCell: 0,
      });
    } else if (source.kind === "entry") {
      const existing = dataRef.current?.schedules[key]?.entries.find(
        (entry) => entry.id === source.entryId,
      );
      if (
        !existing ||
        (existing.employeeId === target.employeeId &&
          existing.dayOfWeek === target.dayOfWeek)
      )
        return;
      placeEntry({
        ...existing,
        employeeId: target.employeeId,
        dayOfWeek: target.dayOfWeek,
      });
    }
  }

  async function onExport() {
    if (exporting) return;
    if (weekIssues.length && data) {
      const first = weekIssues[0];
      setNotice(
        `Chưa thể xuất lịch. ${describeIssue(first.entry, first.issue, week, data)}. Sửa ca trên rồi xuất lại.`,
      );
      setGroupFilter("all");
      setSearch("");
      return;
    }
    setNotice(null);
    setExporting(true);
    await new Promise<void>((r) =>
      requestAnimationFrame(() => requestAnimationFrame(() => r())),
    );
    try {
      await exportScheduleJpg(week);
    } catch (e) {
      console.error(e);
      setNotice("Chưa xuất được lịch. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  }

  function assignShift(employeeId: string, dayOfWeek: number) {
    if (selectedShiftId)
      placeEntry({
        id: newId(),
        employeeId,
        dayOfWeek,
        shiftTypeId: selectedShiftId,
        customStart: null,
        customEnd: null,
        sortOrderInCell: 0,
      });
  }

  function saveShift(
    shift: Omit<ShiftType, "id"> & { id?: string },
  ): string | null {
    const current = dataRef.current;
    if (!current) return "Chưa đọc được dữ liệu.";
    const nextShift = { ...shift, color: semanticShiftColor(shift.label), id: shift.id ?? newId() };
    const nextTypes = shift.id
      ? current.shiftTypes.map((type) =>
          type.id === shift.id
            ? { ...type, label: shift.label, color: semanticShiftColor(shift.label) }
            : type,
        )
      : [...current.shiftTypes, nextShift];
    const sample: ScheduleEntry = {
      id: "validation",
      employeeId: "",
      dayOfWeek: 1,
      shiftTypeId: nextShift.id,
      customStart: null,
      customEnd: null,
      sortOrderInCell: 0,
    };
    const invalid = getEntryIssue(sample, [], nextTypes);
    if (invalid) return issueDescription(invalid);
    if (
      shift.id &&
      current.shiftTypes.find((type) => type.id === shift.id)?.label !==
        shift.label
    ) {
      for (const [scheduleKey, schedule] of Object.entries(current.schedules)) {
        const ref = parseWeekKey(scheduleKey);
        for (const entry of schedule.entries.filter(
          (item) => item.shiftTypeId === shift.id,
        )) {
          const issue = getEntryIssue(entry, schedule.entries, nextTypes);
          if (issue)
            return `Không thể đổi giờ: ${describeIssue(entry, issue, ref ?? week, { ...current, shiftTypes: nextTypes })} (tuần ${ref?.week ?? week.week}, ${ref?.year ?? week.year}). Sửa ca liên quan trước.`;
        }
      }
    }
    patch((draft) => {
      draft.shiftTypes = nextTypes;
    });
    return null;
  }

  async function clearCurrentWeekSchedule() {
    const current = dataRef.current;
    if (!current || resetting || saveStatus === "saving") return;
    setResetting(true);
    setResetError(null);
    const next = structuredClone(current);
    const schedule = next.schedules[key] ?? { entries: [] };
    next.schedules[key] = schedule;
    schedule.entries = [];
    schedule.countOverrides = {};
    try {
      await saveData(next);
      dataRef.current = next;
      setData(next);
      setSaveStatus("saved");
      setSelectedShiftId(null);
      setGroupFilter("all");
      setSearch("");
      setNotice(null);
      setResetOpen(false);
    } catch (e) {
      console.error(e);
      setResetError(
        "Chưa xóa được lịch. Dữ liệu trên màn hình vẫn được giữ nguyên. Bạn có thể thử lại.",
      );
    } finally {
      setResetting(false);
    }
  }

  useEffect(() => {
    if (resetOpen) resetDialog.current?.showModal();
    else resetDialog.current?.close();
  }, [resetOpen]);

  useEffect(() => {
    const cancelSelection = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedShiftId(null);
    };
    window.addEventListener("keydown", cancelSelection);
    return () => window.removeEventListener("keydown", cancelSelection);
  }, []);

  if (error || !data) {
    return (
      <div className="app-state">
        <span className={`brand-icon ${!error ? "is-loading" : ""}`}>
          <Icon name="calendar" size={28} />
        </span>
        <h1>{error ? "Chưa thể mở lịch" : "Một chút thôi…"}</h1>
        <p>{error || "Đang chuẩn bị lịch làm việc của bạn."}</p>
        {error && (
          <button
            type="button"
            className="ui-btn-primary"
            onClick={() => window.location.reload()}
          >
            Thử lại
          </button>
        )}
      </div>
    );
  }

  const selectedShift = data.shiftTypes.find(
    (shift) => shift.id === selectedShiftId,
  );
  const currentWeek = currentWeekRef();
  const isCurrentWeek = key === weekKey(currentWeek);
  const scheduledShiftCount = entries.length;

  return (
    <div className="app-shell">
      <header className="app-header">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            void changeWeek(currentWeekRef());
          }}
          aria-label="Lịch ca — về tuần hiện tại"
        >
          <span className="brand-icon">
            <Icon name="calendar" size={23} />
          </span>
          <span>
            lịch ca<span className="brand-period">.</span>
          </span>
        </a>
        <div className={`save-status ${saveStatus}`} role="status">
          <span className="status-dot" />
          {saveStatus === "saving"
            ? "Đang lưu…"
            : saveStatus === "error"
              ? "Chưa lưu được"
              : "Đã lưu thay đổi"}
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="ui-btn reset-button"
            disabled={
              scheduledShiftCount === 0 ||
              exporting ||
              saveStatus === "saving" ||
              resetting
            }
            onClick={() => {
              setResetError(null);
              setResetOpen(true);
            }}
            title="Xóa các ca trong tuần đang hiển thị để xếp lại từ đầu"
            aria-label="Xóa lịch"
          >
            <Icon name="trash" size={15} />
            <span className="action-label">Xóa lịch</span>
          </button>
          <button
            type="button"
            className="ui-btn-primary export-button"
            disabled={exporting}
            onClick={() => void onExport()}
            aria-label={exporting ? "Đang xuất lịch" : "Xuất lịch"}
          >
            <Icon name="download" size={17} />
            <span className="action-label">
              {exporting ? "Đang xuất…" : "Xuất lịch"}
            </span>
          </button>
        </div>
      </header>

      <main className="workspace">
        {notice && (
          <div className="notice" role="alert">
            <Icon name="alert" size={17} />
            <span>{notice}</span>
            <button
              type="button"
              className="icon-button"
              onClick={() => setNotice(null)}
              aria-label="Đóng thông báo"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        )}
        <SheetDnd onDragEnd={onDragEnd}>
          <div
            className={`schedule-layout ${!sidebarOpen ? "sidebar-hidden" : ""}`}
          >
            <section
              className="schedule-column"
              aria-label="Lịch làm việc theo tuần"
            >
              <div className="calendar-toolbar">
                <div className="date-controls">
                  <div className="week-navigation">
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => void changeWeek(shiftWeek(week, -1))}
                      aria-label="Tuần trước"
                    >
                      <Icon name="chevronLeft" size={18} />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => void changeWeek(shiftWeek(week, 1))}
                      aria-label="Tuần sau"
                    >
                      <Icon name="chevronRight" size={18} />
                    </button>
                  </div>
                  <label className="select-wrap">
                    <span className="sr-only">Tháng</span>
                    <select
                      aria-label="Tháng"
                      value={week.month}
                      onChange={(e) =>
                        void changeWeek({
                          ...week,
                          month: Number(e.target.value),
                          week: 1,
                        })
                      }
                    >
                      {MONTHS.map((month) => (
                        <option key={month} value={month}>
                          Tháng {month}
                        </option>
                      ))}
                    </select>
                    <Icon name="chevronDown" size={13} />
                  </label>
                  <label className="select-wrap year-select">
                    <span className="sr-only">Năm</span>
                    <select
                      aria-label="Năm"
                      value={week.year}
                      onChange={(e) =>
                        void changeWeek({
                          ...week,
                          year: Number(e.target.value),
                        })
                      }
                    >
                      {Array.from(new Set([...YEARS, week.year]))
                        .sort((a, b) => a - b)
                        .map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                    </select>
                    <Icon name="chevronDown" size={13} />
                  </label>
                  <button
                    type="button"
                    className="today-button"
                    onClick={() => void changeWeek(currentWeekRef())}
                    disabled={isCurrentWeek}
                  >
                    Hôm nay
                  </button>
                </div>
                <div className="toolbar-right">
                  <label className="employee-search">
                    <Icon name="search" size={15} />
                    <input
                      type="search"
                      placeholder="Tìm nhân viên…"
                      aria-label="Tìm nhân viên"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  <div className="view-controls">
                    <label className="select-wrap week-select">
                      <Icon name="calendar" size={14} />
                      <select
                        aria-label="Tuần"
                        value={week.week}
                        onChange={(e) =>
                          void changeWeek({
                            ...week,
                            week: Number(e.target.value),
                          })
                        }
                      >
                        {[1, 2, 3, 4, 5].map((w) => (
                          <option key={w} value={w}>
                            Tuần {w}
                          </option>
                        ))}
                      </select>
                      <Icon name="chevronDown" size={13} />
                    </label>
                    <button
                      type="button"
                      className={`icon-button sidebar-toggle ${sidebarOpen ? "active" : ""}`}
                      onClick={() => setSidebarOpen((open) => !open)}
                      aria-label={sidebarOpen ? "Ẩn danh sách ca" : "Hiện danh sách ca"}
                      aria-expanded={sidebarOpen}
                      title="Danh sách ca làm"
                    >
                      <Icon name="panel" size={17} />
                    </button>
                  </div>
                </div>
              </div>
              {selectedShift && (
                <div className="selection-hint" role="status">
                  <Icon name="plus" size={16} />
                  <span>
                    Đã chọn{" "}
                    <strong>{formatShiftLabel(selectedShift.label)}</strong>.
                    Nhấn vào ô để xếp ca.
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedShiftId(null)}
                  >
                    Bỏ chọn <Icon name="close" size={13} />
                  </button>
                </div>
              )}
              <ScheduleTable
                data={data}
                week={week}
                exporting={exporting}
                groupFilter={groupFilter}
                search={search}
                selectedShiftId={selectedShiftId}
                onAssignShift={assignShift}
                onEditEmployee={(id, details: EmployeeDetails) =>
                  patch((d) => {
                    const e = d.employees.find((x) => x.id === id);
                    if (e) {
                      const normalizedName = normalizeEmployeeName(details.name);
                      e.name = normalizedName;
                      e.shortName = makeShortName(normalizedName);
                      e.isNew = details.isNew;
                      e.isExecutiveChef = details.isExecutiveChef;
                      e.isManager = details.isManager;
                      e.isFullTime = details.isFullTime;
                      e.customRoleId = details.customRoleId;
                      if (details.isHeadChef)
                        for (const employee of d.employees)
                          employee.isHeadChef = employee.id === id;
                      else e.isHeadChef = false;
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
                onCommitAddEmployee={(groupId, details: EmployeeDetails) => {
                  patch((d) => {
                    const normalizedName = normalizeEmployeeName(details.name);
                    const order = d.employees.filter(
                      (e) => e.groupId === groupId,
                    ).length;
                    if (details.isHeadChef)
                      for (const employee of d.employees)
                        employee.isHeadChef = false;
                    d.employees.push({
                      id: newId(),
                      name: normalizedName,
                      shortName: makeShortName(normalizedName),
                      groupId,
                      sortOrder: order,
                      isHeadChef: details.isHeadChef,
                      isExecutiveChef: details.isExecutiveChef,
                      isManager: details.isManager,
                      isFullTime: details.isFullTime,
                      customRoleId: details.customRoleId,
                      isNew: details.isNew,
                    });
                  });
                }}
                onAddCustomRole={(name) => {
                  const normalizedName = name.trim().replace(/\s+/g, " ");
                  const existing = (dataRef.current?.customRoles ?? []).find(
                    (item) => item.name.toLocaleLowerCase("vi") === normalizedName.toLocaleLowerCase("vi"),
                  );
                  if (existing) return existing.id;
                  const id = newId();
                  patch((d) => {
                    d.customRoles ??= [];
                    d.customRoles.push({ id, name: normalizedName });
                  });
                  return id;
                }}
                onSetCountOverride={(day, period, value) =>
                  patch((draft) => {
                    const schedule = draft.schedules[key] ?? { entries: [] };
                    draft.schedules[key] = schedule;
                    schedule.countOverrides ??= {};
                    const overrideKey = `${day}:${period}`;
                    if (value == null) delete schedule.countOverrides[overrideKey];
                    else schedule.countOverrides[overrideKey] = value;
                  })
                }
                onRemoveEntry={(id) =>
                  patch((d) => {
                    const s = d.schedules[key];
                    if (s) s.entries = s.entries.filter((x) => x.id !== id);
                  })
                }
              />
            </section>
            <ShiftSidebar
              open={sidebarOpen}
              onToggle={() => setSidebarOpen((v) => !v)}
              shifts={data.shiftTypes}
              selectedShiftId={selectedShiftId}
              onSelect={(id) =>
                setSelectedShiftId((current) => (current === id ? null : id))
              }
              onSave={saveShift}
              weeklyShiftCount={entries.length}
              scheduledEmployeeCount={new Set(entries.map((entry) => entry.employeeId)).size}
              totalEmployees={data.employees.length}
              onDelete={(id) => {
                if (selectedShiftId === id) setSelectedShiftId(null);
                patch((d) => {
                  d.shiftTypes = d.shiftTypes.filter((s) => s.id !== id);
                  for (const s of Object.values(d.schedules)) {
                    s.entries = s.entries.filter((x) => x.shiftTypeId !== id);
                  }
                });
              }}
            />
          </div>
        </SheetDnd>
        <dialog
          ref={resetDialog}
          className="reset-dialog"
          aria-labelledby="reset-title"
          aria-describedby="reset-description"
          onCancel={(event) => {
            if (resetting) event.preventDefault();
            else setResetOpen(false);
          }}
          onClose={() => setResetOpen(false)}
        >
          <span className="reset-dialog-icon">
            <Icon name="trash" size={22} />
          </span>
          <h2 id="reset-title">Xóa lịch?</h2>
          <p id="reset-description">
            Xóa <strong>{scheduledShiftCount} ca của tuần {week.week}</strong> để
            xếp lại từ đầu. Lịch của các tuần khác, nhóm, nhân viên và loại ca
            vẫn được giữ nguyên.
          </p>
          <p className="reset-warning">Thao tác này không thể hoàn tác.</p>
          {resetError && (
            <p className="form-error" role="alert">
              {resetError}
            </p>
          )}
          <div className="reset-dialog-actions">
            <button
              type="button"
              className="ui-btn"
              autoFocus
              disabled={resetting}
              onClick={() => setResetOpen(false)}
            >
              Hủy
            </button>
            <button
              type="button"
              className="ui-btn reset-confirm"
              disabled={resetting || saveStatus === "saving"}
              onClick={() => void clearCurrentWeekSchedule()}
            >
              <Icon name="trash" size={14} />
              {resetting ? "Đang xóa…" : "Xóa lịch"}
            </button>
          </div>
        </dialog>
      </main>
    </div>
  );
}
