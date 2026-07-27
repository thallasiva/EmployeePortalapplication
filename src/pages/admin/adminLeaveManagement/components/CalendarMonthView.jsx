import { memo } from "react";
import { cssClass } from "../../../../utils/classStyles";
import { DAYS, LEAVE_COLORS, B, BL } from "../constants/leaveConstants";

const CalendarMonthView = memo(({ cursor, leavesOnDay, getHolidaysOnDay, currentShiftDef, ltColorMap }) => {
  const year  = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay  = new Date(year, month, 1).getDay();
  const daysCount = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysCount; d++) cells.push(new Date(year, month, d));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div>
      <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 4 })}>
        {DAYS.map((d) => (
          <div key={d} className={cssClass({ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#9ca3af",
            textTransform: "uppercase", letterSpacing: ".06em", padding: "6px 0" })}>
            {d}
          </div>
        ))}
      </div>

      <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 })}>
        {cells.map((date, i) => {
          if (!date) return <div key={`e${i}`} />;
          const isToday    = date.getTime() === today.getTime();
          const leaves     = leavesOnDay(date);
          const isWeekend  = date.getDay() === 0 || date.getDay() === 6;
          const dayHolidays = getHolidaysOnDay(date);
          const isHol      = dayHolidays.length > 0;

          return (
            <div key={date.getDate()} className={cssClass({
              minHeight: 80, borderRadius: 8, padding: "6px 7px",
              background: isHol ? currentShiftDef.bg : isToday ? BL : isWeekend ? "#fafafa" : "#fff",
              border: `1.5px solid ${isHol ? currentShiftDef.color : isToday ? B : "#e9eaec"}`,
            })}>
              <div className={cssClass({ fontSize: 12, fontWeight: isToday ? 800 : 500,
                color: isHol ? currentShiftDef.color : isToday ? B : isWeekend ? "#9ca3af" : "#374151",
                marginBottom: 3, display: "flex", alignItems: "center", gap: 3 })}>
                {date.getDate()}
                {isHol && (
                  <span className={cssClass({ fontSize: 9, fontWeight: 800, color: currentShiftDef.color })}>★</span>
                )}
              </div>

              {dayHolidays.map((h, hi) => (
                <div key={hi} title={h.holiday_name} className={cssClass({
                  fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 3, marginBottom: 2,
                  background: currentShiftDef.color, color: "#fff",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                })}>
                  {h.holiday_name}
                </div>
              ))}

              {leaves.slice(0, Math.max(0, 3 - dayHolidays.length)).map((r, ri) => {
                const c = ltColorMap[r.leave_type_id] || LEAVE_COLORS[0];
                return (
                  <div key={ri} title={`${r.employee_name} – ${r.leave_type_name}`}
                    className={cssClass({ fontSize: 10, fontWeight: 600, padding: "1px 5px", borderRadius: 4,
                      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
                      marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>
                    {(r.employee_name || "").split(" ")[0]}
                  </div>
                );
              })}

              {leaves.length > 3 - dayHolidays.length && (
                <div className={cssClass({ fontSize: 9, color: "#9ca3af", fontWeight: 600 })}>
                  +{leaves.length - (3 - dayHolidays.length)} more
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

CalendarMonthView.displayName = "CalendarMonthView";
export default CalendarMonthView;
