import { useState } from "react";
import { Icon } from "./Icon";
import { PaletteShift } from "./ScheduleTable";
import { formatShiftLabel, semanticShiftColor, shiftStyle } from "./shiftStyle";
import type { ShiftType } from "./types";

type Form = {
  id?: string;
  start: string;
  end: string;
  start2: string;
  end2: string;
};
const emptyForm = (): Form => ({
  start: "10:00",
  end: "14:00",
  start2: "",
  end2: "",
});
const normalizeClock = (clock = "") => {
  const match = /^(\d{1,2})(?:[:h](\d{2})?)?$/.exec(clock.trim());
  return match ? `${match[1].padStart(2, "0")}:${match[2] || "00"}` : clock;
};
function formFromShift(shift: ShiftType): Form {
  const [first, second = "-"] = shift.label.split("/");
  const [start, end] = first.split("-");
  const [start2, end2] = second.split("-");
  return {
    id: shift.id,
    start: normalizeClock(start),
    end: normalizeClock(end),
    start2: start2 ? normalizeClock(start2) : "",
    end2: end2 ? normalizeClock(end2) : "",
  };
}

type Props = {
  open: boolean;
  onToggle: () => void;
  shifts: ShiftType[];
  selectedShiftId: string | null;
  onSelect: (id: string) => void;
  onSave: (shift: Omit<ShiftType, "id"> & { id?: string }) => string | null;
  onDelete: (id: string) => void;
  weeklyShiftCount: number;
  scheduledEmployeeCount: number;
  totalEmployees: number;
};

export function ShiftSidebar({
  open,
  onToggle,
  shifts,
  selectedShiftId,
  onSelect,
  onSave,
  onDelete,
  weeklyShiftCount,
  scheduledEmployeeCount,
  totalEmployees,
}: Props) {
  const [form, setForm] = useState<Form | null>(null);
  const [formError, setFormError] = useState("");
  const [splitShift, setSplitShift] = useState(false);
  const previewLabel = form
    ? `${form.start || "--:--"}-${form.end || "--:--"}${splitShift ? `/${form.start2 || "--:--"}-${form.end2 || "--:--"}` : ""}`
    : "";
  function editShift(shift?: ShiftType) {
    setForm(shift ? formFromShift(shift) : emptyForm());
    setSplitShift(Boolean(shift?.label.includes("/")));
    setFormError("");
  }
  if (!open) return null;

  return (
    <aside className="shift-sidebar" aria-label="Danh sách ca làm">
      <section className="shift-panel">
        <div className="panel-heading">
          <div className="panel-title">
            <span className="panel-icon">
              <Icon name="clock" size={18} />
            </span>
            <h2>Ca làm việc</h2>
            <span className="count-badge">{shifts.length}</span>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onToggle}
            aria-label="Ẩn danh sách ca"
            title="Ẩn danh sách ca"
          >
            <Icon name="panel" size={16} />
          </button>
        </div>
        <p className="panel-description">Chọn ca hoặc kéo vào lịch.</p>
        <div className="shift-list">
          {!shifts.length && (
            <div className="empty-shifts">
              <Icon name="clock" size={24} />
              <p>Thêm ca làm đầu tiên để bắt đầu xếp lịch.</p>
            </div>
          )}
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className={`shift-item ${form?.id === shift.id ? "is-editing" : ""}`}
            >
              <PaletteShift
                shift={shift}
                selected={selectedShiftId === shift.id}
                onSelect={() => onSelect(shift.id)}
              />
              <div className="shift-item-actions">
                <button
                  type="button"
                  onClick={() => editShift(shift)}
                  aria-label={`Sửa ca ${shift.label}`}
                  title="Sửa ca"
                >
                  <Icon name="edit" size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(shift.id);
                    if (form?.id === shift.id) setForm(null);
                  }}
                  aria-label={`Xóa loại ca ${shift.label}`}
                  title="Xóa loại ca"
                >
                  <Icon name="close" size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
        {form ? (
          <form
            className="shift-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (
                form.end <= form.start ||
                (splitShift &&
                  (!form.start2 ||
                    !form.end2 ||
                    form.end2 <= form.start2 ||
                    form.start2 < form.end))
              ) {
                setFormError(
                  "Giờ kết thúc cần sau giờ bắt đầu; hai khoảng giờ không được trùng nhau.",
                );
                return;
              }
              const issue = onSave({
                id: form.id,
                label: `${form.start}-${form.end}${splitShift ? `/${form.start2}-${form.end2}` : ""}`,
                color: semanticShiftColor(`${form.start}-${form.end}${splitShift ? `/${form.start2}-${form.end2}` : ""}`),
                isPreset: false,
              });
              if (issue) {
                setFormError(issue);
                return;
              }
              setForm(null);
            }}
          >
            <div className="form-heading">
              <h3>{form.id ? "Chỉnh sửa ca" : "Thêm ca mới"}</h3>
              <button
                type="button"
                className="icon-button"
                onClick={() => setForm(null)}
                aria-label="Đóng chỉnh sửa ca"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="time-fields">
              <label>
                Bắt đầu
                <input
                  type="time"
                  required
                  className="ui-input"
                  value={form.start}
                  onChange={(e) => setForm({ ...form, start: e.target.value })}
                />
              </label>
              <span>—</span>
              <label>
                Kết thúc
                <input
                  type="time"
                  required
                  className="ui-input"
                  value={form.end}
                  onChange={(e) => setForm({ ...form, end: e.target.value })}
                />
              </label>
            </div>
            <label className="split-toggle">
              <input
                type="checkbox"
                checked={splitShift}
                onChange={(e) => setSplitShift(e.target.checked)}
              />
              Thêm khoảng giờ thứ hai
            </label>
            {splitShift && (
              <div className="time-fields">
                <label>
                  Bắt đầu lần 2
                  <input
                    type="time"
                    required
                    className="ui-input"
                    value={form.start2}
                    onChange={(e) =>
                      setForm({ ...form, start2: e.target.value })
                    }
                  />
                </label>
                <span>—</span>
                <label>
                  Kết thúc lần 2
                  <input
                    type="time"
                    required
                    className="ui-input"
                    value={form.end2}
                    onChange={(e) => setForm({ ...form, end2: e.target.value })}
                  />
                </label>
              </div>
            )}
            <div className="shift-preview-section">
              <span className="field-label">Xem trước trên lịch</span>
              <div
                className="shift-preview-card"
                style={shiftStyle(semanticShiftColor(previewLabel))}
              >
                <span className="shift-color-dot" />
                <span>
                  {previewLabel.split("/").map((part, index) => (
                    <span key={index}>{formatShiftLabel(part)}</span>
                  ))}
                </span>
                <Icon name="clock" size={14} />
              </div>
            </div>
            <p className="semantic-color-note">Màu được áp dụng tự động theo giờ ca: sáng, tối, ca ghép hoặc cả ngày.</p>
            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}
            <div className="form-buttons">
              <button
                type="button"
                className="ui-btn"
                onClick={() => setForm(null)}
              >
                Hủy
              </button>
              <button type="submit" className="ui-btn-primary">
                <Icon name="check" size={15} />
                Lưu ca
              </button>
            </div>
          </form>
        ) : (
          <div className="add-shift-wrap">
            <button
              type="button"
              className="add-shift-button"
              onClick={() => editShift()}
            >
              <Icon name="plus" size={16} />
              Tạo ca mới
            </button>
          </div>
        )}
        <section className="week-widget" aria-label="Tổng quan tuần">
          <div className="week-widget-heading"><Icon name="users" size={15} /><span>Tổng quan tuần</span></div>
          <div className="week-widget-stats">
            <div><strong>{weeklyShiftCount}</strong><span>ca đã xếp</span></div>
            <div><strong>{scheduledEmployeeCount}/{totalEmployees}</strong><span>nhân viên có ca</span></div>
          </div>
        </section>
      </section>
    </aside>
  );
}
