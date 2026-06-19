import React, { useEffect, useState } from "react";
import { listAttendance } from "../../api/attendance.api";
import ManagerTabs from "./ManagerTabs";
import "../admin/adminDashboard.css";

function getInitials(name) {
  return (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function fmt(val) {
  if (!val) return "—";
  return String(val).slice(0, 5);
}

const STATUS_BADGE = {
  present: "approved",
  absent: "rejected",
  late: "pending",
  "half-day": "pending",
};

const TeamAttendance = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    setLoading(true);
    listAttendance({ from_date: date, to_date: date, limit: 200 })
      .then(({ data }) => setRecords(data || []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [date]);

  return (
    <div className="admin-dash space-y-4">
      <ManagerTabs />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Team Attendance</h1>
          <p className="text-gray-500 mt-1">Attendance for employees mapped under you.</p>
        </div>
        <input
          type="date"
          value={date}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
        />
      </div>

      <div className="admin-dash-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-10">Loading…</p>
          ) : records.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">
              No attendance records found for {date}.
            </p>
          ) : (
            <table className="admin-att-table w-full">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Work Hours</th>
                  <th>Late By</th>
                </tr>
              </thead>
              <tbody>
                {records.map((m) => (
                  <tr key={m.attendance_id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className="admin-emp-avatar">{getInitials(m.employee_name)}</span>
                        <div>
                          <span className="font-medium text-gray-900 block">{m.employee_name}</span>
                          <span className="text-xs text-gray-400">{m.emp_code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm text-gray-600">{m.department_name || "—"}</td>
                    <td>
                      <span className={`admin-status-badge ${STATUS_BADGE[m.status] || "pending"}`}>
                        {m.status || "—"}
                      </span>
                    </td>
                    <td className="text-sm text-gray-600">{fmt(m.check_in)}</td>
                    <td className="text-sm text-gray-600">{fmt(m.check_out)}</td>
                    <td className="text-sm text-gray-600">
                      {m.work_hours != null ? `${Number(m.work_hours).toFixed(2)}h` : "—"}
                    </td>
                    <td className="text-sm text-gray-600">
                      {m.late_by_minutes > 0 ? `${m.late_by_minutes} min` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamAttendance;
