import React, { useMemo } from "react";
import { Clock, CheckCircle2, XCircle, AlertTriangle, TrendingUp, Calendar } from "lucide-react";

const Stat = ({ icon, iconBg, label, value, sub, accent }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-4 min-w-0 flex-1">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest truncate">{label}</p>
      <p className={`text-[26px] font-extrabold leading-tight ${accent || "text-slate-800"}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{sub}</p>}
    </div>
  </div>
);

const SummaryCards = React.memo(function SummaryCards({ loading, summary, recordsByDate, dayMap }) {
  const stats = useMemo(() => {
    if (!dayMap) return { present: 0, absent: 0, late: 0, leave: 0, holidays: 0, working: 0 };
    let present = 0, absent = 0, late = 0, leave = 0, holidays = 0, working = 0;
    dayMap.forEach((rec) => {
      if (rec.isHoliday) { holidays++; return; }
      if (rec.isWeekend || rec.pending) return;
      const code = rec.status?.code;
      if (code === "P" || code === "P:A") present++;
      if (code === "A") absent++;
      if (code === "L") leave++;
      if (rec.status?.workMinutes > 0) working++;
      // late: checked in after 9:30
      const rawIn = rec.raw?.check_in;
      if (rawIn) {
        const [h, m] = rawIn.split(":").map(Number);
        if (h > 9 || (h === 9 && m > 30)) late++;
      }
    });
    return { present, absent, late, leave, holidays, working };
  }, [dayMap]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      <Stat
        icon={<CheckCircle2 size={20} className="text-emerald-600" />}
        iconBg="bg-emerald-50"
        label="Present"
        value={loading ? "—" : stats.present}
        sub="Days attended"
        accent="text-emerald-700"
      />
      <Stat
        icon={<XCircle size={20} className="text-red-500" />}
        iconBg="bg-red-50"
        label="Absent"
        value={loading ? "—" : stats.absent}
        sub="Days missed"
        accent="text-red-600"
      />
      <Stat
        icon={<AlertTriangle size={20} className="text-amber-500" />}
        iconBg="bg-amber-50"
        label="Late Arrivals"
        value={loading ? "—" : stats.late}
        sub="After 09:30"
        accent="text-amber-600"
      />
      <Stat
        icon={<Calendar size={20} className="text-purple-500" />}
        iconBg="bg-purple-50"
        label="On Leave"
        value={loading ? "—" : stats.leave}
        sub="Leave days"
        accent="text-purple-600"
      />
      <Stat
        icon={<TrendingUp size={20} className="text-blue-500" />}
        iconBg="bg-blue-50"
        label="Avg. Hours"
        value={loading ? "—" : summary.avgWork}
        sub="Per working day"
        accent="text-blue-700"
      />
      <Stat
        icon={<Clock size={20} className="text-[#f18200]" />}
        iconBg="bg-orange-50"
        label="Holidays"
        value={loading ? "—" : stats.holidays}
        sub="This month"
        accent="text-[#f18200]"
      />
    </div>
  );
});

export default SummaryCards;
