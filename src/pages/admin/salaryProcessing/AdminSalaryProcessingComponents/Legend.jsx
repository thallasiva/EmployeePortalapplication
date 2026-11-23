import React from "react";
import { DAY_STYLE } from "./shared";
function Legend() {
  return <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {["present", "late", "half_day", "paid_leave", "unpaid_leave", "absent", "pending_leave", "holiday", "weekly_off"].map(k => <span key={k} className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="w-3 h-3 rounded-sm border border-slate-200" style={{
        background: DAY_STYLE[k].bg
      }} />{DAY_STYLE[k].label}
        </span>)}
    </div>;
}
/* ---------- adjustment dialog ---------- */
export { Legend };
