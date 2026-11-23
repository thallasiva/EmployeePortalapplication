import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
function Metric({
  label,
  value,
  detail,
  icon: Icon,
  tint = "#fff7ed",
  accent = "#e87500"
}) {
  return <div className={cssClass({
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
    border: "1px solid #eef0f3",
    borderRadius: 12,
    background: "#fff",
    padding: 13
  })}>
      <span className={cssClass({
      width: 34,
      height: 34,
      flex: "0 0 34px",
      display: "grid",
      placeItems: "center",
      borderRadius: 10,
      color: accent,
      background: tint
    })}><Icon size={17} /></span>
      <span className={cssClass({
      minWidth: 0
    })}>
        <span className={cssClass({
        display: "block",
        color: "#667085",
        fontSize: 11,
        fontWeight: 650
      })}>{label}</span>
        <span className={cssClass({
        display: "block",
        color: "#182230",
        fontSize: 18,
        fontWeight: 850,
        marginTop: 2,
        overflow: "hidden",
        textOverflow: "ellipsis"
      })}>{value}</span>
        {detail && <span className={cssClass({
        display: "block",
        color: "#98a2b3",
        fontSize: 10,
        marginTop: 1
      })}>{detail}</span>}
      </span>
    </div>;
}
export { Metric };
