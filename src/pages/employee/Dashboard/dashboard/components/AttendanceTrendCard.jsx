import React, { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { getMyMonthlyAttendance } from "../../../../../api/attendance.api";

const rowsFrom = (result) => Array.isArray(result) ? result : result?.data || [];
const presentCount = (rows) => rows.filter((row) => ["present", "late", "half_day", "half day"].includes(String(row.status || "").toLowerCase())).length;

export default function AttendanceTrendCard() {
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const now = new Date();
    const dates = Array.from({ length: 6 }, (_, index) => new Date(now.getFullYear(), now.getMonth() - 5 + index, 1));
    Promise.all(dates.map((date) => getMyMonthlyAttendance({ month: date.getMonth() + 1, year: date.getFullYear() }).catch(() => [])))
      .then((results) => setMonths(results.map((result, index) => ({ label: dates[index].toLocaleDateString("en-IN", { month: "short" }), value: presentCount(rowsFrom(result)) }))))
      .finally(() => setLoading(false));
  }, []);
  const max = Math.max(1, ...months.map((item) => item.value));
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between"><h2 className="flex items-center gap-1.5 text-xs font-bold text-slate-900"><TrendingUp size={14} className="text-[#e87500]"/>Attendance Trend</h2><span className="text-[9px] text-slate-500">Last 6 months</span></div>
      <div className="flex h-[94px] items-end gap-2 border-b border-l border-slate-100 px-2 pb-1">
        {months.map((item) => <div key={item.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"><span className="text-[8px] font-semibold text-slate-500">{loading ? "" : item.value}</span><div className="w-full max-w-8 rounded-t-md bg-orange-400" style={{ height: `${Math.max(6, item.value / max * 66)}%` }}/><span className="text-[8px] text-slate-500">{item.label}</span></div>)}
      </div>
    </section>
  );
}
