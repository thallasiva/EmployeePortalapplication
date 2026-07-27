import React from "react";
import { Save, Send } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";

function ActionButtons({ saving, totalDeclared, onSaveDraft, onSubmit }) {
  return (
    <div className={cssClass({ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" })}>
      <button onClick={onSaveDraft} disabled={saving} className={cssClass(
        { display: "flex", alignItems: "center", gap: 6, padding: "10px 22px", borderRadius: 8,
          border: "1px solid #e2e8f0", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer" })}>
        <Save size={15} /> {saving ? "Saving…" : "Save Draft"}
      </button>
      <button onClick={onSubmit} disabled={saving || totalDeclared === 0} className={cssClass(
        { display: "flex", alignItems: "center", gap: 6, padding: "10px 22px", borderRadius: 8,
          border: "none", background: totalDeclared > 0 ? "#f18200" : "#e2e8f0",
          color: totalDeclared > 0 ? "#fff" : "#94a3b8",
          fontSize: 13, fontWeight: 600, cursor: totalDeclared > 0 ? "pointer" : "not-allowed" })}>
        <Send size={15} /> {saving ? "Submitting…" : "Submit Declaration"}
      </button>
    </div>
  );
}

export default React.memo(ActionButtons);
