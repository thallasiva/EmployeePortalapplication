import React from "react";
import { FlaskConical } from "lucide-react";
import { fmtINR } from "./salaryHelpers";

const CAT_STYLE = {
  "Earning":               "border-green-200 bg-green-50 text-green-800",
  "Deduction":             "border-red-200 bg-red-50 text-red-800",
  "Employer Contribution": "border-blue-200 bg-blue-50 text-blue-800",
};

export default function FormulaBuilderTab({ lines }) {
  const sorted = [...lines].sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99));

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <FlaskConical size={36} className="mb-3 text-gray-300" />
        <p className="text-sm">No components in this structure yet.</p>
        <p className="text-xs text-gray-300 mt-1">Add components via the Fixed Pay or other tabs.</p>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-3">
      <p className="text-xs text-gray-400 mb-4">
        All formula expressions used in this structure, evaluated top-to-bottom in sort order.
        Each component's value is available as a token for subsequent formulas.
      </p>

      {sorted.map((l) => {
        const ct = l.effective_calc_type || l.calc_type;

        const expr =
          ct === "Percentage"
            ? `${l.component_code}  =  ${l.effective_pct ?? l.percentage_value ?? "?"}%  ×  ${l.effective_pct_of || l.percentage_of || "?"}`
            : ct === "Fixed Amount"
            ? `${l.component_code}  =  ${fmtINR(l.fixed_amount)}  (Fixed)`
            : ct === "Formula"
            ? `${l.component_code}  =  ${l.effective_formula || l.formula_expr || "—"}`
            : `${l.component_code}  =  —`;

        const catStyle = CAT_STYLE[l.category] || "border-gray-200 bg-gray-50 text-gray-700";

        return (
          <div
            key={l.component_id}
            className={`flex items-center gap-3 border rounded-xl px-4 py-3 ${catStyle}`}
          >
            {/* Code badge */}
            <code className="text-[11px] font-mono font-bold bg-white/70 border border-current/20 px-2 py-1 rounded min-w-[56px] text-center shrink-0">
              {l.component_code}
            </code>

            {/* Formula */}
            <code className="text-xs font-mono flex-1 text-gray-700 break-all">{expr}</code>

            {/* Category pill */}
            <span className="text-[10px] font-medium shrink-0 opacity-70">{l.frequency}</span>
          </div>
        );
      })}

      {/* Legend */}
      <div className="mt-6 border-t border-gray-100 pt-4 text-[11px] text-gray-400 space-y-1">
        <p className="font-medium mb-2">Available tokens</p>
        <div className="flex flex-wrap gap-2">
          {["CTC_MONTHLY", "CTC_ANNUAL", "BASIC", "HRA", "GROSS", "SPL", "TEL", "LTA", "EMP_PF"].map(t => (
            <code key={t} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">{t}</code>
          ))}
        </div>
        <p className="mt-2">Functions: <code className="bg-gray-100 px-1 rounded">MIN(a,b)  MAX(a,b)  ROUND(x)  IF(cond,a,b)  ABS(x)</code></p>
      </div>
    </div>
  );
}
