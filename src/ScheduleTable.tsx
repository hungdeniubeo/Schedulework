import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDndContext,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Fragment, useMemo, type ReactNode } from "react";
import { InlineEdit } from "./InlineEdit";
import { Icon } from "./Icon";
import { getEntryIssue, issueDescription, rangesForEntry } from "./overlap";
import { formatShiftLabel, shiftStyle } from "./shiftStyle";
import type { AppData, ScheduleEntry, ShiftType } from "./types";
import { formatDayHeader, weekDays, weekKey, type WeekRef } from "./week";

const DAYS = [
  "Thứ hai",
  "Thứ ba",
  "Thứ tư",
  "Thứ năm",
  "Thứ sáu",
  "Thứ bảy",
  "Chủ nhật",
];
const AVATAR_COLORS = ["sage", "peach", "lavender", "blue"];

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
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${shift.id}`,
    data: { kind: "palette", shiftTypeId: shift.id },
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      style={shiftStyle(shift.color)}
      className={`palette-shift ${selected ? "selected" : ""} ${isDragging ? "is-dragging" : ""}`}
      {...listeners}
      {...attributes}
      aria-pressed={selected}
      aria-label={`Chọn ca ${shift.label}`}
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
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `entry:${entry.id}`,
    data: { kind: "entry", entryId: entry.id, entry },
  });
  const type = types.find((t) => t.id === entry.shiftTypeId);
  const label =
    entry.customLabel ||
    (entry.customStart && entry.customEnd
      ? `${entry.customStart}-${entry.customEnd}`
      : (type?.label ?? "Ca làm"));
  return (
    <div
      className={`shift-line ${isDragging ? "is-dragging" : ""}`}
      style={shiftStyle(type?.color ?? "#C5D9C7")}
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
  const { setNodeRef, isOver } = useDroppable({
    id: `cell:${employeeId}:${day}`,
    data: { employeeId, dayOfWeek: day },
  });
  const { active } = useDndContext();
  const source = active?.data.current;
  const movingEntry =
    source?.kind === "entry" ? (source.entry as ScheduleEntry) : undefined;
  const previewTypeId =
    source?.kind === "palette"
      ? (source.shiftTypeId as string)
      : (movingEntry?.shiftTypeId ?? selectedShiftId);
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

type Props = {
  data: AppData;
  week: WeekRef;
  exporting: boolean;
  groupFilter: string;
  search: string;
  selectedShiftId: string | null;
  onAssignShift: (employeeId: string, day: number) => void;
  addingEmployeeGroupId: string | null;
  onRenameEmployee: (id: string, name: string) => void;
  onDeleteEmployee: (id: string) => void;
  onStartAddEmployee: (groupId: string) => void;
  onCommitAddEmployee: (groupId: string, name: string) => void;
  onCancelAddEmployee: () => void;
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

function AddNameInput({
  placeholder,
  onCommit,
  onCancel,
}: {
  placeholder: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}) {
  return (
    <input
      autoFocus
      className="ui-input add-name-input"
      aria-label={placeholder}
      placeholder={placeholder}
      onBlur={(e) => {
        const value = e.target.value.trim();
        if (value) onCommit(value);
        else onCancel();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          e.currentTarget.value = "";
          e.currentTarget.blur();
        }
      }}
    />
  );
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
    addingEmployeeGroupId,
    onRenameEmployee,
    onDeleteEmployee,
    onStartAddEmployee,
    onCommitAddEmployee,
    onCancelAddEmployee,
    onRemoveEntry,
    onSetCountOverride,
  } = props;
  const days = useMemo(() => weekDays(week), [week]);
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
  for (const entry of entries) {
    const type = data.shiftTypes.find((item) => item.id === entry.shiftTypeId);
    const entryPeriods = new Set<"S" | "T" | "Đ">();
    for (const range of rangesForEntry(entry, type)) {
      for (const period of periodsForRange(range)) entryPeriods.add(period);
    }
    for (const period of entryPeriods)
      automaticCounts[entry.dayOfWeek - 1][period] += 1;
  }
  const countOverrides = data.schedules[weekKey(week)]?.countOverrides ?? {};
  const dailyStaffCounts = Array.from({ length: 7 }, (_, dayIndex) =>
    new Set(
      entries
        .filter((entry) => entry.dayOfWeek === dayIndex + 1)
        .map((entry) => entry.employeeId),
    ).size,
  );

  return (
    <div className="sheet-scroll">
      <div
        className={`schedule-sheet ${exporting ? "exporting" : ""}`}
        id="schedule-sheet"
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
                <tr className="group-row">
                  <td colSpan={8}>
                    <div className="group-row-content">
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
                      <div className="group-actions no-export">
                        <button
                          type="button"
                          className="group-add"
                          onClick={() => onStartAddEmployee(group.id)}
                          aria-label={`Thêm nhân viên vào ${group.name}`}
                        >
                          <Icon name="plus" size={13} />
                          <span className="sr-only">Thêm nhân viên</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
                {group.employees.map((employee, employeeIndex) => (
                  <tr key={employee.id} className="employee-row">
                    <th scope="row" className="name-cell">
                      <div className="employee-identity">
                        <span
                          className={`avatar ${AVATAR_COLORS[(group.sortOrder + employeeIndex) % AVATAR_COLORS.length]}`}
                        >
                          {employee.shortName
                            .slice(0, 1)
                            .toLocaleUpperCase("vi")}
                        </span>
                        <InlineEdit
                          value={employee.name}
                          onCommit={(name) =>
                            onRenameEmployee(employee.id, name)
                          }
                        />
                        <RemoveButton
                          onClick={() => onDeleteEmployee(employee.id)}
                          label={`Xóa nhân viên ${employee.name}`}
                        />
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
                  </tr>
                ))}
                {addingEmployeeGroupId === group.id && (
                  <tr className="no-export">
                    <td colSpan={8} className="add-name-cell">
                      <AddNameInput
                        placeholder="Tên nhân viên mới"
                        onCommit={(name) => onCommitAddEmployee(group.id, name)}
                        onCancel={onCancelAddEmployee}
                      />
                    </td>
                  </tr>
                )}
                {!group.employees.length &&
                  addingEmployeeGroupId !== group.id && (
                    <tr className="no-export">
                      <td colSpan={8} className="empty-group">
                        Chưa có nhân viên.{" "}
                        <button
                          type="button"
                          onClick={() => onStartAddEmployee(group.id)}
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
            {(["S", "T", "Đ"] as const).map((period) => (
              <tr className="shift-summary-row" key={period}>
                <th scope="row">
                  <span>{{ S: "Sáng", T: "Trưa", Đ: "Tối" }[period]}</span>
                </th>
                {days.map((_, dayIndex) => {
                  const overrideKey = `${dayIndex + 1}:${period}`;
                  const value =
                    countOverrides[overrideKey] ??
                    automaticCounts[dayIndex][period];
                  return (
                    <td
                      key={overrideKey}
                      className={value === 0 ? "zero-count" : undefined}
                    >
                      <input
                        key={`${overrideKey}:${value}`}
                        type="number"
                        min="0"
                        defaultValue={value}
                        aria-label={`Tổng ca ${period} ngày ${dayIndex + 1}`}
                        title="Nhập số khác để chỉnh tay; xóa trắng để dùng số tự động"
                        onBlur={(event) => {
                          const raw = event.currentTarget.value.trim();
                          onSetCountOverride(
                            dayIndex + 1,
                            period,
                            raw === "" ? null : Math.max(0, Number(raw) || 0),
                          );
                        }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="staff-density-row">
              <th scope="row">Tỷ lệ bố trí</th>
              {days.map((_, dayIndex) => {
                const count = dailyStaffCounts[dayIndex];
                const percent = data.employees.length
                  ? Math.round((count / data.employees.length) * 100)
                  : 0;
                const level = percent < 40 ? "low" : percent < 70 ? "medium" : "high";
                return (
                  <td
                    key={dayIndex}
                    title={`${count}/${data.employees.length} nhân viên đã có ca`}
                  >
                    <div
                      className={`density-track density-${level}`}
                      role="img"
                      aria-label={`${count} trên ${data.employees.length} nhân viên, ${percent}%`}
                    >
                      <span style={{ width: `${percent}%` }} />
                    </div>
                    <small>
                      {count}/{data.employees.length}
                    </small>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SheetDnd({
  children,
  onDragStart,
  onDragEnd,
  onDragCancel,
  overlay,
}: {
  children: ReactNode;
  onDragStart: (e: DragStartEvent) => void;
  onDragEnd: (e: DragEndEvent) => void;
  onDragCancel: () => void;
  overlay: ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      {children}
      <DragOverlay dropAnimation={null}>{overlay}</DragOverlay>
    </DndContext>
  );
}
