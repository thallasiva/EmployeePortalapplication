import React from "react";

const SummaryCard = React.memo(function SummaryCard({ title, value, trend }) {
  return (
    <div className="min-w-[160px] flex-1 bg-white border border-[#dce3eb] rounded-lg px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold text-[#94a3b8] tracking-wide">{title}</p>
      <p className="text-2xl font-bold text-[#1f2937] mt-1">{value}</p>
      {trend && (
        <p className="text-xs text-emerald-600 font-medium mt-1">{trend}</p>
      )}
    </div>
  );
});

export default SummaryCard;
