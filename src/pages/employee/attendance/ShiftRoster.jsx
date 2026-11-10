import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Sun, Moon, Sunset } from "lucide-react";
import { getLoggedInUser, toISODateString } from "../../../lib/dateUtils";
import { getShiftForUser } from "../../../data/auth";
import { getMyWorkSchedule } from "../../../api/workSchedule.api";
const SHIFTS = {
  general: { id: "general", name: "General Shift", time: "09:00 AM – 06:00 PM", break: "1h lunch", icon: Sun,  color: "text-amber-500",  bg: "bg-amber-50",  ring: "ring-amber-300",  badge: "bg-amber-100 text-amber-800" },
  mid:     { id: "mid",     name: "Mid Shift",     time: "01:00 PM – 10:00 PM", break: "1h dinner",  icon: Sunset, color: "text-indigo-500", bg: "bg-indigo-50", ring: "ring-indigo-300", badge: "bg-indigo-100 text-indigo-800" },
  night:   { id: "night",  name: "Night Shift",   time: "10:00 PM – 07:00 AM", break: "1h break",  icon: Moon,  color: "text-slate-500",  bg: "bg-slate-50",  ring: "ring-slate-300",  badge: "bg-slate-100 text-slate-700" },
};
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  d.setHours(12, 0, 0, 0);
  return d;
}
function buildWeekRoster(weekStart, userShift, workDays) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const weekday = date.toLocaleDateString("en-GB", { weekday: "short" }).toLowerCase().slice(0, 3);
    const isWeekend = !workDays.includes(weekday);
    return {
      iso: toISODateString(date),
      weekday: date.toLocaleDateString("en-GB", { weekday: "long" }),
      shortDay: date.toLocaleDateString("en-GB", { weekday: "short" }),
      dateNum: date.getDate(),
      month: date.toLocaleDateString("en-GB", { month: "short" }),
      isWeekend,
      isToday: toISODateString(new Date()) === toISODateString(date),
      shift: isWeekend ? { name: "Week Off", time: "—", break: "—" } : userShift,
    };
  });
}
export default function ShiftRoster() {
  const [user] = useState(getLoggedInUser);
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [schedule, setSchedule] = useState(null);
  const [scheduleError, setScheduleError] = useState("");
  useEffect(() => {
    getMyWorkSchedule()
      .then(setSchedule)
      .catch(() => setScheduleError("Your latest schedule could not be loaded. Showing your profile shift instead."));
  }, []);
  const userShift = useMemo(() => {
    const shiftId = getShiftForUser(user);
    const base = SHIFTS[shiftId] || SHIFTS.general;
    if (!schedule?.start_time && !schedule?.end_time) return base;
    const format = (time) => {
      if (!time) return "";
      const [hour, minute] = time.slice(0, 5).split(":").map(Number);
      return `${String(hour % 12 || 12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
    };
    return {
      ...base,
      name: schedule.schedule_type === "rotational" ? "Rotational Shift" : "Assigned Schedule",
      time: `${format(schedule.start_time)} – ${format(schedule.end_time)}`,
    };
  }, [user, schedule]);
  const workDays = schedule?.work_days?.length ? schedule.work_days : ["mon", "tue", "wed", "thu", "fri"];
  const week = useMemo(() => buildWeekRoster(weekStart, userShift, workDays), [weekStart, userShift, workDays]);
  const weekLabel = `${week[0].dateNum} ${week[0].month} – ${week[6].dateNum} ${week[6].month} ${weekStart.getFullYear()}`;
  const ShiftIcon = userShift.icon;
  const goWeek = (delta) => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + delta * 7);
    setWeekStart(getWeekStart(next));
  };
  return (
    <div className="space-y-4 rounded-2xl bg-slate-50 p-3 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white"><CalendarDays size={20} /></span>
          <div><h1 className="text-xl font-bold tracking-tight text-slate-950">Shift &amp; Schedule</h1><p className="mt-0.5 text-sm text-slate-500">View your assigned shift and weekly roster.</p></div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button type="button" onClick={() => goWeek(-1)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" aria-label="Prev week">
            <ChevronLeft size={20} />
          </button>
          <span className="px-3 text-sm font-semibold text-slate-800 min-w-[10rem] text-center">{weekLabel}</span>
          <button type="button" onClick={() => goWeek(1)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" aria-label="Next week">
            <ChevronRight size={20} />
          </button>
          <button type="button" onClick={() => setWeekStart(getWeekStart(new Date()))} className="ml-1 px-3 py-1.5 text-xs font-semibold text-[#e87500] hover:bg-orange-50 rounded-lg transition-colors">
            Today
          </button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(260px,.8fr)_minmax(0,1.6fr)]">
      <div className={`flex items-center gap-4 rounded-xl border border-slate-200 ${userShift.bg} p-5 shadow-sm`}>
        <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${userShift.bg} ring-2 ${userShift.ring}`}>
          <ShiftIcon size={28} className={userShift.color} />
        </div>
        <div>
          <p className="mb-0.5 text-xs font-bold uppercase tracking-widest text-slate-500">Current Shift</p>
          <p className="text-lg font-bold text-slate-950">{userShift.name}</p>
          <p className="text-sm text-slate-600 mt-0.5">{userShift.time} &nbsp;·&nbsp; Break: {userShift.break}</p>
        </div>
        <span className={`ml-auto px-3 py-1.5 rounded-full text-sm font-bold ${userShift.badge}`}>
          Active
        </span>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3"><Clock size={17} className="text-blue-600"/><h2 className="font-semibold text-slate-900">This Week's Schedule</h2></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr>{['Date','Shift','Time','Break','Status'].map((label)=><th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{week.map((day)=><tr key={day.iso} className={day.isToday?'bg-blue-50/70':''}><td className="px-4 py-2.5 font-medium text-slate-800">{day.shortDay}, {day.month} {day.dateNum}{day.isToday&&<span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">Today</span>}</td><td className="px-4 py-2.5">{day.shift.name}</td><td className="px-4 py-2.5">{day.shift.time}</td><td className="px-4 py-2.5">{day.shift.break||userShift.break}</td><td className="px-4 py-2.5"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${day.isWeekend?'bg-slate-100 text-slate-500':'bg-emerald-100 text-emerald-700'}`}>{day.isWeekend?'Week Off':'Scheduled'}</span></td></tr>)}</tbody></table></div>
      </div>
      </div>
    </div>
  );
}
