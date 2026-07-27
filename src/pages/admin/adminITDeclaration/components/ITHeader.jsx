import React from "react";
import { FileText } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { BRAND } from "../constants";

const ITHeader = React.memo(function ITHeader({ cycle, isActive, tab, setTab, submittedCount }) {
  return (
    <div className={cssClass({
      background: `linear-gradient(135deg,${BRAND},#e07000)`,
      borderRadius: 16, padding: "20px 24px", color: "#fff", marginBottom: 20,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: 12,
    })}>
      <div className={cssClass({ display: "flex", alignItems: "center", gap: 12 })}>
        <FileText size={28} />
        <div>
          <h1 className={cssClass({ fontSize: 20, fontWeight: 700, margin: 0 })}>IT Declaration</h1>
          <p className={cssClass({ fontSize: 13, opacity: 0.85, margin: "2px 0 0" })}>
            {cycle?.fy_label || "FY 2025-2026"} · {isActive ? "Active" : "Inactive"}
          </p>
        </div>
      </div>
      <div className={cssClass({ display: "flex", gap: 10 })}>
        {["submissions", "settings"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cssClass({
              padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer",
              fontWeight: 600, fontSize: 13,
              background: tab === t ? "#fff" : "rgba(255,255,255,0.15)",
              color: tab === t ? BRAND : "#fff",
            })}>
            {t === "submissions" ? `Submissions (${submittedCount})` : "Settings"}
          </button>
        ))}
      </div>
    </div>
  );
});

export default ITHeader;
