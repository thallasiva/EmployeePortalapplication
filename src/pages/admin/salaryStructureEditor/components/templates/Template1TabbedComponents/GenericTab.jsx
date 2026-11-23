import React from "react";
import { Plus } from "lucide-react";
import { fmtINR } from "../../../../salary/salaryHelpers";
// ─── Colour tokens ────────────────────────────────────────────────────────────
import { AMBER } from "./shared";
import { RowActions } from "./RowActions";
// ─── Generic section tab ──────────────────────────────────────────────────────
function GenericTab({
  lines,
  onAdd,
  onEdit,
  onRemove,
  canAdd,
  label
}) {
  return <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">{label}</span>
        {canAdd && <button onClick={onAdd} className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg text-white" style={{
        backgroundColor: AMBER
      }}>
            <Plus size={12} /> Add Component
          </button>}
      </div>
      {lines.length === 0 ? <div className="text-center py-12 text-gray-400 text-sm">No components added yet</div> : <table className="w-full text-xs border border-gray-100 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Component", "Amount (₹)", "Action"].map(h => <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {lines.map(l => <tr key={l.component_id} className="border-b border-gray-50 hover:bg-amber-50/30 transition-colors">
                <td className="px-3 py-2 font-medium text-gray-800">{l.component_name}</td>
                <td className="px-3 py-2 text-gray-700">{fmtINR(l.amount)}</td>
                <td className="px-3 py-2"><RowActions line={l} onEdit={onEdit} onRemove={onRemove} /></td>
              </tr>)}
          </tbody>
        </table>}
    </div>;
}
// ─── Salary summary sidebar ───────────────────────────────────────────────────
export { GenericTab };
