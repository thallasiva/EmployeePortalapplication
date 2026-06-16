import React from "react";
import {
  ReportPageHeader,
  ReportIconStatCard,
  ReportTableToolbar,
  ReportAvatar,
  ReportStatusBadge,
} from "../../../component/reports/ReportsLayout";
import { EMPLOYEE_STATS, EMPLOYEE_CHART, EMPLOYEE_LIST } from "../../../data/reportsData";

function EmployeeBarChart({ data }) {
  const yMax = 150;
  return (
    <div className="report-chart-card">
      <div className="report-chart-card__header">
        <h3 className="report-chart-card__title">
          <span className="report-chart-card__title-dot" />
          Employee
        </h3>
        <select className="report-chart-card__select" defaultValue="year">
          <option value="year">This Year</option>
        </select>
      </div>
      <div className="report-bar-legend">
        <span><i style={{ background: "#22c55e" }} /> Active Employees</span>
        <span><i style={{ background: "#e2e8f0" }} /> Inactive Employees</span>
      </div>
      <div className="report-bar-chart">
        {data.map((row) => (
          <div key={row.label} className="report-bar-group">
            <div className="report-bar-pair">
              <div
                className="report-bar"
                style={{
                  height: `${(row.active / yMax) * 150}px`,
                  background: "#22c55e",
                }}
              />
              <div
                className="report-bar"
                style={{
                  height: `${(row.inactive / yMax) * 150}px`,
                  background: "#e2e8f0",
                }}
              />
            </div>
            <span className="report-bar-label">{row.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EmployeeReport() {
  return (
    <div className="report-page">
      <ReportPageHeader title="Employee Report" />

      <div className="report-top-grid">
        <div className="report-stats-grid">
          {EMPLOYEE_STATS.map((stat) => (
            <ReportIconStatCard key={stat.label} {...stat} icon="👤" />
          ))}
        </div>
        <EmployeeBarChart data={EMPLOYEE_CHART} />
      </div>

      <div className="report-table-section">
        <ReportTableToolbar title="Employees List" />
        <div style={{ overflowX: "auto" }}>
          <table className="report-data-table">
            <thead>
              <tr>
                <th><input type="checkbox" className="report-checkbox" aria-label="Select all" /></th>
                <th>Emp ID ↕</th>
                <th>Name ↕</th>
                <th>Email ↕</th>
                <th>Department ↕</th>
                <th>Phone ↕</th>
                <th>Joining Date ↕</th>
                <th>Status ↕</th>
              </tr>
            </thead>
            <tbody>
              {EMPLOYEE_LIST.map((row) => (
                <tr key={row.id}>
                  <td><input type="checkbox" className="report-checkbox" aria-label={`Select ${row.name}`} /></td>
                  <td>{row.id}</td>
                  <td>
                    <div className="report-person-cell">
                      <ReportAvatar name={row.name} />
                      <div className="report-person-cell__info">
                        <span className="report-person-cell__name">{row.name}</span>
                        <span className="report-person-cell__sub">{row.role}</span>
                      </div>
                    </div>
                  </td>
                  <td>{row.email}</td>
                  <td>{row.department}</td>
                  <td>{row.phone}</td>
                  <td>{row.joining}</td>
                  <td><ReportStatusBadge status={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
