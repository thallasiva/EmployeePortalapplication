import React from "react";
import {
  ReportPageHeader,
  ReportStatCard,
  ReportTableToolbar,
  ReportStatusBadge } from
"../../../component/reports/ReportsLayout";
import { GENERIC_REPORTS } from "../../../data/reportsData";import { cssClass, joinClasses } from "../../../utils/classStyles";

export default function GenericReport({ type }) {
  const config = GENERIC_REPORTS[type];
  if (!config) return null;

  return (
    <div className="report-page">
      <ReportPageHeader title={config.title} />

      <div className={joinClasses("report-stats-grid", cssClass({ maxWidth: 720 }))}>
        {config.stats.map((stat) =>
        <ReportStatCard key={stat.label} {...stat} />
        )}
      </div>

      <div className="report-table-section">
        <ReportTableToolbar title={config.tableTitle} />
        <div className={cssClass({ overflowX: "auto" })}>
          <table className="report-data-table">
            <thead>
              <tr>
                <th><input type="checkbox" className="report-checkbox" aria-label="Select all" /></th>
                {config.columns.map((col) =>
                <th key={col}>{col} ↕</th>
                )}
              </tr>
            </thead>
            <tbody>
              {config.rows.map((row) =>
              <tr key={row[0]}>
                  <td><input type="checkbox" className="report-checkbox" aria-label={`Select ${row[0]}`} /></td>
                  {row.map((cell, idx) =>
                <td key={idx}>
                      {idx === row.length - 1 ?
                  <ReportStatusBadge status={cell} /> :
                  idx === 1 && typeof cell === "string" && cell.includes(" ") ?
                  <strong>{cell}</strong> :

                  cell
                  }
                    </td>
                )}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>);

}
