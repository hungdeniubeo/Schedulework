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
import { getEntryIssue, issueDescription } from "./overlap";
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
    entry.customStart && entry.customEnd
      ? `${entry.customStart}-${entry.customEnd}`
      : (type?.label ?? "Ca làm");
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
  const issue = entries
    .map((entry) => getEntryIssue(entry, entries, types))
    .find((value) => value != null);
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
      className={`schedule-cell ${day > 5 ? "weekend" : ""} ${today ? "today-cell" : ""} ${isOver ? (blocked ? "drop-blocked" : "drop-over") : ""} ${issue ? "has-conflict" : ""}`}
      title={
        issue
          ? issueDescription(issue)
          : blocked
            ? issueDescription(blocked)
            : undefined
      }
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
      {issue && (
        <span className="conflict-label" title={issueDescription(issue)}>
          <Icon name="alert" size={11} />
          <span className="sr-only">{issueDescription(issue)}</span>
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
  issuesOnly: boolean;
  search: string;
  selectedShiftId: string | null;
  onAssignShift: (employeeId: string, day: number) => void;
  addingGroup: boolean;
  addingEmployeeGroupId: string | null;
  onRenameGroup: (id: string, name: string) => void;
  onDeleteGroup: (id: string) => void;
  onRenameEmployee: (id: string, name: string) => void;
  onDeleteEmployee: (id: string) => void;
  onStartAddEmployee: (groupId: string) => void;
  onCommitAddEmployee: (groupId: string, name: string) => void;
  onCancelAddEmployee: () => void;
  onStartAddGroup: () => void;
  onCommitAddGroup: (name: string) => void;
  onCancelAddGroup: () => void;
  onRemoveEntry: (id: string) => void;
};

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
    issuesOnly,
    search,
    selectedShiftId,
    onAssignShift,
    addingGroup,
    addingEmployeeGroupId,
    onRenameGroup,
    onDeleteGroup,
    onRenameEmployee,
    onDeleteEmployee,
    onStartAddEmployee,
    onCommitAddEmployee,
    onCancelAddEmployee,
    onStartAddGroup,
    onCommitAddGroup,
    onCancelAddGroup,
    onRemoveEntry,
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
            e.name.toLocaleLowerCase("vi").includes(normalizedSearch) &&
            (exporting ||
              !issuesOnly ||
              entries.some(
                (entry) =>
                  entry.employeeId === e.id &&
                  getEntryIssue(entry, entries, data.shiftTypes),
              )),
        )
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }))
    .filter(
      (g) =>
        (!normalizedSearch && (!issuesOnly || exporting)) ||
        g.employees.length > 0,
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
                        className={`group-mark ${AVATAR_COLORS[group.sortOrder % AVATAR_COLORS.length]}`}
                      >
                        <Icon name="grid" size={13} />
                      </span>
                      <InlineEdit
                        value={group.name}
                        onCommit={(name) => onRenameGroup(group.id, name)}
                      />
                      <span className="group-count">
                        {group.employees.length} nhân viên
                      </span>
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
                        <RemoveButton
                          onClick={() => onDeleteGroup(group.id)}
                          label={`Xóa nhóm ${group.name}`}
                        />
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
                          .sort(
                            (a, b) => a.sortOrderInCell - b.sortOrderInCell,
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
            <tr className="no-export">
              <td colSpan={8} className="add-group-cell">
                {addingGroup ? (
                  <AddNameInput
                    placeholder="Tên nhóm mới"
                    onCommit={onCommitAddGroup}
                    onCancel={onCancelAddGroup}
                  />
                ) : (
                  <button
                    type="button"
                    className="add-group-button"
                    onClick={onStartAddGroup}
                  >
                    <Icon name="plus" size={16} />
                    Thêm nhóm mới
                  </button>
                )}
              </td>
            </tr>
          </tbody>
        </table>
        <div className="sheet-footer">
          <span>
            <span className="legend-dot" /> Ca làm việc
          </span>
          <span>
            <span className="legend-dot conflict-dot" /> Ca trùng giờ
          </span>
        </div>
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
