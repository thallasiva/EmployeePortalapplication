import React from "react";
import { cssClass } from "../../../utils/classStyles";
function MonthBar({
  month,
  year,
  onChange
}) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const years = [];
  const now = new Date();
  for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) years.push(y);
  return <div className={cssClass({
    display: "flex",
    gap: 10,
    alignItems: "center",
    marginBottom: 20
  })}>
      <select value={month} onChange={e => onChange(Number(e.target.value), year)} className={cssClass({
      padding: "6px 12px",
      borderRadius: 6,
      border: "1px solid #ddd",
      fontSize: 14
    })}>
        {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
      </select>
      <select value={year} onChange={e => onChange(month, Number(e.target.value))} className={cssClass({
      padding: "6px 12px",
      borderRadius: 6,
      border: "1px solid #ddd",
      fontSize: 14
    })}>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>;
}
export { MonthBar };
