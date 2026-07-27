import React from "react";
import { Save } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { BRAND } from "../constants";

const StickyFooter = React.memo(function StickyFooter({
  saving, formErrors, onCancel, onSave,
}) {
  const errorCount = Object.keys(formErrors).length;
  return (
    <div
      className={cssClass({
        position: "sticky", bottom: 0, zIndex: 10, background: "#fff",
        borderTop: "1px solid #e5e7eb", padding: "12px 16px",
        display: "flex", justifyContent: "flex-end", gap: 10,
        marginTop: 20, borderRadius: "0 0 12px 12px",
      })}
    >
      {errorCount > 0 && (
        <div className={cssClass({ flex: 1, display: "flex", alignItems: "center", fontSize: 12, color: "#dc2626", gap: 6 })}>
          ⚠ {errorCount} field{errorCount > 1 ? "s" : ""} need attention
        </div>
      )}
      <button
        onClick={onCancel}
        className={cssClass({
          background: "#fff", border: "1px solid #d1d5db", borderRadius: 8,
          padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#374151",
        })}
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className={cssClass({
          background: BRAND, border: "none", borderRadius: 8, padding: "9px 24px",
          fontSize: 13, fontWeight: 600,
          cursor: saving ? "not-allowed" : "pointer",
          color: "#fff", opacity: saving ? 0.7 : 1,
          display: "flex", alignItems: "center", gap: 6,
        })}
      >
        <Save size={14} /> {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
});

export default StickyFooter;
