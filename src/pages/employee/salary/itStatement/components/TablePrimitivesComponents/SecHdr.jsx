import React from "react";
import { Minus, Plus } from "lucide-react";
import { cssClass } from "../../../../../../utils/classStyles";
const SecHdr = React.memo(function SecHdr({
  label,
  amount,
  expanded,
  onToggle
}) {
  return <div onClick={onToggle} className={cssClass({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "9px 14px",
    background: "#e8f4fa",
    borderBottom: "1px solid #d5dbe3",
    cursor: onToggle ? "pointer" : "default",
    userSelect: "none"
  })}>
      <div className={cssClass({
      display: "flex",
      alignItems: "center",
      gap: 6
    })}>
        <span className={cssClass({
        display: "flex",
        color: "#475569"
      })}>{onToggle ? expanded ? <Minus size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" /> : null}</span>
        <span className={cssClass({
        fontSize: 12,
        fontWeight: 700,
        color: "#1e293b"
      })}>{label}</span>
      </div>
      {amount != null && <span className={cssClass({
      fontSize: 12,
      fontWeight: 700,
      color: "#1e293b"
    })}>
          {"₹"}{Number(amount || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}
        </span>}
    </div>;
});
export { SecHdr };
