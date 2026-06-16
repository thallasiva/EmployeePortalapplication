import React from "react";

const LEAVE_SERIES = [
  { key: "annual", color: "#22c55e", name: "Annual" },
  { key: "casual", color: "#eab308", name: "Casual" },
  { key: "medical", color: "#1e293b", name: "Medical" },
  { key: "others", color: "#f97316", name: "Others" },
];

export default function ReportStackedBarChart({ data }) {
  const yMax = 100;

  return (
    <div className="report-chart-card">
      <div className="report-chart-card__header">
        <h3 className="report-chart-card__title">
          <span className="report-chart-card__title-dot" />
          Leaves
        </h3>
        <select className="report-chart-card__select" defaultValue="year">
          <option value="year">This Year</option>
          <option value="month">This Month</option>
        </select>
      </div>
      <div className="report-bar-legend">
        {LEAVE_SERIES.map((s) => (
          <span key={s.key}>
            <i style={{ background: s.color }} /> {s.name}
          </span>
        ))}
      </div>
      <div className="report-stacked-chart">
        {data.map((row) => {
          const total = LEAVE_SERIES.reduce((sum, s) => sum + (row[s.key] || 0), 0);
          return (
            <div key={row.label} className="report-stacked-col">
              <div
                className="report-stacked-bars"
                style={{ height: `${(total / yMax) * 100}%` }}
              >
                {LEAVE_SERIES.map((s) => (
                  <div
                    key={s.key}
                    className="report-stacked-seg"
                    style={{
                      height: total ? `${((row[s.key] || 0) / total) * 100}%` : 0,
                      background: s.color,
                    }}
                  />
                ))}
              </div>
              <span className="report-stacked-label">{row.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
