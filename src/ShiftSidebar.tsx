import { useState } from "react";
import { SHIFT_COLORS } from "./defaultData";
import { PaletteShift } from "./ScheduleTable";
import type { ShiftType } from "./types";

type Form = {
  id?: string;
  start: string;
  end: string;
  start2: string;
  end2: string;
  color: string;
};

const emptyForm = (): Form => ({
  start: "10:00",
  end: "14:00",
  start2: "",
  end2: "",
  color: SHIFT_COLORS[0],
});

function labelFrom(form: Form): string {
  const a = `${form.start}-${form.end}`;
  if (form.start2 && form.end2) return `${a}/${form.start2}-${form.end2}`;
  return a;
}

function formFromShift(s: ShiftType): Form {
  const parts = s.label.split("/");
  const [start, end] = (parts[0] ?? "10:00-14:00").split("-");
  const [start2, end2] = (parts[1] ?? "-").split("-");
  return {
    id: s.id,
    start: start?.trim() || "10:00",
    end: end?.trim() || "14:00",
    start2: start2?.trim() || "",
    end2: end2?.trim() || "",
    color: s.color,
  };
}

type Props = {
  open: boolean;
  onToggle: () => void;
  shifts: ShiftType[];
  onSave: (shift: Omit<ShiftType, "id"> & { id?: string }) => void;
  onDelete: (id: string) => void;
};

export function ShiftSidebar({ open, onToggle, shifts, onSave, onDelete }: Props) {
  const [form, setForm] = useState<Form | null>(null);

  return (
    <div className="relative flex h-full shrink-0">
      <button
        type="button"
        className="z-10 h-full w-5 border-l border-line bg-panel text-[11px] text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
        onClick={onToggle}
        title={open ? "Ẩn loại ca" : "Hiện loại ca"}
      >
        {open ? "›" : "‹"}
      </button>
      {open && (
        <aside className="flex h-full w-60 flex-col border-l border-line bg-white">
          <div className="border-b border-line bg-panel px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
            Loại ca
          </div>
          <div className="flex-1 overflow-auto py-1.5">
            {shifts.length === 0 && (
              <div className="px-3 py-8 text-center text-[12px] text-ink-faint">
                Chưa có loại ca. Thêm ca để kéo vào lưới.
              </div>
            )}
            {shifts.map((shift) => (
              <div
                key={shift.id}
                className={`group relative ${form?.id === shift.id ? "bg-canvas" : ""}`}
              >
                <div
                  onDoubleClick={() => setForm(formFromShift(shift))}
                  onClick={() => setForm(formFromShift(shift))}
                >
                  <PaletteShift shift={shift} />
                </div>
                <button
                  type="button"
                  className="absolute right-2 top-1.5 hidden h-5 w-5 rounded text-[13px] text-ink-faint transition-colors hover:bg-black/10 hover:text-ink group-hover:block"
                  onClick={() => onDelete(shift.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          {form ? (
            <form
              className="space-y-1.5 border-t border-line bg-panel p-3 text-[12px]"
              onSubmit={(e) => {
                e.preventDefault();
                onSave({
                  id: form.id,
                  label: labelFrom(form),
                  color: form.color,
                  isPreset: false,
                });
                setForm(null);
              }}
            >
              <div className="mb-1 text-[12px] font-semibold text-ink">
                {form.id ? "Sửa ca" : "Ca mới"}
              </div>
              <label className="ui-label">
                Từ
                <input
                  className="ui-input flex-1"
                  value={form.start}
                  onChange={(e) => setForm({ ...form, start: e.target.value })}
                />
              </label>
              <label className="ui-label">
                Đến
                <input
                  className="ui-input flex-1"
                  value={form.end}
                  onChange={(e) => setForm({ ...form, end: e.target.value })}
                />
              </label>
              <div className="pt-1 text-[11px] text-ink-faint">Khoảng 2 (tuỳ chọn, nối /)</div>
              <label className="ui-label">
                Từ
                <input
                  className="ui-input flex-1"
                  value={form.start2}
                  onChange={(e) => setForm({ ...form, start2: e.target.value })}
                />
              </label>
              <label className="ui-label">
                Đến
                <input
                  className="ui-input flex-1"
                  value={form.end2}
                  onChange={(e) => setForm({ ...form, end2: e.target.value })}
                />
              </label>
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {SHIFT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="h-6 w-full rounded-sm border border-black/10"
                    style={{
                      background: c,
                      boxShadow: form.color === c ? "inset 0 0 0 2px #1f1f1d" : undefined,
                    }}
                    onClick={() => setForm({ ...form, color: c })}
                  />
                ))}
              </div>
              <div className="flex gap-1.5 pt-1">
                <button type="submit" className="ui-btn-primary flex-1">
                  Lưu
                </button>
                <button
                  type="button"
                  className="ui-btn flex-1"
                  onClick={() => setForm(null)}
                >
                  Huỷ
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              className="ui-btn-ghost h-10 justify-start rounded-none border-t border-line px-3"
              onClick={() => setForm(emptyForm())}
            >
              + Ca mới
            </button>
          )}
        </aside>
      )}
    </div>
  );
}
