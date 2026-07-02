import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  listLeaveRequests, reviewLeaveRequest,
  getAllLeaveBalances, adjustLeaveBalance, initializeLeaveYear,
  accrueEarnedLeave } from
"../../api/leaveRequest.api";
import { listLeaveTypes, createLeaveType, updateLeaveType, deleteLeaveType } from "../../api/leaveType.api";
import { listEmployees } from "../../api/employee.api";
import { listHolidays } from "../../api/holiday.api";
import {
  Calendar, ChevronLeft, ChevronRight, LayoutGrid, List,
  BarChart2, Check, X, RefreshCw, Plus, Edit2, Trash2,
  Users, Clock, Zap, AlertCircle, Sun, Sunset, Moon } from
"lucide-react";

/* ── Shift definitions (mirrors TimeOff.js) ─── */import { cssClass, joinClasses } from "../../utils/classStyles";
const CALENDAR_SHIFTS = [
{ key: "general", label: "General", icon: <Sun size={13} />, color: "#f18200", bg: "#fff8f0", border: "#fed7aa" },
{ key: "mid", label: "Mid", icon: <Sunset size={13} />, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
{ key: "night", label: "Night", icon: <Moon size={13} />, color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" }];


/* ═══════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════ */
const B = "#f18200"; // brand
const BD = "#d97000"; // brand dark (hover)
const BL = "#fff8f0"; // brand light bg

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR + 1, CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const fmt = (v) => Number(v || 0).toFixed(1).replace(/\.0$/, "");

/* ── Reusable atoms ──────────────────────────────── */
const Btn = ({ onClick, disabled, children, variant = "primary", size = "md", className = "" }) => {
  const base = "inline-flex items-center gap-1.5 font-semibold rounded-lg border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-sm" };
  const variants = {
    primary: `bg-[${B}] border-[${B}] text-white hover:bg-[${BD}] hover:border-[${BD}]`,
    cancel: "bg-white border-gray-300 text-gray-600 hover:bg-gray-50",
    danger: "bg-white border-red-300 text-red-600 hover:bg-red-50",
    ghost: "bg-transparent border-transparent text-gray-500 hover:bg-gray-100"
  };
  // inline styles safer than template literals inside className
  const styleMap = {
    primary: { background: B, borderColor: B, color: "#fff" },
    cancel: { background: "#fff", borderColor: "#d1d5db", color: "#374151" },
    danger: { background: "#fff", borderColor: "#fca5a5", color: "#dc2626" },
    ghost: { background: "transparent", borderColor: "transparent", color: "#6b7280" }
  };
  return (
    <button onClick={onClick} disabled={disabled} className={joinClasses(`${base} ${sizes[size]} ${className}`, cssClass(
      styleMap[variant]))}
    onMouseEnter={(e) => {
      if (variant === "primary" && !disabled) {e.currentTarget.style.background = BD;e.currentTarget.style.borderColor = BD;}
      if (variant === "cancel") e.currentTarget.style.background = "#f9fafb";
      if (variant === "danger") e.currentTarget.style.background = "#fff1f2";
    }}
    onMouseLeave={(e) => {
      if (variant === "primary" && !disabled) {e.currentTarget.style.background = B;e.currentTarget.style.borderColor = B;}
      if (variant === "cancel") e.currentTarget.style.background = "#fff";
      if (variant === "danger") e.currentTarget.style.background = "#fff";
    }}>
      {children}
    </button>);

};

const StatusBadge = ({ status }) => {
  const map = {
    Pending: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
    Approved: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
    Rejected: { bg: "#fff1f2", color: "#b91c1c", border: "#fecdd3" },
    Cancelled: { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" }
  };
  const s = map[status] || map.Cancelled;
  return (
    <span className={cssClass({ background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" })}>
      {status}
    </span>);

};

const Toast = ({ msg, type = "success" }) => msg ?
<div className={cssClass({
  position: "fixed", top: 20, right: 20, zIndex: 9999,
  background: type === "success" ? "#16a34a" : "#dc2626",
  color: "#fff", borderRadius: 10, padding: "10px 18px",
  fontSize: 13, fontWeight: 600, boxShadow: "0 4px 16px #0003",
  display: "flex", alignItems: "center", gap: 8
})}>
    {type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
    {msg}
  </div> :
null;

/* ═══════════════════════════════════════════════════
   CALENDAR VIEW (Month / Week / Year)
   Default = All Employees; filter by employee
═══════════════════════════════════════════════════ */

// Leave type palette (cycles through)
const LEAVE_COLORS = [
{ bg: "#fff8f0", border: "#f18200", text: "#92400e" },
{ bg: "#f0fdf4", border: "#16a34a", text: "#14532d" },
{ bg: "#eff6ff", border: "#2563eb", text: "#1e3a8a" },
{ bg: "#f5f3ff", border: "#7c3aed", text: "#3b0764" },
{ bg: "#fff1f2", border: "#e11d48", text: "#881337" },
{ bg: "#fffbeb", border: "#d97706", text: "#78350f" }];


function CalendarTab() {
  const [view, setView] = useState("month"); // month | week | year
  const [cursor, setCursor] = useState(new Date());
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [empFilter, setEmpFilter] = useState(""); // "" = all
  const [shift, setShift] = useState("general"); // shift tab
  const [holidays, setHolidays] = useState([]); // shift-specific holidays
  const [loading, setLoading] = useState(true);

  // Load everything once
  useEffect(() => {
    Promise.all([
    listLeaveRequests({ status: "Approved", limit: 2000 }),
    listEmployees({ status: "Active", limit: 500 }),
    listLeaveTypes(),
    listHolidays({ year: new Date().getFullYear(), limit: 500 })]
    ).then(([rq, em, lt, hols]) => {
      setRequests(rq.data || []);
      setEmployees(em.data || []);
      setLeaveTypes(Array.isArray(lt) ? lt : lt.data || []);
      setHolidays(Array.isArray(hols) ? hols : []);
    }).finally(() => setLoading(false));
  }, []);

  // Holidays for the current shift
  const shiftHolidays = useMemo(() =>
  holidays.filter((h) => h.shift === shift),
  [holidays, shift]);

  // Check if a date is a holiday for current shift
  const isHoliday = (date) => shiftHolidays.some((h) => {
    const hd = new Date(h.holiday_date);hd.setHours(0, 0, 0, 0);
    const d2 = new Date(date);d2.setHours(0, 0, 0, 0);
    return hd.getTime() === d2.getTime();
  });
  const getHolidaysOnDay = (date) => shiftHolidays.filter((h) => {
    const hd = new Date(h.holiday_date);hd.setHours(0, 0, 0, 0);
    const d2 = new Date(date);d2.setHours(0, 0, 0, 0);
    return hd.getTime() === d2.getTime();
  });

  const currentShiftDef = CALENDAR_SHIFTS.find((s) => s.key === shift);

  const ltColorMap = useMemo(() => {
    const m = {};
    leaveTypes.forEach((lt, i) => {m[lt.leave_type_id] = LEAVE_COLORS[i % LEAVE_COLORS.length];});
    return m;
  }, [leaveTypes]);

  // filter by employee
  const filtered = useMemo(() => empFilter ?
  requests.filter((r) => String(r.employee_id) === String(empFilter)) :
  requests,
  [requests, empFilter]);

  // helpers
  const navigate = (delta) => {
    const d = new Date(cursor);
    if (view === "month") d.setMonth(d.getMonth() + delta);else
    if (view === "week") d.setDate(d.getDate() + delta * 7);else
    d.setFullYear(d.getFullYear() + delta);
    setCursor(d);
  };

  const rangeLabel = () => {
    if (view === "month") return `${MON[cursor.getMonth()]} ${cursor.getFullYear()}`;
    if (view === "week") {
      const start = new Date(cursor);
      start.setDate(cursor.getDate() - cursor.getDay());
      const end = new Date(start);end.setDate(start.getDate() + 6);
      return `${start.getDate()} ${MON[start.getMonth()]} – ${end.getDate()} ${MON[end.getMonth()]} ${end.getFullYear()}`;
    }
    return String(cursor.getFullYear());
  };

  // check if a date falls within a leave request
  const onLeave = (req, date) => {
    const f = new Date(req.from_date);f.setHours(0, 0, 0, 0);
    const t = new Date(req.to_date);t.setHours(23, 59, 59, 999);
    return date >= f && date <= t;
  };

  const leavesOnDay = (date) => filtered.filter((r) => onLeave(r, date));

  /* ── MONTH VIEW ───────────────────────────────── */
  const MonthView = () => {
    const year = cursor.getFullYear(),month = cursor.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysCount = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysCount; d++) cells.push(new Date(year, month, d));

    const today = new Date();today.setHours(0, 0, 0, 0);

    return (
      <div>
        {/* Day headers */}
        <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 4 })}>
          {DAYS.map((d) =>
          <div key={d} className={cssClass({ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#9ca3af",
            textTransform: "uppercase", letterSpacing: ".06em", padding: "6px 0" })}>{d}</div>
          )}
        </div>
        {/* Calendar grid */}
        <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 })}>
          {cells.map((date, i) => {
            if (!date) return <div key={`e${i}`} />;
            const isToday = date.getTime() === today.getTime();
            const leaves = leavesOnDay(date);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const dayHolidays = getHolidaysOnDay(date);
            const isHol = dayHolidays.length > 0;
            return (
              <div key={date.getDate()} className={cssClass({
                minHeight: 80, borderRadius: 8, padding: "6px 7px",
                background: isHol ? currentShiftDef.bg : isToday ? BL : isWeekend ? "#fafafa" : "#fff",
                border: `1.5px solid ${isHol ? currentShiftDef.color : isToday ? B : "#e9eaec"}`
              })}>
                <div className={cssClass({ fontSize: 12, fontWeight: isToday ? 800 : 500,
                  color: isHol ? currentShiftDef.color : isToday ? B : isWeekend ? "#9ca3af" : "#374151",
                  marginBottom: 3, display: "flex", alignItems: "center", gap: 3 })}>
                  {date.getDate()}
                  {isHol && <span className={cssClass({ fontSize: 9, fontWeight: 800, color: currentShiftDef.color })}>★</span>}
                </div>
                {/* Holiday banners */}
                {dayHolidays.map((h, hi) =>
                <div key={hi} title={h.holiday_name} className={cssClass({
                  fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 3, marginBottom: 2,
                  background: currentShiftDef.color, color: "#fff",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                })}>{h.holiday_name}</div>
                )}
                {/* Leave pills */}
                {leaves.slice(0, Math.max(0, 3 - dayHolidays.length)).map((r, ri) => {
                  const c = ltColorMap[r.leave_type_id] || LEAVE_COLORS[0];
                  return (
                    <div key={ri}



                    title={`${r.employee_name} – ${r.leave_type_name}`} className={cssClass({ fontSize: 10, fontWeight: 600, padding: "1px 5px", borderRadius: 4, background: c.bg, color: c.text, border: `1px solid ${c.border}`, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>
                      {(r.employee_name || "").split(" ")[0]}
                    </div>);

                })}
                {leaves.length > 3 - dayHolidays.length &&
                <div className={cssClass({ fontSize: 9, color: "#9ca3af", fontWeight: 600 })}>+{leaves.length - (3 - dayHolidays.length)} more</div>
                }
              </div>);

          })}
        </div>
      </div>);

  };

  /* ── WEEK VIEW ────────────────────────────────── */
  const WeekView = () => {
    const weekStart = new Date(cursor);
    weekStart.setDate(cursor.getDate() - cursor.getDay());
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);d.setDate(weekStart.getDate() + i);return d;
    });
    const today = new Date();today.setHours(0, 0, 0, 0);
    return (
      <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 })}>
        {weekDays.map((date, di) => {
          const isToday = date.getTime() === today.getTime();
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const leaves = leavesOnDay(date);
          const dayHols = getHolidaysOnDay(date);
          const isHol = dayHols.length > 0;
          return (
            <div key={di} className={cssClass({
              borderRadius: 10, minHeight: 160, padding: "10px 10px",
              border: `1.5px solid ${isHol ? currentShiftDef.color : isToday ? B : "#e9eaec"}`,
              background: isHol ? currentShiftDef.bg : isToday ? BL : isWeekend ? "#fafafa" : "#fff"
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
              {/* Holiday badges */}
              {dayHols.map((h, hi) =>
              <div key={hi} className={cssClass({
                borderRadius: 5, padding: "4px 7px", marginBottom: 5,
                background: currentShiftDef.color, color: "#fff"
              })}>
                  <div className={cssClass({ fontSize: 10, fontWeight: 800 })}>🎌 {h.holiday_name}</div>
                  <div className={cssClass({ fontSize: 9, opacity: .8 })}>{currentShiftDef.label} Holiday</div>
                </div>
              )}
              {/* Leave cards */}
              {leaves.length === 0 && dayHols.length === 0 &&
              <div className={cssClass({ fontSize: 11, color: "#d1d5db", textAlign: "center", marginTop: 12 })}>—</div>
              }
              {leaves.map((r, ri) => {
                const c = ltColorMap[r.leave_type_id] || LEAVE_COLORS[0];
                return (
                  <div key={ri} className={cssClass({
                    borderRadius: 6, padding: "5px 8px", marginBottom: 5,
                    background: c.bg, border: `1px solid ${c.border}`
                  })}>
                    <div className={cssClass({ fontSize: 11, fontWeight: 700, color: c.text })}>
                      {(r.employee_name || "").split(" ").slice(0, 2).join(" ")}
                    </div>
                    <div className={cssClass({ fontSize: 10, color: "#9ca3af" })}>{r.leave_type_name}</div>
                  </div>);

              })}
            </div>);

        })}
      </div>);

  };

  /* ── YEAR VIEW (heatmap by employee + holiday markers per month) ─────────── */
  const YearView = () => {
    const year = cursor.getFullYear();
    const empIds = [...new Set(filtered.filter((r) => {
      const y = new Date(r.from_date).getFullYear();
      return y === year || new Date(r.to_date).getFullYear() === year;
    }).map((r) => r.employee_id))];

    // Which months have holidays for the current shift?
    const holidayMonths = new Set(
      shiftHolidays.
      filter((h) => new Date(h.holiday_date).getFullYear() === year).
      map((h) => new Date(h.holiday_date).getMonth())
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
              {MON.map((m, mi) =>
              <th key={m} className={cssClass({
                padding: "6px 4px", textAlign: "center", fontWeight: 700, width: 60,
                color: holidayMonths.has(mi) ? currentShiftDef.color : "#9ca3af"
              })}>
                  {m}
                  {holidayMonths.has(mi) &&
                <div className={cssClass({ fontSize: 8, color: currentShiftDef.color })}>🎌</div>
                }
                </th>
              )}
            </tr>
            {/* Holiday row */}
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
                    {monthHols.length > 0 ?
                    <div title={monthHols.map((h) => h.holiday_name).join(", ")} className={cssClass(
                      { fontSize: 9, fontWeight: 700, color: currentShiftDef.color,
                        background: currentShiftDef.border, borderRadius: 4, padding: "1px 4px",
                        display: "inline-block" })}>
                        {monthHols.length}H
                      </div> :
                    <span className={cssClass({ color: "#e5e7eb" })}>–</span>}
                  </td>);

              })}
            </tr>
          </thead>
          <tbody>
            {empIds.length === 0 &&
            <tr><td colSpan={13} className={cssClass({ textAlign: "center", padding: 40, color: "#9ca3af" })}>
                No approved leaves for {year} in {currentShiftDef.label}
              </td></tr>
            }
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
                      const f = new Date(r.from_date),t = new Date(r.to_date);
                      return f.getFullYear() === year && f.getMonth() === mi ||
                      t.getFullYear() === year && t.getMonth() === mi;
                    });
                    const totalDays = mReqs.reduce((s, r) => s + Number(r.days || 0), 0);
                    const intensity = Math.min(totalDays / 5, 1);
                    const hasHol = holidayMonths.has(mi);
                    return (
                      <td key={mi} className={cssClass({ padding: "6px 4px", textAlign: "center",
                        background: hasHol ? `${currentShiftDef.bg}88` : "transparent" })}>
                        {totalDays > 0 ?
                        <div





                          title={mReqs.map((r) => r.leave_type_name).join(", ")} className={cssClass({ width: 36, height: 28, borderRadius: 6, margin: "0 auto", background: `rgba(241,130,0,${0.15 + intensity * 0.75})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: intensity > 0.5 ? "#fff" : "#92400e" })}>
                            {totalDays}d
                          </div> :

                        <div className={cssClass({ width: 36, height: 28, borderRadius: 6, margin: "0 auto",
                          background: hasHol ? `${currentShiftDef.border}44` : "#f9fafb" })} />
                        }
                      </td>);

                  })}
                </tr>);

            })}
          </tbody>
        </table>
      </div>);

  };

  return (
    <div>
      {/* ── Shift Tabs ── */}
      <div className={cssClass({ display: "flex", gap: 0, borderBottom: `2px solid #e9eaec`, marginBottom: 16 })}>
        {CALENDAR_SHIFTS.map((s) =>
        <button key={s.key} onClick={() => setShift(s.key)} className={cssClass(
          {
            display: "flex", alignItems: "center", gap: 6,
            padding: "10px 20px", fontSize: 13,
            fontWeight: shift === s.key ? 800 : 500,
            color: shift === s.key ? s.color : "#9ca3af",
            background: shift === s.key ? s.bg : "transparent",
            border: "none", cursor: "pointer",
            borderBottom: shift === s.key ? `2px solid ${s.color}` : "2px solid transparent",
            marginBottom: -2, transition: "all .15s"
          })}>
            <span className={cssClass({ color: shift === s.key ? s.color : "#c4c4c4" })}>{s.icon}</span>
            {s.label} Shift
            <span className={cssClass({
            fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 999, marginLeft: 4,
            background: shift === s.key ? s.color : "#e5e7eb",
            color: shift === s.key ? "#fff" : "#9ca3af"
          })}>
              {shiftHolidays.filter((h) => {
              const d = new Date(h.holiday_date);
              return view === "year" ?
              d.getFullYear() === cursor.getFullYear() :
              view === "month" ?
              d.getFullYear() === cursor.getFullYear() && d.getMonth() === cursor.getMonth() :
              true;
            }).length}H
            </span>
          </button>
        )}
        {/* shift legend note */}
        <div className={cssClass({ marginLeft: "auto", display: "flex", alignItems: "center",
          fontSize: 11, color: "#9ca3af", paddingRight: 6 })}>
          <span className={cssClass({ color: currentShiftDef.color, marginRight: 4 })}>{currentShiftDef.icon}</span>
          Showing holidays &amp; leaves for <strong className={cssClass({ marginLeft: 4, color: currentShiftDef.color })}>{currentShiftDef.label} shift</strong>
        </div>
      </div>

      {/* Toolbar */}
      <div className={cssClass({ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 18 })}>
        {/* View toggle */}
        <div className={cssClass({ display: "flex", border: `1px solid ${currentShiftDef.border}`, borderRadius: 8, overflow: "hidden" })}>
          {[
          { key: "month", icon: <Calendar size={14} />, label: "Month" },
          { key: "week", icon: <LayoutGrid size={14} />, label: "Week" },
          { key: "year", icon: <BarChart2 size={14} />, label: "Year" }].
          map((v) =>
          <button key={v.key} onClick={() => setView(v.key)} className={cssClass(
            {
              display: "flex", alignItems: "center", gap: 5,
              padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: view === v.key ? currentShiftDef.color : "#fff",
              color: view === v.key ? "#fff" : "#6b7280",
              border: "none", borderRight: `1px solid ${currentShiftDef.border}`, transition: "all .15s"
            })}>
              {v.icon}{v.label}
            </button>
          )}
        </div>

        {/* Navigator */}
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 6 })}>
          <Btn variant="cancel" size="sm" onClick={() => navigate(-1)}><ChevronLeft size={14} /></Btn>
          <span className={cssClass({ fontSize: 14, fontWeight: 700, color: "#111827", minWidth: 180, textAlign: "center" })}>
            {rangeLabel()}
          </span>
          <Btn variant="cancel" size="sm" onClick={() => navigate(1)}><ChevronRight size={14} /></Btn>
          <Btn variant="cancel" size="sm" onClick={() => setCursor(new Date())}>Today</Btn>
        </div>

        {/* Employee filter */}
        <select value={empFilter} onChange={(e) => setEmpFilter(e.target.value)} className={cssClass(
          { padding: "7px 12px", borderRadius: 8, border: "1px solid #e5e7eb",
            fontSize: 12, color: "#374151", minWidth: 200 })}>
          <option value="">All Employees</option>
          {employees.
          filter((e) => !e.shift || e.shift === shift) /* show shift employees first, others below */.
          map((e) =>
          <option key={e.employee_id} value={e.employee_id}>
                {e.first_name} {e.last_name} ({e.emp_code})
              </option>
          )}
          {employees.filter((e) => e.shift && e.shift !== shift).length > 0 &&
          <option disabled>── Other shifts ──</option>
          }
          {employees.filter((e) => e.shift && e.shift !== shift).map((e) =>
          <option key={`o${e.employee_id}`} value={e.employee_id}>
              {e.first_name} {e.last_name} ({e.shift})
            </option>
          )}
        </select>

        {/* Leave type legend */}
        <div className={cssClass({ display: "flex", gap: 10, marginLeft: "auto", flexWrap: "wrap", alignItems: "center" })}>
          {/* Holiday chip */}
          <div className={cssClass({ display: "flex", alignItems: "center", gap: 4 })}>
            <div className={cssClass({ width: 10, height: 10, borderRadius: 2, background: currentShiftDef.color })} />
            <span className={cssClass({ fontSize: 11, color: currentShiftDef.color, fontWeight: 700 })}>Holiday</span>
          </div>
          {leaveTypes.slice(0, 4).map((lt, i) => {
            const c = LEAVE_COLORS[i % LEAVE_COLORS.length];
            return (
              <div key={lt.leave_type_id} className={cssClass({ display: "flex", alignItems: "center", gap: 4 })}>
                <div className={cssClass({ width: 10, height: 10, borderRadius: 2, background: c.border })} />
                <span className={cssClass({ fontSize: 11, color: "#6b7280" })}>{lt.short_code || lt.leave_type_name}</span>
              </div>);

          })}
        </div>
      </div>

      {loading ?
      <div className={cssClass({ textAlign: "center", padding: 60, color: "#9ca3af" })}>Loading leave calendar…</div> :

      <div className={cssClass({
        background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px #0000000a",
        border: `1.5px solid ${currentShiftDef.border}`
      })}>
            {view === "month" && <MonthView />}
            {view === "week" && <WeekView />}
            {view === "year" && <YearView />}
          </div>

      }

      {/* Shift info */}
      <div className={cssClass({
        marginTop: 14, padding: "10px 16px", borderRadius: 8,
        background: currentShiftDef.bg, border: `1px solid ${currentShiftDef.border}`,
        fontSize: 12, color: "#374151", display: "flex", alignItems: "center", gap: 10
      })}>
        <span className={cssClass({ color: currentShiftDef.color })}>{currentShiftDef.icon}</span>
        <span>
          <strong className={cssClass({ color: currentShiftDef.color })}>{currentShiftDef.label} Shift</strong>
          {" — "}holidays highlighted in <strong className={cssClass({ color: currentShiftDef.color })}>{currentShiftDef.color}</strong>.
          Switch tabs to see General / Mid / Night shift calendars.
          Manage holidays in <strong>Settings → Time Off</strong>.
        </span>
      </div>
    </div>);

}

/* ═══════════════════════════════════════════════════
   REQUESTS TAB
═══════════════════════════════════════════════════ */
function RequestsTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [toast, setToast] = useState(null);
  const [reviewing, setReviewing] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {setRows((await listLeaveRequests({ status: status || undefined, limit: 500 })).data || []);}
    catch (e) {showToast(e.message, "error");} finally
    {setLoading(false);}
  }, [status]);

  useEffect(() => {load();}, [load]);

  const handleReview = async (id, decision, remarks = "") => {
    try {
      await reviewLeaveRequest(id, { decision, remarks });
      showToast(`Request ${decision}`);
      load();
    } catch (e) {showToast(e.message, "error");}
    setReviewing(null);
  };

  const pending = rows.filter((r) => r.status === "Pending");
  const history = rows.filter((r) => r.status !== "Pending");

  const TH = ({ children, right }) =>
  <th className={cssClass({ padding: "10px 14px", fontWeight: 700, fontSize: 11, color: "#9ca3af",
    textTransform: "uppercase", letterSpacing: ".06em", textAlign: right ? "right" : "left",
    borderBottom: "1px solid #e9eaec", whiteSpace: "nowrap", background: "#fafafa" })}>
      {children}
    </th>;

  const TD = ({ children, right }) =>
  <td className={cssClass({ padding: "11px 14px", fontSize: 13, color: "#374151", borderBottom: "1px solid #f5f5f5",
    textAlign: right ? "right" : "left", verticalAlign: "middle" })}>
      {children}
    </td>;


  return (
    <div className={cssClass({ display: "flex", flexDirection: "column", gap: 20 })}>
      <Toast {...toast || { msg: null }} />

      {/* Filters */}
      <div className={cssClass({ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" })}>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={cssClass(
          { padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 })}>
          <option value="">All Statuses</option>
          {["Pending", "Approved", "Rejected", "Cancelled"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <Btn onClick={load} variant="cancel" size="sm"><RefreshCw size={13} />Refresh</Btn>
      </div>

      {loading && <div className={cssClass({ padding: 40, textAlign: "center", color: "#9ca3af" })}>Loading…</div>}

      {/* Pending section */}
      {!loading && pending.length > 0 &&
      <div>
          <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 })}>
            <Clock size={15} color="#d97706" />
            <span className={cssClass({ fontSize: 13, fontWeight: 700, color: "#92400e" })}>
              Pending Approval ({pending.length})
            </span>
          </div>
          <div className={cssClass({ border: "1px solid #fde68a", borderRadius: 12, overflow: "hidden", background: "#fff" })}>
            <table className={cssClass({ width: "100%", borderCollapse: "collapse" })}>
              <thead><tr>
                <TH>Employee</TH><TH>Leave Type</TH><TH>From</TH><TH>To</TH>
                <TH right>Days</TH><TH>Reason</TH><TH>Actions</TH>
              </tr></thead>
              <tbody>
                {pending.map((r) =>
              <tr key={r.leave_request_id}
              onMouseEnter={(e) => e.currentTarget.style.background = "#fffbeb"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#fff"} className={cssClass({ background: "#fff" })}>
                    <TD>
                      <div className={cssClass({ fontWeight: 700, color: "#111827" })}>{r.employee_name}</div>
                      <div className={cssClass({ fontSize: 11, color: "#9ca3af" })}>{r.emp_code} · {r.department_name}</div>
                    </TD>
                    <TD>{r.leave_type_name}</TD>
                    <TD>{r.from_date?.slice(0, 10)}</TD>
                    <TD>{r.to_date?.slice(0, 10)}</TD>
                    <TD right><strong>{r.days}</strong></TD>
                    <TD><span className={cssClass({ color: "#6b7280", maxWidth: 160, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>{r.reason || "—"}</span></TD>
                    <TD>
                      <div className={cssClass({ display: "flex", gap: 6 })}>
                        <Btn size="sm" onClick={() => handleReview(r.leave_request_id, "Approved")}>
                          <Check size={12} />Approve
                        </Btn>
                        <Btn size="sm" variant="danger"
                    onClick={() => setReviewing({ id: r.leave_request_id, decision: "Rejected" })}>
                          <X size={12} />Reject
                        </Btn>
                      </div>
                    </TD>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      }

      {/* History section */}
      {!loading && history.length > 0 &&
      <div>
          <div className={cssClass({ fontSize: 13, fontWeight: 700, color: "#6b7280", marginBottom: 10 })}>
            History ({history.length})
          </div>
          <div className={cssClass({ border: "1px solid #e9eaec", borderRadius: 12, overflow: "hidden", background: "#fff" })}>
            <table className={cssClass({ width: "100%", borderCollapse: "collapse" })}>
              <thead><tr>
                <TH>Employee</TH><TH>Leave Type</TH><TH>From</TH><TH>To</TH>
                <TH right>Days</TH><TH>Status</TH><TH>Reviewed By</TH>
              </tr></thead>
              <tbody>
                {history.map((r) =>
              <tr key={r.leave_request_id}
              onMouseEnter={(e) => e.currentTarget.style.background = "#fafafa"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}>
                    <TD>
                      <div className={cssClass({ fontWeight: 600, color: "#111827" })}>{r.employee_name}</div>
                      <div className={cssClass({ fontSize: 11, color: "#9ca3af" })}>{r.emp_code}</div>
                    </TD>
                    <TD>{r.leave_type_name}</TD>
                    <TD>{r.from_date?.slice(0, 10)}</TD>
                    <TD>{r.to_date?.slice(0, 10)}</TD>
                    <TD right>{r.days}</TD>
                    <TD><StatusBadge status={r.status} /></TD>
                    <TD>{r.reviewer_name || "—"}</TD>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      }

      {!loading && rows.length === 0 &&
      <div className={cssClass({ textAlign: "center", padding: 60, color: "#9ca3af" })}>No leave requests found.</div>
      }

      {/* Reject modal */}
      {reviewing &&
      <RejectModal
        onConfirm={(remarks) => handleReview(reviewing.id, reviewing.decision, remarks)}
        onClose={() => setReviewing(null)} />

      }
    </div>);

}

function RejectModal({ onConfirm, onClose }) {
  const [remarks, setRemarks] = useState("");
  return (
    <div className={cssClass({ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center" })}>
      <div className={cssClass({ background: "#fff", borderRadius: 14, padding: 24, width: 420, boxShadow: "0 8px 40px #0003" })}>
        <div className={cssClass({ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 16 })}>
          Reject — Add Remarks
        </div>
        <textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)}
        placeholder="Reason for rejection (optional)" className={cssClass(
          { width: "100%", borderRadius: 8, border: "1px solid #e5e7eb", padding: "8px 12px",
            fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit" })} />
        <div className={cssClass({ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 })}>
          <Btn variant="cancel" onClick={onClose}>Cancel</Btn>
          <Btn variant="danger" onClick={() => onConfirm(remarks)}>
            <X size={13} />Reject
          </Btn>
        </div>
      </div>
    </div>);

}

/* ═══════════════════════════════════════════════════
   BALANCES TAB
═══════════════════════════════════════════════════ */
function BalancesTab() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(null);
  const [initLoading, setInitLoad] = useState(false);
  const [accruing, setAccruing] = useState(false);
  const [accrueMonth, setAccrueMonth] = useState(new Date().getMonth() || 12);
  const [accrueYear, setAccrueYear] = useState(new Date().getFullYear());

  const showToast = (msg, type = "success") => {setToast({ msg, type });setTimeout(() => setToast(null), 4000);};

  const load = useCallback(async (y) => {
    setLoading(true);
    try {setData(await getAllLeaveBalances(y));}
    catch (e) {showToast(e.message, "error");} finally
    {setLoading(false);}
  }, []);
  useEffect(() => {load(year);}, [year, load]);

  const handleInit = async () => {
    if (!window.confirm(`Initialize leave balances for ${year}? Existing rows will not be overwritten.`)) return;
    setInitLoad(true);
    try {
      const r = await initializeLeaveYear(year);
      showToast(`Year ${year} initialized: ${r.created} rows created, ${r.skipped} skipped`);
      load(year);
    } catch (e) {showToast(e.message, "error");} finally
    {setInitLoad(false);}
  };

  const handleAccrue = async () => {
    if (!window.confirm(`Accrue Earned Leave for ${MON[accrueMonth - 1]} ${accrueYear}? This will add working_days/14 to each employee's EL balance.`)) return;
    setAccruing(true);
    try {
      const r = await accrueEarnedLeave({ month: accrueMonth, year: accrueYear });
      showToast(`Earned leave accrued: ${r.accrued} employees credited`);
      load(year);
    } catch (e) {showToast(e.message, "error");} finally
    {setAccruing(false);}
  };

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    return q ? data.employees.filter((e) =>
    e.employee_name.toLowerCase().includes(q) ||
    e.emp_code.toLowerCase().includes(q) ||
    (e.department_name || "").toLowerCase().includes(q)
    ) : data.employees;
  }, [data, search]);

  const leaveTypes = data?.leaveTypes || [];

  const totals = useMemo(() => {
    const t = {};
    leaveTypes.forEach((lt) => {t[lt.leave_type_id] = { granted: 0, availed: 0, balance: 0 };});
    filtered.forEach((emp) => emp.balances.forEach((b) => {
      if (t[b.leave_type_id]) {
        t[b.leave_type_id].granted += b.granted;
        t[b.leave_type_id].availed += b.availed;
        t[b.leave_type_id].balance += b.balance;
      }
    }));
    return t;
  }, [filtered, leaveTypes]);

  return (
    <div className={cssClass({ display: "flex", flexDirection: "column", gap: 18 })}>
      <Toast {...toast || { msg: null }} />

      {/* Toolbar */}
      <div className={cssClass({ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" })}>
        <div>
          <label className={cssClass({ display: "block", fontSize: 11, color: "#9ca3af", fontWeight: 600, marginBottom: 4 })}>Year</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={cssClass(
            { padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 })}>
            {YEARS.map((y) => <option key={y}>{y}</option>)}
          </select>
        </div>
        <input type="text" placeholder="Search employee / dept…" value={search}
        onChange={(e) => setSearch(e.target.value)} className={cssClass(
          { padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, width: 220 })} />
        <Btn onClick={handleInit} disabled={initLoading} variant="cancel">
          {initLoading ? "Initializing…" : `Initialize ${year}`}
        </Btn>
        <Btn onClick={() => load(year)} variant="cancel" size="sm"><RefreshCw size={13} /></Btn>

        {/* Earned Leave Accrual */}
        <div className={cssClass({ display: "flex", gap: 6, alignItems: "center", marginLeft: "auto",
          background: "#fff8f0", border: "1px solid #fed7aa", borderRadius: 10, padding: "8px 14px" })}>
          <Zap size={14} color={B} />
          <span className={cssClass({ fontSize: 12, fontWeight: 700, color: B })}>Earned Leave Accrual</span>
          <select value={accrueMonth} onChange={(e) => setAccrueMonth(Number(e.target.value))} className={cssClass(
            { padding: "5px 8px", borderRadius: 6, border: "1px solid #fed7aa", fontSize: 12, background: "#fff" })}>
            {MON.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={accrueYear} onChange={(e) => setAccrueYear(Number(e.target.value))} className={cssClass(
            { padding: "5px 8px", borderRadius: 6, border: "1px solid #fed7aa", fontSize: 12, background: "#fff", width: 70 })}>
            {YEARS.map((y) => <option key={y}>{y}</option>)}
          </select>
          <Btn onClick={handleAccrue} disabled={accruing} size="sm">
            <Zap size={12} />{accruing ? "Accruing…" : "Run Accrual"}
          </Btn>
        </div>
      </div>

      <p className={cssClass({ fontSize: 11, color: "#9ca3af" })}>
        Formula: <strong>paid_days ÷ 14</strong> (rounded to nearest 0.5 day) — auto-runs on 1st of every month at 6 PM.
        Click any balance cell to edit manually.
      </p>

      {loading && <div className={cssClass({ padding: 40, textAlign: "center", color: "#9ca3af" })}>Loading balances…</div>}

      {!loading && data &&
      <div className={cssClass({ overflowX: "auto", border: "1px solid #e9eaec", borderRadius: 12 })}>
          <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 12 })}>
            <thead>
              <tr className={cssClass({ background: `linear-gradient(90deg,${B},#fb923c)` })}>
                <th className={cssClass({ padding: "10px 14px", textAlign: "left", color: "#fff", fontWeight: 700,
                position: "sticky", left: 0, background: B, zIndex: 3, whiteSpace: "nowrap" })}>
                  Employee
                </th>
                <th className={cssClass({ padding: "10px 10px", color: "#fff", fontWeight: 700, textAlign: "left" })}>Dept</th>
                {leaveTypes.map((lt) =>
              <th key={lt.leave_type_id} className={cssClass({ padding: "10px 8px", color: "#fff", fontWeight: 700,
                textAlign: "center", minWidth: 90, whiteSpace: "nowrap" })}>
                    <div>{lt.short_code || lt.leave_type_name}</div>
                    <div className={cssClass({ fontSize: 10, opacity: .8 })}>{lt.annual_quota}d/yr</div>
                  </th>
              )}
                <th className={cssClass({ padding: "10px 8px", color: "#fff", fontWeight: 700, textAlign: "center", minWidth: 70 })}>Total<br />Availed</th>
                <th className={cssClass({ padding: "10px 8px", color: "#fff", fontWeight: 700, textAlign: "center", minWidth: 70 })}>Total<br />Balance</th>
              </tr>
              <tr className={cssClass({ background: "#fff8f0" })}>
                <th className={cssClass({ padding: "4px 14px", position: "sticky", left: 0, background: "#fff8f0", zIndex: 3 })} />
                <th />
                {leaveTypes.map((lt) =>
              <th key={lt.leave_type_id} className={cssClass({ padding: "4px 8px", textAlign: "center" })}>
                    <div className={cssClass({ display: "flex", justifyContent: "center", gap: 4, fontSize: 10, color: "#9ca3af", fontWeight: 600 })}>
                      <span>Gr</span><span>/</span><span className={cssClass({ color: "#dc2626" })}>Av</span><span>/</span><span className={cssClass({ color: "#16a34a" })}>Bal</span>
                    </div>
                  </th>
              )}
                <th /><th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, idx) => {
              const totalAv = emp.balances.reduce((s, b) => s + b.availed, 0);
              const totalBal = emp.balances.reduce((s, b) => s + b.balance, 0);
              return (
                <tr key={emp.employee_id}

                onMouseEnter={(e) => e.currentTarget.style.background = "#fff8f0"}
                onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#fafafa"} className={cssClass({ background: idx % 2 === 0 ? "#fff" : "#fafafa" })}>
                    <td className={cssClass({ padding: "9px 14px", position: "sticky", left: 0, background: "inherit", zIndex: 1 })}>
                      <div className={cssClass({ fontWeight: 600, color: "#111827", fontSize: 12 })}>{emp.employee_name}</div>
                      <div className={cssClass({ fontSize: 10, color: "#9ca3af" })}>{emp.emp_code}</div>
                    </td>
                    <td className={cssClass({ padding: "9px 10px", color: "#6b7280" })}>{emp.department_name || "—"}</td>
                    {emp.balances.map((b) =>
                  <td key={b.leave_type_id}
                  onClick={() => setEditing({ emp, bal: b })} className={cssClass({ padding: "9px 8px", textAlign: "center", cursor: "pointer" })}>
                        <span className={cssClass({ color: "#374151" })}>{fmt(b.granted)}</span>
                        {" / "}
                        <span className={cssClass({ color: "#dc2626" })}>{fmt(b.availed)}</span>
                        {" / "}
                        <span className={cssClass({ color: "#16a34a", fontWeight: 700 })}>{fmt(b.balance)}</span>
                        {!b.initialized && <span className={cssClass({ marginLeft: 2, fontSize: 9, color: "#d1d5db" })}>⊕</span>}
                      </td>
                  )}
                    <td className={cssClass({ padding: "9px 8px", textAlign: "center", color: "#dc2626", fontWeight: 700 })}>{fmt(totalAv)}</td>
                    <td className={cssClass({ padding: "9px 8px", textAlign: "center", color: "#16a34a", fontWeight: 700 })}>{fmt(totalBal)}</td>
                  </tr>);

            })}
              {/* Totals */}
              <tr className={cssClass({ background: "#f9fafb", fontWeight: 700 })}>
                <td className={cssClass({ padding: "9px 14px", position: "sticky", left: 0, background: "#f9fafb", color: "#374151", fontSize: 12 })}>
                  TOTAL ({filtered.length})
                </td>
                <td />
                {leaveTypes.map((lt) =>
              <td key={lt.leave_type_id} className={cssClass({ padding: "9px 8px", textAlign: "center", fontSize: 12 })}>
                    {fmt(totals[lt.leave_type_id]?.granted)}
                    {" / "}
                    <span className={cssClass({ color: "#dc2626" })}>{fmt(totals[lt.leave_type_id]?.availed)}</span>
                    {" / "}
                    <span className={cssClass({ color: "#16a34a" })}>{fmt(totals[lt.leave_type_id]?.balance)}</span>
                  </td>
              )}
                <td className={cssClass({ textAlign: "center", color: "#dc2626" })}>{fmt(Object.values(totals).reduce((s, t) => s + t.availed, 0))}</td>
                <td className={cssClass({ textAlign: "center", color: "#16a34a" })}>{fmt(Object.values(totals).reduce((s, t) => s + t.balance, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      }

      {editing &&
      <EditBalanceModal emp={editing.emp} bal={editing.bal} year={year}
      onClose={() => setEditing(null)}
      onSave={async (payload) => {
        await adjustLeaveBalance(payload);
        setEditing(null);
        showToast("Balance updated");
        load(year);
      }} />

      }
    </div>);

}

function EditBalanceModal({ emp, bal, year, onClose, onSave }) {
  const [form, setForm] = useState({
    opening_balance: bal.opening_balance,
    granted: bal.granted,
    availed: bal.availed
  });
  const [saving, setSaving] = useState(false);
  const balance = Math.max(0, Number(form.opening_balance || 0) + Number(form.granted || 0) - Number(form.availed || 0));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ employeeId: emp.employee_id, leaveTypeId: bal.leave_type_id, year,
        opening_balance: Number(form.opening_balance) || 0,
        granted: Number(form.granted) || 0,
        availed: Number(form.availed) || 0
      });
    } catch (e) {alert(e.message);setSaving(false);}
  };

  const Field = ({ k, label }) =>
  <div>
      <label className={cssClass({ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 5 })}>{label}</label>
      <input type="number" min={0} step={0.5} value={form[k]}
    onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))} className={cssClass(
      { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb",
        fontSize: 13, outline: "none", fontFamily: "inherit" })} />
    </div>;


  return (
    <div className={cssClass({ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center" })}>
      <div className={cssClass({ background: "#fff", borderRadius: 14, padding: 24, width: 400, boxShadow: "0 8px 40px #0003" })}>
        <div className={cssClass({ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 4 })}>Edit Balance</div>
        <div className={cssClass({ fontSize: 12, color: "#9ca3af", marginBottom: 18 })}>
          {emp.employee_name} ({emp.emp_code}) — {bal.leave_type_name} {year}
        </div>
        <div className={cssClass({ display: "flex", flexDirection: "column", gap: 12 })}>
          <Field k="opening_balance" label="Opening Balance (days)" />
          <Field k="granted" label="Granted (days)" />
          <Field k="availed" label="Availed (days)" />
        </div>
        <div className={cssClass({ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8,
          padding: "10px 14px", display: "flex", justifyContent: "space-between",
          alignItems: "center", marginTop: 14 })}>
          <span className={cssClass({ fontSize: 13, color: "#374151" })}>Computed Balance</span>
          <span className={cssClass({ fontSize: 20, fontWeight: 900, color: "#16a34a" })}>{balance.toFixed(1)}</span>
        </div>
        <div className={cssClass({ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 })}>
          <Btn variant="cancel" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Btn>
        </div>
      </div>
    </div>);

}

/* ═══════════════════════════════════════════════════
   LEAVE TYPES TAB
═══════════════════════════════════════════════════ */
function LeaveTypesTab() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {setToast({ msg, type });setTimeout(() => setToast(null), 3000);};

  const load = async () => {
    setLoading(true);
    try {const r = await listLeaveTypes();setTypes(Array.isArray(r) ? r : r.data || []);}
    catch (e) {showToast(e.message, "error");} finally
    {setLoading(false);}
  };
  useEffect(() => {load();}, []);

  const handleSave = async (form) => {
    form.leave_type_id ?
    await updateLeaveType(form.leave_type_id, form) :
    await createLeaveType(form);
    showToast(form.leave_type_id ? "Leave type updated" : "Leave type created");
    setEditing(null);
    load();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {await deleteLeaveType(id);showToast("Deleted");load();}
    catch (e) {showToast(e.message, "error");}
  };

  return (
    <div className={cssClass({ display: "flex", flexDirection: "column", gap: 16 })}>
      <Toast {...toast || { msg: null }} />
      <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center" })}>
        <span className={cssClass({ fontSize: 13, color: "#9ca3af" })}>Configure leave types, quotas and carry-forward rules.</span>
        <Btn onClick={() => setEditing({ leave_type_name: "", short_code: "", annual_quota: 0, carry_forward_limit: 0, requires_proof: false, description: "" })}>
          <Plus size={14} />New Leave Type
        </Btn>
      </div>
      {loading && <div className={cssClass({ padding: 40, textAlign: "center", color: "#9ca3af" })}>Loading…</div>}
      {!loading &&
      <div className={cssClass({ border: "1px solid #e9eaec", borderRadius: 12, overflow: "hidden" })}>
          <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 13 })}>
            <thead>
              <tr className={cssClass({ background: "#fafafa" })}>
                {["Code", "Name", "Annual Quota", "Carry Forward", "Proof", "Description", ""].map((h) =>
              <th key={h} className={cssClass({ padding: "10px 14px", fontWeight: 700, fontSize: 11, color: "#9ca3af",
                textTransform: "uppercase", letterSpacing: ".06em", textAlign: "left",
                borderBottom: "1px solid #e9eaec" })}>{h}</th>
              )}
              </tr>
            </thead>
            <tbody>
              {types.map((t) =>
            <tr key={t.leave_type_id}
            onMouseEnter={(e) => e.currentTarget.style.background = "#fafafa"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}>
                  <td className={cssClass({ padding: "11px 14px", fontFamily: "monospace", color: B, fontWeight: 700 })}>
                    {t.short_code || "—"}
                  </td>
                  <td className={cssClass({ padding: "11px 14px", fontWeight: 600, color: "#111827" })}>{t.leave_type_name}</td>
                  <td className={cssClass({ padding: "11px 14px", textAlign: "center" })}>{t.annual_quota}d</td>
                  <td className={cssClass({ padding: "11px 14px", textAlign: "center" })}>{t.carry_forward_limit}d</td>
                  <td className={cssClass({ padding: "11px 14px", textAlign: "center" })}>
                    <span className={cssClass({
                  background: t.requires_proof ? "#eff6ff" : "#f3f4f6",
                  color: t.requires_proof ? "#2563eb" : "#6b7280",
                  borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700
                })}>{t.requires_proof ? "Yes" : "No"}</span>
                  </td>
                  <td className={cssClass({ padding: "11px 14px", color: "#9ca3af", maxWidth: 200, overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap" })}>{t.description || "—"}</td>
                  <td className={cssClass({ padding: "11px 14px" })}>
                    <div className={cssClass({ display: "flex", gap: 6 })}>
                      <Btn size="sm" variant="cancel" onClick={() => setEditing({ ...t })}>
                        <Edit2 size={12} />Edit
                      </Btn>
                      <Btn size="sm" variant="danger" onClick={() => handleDelete(t.leave_type_id, t.leave_type_name)}>
                        <Trash2 size={12} />Delete
                      </Btn>
                    </div>
                  </td>
                </tr>
            )}
              {types.length === 0 &&
            <tr><td colSpan={7} className={cssClass({ textAlign: "center", padding: 40, color: "#9ca3af" })}>
                  No leave types configured.
                </td></tr>
            }
            </tbody>
          </table>
        </div>
      }
      {editing &&
      <LeaveTypeModal initial={editing} onClose={() => setEditing(null)} onSave={handleSave} />
      }
    </div>);

}

function LeaveTypeModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState({ ...initial });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.leave_type_name.trim()) {alert("Leave type name is required");return;}
    setSaving(true);
    try {await onSave(form);} catch (e) {alert(e.message);setSaving(false);}
  };

  const F = ({ k, label, type = "text", ...rest }) =>
  <div>
      <label className={cssClass({ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 5 })}>{label}</label>
      <input type={type} value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} {...rest} className={cssClass(
      { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb",
        fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" })} />
    </div>;


  return (
    <div className={cssClass({ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center" })}>
      <div className={cssClass({ background: "#fff", borderRadius: 14, padding: 26, width: 440, boxShadow: "0 8px 40px #0003" })}>
        <div className={cssClass({ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 20 })}>
          {form.leave_type_id ? "Edit Leave Type" : "New Leave Type"}
        </div>
        <form onSubmit={handleSubmit} className={cssClass({ display: "flex", flexDirection: "column", gap: 12 })}>
          <F k="leave_type_name" label="Name *" />
          <F k="short_code" label="Short Code (e.g. EL, SL, CL)" />
          <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 })}>
            <F k="annual_quota" label="Annual Quota (days)" type="number" min={0} />
            <F k="carry_forward_limit" label="Carry Forward Limit (days)" type="number" min={0} />
          </div>
          <div>
            <label className={cssClass({ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 5 })}>Description</label>
            <textarea rows={2} value={form.description || ""} onChange={(e) => set("description", e.target.value)} className={cssClass(
              { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb",
                fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" })} />
          </div>
          <label className={cssClass({ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", cursor: "pointer" })}>
            <input type="checkbox" checked={!!form.requires_proof} onChange={(e) => set("requires_proof", e.target.checked)} className={cssClass(
              { accentColor: B, width: 14, height: 14 })} />
            Proof Required
          </label>
          <div className={cssClass({ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 })}>
            <Btn type="button" variant="cancel" onClick={onClose}>Cancel</Btn>
            <Btn type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Btn>
          </div>
        </form>
      </div>
    </div>);

}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
const TABS = [
{ key: "calendar", label: "Leave Calendar", icon: <Calendar size={15} /> },
{ key: "requests", label: "Leave Requests", icon: <List size={15} /> },
{ key: "balances", label: "Leave Balances", icon: <BarChart2 size={15} /> },
{ key: "types", label: "Leave Types", icon: <LayoutGrid size={15} /> }];


export default function AdminLeaveManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "calendar";
  const setTab = (t) => setSearchParams({ tab: t }, { replace: true });

  return (
    <div className={cssClass({ minHeight: "100vh", background: "#f8f9fb", padding: "24px 28px",
      fontFamily: "'Inter','Plus Jakarta Sans',system-ui,sans-serif" })}>
      <div className={cssClass({ maxWidth: 1280, margin: "0 auto" })}>

        {/* Header */}
        <div className={cssClass({ marginBottom: 22 })}>
          <h1 className={cssClass({ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827",
            fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", letterSpacing: "-0.025em" })}>
            Leave Management
          </h1>
          <p className={cssClass({ margin: "4px 0 0", fontSize: 13, color: "#9ca3af" })}>
            Calendar view · approve requests · manage balances · configure leave types
          </p>
        </div>

        {/* Tabs */}
        <div className={cssClass({ display: "flex", gap: 0, borderBottom: "2px solid #e9eaec", marginBottom: 24 })}>
          {TABS.map((t) =>
          <button key={t.key} onClick={() => setTab(t.key)} className={cssClass(
            {
              display: "flex", alignItems: "center", gap: 6,
              padding: "10px 18px", fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? B : "#6b7280",
              background: "none", border: "none", cursor: "pointer",
              borderBottom: tab === t.key ? `2px solid ${B}` : "2px solid transparent",
              marginBottom: -2, transition: "color .15s"
            })}>
              <span className={cssClass({ color: tab === t.key ? B : "#9ca3af" })}>{t.icon}</span>
              {t.label}
            </button>
          )}
        </div>

        {/* Content */}
        <div>
          {tab === "calendar" && <CalendarTab />}
          {tab === "requests" && <RequestsTab />}
          {tab === "balances" && <BalancesTab />}
          {tab === "types" && <LeaveTypesTab />}
        </div>
      </div>
    </div>);

}
