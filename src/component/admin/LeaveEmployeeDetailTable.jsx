import React from "react";

function statusClass(status) {
  if (status === "Approved") return "approved";
  if (status === "Rejected") return "rejected";
  return "pending";
}

/** Reusable table for employees on leave (calendar day, quick stats, today list) */
export default function LeaveEmployeeDetailTable({ rows = [], emptyMessage }) {
  if (!rows.length) {
    return (
      <p className="text-sm text-gray-400 py-4 text-center bg-gray-50 rounded-lg">
        {emptyMessage ?? "No employees on leave."}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="admin-att-table w-full">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Department</th>
            <th>Leave Type</th>
            <th>From</th>
            <th>To</th>
            <th>Days</th>
            {rows.some((r) => r.reason) && <th>Reason</th>}
            {rows.some((r) => r.status) && <th>Status</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id ?? `${row.employee}-${row.from}`}>
              <td className="font-medium text-gray-900">{row.employee}</td>
              <td className="text-gray-600">{row.department}</td>
              <td className="text-gray-600">{row.type}</td>
              <td className="text-gray-600">{row.from}</td>
              <td className="text-gray-600">{row.to}</td>
              <td className="text-gray-600">{row.days}</td>
              {rows.some((r) => r.reason) && (
                <td className="text-gray-500 text-xs max-w-[140px]">{row.reason ?? "—"}</td>
              )}
              {rows.some((r) => r.status) && (
                <td>
                  {row.status ? (
                    <span className={`admin-status-badge ${statusClass(row.status)}`}>
                      {row.status}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
