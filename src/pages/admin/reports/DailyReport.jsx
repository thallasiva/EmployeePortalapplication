import React from "react";
import {
  ReportPageHeader,
  ReportIconStatCard,
  ReportTableToolbar,
  ReportAvatar,
  ReportStatusBadge } from
"../../../component/reports/ReportsLayout";
import ReportLineChart from "../../../component/reports/ReportLineChart";
import { DAILY_STATS, DAILY_LINE, DAILY_LIST } from "../../../data/reportsData";import { cssClass, joinClasses } from "../../../utils/classStyles";

export default function DailyReport() {
  return (
    <div className="report-page">
      <ReportPageHeader title="Daily Report" />

      <div className="report-top-grid">
        <div className="report-stats-grid">
          {DAILY_STATS.map((stat) =>
          <ReportIconStatCard key={stat.label} {...stat} icon="●" />
          )}
        </div>
        <div className="report-chart-card">
          <div className="report-chart-card__header">
            <h3 className="report-chart-card__title">
              <span className="report-chart-card__title-dot" />
              Daily Attendance
            </h3>
            <select className="report-chart-card__select" defaultValue="year">
              <option value="year">This Year</option>
            </select>
          </div>
          <ReportLineChart
            present={DAILY_LINE.present}
            absent={DAILY_LINE.absent}
            labels={DAILY_LINE.labels}
            absentColor="#ef4444" />

        </div>
      </div>

      <div className="report-table-section">
        <ReportTableToolbar title="Daily Attendance List" />
        <div className={cssClass({ overflowX: "auto" })}>
          <table className="report-data-table">
            <thead>
              <tr>
                <th>Name ↕</th>
                <th>Date ↕</th>
                <th>Department ↕</th>
                <th>Status ↕</th>
              </tr>
            </thead>
            <tbody>
              {DAILY_LIST.map((row) =>
              <tr key={`${row.name}-${row.date}`}>
                  <td>
                    <div className="report-person-cell">
                      <ReportAvatar name={row.name} />
                      <div className="report-person-cell__info">
                        <span className="report-person-cell__name">{row.name}</span>
                        <span className="report-person-cell__sub">{row.role}</span>
                      </div>
                    </div>
                  </td>
                  <td>{row.date}</td>
                  <td>{row.department}</td>
                  <td><ReportStatusBadge status={row.status} /></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>);

}
