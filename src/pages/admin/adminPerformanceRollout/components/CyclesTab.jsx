import React, { useState } from "react";
import { ChevronDown, ChevronRight, Play, Square, Settings, RotateCcw, AlertCircle } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { BRAND } from "../constants";
import { fmtDate } from "../utils/dateUtils";
import { CycleTypeBadge, StatusBadge } from "./Badges";

const CyclesTab = React.memo(function CyclesTab({ cycles, onEdit, onRollout, onDisable, onReEnable, onNew }) {
  const [expandedId, setExpandedId] = useState(() => {
    const active = cycles.find((c) => c.status === "active");
    return active?.cycle_id || null;
  });

  if (cycles.length === 0) {
    return (
      <div className={cssClass({ textAlign: "center", padding: 60, background: "#f8fafc", border: "2px dashed #e2e8f0", borderRadius: 14 })}>
        <AlertCircle size={40} className={cssClass({ color: "#cbd5e1", marginBottom: 12 })} />
        <p className={cssClass({ margin: 0, fontWeight: 700, color: "#64748b", fontSize: 15 })}>No appraisal cycles yet</p>
        <p className={cssClass({ margin: "6px 0 0", color: "#94a3b8", fontSize: 13 })}>Create a cycle to get started.</p>
        <button onClick={onNew}
          className={cssClass({ marginTop: 16, padding: "10px 22px", background: BRAND, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14 })}>
          Create First Cycle
        </button>
      </div>
    );
  }

  return (
    <div>
      {cycles.map((cycle) => {
        const isActive = cycle.status === "active";
        const expanded = expandedId === cycle.cycle_id;
        return (
          <div key={cycle.cycle_id}
            className={cssClass({ border: `1.5px solid ${isActive ? BRAND : "#e2e8f0"}`, borderRadius: 12, overflow: "hidden", boxShadow: isActive ? `0 0 0 3px ${BRAND}22` : "none", marginBottom: 14 })}>
            <div onClick={() => setExpandedId((p) => p === cycle.cycle_id ? null : cycle.cycle_id)}
              className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", cursor: "pointer", background: isActive ? "#fff7ed" : "#f8fafc" })}>
              <div className={cssClass({ display: "flex", alignItems: "center", gap: 12 })}>
                {expanded ? <ChevronDown size={16} className={cssClass({ color: "#94a3b8" })} /> : <ChevronRight size={16} className={cssClass({ color: "#94a3b8" })} />}
                <div>
                  <div className={cssClass({ fontWeight: 700, fontSize: 15, color: "#1e293b" })}>{cycle.fy_label}</div>
                  <div className={cssClass({ fontSize: 11, color: "#64748b", marginTop: 2 })}>
                    {cycle.deadline ? `Deadline: ${fmtDate(cycle.deadline)}` : "No deadline"}
                    {cycle.rolled_out_at && ` · Rolled out ${fmtDate(cycle.rolled_out_at)}`}
                    {cycle.rollout_type && ` · ${cycle.rollout_type === "selected" ? "Selected Employees" : "All Employees"}`}
                  </div>
                </div>
              </div>
              <div className={cssClass({ display: "flex", alignItems: "center", gap: 8 })}>
                {cycle.cycle_type && <CycleTypeBadge type={cycle.cycle_type} />}
                <StatusBadge status={cycle.status} />
              </div>
            </div>

            {expanded && (
              <div className={cssClass({ padding: "16px 18px", borderTop: "1px solid #e2e8f0", background: "#fff" })}>
                <div className={cssClass({ display: "flex", gap: 10, flexWrap: "wrap" })}>
                  <button onClick={() => onEdit(cycle)}
                    className={cssClass({ padding: "7px 16px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#475569", display: "flex", alignItems: "center", gap: 5 })}>
                    <Settings size={13} /> Edit Settings
                  </button>
                  {!isActive && (
                    <button onClick={() => onRollout(cycle)}
                      className={cssClass({ padding: "7px 16px", border: "none", borderRadius: 8, background: "#16a34a", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 })}>
                      <Play size={13} /> Roll Out
                    </button>
                  )}
                  {isActive && (
                    <button onClick={() => onDisable(cycle)}
                      className={cssClass({ padding: "7px 16px", border: "none", borderRadius: 8, background: "#dc2626", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 })}>
                      <Square size={13} /> Stop Rollout
                    </button>
                  )}
                  {!isActive && cycle.disabled_at && (
                    <button onClick={() => onReEnable(cycle)}
                      className={cssClass({ padding: "7px 16px", border: `1px solid ${BRAND}`, borderRadius: 8, background: "#fff7ed", color: BRAND, cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 })}>
                      <RotateCcw size={13} /> Re-Enable
                    </button>
                  )}
                </div>
                <div className={cssClass({ display: "flex", gap: 24, marginTop: 14, flexWrap: "wrap" })}>
                  {[
                    { label: "Rollout Type", value: cycle.rollout_type === "selected" ? "Selected Employees" : cycle.rollout_type === "all" ? "All Employees" : null },
                    { label: "Rolled Out", value: fmtDate(cycle.rolled_out_at) },
                    { label: "Disabled On", value: fmtDate(cycle.disabled_at) }
                  ].filter((m) => m.value && m.value !== "—").map((m) => (
                    <div key={m.label}>
                      <div className={cssClass({ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 })}>{m.label}</div>
                      <div className={cssClass({ fontSize: 13, fontWeight: 600, color: "#1e293b", marginTop: 2 })}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

export default CyclesTab;
