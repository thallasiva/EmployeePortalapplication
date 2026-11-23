import React from "react";
import { Plus } from "lucide-react";
import { fmtINR } from "../../../../salary/salaryHelpers";
// ─── Colour tokens ────────────────────────────────────────────────────────────
import { AMBER } from "./shared";
import { RowActions } from "./RowActions";
// ─── Earnings table ───────────────────────────────────────────────────────────
function EarningsTable({
  lines,
  onAdd,
  onEdit,
  onRemove,
  canAdd
}) {
  return <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
          EARNINGS (Fixed Components)
        </span>
        {canAdd && <button onClick={onAdd} className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg text-white" style={{
        backgroundColor: AMBER
      }}>
            <Plus size={12} /> Add Earning
          </button>}
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Component", "Type", "Amount (₹)", "Formula", "Taxable", "Action"].map(h => <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400 text-xs">No earnings added yet</td></tr> : lines.map(l => <tr key={l.component_id} className="border-b border-gray-50 hover:bg-amber-50/30 transition-colors">
                <td className="px-3 py-2 font-medium text-gray-800">{l.component_name}</td>
                <td className="px-3 py-2 text-gray-500">{l.calc_type ?? "Fixed"}</td>
                <td className="px-3 py-2 text-gray-700">{fmtINR(l.amount)}</td>
                <td className="px-3 py-2 text-gray-400 font-mono text-[10px]">{l.formula || "—"}</td>
                <td className="px-3 py-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${l.is_taxable ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500"}`}>
                    {l.is_taxable ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-3 py-2"><RowActions line={l} onEdit={onEdit} onRemove={onRemove} /></td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>;
}
// ─── Variable pay table ───────────────────────────────────────────────────────
export { EarningsTable };
