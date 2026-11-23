import React, { useState } from "react";
import { X } from "lucide-react";
// ── Static sample data ────────────────────────────────────────────────────────

function NewRequestModal({
  onClose
}) {
  const [type, setType] = useState("leave");
  const types = [{
    key: "leave",
    label: "Leave Request"
  }, {
    key: "regularization",
    label: "Attendance Regularization"
  }, {
    key: "wfh",
    label: "Work From Home"
  }, {
    key: "permission",
    label: "Permission / Early Exit"
  }, {
    key: "other",
    label: "Other Request"
  }];
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold  text-[#e87500]">New Request</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Request Type</label>
            <div className="grid grid-cols-1 gap-2">
              {types.map(t => <label key={t.key} className={`flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-all ${type === t.key ? "border-[#e87500] bg-orange-50" : "border-slate-200 hover:bg-slate-50"}`}>
                  <input type="radio" name="rtype" value={t.key} checked={type === t.key} onChange={() => setType(t.key)} className="accent-[#e87500]" />
                  <span className="text-sm font-medium text-slate-800">{t.label}</span>
                </label>)}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Date / Period</label>
            <input type="date" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#e87500] transition-colors" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Reason</label>
            <textarea rows={3} placeholder="Briefly describe your reason…" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#e87500] transition-colors resize-none" />
          </div>
          <div className="flex gap-2 pt-1">
            <button data-cancel-button onClick={onClose} className="flex-1 h-10 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">Cancel</button>
            <button className="flex-1 h-10 rounded-xl bg-[#e87500] hover:bg-[#e07000] text-white text-sm font-bold transition-colors">Submit Request</button>
          </div>
        </div>
      </div>
    </div>;
}
export { NewRequestModal };
