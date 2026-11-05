import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { BRAND } from "../constants";

const EMPTY_GOAL = {
  title: "",
  description: "",
  success_metrics: "",
  self_progress: "",
  evidence_url: "",
};

export default function GoalsEditor({ goals, onChange, disabled }) {
  const updateGoal = (index, field, value) => {
    onChange(goals.map((goal, goalIndex) => goalIndex === index ? { ...goal, [field]: value } : goal));
  };
  const addGoal = () => onChange([...goals, { ...EMPTY_GOAL }]);
  const removeGoal = (index) => onChange(goals.filter((_, goalIndex) => goalIndex !== index));

  return (
    <section className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18, marginBottom: 16 })}>
      <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 })}>
        <div>
          <h3 className={cssClass({ margin: 0, color: "#1e293b", fontSize: 15, fontWeight: 700 })}>Goals and evidence</h3>
          <p className={cssClass({ margin: "4px 0 0", color: "#64748b", fontSize: 12 })}>Add measurable goals, progress, and a link to supporting evidence.</p>
        </div>
        {!disabled && (
          <button type="button" onClick={addGoal} disabled={goals.length >= 20}
            className={cssClass({ display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 11px", border: `1px solid ${BRAND}`, borderRadius: 8, background: "#fff", color: BRAND, fontWeight: 600, cursor: goals.length >= 20 ? "not-allowed" : "pointer" })}>
            <Plus size={14} /> Add goal
          </button>
        )}
      </div>
      {goals.length === 0 && <p className={cssClass({ margin: 0, color: "#94a3b8", fontSize: 13 })}>No goals added to this review.</p>}
      <div className={cssClass({ display: "grid", gap: 12 })}>
        {goals.map((goal, index) => (
          <div key={index} className={cssClass({ border: "1px solid #e2e8f0", borderRadius: 10, padding: 14 })}>
            <div className={cssClass({ display: "flex", alignItems: "center", gap: 8 })}>
              <input value={goal.title} disabled={disabled} maxLength={255}
                onChange={(event) => updateGoal(index, "title", event.target.value)}
                placeholder="Goal title"
                className={cssClass({ flex: 1, minWidth: 0, padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontWeight: 600, background: disabled ? "#f8fafc" : "#fff" })} />
              {!disabled && (
                <button type="button" aria-label="Remove goal" onClick={() => removeGoal(index)}
                  className={cssClass({ border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer", padding: 6 })}>
                  <Trash2 size={15} />
                </button>
              )}
            </div>
            <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 8, marginTop: 8 })}>
              <textarea value={goal.description} disabled={disabled} onChange={(event) => updateGoal(index, "description", event.target.value)}
                rows={2} placeholder="Description"
                className={cssClass({ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 7, resize: "vertical", background: disabled ? "#f8fafc" : "#fff" })} />
              <textarea value={goal.success_metrics} disabled={disabled} onChange={(event) => updateGoal(index, "success_metrics", event.target.value)}
                rows={2} placeholder="Success measures"
                className={cssClass({ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 7, resize: "vertical", background: disabled ? "#f8fafc" : "#fff" })} />
              <textarea value={goal.self_progress} disabled={disabled} onChange={(event) => updateGoal(index, "self_progress", event.target.value)}
                rows={2} placeholder="Progress and outcomes"
                className={cssClass({ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 7, resize: "vertical", background: disabled ? "#f8fafc" : "#fff" })} />
              {disabled && goal.evidence_url ? (
                <a href={goal.evidence_url} target="_blank" rel="noreferrer" className={cssClass({ alignSelf: "start", fontSize: 13, color: BRAND, padding: "8px 0" })}>Open supporting evidence</a>
              ) : (
                <input type="url" value={goal.evidence_url} disabled={disabled} onChange={(event) => updateGoal(index, "evidence_url", event.target.value)}
                  placeholder="Evidence link (https://...)"
                  className={cssClass({ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 7, background: disabled ? "#f8fafc" : "#fff" })} />
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
