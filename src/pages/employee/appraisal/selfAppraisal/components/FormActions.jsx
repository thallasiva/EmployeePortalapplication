import React from "react";
import { Save, Send } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { BRAND } from "../constants";

const FormActions = React.memo(function FormActions({ saving, allRated, onSaveDraft, onSubmit }) {
  return (
    <div className={cssClass({ display: "flex", gap: 12, justifyContent: "flex-end" })}>
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
        disabled={saving || !allRated}
        className={cssClass({
          display: "flex", alignItems: "center", gap: 6,
          padding: "10px 20px", borderRadius: 8, border: "none",
          background: allRated ? BRAND : "#e2e8f0",
          color: allRated ? "#fff" : "#94a3b8",
          fontWeight: 600, fontSize: 13,
          cursor: allRated ? "pointer" : "not-allowed",
        })}
      >
        <Send size={14} />
        {saving ? "Submitting…" : "Submit Appraisal"}
      </button>
    </div>
  );
});

export default FormActions;
