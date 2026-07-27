import React from "react";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { fmtINR, fmtPct } from "./salaryHelpers";

export default function ComponentTable({ lines, computed, onEdit, onRemove }) {
  const byCode = {};
  for (const c of computed?.components ?? []) byCode[c.component_code] = c;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px]">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            {[
              "#", "Component Name", "Short Code", "Calculation Type",
              "Based On", "Value", "Monthly (₹)", "Annual (₹)",
              "Taxable", "PF Appl.", "Actions",
            ].map((h) => (
              <th key={h} className="px-3 py-2.5 text-left text-[11px] text-gray-400 font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {lines.length === 0 ? (
            <tr>
              <td colSpan={11} className="text-center py-12 text-sm text-gray-400">
                No components yet. Click "+ Add Component" to start building this section.
              </td>
            </tr>
          ) : (
            lines.map((line, idx) => {
              const comp    = byCode[line.component_code];
              const monthly = comp?.monthly_amount ?? 0;
              const annual  = comp?.annual_amount  ?? 0;
              const ct      = line.effective_calc_type || line.calc_type;

              const basedOn =
                ct === "Percentage"   ? (line.effective_pct_of || line.percentage_of || "—")
                : ct === "Formula"    ? "Formula"
                : "—";

              const valueCell =
                ct === "Percentage"
                  ? fmtPct(line.effective_pct ?? line.percentage_value)
                  : ct === "Fixed Amount"
                  ? fmtINR(line.fixed_amount)
                  : (
                    <code className="text-[10px] bg-gray-100 px-1 py-0.5 rounded text-indigo-700">
                      {(line.effective_formula || line.formula_expr || "").slice(0, 22)}…
                    </code>
                  );

              return (
                <tr key={line.component_id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-3 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <GripVertical size={12} className="text-gray-300" />
                      {idx + 1}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm font-medium text-gray-800">{line.component_name}</td>
                  <td className="px-3 py-3">
                    <code className="text-[11px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">
                      {line.component_code}
                    </code>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-500">{ct || "—"}</td>
                  <td className="px-3 py-3 text-xs text-gray-500">{basedOn}</td>
                  <td className="px-3 py-3 text-xs text-gray-700">{valueCell}</td>
                  <td className="px-3 py-3 text-xs font-medium text-gray-700">
                    {monthly > 0 ? fmtINR(monthly) : "—"}
                  </td>
                  <td className="px-3 py-3 text-xs font-semibold text-indigo-700">
                    {annual > 0 ? fmtINR(annual) : "—"}
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {line.is_taxable
                      ? <span className="text-green-600 font-medium">Yes</span>
                      : <span className="text-gray-400">No</span>}
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {line.pf_applicable
                      ? <span className="text-green-600 font-medium">Yes</span>
                      : <span className="text-gray-400">No</span>}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => onEdit(line)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50">
                        <Pencil size={12} />
                      </button>
                      {!line.is_system && (
                        <button onClick={() => onRemove(line)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>

        {lines.length > 0 && (() => {
          const totalMonthly = lines.reduce((s, l) => {
            const c = byCode[l.component_code];
            return s + (c?.monthly_amount || 0);
          }, 0);
          return (
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td colSpan={6} className="px-3 py-3 text-sm font-semibold text-gray-700">Total</td>
                <td className="px-3 py-3 text-sm font-bold text-indigo-600">{fmtINR(totalMonthly)}</td>
                <td className="px-3 py-3 text-sm font-bold text-indigo-600">{fmtINR(totalMonthly * 12)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          );
        })()}
      </table>
    </div>
  );
}
