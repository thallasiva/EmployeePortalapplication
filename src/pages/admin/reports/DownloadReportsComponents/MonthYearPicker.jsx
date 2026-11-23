import React from "react";
import { cssClass } from "../../../../utils/classStyles";
import { MONTHS, yearOptions } from "./shared";
function MonthYearPicker({
  month,
  year,
  onMonth,
  onYear
}) {
  const selectStyle = {
    padding: "6px 10px",
    fontSize: 13,
    border: "1px solid #e2e8f0",
    borderRadius: 7,
    outline: "none",
    color: "#334155",
    background: "#f8fafc"
  };
  return <div className={cssClass({
    display: "flex",
    gap: 8,
    alignItems: "center",
    marginTop: 10
  })}>
      <select value={month} onChange={e => onMonth(e.target.value)} className={cssClass(selectStyle)}>
        {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>
      <select value={year} onChange={e => onYear(e.target.value)} className={cssClass(selectStyle)}>
        {yearOptions().map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>;
}
export { MonthYearPicker };
