import React from "react";
import { CheckCircle2, AlertCircle, Square, Play } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { BRAND } from "../constants";
import { fmtDate } from "../utils/dateUtils";
import { CycleTypeBadge } from "./Badges";

const ActiveRolloutBanner = React.memo(function ActiveRolloutBanner({ activeCycle, onStopRollout, onStartRollout }) {
  if (activeCycle) {
    return (
      <div className={cssClass({ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12, padding: "14px 18px", marginBottom: 22, display: "flex", alignItems: "center", gap: 12 })}>
        <CheckCircle2 size={18} className={cssClass({ color: "#16a34a", flexShrink: 0 })} />
        <div className={cssClass({ flex: 1 })}>
          <div className={cssClass({ fontWeight: 700, color: "#166534", fontSize: 14, marginBottom: 2 })}>
            🟢 Rollout Active — {activeCycle.fy_label}
          </div>
          <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" })}>
            {activeCycle.cycle_type && <CycleTypeBadge type={activeCycle.cycle_type} />}
            {activeCycle.deadline && <span className={cssClass({ color: "#166534", fontSize: 12 })}>Deadline: {fmtDate(activeCycle.deadline)}</span>}
            <span className={cssClass({ color: "#166534", fontSize: 12 })}>· {activeCycle.rollout_type === "selected" ? "Selected Employees" : "All Employees"}</span>
            {activeCycle.rolled_out_at && <span className={cssClass({ color: "#166534", fontSize: 12 })}>· Rolled out {fmtDate(activeCycle.rolled_out_at)}</span>}
          </div>
        </div>
        <button onClick={onStopRollout}
          className={cssClass({ padding: "8px 16px", border: "none", borderRadius: 8, background: "#dc2626", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 })}>
          <Square size={13} /> Stop Rollout
        </button>
      </div>
    );
  }

  return (
    <div className={cssClass({ background: "#fafafa", border: "1.5px dashed #e2e8f0", borderRadius: 12, padding: "12px 18px", marginBottom: 22, display: "flex", alignItems: "center", gap: 12 })}>
      <AlertCircle size={18} className={cssClass({ color: "#94a3b8", flexShrink: 0 })} />
      <div className={cssClass({ flex: 1 })}>
        <span className={cssClass({ fontWeight: 600, color: "#64748b", fontSize: 13 })}>No Active Rollout</span>
        <span className={cssClass({ color: "#94a3b8", fontSize: 12, marginLeft: 8 })}>· Appraisal tab is hidden from all employees and managers</span>
      </div>
      <button onClick={onStartRollout}
        className={cssClass({ padding: "6px 14px", border: `1px solid ${BRAND}`, borderRadius: 8, background: "#fff7ed", color: BRAND, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 })}>
        <Play size={12} /> Start Rollout
      </button>
    </div>
  );
});

export default ActiveRolloutBanner;
