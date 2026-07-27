import React from "react";

const BalanceCard = React.memo(function BalanceCard({ name, balance, total, color }) {
  const pct = total > 0 ? Math.min((balance / total) * 100, 100) : 0;
  return (
    <div className="bg-white rounded-xl border border-[#e8eef5] p-4 flex flex-col gap-2 min-w-[140px]">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-[#64748b] truncate">{name}</span>
        <span
          className="text-[11px] font-medium px-2 py-0.5 rounded-full"
          style={{ background: `${color}18`, color }}
        >
          {balance ?? 0} left
        </span>
      </div>
      <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="text-[11px] text-[#94a3b8]">
        {total - (balance ?? 0)} used / {total} total
      </div>
    </div>
  );
});

export default BalanceCard;
