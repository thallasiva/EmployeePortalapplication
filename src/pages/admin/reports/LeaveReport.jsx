import React from "react";
import {
  ReportPageHeader,
  ReportIconStatCard,
  ReportTableToolbar,
  ReportAvatar,
  ReportStatusBadge,
} from "../../../component/reports/ReportsLayout";
import ReportStackedBarChart from "../../../component/reports/ReportStackedBarChart";
import { LEAVE_STATS, LEAVE_CHART, LEAVE_LIST } from "../../../data/reportsData";

export default function LeaveReport() {
  return (
    <div className="report-page">
      <ReportPageHeader title="Leave Report" />

      <div className="report-top-grid">
        <div className="report-stats-grid">
          {LEAVE_STATS.map((stat) => (
            <ReportIconStatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon="📋"
              color={stat.color}
              trend={`${stat.trend} Last Month`}
            />
          ))}
        </div>
        <ReportStackedBarChart data={LEAVE_CHART} />
      </div>

      <div className="report-table-section">
        <ReportTableToolbar title="Leave Requests" />
        <div style={{ overflowX: "auto" }}>
          <table className="report-data-table">
            <thead>
              <tr>
                <th><input type="checkbox" className="report-checkbox" aria-label="Select all" /></th>
                <th>Leave ID ↕</th>
                <th>Employee ↕</th>
                <th>Company ↕</th>
                <th>Created Date ↕</th>
                <th>Due Date ↕</th>
                <th>Days ↕</th>
                <th>Status ↕</th>
              </tr>
            </thead>
            <tbody>
              {LEAVE_LIST.map((row) => (
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
                  <td>{row.company}</td>
                  <td>{row.created}</td>
                  <td>{row.due}</td>
                  <td>{row.amount}</td>
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
