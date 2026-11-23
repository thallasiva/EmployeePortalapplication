import React from "react";
import { BRAND } from "./shared";
function MiniBarChart({
  cols,
  rows
}) {
  const bars = rows.slice(0, 6).map((row, i) => ({
    label: String(row.month || row.department_name || row.status || i + 1).slice(0, 8),
    value: Number(row.total || row.count || row.employee_count || row.value || 0)
  }));
  const max = Math.max(1, ...bars.map(bar => bar.value));
  return <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
      <p className="text-[12px] font-bold text-[#64748b] mb-3">{cols.slice(0, 2).join(" vs ") || "Report Chart"}</p>
      <div className="flex items-end gap-2 h-32">
        {bars.map(({
        label,
        value
      }) => <div key={label} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t" style={{
          height: `${Math.max(4, value / max * 100)}%`,
          background: BRAND,
          opacity: 0.8
        }} />
            <span className="text-[10px] text-[#94a3b8]">{label}</span>
          </div>)}
      </div>
    </div>;
}
export { MiniBarChart };
