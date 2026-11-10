import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { getMyMonthlyAttendance } from "../../../../../api/attendance.api";

const toDateKey = (value) => String(value || "").slice(0, 10);
const statusFor = (value) => {
  const status = String(value || "").toLowerCase().replace(/[ -]/g, "_");
  if (["present", "p", "half_day", "halfday"].includes(status)) return "present";
  if (["late", "p:a", "present_late"].includes(status)) return "late";
  if (["leave", "on_leave", "l"].includes(status)) return "leave";
  if (["absent", "a"].includes(status)) return "absent";
  if (["holiday", "week_off", "weekend", "off"].includes(status)) return "off";
  return "";
};

const MonthlyAttendanceCard = React.memo(function MonthlyAttendanceCard({ rows = [], loading }) {
  const today = new Date();
  const [monthOffset, setMonthOffset] = useState(0);
  const [calendarRows, setCalendarRows] = useState(rows);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const shownMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = shownMonth.getFullYear();
  const month = shownMonth.getMonth();
  const monthLabel = shownMonth.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = new Date(year, month, 1).getDay();
  useEffect(() => {
    if (monthOffset === 0) { setCalendarRows(rows); setCalendarLoading(false); return; }
    setCalendarLoading(true);
    getMyMonthlyAttendance({ month: month + 1, year })
      .then((result) => setCalendarRows(Array.isArray(result) ? result : result?.data || []))
      .catch(() => setCalendarRows([]))
      .finally(() => setCalendarLoading(false));
  }, [monthOffset, month, year, rows]);
  const records = useMemo(() => new Map(calendarRows.map((row) => [toDateKey(row.attendance_date || row.date), statusFor(row.status)])), [calendarRows]);
  const totals = useMemo(() => calendarRows.reduce((result, row) => {
    const status = statusFor(row.status);
    if (status === "present" || status === "late") result.present += 1;
    if (status === "absent") result.absent += 1;
    return result;
  }, { present: 0, absent: 0 }), [calendarRows]);
  const cellClass = {
    present: "bg-emerald-100 text-emerald-800",
    late: "bg-amber-100 text-amber-800",
    leave: "bg-violet-100 text-violet-800",
    absent: "bg-rose-100 text-rose-800",
    off: "bg-slate-100 text-slate-400",
    selected: "bg-[#e87500] text-white",
  };
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-1"><h2 className="flex items-center gap-1.5 text-xs font-bold text-slate-900"><CalendarDays size={14} className="text-[#e87500]"/>Monthly Attendance</h2><div className="flex items-center gap-1"><button type="button" onClick={()=>setMonthOffset((value)=>value-1)} aria-label="Previous month" className="rounded p-0.5 text-slate-500 hover:bg-orange-50 hover:text-[#e87500]"><ChevronLeft size={13}/></button><span className="min-w-12 text-center text-[9px] font-semibold text-slate-500">{monthLabel}</span><button type="button" onClick={()=>setMonthOffset((value)=>Math.min(value+1,0))} disabled={monthOffset===0} aria-label="Next month" className="rounded p-0.5 text-slate-500 hover:bg-orange-50 hover:text-[#e87500] disabled:opacity-30"><ChevronRight size={13}/></button></div></div>
      <div className="mb-1 grid grid-cols-7 text-center text-[9px] font-bold text-slate-400">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day)=><span key={day} className="py-1">{day.slice(0,2)}</span>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlanks }, (_, i) => <span key={`blank-${i}`} className="h-[18px]"/>)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = new Date(year, month, day);
          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = monthOffset === 0 && day === today.getDate();
          const recordStatus = records.get(key);
          const isPast = monthOffset < 0 || day < today.getDate();
          const status = recordStatus || (isPast && date.getDay() !== 0 && date.getDay() !== 6 ? "absent" : date.getDay() === 0 || date.getDay() === 6 ? "off" : "");
          return <span key={key} title={`${key}${status ? ` · ${status}` : ""}`} className={`grid h-[18px] place-items-center rounded text-[8px] font-bold ${isToday ? cellClass.selected : cellClass[status] || "text-slate-600"}`}>{day}</span>;
        })}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-t border-slate-100 pt-2">
        <div className="flex flex-wrap gap-x-2 text-[8px] font-medium text-slate-500">{[["Present","bg-emerald-500"],["Absent","bg-rose-500"],["Late","bg-amber-500"],["Leave","bg-violet-500"]].map(([label,color])=><span key={label} className="inline-flex items-center gap-1"><i className={`h-1.5 w-1.5 rounded-full ${color}`}/>{label}</span>)}</div>
        <span className="text-[9px] font-semibold text-slate-600">{loading || calendarLoading ? "…" : `${totals.present} Present · ${totals.absent} Absent`}</span>
      </div>
    </section>
  );
});

export default MonthlyAttendanceCard;
