import React from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Clock3, Eye, EyeOff, WalletCards } from "lucide-react";
import { fmt } from "../utils/formatters";

const Metric = ({ icon: Icon, label, children, color = "text-[#e87500]", tint = "bg-orange-50", className = "" }) => (
  <div className={`flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm ${className}`}>
    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tint} ${color}`}><Icon size={18}/></span>
    <div className="min-w-0 flex-1"><div className="truncate text-[10px] font-semibold text-slate-500">{label}</div>{children}</div>
  </div>
);

const SummaryTiles = React.memo(function SummaryTiles({ loading, showSal, sal, paidDays, workDays, monthlyHours, leaveDays, setShowSal }) {
  return (
    <div className="mb-3 grid grid-cols-2 gap-2.5 xl:grid-cols-4">
      <Metric icon={WalletCards} label="My Salary">
        <div className="flex items-center gap-1.5"><b className="truncate text-sm font-extrabold text-slate-900">{loading ? "…" : showSal ? `₹ ${fmt(sal.net)}` : "₹ ••••••"}</b><button type="button" onClick={() => setShowSal((value) => !value)} aria-label={showSal ? "Hide salary" : "Show salary"} className="rounded p-0.5 text-slate-400 hover:text-[#e87500]">{showSal ? <EyeOff size={13}/> : <Eye size={13}/>}</button></div>
        <Link to="/employee/payroll/payslips" className="mt-0.5 inline-block text-[9px] font-bold text-[#e87500] hover:underline">View Salary →</Link>
      </Metric>
      <Metric icon={CalendarDays} label="Paid Days" tint="bg-rose-50" color="text-rose-600">
        <b className="text-sm font-extrabold text-slate-900">{loading ? "…" : `${paidDays} / ${workDays}`}</b>
      </Metric>
      <Metric icon={Clock3} label="Working Hours" tint="bg-violet-50" color="text-violet-600">
        <b className="text-sm font-extrabold text-slate-900">{loading ? "…" : monthlyHours}</b>
      </Metric>
      <Metric icon={CalendarDays} label="Leave Balance" tint="bg-orange-50">
        <b className="text-sm font-extrabold text-slate-900">{loading ? "…" : `${leaveDays} days`}</b>
        <Link to="/employee/leave/balance" className="ml-2 text-[9px] font-bold text-[#e87500] hover:underline">View All →</Link>
      </Metric>
    </div>
  );
});

export default SummaryTiles;
