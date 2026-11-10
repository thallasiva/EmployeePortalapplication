import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bell, CalendarDays, FileText } from "lucide-react";

export default function AnnouncementsCard({ holidays = [], hasPayslip, checkedIn }) {
  const items = [
    { icon: CalendarDays, text: holidays[0] ? `${holidays[0].holiday_name || holidays[0].name} is coming up` : "Check the holiday calendar for upcoming days off.", to: "/employee/leave/holiday-calendar", tag: "Holiday" },
    { icon: FileText, text: hasPayslip ? "Your latest payslip is ready to view." : "Your payslip will appear here when it is available.", to: "/employee/payroll/payslips", tag: "Payroll" },
    { icon: Bell, text: checkedIn ? "Your attendance is currently in progress." : "Remember to record your attendance today.", to: "/employee/attendance/daily", tag: "Attendance" },
  ];
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between"><h2 className="flex items-center gap-1.5 text-xs font-bold text-slate-900"><Bell size={14} className="text-[#e87500]"/>Announcements</h2><Link to="/employee/engage" className="inline-flex items-center gap-1 text-[9px] font-bold text-[#e87500] hover:underline">View All <ArrowRight size={10}/></Link></div>
      <div className="space-y-2">
        {items.map(({ icon: Icon, text, to, tag }) => <Link key={tag} to={to} className="flex items-start gap-2 rounded-lg px-1 py-1 no-underline hover:bg-orange-50">
          <Icon size={12} className="mt-0.5 shrink-0 text-[#e87500]"/><span className="min-w-0 flex-1 text-[10px] leading-snug text-slate-700">{text}<small className="mt-0.5 block text-[8px] font-semibold text-slate-400">{tag}</small></span>
        </Link>)}
      </div>
    </section>
  );
}
