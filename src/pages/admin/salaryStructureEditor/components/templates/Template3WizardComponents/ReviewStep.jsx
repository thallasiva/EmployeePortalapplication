import React from "react";
import { Check } from "lucide-react";
import { fmtINR } from "../../../../salary/salaryHelpers";
// ─── Colour tokens ────────────────────────────────────────────────────────────
import { NAVY, AMBER } from "./shared";
// ─── Review step ──────────────────────────────────────────────────────────────
function ReviewStep({
  structure,
  handleSave,
  saving
}) {
  const lines = structure?.lines ?? [];
  const totals = {
    Fixed: lines.filter(l => l.category === "Earning" && l.frequency === "Monthly").reduce((s, l) => s + (l.amount || 0), 0),
    Variable: lines.filter(l => l.category === "Earning" && l.frequency !== "Monthly").reduce((s, l) => s + (l.amount || 0), 0),
    Benefits: lines.filter(l => l.category === "Benefit").reduce((s, l) => s + (l.amount || 0), 0),
    Employer: lines.filter(l => l.category === "Employer Contribution").reduce((s, l) => s + (l.amount || 0), 0),
    Deductions: lines.filter(l => l.category === "Deduction").reduce((s, l) => s + (l.amount || 0), 0)
  };
  const ctc = totals.Fixed + totals.Variable + totals.Benefits + totals.Employer;
  const net = ctc - totals.Deductions;
  return <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-base font-bold text-gray-800 mb-4">Review Salary Structure</h3>
      <div className="space-y-3 mb-6">
        {Object.entries(totals).map(([key, val]) => <div key={key} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
            <span className="text-gray-600 font-medium">{key}</span>
            <span className={`font-bold ${key === "Deductions" ? "text-red-600" : "text-gray-800"}`}>{fmtINR(val)}</span>
          </div>)}
      </div>
      <div className="rounded-lg p-4 space-y-2" style={{
      backgroundColor: NAVY + "0d"
    }}>
        <div className="flex justify-between font-bold text-sm" style={{
        color: NAVY
      }}>
          <span>Total CTC</span><span>{ctc ? fmtINR(ctc) : "₹ 18,00,000"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Net Take-Home</span>
          <span className="font-bold text-green-600">{net ? fmtINR(net) : "—"}</span>
        </div>
      </div>
      <div className="mt-5 flex gap-3 justify-end">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
          Save Draft
        </button>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-60 shadow-sm" style={{
        backgroundColor: AMBER
      }}>
          <Check size={15} /> {saving ? "Publishing…" : "Publish Structure"}
        </button>
      </div>
    </div>;
}
// ─── Main Template 3 ──────────────────────────────────────────────────────────
export { ReviewStep };
