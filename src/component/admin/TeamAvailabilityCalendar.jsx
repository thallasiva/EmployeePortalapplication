import React, { useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Info } from "lucide-react";
import {
  buildLeaveCalendarDays,
  buildMonthCalendarCells,
  formatMonthLabel } from
"../../utils/adminLeaveUtils";
import LeaveEmployeeDetailTable from "./LeaveEmployeeDetailTable";
import "./teamAvailabilityCalendar.css";import { cssClass, joinClasses } from "../../utils/classStyles";

export const AVAILABILITY_DOT = {
  available: "#22c55e",
  some: "#eab308",
  many: "#ef4444"
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function TeamAvailabilityCalendar({
  requests,
  totalEmployees = 24,
  purposeText,
  initialDate = new Date()
}) {
  const [calYear, setCalYear] = useState(initialDate.getFullYear());
  const [calMonth, setCalMonth] = useState(initialDate.getMonth());
  const [selectedDay, setSelectedDay] = useState(initialDate.getDate());

  const calendarDays = useMemo(
    () => buildLeaveCalendarDays(requests, calYear, calMonth, totalEmployees),
    [requests, calYear, calMonth, totalEmployees]
  );

  const calendarCells = useMemo(
    () => buildMonthCalendarCells(calYear, calMonth, calendarDays),
    [calYear, calMonth, calendarDays]
  );

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const safeSelectedDay = Math.min(selectedDay, daysInMonth);
  const selectedDayInfo = calendarDays[safeSelectedDay] ?? {
    status: "available",
    count: 0,
    employees: []
  };

  const shiftMonth = (delta) => {
    const d = new Date(calYear, calMonth + delta, 1);
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth());
    setSelectedDay(1);
  };

  const isToday = (day) => {
    const now = new Date();
    return (
      day === now.getDate() &&
      calMonth === now.getMonth() &&
      calYear === now.getFullYear());

  };

  const monthLabel = formatMonthLabel(calYear, calMonth);

  return (
    <div className="team-avail-cal">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-gray-600" />
          <h3 className="font-semibold text-gray-900">Team Availability — {monthLabel}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="p-1 rounded hover:bg-gray-100"
            aria-label="Previous month">

            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="p-1 rounded hover:bg-gray-100"
            aria-label="Next month">

            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {purposeText &&
      <div className="flex gap-2 items-start p-2 mb-3 rounded-lg bg-blue-50/60 border border-blue-100">
          <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-900 leading-relaxed">{purposeText}</p>
        </div>
      }

      <div className="admin-cal-grid">
        {WEEKDAYS.map((d) =>
        <div key={d} className="admin-cal-head">
            {d}
          </div>
        )}
        {calendarCells.map((cell, idx) =>
        cell.type === "empty" ?
        <div key={`empty-${idx}`} className="admin-cal-cell muted" /> :

        <button
          key={`day-${cell.day}`}
          type="button"
          onClick={() => setSelectedDay(cell.day)}
          className={`admin-cal-cell selectable team-avail-cal__day ${
          safeSelectedDay === cell.day ? "selected" : ""} ${
          isToday(cell.day) ? "team-avail-cal__day--today" : ""}`}
          title={
          cell.count === 0 ?
          "Full team available" :
          `${cell.count} employee${cell.count > 1 ? "s" : ""} on leave`
          }>

              {cell.day}
              <span
            className={joinClasses("admin-cal-dot", cssClass(
              { background: AVAILABILITY_DOT[cell.status] }))} />

              {cell.count > 0 &&
          <span className="team-avail-cal__count">{cell.count}</span>
          }
            </button>

        )}
      </div>

      <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-gray-100">
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
          <span className={joinClasses("admin-cal-dot", cssClass({ background: AVAILABILITY_DOT.available }))} />
          Available (0 out)
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
          <span className={joinClasses("admin-cal-dot", cssClass({ background: AVAILABILITY_DOT.some }))} />
          Some out (1–4)
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
          <span className={joinClasses("admin-cal-dot", cssClass({ background: AVAILABILITY_DOT.many }))} />
          Many out (5+)
        </span>
      </div>

      <div className="team-avail-cal__detail mt-4">
        <p className="text-sm font-semibold text-gray-800 mb-3">
          Employees on leave — {safeSelectedDay} {monthLabel}
          <span className="ml-2 text-xs font-normal text-gray-500">
            ({selectedDayInfo.count} of {totalEmployees})
          </span>
        </p>
        <LeaveEmployeeDetailTable
          rows={selectedDayInfo.employees}
          emptyMessage="Full team available on this date. No approved leave." />

      </div>
    </div>);

}
