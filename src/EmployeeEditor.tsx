import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import type { Employee } from "./types";

export type EmployeeDetails = Pick<Employee, "name" | "isHeadChef" | "isNew">;

export function EmployeeEditor({ employee, currentChef, onSave, onDelete, onClose }: {
  employee?: Employee;
  currentChef?: Employee;
  onSave: (details: EmployeeDetails) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(employee?.name ?? "");
  const [isHeadChef, setHeadChef] = useState(employee?.isHeadChef ?? false);
  const [isNew, setNew] = useState(employee?.isNew ?? !employee);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return (
    <dialog ref={dialog} className="employee-dialog" aria-labelledby="employee-editor-title" onCancel={onClose}>
      <form onSubmit={(event) => {
        event.preventDefault();
        if (name.trim()) onSave({ name: name.trim(), isHeadChef, isNew: isHeadChef ? false : isNew });
      }}>
        <div className="employee-dialog-heading">
          <div><h2 id="employee-editor-title">{employee ? "Chỉnh sửa nhân viên" : "Thêm nhân viên"}</h2><p>Thông tin hiển thị trên lịch làm việc</p></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Đóng thông tin nhân viên"><Icon name="close" /></button>
        </div>
        <label className="employee-field">Họ và tên<input autoFocus required className="ui-input" value={name} onChange={event => setName(event.target.value)} placeholder="Nhập họ và tên đầy đủ" /></label>
        <label className="employee-field">Vai trò<select value={isHeadChef ? "chef" : "member"} onChange={event => {
          const chef = event.target.value === "chef";
          setHeadChef(chef);
          if (chef) setNew(false);
        }}><option value="member">Nhân viên</option><option value="chef">Bếp trưởng</option></select></label>
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
