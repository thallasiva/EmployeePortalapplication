import React from "react";
import { ChevronDown, X } from "lucide-react";

/* ── Brand token ── */
export const BRAND = "#f18200";

/* ── Status badge ── */
export function Badge({ children, color = "green" }) {
  const map = {
    green:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    red:    "bg-red-50 text-red-600 border-red-200",
    amber:  "bg-amber-50 text-amber-700 border-amber-200",
    blue:   "bg-blue-50 text-blue-700 border-blue-200",
    gray:   "bg-slate-100 text-slate-500 border-slate-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    orange: "bg-[#fff8f0] text-[#f18200] border-[#fed7aa]",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${map[color] || map.gray}`}>
      {children}
    </span>
  );
}

export function Dot({ color = "green" }) {
  const map = { green:"bg-emerald-500", red:"bg-red-500", amber:"bg-amber-400", blue:"bg-blue-500", gray:"bg-slate-400", orange:"bg-[#f18200]" };
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${map[color] || "bg-slate-400"}`} />;
}

/* ── Toggle switch ── */
export function Toggle({ on, onToggle }) {
  return (
    <button onClick={onToggle}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${on ? "bg-[#f18200]" : "bg-[#cbd5e1]"}`}>
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-1"}`} />
    </button>
  );
}

/* ── Buttons ── */
export function Btn({ children, variant = "primary", size = "md", onClick, disabled, icon, type = "button" }) {
  const sizes = { sm:"h-[32px] px-3 text-[12px]", md:"h-[38px] px-4 text-[13px]", lg:"h-[42px] px-5 text-[14px]" };
  const variants = {
    primary: "bg-[#f18200] hover:bg-[#e07000] text-white",
    outline: "border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] text-[#374151]",
    ghost:   "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b]",
    danger:  "bg-[#ef4444] hover:bg-[#dc2626] text-white",
    success: "bg-[#10b981] hover:bg-[#059669] text-white",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-2 font-semibold rounded-lg transition-all ${sizes[size]} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
      {icon}{children}
    </button>
  );
}

/* ── Form input ── */
export function Input({ label, required, error, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[12px] font-semibold text-[#475569]">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        className={`h-[40px] border rounded-lg px-3 text-[13px] text-[#1e293b] bg-white outline-none transition-all
          ${error ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100" : "border-[#e2e8f0] focus:border-[#f18200] focus:ring-2 focus:ring-[#f18200]/10"}`}
        {...props}
      />
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

/* ── Select ── */
export function Select({ label, required, children, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[12px] font-semibold text-[#475569]">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <div className="relative">
        <select
          className="w-full h-[40px] border border-[#e2e8f0] rounded-lg px-3 pr-8 text-[13px] text-[#1e293b] bg-white outline-none focus:border-[#f18200] focus:ring-2 focus:ring-[#f18200]/10 appearance-none transition-all"
          {...props}
        >
          {children}
        </select>
        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
      </div>
    </div>
  );
}

/* ── Section card ── */
export function SectionCard({ title, subtitle, children, action, noPad }) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
      {(title || action) && (
        <div className="px-5 py-4 border-b border-[#e8eef5] flex items-center justify-between">
          <div>
            <p className="text-[14px] font-bold text-[#1e293b]">{title}</p>
            {subtitle && <p className="text-[12px] text-[#94a3b8] mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={noPad ? "" : "p-5"}>{children}</div>
    </div>
  );
}

/* ── Confirm dialog ── */
export function ConfirmDialog({ open = true, title, message, onConfirm, onCancel, danger }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[400px] shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[#f1f5f9]">
          <p className="text-[16px] font-bold text-[#1e293b]">{title}</p>
        </div>
        <div className="px-6 py-5">
          <p className="text-[13px] text-[#64748b]">{message}</p>
        </div>
        <div className="px-6 pb-5 flex gap-3 justify-end">
          <Btn variant="outline" onClick={onCancel}>Cancel</Btn>
          <Btn variant={danger ? "danger" : "primary"} onClick={onConfirm}>{danger ? "Delete" : "Confirm"}</Btn>
        </div>
      </div>
    </div>
  );
}

/* ── Toast ── */
export function Toast({ message, type = "success", onClose }) {
  if (!message) return null;
  const cfg = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-700",
    error:   "bg-red-50 border-red-200 text-red-700",
    info:    "bg-[#fff8f0] border-[#fed7aa] text-[#f18200]",
  };
  return (
    <div className={`fixed top-5 right-5 z-[999] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-[13px] font-semibold ${cfg[type]}`}>
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
    </div>
  );
}

/* ── Pagination ── */
export function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onPage(Math.max(1,page-1))} disabled={page===1}
        className="w-7 h-7 rounded flex items-center justify-center border border-[#e2e8f0] text-[#94a3b8] hover:bg-[#f8fafc] disabled:opacity-40">
        <ChevronDown size={12} className="rotate-90" />
      </button>
      {Array.from({length:Math.min(totalPages,5)},(_,i)=>i+1).map(p=>(
        <button key={p} onClick={()=>onPage(p)}
          className={`w-7 h-7 rounded text-[12px] font-medium border transition-all ${p===page?"bg-[#f18200] text-white border-[#f18200]":"border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"}`}>
          {p}
        </button>
      ))}
      {totalPages > 5 && <span className="text-[#94a3b8] px-1 text-[12px]">…{totalPages}</span>}
      <button onClick={() => onPage(Math.min(totalPages,page+1))} disabled={page===totalPages}
        className="w-7 h-7 rounded flex items-center justify-center border border-[#e2e8f0] text-[#94a3b8] hover:bg-[#f8fafc] disabled:opacity-40">
        <ChevronDown size={12} className="-rotate-90" />
      </button>
    </div>
  );
}
