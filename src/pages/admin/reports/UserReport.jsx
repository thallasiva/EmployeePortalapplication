import React, { useEffect, useState, useMemo } from "react";
import { Search, Users } from "lucide-react";
import { listEmployees } from "../../../api/employee.api";
import { getDepartmentName } from "../../../utils/employeeDisplay";
import {
  ReportPageHeader,
  ReportAvatar,
  ReportStatusBadge } from
"../../../component/reports/ReportsLayout";import { cssClass, joinClasses } from "../../../utils/classStyles";

const ROLE_COLORS = {
  Admin: "bg-purple-100 text-purple-700",
  HR: "bg-blue-100 text-blue-700",
  Manager: "bg-amber-100 text-amber-700",
  Employee: "bg-gray-100 text-gray-600"
};

export default function UserReport() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");

  useEffect(() => {
    listEmployees({ limit: 500 }).
    then((data) => setEmployees(Array.isArray(data) ? data : [])).
    catch(() => setEmployees([])).
    finally(() => setLoading(false));
  }, []);

  const departments = useMemo(() => {
    const depts = [...new Set(employees.map((e) => getDepartmentName(e)).filter(Boolean))].sort();
    return ["All", ...depts];
  }, [employees]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter((e) => {
      const name = `${e.first_name} ${e.last_name}`.toLowerCase();
      const matchSearch = !q || name.includes(q) || (e.email ?? "").toLowerCase().includes(q) || (e.emp_code ?? "").toLowerCase().includes(q);
      const matchDept = deptFilter === "All" || getDepartmentName(e) === deptFilter;
      return matchSearch && matchDept;
    });
  }, [employees, search, deptFilter]);

  const activeCount = employees.filter((e) => e.employee_status === "Active").length;
  const inactiveCount = employees.filter((e) => e.employee_status !== "Active").length;
  const deptCount = new Set(employees.map((e) => getDepartmentName(e))).size;

  return (
    <div className="report-page">
      <ReportPageHeader title="User Report" />

      {}
      <div className={joinClasses("report-stats-grid", cssClass({ maxWidth: 800 }))}>
        {[
        { label: "Total Users", value: employees.length, barWidth: "100%", barColor: "#f18200" },
        { label: "Active", value: activeCount, barWidth: `${employees.length ? activeCount / employees.length * 100 : 0}%`, barColor: "#16a34a" },
        { label: "Inactive", value: inactiveCount, barWidth: `${employees.length ? inactiveCount / employees.length * 100 : 0}%`, barColor: "#ef4444" },
        { label: "Departments", value: deptCount, barWidth: "100%", barColor: "#f97316" }].
        map((s) =>
        <div key={s.label} className="report-stat-card">
            <p className="report-stat-card__value">{s.value}</p>
            <p className="report-stat-card__label">{s.label}</p>
            <div className="report-stat-card__bar-bg">
              <div className={joinClasses("report-stat-card__bar", cssClass({ width: s.barWidth, background: s.barColor }))} />
            </div>
          </div>
        )}
      </div>

      <div className="report-table-section">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h3 className="font-semibold text-gray-800 text-sm flex-1">User List</h3>
          <div className="flex items-center gap-1.5 border border-gray-200 rounded px-2.5 h-9 bg-white">
            <Search size={14} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search user…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm outline-none w-40" />

          </div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="h-9 px-2 border border-gray-200 rounded text-sm outline-none bg-white">

            {departments.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>

        {loading ?
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Loading users…</div> :
        filtered.length === 0 ?
        <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
            <Users size={32} className="opacity-30" />
            <p className="text-sm">No users found.</p>
          </div> :

        <div className={cssClass({ overflowX: "auto" })}>
            <table className="report-data-table">
              <thead>
                <tr>
                  <th><input type="checkbox" className="report-checkbox" aria-label="Select all" /></th>
                  <th>Emp Code</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp, idx) => {
                const name = `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim();
                const role = emp.emp_job_title?.toLowerCase().includes("admin") ? "Admin" :
                emp.emp_job_title?.toLowerCase().includes("hr") ? "HR" :
                emp.emp_job_title?.toLowerCase().includes("manager") ? "Manager" :
                "Employee";
                const joined = emp.emp_joining_date ?
                new Date(emp.emp_joining_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) :
                "—";
                return (
                  <tr key={emp.employee_id ?? idx}>
                      <td><input type="checkbox" className="report-checkbox" aria-label={`Select ${name}`} /></td>
                      <td className="text-gray-500">{emp.emp_code ?? "—"}</td>
                      <td>
                        <div className="report-person-cell">
                          <ReportAvatar name={name || "U"} />
                          <div>
                            <strong>{name}</strong>
                            <div className="text-xs text-gray-400">{emp.emp_job_title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-gray-600">{emp.email ?? "—"}</td>
                      <td>{getDepartmentName(emp) ?? "—"}</td>
                      <td>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${ROLE_COLORS[role] ?? ROLE_COLORS.Employee}`}>
                          {role}
                        </span>
                      </td>
                      <td className="text-gray-500">{joined}</td>
                      <td>
                        <ReportStatusBadge status={emp.employee_status === "Active" ? "Active" : "Inactive"} />
                      </td>
                    </tr>);

              })}
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>);

}
