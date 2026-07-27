import React from "react";
import { Calendar } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";

const OooQuickSet = React.memo(function OooQuickSet({
  oooFrom, oooTo, setOooFrom, setOooTo, onApply,
}) {
  const canApply = Boolean(oooFrom && oooTo);
  return (
    <div
      className={cssClass({
        background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
        padding: "16px 20px", marginBottom: 20,
        display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14,
      })}
    >
      <div className={cssClass({ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 200 })}>
        <div
          className={cssClass({
            width: 38, height: 38, borderRadius: 8, background: "#eff6ff",
            display: "flex", alignItems: "center", justifyContent: "center",
          })}
        >
          <Calendar size={18} className={cssClass({ color: "#3b82f6" })} />
        </div>
        <div>
          <p className={cssClass({ fontSize: 13, fontWeight: 700, color: "#1e293b", margin: 0 })}>
            Out-of-Office Quick Set
          </p>
          <p className={cssClass({ fontSize: 11, color: "#94a3b8", margin: 0 })}>
            Set a date range and apply it to all delegates at once
          </p>
        </div>
      </div>
      <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" })}>
        <input
          type="date"
          value={oooFrom}
          onChange={(e) => setOooFrom(e.target.value)}
          className={cssClass({ height: 34, padding: "0 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none" })}
        />
        <span className={cssClass({ fontSize: 12, color: "#94a3b8" })}>to</span>
        <input
          type="date"
          value={oooTo}
          min={oooFrom || undefined}
          onChange={(e) => setOooTo(e.target.value)}
          className={cssClass({ height: 34, padding: "0 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none" })}
        />
        <button
          type="button"
          onClick={onApply}
          disabled={!canApply}
          className={cssClass({
            height: 34, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: "none", cursor: !canApply ? "not-allowed" : "pointer",
            background: !canApply ? "#f1f5f9" : "#f18200",
            color: !canApply ? "#94a3b8" : "#fff",
            transition: "background 0.15s",
          })}
        >
          Apply to All
        </button>
      </div>
    </div>
  );
});

export default OooQuickSet;
