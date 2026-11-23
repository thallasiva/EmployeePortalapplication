import React from "react";
import { cssClass } from "../../../../../../utils/classStyles";
const CalcRow = React.memo(function CalcRow({
  label,
  amount
}) {
  return <div className={cssClass({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "9px 14px",
    background: "#d6e4f0",
    borderBottom: "1px solid #d5dbe3"
  })}>
      <span className={cssClass({
      fontSize: 12,
      fontWeight: 700,
      color: "#1e293b"
    })}>{label}</span>
      <span className={cssClass({
      fontSize: 12,
      fontWeight: 700,
      color: "#1e293b"
    })}>
        {"₹"}{Number(amount || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}
      </span>
    </div>;
});
export { CalcRow };
