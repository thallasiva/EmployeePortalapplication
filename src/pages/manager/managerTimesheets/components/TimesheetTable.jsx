import React from "react";
import Pagination from "../../../../components/Pagination";
import StatusBadge from "./StatusBadge";
import { formatHours, formatDate } from "../utils";

const TimesheetTable = React.memo(function TimesheetTable({
  loading,
  timesheets,
  setViewId,
  paged,
  page,
  setPage,
  totalPages,
  from,
  to,
  total,
  pageSize,
  setPageSize,
}) {
  return (
    <div className="admin-dash-card !p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="admin-att-table w-full">
          <thead>
            <tr>
              <th>Employee</th>
              <th className="text-center">Week</th>
              <th className="text-center">Total Hours</th>
              <th className="text-center">Status</th>
              <th className="text-center">Submitted</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : timesheets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No timesheets found
                </td>
              </tr>
            ) : (
              paged.map((ts) => (
                <tr key={ts.timesheet_id}>
                  <td>
                    <div>
                      <p className="font-medium text-gray-900">{ts.employee_name}</p>
                      <p className="text-xs text-gray-400">
                        {ts.emp_code} · {ts.department_name}
                      </p>
                    </div>
                  </td>
                  <td className="font-medium text-gray-700">
                    {ts.week_start} to {ts.week_end}
                  </td>
                  <td className="font-semibold text-brand">{formatHours(ts.total_hours)}</td>
                  <td>
                    <StatusBadge status={ts.status} />
                  </td>
                  <td className="text-xs text-gray-500">{formatDate(ts.submitted_at)}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setViewId(ts.timesheet_id)}
                      className="text-xs font-semibold text-brand hover:underline px-3 py-1 rounded-lg border border-brand/30 hover:bg-brand/5"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        from={from}
        to={to}
        total={total}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />
    </div>
  );
});

export default TimesheetTable;
