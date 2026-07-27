import React from "react";
import {
  STATUS_BADGE_CLASS,
  STATUS_LABEL,
} from "../../../../data/adminAttendanceData";
import { getInitials } from "../utils";

const EmployeeTable = React.memo(function EmployeeTable({ employees, onRegularize }) {
  if (employees.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">
        No employees in this category.
      </p>
    );
  }

  const canRegularize = (emp) =>
    emp.status !== "absent" && emp.status !== "leave";

  return (
    <div className="overflow-x-auto">
      <table className="admin-att-table w-full">
        <thead>
          <tr>
            <th>
              <input type="checkbox" className="rounded" aria-label="Select all" />
            </th>
            <th>Employee</th>
            <th>Status</th>
            <th>Check In</th>
            <th>Check Out</th>
            <th>Break</th>
            <th>Late</th>
            <th>Production Hours</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td>
                <input
                  type="checkbox"
                  className="rounded"
                  aria-label={`Select ${emp.name}`}
                />
              </td>
              <td>
                <div className="flex items-center gap-2.5">
                  <span className="admin-emp-avatar">{getInitials(emp.name)}</span>
                  <div>
                    <span className="font-medium text-gray-900 block">{emp.name}</span>
                    <span className="text-xs text-gray-400">{emp.department}</span>
                  </div>
                </div>
              </td>
              <td>
                <span className={`admin-status-badge ${STATUS_BADGE_CLASS[emp.status] || ""}`}>
                  {STATUS_LABEL[emp.status]}
                </span>
              </td>
              <td className="text-gray-600">{emp.checkIn}</td>
              <td className="text-gray-600">{emp.checkOut}</td>
              <td className="text-gray-600">{emp.break}</td>
              <td className="text-gray-600">{emp.late}</td>
              <td>
                {emp.status === "absent" || emp.status === "leave" ? (
                  <span className="text-xs text-gray-400">—</span>
                ) : (
                  <span className={`admin-production-pill ${emp.productionGood ? "is-good" : "is-low"}`}>
                    🕐 {emp.production}
                  </span>
                )}
              </td>
              <td>
                {canRegularize(emp) ? (
                  <button
                    type="button"
                    className="admin-regularize-btn"
                    onClick={() => onRegularize(emp.id)}
                    disabled={emp.regularized}
                  >
                    {emp.regularized ? "Regularized" : "Regularizations"}
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default EmployeeTable;
