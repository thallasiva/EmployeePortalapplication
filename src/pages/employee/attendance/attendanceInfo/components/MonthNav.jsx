import React from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";

function fmt(t) {
  if (!t) return null;
  const s = String(t);
  const time = s.includes("T") ? s.slice(11, 16) : s.slice(0, 5);
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h % 12) || 12)}:${String(m).padStart(2, "0")} ${suffix}`;
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export default function MonthNav({ month, year, today, onPrevMonth, onNextMonth }) {
  const checkIn  = today ? fmt(today.check_in)  : null;
  const checkOut = today ? fmt(today.check_out) : null;

  return (
    <div className="bg-white border-b-2 border-[#f18200] sticky top-0 z-30 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#f18200] flex items-center justify-center shadow-sm shrink-0">
            <span className="text-white text-sm font-black">AT</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">My Attendance</p>
            <div className="flex items-center gap-2 mt-0.5">
              <button onClick={onPrevMonth} className="text-slate-400 hover:text-[#f18200] transition-colors">
                <ChevronLeft size={15} />
              </button>
              <span className="text-base font-black text-slate-800 tabular-nums">
                {MONTH_NAMES[month - 1]} {year}
              </span>
              <button onClick={onNextMonth} className="text-slate-400 hover:text-[#f18200] transition-colors">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Today punch pill */}
        {(checkIn || checkOut) && (
          <div className="flex items-center gap-0 rounded-xl border-2 border-slate-200 overflow-hidden text-sm shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-green-50">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">IN</span>
              <span className="text-sm font-black text-green-700 tabular-nums">{checkIn ?? "—"}</span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="flex items-center gap-1.5 px-3 py-2 bg-orange-50">
              <span className="w-2 h-2 rounded-full bg-[#f18200] shrink-0" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">OUT</span>
              <span className="text-sm font-black text-[#f18200] tabular-nums">{checkOut ?? "—"}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
