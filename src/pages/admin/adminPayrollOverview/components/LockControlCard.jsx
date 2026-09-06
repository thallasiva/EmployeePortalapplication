import React from "react";
import { Lock, Unlock, Eye, RotateCcw } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";

// One "locked/open" control tile (Attendance or Leave).
export default function LockControlCard({ title, locked = true, lastUpdated, count, countLabel = "Records", onView, onReopen }) {
  const c = locked ? "#16a34a" : "#d97706";
  return (
    <div className={cssClass({ border: "1px solid #eef0f3", borderRadius: 12, padding: 13, background: "#fff", flex: "1 1 0" })}>
      <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 })}>
        <div className={cssClass({ fontSize: 13, fontWeight: 800, color: "#111827" })}>{title}</div>
        <span className={cssClass({ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 800, color: c, background: `${c}14`, padding: "3px 8px", borderRadius: 999 })}>
          {locked ? <Lock size={11} /> : <Unlock size={11} />}{locked ? "LOCKED" : "OPEN"}
        </span>
      </div>
      <div className={cssClass({ fontSize: 11, color: "#98a2b3" })}>Last Updated</div>
      <div className={cssClass({ fontSize: 12, fontWeight: 600, color: "#475467", marginBottom: 8 })}>{lastUpdated || "—"}</div>
      <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 })}>
        <span className={cssClass({ fontSize: 11, color: "#98a2b3" })}>{countLabel}</span>
        <span className={cssClass({ fontSize: 13, fontWeight: 800, color: "#111827" })}>{count ?? "—"}</span>
      </div>
      <div className={cssClass({ display: "flex", gap: 8 })}>
        <button onClick={onView} className={cssClass({ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "#2563eb", background: "#eff6ff", border: "1px solid #dbeafe", borderRadius: 8, padding: "7px 0", cursor: "pointer" })}>
          <Eye size={13} /> View {title.split(" ")[0]}
        </button>
        <button onClick={onReopen} className={cssClass({ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "#dc2626", background: "#fff", border: "1px solid #fecaca", borderRadius: 8, padding: "7px 0", cursor: "pointer" })}>
          <RotateCcw size={13} /> Reopen
        </button>
      </div>
    </div>
  );
}
