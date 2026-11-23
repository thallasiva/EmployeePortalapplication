import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Loader2, Minus, Plus, X } from "lucide-react";
import { getErrorMessage } from "../../../../api/client";
import { savePayrollAttendanceAdjustment } from "../../../../api/payroll.api";
import { MONTHS, num } from "./shared";
import { Stat } from "./Stat";
/* ---------- adjustment dialog ---------- */
function AdjustDialog({
  row,
  month,
  year,
  onClose,
  onSaved
}) {
  const [lop, setLop] = useState(row.adjustment?.lop_adjustment ?? 0);
  const [hold, setHold] = useState(row.adjustment?.hold_salary ?? false);
  const [reason, setReason] = useState(row.adjustment?.reason ?? "");
  const [saving, setSaving] = useState(false);
  const a = row.attendance;
  const newLop = Math.min(a.employedWorkingDays, Math.max(0, a.computedLop + Number(lop || 0)));
  useEffect(() => {
    const onKey = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const save = async e => {
    e.preventDefault();
    if ((Number(lop) || hold) && reason.trim().length < 3) return toast.error("Please give a reason for the adjustment");
    setSaving(true);
    try {
      const res = await savePayrollAttendanceAdjustment(row.employee_id, {
        month,
        year,
        lop_adjustment: Number(lop) || 0,
        hold_salary: hold,
        reason: reason.trim() || "Cleared"
      });
      toast.success("Adjustment saved");
      onSaved(res.employee);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not save adjustment"));
    } finally {
      setSaving(false);
    }
  };
  return <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center px-4" onMouseDown={onClose}>
      <form role="dialog" aria-modal="true" aria-label="Adjust attendance" onSubmit={save} onMouseDown={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold  text-[#e87500]">Adjust attendance</h2>
            <p className="text-sm text-slate-500">{row.name} · {MONTHS[month - 1]} {year}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"><X size={18} /></button>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
          <Stat label="LOP from attendance" value={`${num(a.computedLop)} day(s)`} />
          <Stat label="After adjustment" value={`${num(newLop)} day(s)`} tone="text-[#b45309]" />
        </div>
        <div>
          <label htmlFor="adj-lop" className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">LOP adjustment (days)</label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setLop(v => Math.round((Number(v) - 0.5) * 10) / 10)} className="w-10 h-10 rounded-xl border border-slate-200 font-bold" aria-label="Decrease LOP"><Minus size={16} aria-hidden="true" /></button>
            <input id="adj-lop" type="number" step="0.5" min="-31" max="31" value={lop} onChange={e => setLop(e.target.value)} className="flex-1 h-10 border border-slate-200 rounded-xl px-3 text-center font-bold tabular-nums outline-none focus:border-[#e87500]" />
            <button type="button" onClick={() => setLop(v => Math.round((Number(v) + 0.5) * 10) / 10)} className="w-10 h-10 rounded-xl border border-slate-200 font-bold" aria-label="Increase LOP"><Plus size={16} aria-hidden="true" /></button>
          </div>
          <p className="text-xs text-slate-500 mt-1">Use a minus value to waive LOP (e.g. −1 for an approved client visit), plus to add LOP.</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={hold} onChange={e => setHold(e.target.checked)} className="w-4 h-4 accent-[#e87500]" />
          Hold this employee's salary for the month
        </label>
        <div>
          <label htmlFor="adj-reason" className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Reason (kept in the audit trail)</label>
          <textarea id="adj-reason" rows={2} value={reason} onChange={e => setReason(e.target.value)} maxLength={255} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#e87500] resize-none" />
        </div>
        <div className="flex gap-2">
          <button data-cancel-button type="button" onClick={onClose} className="flex-1 h-10 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 h-10 rounded-xl bg-[#e87500] hover:bg-[#e07000] text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
            {saving && <Loader2 size={15} className="animate-spin" />} Save
          </button>
        </div>
      </form>
    </div>;
}
/* ---------- employee row ---------- */
export { AdjustDialog };
