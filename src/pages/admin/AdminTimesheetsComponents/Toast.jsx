import React from "react";
import { X } from "lucide-react";
function Toast({
  msg,
  type,
  onClose
}) {
  if (!msg) return null;
  const color = type === "error" ? "bg-red-50 border-red-300 text-red-700" : "bg-emerald-50 border-emerald-300 text-emerald-700";
  return <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-semibold ${color}`}>
      {msg}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
    </div>;
}
export { Toast };
