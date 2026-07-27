import React, { useMemo, useState } from "react";
import { Calendar, MapPin, Edit2, Trash2 } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { SHIFTS, B, BL } from "../constants";
import { fmtDate, dayName, parseLocalDate } from "../utils/dateUtils";
import Btn from "./Btn";

const TH = ({ children }) => (
  <th className={cssClass({ padding: "10px 14px", fontWeight: 700, fontSize: 11, color: "#9ca3af",
    textTransform: "uppercase", letterSpacing: ".06em", textAlign: "left",
    borderBottom: "1px solid #e9eaec", background: "#fafafa", whiteSpace: "nowrap" })}>
    {children}
  </th>
);

const ShiftHolidayTable = React.memo(({ shift, year, locationFilter, allHolidays, onEdit, onDelete }) => {
  const today = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  }, []);

  const filtered = useMemo(() =>
    allHolidays
      .filter((h) => h.shift === shift.key && (!locationFilter || h.location === locationFilter))
      .sort((a, b) => parseLocalDate(a.holiday_date) - parseLocalDate(b.holiday_date)),
    [allHolidays, shift.key, locationFilter]
  );

  const upcoming = useMemo(() => filtered.filter((h) => parseLocalDate(h.holiday_date) >= today), [filtered, today]);
  const past     = useMemo(() => filtered.filter((h) => parseLocalDate(h.holiday_date) < today),  [filtered, today]);
  const [tab, setTab] = useState("upcoming");
  const rows = tab === "upcoming" ? upcoming : past;

  return (
    <div>
      <div className={cssClass({ display: "flex", gap: 0, borderBottom: "2px solid #e9eaec", marginBottom: 18 })}>
        {[
          { key: "upcoming", label: `Upcoming (${upcoming.length})` },
          { key: "history",  label: `History (${past.length})` },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cssClass({ padding: "8px 16px", fontSize: 12,
              fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? shift.color : "#9ca3af",
              background: "none", border: "none", cursor: "pointer",
              borderBottom: tab === t.key ? `2px solid ${shift.color}` : "2px solid transparent",
              marginBottom: -2, transition: "color .15s" })}>
            {t.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className={cssClass({ textAlign: "center", padding: "32px 0", color: "#9ca3af" })}>
          <Calendar size={32} className={cssClass({ opacity: .3, margin: "0 auto 10px", display: "block" })} />
          <p className={cssClass({ fontSize: 13 })}>
            No {tab === "upcoming" ? "upcoming" : "past"} holidays for {shift.label} in {year}
            {locationFilter ? ` · ${locationFilter}` : ""}
          </p>
        </div>
      ) : (
        <div className={cssClass({ border: "1px solid #e9eaec", borderRadius: 12, overflow: "hidden" })}>
          <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 13 })}>
            <thead>
              <tr><TH>#</TH><TH>Date</TH><TH>Day</TH><TH>Holiday</TH><TH>Location</TH><TH>Type</TH><TH></TH></tr>
            </thead>
            <tbody>
              {rows.map((h, idx) => {
                const isToday = parseLocalDate(h.holiday_date)?.toDateString() === today.toDateString();
                return (
                  <tr key={h.holiday_id}
                    onMouseEnter={(e) => e.currentTarget.style.background = shift.bg}
                    onMouseLeave={(e) => e.currentTarget.style.background = isToday ? BL : idx % 2 === 0 ? "#fff" : "#fafafa"}
                    className={cssClass({ background: isToday ? BL : idx % 2 === 0 ? "#fff" : "#fafafa" })}>
                    <td className={cssClass({ padding: "11px 14px", color: "#9ca3af", fontWeight: 600 })}>{idx + 1}</td>
                    <td className={cssClass({ padding: "11px 14px", whiteSpace: "nowrap", fontWeight: 600, color: "#111827" })}>
                      {fmtDate(h.holiday_date)}
                      {isToday && (
                        <span className={cssClass({ marginLeft: 6, fontSize: 10, background: B,
                          color: "#fff", borderRadius: 4, padding: "1px 5px", fontWeight: 700 })}>TODAY</span>
                      )}
                    </td>
                    <td className={cssClass({ padding: "11px 14px", color: "#6b7280" })}>{dayName(h.holiday_date)}</td>
                    <td className={cssClass({ padding: "11px 14px", fontWeight: 600, color: "#1a1a1a" })}>{h.holiday_name}</td>
                    <td className={cssClass({ padding: "11px 14px" })}>
                      {h.location ? (
                        <span className={cssClass({ display: "flex", alignItems: "center", gap: 4, color: "#374151", fontSize: 12 })}>
                          <MapPin size={11} color={shift.color} />{h.location}
                        </span>
                      ) : (
                        <span className={cssClass({ color: "#9ca3af", fontSize: 12 })}>All</span>
                      )}
                    </td>
                    <td className={cssClass({ padding: "11px 14px" })}>
                      <span className={cssClass({ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
                        background: h.is_restricted ? "#eff6ff" : "#f0fdf4",
                        color: h.is_restricted ? "#1d4ed8" : "#15803d",
                        border: `1px solid ${h.is_restricted ? "#bfdbfe" : "#bbf7d0"}` })}>
                        {h.is_restricted ? "Restricted" : "Public"}
                      </span>
                    </td>
                    <td className={cssClass({ padding: "11px 14px" })}>
                      <div className={cssClass({ display: "flex", gap: 6 })}>
                        <Btn size="sm" variant="cancel" onClick={() => onEdit(h)}>
                          <Edit2 size={11} />Edit
                        </Btn>
                        <Btn size="sm" variant="danger" onClick={() => onDelete(h)}>
                          <Trash2 size={11} />
                        </Btn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

ShiftHolidayTable.displayName = "ShiftHolidayTable";
export default ShiftHolidayTable;
