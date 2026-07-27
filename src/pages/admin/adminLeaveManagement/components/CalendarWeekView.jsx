import { memo } from "react";
import { cssClass } from "../../../../utils/classStyles";
import { DAYS, LEAVE_COLORS, B, BL } from "../constants/leaveConstants";

const CalendarWeekView = memo(({ cursor, leavesOnDay, getHolidaysOnDay, currentShiftDef, ltColorMap }) => {
  const weekStart = new Date(cursor);
  weekStart.setDate(cursor.getDate() - cursor.getDay());

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 })}>
      {weekDays.map((date, di) => {
        const isToday   = date.getTime() === today.getTime();
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const leaves    = leavesOnDay(date);
        const dayHols   = getHolidaysOnDay(date);
        const isHol     = dayHols.length > 0;

        return (
          <div key={di} className={cssClass({
            borderRadius: 10, minHeight: 160, padding: "10px 10px",
            border: `1.5px solid ${isHol ? currentShiftDef.color : isToday ? B : "#e9eaec"}`,
            background: isHol ? currentShiftDef.bg : isToday ? BL : isWeekend ? "#fafafa" : "#fff",
          })}>
            <div className={cssClass({ textAlign: "center", marginBottom: 6 })}>
              <div className={cssClass({ fontSize: 11, fontWeight: 700, color: isHol ? currentShiftDef.color : "#9ca3af", textTransform: "uppercase" })}>
                {DAYS[date.getDay()]}
              </div>
              <div className={cssClass({ fontSize: 20, fontWeight: 800, lineHeight: 1.1,
                color: isHol ? currentShiftDef.color : isToday ? B : "#111827" })}>
                {date.getDate()}
              </div>
            </div>

            {dayHols.map((h, hi) => (
              <div key={hi} className={cssClass({
                borderRadius: 5, padding: "4px 7px", marginBottom: 5,
                background: currentShiftDef.color, color: "#fff",
              })}>
                <div className={cssClass({ fontSize: 10, fontWeight: 800 })}>🎌 {h.holiday_name}</div>
                <div className={cssClass({ fontSize: 9, opacity: .8 })}>{currentShiftDef.label} Holiday</div>
              </div>
            ))}

            {leaves.length === 0 && dayHols.length === 0 && (
              <div className={cssClass({ fontSize: 11, color: "#d1d5db", textAlign: "center", marginTop: 12 })}>—</div>
            )}

            {leaves.map((r, ri) => {
              const c = ltColorMap[r.leave_type_id] || LEAVE_COLORS[0];
              return (
                <div key={ri} className={cssClass({
                  borderRadius: 6, padding: "5px 8px", marginBottom: 5,
                  background: c.bg, border: `1px solid ${c.border}`,
                })}>
                  <div className={cssClass({ fontSize: 11, fontWeight: 700, color: c.text })}>
                    {(r.employee_name || "").split(" ").slice(0, 2).join(" ")}
                  </div>
                  <div className={cssClass({ fontSize: 10, color: "#9ca3af" })}>{r.leave_type_name}</div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
});

CalendarWeekView.displayName = "CalendarWeekView";
export default CalendarWeekView;
