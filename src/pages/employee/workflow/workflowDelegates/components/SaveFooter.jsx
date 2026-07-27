import React from "react";
import { cssClass } from "../../../../../utils/classStyles";

const SaveFooter = React.memo(function SaveFooter({ saving, configuredCount, onSave }) {
  return (
    <div
      className={cssClass({
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginTop: 20, background: "#fff", border: "1px solid #e2e8f0",
        borderRadius: 12, padding: "14px 20px",
      })}
    >
      <p className={cssClass({ fontSize: 13, color: "#64748b", margin: 0 })}>
        {configuredCount > 0
          ? `${configuredCount} workflow(s) configured`
          : "No delegates configured — approvals will go to your default manager."}
      </p>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className={cssClass({
          height: 38, padding: "0 24px", borderRadius: 8, border: "none",
          background: saving ? "#fed7aa" : "#f18200", color: "#fff",
          fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
          transition: "background 0.15s",
        })}
      >
        {saving ? "Saving…" : "Save All Delegates"}
      </button>
    </div>
  );
});

export default SaveFooter;
