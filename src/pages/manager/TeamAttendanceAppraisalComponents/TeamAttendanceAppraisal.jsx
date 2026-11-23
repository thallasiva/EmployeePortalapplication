import React, { useState } from "react";
import { SHIFT_LABEL } from "../../../data/managerData";
import ManagerTabs from ".././ManagerTabs";
import { MONTHS, APPRAISAL_PERIOD, getInitials, APPRAISAL_ATTENDANCE, STATUS_BADGE, STATUS_LABEL } from "./shared";
import { RateBadge } from "./RateBadge";
function TeamAttendanceAppraisal() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const summary = {
    totalMembers: APPRAISAL_ATTENDANCE.length,
    avgAttendance: Math.round(APPRAISAL_ATTENDANCE.reduce((s, e) => s + e.attendanceRate, 0) / APPRAISAL_ATTENDANCE.length),
    fullPresent: APPRAISAL_ATTENDANCE.filter(e => e.attendanceRate >= 95).length,
    needsAttention: APPRAISAL_ATTENDANCE.filter(e => e.attendanceRate < 85).length
  };
  return <div className="admin-dash space-y-4">
      <ManagerTabs />
      {}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Team Attendance — Appraisal View
          </h1>
          <p className="text-gray-500 mt-1">
            {APPRAISAL_PERIOD} · Attendance summary for your reported employees
          </p>
        </div>
        <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-brand focus:outline-none" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
          {MONTHS.map((m, i) => <option key={m} value={i}>{m} {now.getFullYear()}</option>)}
        </select>
      </div>
      {}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[{
        label: "Team Members",
        value: summary.totalMembers,
        color: "text-brand"
      }, {
        label: "Avg Attendance Rate",
        value: `${summary.avgAttendance}%`,
        color: "text-emerald-600"
      }, {
        label: "Excellent Attendance (≥95%)",
        value: summary.fullPresent,
        color: "text-blue-600"
      }, {
        label: "Needs Attention (<85%)",
        value: summary.needsAttention,
        color: "text-red-500"
      }].map(({
        label,
        value,
        color
      }) => <div key={label} className="admin-dash-card py-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>)}
      </div>
      {}
      <div className="admin-dash-card !p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            Employee Attendance Details — {MONTHS[selectedMonth]} {now.getFullYear()}
          </h2>
          <span className="text-xs text-gray-400">Used for performance appraisal scoring</span>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-att-table w-full">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Shift</th>
                <th className="text-center">Today</th>
                <th className="text-center">Present Days</th>
                <th className="text-center">Absent Days</th>
                <th className="text-center">Late Days</th>
                <th className="text-center">Half Days</th>
                <th className="text-center">Total Hours</th>
                <th className="text-center">Avg / Day</th>
                <th className="text-center">Leave Balance</th>
                <th className="text-center">Attendance Rate</th>
              </tr>
            </thead>
            <tbody>
              {APPRAISAL_ATTENDANCE.map(emp => <tr key={emp.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <span className="admin-emp-avatar">{getInitials(emp.name)}</span>
                      <div>
                        <span className="font-medium text-gray-900 block">{emp.name}</span>
                        <span className="text-xs text-gray-400">{emp.designation} · {emp.department}</span>
                      </div>
                    </div>
                  </td>
                  <td className="text-sm text-gray-600">{SHIFT_LABEL[emp.shift]}</td>
                  <td className="text-center">
                    <span className={`admin-status-badge ${STATUS_BADGE[emp.status]}`}>
                      {STATUS_LABEL[emp.status]}
                    </span>
                  </td>
                  <td className="text-center font-semibold text-emerald-600">{emp.presentDays}</td>
                  <td className="text-center font-semibold text-red-500">{emp.absentDays}</td>
                  <td className="text-center font-semibold text-amber-500">{emp.lateDays}</td>
                  <td className="text-center text-gray-600">{emp.halfDays}</td>
                  <td className="text-center text-sm font-medium text-gray-700">{emp.totalHours}</td>
                  <td className="text-center text-sm text-gray-600">{emp.avgDailyHours}</td>
                  <td className="text-center text-sm text-gray-600">
                    <span className={`font-semibold ${emp.leaveBalance <= 5 ? "text-red-500" : "text-gray-700"}`}>
                      {emp.leaveBalance} days
                    </span>
                  </td>
                  <td className="text-center">
                    <RateBadge rate={emp.attendanceRate} />
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>
      {}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500 px-1">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> ≥95% — Excellent</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> 85–94% — Satisfactory</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> &lt;85% — Needs Improvement</span>
      </div>
    </div>;
}
export { TeamAttendanceAppraisal };
