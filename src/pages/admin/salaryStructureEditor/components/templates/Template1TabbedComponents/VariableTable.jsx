import React from "react";
import { Plus, ToggleRight } from "lucide-react";
import { fmtINR } from "../../../../salary/salaryHelpers";
// ─── Colour tokens ────────────────────────────────────────────────────────────
import { AMBER } from "./shared";
import { RowActions } from "./RowActions";
// ─── Variable pay table ───────────────────────────────────────────────────────
function VariableTable({
  lines,
  onAdd,
  onEdit,
  onRemove,
  canAdd
}) {
  return <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
          VARIABLE PAY (Incentives / Bonus)
        </span>
        {canAdd && <button onClick={onAdd} className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg text-white" style={{
        backgroundColor: AMBER
      }}>
            <Plus size={12} /> Add Variable
          </button>}
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Component", "Type", "Frequency", "Target/Amount", "Status", "Action"].map(h => <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400 text-xs">No variable pay added yet</td></tr> : lines.map(l => <tr key={l.component_id} className="border-b border-gray-50 hover:bg-amber-50/30 transition-colors">
                <td className="px-3 py-2 font-medium text-gray-800">{l.component_name}</td>
                <td className="px-3 py-2 text-gray-500">{l.calc_type ?? "Bonus"}</td>
                <td className="px-3 py-2 text-gray-500">{l.frequency ?? "Annual"}</td>
                <td className="px-3 py-2 text-gray-700">{fmtINR(l.amount)}</td>
                <td className="px-3 py-2">
                  <ToggleRight size={18} className="text-green-500" />
                </td>
                <td className="px-3 py-2"><RowActions line={l} onEdit={onEdit} onRemove={onRemove} /></td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>;
}
// ─── Generic section tab ──────────────────────────────────────────────────────
export { VariableTable };
