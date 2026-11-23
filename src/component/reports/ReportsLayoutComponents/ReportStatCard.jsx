import React from "react";
import { cssClass } from "../../../utils/classStyles";
function ReportStatCard({
  label,
  value,
  trend,
  positive,
  barColor,
  barWidth
}) {
  return <div className="report-stat-card">
      <p className="report-stat-card__label">{label}</p>
      <p className="report-stat-card__value">{value}</p>
      {barWidth != null && <div className="report-stat-card__bar">
          <span className={cssClass({
        width: `${barWidth}%`,
        background: barColor
      })} />
        </div>}
      {trend && <p className={`report-stat-card__trend ${positive ? "is-up" : "is-down"}`}>
          ~ {trend}
        </p>}
    </div>;
}
export { ReportStatCard };
