import React from "react";

const StatCard = React.memo(function StatCard({ icon, label, value, color, bgColor }) {
  return (
    <div className="bg-white rounded-xl border border-[#e8eef5] p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: bgColor }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide">{label}</p>
        <p className="text-[20px] font-bold mt-0.5" style={{ color }}>{value}</p>
      </div>
    </div>
  );
});

export default StatCard;
