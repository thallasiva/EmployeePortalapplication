import React from "react";
import { fmt } from "../utils";

const EntitlementCard = React.memo(function EntitlementCard({ item, color }) {
  const balance = item.annual - item.claimed;
  const usedPct = Math.min(Math.round(item.claimed / (item.annual || 1) * 100), 100);
  const r = 15.9;
  const circ = 2 * Math.PI * r;
  const dash = usedPct / 100 * circ;

  return (
    <div className="bg-white rounded-xl border border-[#e8eef5] p-5 flex items-center gap-5 hover:shadow-md transition-shadow">
      {}
      <div className="relative shrink-0 w-[72px] h-[72px]">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r={r} fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
          <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="3.5"
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold" style={{ color }}>
          {usedPct}%
        </span>
      </div>

      {}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-[#1e293b]">{item.title}</p>
        <div className="flex items-center gap-4 mt-2 text-[12px] text-[#64748b]">
          <span>Annual: <strong className="text-[#1e293b]">{fmt(item.annual)}</strong></span>
          <span className="text-[#e2e8f0]">|</span>
          <span>Claimed: <strong className="text-[#1e293b]">{fmt(item.claimed)}</strong></span>
        </div>
        <div className="mt-3 h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${usedPct}%`, background: color }} />
        </div>
      </div>

      {}
      <div className="text-right shrink-0 pl-4 border-l border-[#f1f5f9]">
        <p className="text-[11px] text-[#94a3b8] font-medium">Balance</p>
        <p className="text-[20px] font-extrabold mt-1" style={{ color: balance > 0 ? "#15803d" : "#ef4444" }}>
          {fmt(balance)}
        </p>
      </div>
    </div>
  );
});

export default EntitlementCard;
