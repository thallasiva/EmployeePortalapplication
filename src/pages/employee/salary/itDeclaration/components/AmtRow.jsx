import React from "react";
import { cssClass } from "../../../../../utils/classStyles";

function AmtRow({ section, label, maxLimit, value, onChange }) {
  const filled = !!value && Number(value) > 0;
  return (
    <div className={cssClass({
      display: "flex", alignItems: "center", padding: "10px 10px",
      borderBottom: "1px solid #f1f5f9", gap: 10,
      background: filled ? "#fffbf5" : "transparent",
      borderRadius: filled ? 6 : 0,
      marginBottom: filled ? 2 : 0,
      transition: "background 0.15s"
    })}>
      <div className={cssClass({ flex: 1 })}>
        {section &&
          <span className={cssClass({
            fontSize: 9, fontWeight: 700, color: "#f18200",
            background: "#fff7ed", border: "1px solid #fed7aa",
            borderRadius: 4, padding: "1px 5px", marginRight: 6,
            display: "inline-block", verticalAlign: "middle"
          })}>{section}</span>
        }
        <span className={cssClass({ fontSize: 12.5, color: "#334155" })}>{label}</span>
        {maxLimit &&
          <div className={cssClass({ fontSize: 10, color: "#94a3b8", marginTop: 2 })}>
            Limit: ₹{maxLimit}
          </div>
        }
      </div>
      <div className={cssClass({ flexShrink: 0 })}>
        <div className={cssClass({ display: "flex", alignItems: "center", border: "1px solid #e2e8f0",
          borderRadius: 6, overflow: "hidden", background: "#fff",
          boxShadow: filled ? "0 0 0 2px rgba(241,130,0,0.15)" : "none" })}>
          <span className={cssClass({ padding: "6px 8px", background: "#f8fafc", borderRight: "1px solid #e2e8f0",
            fontSize: 12, color: "#64748b", userSelect: "none" })}>₹</span>
          <input
            type="number"
            value={value || ""}
            onChange={(e) => onChange(Number(e.target.value) || 0)}
            placeholder="0"
            className={cssClass(
              { width: 100, padding: "6px 8px", border: "none", fontSize: 12,
                textAlign: "right", outline: "none", color: "#1e293b", background: "transparent" })}
          />
        </div>
      </div>
    </div>
  );
}

export default React.memo(AmtRow);
