import React from "react";
import { Save, Send } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { BRAND } from "../constants";
const FormActions = React.memo(function FormActions({ saving, allRated, canSubmit = allRated, onSaveDraft, onSubmit }) {
  return (
    <div className={cssClass({ display: "flex", gap: 12, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" })}>
      {!canSubmit && <p className={cssClass({ margin: 0, color: "#b45309", fontSize: 12 })}>Add at least one titled goal and complete every rating to submit.</p>}
      {canSubmit && <span />}
      <div className={cssClass({ display: "flex", gap: 12 })}>
      <button
        onClick={onSaveDraft}
        disabled={saving}
        className={cssClass({
          display: "flex", alignItems: "center", gap: 6,
          padding: "10px 20px", borderRadius: 8,
          border: "1px solid #e2e8f0", background: "#fff",
          color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer",
        })}
      >
        <Save size={14} />
        {saving ? "Saving…" : "Save Draft"}
      </button>
      <button
        onClick={onSubmit}
        disabled={saving || !canSubmit}
        className={cssClass({
          display: "flex", alignItems: "center", gap: 6,
          padding: "10px 20px", borderRadius: 8, border: "none",
          background: canSubmit ? BRAND : "#e2e8f0",
          color: canSubmit ? "#fff" : "#94a3b8",
          fontWeight: 600, fontSize: 13,
          cursor: canSubmit ? "pointer" : "not-allowed",
        })}
      >
        <Send size={14} />
        {saving ? "Submitting…" : "Submit Appraisal"}
      </button>
      </div>
    </div>
  );
});
export default FormActions;
