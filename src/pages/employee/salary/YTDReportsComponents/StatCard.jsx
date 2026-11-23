import React from "react";
/* ── Summary stat card ── */
function StatCard({
  icon,
  label,
  value,
  color,
  bgColor,
  sub
}) {
  return <div className="bg-white rounded-xl border border-[#e8eef5] p-5 flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{
      background: bgColor
    }}>
        <span style={{
        color
      }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide">{label}</p>
        <p className="text-[20px] font-bold mt-0.5 truncate" style={{
        color
      }}>{value}</p>
        {sub && <p className="text-[11px] text-[#94a3b8] mt-0.5">{sub}</p>}
      </div>
    </div>;
}
/* ── Bar chart (SVG) ── */
export { StatCard };
