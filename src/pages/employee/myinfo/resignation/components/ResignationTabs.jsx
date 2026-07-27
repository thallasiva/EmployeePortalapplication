import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { BRAND } from "../constants";

const TABS_DEF = [
  { key: "apply",   label: "Apply" },
  { key: "pending", label: "Pending" },
  { key: "history", label: "History" },
];

const ResignationTabs = React.memo(function ResignationTabs({ active, onChange, pendingCount }) {
  return (
    <div className={cssClass({
      display: "flex", gap: 4, padding: 4, background: "#f1f5f9",
      borderRadius: 12, width: "fit-content", margin: "0 auto 28px",
    })}>
      {TABS_DEF.map((t) => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cssClass({
              padding: "7px 22px", borderRadius: 9, fontSize: 13, fontWeight: 600,
              border: "none", cursor: "pointer", position: "relative",
              background: isActive ? "#fff" : "transparent",
              color: isActive ? "#1e293b" : "#64748b",
              boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.15s",
            })}
          >
            {t.label}
            {t.key === "pending" && pendingCount > 0 && (
              <span className={cssClass({
                marginLeft: 6, padding: "1px 7px", borderRadius: 999,
                background: BRAND, color: "#fff", fontSize: 10, fontWeight: 700,
              })}>
                {pendingCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
});

export default ResignationTabs;
