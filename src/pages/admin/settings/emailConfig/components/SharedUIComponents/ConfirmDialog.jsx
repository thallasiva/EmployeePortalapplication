import React from "react";
import { Btn } from "./Btn";
function ConfirmDialog({
  open = true,
  title,
  message,
  onConfirm,
  onCancel,
  danger
}) {
  if (!open) return null;
  return <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[400px] shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[#f1f5f9]">
          <p className="text-[16px] font-bold text-[#e87500]">{title}</p>
        </div>
        <div className="px-6 py-5">
          <p className="text-[13px] text-[#64748b]">{message}</p>
        </div>
        <div className="px-6 pb-5 flex gap-3 justify-end">
          <Btn variant="outline" onClick={onCancel}>Cancel</Btn>
          <Btn variant={danger ? "danger" : "primary"} onClick={onConfirm}>{danger ? "Delete" : "Confirm"}</Btn>
        </div>
      </div>
    </div>;
}
export { ConfirmDialog };
