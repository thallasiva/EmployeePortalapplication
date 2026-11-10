import React from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ClipboardCheck, Download } from "lucide-react";

const QuickAccessCard = React.memo(function QuickAccessCard({ onDownload, downloading }) {
  const actions = [
    { label: "Apply Leave", to: "/employee/leave/apply", icon: CalendarDays },
    { label: "Regularization", to: "/employee/attendance/regularizations", icon: ClipboardCheck },
    { label: "View Attendance", to: "/employee/attendance/history", icon: CalendarDays },
  ];
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <h2 className="mb-2 text-xs font-bold text-slate-900">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-2">
        {actions.map(({ label, to, icon: Icon }) => <Link key={label} to={to} className="flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-lg border border-orange-100 bg-orange-50 px-1.5 py-2 text-center no-underline transition hover:border-orange-300 hover:bg-orange-100"><Icon size={17} className="text-[#e87500]"/><span className="text-[9px] font-bold leading-tight text-slate-700">{label}</span></Link>)}
        <button type="button" onClick={onDownload} disabled={downloading} className="flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-lg border border-orange-100 bg-orange-50 px-1.5 py-2 text-center transition hover:border-orange-300 hover:bg-orange-100 disabled:opacity-50"><Download size={17} className="text-[#e87500]"/><span className="text-[9px] font-bold leading-tight text-slate-700">{downloading ? "Downloading…" : "Download Payslip"}</span></button>
      </div>
    </section>
  );
});

export default QuickAccessCard;
