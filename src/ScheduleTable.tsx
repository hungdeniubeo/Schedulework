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
  if (c.length < 6) return "#000";
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return l > 0.55 ? "#000" : "#fff";
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
      className="no-export absolute right-0.5 top-0.5 hidden h-4 w-4 items-center justify-center text-[11px] leading-none text-black/40 hover:text-black group-hover:flex"
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
      className={`group relative flex cursor-grab items-center gap-2 border border-transparent px-1 py-0.5 hover:bg-[#f3f3f3] ${isDragging ? "opacity-40" : ""}`}
      {...listeners}
      {...attributes}
    >
      <span
        className="inline-block h-3.5 w-3.5 shrink-0 border border-[#666]"
        style={{ background: shift.color }}
      />
      <span className="flex-1 text-[13px]">{shift.label}</span>
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
      className="group shift-line cursor-grab"
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
      className="h-7 min-h-[28px] p-0 align-top"
      style={{
        background: isOver ? "#deebf7" : "#fff",
        outline: conflict ? "2px solid #c00000" : undefined,
        outlineOffset: -2,
      }}
    >
      {entries.map((entry) => (
        <EntryChip
          key={entry.id}
          entry={entry}
          types={types}
          onRemove={() => onRemoveEntry(entry.id)}
        />
      ))}
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
    <table className={`sheet ${exporting ? "exporting" : ""}`} id="schedule-sheet">
      <colgroup>
        <col style={{ width: 140 }} />
        {WEEKDAY_LABELS.map((d) => (
          <col key={d} />
        ))}
      </colgroup>
      <thead>
        <tr>
          <th className="corner">Nhân viên</th>
          {days.map((date, i) => (
            <th key={WEEKDAY_LABELS[i]} className="day-head">
              <div>{WEEKDAY_LABELS[i]}</div>
              <div className="text-[11px] font-normal">{formatDayHeader(date)}</div>
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
        <tr className="no-export">
          <td colSpan={8} className="bg-white p-1">
            {addingGroup ? (
              <input
                autoFocus
                className="w-full border border-[#999] px-1 py-0.5 outline-none"
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
                className="px-1 text-[#666] hover:text-black"
                onClick={onStartAddGroup}
              >
                + Nhóm mới
              </button>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

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
        <td colSpan={colSpan} className="group relative">
          <InlineEdit
            value={group.name}
            onCommit={(name) => onRenameGroup(group.id, name)}
          />
          <HoverX onClick={() => onDeleteGroup(group.id)} />
        </td>
      </tr>
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
        <td className="p-0.5">
          {adding ? (
            <input
              autoFocus
              className="w-full border-0 px-1 py-0.5 outline-none"
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
              className="px-1 text-[#888] hover:text-black"
              onClick={() => onStartAddEmployee(group.id)}
            >
              +
            </button>
          )}
        </td>
        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
          <td key={d} />
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
