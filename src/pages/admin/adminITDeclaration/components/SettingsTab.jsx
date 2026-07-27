import React from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { BRAND, fmtDate } from "../constants";

const HOW_IT_WORKS = [
  { step: "1", label: "Enable cycle",      desc: "Click Enable to open the declaration window for all employees" },
  { step: "2", label: "Employee submits",  desc: "Employees fill IT Declaration (80C, HRA, etc.) and submit" },
  { step: "3", label: "Employee uploads",  desc: "Employees upload proof documents (PDF/JPG) via Proof of Investment" },
  { step: "4", label: "Admin reviews",     desc: "Review each submission here — Approve or Reject with remarks" },
];

const SettingsTab = React.memo(function SettingsTab({ cycle, isActive, toggling, onToggle }) {
  return (
    <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 })}>
      {/* Status control card */}
      <div className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" })}>
        {isActive
          ? <CheckCircle2 size={52} className={cssClass({ color: "#22c55e" })} />
          : <Lock size={52} className={cssClass({ color: "#cbd5e1" })} />}
        <div>
          <p className={cssClass({ fontSize: 12, color: "#94a3b8", margin: "0 0 6px" })}>Current Status</p>
          <span className={cssClass({ fontSize: 14, fontWeight: 700, padding: "4px 16px", borderRadius: 999,
            background: isActive ? "#dcfce7" : "#f1f5f9",
            color: isActive ? "#15803d" : "#64748b" })}>
            {isActive ? "Declaration Open" : "Declaration Closed"}
          </span>
        </div>
        <div className={cssClass({ display: "flex", gap: 8, width: "100%" })}>
          <button onClick={onToggle} disabled={toggling || isActive}
            className={cssClass({ flex: 1, padding: "9px 0", borderRadius: 8, fontWeight: 600, fontSize: 13,
              cursor: isActive ? "default" : "pointer",
              border: "1px solid #22c55e", background: isActive ? "#dcfce7" : "#fff",
              color: "#15803d", opacity: isActive ? 0.6 : 1 })}>
            Enable
          </button>
          <button onClick={onToggle} disabled={toggling || !isActive}
            className={cssClass({ flex: 1, padding: "9px 0", borderRadius: 8, fontWeight: 600, fontSize: 13,
              cursor: !isActive ? "default" : "pointer",
              border: "1px solid #ef4444", background: !isActive ? "#f1f5f9" : "#fff",
              color: "#dc2626", opacity: !isActive ? 0.4 : 1 })}>
            Disable
          </button>
        </div>
      </div>

      {/* How it works card */}
      <div className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24 })}>
        <h2 className={cssClass({ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: "0 0 16px" })}>
          How it works
        </h2>
        <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 })}>
          {HOW_IT_WORKS.map((w) => (
            <div key={w.step}
              className={cssClass({ padding: 14, borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc" })}>
              <div className={cssClass({ width: 26, height: 26, borderRadius: "50%", background: BRAND, color: "#fff",
                fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 8 })}>
                {w.step}
              </div>
              <p className={cssClass({ fontSize: 13, fontWeight: 700, color: "#1e293b", margin: "0 0 4px" })}>
                {w.label}
              </p>
              <p className={cssClass({ fontSize: 12, color: "#64748b", margin: 0 })}>{w.desc}</p>
            </div>
          ))}
        </div>
        <div className={cssClass({ marginTop: 16, padding: "10px 14px", background: "#fff8f0",
          borderRadius: 8, fontSize: 12, color: "#92400e" })}>
          <strong>Current cycle:</strong> {cycle?.fy_label || "—"} &nbsp;·&nbsp;
          Deadline: {fmtDate(cycle?.end_date)}
        </div>
      </div>
    </div>
  );
});

export default SettingsTab;
