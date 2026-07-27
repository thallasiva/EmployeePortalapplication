import { memo, useEffect, useMemo, useState } from "react";
import { listLeaveRequests } from "../../../../api/leaveRequest.api";
import { listLeaveTypes } from "../../../../api/leaveType.api";
import { listEmployees } from "../../../../api/employee.api";
import { listHolidays } from "../../../../api/holiday.api";
import { cssClass } from "../../../../utils/classStyles";
import { CALENDAR_SHIFTS, LEAVE_COLORS, MON } from "../constants/leaveConstants";
import CalendarControls from "./CalendarControls";
import CalendarMonthView from "./CalendarMonthView";
import CalendarWeekView from "./CalendarWeekView";
import CalendarYearView from "./CalendarYearView";

const CalendarTab = memo(() => {
  const [view, setView]           = useState("month");
  const [cursor, setCursor]       = useState(new Date());
  const [requests, setRequests]   = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [empFilter, setEmpFilter] = useState("");
  const [shift, setShift]         = useState("general");
  const [holidays, setHolidays]   = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      listLeaveRequests({ status: "Approved", limit: 2000 }),
      listEmployees({ status: "Active", limit: 500 }),
      listLeaveTypes(),
      listHolidays({ year: new Date().getFullYear(), limit: 500 }),
    ]).then(([rq, em, lt, hols]) => {
      setRequests(rq.data || []);
      setEmployees(em.data || []);
      setLeaveTypes(Array.isArray(lt) ? lt : lt.data || []);
      setHolidays(Array.isArray(hols) ? hols : []);
    }).finally(() => setLoading(false));
  }, []);

  const shiftHolidays = useMemo(() =>
    holidays.filter((h) => h.shift === shift),
    [holidays, shift],
  );

  const getHolidaysOnDay = (date) => shiftHolidays.filter((h) => {
    const hd = new Date(h.holiday_date); hd.setHours(0, 0, 0, 0);
    const d2 = new Date(date);           d2.setHours(0, 0, 0, 0);
    return hd.getTime() === d2.getTime();
  });

  const currentShiftDef = CALENDAR_SHIFTS.find((s) => s.key === shift);

  const ltColorMap = useMemo(() => {
    const m = {};
    leaveTypes.forEach((lt, i) => { m[lt.leave_type_id] = LEAVE_COLORS[i % LEAVE_COLORS.length]; });
    return m;
  }, [leaveTypes]);

  const filtered = useMemo(() =>
    empFilter ? requests.filter((r) => String(r.employee_id) === String(empFilter)) : requests,
    [requests, empFilter],
  );

  const navigateDelta = (delta) => {
    const d = new Date(cursor);
    if (view === "month")     d.setMonth(d.getMonth() + delta);
    else if (view === "week") d.setDate(d.getDate() + delta * 7);
    else                      d.setFullYear(d.getFullYear() + delta);
    setCursor(d);
  };

  const rangeLabel = (() => {
    if (view === "month") return `${MON[cursor.getMonth()]} ${cursor.getFullYear()}`;
    if (view === "week") {
      const start = new Date(cursor);
      start.setDate(cursor.getDate() - cursor.getDay());
      const end = new Date(start); end.setDate(start.getDate() + 6);
      return `${start.getDate()} ${MON[start.getMonth()]} – ${end.getDate()} ${MON[end.getMonth()]} ${end.getFullYear()}`;
    }
    return String(cursor.getFullYear());
  })();

  const leavesOnDay = (date) => filtered.filter((r) => {
    const f = new Date(r.from_date); f.setHours(0, 0, 0, 0);
    const t = new Date(r.to_date);   t.setHours(23, 59, 59, 999);
    return date >= f && date <= t;
  });

  return (
    <div>
      {/* Shift tabs */}
      <div className={cssClass({ display: "flex", gap: 0, borderBottom: `2px solid #e9eaec`, marginBottom: 16 })}>
        {CALENDAR_SHIFTS.map((s) => (
          <button key={s.key} onClick={() => setShift(s.key)} className={cssClass({
            display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", fontSize: 13,
            fontWeight: shift === s.key ? 800 : 500,
            color: shift === s.key ? s.color : "#9ca3af",
            background: shift === s.key ? s.bg : "transparent",
            border: "none", cursor: "pointer",
            borderBottom: shift === s.key ? `2px solid ${s.color}` : "2px solid transparent",
            marginBottom: -2, transition: "all .15s",
          })}>
            <span className={cssClass({ color: shift === s.key ? s.color : "#c4c4c4" })}>{s.icon}</span>
            {s.label} Shift
            <span className={cssClass({
              fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 999, marginLeft: 4,
              background: shift === s.key ? s.color : "#e5e7eb",
              color: shift === s.key ? "#fff" : "#9ca3af",
            })}>
              {shiftHolidays.filter((h) => {
                const d = new Date(h.holiday_date);
                return view === "year"  ? d.getFullYear() === cursor.getFullYear() :
                       view === "month" ? d.getFullYear() === cursor.getFullYear() && d.getMonth() === cursor.getMonth() :
                       true;
              }).length}H
            </span>
          </button>
        ))}
        <div className={cssClass({ marginLeft: "auto", display: "flex", alignItems: "center",
          fontSize: 11, color: "#9ca3af", paddingRight: 6 })}>
          <span className={cssClass({ color: currentShiftDef.color, marginRight: 4 })}>{currentShiftDef.icon}</span>
          Showing holidays &amp; leaves for{" "}
          <strong className={cssClass({ marginLeft: 4, color: currentShiftDef.color })}>{currentShiftDef.label} shift</strong>
        </div>
      </div>

      {/* View / nav / filter controls */}
      <CalendarControls
        view={view} setView={setView}
        rangeLabel={rangeLabel}
        navigateDelta={navigateDelta}
        resetToday={() => setCursor(new Date())}
        empFilter={empFilter} setEmpFilter={setEmpFilter}
        employees={employees} shift={shift}
        leaveTypes={leaveTypes}
        currentShiftDef={currentShiftDef}
      />

      {/* Calendar body */}
      {loading ? (
        <div className={cssClass({ textAlign: "center", padding: 60, color: "#9ca3af" })}>Loading leave calendar…</div>
      ) : (
        <div className={cssClass({
          background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px #0000000a",
          border: `1.5px solid ${currentShiftDef.border}`,
        })}>
          {view === "month" && <CalendarMonthView cursor={cursor} leavesOnDay={leavesOnDay} getHolidaysOnDay={getHolidaysOnDay} currentShiftDef={currentShiftDef} ltColorMap={ltColorMap} />}
          {view === "week"  && <CalendarWeekView  cursor={cursor} leavesOnDay={leavesOnDay} getHolidaysOnDay={getHolidaysOnDay} currentShiftDef={currentShiftDef} ltColorMap={ltColorMap} />}
          {view === "year"  && <CalendarYearView  cursor={cursor} filtered={filtered} shiftHolidays={shiftHolidays} currentShiftDef={currentShiftDef} />}
        </div>
      )}

      {/* Footer note */}
      <div className={cssClass({
        marginTop: 14, padding: "10px 16px", borderRadius: 8,
        background: currentShiftDef.bg, border: `1px solid ${currentShiftDef.border}`,
        fontSize: 12, color: "#374151", display: "flex", alignItems: "center", gap: 10,
      })}>
        <span className={cssClass({ color: currentShiftDef.color })}>{currentShiftDef.icon}</span>
        <span>
          <strong className={cssClass({ color: currentShiftDef.color })}>{currentShiftDef.label} Shift</strong>
          {" — "}holidays highlighted in{" "}
          <strong className={cssClass({ color: currentShiftDef.color })}>{currentShiftDef.color}</strong>.
          {" "}Switch tabs to see General / Mid / Night shift calendars.
          {" "}Manage holidays in <strong>Settings → Time Off</strong>.
        </span>
      </div>
    </div>
  );
});

CalendarTab.displayName = "CalendarTab";
export default CalendarTab;
