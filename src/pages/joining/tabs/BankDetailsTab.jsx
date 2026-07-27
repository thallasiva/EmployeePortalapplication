import React from "react";
import { Landmark, CheckCircle } from "lucide-react";

export default function BankDetailsTab({ form }) {
  const acc = form.accountNumber || "";
  const masked = acc.length > 4 ? "*".repeat(acc.length - 4) + acc.slice(-4) : acc;

  const Row = ({ label, value }) => (
    <div className="flex items-center justify-between py-3 border-b border-amber-50 last:border-0">
      <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">{label}</span>
      <span className="text-[13px] font-semibold text-gray-800">{value || <span className="text-gray-300 italic font-normal">—</span>}</span>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-[#f18200] to-[#f18200]">
        <div className="p-1.5 rounded-lg bg-white/20"><Landmark size={15} className="text-white" /></div>
        <h3 className="text-[13px] font-bold text-white tracking-wide">Bank Account Details — Summary</h3>
      </div>
      <div className="p-5">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-[12px] text-amber-700 flex items-center gap-2">
          <CheckCircle size={14} className="text-amber-600 flex-shrink-0" />
          Bank details entered in Tab 3 (Joining Formalities) are shown below. Edit them there if needed.
        </div>
        <div className="bg-white rounded-xl border border-amber-100 p-4">
          <Row label="Bank Name"           value={form.bankName} />
          <Row label="Account Holder"      value={form.accountHolderName} />
          <Row label="Account Number"      value={masked || "Not entered"} />
          <Row label="IFSC Code"           value={form.ifscCode} />
          <Row label="Branch Details"      value={form.branchDetails} />
        </div>
        {form.accountNumber && form.confirmAccountNumber && (
          <div className={"mt-3 flex items-center gap-2 px-3 py-2.5 rounded-lg text-[12px] font-medium " +
            (form.accountNumber === form.confirmAccountNumber
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-600")}>
            {form.accountNumber === form.confirmAccountNumber ? "✓ Account numbers match" : "⚠ Account numbers do not match — please go back to Tab 3 and correct"}
          </div>
        )}
      </div>
    </div>
  );
}
