import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { DEFAULT_APPRAISAL_CRITERIA } from "../../../../data/appraisalTemplate";

const INPUT = { width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13 };

export default function ReviewTemplateEditor({ value, onChange }) {
  const criteria = value?.length ? value : DEFAULT_APPRAISAL_CRITERIA;
  const update = (index, key, fieldValue) => onChange(criteria.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: fieldValue } : item));
  const add = () => onChange([...criteria, { key: "", label: "" }]);
  const remove = (index) => onChange(criteria.filter((_, itemIndex) => itemIndex !== index));

  return (
    <section>
      <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 })}>
        <div>
          <label className={cssClass({ fontSize: 12, fontWeight: 600, color: "#475569" })}>Review template criteria</label>
          <p className={cssClass({ fontSize: 11, color: "#94a3b8", margin: "3px 0 0" })}>Use unique lowercase keys (letters, numbers, underscores) and visible labels.</p>
        </div>
        <button type="button" onClick={add} disabled={criteria.length >= 20}
          className={cssClass({ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 9px", border: "1px solid #e2e8f0", borderRadius: 7, background: "#fff", cursor: "pointer", color: "#475569" })}>
          <Plus size={13} /> Add
        </button>
      </div>
      <div className={cssClass({ display: "grid", gap: 7 })}>
        {criteria.map((criterion, index) => (
          <div key={index} className={cssClass({ display: "grid", gridTemplateColumns: "minmax(100px, 0.8fr) minmax(150px, 1.5fr) auto", gap: 7, alignItems: "center" })}>
            <input value={criterion.key} onChange={(event) => update(index, "key", event.target.value)}
              placeholder="criterion_key" aria-label={`Criterion ${index + 1} key`} style={INPUT} />
            <input value={criterion.label} onChange={(event) => update(index, "label", event.target.value)}
              placeholder="Criterion label" aria-label={`Criterion ${index + 1} label`} style={INPUT} />
            <button type="button" aria-label={`Remove criterion ${index + 1}`} onClick={() => remove(index)} disabled={criteria.length <= 1}
              className={cssClass({ display: "inline-flex", padding: 7, border: "none", background: "transparent", color: "#94a3b8", cursor: criteria.length <= 1 ? "not-allowed" : "pointer" })}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
