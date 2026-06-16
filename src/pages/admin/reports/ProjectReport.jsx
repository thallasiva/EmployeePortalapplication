import React from "react";
import {
  ReportPageHeader,
  ReportStatCard,
  ReportTableToolbar,
  ReportAvatar,
  ReportPriorityBadge,
  ReportStatusBadge,
} from "../../../component/reports/ReportsLayout";
import ReportDonutPanel from "../../../component/reports/ReportDonutPanel";
import {
  PROJECT_STATS,
  PROJECT_CHART,
  PROJECT_LIST,
} from "../../../data/reportsData";

export default function ProjectReport() {
  return (
    <div className="report-page">
      <ReportPageHeader title="Project Report" />

      <div className="report-top-grid">
        <div className="report-stats-grid">
          {PROJECT_STATS.map((stat) => (
            <ReportStatCard key={stat.label} {...stat} />
          ))}
        </div>
        <ReportDonutPanel title="Projects By Tasks" segments={PROJECT_CHART} centerLabel="Pending" />
      </div>

      <div className="report-table-section">
        <ReportTableToolbar title="Project List" />
        <div style={{ overflowX: "auto" }}>
          <table className="report-data-table">
            <thead>
              <tr>
                <th><input type="checkbox" className="report-checkbox" aria-label="Select all" /></th>
                <th>Project ID ↕</th>
                <th>Project Name ↕</th>
                <th>Leader ↕</th>
                <th>Team ↕</th>
                <th>Deadline ↕</th>
                <th>Priority ↕</th>
                <th>Status ↕</th>
              </tr>
            </thead>
            <tbody>
              {PROJECT_LIST.map((row) => (
                <tr key={row.id}>
                  <td><input type="checkbox" className="report-checkbox" aria-label={`Select ${row.name}`} /></td>
                  <td>{row.id}</td>
                  <td><strong>{row.name}</strong></td>
                  <td>
                    <div className="report-person-cell">
                      <ReportAvatar name={row.leader} />
                      {row.leader}
                    </div>
                  </td>
                  <td>
                    <div className="report-avatar-stack">
                      {Array.from({ length: Math.min(row.teamCount, 3) }).map((_, i) => (
                        <ReportAvatar key={i} name={`${row.leader} ${i}`} size="sm" />
                      ))}
                      <span className="report-avatar-more">+{row.extraTeam}</span>
                    </div>
                  </td>
                  <td>{row.deadline}</td>
                  <td><ReportPriorityBadge priority={row.priority} /></td>
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
