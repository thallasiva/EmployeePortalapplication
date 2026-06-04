import React from "react";
import {
  ReportPageHeader,
  ReportIconStatCard,
  ReportTableToolbar,
  ReportPriorityBadge,
  ReportStatusBadge,
} from "../../../component/reports/ReportsLayout";
import ReportDonutPanel from "../../../component/reports/ReportDonutPanel";
import { TASK_STATS, TASK_CHART, TASK_LIST } from "../../../data/reportsData";

export default function TaskReport() {
  return (
    <div className="report-page">
      <ReportPageHeader title="Task Report" />

      <div className="report-top-grid">
        <div className="report-stats-grid">
          {TASK_STATS.map((stat, idx) => (
            <ReportIconStatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              fraction={stat.fraction}
              icon={idx === 0 ? "◉" : undefined}
              color="#f97316"
            />
          ))}
        </div>
        <ReportDonutPanel
          title="Tasks"
          segments={TASK_CHART}
          centerLabel="Pending"
          centerValue="30%"
        />
      </div>

      <div className="report-table-section">
        <ReportTableToolbar title="Tasks List" />
        <div style={{ overflowX: "auto" }}>
          <table className="report-data-table">
            <thead>
              <tr>
                <th><input type="checkbox" className="report-checkbox" aria-label="Select all" /></th>
                <th>Task Name ↕</th>
                <th>Project Name ↕</th>
                <th>Created Date ↕</th>
                <th>Due Date ↕</th>
                <th>Priority ↕</th>
                <th>Status ↕</th>
              </tr>
            </thead>
            <tbody>
              {TASK_LIST.map((row) => (
                <tr key={row.name}>
                  <td><input type="checkbox" className="report-checkbox" aria-label={`Select ${row.name}`} /></td>
                  <td><strong>{row.name}</strong></td>
                  <td>{row.project}</td>
                  <td>{row.created}</td>
                  <td>{row.due}</td>
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
