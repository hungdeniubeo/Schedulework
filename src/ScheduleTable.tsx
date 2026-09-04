import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, type ReactNode } from "react";
import { InlineEdit } from "./InlineEdit";
import { cellHasOverlap } from "./overlap";
import type { AppData, Employee, Group, ScheduleEntry, ShiftType } from "./types";
import { WEEKDAY_LABELS, formatDayHeader, weekDays, type WeekRef } from "./week";

function contrast(hex: string): string {
  const c = hex.replace("#", "");
  if (c.length < 6) return "#1f1f1d";
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return l > 0.55 ? "#1f1f1d" : "#fafaf8";
}

function shiftLabel(entry: ScheduleEntry, types: ShiftType[]): string {
  if (entry.customStart && entry.customEnd) {
    return `${entry.customStart}-${entry.customEnd}`;
  }
  return types.find((t) => t.id === entry.shiftTypeId)?.label ?? "";
}

function shiftColor(entry: ScheduleEntry, types: ShiftType[]): string {
  return types.find((t) => t.id === entry.shiftTypeId)?.color ?? "#fff";
}

function HoverX({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="no-export absolute right-1 top-1 hidden h-4 w-4 items-center justify-center rounded text-[11px] leading-none text-ink-faint transition-colors hover:bg-black/10 hover:text-ink group-hover:flex"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label="Xóa"
    >
      ×
    </button>
  );
}

export function PaletteShift({ shift }: { shift: ShiftType }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette:${shift.id}`,
    data: { kind: "palette", shiftTypeId: shift.id },
  });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex cursor-grab items-center gap-2 rounded-md px-2.5 py-1.5 transition-colors hover:bg-canvas ${
        isDragging ? "opacity-40" : ""
      }`}
      {...listeners}
      {...attributes}
    >
      <span
        className="inline-block h-3.5 w-3.5 shrink-0 rounded-sm border border-black/10"
        style={{ background: shift.color }}
      />
      <span className="flex-1 text-[13px] tabular-nums text-ink">
        {shift.label}
      </span>
    </div>
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
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `entry:${entry.id}`,
    data: { kind: "entry", entryId: entry.id },
  });
  const color = shiftColor(entry, types);
  const style = {
    transform: CSS.Translate.toString(transform),
    background: color,
    color: contrast(color),
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group shift-line cursor-grab transition-[opacity,filter] hover:brightness-[0.97] ${
        isDragging ? "opacity-40" : ""
      }`}
      {...listeners}
      {...attributes}
    >
      <span>{shiftLabel(entry, types)}</span>
      <HoverX onClick={onRemove} />
    </div>
  );
}

function Cell({
  employeeId,
  day,
  entries,
  types,
  onRemoveEntry,
}: {
  employeeId: string;
  day: number;
  entries: ScheduleEntry[];
  types: ShiftType[];
  onRemoveEntry: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell:${employeeId}:${day}`,
    data: { employeeId, dayOfWeek: day },
  });
  const conflict = cellHasOverlap(entries, types);
  return (
    <td
      ref={setNodeRef}
      className="h-10 min-h-[40px] p-0 align-top transition-colors"
      style={{
        background: isOver ? "#eef2ea" : "#fff",
        boxShadow: conflict ? "inset 0 0 0 1.5px #d48a8a" : undefined,
      }}
    >
      {entries.length === 0 ? (
        <div className="flex h-10 items-center justify-center">
          {isOver ? (
            <span className="no-export text-[11px] text-ink-faint">Thả ca vào đây</span>
          ) : null}
        </div>
      ) : (
        entries.map((entry) => (
          <EntryChip
            key={entry.id}
            entry={entry}
            types={types}
            onRemove={() => onRemoveEntry(entry.id)}
          />
        ))
      )}
    </td>
  );
}

type Props = {
  data: AppData;
  week: WeekRef;
  exporting: boolean;
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

export function ScheduleTable({
  data,
  week,
  exporting,
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
}: Props) {
  const days = useMemo(() => weekDays(week), [week]);
  const groups = [...data.groups].sort((a, b) => a.sortOrder - b.sortOrder);

  function employeesOf(group: Group): Employee[] {
    return data.employees
      .filter((e) => e.groupId === group.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  function cellEntries(employeeId: string, day: number): ScheduleEntry[] {
    const key = `${week.year}-${week.month}-${week.week}`;
    return (data.schedules[key]?.entries ?? [])
      .filter((e) => e.employeeId === employeeId && e.dayOfWeek === day)
      .sort((a, b) => a.sortOrderInCell - b.sortOrderInCell);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
    <table className={`sheet ${exporting ? "exporting" : ""}`} id="schedule-sheet">
      <colgroup>
        <col style={{ width: 160 }} />
        {WEEKDAY_LABELS.map((d) => (
          <col key={d} />
        ))}
      </colgroup>
      <thead>
        <tr>
          <th className="corner">Nhân viên</th>
          {days.map((date, i) => (
            <th
              key={WEEKDAY_LABELS[i]}
              className={`day-head ${i === 6 ? "text-ink-muted" : ""}`}
            >
              <div className="text-[12px] font-semibold tracking-wide">
                {WEEKDAY_LABELS[i]}
              </div>
              <div className="mt-0.5 text-[11px] font-normal text-ink-muted">
                {formatDayHeader(date)}
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {groups.map((group) => (
          <GroupBlock
            key={group.id}
            group={group}
            employees={employeesOf(group)}
            adding={addingEmployeeGroupId === group.id}
            colSpan={8}
            cellEntries={cellEntries}
            types={data.shiftTypes}
            onRenameGroup={onRenameGroup}
            onDeleteGroup={onDeleteGroup}
            onRenameEmployee={onRenameEmployee}
            onDeleteEmployee={onDeleteEmployee}
            onStartAddEmployee={onStartAddEmployee}
            onCommitAddEmployee={onCommitAddEmployee}
            onCancelAddEmployee={onCancelAddEmployee}
            onRemoveEntry={onRemoveEntry}
          />
        ))}
        {groups.length === 0 && (
          <tr className="no-export">
            <td colSpan={8} className="bg-white px-4 py-10 text-center text-[13px] text-ink-faint">
              Chưa có nhóm. Thêm nhóm để bắt đầu xếp lịch.
            </td>
          </tr>
        )}
        <tr className="no-export">
          <td colSpan={8} className="bg-white p-1.5">
            {addingGroup ? (
              <input
                autoFocus
                className="ui-input w-full"
                placeholder="Tên nhóm"
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v) onCommitAddGroup(v);
                  else onCancelAddGroup();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const v = e.currentTarget.value.trim();
                    if (v) onCommitAddGroup(v);
                    else onCancelAddGroup();
                  }
                  if (e.key === "Escape") onCancelAddGroup();
                }}
              />
            ) : (
              <button
                type="button"
                className="ui-btn-ghost"
                onClick={onStartAddGroup}
              >
                + Nhóm mới
              </button>
            )}
          </td>
        </tr>
      </tbody>
    </table>
    </div>
  );
}

const GROUP_TINTS = ["#f3ebd4", "#dde8dc", "#e4dfee", "#efe4d8"];

function GroupBlock({
  group,
  employees,
  adding,
  colSpan,
  cellEntries,
  types,
  onRenameGroup,
  onDeleteGroup,
  onRenameEmployee,
  onDeleteEmployee,
  onStartAddEmployee,
  onCommitAddEmployee,
  onCancelAddEmployee,
  onRemoveEntry,
}: {
  group: Group;
  employees: Employee[];
  adding: boolean;
  colSpan: number;
  cellEntries: (employeeId: string, day: number) => ScheduleEntry[];
  types: ShiftType[];
  onRenameGroup: (id: string, name: string) => void;
  onDeleteGroup: (id: string) => void;
  onRenameEmployee: (id: string, name: string) => void;
  onDeleteEmployee: (id: string) => void;
  onStartAddEmployee: (groupId: string) => void;
  onCommitAddEmployee: (groupId: string, name: string) => void;
  onCancelAddEmployee: () => void;
  onRemoveEntry: (id: string) => void;
}) {
  return (
    <>
      <tr className="group-row">
        <td
          colSpan={colSpan}
          className="group relative"
          style={{ background: GROUP_TINTS[group.sortOrder % GROUP_TINTS.length] }}
        >
          <InlineEdit
            value={group.name}
            onCommit={(name) => onRenameGroup(group.id, name)}
          />
          <HoverX onClick={() => onDeleteGroup(group.id)} />
        </td>
      </tr>
      {employees.length === 0 && (
        <tr className="no-export">
          <td className="px-3 py-2 text-[12px] text-ink-faint" colSpan={colSpan}>
            Chưa có nhân viên trong nhóm này
          </td>
        </tr>
      )}
      {employees.map((emp) => (
        <tr key={emp.id}>
          <td className="name-cell group relative">
            <InlineEdit
              value={emp.name}
              onCommit={(name) => onRenameEmployee(emp.id, name)}
            />
            <HoverX onClick={() => onDeleteEmployee(emp.id)} />
          </td>
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <Cell
              key={day}
              employeeId={emp.id}
              day={day}
              entries={cellEntries(emp.id, day)}
              types={types}
              onRemoveEntry={onRemoveEntry}
            />
          ))}
        </tr>
      ))}
      <tr className="no-export">
        <td className="p-1">
          {adding ? (
            <input
              autoFocus
              className="ui-input w-full"
              placeholder="Tên nhân viên"
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v) onCommitAddEmployee(group.id, v);
                else onCancelAddEmployee();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = e.currentTarget.value.trim();
                  if (v) onCommitAddEmployee(group.id, v);
                  else onCancelAddEmployee();
                }
                if (e.key === "Escape") onCancelAddEmployee();
              }}
            />
          ) : (
            <button
              type="button"
              className="ui-btn-ghost h-6 px-1.5 text-[12px]"
              onClick={() => onStartAddEmployee(group.id)}
            >
              + Nhân viên
            </button>
          )}
        </td>
        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
            <td key={d} className="bg-white" />
        ))}
      </tr>
    </>
  );
}

export function SheetDnd({
  children,
  onDragStart,
  onDragEnd,
  overlay,
}: {
  children: ReactNode;
  onDragStart: (e: DragStartEvent) => void;
  onDragEnd: (e: DragEndEvent) => void;
  overlay: ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {children}
      <DragOverlay dropAnimation={null}>{overlay}</DragOverlay>
    </DndContext>
  );
}
