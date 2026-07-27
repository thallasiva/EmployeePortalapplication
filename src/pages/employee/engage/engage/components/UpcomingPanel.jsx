import React, { useMemo } from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { fullName, anniversaryThisYear, daysFromToday, labelForDays, yearsCompleted } from "../utils";

const UpcomingPanel = React.memo(function UpcomingPanel({ employees, holidays }) {
  const upcoming = useMemo(() => {
    const list = [];

    for (const h of holidays) {
      const off = daysFromToday(h.holiday_date);
      if (off >= 0 && off <= 30)
        list.push({ name: h.holiday_name, off, emoji: h.is_restricted ? "🔒" : "📅", isHoliday: true });
    }

    for (const emp of employees) {
      const name = fullName(emp);
      const bd = anniversaryThisYear(emp.dob);
      if (bd) {
        const off = daysFromToday(bd);
        if (off >= 0 && off <= 14) list.push({ name, off, emoji: "🎂" });
      }
      const an = anniversaryThisYear(emp.emp_joining_date);
      if (an && yearsCompleted(emp.emp_joining_date) >= 1) {
        const off = daysFromToday(an);
        if (off >= 0 && off <= 14) list.push({ name, off, emoji: "🏆" });
      }
    }

    return list.sort((a, b) => a.off - b.off).slice(0, 8);
  }, [employees, holidays]);

  return (
    <div className={cssClass({ background: "#fff", border: "1px solid #e8edf2", borderRadius: 12, padding: 16 })}>
      <p className={cssClass({ fontSize: 13, fontWeight: 600, color: "#1a2233", margin: "0 0 12px" })}>
        📅 Coming Up (30 days)
      </p>
      {upcoming.length === 0 ? (
        <p className={cssClass({ fontSize: 12, color: "#9ca8b5", margin: 0 })}>Nothing upcoming.</p>
      ) : (
        <div className={cssClass({ display: "flex", flexDirection: "column", gap: 10 })}>
          {upcoming.map((it, i) => (
            <div key={i} className={cssClass({ display: "flex", alignItems: "center", gap: 9 })}>
              <span className={cssClass({ fontSize: 18, flexShrink: 0 })}>{it.emoji}</span>
              <div className={cssClass({ minWidth: 0 })}>
                <p className={cssClass({
                  fontSize: 12, fontWeight: 600, color: "#1a2233", margin: 0,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                })}>
                  {it.isHoliday ? it.name : it.name.split(" ")[0]}
                </p>
                <p className={cssClass({ fontSize: 11, color: "#9ca8b5", margin: 0 })}>
                  {it.off === 0 ? "Today!" : labelForDays(it.off)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default UpcomingPanel;
