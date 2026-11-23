import React from "react";
import { Trash2 } from "lucide-react";
import { BRAND } from "./shared";
/* ── Widget visual preview ── */
function WidgetCard({
  widget,
  onSelect,
  selected,
  onDelete
}) {
  const inner = () => {
    switch (widget.type) {
      case "kpi":
      case "headcount":
      case "attendance":
        return <div className="flex flex-col items-center justify-center h-full">
            <p className="text-[28px] font-extrabold" style={{
            color: widget.color || BRAND
          }}>
              —
            </p>
            <p className="text-[11px] text-[#94a3b8] mt-1 font-medium">{widget.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Live value on role dashboard</p>
          </div>;
      case "bar":
        return <div className="flex flex-col h-full">
            <p className="text-[11px] font-semibold text-[#64748b] mb-2">{widget.label}</p>
            <div className="flex-1 flex items-end gap-1.5 pb-1">
              {[60, 80, 45, 90, 70, 55, 85].map((h, i) => <div key={i} className="flex-1 rounded-t" style={{
              height: `${h}%`,
              background: widget.color || BRAND,
              opacity: 0.7 + i * 0.04
            }} />)}
            </div>
          </div>;
      case "pie":
        return <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="w-20 h-20 rounded-full border-8 border-[#e87500]" style={{
            borderRightColor: "#e87500",
            borderBottomColor: "#10b981"
          }} />
            <p className="text-[11px] text-[#94a3b8] font-medium">{widget.label}</p>
          </div>;
      case "line":
        return <div className="flex flex-col h-full">
            <p className="text-[11px] font-semibold text-[#64748b] mb-2">{widget.label}</p>
            <svg className="flex-1 w-full" viewBox="0 0 200 80" preserveAspectRatio="none">
              <polyline points="0,60 30,45 60,50 90,30 120,40 150,20 180,30 200,25" fill="none" stroke={widget.color || BRAND} strokeWidth="2" />
              <polyline points="0,60 30,45 60,50 90,30 120,40 150,20 180,30 200,25 200,80 0,80" fill={widget.color || BRAND} fillOpacity="0.08" />
            </svg>
          </div>;
      case "table":
        return <div className="flex flex-col h-full">
            <p className="text-[11px] font-semibold text-[#64748b] mb-2">{widget.label}</p>
            <div className="flex-1 space-y-1 overflow-hidden">
              <p className="text-[11px] text-slate-400">Live {widget.source.toLowerCase()} data appears on the assigned role dashboard.</p>
            </div>
          </div>;
      case "calendar":
        return <div className="flex flex-col h-full">
            <p className="text-[11px] font-semibold text-[#64748b] mb-2">{widget.label}</p>
            <div className="space-y-1.5 flex-1 overflow-hidden">
              <p className="text-[11px] text-slate-400">Live calendar data appears on the assigned role dashboard.</p>
            </div>
          </div>;
      default:
        return <p className="text-[12px] text-[#94a3b8]">{widget.label}</p>;
    }
  };
  return <div onClick={() => onSelect(widget.id)} className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all bg-white ${widget.span} ${widget.rows} min-h-[120px] flex flex-col ${selected === widget.id ? "border-[#e87500] shadow-lg shadow-[#e87500]/10" : "border-[#e2e8f0] hover:border-[#e87500]/40"}`}>
      {inner()}
      {selected === widget.id && <div className="absolute top-2 right-2 flex gap-1">
          <button onClick={e => {
        e.stopPropagation();
        onDelete(widget.id);
      }} className="w-6 h-6 rounded bg-red-50 flex items-center justify-center text-red-400 hover:text-red-600">
            <Trash2 size={10} />
          </button>
        </div>}
    </div>;
}
/* ── Builder view ── */
export { WidgetCard };
