import { useState } from "react";
import { X, Wallet, CalendarClock } from "lucide-react";
import { fmt, LOAN_TYPES } from "./shared";
function ApplyModal({
  onClose
}) {
  const [form, setForm] = useState({
    type: LOAN_TYPES[0],
    amount: "",
    tenure: "",
    reason: ""
  });
  const set = (k, v) => setForm(p => ({
    ...p,
    [k]: v
  }));
  const emi = form.amount && form.tenure ? Math.round(Number(form.amount) / Number(form.tenure)) : 0;
  return <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[460px] max-h-[90vh] overflow-y-auto shadow-2xl">
        {}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#fff8f0] flex items-center justify-center">
              <Wallet size={16} color="#e87500" />
            </div>
            <span className="text-[16px] font-bold text-[#e87500]">Apply for Loan</span>
          </div>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#64748b] transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {}
          <div>
            <label className="block text-[12px] font-medium text-[#64748b] mb-1.5">Loan Type</label>
            <select value={form.type} onChange={e => set("type", e.target.value)} className="w-full h-[42px] border border-[#e2e8f0] rounded-lg px-3 text-[13px] outline-none focus:border-[#e87500] focus:ring-2 focus:ring-[#e87500]/10">
              {LOAN_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          {}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-[#64748b] mb-1.5">Loan Amount (₹)</label>
              <input type="number" value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="e.g. 100000" className="w-full h-[42px] border border-[#e2e8f0] rounded-lg px-3 text-[13px] outline-none focus:border-[#e87500] focus:ring-2 focus:ring-[#e87500]/10" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#64748b] mb-1.5">Tenure (months)</label>
              <input type="number" value={form.tenure} onChange={e => set("tenure", e.target.value)} placeholder="e.g. 12" className="w-full h-[42px] border border-[#e2e8f0] rounded-lg px-3 text-[13px] outline-none focus:border-[#e87500] focus:ring-2 focus:ring-[#e87500]/10" />
            </div>
          </div>
          {}
          {emi > 0 && <div className="flex items-center gap-3 p-4 bg-[#fff8f0] border border-[#fed7aa] rounded-xl">
              <CalendarClock size={18} color="#e87500" className="shrink-0" />
              <div>
                <p className="text-[11px] text-[#92400e] font-semibold uppercase tracking-wide">Estimated Monthly EMI</p>
                <p className="text-[18px] font-extrabold text-[#e87500]">{fmt(emi)}</p>
              </div>
            </div>}
          {}
          <div>
            <label className="block text-[12px] font-medium text-[#64748b] mb-1.5">Reason / Purpose</label>
            <textarea rows={3} value={form.reason} onChange={e => set("reason", e.target.value)} placeholder="Brief reason for loan request…" className="w-full border border-[#e2e8f0] rounded-lg p-3 text-[13px] outline-none resize-none focus:border-[#e87500] focus:ring-2 focus:ring-[#e87500]/10" />
          </div>
          {}
          <div className="flex gap-3 pt-1">
            <button data-cancel-button onClick={onClose} className="flex-1 h-[42px] border border-[#e2e8f0] rounded-lg text-[13px] font-semibold text-[#64748b] hover:bg-[#f8fafc] transition-colors">
              Cancel
            </button>
            <button onClick={onClose} className="flex-1 h-[42px] bg-[#e87500] hover:bg-[#e07000] text-white rounded-lg text-[13px] font-bold transition-colors">
              Submit Application
            </button>
          </div>
        </div>
      </div>
    </div>;
}
export { ApplyModal };
