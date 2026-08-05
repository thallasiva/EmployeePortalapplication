import React from "react";
import { Clock, AlertTriangle, TrendingUp } from "lucide-react";

const Card = ({ icon, color, bg, title, value, sub }) => (
  <div className={`flex-1 min-w-[160px] ${bg} border border-[#e2e8f0] rounded-xl px-5 py-4 shadow-sm flex items-start gap-4`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-bold text-[#1f2937] mt-0.5">{value}</p>
      {sub && <p className="text-xs text-[#94a3b8] mt-1">{sub}</p>}
    </div>
  </div>
);

const SummaryCards = React.memo(function SummaryCards({ loading, summary, recordsByDate }) {
  return (
    <div className="flex flex-wrap items-stretch gap-4">
      <Card
        icon={<Clock size={20} className="text-[#f18200]" />}
        color="bg-orange-50"
        bg="bg-white"
        title="Avg. Work Hours"
        value={loading ? "—" : summary.avgWork}
        sub={loading ? "" : `${recordsByDate.size} day(s) recorded`}
      />
      <Card
        icon={<TrendingUp size={20} className="text-blue-500" />}
        color="bg-blue-50"
        bg="bg-white"
        title="Avg. Actual Hours"
        value={loading ? "—" : summary.avgActual}
      />
      <Card
        icon={<AlertTriangle size={20} className="text-red-500" />}
        color="bg-red-50"
        bg="bg-white"
        title="Penalty Days"
        value={loading ? "—" : String(summary.penaltyDays)}
        sub="Absent or partial attendance"
      />
    </div>
  );
});

export default SummaryCards;
