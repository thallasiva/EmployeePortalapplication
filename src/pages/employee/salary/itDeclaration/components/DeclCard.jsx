import React from "react";
import { ChevronRight } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { fmt } from "../utils/formatters";

function DeclCard({ icon, title, declared, onClick, locked }) {
  const hasDeclared = !!declared;
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!locked) {
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(241,130,0,0.13)";
          e.currentTarget.style.borderTopColor = "#f18200";
          e.currentTarget.style.borderColor = "#fed7aa";
          e.currentTarget.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderTopColor = hasDeclared ? "#f18200" : "#e2e8f0";
        e.currentTarget.style.borderColor = hasDeclared ? "#fed7aa" : "#e8edf5";
        e.currentTarget.style.transform = "none";
      }}
      className={cssClass({
        display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px 20px",
        background: "#fff", border: `1px solid ${hasDeclared ? "#fed7aa" : "#e8edf5"}`,
        borderTop: `3px solid ${hasDeclared ? "#f18200" : "#e2e8f0"}`,
        borderRadius: 12, cursor: locked ? "default" : "pointer",
        textAlign: "center", gap: 0, transition: "all 0.18s",
        opacity: locked ? 0.72 : 1, width: "100%", boxSizing: "border-box"
      })}
    >
      {}
      <div className={cssClass({
        width: 52, height: 52, borderRadius: "50%",
        background: hasDeclared ? "#fff7ed" : "#f8fafc",
        border: `1.5px solid ${hasDeclared ? "#fed7aa" : "#e2e8f0"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 24, marginBottom: 14, flexShrink: 0
      })}>
        {icon}
      </div>
      {}
      <div className={cssClass({ fontSize: 13, fontWeight: 700, color: "#1e293b", lineHeight: 1.4, marginBottom: 12 })}>
        {title}
      </div>
      {}
      {hasDeclared ? (
        <div className={cssClass({
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "4px 12px", borderRadius: 999,
          background: "#f0fdf4", border: "1px solid #bbf7d0"
        })}>
          <span className={cssClass({ fontSize: 11, color: "#15803d", fontWeight: 700 })}>
            ✓ {fmt(declared)}
          </span>
        </div>
      ) : locked ? (
        <span className={cssClass({ fontSize: 12, color: "#cbd5e1" })}>—</span>
      ) : (
        <div className={cssClass({
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "4px 12px", borderRadius: 999,
          background: "#fff7ed", border: "1px solid #fed7aa"
        })}>
          <span className={cssClass({ fontSize: 11, color: "#f18200", fontWeight: 700 })}>Add to declaration</span>
          <ChevronRight size={11} color="#f18200" />
        </div>
      )}
    </button>
  );
}

export default React.memo(DeclCard);
