import { useEffect, useRef } from "react";
import { Icon } from "./Icon";
import type { Employee } from "./types";

export function EmployeeDeleteDialog({
  employee,
  areaName,
  customRoleName,
  colorClass,
  shiftCount,
  weekCount,
  onConfirm,
  onClose,
}: {
  employee: Employee;
  areaName: string;
  customRoleName?: string;
  colorClass: string;
  shiftCount: number;
  weekCount: number;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      className="employee-delete-dialog"
      aria-labelledby="employee-delete-title"
      aria-describedby="employee-delete-description"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="employee-delete-heading">
        <span className="employee-delete-icon"><Icon name="trash" size={19} /></span>
        <div>
          <h2 id="employee-delete-title">Xóa nhân viên?</h2>
          <p>Kiểm tra thông tin trước khi xác nhận</p>
        </div>
      </div>

      <div className="employee-delete-person">
        <span className={`employee-delete-person-dot ${colorClass}`} />
        <span>
          <strong>{employee.name}</strong>
          <small>
            {employee.isExecutiveChef
              ? "Tổng bếp trưởng"
              : employee.isHeadChef
                ? "Bếp trưởng"
              : employee.isManager
                ? "Quản lý"
                : employee.isFullTime
                  ? "Full-time"
                  : customRoleName ?? "Part-time"}
            {areaName && <> · {areaName}</>}
          </small>
        </span>
      </div>

      <p id="employee-delete-description" className="employee-delete-description">
        {shiftCount > 0 ? (
          <>Nhân viên này đang có <strong>{shiftCount} ca</strong> trong <strong>{weekCount} tuần</strong>. Các ca đó cũng sẽ bị xóa.</>
        ) : (
          <>Nhân viên này chưa có ca làm nào trong lịch.</>
        )}
      </p>
      <p className="employee-delete-warning">Thao tác này không thể hoàn tác.</p>

      <div className="employee-delete-actions">
        <button type="button" className="ui-btn" onClick={onClose} autoFocus>Hủy</button>
        <button type="button" className="employee-delete-confirm" onClick={onConfirm}>
          <Icon name="trash" size={14} />
          Xác nhận xóa
        </button>
      </div>
    </dialog>
  );
}
