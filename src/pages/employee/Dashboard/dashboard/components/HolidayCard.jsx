import React from "react";
import { Link } from "react-router-dom";
import { cssClass } from "../../../../../utils/classStyles";
import { fmtHolDate } from "../utils/formatters";

const HolidayCard = React.memo(function HolidayCard({ loading, holidays }) {
  return (
    <div className={cssClass({ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", padding: 20 })}>
      <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 })}>
        <span className={cssClass({ fontSize: 15, fontWeight: 700, color: "#1e293b" })}>Upcoming Holidays</span>
        <Link to="/employee/leave/holiday-calendar" className={cssClass({ fontSize: 12, color: "#f18200", fontWeight: 600, textDecoration: "none" })}>
          View All →
        </Link>
      </div>
      {loading ? (
        <div className={cssClass({ color: "#94a3b8", fontSize: 13 })}>Loading…</div>
      ) : holidays.length === 0 ? (
        <div className={cssClass({ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "16px 0" })}>
          No upcoming holidays.
        </div>
      ) : (
        <div className={cssClass({ display: "flex", flexDirection: "column", gap: 12 })}>
          {holidays.map((hol) => {
            const dateStr = hol.holiday_date || hol.date;
            const { badge, weekday } = fmtHolDate(dateStr);
            return (
              <div key={hol.holiday_id || dateStr} className={cssClass({ display: "flex", alignItems: "center", gap: 14 })}>
                <div className={cssClass({
                  background: "#fff8f0", border: "1px solid #fde8c8",
                  borderRadius: 8, padding: "6px 10px", textAlign: "center", minWidth: 52,
                })}>
                  <div className={cssClass({ fontSize: 13, fontWeight: 800, color: "#f18200" })}>{badge.split(" ")[0]}</div>
                  <div className={cssClass({ fontSize: 10, color: "#94a3b8" })}>{badge.split(" ")[1]}</div>
                </div>
                <div>
                  <div className={cssClass({ fontSize: 13, fontWeight: 600, color: "#1e293b" })}>
                    {hol.holiday_name || hol.name}
                  </div>
                  <div className={cssClass({ fontSize: 11, color: "#94a3b8" })}>{weekday}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default HolidayCard;
