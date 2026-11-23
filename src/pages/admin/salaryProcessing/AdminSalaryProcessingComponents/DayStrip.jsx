import React from "react";
import { DAY_STYLE } from "./shared";
function DayStrip({
  days
}) {
  return <div className="flex flex-wrap gap-1" role="list" aria-label="Day-by-day attendance">
      {days.map(d => {
      const st = DAY_STYLE[d.type] || DAY_STYLE.upcoming;
      const day = Number(d.date.slice(8));
      const dark = !["weekly_off", "upcoming", "not_employed"].includes(d.type);
      return <div key={d.date} role="listitem" title={`${d.date} — ${st.label}${d.label ? `: ${d.label}` : ""}${d.lop ? ` · LOP ${d.lop}` : ""}${d.worked ? " · worked" : ""}`} className={`w-7 h-8 rounded-md flex flex-col items-center justify-center text-[10px] font-bold border ${dark ? "text-white border-transparent" : "text-slate-500 border-slate-200"}`} style={{
        background: st.bg
      }}>
            {day}
            {d.lop ? <span className="text-[8px] leading-none opacity-90">−{d.lop}</span> : null}
          </div>;
    })}
    </div>;
}
export { DayStrip };
