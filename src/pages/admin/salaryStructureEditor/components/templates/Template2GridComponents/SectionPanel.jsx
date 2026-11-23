import React from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { fmtINR } from "../../../../salary/salaryHelpers";
// ─── Colour tokens ────────────────────────────────────────────────────────────

// ─── Mini section panel ───────────────────────────────────────────────────────
function SectionPanel({
  title,
  lines,
  onAdd,
  onEdit,
  onRemove,
  canAdd,
  accentColor,
  columns
}) {
  return <div className="flex flex-col rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden min-w-0">
      {/* Panel header */}
      <div className="px-3 py-2.5 flex items-center justify-between border-b border-gray-100" style={{
      backgroundColor: accentColor + "12"
    }}>
        <span className="text-[10px] font-bold uppercase tracking-wide" style={{
        color: accentColor
      }}>
          {title}
        </span>
        {canAdd && <button onClick={onAdd} className="flex items-center gap-0.5 text-[10px] font-medium px-2 py-1 rounded text-white" style={{
        backgroundColor: accentColor
      }}>
            <Plus size={10} /> Add
          </button>}
      </div>
      {/* Column headers */}
      <div className="grid bg-gray-50 border-b border-gray-100" style={{
      gridTemplateColumns: `1fr 1fr auto`
    }}>
        {columns.map(c => <div key={c} className="px-2 py-1.5 text-[9px] font-semibold text-gray-400 uppercase tracking-wide">{c}</div>)}
      </div>
      {/* Rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
        {lines.length === 0 ? <div className="px-3 py-6 text-center text-gray-300 text-xs">Empty</div> : lines.map(l => <div key={l.component_id} className="grid items-center px-2 py-1.5 hover:bg-amber-50/30 transition-colors text-xs" style={{
        gridTemplateColumns: `1fr 1fr auto`
      }}>
            <span className="truncate font-medium text-gray-800 text-[11px]">{l.component_name}</span>
            <span className="truncate text-gray-500 text-[11px]">{fmtINR(l.amount)}</span>
            <div className="flex gap-0.5">
              <button onClick={() => onEdit(l)} className="p-0.5 rounded text-gray-300 hover:text-amber-500 transition-colors">
                <Edit2 size={11} />
              </button>
              <button onClick={() => onRemove(l)} className="p-0.5 rounded text-gray-300 hover:text-red-500 transition-colors">
                <Trash2 size={11} />
              </button>
            </div>
          </div>)}
      </div>
      {/* Footer total */}
      <div className="px-3 py-2 border-t border-gray-100 bg-gray-50/60 flex justify-between text-[10px]">
        <span className="text-gray-500">{lines.length} item{lines.length !== 1 ? "s" : ""}</span>
        <span className="font-bold" style={{
        color: accentColor
      }}>
          {fmtINR(lines.reduce((s, l) => s + (l.amount || 0), 0))}
        </span>
      </div>
    </div>;
}
// ─── Compact summary ──────────────────────────────────────────────────────────
export { SectionPanel };
