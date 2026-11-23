import React from "react";
import { cssClass, joinClasses } from "../../../utils/classStyles";
function ReportIconStatCard({
  label,
  value,
  icon,
  color,
  trend,
  fraction
}) {
  return <div className="report-icon-stat">
      <div className="report-icon-stat__top">
        <div>
          <p className="report-icon-stat__label">{label}</p>
          <p className="report-icon-stat__value">{value}</p>
        </div>
        {fraction ? <span className="report-icon-stat__fraction">{fraction}</span> : <span className={joinClasses("report-icon-stat__icon", cssClass({
        background: color
      }))}>
            {icon}
          </span>}
      </div>
      {trend && <p className="report-icon-stat__trend">~ {trend}</p>}
    </div>;
}
export { ReportIconStatCard };
