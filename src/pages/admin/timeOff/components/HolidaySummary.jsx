import React, { useMemo } from "react";
import { cssClass } from "../../../../utils/classStyles";
import { SHIFTS, MONTHS } from "../constants";
import { fmtDate, dayName, parseLocalDate } from "../utils/dateUtils";

const HolidaySummary = React.memo(({ allHolidays, year, locationFilter }) => {
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  const base = useMemo(
    () => locationFilter ? allHolidays.filter((h) => h.location === locationFilter) : allHolidays,
    [allHolidays, locationFilter]
  );

  const shiftCounts = useMemo(() =>
    SHIFTS.map((s) => ({
      ...s,
      total:    base.filter((h) => h.shift === s.key).length,
      upcoming: base.filter((h) => h.shift === s.key && parseLocalDate(h.holiday_date) >= today).length,
    })),
    [base, today]
  );

  const nextHoliday = useMemo(() =>
    [...base]
      .filter((h) => parseLocalDate(h.holiday_date) >= today)
      .sort((a, b) => parseLocalDate(a.holiday_date) - parseLocalDate(b.holiday_date))[0],
    [base, today]
  );

  const thisMonth = useMemo(() =>
    base.filter((h) => {
      const d = parseLocalDate(h.holiday_date);
      return d && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    }),
    [base, today]
  );

  return (
    <div className={cssClass({ background: "#fff", border: "1px solid #e9eaec", borderRadius: 14,
      boxShadow: "0 1px 6px #0000000a", overflow: "hidden" })}>
      {/* header */}
      <div className={cssClass({ padding: "18px 20px", borderBottom: "1px solid #e9eaec" })}>
        <div className={cssClass({ fontSize: 16, fontWeight: 800, color: "#111827",
          fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" })}>Holiday Summary</div>
        <div className={cssClass({ fontSize: 11, color: "#9ca3af", marginTop: 2 })}>
          01 Jan – 31 Dec {year}{locationFilter ? ` · ${locationFilter}` : ""}
        </div>
      </div>

      {/* by shift */}
      <div className={cssClass({ padding: "16px 20px", borderBottom: "1px solid #e9eaec" })}>
        <div className={cssClass({ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase",
          letterSpacing: ".06em", marginBottom: 12 })}>By Shift</div>
        <div className={cssClass({ display: "flex", flexDirection: "column", gap: 10 })}>
          {shiftCounts.map((s) => (
            <div key={s.key} className={cssClass({ display: "flex", alignItems: "center",
              background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: "10px 14px" })}>
              <span className={cssClass({ color: s.color, marginRight: 8 })}>{s.icon}</span>
              <div className={cssClass({ flex: 1 })}>
                <div className={cssClass({ fontSize: 12, fontWeight: 700, color: s.color })}>{s.label}</div>
                <div className={cssClass({ fontSize: 11, color: "#9ca3af" })}>{s.upcoming} upcoming</div>
              </div>
              <div className={cssClass({ fontSize: 22, fontWeight: 900, color: s.color })}>{s.total}</div>
            </div>
          ))}
        </div>
      </div>

      {/* this month */}
      <div className={cssClass({ padding: "16px 20px", borderBottom: "1px solid #e9eaec" })}>
        <div className={cssClass({ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase",
          letterSpacing: ".06em", marginBottom: 10 })}>This Month ({MONTHS[today.getMonth()]})</div>
        {thisMonth.length === 0 ? (
          <p className={cssClass({ fontSize: 12, color: "#9ca3af" })}>No holidays this month.</p>
        ) : thisMonth.map((h, i) => {
          const s = SHIFTS.find((x) => x.key === h.shift) || SHIFTS[0];
          return (
            <div key={i} className={cssClass({ display: "flex", alignItems: "center", gap: 10, padding: "7px 0",
              borderBottom: i < thisMonth.length - 1 ? "1px solid #f5f5f5" : "none" })}>
              <span className={cssClass({ color: s.color })}>{s.icon}</span>
              <div className={cssClass({ flex: 1 })}>
                <div className={cssClass({ fontSize: 12, fontWeight: 600, color: "#111827" })}>{h.holiday_name}</div>
                <div className={cssClass({ fontSize: 11, color: "#9ca3af" })}>
                  {fmtDate(h.holiday_date)} · {s.label.split(" ")[0]}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* next holiday */}
      <div className={cssClass({ padding: "16px 20px" })}>
        <div className={cssClass({ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase",
          letterSpacing: ".06em", marginBottom: 10 })}>Next Holiday</div>
        {!nextHoliday ? (
          <p className={cssClass({ fontSize: 12, color: "#9ca3af" })}>No upcoming holidays for {year}.</p>
        ) : (() => {
          const s = SHIFTS.find((x) => x.key === nextHoliday.shift) || SHIFTS[0];
          const d = parseLocalDate(nextHoliday.holiday_date);
          const diff = Math.ceil((d - today) / 86400000);
          return (
            <div className={cssClass({ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10,
              padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-start" })}>
              <div className={cssClass({ background: s.color, color: "#fff", borderRadius: 8,
                padding: "6px 10px", textAlign: "center", minWidth: 48 })}>
                <div className={cssClass({ fontSize: 20, fontWeight: 900, lineHeight: 1 })}>{d.getDate()}</div>
                <div className={cssClass({ fontSize: 9, textTransform: "uppercase", marginTop: 2 })}>
                  {MONTHS[d.getMonth()]?.slice(0, 3)}
                </div>
              </div>
              <div>
                <div className={cssClass({ fontSize: 14, fontWeight: 700, color: "#111827" })}>{nextHoliday.holiday_name}</div>
                <div className={cssClass({ fontSize: 11, color: "#9ca3af", marginTop: 2 })}>{dayName(nextHoliday.holiday_date)}</div>
                <div className={cssClass({ fontSize: 11, color: s.color, fontWeight: 700, marginTop: 3 })}>
                  {diff === 0 ? "Today!" : diff === 1 ? "Tomorrow" : `In ${diff} days`} · {s.label}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
});

HolidaySummary.displayName = "HolidaySummary";
export default HolidaySummary;
