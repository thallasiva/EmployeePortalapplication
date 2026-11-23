import React, { useState } from "react";
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { fmtINR } from "../../../../salary/salaryHelpers";
// ─── Colour tokens ────────────────────────────────────────────────────────────
import { AMBER } from "./shared";
// ─── Accordion section ─────────────────────────────────────────────────────────
function AccordionSection({
  title,
  lines,
  onAdd,
  onEdit,
  onRemove,
  canAdd,
  defaultOpen = true
}) {
  const [open, setOpen] = useState(defaultOpen);
  return <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden mb-3">
      {/* Header */}
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{
          backgroundColor: "#fbcd97",
          color: "#92400e"
        }}>
            {lines.length} items
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canAdd && open && <button onClick={e => {
          e.stopPropagation();
          onAdd();
        }} className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg text-white" style={{
          backgroundColor: AMBER
        }}>
              <Plus size={11} /> Add
            </button>}
          {open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
        </div>
      </button>
      {/* Table */}
      {open && <div className="border-t border-gray-100">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Component", "Type", "Amount (₹)", "Formula", "Taxable", "Action"].map(h => <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400 text-xs">No components yet — click Add above</td></tr> : lines.map(l => <tr key={l.component_id} className="border-b border-gray-50 hover:bg-amber-50/30 transition-colors">
                  <td className="px-3 py-2 font-medium text-gray-800">{l.component_name}</td>
                  <td className="px-3 py-2 text-gray-500">{l.calc_type ?? "Fixed"}</td>
                  <td className="px-3 py-2 text-gray-700">{fmtINR(l.amount)}</td>
                  <td className="px-3 py-2 text-gray-400 font-mono text-[10px]">{l.formula || "—"}</td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${l.is_taxable ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500"}`}>
                      {l.is_taxable ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => onEdit(l)} className="p-1 rounded hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors">
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => onRemove(l)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>}
    </div>;
}
// ─── Employee profile sidebar ─────────────────────────────────────────────────
export { AccordionSection };
