import React, { useEffect, useState, useMemo } from "react";
import {
  ReportPageHeader, ReportIconStatCard, ReportTableToolbar,
  ReportAvatar, ReportStatusBadge,
} from "../../../component/reports/ReportsLayout";
import { listEmployees } from "../../../api/employee.api";
import { getDepartmentName } from "../../../utils/employeeDisplay";

function EmployeeBarChart({ employees }) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const data = useMemo(() => {
    const counts = months.map((m, i) => {
      const active = employees.filter(e => {
        if (!e.emp_joining_date) return false;
        const d = new Date(e.emp_joining_date);
        return d.getMonth() === i;
      }).length;
      return { label: m, active, inactive: 0 };
    });
    return counts;
  }, [employees]);

  const yMax = Math.max(...data.map(d => d.active), 1);

  return (
    <div className="report-chart-card">
      <div className="report-chart-card__header">
        <h3 className="report-chart-card__title"><span className="report-chart-card__title-dot" />Joinings by Month</h3>
      </div>
      <div className="report-bar-legend">
        <span><i style={{ background: "#22c55e" }} /> Joined</span>
      </div>
      <div className="report-bar-chart">
        {data.map(row => (
          <div key={row.label} className="report-bar-group">
            <div className="report-bar-pair">
              <div className="report-bar" style={{ height: `${(row.active / yMax) * 150}px`, background: "#22c55e" }} />
            </div>
            <span className="report-bar-label">{row.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EmployeeReport() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    listEmployees({ limit: 500 })
      .then(({ data }) => setEmployees(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active   = employees.filter(e => e.employee_status === "Active").length;
  const inactive = employees.filter(e => e.employee_status !== "Active").length;
  const thisMonth = useMemo(() => {
    const now = new Date();
    return employees.filter(e => {
      if (!e.emp_joining_date) return false;
      const d = new Date(e.emp_joining_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [employees]);

  const stats = [
    { label: "Total Employees", value: employees.length, color: "#f97316", trend: "All time" },
    { label: "Active",          value: active,            color: "#22c55e", trend: "Currently active" },
    { label: "New This Month",  value: thisMonth,         color: "#3b82f6", trend: "Joined this month" },
    { label: "Inactive",        value: inactive,          color: "#ef4444", trend: "Not active" },
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(e =>
      [e.first_name, e.last_name, e.email, getDepartmentName(e), e.emp_job_title]
        .some(v => (v || "").toLowerCase().includes(q))
    );
  }, [employees, search]);

  if (loading) return <div className="report-page"><p className="text-sm text-gray-400 p-6">Loading…</p></div>;

  return (
    <div className="report-page">
      <ReportPageHeader title="Employee Report" />
      <div className="report-top-grid">
        <div className="report-stats-grid">
          {stats.map(s => <ReportIconStatCard key={s.label} label={s.label} value={s.value} icon="👤" color={s.color} trend={s.trend} />)}
        </div>
        <EmployeeBarChart employees={employees} />
      </div>
      <div className="report-table-section">
        <ReportTableToolbar title={`Employees (${filtered.length})`} onSearch={setSearch} />
        <div style={{ overflowX: "auto" }}>
          <table className="report-data-table">
            <thead>
              <tr>
                <th>Emp ID</th><th>Name</th><th>Email</th>
                <th>Department</th><th>Phone</th><th>Joining Date</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => {
                const name = [emp.first_name, emp.last_name].filter(Boolean).join(" ") || "—";
                return (
                  <tr key={emp.employee_id}>
                    <td>{emp.emp_code || `EMP${String(emp.employee_id).padStart(3,"0")}`}</td>
                    <td>
                      <div className="report-person-cell">
                        <ReportAvatar name={name} />
                        <div className="report-person-cell__info">
                          <span className="report-person-cell__name">{name}</span>
                          <span className="report-person-cell__sub">{emp.emp_job_title || "—"}</span>
                        </div>
                      </div>
                    </td>
                    <td>{emp.email}</td>
                    <td>{getDepartmentName(emp)}</td>
                    <td>{emp.mobile || "—"}</td>
                    <td>{emp.emp_joining_date ? new Date(emp.emp_joining_date).toLocaleDateString("en-GB") : "—"}</td>
                    <td><ReportStatusBadge status={emp.employee_status || "Active"} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
