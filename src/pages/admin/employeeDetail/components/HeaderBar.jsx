import React from "react";
import { ArrowLeft, Edit2, Save, X as Cancel } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { BRAND } from "../constants";

const HeaderBar = React.memo(function HeaderBar({
  editMode, saving, onBack, onEdit, onCancel, onSave,
}) {
  return (
    <div
      className={cssClass({
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 20, flexWrap: "wrap", gap: 10,
      })}
    >
      <button
        onClick={onBack}
        className={cssClass({
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer",
          color: "#374151", fontSize: 14, fontWeight: 600,
        })}
      >
        <ArrowLeft size={16} /> Back
      </button>
      <div className={cssClass({ display: "flex", gap: 8 })}>
        {!editMode ? (
          <button
            onClick={onEdit}
            className={cssClass({
              display: "flex", alignItems: "center", gap: 6,
              background: BRAND, border: "none", borderRadius: 8,
              padding: "8px 18px", fontSize: 13, fontWeight: 600,
              cursor: "pointer", color: "#fff",
            })}
          >
            <Edit2 size={14} /> Edit Employee
          </button>
        ) : (
          <>
            <button
              onClick={onCancel}
              className={cssClass({
                display: "flex", alignItems: "center", gap: 6,
                background: "#fff", border: "1px solid #d1d5db", borderRadius: 8,
                padding: "8px 16px", fontSize: 13, fontWeight: 600,
                cursor: "pointer", color: "#374151",
              })}
            >
              <Cancel size={14} /> Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className={cssClass({
                display: "flex", alignItems: "center", gap: 6,
                background: BRAND, border: "none", borderRadius: 8,
                padding: "8px 18px", fontSize: 13, fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                color: "#fff", opacity: saving ? 0.7 : 1,
              })}
            >
              <Save size={14} /> {saving ? "Saving…" : "Save Changes"}
            </button>
          </>
        )}
      </div>
    </div>
  );
});

export default HeaderBar;
