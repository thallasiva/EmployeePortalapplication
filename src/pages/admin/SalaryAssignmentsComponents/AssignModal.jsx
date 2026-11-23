import React, { useState } from "react";
import { X } from "lucide-react";
import { inp, sel, fmt } from "./shared";
function AssignModal({
  employee,
  structures,
  onSave,
  onClose,
  saving
}) {
  const cur = employee;
  const [structureId, setStructId] = useState(cur.structure_id ? String(cur.structure_id) : "");
  const [ctcMonthly, setCtcMonthly] = useState(cur.ctc_annual ? String(Math.round(cur.ctc_annual / 12)) : "");
  const [effectiveFrom, setEffDate] = useState(new Date().toISOString().slice(0, 10));
  const ctcAnnual = Number(ctcMonthly) * 12;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-base font-semibold text-gray-800">Assign Salary Structure</p>
            <p className="text-xs text-gray-400 mt-0.5">{employee.employee_name} · {employee.emp_code}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={15} /></button>
        </div>
        <form onSubmit={e => {
        e.preventDefault();
        onSave(employee.employee_id, {
          structure_id: structureId,
          ctc_annual: ctcAnnual,
          effective_from: effectiveFrom
        });
      }} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Salary Structure *</label>
            <select required value={structureId} onChange={e => setStructId(e.target.value)} className={sel}>
              <option value="">— Select structure —</option>
              {structures.map(s => <option key={s.structure_id} value={s.structure_id}>
                  {s.structure_name}{s.is_default ? " (Default)" : ""}
                </option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">CTC (Monthly) *</label>
            <input required type="number" min={1000} value={ctcMonthly} onChange={e => setCtcMonthly(e.target.value)} className={inp} placeholder="e.g. 50000" />
            {ctcMonthly && Number(ctcMonthly) > 0 && <p className="text-[11px] text-indigo-600 mt-0.5">
                Annual: ₹{ctcAnnual.toLocaleString("en-IN")}
              </p>}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Effective From *</label>
            <input required type="date" value={effectiveFrom} onChange={e => setEffDate(e.target.value)} className={inp} />
          </div>
          {cur.structure_id && <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[12px] text-amber-700">
              Current: <b>{cur.structure_name}</b> · {fmt(cur.ctc_annual)}/year — will be replaced from {effectiveFrom}
            </div>}
          <div className="flex gap-3 pt-1">
            <button data-cancel-button type="button" onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-[#e87500] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#7c3d00] disabled:opacity-60">
              {saving ? "Saving…" : "Assign Structure"}
            </button>
          </div>
        </form>
      </div>
    </div>;
}
export { AssignModal };
