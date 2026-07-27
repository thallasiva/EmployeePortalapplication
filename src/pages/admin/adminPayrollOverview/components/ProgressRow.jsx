import React from "react";
import { cssClass } from "../../../../utils/classStyles";
import { fmtINR, pct } from "../utils";

const ProgressRow = React.memo(function ProgressRow({ label, value, total, color, sub }) {
  const p = pct(value, total);
  return (
    <div className={cssClass({ marginBottom: 12 })}>
      <div className={cssClass({ display: "flex", justifyContent: "space-between", marginBottom: 5 })}>
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 7 })}>
          <div className={cssClass({ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 })} />
          <span className={cssClass({ fontSize: 12, color: "#4b5563", fontWeight: 500 })}>{label}</span>
          {sub && <span className={cssClass({ fontSize: 11, color: "#9ca3af" })}>{sub}</span>}
        </div>
        <span className={cssClass({ fontSize: 12, fontWeight: 700, color: "#1a1a1a" })}>{fmtINR(value)}</span>
      </div>
      <div className={cssClass({ height: 7, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" })}>
        <div
          className={cssClass({
            height: "100%", borderRadius: 4,
            background: color,
            width: `${p}%`,
            transition: "width .6s cubic-bezier(.4,0,.2,1)",
          })}
        />
      </div>
    </div>
  );
});

export default ProgressRow;
