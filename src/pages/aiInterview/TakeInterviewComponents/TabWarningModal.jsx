import React from "react";
import { AlertTriangle } from "lucide-react";
import { C } from "./shared";
/* ─── Tab-switch modal ───────────────────────────────────────────────────── */
function TabWarningModal({
  count,
  maxWarnings,
  onDismiss
}) {
  const isLast = count >= maxWarnings;
  return <div style={{
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.84)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }}>
      <div className={`fade-in ${isLast ? "shake" : ""}`} style={{
      background: C.card,
      border: `2px solid ${C.warn}`,
      borderRadius: 18,
      padding: 36,
      maxWidth: 380,
      textAlign: "center"
    }}>
        <AlertTriangle size={52} color={C.warn} style={{
        marginBottom: 12
      }} />
        <h2 style={{
        color: C.text,
        fontSize: 20,
        margin: "0 0 10px"
      }}>
          {isLast ? "Interview Auto-Submitting" : "Tab Switch Detected"}
        </h2>
        <p style={{
        color: C.muted,
        fontSize: 14,
        margin: "0 0 8px"
      }}>
          You left the interview window. This has been recorded.
        </p>
        <p style={{
        color: C.warn,
        fontSize: 13,
        fontWeight: 700,
        margin: "0 0 24px"
      }}>
          Warning {count} of {maxWarnings}{isLast ? " — submitting now…" : ""}
        </p>
        {!isLast && <button className="btn-primary" onClick={onDismiss}>Return to Interview</button>}
      </div>
    </div>;
}
/* ─── Progress bar ───────────────────────────────────────────────────────── */
export { TabWarningModal };
