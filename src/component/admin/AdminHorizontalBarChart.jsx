import React from "react";
import "./adminCharts.css";import { cssClass, joinClasses } from "../../utils/classStyles";

export default function AdminHorizontalBarChart({ title, subtitle, items = [] }) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="admin-chart">
      {(title || subtitle) &&
      <div className="admin-chart__header">
          <div>
            {title && <p className="admin-chart__title">{title}</p>}
            {subtitle && <p className="admin-chart__subtitle">{subtitle}</p>}
          </div>
        </div>
      }

      <div className="admin-hbar-chart">
        {items.map((item) =>
        <div key={item.label} className="admin-hbar-row">
            <span className="admin-hbar-label">{item.label}</span>
            <div className="admin-hbar-track">
              <div
              className={joinClasses("admin-hbar-fill", cssClass(
                {
                  width: `${item.value / max * 100}%`,
                  background: item.color
                }))} />

            </div>
            <span className="admin-hbar-value">{item.value}</span>
          </div>
        )}
      </div>
    </div>);

}
