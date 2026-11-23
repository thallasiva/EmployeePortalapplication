import React from "react";
import { X } from "lucide-react";
/* ── Brand token ── */

function Toast({
  message,
  type = "success",
  onClose
}) {
  if (!message) return null;
  const cfg = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-700",
    error: "bg-red-50 border-red-200 text-red-700",
    info: "bg-[#fff8f0] border-[#fed7aa] text-[#e87500]"
  };
  return <div className={`fixed top-5 right-5 z-[999] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-[13px] font-semibold ${cfg[type]}`}>
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
    </div>;
}
export { Toast };
