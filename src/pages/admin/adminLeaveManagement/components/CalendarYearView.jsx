import { memo } from "react";
import { cssClass } from "../../../../utils/classStyles";
import { MON } from "../constants/leaveConstants";

const CalendarYearView = memo(({ cursor, filtered, shiftHolidays, currentShiftDef }) => {
  const year = cursor.getFullYear();

  const empIds = [...new Set(
    filtered
      .filter((r) => {
        const y = new Date(r.from_date).getFullYear();
        return y === year || new Date(r.to_date).getFullYear() === year;
      })
      .map((r) => r.employee_id),
  )];

  const holidayMonths = new Set(
    shiftHolidays
      .filter((h) => new Date(h.holiday_date).getFullYear() === year)
      .map((h) => new Date(h.holiday_date).getMonth()),
  );

  return (
    <div className={cssClass({ overflowX: "auto" })}>
      <table className={cssClass({ borderCollapse: "collapse", fontSize: 11, minWidth: 900 })}>
        <thead>
          <tr>
            <th className={cssClass({ padding: "6px 10px", textAlign: "left", color: "#9ca3af", fontWeight: 700,
              width: 160, position: "sticky", left: 0, background: "#fff", zIndex: 2 })}>
              Employee
            </th>
            {MON.map((m, mi) => (
              <th key={m} className={cssClass({
                padding: "6px 4px", textAlign: "center", fontWeight: 700, width: 60,
                color: holidayMonths.has(mi) ? currentShiftDef.color : "#9ca3af",
              })}>
                {m}
                {holidayMonths.has(mi) && (
                  <div className={cssClass({ fontSize: 8, color: currentShiftDef.color })}>🎌</div>
                )}
              </th>
            ))}
          </tr>

          <tr className={cssClass({ background: currentShiftDef.bg })}>
            <td className={cssClass({ padding: "4px 10px", fontSize: 10, fontWeight: 700,
              color: currentShiftDef.color, position: "sticky", left: 0,
              background: currentShiftDef.bg, zIndex: 1 })}>
              {currentShiftDef.icon}&nbsp;Holidays
            </td>
            {Array.from({ length: 12 }, (_, mi) => {
              const monthHols = shiftHolidays.filter((h) => {
                const d = new Date(h.holiday_date);
                return d.getFullYear() === year && d.getMonth() === mi;
              });
              return (
                <td key={mi} className={cssClass({ padding: "4px 4px", textAlign: "center" })}>
                  {monthHols.length > 0 ? (
                    <div title={monthHols.map((h) => h.holiday_name).join(", ")} className={cssClass({
                      fontSize: 9, fontWeight: 700, color: currentShiftDef.color,
                      background: currentShiftDef.border, borderRadius: 4, padding: "1px 4px", display: "inline-block",
                    })}>
                      {monthHols.length}H
                    </div>
                  ) : (
                    <span className={cssClass({ color: "#e5e7eb" })}>–</span>
                  )}
                </td>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {empIds.length === 0 && (
            <tr>
              <td colSpan={13} className={cssClass({ textAlign: "center", padding: 40, color: "#9ca3af" })}>
                No approved leaves for {year} in {currentShiftDef.label}
              </td>
            </tr>
          )}

          {empIds.map((empId) => {
            const empReqs = filtered.filter((r) => String(r.employee_id) === String(empId));
            const name = empReqs[0]?.employee_name || empId;
            return (
              <tr key={empId} className={cssClass({ borderTop: "1px solid #f0f0f0" })}>
                <td className={cssClass({ padding: "8px 10px", fontWeight: 600, color: "#1a1a1a",
                  position: "sticky", left: 0, background: "#fff", zIndex: 1 })}>
                  <div className={cssClass({ fontSize: 12 })}>{name}</div>
                  <div className={cssClass({ fontSize: 10, color: "#9ca3af" })}>{empReqs[0]?.emp_code}</div>
                </td>
                {Array.from({ length: 12 }, (_, mi) => {
                  const mReqs = empReqs.filter((r) => {
                    const f = new Date(r.from_date), t = new Date(r.to_date);
                    return (f.getFullYear() === year && f.getMonth() === mi) ||
                           (t.getFullYear() === year && t.getMonth() === mi);
                  });
                  const totalDays = mReqs.reduce((s, r) => s + Number(r.days || 0), 0);
                  const intensity = Math.min(totalDays / 5, 1);
                  const hasHol   = holidayMonths.has(mi);
                  return (
                    <td key={mi} className={cssClass({ padding: "6px 4px", textAlign: "center",
                      background: hasHol ? `${currentShiftDef.bg}88` : "transparent" })}>
                      {totalDays > 0 ? (
                        <div title={mReqs.map((r) => r.leave_type_name).join(", ")} className={cssClass({
                          width: 36, height: 28, borderRadius: 6, margin: "0 auto",
                          background: `rgba(241,130,0,${0.15 + intensity * 0.75})`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 700, color: intensity > 0.5 ? "#fff" : "#92400e",
                        })}>
                          {totalDays}d
                        </div>
                      ) : (
                        <div className={cssClass({ width: 36, height: 28, borderRadius: 6, margin: "0 auto",
                          background: hasHol ? `${currentShiftDef.border}44` : "#f9fafb" })} />
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

CalendarYearView.displayName = "CalendarYearView";
export default CalendarYearView;
