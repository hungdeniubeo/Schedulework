import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import type { CustomRole, Employee } from "./types";

export type EmployeeDetails = Pick<Employee, "name" | "isHeadChef" | "isExecutiveChef" | "isManager" | "isFullTime" | "customRoleId" | "isNew">;
type EmployeeRole = "manager" | "member" | "full-time" | "chef" | "executive-chef" | `custom:${string}`;

export function EmployeeEditor({ employee, currentChef, customRoles, onAddCustomRole, onSave, onDelete, onClose }: {
  employee?: Employee;
  currentChef?: Employee;
  customRoles: CustomRole[];
  onAddCustomRole: (name: string) => string;
  onSave: (details: EmployeeDetails) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(employee?.name ?? "");
  const [role, setRole] = useState<EmployeeRole>(() => {
    if (employee?.isExecutiveChef) return "executive-chef";
    if (employee?.isHeadChef) return "chef";
    if (employee?.isManager) return "manager";
    if (employee?.isFullTime) return "full-time";
    if (employee?.customRoleId) return `custom:${employee.customRoleId}`;
    return "member";
  });
  const [isNew, setNew] = useState(employee?.isNew ?? !employee);
  const [addingCustomRole, setAddingCustomRole] = useState(false);
  const [customRoleName, setCustomRoleName] = useState("");
  const isHeadChef = role === "chef";

  function saveCustomRole() {
    const normalizedName = customRoleName.trim().replace(/\s+/g, " ");
    if (!normalizedName) return;
    const existing = customRoles.find(
      (item) => item.name.toLocaleLowerCase("vi") === normalizedName.toLocaleLowerCase("vi"),
    );
    const id = existing?.id ?? onAddCustomRole(normalizedName);
    setRole(`custom:${id}`);
    setCustomRoleName("");
    setAddingCustomRole(false);
  }

  useEffect(() => { dialog.current?.showModal(); }, []);
  return (
    <dialog ref={dialog} className="employee-dialog" aria-labelledby="employee-editor-title" onCancel={onClose}>
      <form onSubmit={(event) => {
        event.preventDefault();
        if (name.trim()) onSave({
          name: name.trim(),
          isHeadChef,
          isExecutiveChef: role === "executive-chef",
          isManager: role === "manager",
          isFullTime: role === "full-time",
          customRoleId: role.startsWith("custom:") ? role.slice(7) : undefined,
          isNew: isHeadChef ? false : isNew,
        });
      }}>
        <div className="employee-dialog-heading">
          <div><h2 id="employee-editor-title">{employee ? "Chỉnh sửa nhân viên" : "Thêm nhân viên"}</h2><p>Thông tin hiển thị trên lịch làm việc</p></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Đóng thông tin nhân viên"><Icon name="close" /></button>
        </div>
        <label className="employee-field">Họ và tên<input autoFocus required className="ui-input" value={name} onChange={event => setName(event.target.value)} placeholder="Nhập họ và tên đầy đủ" /></label>
        <label className="employee-field">Vai trò<select value={role} onChange={event => {
          if (event.target.value === "add-title") {
            setAddingCustomRole(true);
            return;
          }
          const nextRole = event.target.value as EmployeeRole;
          setRole(nextRole);
          if (nextRole === "chef") setNew(false);
        }}>
          <option value="manager">Quản lý</option>
          <option value="member">Part-time</option>
          <option value="full-time">Full-time</option>
          <option value="chef">Bếp trưởng</option>
          <option value="executive-chef">Tổng bếp trưởng</option>
          {customRoles.map((item) => <option key={item.id} value={`custom:${item.id}`}>{item.name}</option>)}
          <option disabled>──────────</option>
          <option value="add-title">＋ Thêm chức danh...</option>
        </select></label>
        {addingCustomRole && (
          <div className="employee-custom-role">
            <input
              autoFocus
              className="ui-input"
              value={customRoleName}
              onChange={(event) => setCustomRoleName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  saveCustomRole();
                }
              }}
              placeholder="Tên chức danh mới"
              aria-label="Tên chức danh mới"
            />
            <button type="button" className="ui-btn" disabled={!customRoleName.trim()} onClick={saveCustomRole}>Thêm</button>
            <button type="button" className="icon-button" onClick={() => { setAddingCustomRole(false); setCustomRoleName(""); }} aria-label="Hủy thêm chức danh"><Icon name="close" size={13} /></button>
          </div>
        )}
        {isHeadChef && currentChef && currentChef.id !== employee?.id && <p className="employee-role-note">Vai trò Bếp trưởng sẽ được chuyển từ {currentChef.name} sang nhân viên này khi lưu.</p>}
        {!isHeadChef && <label className="employee-new-option"><input type="checkbox" checked={isNew} onChange={event => setNew(event.target.checked)} /><span>Người mới<small>Nền tên xanh nhạt và nhãn NEW trên lịch</small></span></label>}
        <div className="employee-dialog-actions">
          {onDelete && <button type="button" className="employee-delete" onClick={onDelete}><Icon name="trash" size={13} />Xóa nhân viên</button>}
          <button type="button" className="ui-btn" onClick={onClose}>Hủy</button>
          <button type="submit" className="ui-btn-primary">{employee ? "Lưu thay đổi" : "Thêm nhân viên"}</button>
        </div>
      </form>
    </dialog>
  );
}
