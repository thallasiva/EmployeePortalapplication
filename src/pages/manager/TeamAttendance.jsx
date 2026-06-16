import React from "react";
import { RM_TEAM_MEMBERS, SHIFT_LABEL } from "../../data/managerData";
import ManagerTabs from "./ManagerTabs";
import "../admin/adminDashboard.css";

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const STATUS_BADGE = {
  present: "approved",
  absent: "rejected",
  late: "pending",
};

const STATUS_LABEL = {
  present: "Present",
  absent: "Absent",
  late: "Late",
};

const TeamAttendance = () => {
  return (
    <div className="admin-dash space-y-4">
      <ManagerTabs />

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Team Attendance
        </h1>
        <p className="text-gray-500 mt-1">
          Today&apos;s attendance for employees mapped under you.
        </p>
      </div>

      <div className="admin-dash-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-att-table w-full">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Shift</th>
                <th>Status</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Production Hours</th>
                <th>Late By</th>
              </tr>
            </thead>
            <tbody>
              {RM_TEAM_MEMBERS.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <span className="admin-emp-avatar">{getInitials(m.name)}</span>
                      <div>
                        <span className="font-medium text-gray-900 block">{m.name}</span>
                        <span className="text-xs text-gray-400">{m.designation}</span>
                      </div>
                    </div>
                  </td>
                  <td className="text-sm text-gray-600">{m.department}</td>
                  <td className="text-sm text-gray-600">{SHIFT_LABEL[m.shift]}</td>
                  <td>
                    <span className={`admin-status-badge ${STATUS_BADGE[m.status]}`}>
                      {STATUS_LABEL[m.status]}
                    </span>
                  </td>
                  <td className="text-sm text-gray-600">{m.checkIn}</td>
                  <td className="text-sm text-gray-600">{m.checkOut}</td>
                  <td className="text-sm text-gray-600">{m.hours}</td>
                  <td className="text-sm text-gray-600">{m.lateBy || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeamAttendance;
