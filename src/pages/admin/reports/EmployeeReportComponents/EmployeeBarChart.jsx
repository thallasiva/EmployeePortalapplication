import React, { useMemo } from "react";
import { cssClass, joinClasses } from "../../../../utils/classStyles";
import { MONTHS } from "./shared";
function EmployeeBarChart({
  employees
}) {
  const data = useMemo(() => {
    const counts = MONTHS.map((m, i) => {
      const active = employees.filter(e => {
        if (!e.emp_joining_date) return false;
        const d = new Date(e.emp_joining_date);
        return d.getMonth() === i;
      }).length;
      return {
        label: m,
        active,
        inactive: 0
      };
    });
    return counts;
  }, [employees]);
  const yMax = Math.max(...data.map(d => d.active), 1);
  return <div className="report-chart-card">
      <div className="report-chart-card__header">
        <h3 className="report-chart-card__title"><span className="report-chart-card__title-dot" />Joinings by Month</h3>
      </div>
      <div className="report-bar-legend">
        <span><i className={cssClass({
          background: "#22c55e"
        })} /> Joined</span>
      </div>
      <div className="report-bar-chart">
        {data.map(row => <div key={row.label} className="report-bar-group">
            <div className="report-bar-pair">
              <div className={joinClasses("report-bar", cssClass({
            height: `${row.active / yMax * 150}px`,
            background: "#22c55e"
          }))} />
            </div>
            <span className="report-bar-label">{row.label}</span>
          </div>)}
      </div>
    </div>;
}
export { EmployeeBarChart };
