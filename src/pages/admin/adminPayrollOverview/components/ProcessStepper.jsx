import React from "react";
import { CheckCircle2 } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";

const DONE = "#16a34a", CURRENT = "#f18200", PENDING = "#cbd5e1";

// Horizontal 8-step payroll process bar. steps = [{ label, status }].
export default function ProcessStepper({ steps = [] }) {
  return (
    <div className={cssClass({ display: "flex", alignItems: "flex-start", overflowX: "auto", padding: "6px 2px", gap: 0 })}>
      {steps.map((s, i) => {
        const color = s.status === "done" ? DONE : s.status === "current" ? CURRENT : PENDING;
        const last = i === steps.length - 1;
        return (
          <div key={s.label} className={cssClass({ display: "flex", alignItems: "center", flex: last ? "0 0 auto" : "1 1 0" })}>
            <div className={cssClass({ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 74 })}>
              <div className={cssClass({
                width: 34, height: 34, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
                background: s.status === "pending" ? "#f1f5f9" : color, color: s.status === "pending" ? "#94a3b8" : "#fff",
                fontWeight: 800, fontSize: 13, border: s.status === "current" ? `3px solid ${CURRENT}33` : "none",
              })}>
                {s.status === "done" ? <CheckCircle2 size={18} /> : i + 1}
              </div>
              <div className={cssClass({ fontSize: 11.5, fontWeight: 700, color: "#344054", textAlign: "center", lineHeight: 1.2 })}>{s.label}</div>
              <div className={cssClass({ display: "flex", alignItems: "center", gap: 3, fontSize: 10.5, fontWeight: 700, color, textTransform: "capitalize" })}>
                {s.status === "done" ? "Locked" : s.status === "current" ? "Pending" : "Pending"}
              </div>
            </div>
            {!last && <div className={cssClass({ flex: 1, height: 2, background: s.status === "done" ? DONE : "#e5e7eb", margin: "0 2px", marginTop: -22 })} />}
          </div>
        );
      })}
    </div>
  );
}
