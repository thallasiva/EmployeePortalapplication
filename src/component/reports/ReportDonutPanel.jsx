import React, { useMemo } from "react";
import AdminDonutChart from "../admin/AdminDonutChart";import { cssClass, joinClasses } from "../../utils/classStyles";

export default function ReportDonutPanel({
  title,
  segments,
  centerLabel,
  centerValue,
  showSelect = true
}) {
  const total = useMemo(
    () => segments.reduce((s, seg) => s + seg.value, 0),
    [segments]
  );

  return (
    <div className="report-chart-card">
      <div className="report-chart-card__header">
        <h3 className="report-chart-card__title">
          <span className="report-chart-card__title-dot" />
          {title}
        </h3>
        {showSelect &&
        <select className="report-chart-card__select" defaultValue="office">
            <option value="office">Office Management App</option>
            <option value="hospital">Hospital Administration</option>
          </select>
        }
      </div>
      <div className="report-chart-card__body">
        <AdminDonutChart
          segments={segments.map((s) => ({ label: s.name, value: s.value, color: s.color }))}
          centerLabel={centerLabel}
          centerValue={centerValue ?? `${segments[1]?.value ?? 30}%`}
          size={150}
          strokeWidth={24} />
        
        <div className="report-legend">
          {segments.map((seg) =>
          <div key={seg.name} className="report-legend__item">
              <span className={joinClasses("report-legend__swatch", cssClass({ background: seg.color }))} />
              {seg.name}
              <span className={cssClass({ marginLeft: "6px", color: "#94a3b8" })}>
                {total ? Math.round(seg.value / total * 100) : 0}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>);

}
