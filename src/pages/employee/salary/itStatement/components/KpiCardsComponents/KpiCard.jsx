import React from "react";
import { cssClass } from "../../../../../../utils/classStyles";
import { tbl } from "./shared";
const KpiCard = React.memo(function KpiCard({
  label,
  value,
  isLabel,
  green,
  orange
}) {
  return <div className={cssClass({
    background: "#fff",
    border: "1px solid #d5dbe3",
    borderRadius: 6,
    padding: "10px 16px",
    flex: 1,
    minWidth: 0
  })}>
      <div className={cssClass({
      fontSize: 9,
      color: "#64748b",
      textTransform: "uppercase",
      letterSpacing: "0.07em",
      fontWeight: 600,
      marginBottom: 6
    })}>{label}</div>
      {isLabel ? <div className={cssClass({
      fontSize: 13,
      fontWeight: 700,
      color: green ? "#16a34a" : orange ? "#e87500" : "#1e293b"
    })}>{value}</div> : <div className={cssClass({
      fontSize: 16,
      fontWeight: 800,
      color: "#1e293b"
    })}>{tbl(value)}</div>}
    </div>;
});
export { KpiCard };
