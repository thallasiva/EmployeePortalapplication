import { memo } from "react";
import { ChevronLeft, ChevronRight, Calendar, LayoutGrid, BarChart2 } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { CALENDAR_SHIFTS, LEAVE_COLORS } from "../constants/leaveConstants";
import Btn from "./Btn";

const VIEW_BUTTONS = [
  { key: "month", icon: <Calendar size={14} />,  label: "Month" },
  { key: "week",  icon: <LayoutGrid size={14} />, label: "Week"  },
  { key: "year",  icon: <BarChart2 size={14} />,  label: "Year"  },
];

/** Toolbar: view-switcher, prev/next navigation, employee filter, and legend */
const CalendarControls = memo(({
  view, setView,
  rangeLabel,
  navigateDelta,
  resetToday,
  empFilter, setEmpFilter,
  employees, shift,
  leaveTypes,
  currentShiftDef,
}) => (
  <div className={cssClass({ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 18 })}>
    {/* View switcher */}
    <div className={cssClass({ display: "flex", border: `1px solid ${currentShiftDef.border}`, borderRadius: 8, overflow: "hidden" })}>
      {VIEW_BUTTONS.map((v) => (
        <button key={v.key} onClick={() => setView(v.key)} className={cssClass({
          display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
          background: view === v.key ? currentShiftDef.color : "#fff",
          color: view === v.key ? "#fff" : "#6b7280",
          border: "none", borderRight: `1px solid ${currentShiftDef.border}`, transition: "all .15s",
        })}>
          {v.icon}{v.label}
        </button>
      ))}
    </div>

    {/* Navigation */}
    <div className={cssClass({ display: "flex", alignItems: "center", gap: 6 })}>
      <Btn variant="cancel" size="sm" onClick={() => navigateDelta(-1)}><ChevronLeft size={14} /></Btn>
      <span className={cssClass({ fontSize: 14, fontWeight: 700, color: "#111827", minWidth: 180, textAlign: "center" })}>
        {rangeLabel}
      </span>
      <Btn variant="cancel" size="sm" onClick={() => navigateDelta(1)}><ChevronRight size={14} /></Btn>
      <Btn variant="cancel" size="sm" onClick={resetToday}>Today</Btn>
    </div>

    {/* Employee filter */}
    <select value={empFilter} onChange={(e) => setEmpFilter(e.target.value)} className={cssClass(
      { padding: "7px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, color: "#374151", minWidth: 200 })}>
      <option value="">All Employees</option>
      {employees.filter((e) => !e.shift || e.shift === shift).map((e) => (
        <option key={e.employee_id} value={e.employee_id}>
          {e.first_name} {e.last_name} ({e.emp_code})
        </option>
      ))}
      {employees.filter((e) => e.shift && e.shift !== shift).length > 0 && (
        <option disabled>── Other shifts ──</option>
      )}
      {employees.filter((e) => e.shift && e.shift !== shift).map((e) => (
        <option key={`o${e.employee_id}`} value={e.employee_id}>
          {e.first_name} {e.last_name} ({e.shift})
        </option>
      ))}
    </select>

    {/* Legend */}
    <div className={cssClass({ display: "flex", gap: 10, marginLeft: "auto", flexWrap: "wrap", alignItems: "center" })}>
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
          </div>
        );
      })}
    </div>
  </div>
));

CalendarControls.displayName = "CalendarControls";
export default CalendarControls;
