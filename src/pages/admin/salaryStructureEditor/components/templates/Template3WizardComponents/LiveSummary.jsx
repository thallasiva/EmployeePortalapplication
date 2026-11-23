import React from "react";
import { fmtINR } from "../../../../salary/salaryHelpers";
// ─── Colour tokens ────────────────────────────────────────────────────────────
import { NAVY, AMBER } from "./shared";
import { DonutChart } from "./DonutChart";
// ─── Live salary summary ──────────────────────────────────────────────────────
function LiveSummary({
  structure
}) {
  const lines = structure?.lines ?? [];
  const totalFixed = lines.filter(l => l.category === "Earning" && l.frequency === "Monthly").reduce((s, l) => s + (l.amount || 0), 0);
  const totalVar = lines.filter(l => l.category === "Earning" && l.frequency !== "Monthly").reduce((s, l) => s + (l.amount || 0), 0);
  const totalBen = lines.filter(l => l.category === "Benefit").reduce((s, l) => s + (l.amount || 0), 0);
  const totalEmp = lines.filter(l => l.category === "Employer Contribution").reduce((s, l) => s + (l.amount || 0), 0);
  const totalDed = lines.filter(l => l.category === "Deduction").reduce((s, l) => s + (l.amount || 0), 0);
  const ctc = totalFixed + totalVar + totalBen + totalEmp;
  const net = ctc - totalDed;
  const safe = ctc || 1;
  const slices = [{
    label: "Fixed",
    pct: Math.round(totalFixed / safe * 100),
    color: NAVY
  }, {
    label: "Variable",
    pct: Math.round(totalVar / safe * 100),
    color: AMBER
  }, {
    label: "Benefits",
    pct: Math.round(totalBen / safe * 100),
    color: "#10b981"
  }, {
    label: "Employer",
    pct: Math.round(totalEmp / safe * 100),
    color: "#e87500"
  }, {
    label: "Deduct",
    pct: Math.round(totalDed / safe * 100),
    color: "#ef4444"
  }].filter(s => s.pct > 0);
  const sum = slices.reduce((s, sl) => s + sl.pct, 0);
  if (sum < 100) slices.push({
    label: "",
    pct: 100 - sum,
    color: "#e5e7eb"
  });
  const legend = [{
    label: "Fixed Earnings",
    value: fmtINR(totalFixed),
    color: NAVY
  }, {
    label: "Variable Pay",
    value: fmtINR(totalVar),
    color: AMBER
  }, {
    label: "Benefits",
    value: fmtINR(totalBen),
    color: "#10b981"
  }, {
    label: "Employer Contrib.",
    value: fmtINR(totalEmp),
    color: "#e87500"
  }, {
    label: "Deductions",
    value: fmtINR(totalDed),
    color: "#ef4444"
  }];
  return <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden mt-3">
      <div className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-white" style={{
      backgroundColor: NAVY
    }}>
        LIVE SALARY SUMMARY
      </div>
      <div className="flex justify-center py-3 border-b border-gray-50">
        <DonutChart slices={slices} />
      </div>
      <div className="px-3 py-3 space-y-2">
        {legend.map(r => <div key={r.label} className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{
            backgroundColor: r.color
          }} />
              <span className="text-gray-500">{r.label}</span>
            </div>
            <span className="font-semibold text-gray-700">{r.value}</span>
          </div>)}
      </div>
      <div className="border-t border-gray-100 px-3 py-2.5 space-y-1">
        <div className="flex justify-between text-xs font-bold" style={{
        color: NAVY
      }}>
          <span>Total CTC</span><span>{ctc ? fmtINR(ctc) : "₹ 18,00,000"}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Net Salary</span>
          <span className="font-semibold text-green-600">{net ? fmtINR(net) : "—"}</span>
        </div>
      </div>
    </div>;
}
// ─── Review step ──────────────────────────────────────────────────────────────
export { LiveSummary };
