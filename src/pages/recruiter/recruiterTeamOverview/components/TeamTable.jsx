import React from "react";
import { Search } from "lucide-react";
import Pagination from "../../../../components/Pagination";
import { getInitials, fmt, deptColor } from "../utils";

const TeamTable = React.memo(function TeamTable({
  filteredTeam,
  team,
  att,
  departments,
  deptFilter,
  search,
  setSearch,
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
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-wrap gap-3">
        <h2 className="text-base font-semibold text-gray-700">
          Employees
          {deptFilter !== "All" && (
            <span className="ml-2 text-xs text-blue-600 font-normal">· {deptFilter}</span>
          )}
          <span className="ml-2 text-xs text-gray-400 font-normal">
            {filteredTeam.length} of {team.length}
          </span>
        </h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        {filteredTeam.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No employees found.</p>
        ) : (
          <>
            <table className="admin-att-table w-full">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Today</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((m) => {
                  const empId = m.employee_id || m.id;
                  const rec = att.find((a) => String(a.employee_id) === String(empId));
                  const status = rec?.status || "—";
                  const badgeCls =
                    status === "Present"
                      ? "approved"
                      : status === "Absent"
                      ? "rejected"
                      : status === "Late"
                      ? "pending"
                      : "";
                  const dept = m.department_name || m.department || "—";
                  return (
                    <tr key={empId}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {getInitials(m.name || m.employee_name)}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-800">
                              {m.name || m.employee_name || "—"}
                            </p>
                            <p className="text-xs text-gray-400">{m.emp_code || ""}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${deptColor(dept, departments)}`}>
                          {dept}
                        </span>
                      </td>
                      <td className="text-sm text-gray-600">{m.role_name || m.job_title || "—"}</td>
                      <td>
                        {badgeCls ? (
                          <span className={`admin-status-badge ${badgeCls}`}>{status}</span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="text-sm text-gray-600">{fmt(rec?.check_in)}</td>
                      <td className="text-sm text-gray-600">{fmt(rec?.check_out)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
          </>
        )}
      </div>
    </div>
  );
});

export default TeamTable;
