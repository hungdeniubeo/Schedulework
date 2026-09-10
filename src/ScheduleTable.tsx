import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDndContext,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Fragment, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { PRIORITY_GROUP_ID } from "./defaultData";
import { EmployeeEditor, type EmployeeDetails } from "./EmployeeEditor";
import { EmployeeDeleteDialog } from "./EmployeeDeleteDialog";
import { Icon } from "./Icon";
import { getEntryIssue, issueDescription, rangesForEntry } from "./overlap";
import { staffingStatusForShiftCount } from "./staffing";
import {
  formatShiftLabel,
  isLongShift,
  LONG_SHIFT_TOOLTIP,
  semanticShiftColor,
  shiftStyle,
} from "./shiftStyle";
import type { AppData, Employee, ScheduleEntry, ShiftType } from "./types";
import { formatDayHeader, weekDays, weekKey, type WeekRef } from "./week";

type ActiveDragData =
  | { kind: "palette"; shiftTypeId: string; label: string }
  | { kind: "entry"; entryId: string; entry: ScheduleEntry; label: string }
  | { kind: "employee"; employeeId: string; employeeName: string; groupId: string; colorClass: string };

const DAYS = [
  "Thứ hai",
  "Thứ ba",
  "Thứ tư",
  "Thứ năm",
  "Thứ sáu",
  "Thứ bảy",
  "Chủ nhật",
];
const GROUP_DOT_COLORS = ["meat-dot", "soup-dot", "salad-dot"];
const EMPLOYEE_COLUMN_CHROME_WIDTH = 143;

function groupDotColor(groupId: string, sortOrder: number): string {
  if (groupId === PRIORITY_GROUP_ID) return "priority-dot";
  return GROUP_DOT_COLORS[Math.abs(sortOrder) % GROUP_DOT_COLORS.length];
}

function RemoveButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className="remove-button no-export"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      title={label}
    >
      <Icon name="close" size={13} />
    </button>
  );
}

export function PaletteShift({
  shift,
  selected,
  onSelect,
}: {
  shift: ShiftType;
  selected: boolean;
  onSelect: () => void;
}) {
  const tooltip = isLongShift(shift.label) ? LONG_SHIFT_TOOLTIP : undefined;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${shift.id}`,
    data: { kind: "palette", shiftTypeId: shift.id, label: shift.label },
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      style={shiftStyle(semanticShiftColor(shift.label))}
      className={`palette-shift ${selected ? "selected" : ""} ${isDragging ? "is-dragging" : ""}`}
      {...listeners}
      {...attributes}
      aria-pressed={selected}
      aria-label={`Chọn ca ${shift.label}`}
      title={tooltip}
      onClick={onSelect}
    >
      <span className="shift-color-dot" />
      <span className="palette-label">
        {shift.label.split("/").map((part, i) => (
          <span key={i}>{formatShiftLabel(part)}</span>
        ))}
      </span>
      <Icon
        name={selected ? "check" : "grip"}
        size={16}
        className="palette-grip"
      />
    </button>
  );
}

function EntryChip({
  entry,
  types,
  onRemove,
}: {
  entry: ScheduleEntry;
  types: ShiftType[];
  onRemove: () => void;
}) {
  const type = types.find((t) => t.id === entry.shiftTypeId);
  const label =
    entry.customLabel ||
    (entry.customStart && entry.customEnd
      ? `${entry.customStart}-${entry.customEnd}`
      : (type?.label ?? "Ca làm"));
  const tooltip = isLongShift(label) ? LONG_SHIFT_TOOLTIP : undefined;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `entry:${entry.id}`,
    data: { kind: "entry", entryId: entry.id, entry, label },
  });
  return (
    <div
      className={`shift-line ${isDragging ? "is-dragging" : ""}`}
      style={shiftStyle(semanticShiftColor(label))}
      title={tooltip}
    >
      <button
        type="button"
        ref={setNodeRef}
        className="entry-drag-handle"
        {...listeners}
        {...attributes}
        aria-label={`Di chuyển ca ${label}`}
      >
        {label.split("/").map((part, i) => (
          <span key={i}>{formatShiftLabel(part)}</span>
        ))}
      </button>
      <RemoveButton onClick={onRemove} label={`Xóa ca ${label}`} />
    </div>
  );
}

function Cell({
  employeeId,
  employeeName,
  day,
  entries,
  types,
  selectedShiftId,
  today,
  onAssignShift,
  onRemoveEntry,
}: {
  employeeId: string;
  employeeName: string;
  day: number;
  entries: ScheduleEntry[];
  types: ShiftType[];
  selectedShiftId: string | null;
  today: boolean;
  onAssignShift: (employeeId: string, day: number) => void;
  onRemoveEntry: (id: string) => void;
}) {
  const { active, setNodeRef, isOver } = useDroppable({
    id: `cell:${employeeId}:${day}`,
    data: { kind: "cell", employeeId, dayOfWeek: day },
  });
  const source = active?.data.current as ActiveDragData | undefined;
  const movingEntry =
    source?.kind === "entry" ? (source.entry as ScheduleEntry) : undefined;
  const previewTypeId =
    isOver && source?.kind === "palette"
      ? (source.shiftTypeId as string)
      : isOver && source?.kind === "entry"
        ? movingEntry?.shiftTypeId
        : selectedShiftId;
  const candidate: ScheduleEntry | null = previewTypeId
    ? {
        ...(movingEntry ?? {
          id: "preview",
          customStart: null,
          customEnd: null,
          sortOrderInCell: 0,
        }),
        employeeId,
        dayOfWeek: day,
        shiftTypeId: previewTypeId,
      }
    : null;
  const blocked = candidate ? getEntryIssue(candidate, entries, types) : null;
  return (
    <td
      ref={setNodeRef}
      className={`schedule-cell ${day > 5 ? "weekend" : ""} ${today ? "today-cell" : ""} ${isOver ? (blocked ? "drop-blocked" : "drop-over") : ""}`}
      title={blocked ? issueDescription(blocked) : undefined}
    >
      <div className="cell-content">
        {entries.map((entry) => (
          <EntryChip
            key={entry.id}
            entry={entry}
            types={types}
            onRemove={() => onRemoveEntry(entry.id)}
          />
        ))}
        {(!entries.length || selectedShiftId) && (
          <button
            type="button"
            className={`cell-add no-export ${selectedShiftId ? "can-assign" : ""} ${entries.length ? "has-entries" : ""} ${blocked ? "is-blocked" : ""}`}
            disabled={!selectedShiftId}
            onClick={() => onAssignShift(employeeId, day)}
            aria-label={`Thêm ca cho ${employeeName}, ${DAYS[day - 1]}`}
          >
            <span className="cell-dash">{isOver ? "Thả vào đây" : "–"}</span>
            <Icon name="plus" size={16} />
          </button>
        )}
      </div>
      {isOver && blocked && (
        <span className="drop-message no-export">
          {blocked.kind === "overlap" ? "Trùng giờ" : "Giờ chưa hợp lệ"}
        </span>
      )}
    </td>
  );
}

function EmployeeDropRow({
  employee,
  groupId,
  priority,
  children,
}: {
  employee: Employee;
  groupId: string;
  priority: boolean;
  children: ReactNode;
}) {
  const { active, setNodeRef, isOver } = useDroppable({
    id: `employee-target:${employee.id}`,
    data: { kind: "employee", employeeId: employee.id, groupId },
  });
  const source = active?.data.current as ActiveDragData | undefined;
  const isDragging = source?.kind === "employee" && source.employeeId === employee.id;
  return (
    <tr ref={setNodeRef} className={`employee-row ${priority ? "priority-employee-row" : ""} ${source?.kind === "employee" ? "is-reorder-mode" : ""} ${isDragging ? "is-dragging-employee" : ""} ${isOver && !isDragging ? "is-drop-target" : ""}`}>
      {children}
    </tr>
  );
}

function EmployeeGroupDropRow({
  groupId,
  priority,
  children,
}: {
  groupId: string;
  priority: boolean;
  children: ReactNode;
}) {
  const { active, setNodeRef, isOver } = useDroppable({
    id: `employee-group-target:${groupId}`,
    data: { kind: "employee-group", groupId },
  });
  const source = active?.data.current as ActiveDragData | undefined;
  const isEmployeeDropTarget = source?.kind === "employee" && isOver;
  return (
    <tr
      ref={setNodeRef}
      className={`${priority ? "priority-group-row" : "group-row"} ${isEmployeeDropTarget ? "is-employee-drop-target" : ""}`}
    >
      {children}
    </tr>
  );
}

function EmployeeDragHandle({ employee, groupId, colorClass }: { employee: Employee; groupId: string; colorClass: string }) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `employee:${employee.id}`,
    data: { kind: "employee", employeeId: employee.id, employeeName: employee.name, groupId, colorClass },
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      className="employee-drag-handle no-export"
      title="Kéo để sắp xếp nhân viên"
      aria-label={`Kéo ${employee.name} để sắp xếp`}
      {...listeners}
      {...attributes}
    >
      <Icon name="grip" size={13} />
    </button>
  );
}

type Props = {
  data: AppData;
  week: WeekRef;
  exporting: boolean;
  groupFilter: string;
  search: string;
  selectedShiftId: string | null;
  onAssignShift: (employeeId: string, day: number) => void;
  onEditEmployee: (id: string, details: EmployeeDetails) => void;
  onDeleteEmployee: (id: string) => void;
  onCommitAddEmployee: (groupId: string, details: EmployeeDetails) => void;
  onAddCustomRole: (name: string) => string;
  onRemoveEntry: (id: string) => void;
  onSetCountOverride: (
    day: number,
    period: "S" | "T" | "Đ",
    value: number | null,
  ) => void;
};

const FIXED_GROUPS = [
  { name: "Meat", icon: "meat" as const },
  { name: "Soup", icon: "soup" as const },
  { name: "Salad", icon: "salad" as const },
];

function periodsForRange(range: { start: number; end: number }): ("S" | "T" | "Đ")[] {
  const windows = [
    { period: "S" as const, start: 0, end: 14 * 60 },
    { period: "T" as const, start: 14 * 60, end: 17 * 60 },
    { period: "Đ" as const, start: 17 * 60, end: 24 * 60 },
  ];
  const coverage = windows.map((window) => ({
    period: window.period,
    overlap: Math.max(
      0,
      Math.min(range.end, window.end) - Math.max(range.start, window.start),
    ),
  }));
  const substantial = coverage
    .filter(({ overlap }) => overlap >= 2 * 60)
    .map(({ period }) => period);
  if (substantial.length) return substantial;
  return [coverage.reduce((best, current) =>
    current.overlap > best.overlap ? current : best,
  ).period];
}

function compareEntriesByTime(
  first: ScheduleEntry,
  second: ScheduleEntry,
  types: ShiftType[],
): number {
  const firstRanges = rangesForEntry(
    first,
    types.find((type) => type.id === first.shiftTypeId),
  );
  const secondRanges = rangesForEntry(
    second,
    types.find((type) => type.id === second.shiftTypeId),
  );
  const firstStart = firstRanges[0]?.start ?? Number.POSITIVE_INFINITY;
  const secondStart = secondRanges[0]?.start ?? Number.POSITIVE_INFINITY;
  if (firstStart !== secondStart) return firstStart - secondStart;
  const firstEnd = firstRanges[0]?.end ?? Number.POSITIVE_INFINITY;
  const secondEnd = secondRanges[0]?.end ?? Number.POSITIVE_INFINITY;
  return firstEnd - secondEnd || first.sortOrderInCell - second.sortOrderInCell;
}

export function ScheduleTable(props: Props) {
  const {
    data,
    week,
    exporting,
    groupFilter,
    search,
    selectedShiftId,
    onAssignShift,
    onEditEmployee,
    onDeleteEmployee,
    onCommitAddEmployee,
    onAddCustomRole,
    onRemoveEntry,
    onSetCountOverride,
  } = props;
  const days = useMemo(() => weekDays(week), [week]);
  const [employeeEditor, setEmployeeEditor] = useState<{
    groupId: string;
    employee?: Employee;
  } | null>(null);
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null);
  const entries = data.schedules[weekKey(week)]?.entries ?? [];
  const today = new Date().toDateString();
  const normalizedSearch = (exporting ? "" : search)
    .trim()
    .toLocaleLowerCase("vi");
  const groups = [...data.groups]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((g) => exporting || groupFilter === "all" || groupFilter === g.id)
    .map((group) => ({
      ...group,
      employees: data.employees
        .filter(
          (e) =>
            e.groupId === group.id &&
            e.name.toLocaleLowerCase("vi").includes(normalizedSearch),
        )
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }))
    .filter((g) => !normalizedSearch || g.employees.length > 0);
  const automaticCounts = Array.from({ length: 7 }, () => ({
    S: 0,
    T: 0,
    Đ: 0,
  }));
  const dailyShiftCounts = Array.from({ length: 7 }, () => 0);
  for (const entry of entries) {
    if (entry.dayOfWeek >= 1 && entry.dayOfWeek <= 7) {
      dailyShiftCounts[entry.dayOfWeek - 1] += 1;
    }
    const type = data.shiftTypes.find((item) => item.id === entry.shiftTypeId);
    const entryPeriods = new Set<"S" | "T" | "Đ">();
    for (const range of rangesForEntry(entry, type)) {
      for (const period of periodsForRange(range)) entryPeriods.add(period);
    }
    for (const period of entryPeriods)
      automaticCounts[entry.dayOfWeek - 1][period] += 1;
  }
  const countOverrides = data.schedules[weekKey(week)]?.countOverrides ?? {};
  const employeeColumnWidth = useMemo(() => {
    const context = typeof document === "undefined"
      ? null
      : document.createElement("canvas").getContext("2d");
    if (context) {
      context.font = '650 13px "Helvetica Neue", "Segoe UI Variable", "Segoe UI", Arial, sans-serif';
    }

    return Math.max(
      195,
      ...data.employees.map((employee) => {
        const nameWidth = context?.measureText(employee.name).width ?? employee.name.length * 7.5;
        return Math.ceil(nameWidth + EMPLOYEE_COLUMN_CHROME_WIDTH);
      }),
    );
  }, [data.employees]);
  const sheetStyle = { "--employee-column-width": `${employeeColumnWidth}px` } as CSSProperties;

  return (
    <div className="sheet-scroll">
      <div
        className={`schedule-sheet ${exporting ? "exporting" : ""}`}
        id="schedule-sheet"
        style={sheetStyle}
      >
        <div className="sheet-heading">
          <div>
            <span className="sheet-eyebrow">LỊCH LÀM VIỆC</span>
            <h2>
              Tuần {week.week} <span>·</span> Tháng {week.month}, {week.year}
            </h2>
          </div>
          <span className="sheet-date-range">
            <Icon name="calendar" size={15} />
            {formatDayHeader(days[0])} — {formatDayHeader(days[6])}
          </span>
        </div>
        <table className="sheet">
          <colgroup>
            <col className="employee-column" />
            {DAYS.map((d) => (
              <col key={d} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="corner" scope="col">
                <span>
                  <Icon name="users" size={15} />
                  Nhân viên
                </span>
              </th>
              {days.map((date, i) => (
                <th
                  key={i}
                  scope="col"
                  className={`day-head ${i > 4 ? "weekend" : ""} ${date.toDateString() === today ? "today" : ""}`}
                >
                  <span className="weekday">{DAYS[i]}</span>
                  <span className="day-number">{formatDayHeader(date)}</span>
                  {date.toDateString() === today && (
                    <span className="today-dot" />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <Fragment key={group.id}>
                <EmployeeGroupDropRow
                  groupId={group.id}
                  priority={group.id === PRIORITY_GROUP_ID}
                >
                  <td colSpan={8}>
                    <div className={group.id === PRIORITY_GROUP_ID ? "priority-group-row-content" : "group-row-content"}>
                      {group.id !== PRIORITY_GROUP_ID && (
                        <>
                          <span
                            className={`group-mark group-mark-${group.sortOrder}`}
                          >
                            <Icon
                              name={FIXED_GROUPS[group.sortOrder]?.icon ?? "grid"}
                              size={17}
                            />
                          </span>
                          <strong className="fixed-group-name">
                            {(
                              FIXED_GROUPS[group.sortOrder]?.name ?? group.name
                            ).toLocaleUpperCase("vi")}
                          </strong>
                        </>
                      )}
                      {group.id === PRIORITY_GROUP_ID && <span className="priority-group-accent" aria-hidden="true" />}
                      <div className="group-actions no-export">
                        <button
                          type="button"
                          className="group-add"
                          onClick={() => setEmployeeEditor({ groupId: group.id })}
                          aria-label={group.id === PRIORITY_GROUP_ID ? "Thêm nhân viên ưu tiên" : `Thêm nhân viên vào ${group.name}`}
                        >
                          <Icon name="plus" size={13} />
                          <span className="sr-only">Thêm nhân viên</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </EmployeeGroupDropRow>
                {group.employees.map((employee) => (
                  <EmployeeDropRow
                    key={employee.id}
                    employee={employee}
                    groupId={group.id}
                    priority={group.id === PRIORITY_GROUP_ID}
                  >
                    <th
                      scope="row"
                      className={`name-cell ${employee.isNew ? "is-new-employee" : ""}`}
                    >
                      <div className="employee-identity">
                        <EmployeeDragHandle employee={employee} groupId={group.id} colorClass={groupDotColor(group.id, group.sortOrder)} />
                        <span className="employee-avatar-wrap">
                          <span
                            className={`avatar ${groupDotColor(group.id, group.sortOrder)}`}
                          />
                        </span>
                        <button
                          type="button"
                          className="employee-name-button"
                          onClick={() => setEmployeeEditor({ groupId: group.id, employee })}
                          title="Chỉnh sửa nhân viên"
                        >
                          <span className="employee-name">{employee.name}</span>
                        </button>
                        <span className="employee-role-status">
                          {employee.isExecutiveChef ? (
                            <span className="role-icon executive-chef-badge" role="img" tabIndex={0} data-tooltip="Tổng bếp trưởng" aria-label="Tổng bếp trưởng">
                              <Icon name="crown" size={13} />
                            </span>
                          ) : employee.isHeadChef ? (
                            <span className="role-icon head-chef-badge" role="img" tabIndex={0} data-tooltip="Bếp trưởng" aria-label="Bếp trưởng">
                              <Icon name="chefHat" size={13} />
                            </span>
                          ) : employee.isFullTime ? (
                            <span className="role-icon full-time-badge" role="img" tabIndex={0} data-tooltip="Full-time" aria-label="Full-time">
                              <Icon name="star" size={13} />
                            </span>
                          ) : null}
                        </span>
                        <span className="employee-new-status">
                          {employee.isNew && (
                            <span className="new-employee-badge">NEW</span>
                          )}
                        </span>
                        <button
                          type="button"
                          className="employee-remove no-export"
                          onClick={() => setDeleteEmployee(employee)}
                          title={`Xóa ${employee.name}`}
                          aria-label={`Xóa nhân viên ${employee.name}`}
                        >
                          <Icon name="close" size={13} />
                        </button>
                      </div>
                    </th>
                    {days.map((date, i) => (
                      <Cell
                        key={i}
                        employeeId={employee.id}
                        employeeName={employee.name}
                        day={i + 1}
                        today={date.toDateString() === today}
                        entries={entries
                          .filter(
                            (e) =>
                              e.employeeId === employee.id &&
                              e.dayOfWeek === i + 1,
                          )
                          .sort((a, b) =>
                            compareEntriesByTime(a, b, data.shiftTypes),
                          )}
                        types={data.shiftTypes}
                        selectedShiftId={exporting ? null : selectedShiftId}
                        onAssignShift={onAssignShift}
                        onRemoveEntry={onRemoveEntry}
                      />
                    ))}
                  </EmployeeDropRow>
                ))}
                {group.id !== PRIORITY_GROUP_ID && !group.employees.length && (
                    <tr className="no-export">
                      <td colSpan={8} className="empty-group">
                        Chưa có nhân viên.{" "}
                        <button
                          type="button"
                          onClick={() => setEmployeeEditor({ groupId: group.id })}
                        >
                          Thêm người đầu tiên <Icon name="arrow" size={14} />
                        </button>
                      </td>
                    </tr>
                  )}
              </Fragment>
            ))}
            {!groups.length && (
              <tr className="no-export">
                <td colSpan={8} className="empty-schedule">
                  <Icon
                    name={normalizedSearch ? "search" : "users"}
                    size={28}
                  />
                  <strong>
                    {normalizedSearch
                      ? "Không tìm thấy nhân viên"
                      : "Bắt đầu với đội ngũ của bạn"}
                  </strong>
                  <p>
                    {normalizedSearch
                      ? "Thử tìm bằng tên khác hoặc chọn tất cả nhóm."
                      : "Thêm một nhóm và nhân viên để bắt đầu xếp lịch."}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <section className="daily-summary" aria-label="Tổng ca theo ngày">
          <header className="daily-summary-heading">
            <span className="daily-summary-heading-icon"><Icon name="grid" size={14} /></span>
            <span><strong>Tổng ca</strong><small>Theo buổi trong ngày</small></span>
          </header>
          {days.map((date, dayIndex) => {
            const values = (["S", "T", "Đ"] as const).map((period) => ({
              period,
              value: countOverrides[`${dayIndex + 1}:${period}`] ?? automaticCounts[dayIndex][period],
            }));
            const shiftCount = dailyShiftCounts[dayIndex];
            const staffingStatus = staffingStatusForShiftCount(shiftCount);
            const staffingLabel = shiftCount === 0
              ? "Chưa có ca"
              : `${shiftCount} ca đã xếp · Trạng thái ${staffingStatus === "critical" ? "đỏ" : staffingStatus === "warning" ? "vàng" : "xanh"}`;
            return (
              <article className={`daily-summary-card ${values.some(({ value }) => value > 0) ? "has-shifts" : ""}`} key={date.toISOString()}>
                <span className="daily-summary-date"><span>{DAYS[dayIndex]}</span><b>{formatDayHeader(date)}</b></span>
                {values.map(({ period, value }) => (
                  <div className={`daily-summary-line ${value === 0 ? "is-empty" : ""}`} key={period}>
                    <span><Icon name={period === "S" ? "sun" : period === "T" ? "sunHigh" : "moon"} size={14} />{{ S: "Sáng", T: "Trưa", Đ: "Tối" }[period]}</span>
                    <input key={`${period}:${value}`} type="number" min="0" defaultValue={value} aria-label={`Tổng ca ${period} ngày ${dayIndex + 1}`} title="Nhập số để chỉnh tay; xóa trắng để dùng số tự động" onBlur={(event) => {
                      const raw = event.currentTarget.value.trim();
                      onSetCountOverride(dayIndex + 1, period, raw === "" ? null : Math.max(0, Number(raw) || 0));
                    }} />
                  </div>
                ))}
                <span
                  className={`staffing-status staffing-status-${staffingStatus}`}
                  title={staffingLabel}
                  aria-label={staffingLabel}
                  tabIndex={0}
                >
                  <span
                    className="staffing-status-fill"
                    style={{ width: shiftCount === 0 ? 0 : "100%" }}
                  />
                </span>
              </article>
            );
          })}
        </section>
      </div>
      {employeeEditor && <EmployeeEditor
        employee={employeeEditor.employee}
        currentChef={data.employees.find((employee) => employee.isHeadChef)}
        customRoles={data.customRoles ?? []}
        onAddCustomRole={onAddCustomRole}
        onClose={() => setEmployeeEditor(null)}
        onSave={(details) => {
          if (employeeEditor.employee) onEditEmployee(employeeEditor.employee.id, details);
          else onCommitAddEmployee(employeeEditor.groupId, details);
          setEmployeeEditor(null);
        }}
        onDelete={employeeEditor.employee ? () => setDeleteEmployee(employeeEditor.employee!) : undefined}
      />}
      {deleteEmployee && (() => {
        const affectedWeeks = Object.values(data.schedules).filter((schedule) =>
          schedule.entries.some((entry) => entry.employeeId === deleteEmployee.id),
        );
        const shiftCount = affectedWeeks.reduce(
          (total, schedule) => total + schedule.entries.filter((entry) => entry.employeeId === deleteEmployee.id).length,
          0,
        );
        const group = data.groups.find((item) => item.id === deleteEmployee.groupId);
        const areaName = group?.id === PRIORITY_GROUP_ID
          ? ""
          : (FIXED_GROUPS[group?.sortOrder ?? -1]?.name ?? group?.name ?? "Chưa có khu vực").toLocaleUpperCase("vi");
        const customRoleName = (data.customRoles ?? []).find(
          (item) => item.id === deleteEmployee.customRoleId,
        )?.name;
        return <EmployeeDeleteDialog
          employee={deleteEmployee}
          areaName={areaName}
          customRoleName={customRoleName}
          colorClass={groupDotColor(group?.id ?? "", group?.sortOrder ?? 0)}
          shiftCount={shiftCount}
          weekCount={affectedWeeks.length}
          onClose={() => setDeleteEmployee(null)}
          onConfirm={() => {
            onDeleteEmployee(deleteEmployee.id);
            setDeleteEmployee(null);
            setEmployeeEditor(null);
          }}
        />;
      })()}
    </div>
  );
}

function ActiveDragOverlay() {
  const { active } = useDndContext();
  const source = active?.data.current as ActiveDragData | undefined;
  if (!source) return null;
  if (source.kind === "employee")
    return (
      <div className="employee-drag-overlay">
        <span className={`employee-drag-dot ${source.colorClass}`} />
        <strong>{source.employeeName}</strong>
        <Icon name="grip" size={13} />
      </div>
    );
  return (
    <div className="drag-overlay" style={shiftStyle(semanticShiftColor(source.label))}>
      <span className="shift-color-dot" />
      <span className="drag-overlay-label">
        {source.label.split("/").map((part, index) => (
          <span key={index}>{formatShiftLabel(part)}</span>
        ))}
      </span>
      <Icon name="grip" size={13} />
    </div>
  );
}

const scheduleCollisionDetection: CollisionDetection = (args) => {
  const employeeDrag = args.active.data.current?.kind === "employee";
  return pointerWithin(args).filter((collision) => {
    const id = String(collision.id);
    return employeeDrag
      ? id.startsWith("employee-target:") || id.startsWith("employee-group-target:")
      : id.startsWith("cell:");
  });
};

export function SheetDnd({
  children,
  onDragEnd,
}: {
  children: ReactNode;
  onDragEnd: (e: DragEndEvent) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={scheduleCollisionDetection}
      measuring={{ droppable: { strategy: MeasuringStrategy.BeforeDragging } }}
      onDragEnd={onDragEnd}
    >
      {children}
      <DragOverlay
        dropAnimation={null}
      >
        <ActiveDragOverlay />
      </DragOverlay>
    </DndContext>
  );
}
