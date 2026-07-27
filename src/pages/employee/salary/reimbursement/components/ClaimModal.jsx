import React, { useState } from "react";
import { X, Upload, Receipt } from "lucide-react";
import { CLAIM_TYPES } from "../constants";

const ClaimModal = React.memo(function ClaimModal({ onClose }) {
  const [form, setForm] = useState({ type: CLAIM_TYPES[0], amount: "", remarks: "", file: null });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[440px] shadow-2xl">
        {}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#fff8f0] flex items-center justify-center">
              <Receipt size={16} color="#f18200" />
            </div>
            <span className="text-[16px] font-bold text-[#1e293b]">New Claim</span>
          </div>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#64748b] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {}
          <div>
            <label className="block text-[12px] font-medium text-[#64748b] mb-1.5">Claim Type</label>
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              className="w-full h-[42px] border border-[#e2e8f0] rounded-lg px-3 text-[13px] outline-none focus:border-[#f18200] focus:ring-2 focus:ring-[#f18200]/10">

              {CLAIM_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          {}
          <div>
            <label className="block text-[12px] font-medium text-[#64748b] mb-1.5">Amount (₹)</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              placeholder="Enter amount"
              className="w-full h-[42px] border border-[#e2e8f0] rounded-lg px-3 text-[13px] outline-none focus:border-[#f18200] focus:ring-2 focus:ring-[#f18200]/10" />

          </div>

          {}
          <div>
            <label className="block text-[12px] font-medium text-[#64748b] mb-1.5">Upload Bill</label>
            <label className="flex items-center gap-3 p-3 border-2 border-dashed border-[#e2e8f0] rounded-lg cursor-pointer hover:border-[#f18200]/40 hover:bg-[#fff8f0] transition-all">
              <Upload size={16} className="text-[#94a3b8] shrink-0" />
              <span className={`text-[13px] ${form.file ? "text-emerald-600 font-medium" : "text-[#64748b]"}`}>
                {form.file ? form.file.name : "Choose file (JPG, PDF, PNG)"}
              </span>
              <input type="file" onChange={(e) => set("file", e.target.files[0])} className="hidden" />
            </label>
          </div>

          {}
          <div>
            <label className="block text-[12px] font-medium text-[#64748b] mb-1.5">Remarks <span className="text-[#cbd5e1]">(optional)</span></label>
            <input
              type="text"
              value={form.remarks}
              onChange={(e) => set("remarks", e.target.value)}
              placeholder="Add a note…"
              className="w-full h-[42px] border border-[#e2e8f0] rounded-lg px-3 text-[13px] outline-none focus:border-[#f18200] focus:ring-2 focus:ring-[#f18200]/10" />

          </div>

          {}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 h-[42px] border border-[#e2e8f0] rounded-lg text-[13px] font-semibold text-[#64748b] hover:bg-[#f8fafc] transition-colors">
              Cancel
            </button>
            <button onClick={onClose} className="flex-1 h-[42px] bg-[#f18200] hover:bg-[#e07000] text-white rounded-lg text-[13px] font-bold transition-colors">
              Submit Claim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ClaimModal;
