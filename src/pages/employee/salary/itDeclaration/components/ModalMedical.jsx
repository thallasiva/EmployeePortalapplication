import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { MED_ITEMS } from "../constants";
import { fmt } from "../utils/formatters";
import Modal from "./Modal";
import AmtRow from "./AmtRow";

function ModalMedical({ values, setValues, onClose }) {
  const total = MED_ITEMS.reduce((s, item) => s + (Number(values[item.key]) || 0), 0);
  const selStyle = {
    padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 6,
    fontSize: 12, outline: "none", color: "#1e293b", background: "#fff",
    cursor: "pointer"
  };

  return (
    <Modal
      title="Medical & Health Benefits (Sec. 80D)"
      onClose={onClose}
      onSave={onClose}
      onClear={() => setValues({})}
    >
      {}
      <div className={cssClass({ borderRadius: 10, border: "1px solid #fed7aa", marginBottom: 16,
        background: "linear-gradient(135deg,#fff7ed,#ffedd5)",
        padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" })}>
        <div>
          <div className={cssClass({ fontSize: 11, color: "#92400e", fontWeight: 600, marginBottom: 2 })}>Total Declared</div>
          <div className={cssClass({ fontSize: 20, fontWeight: 800, color: "#f18200" })}>{fmt(total)}</div>
        </div>
        <div className={cssClass({ fontSize: 11, color: "#92400e", textAlign: "right" })}>
          Sec. 80D<br />
          <span className={cssClass({ fontWeight: 700 })}>Medical Benefits</span>
        </div>
      </div>

      {MED_ITEMS.map((item) => (
        <div key={item.key}>
          {item.hasAge ? (
            <div className={cssClass({ padding: "10px 10px", borderBottom: "1px solid #f1f5f9",
              background: Number(values[item.key]) > 0 ? "#fffbf5" : "transparent", borderRadius: 6, marginBottom: 2 })}>
              <div className={cssClass({ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 8 })}>
                <span className={cssClass({ fontSize: 9, fontWeight: 700, color: "#f18200", background: "#fff7ed",
                  border: "1px solid #fed7aa", borderRadius: 4, padding: "1px 5px", marginTop: 2, whiteSpace: "nowrap" })}>
                  {item.section}
                </span>
                <div>
                  <div className={cssClass({ fontSize: 12.5, color: "#334155" })}>{item.label}</div>
                  <div className={cssClass({ fontSize: 10, color: "#94a3b8", marginTop: 2 })}>Limit: ₹{item.max}</div>
                </div>
              </div>
              <div className={cssClass({ display: "flex", gap: 8 })}>
                <div className={cssClass({ flex: 1 })}>
                  <div className={cssClass({ fontSize: 10, color: "#94a3b8", marginBottom: 3 })}>Age Group</div>
                  <select value={values[item.key + "_age"] || ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [item.key + "_age"]: e.target.value }))}
                    className={cssClass({ ...selStyle, width: "100%" })}>
                    <option value="">Select age</option>
                    <option value="below60">Below 60</option>
                    <option value="60to79">60 to 79</option>
                    <option value="above80">80 &amp; above</option>
                  </select>
                </div>
                <div>
                  <div className={cssClass({ fontSize: 10, color: "#94a3b8", marginBottom: 3 })}>Declared Amount</div>
                  <div className={cssClass({ display: "flex", border: "1px solid #e2e8f0", borderRadius: 6, overflow: "hidden", background: "#fff" })}>
                    <span className={cssClass({ padding: "7px 8px", background: "#f8fafc", borderRight: "1px solid #e2e8f0", fontSize: 12, color: "#64748b" })}>₹</span>
                    <input type="number" value={values[item.key] || ""}
                      onChange={(e) => setValues((prev) => ({ ...prev, [item.key]: Number(e.target.value) || 0 }))}
                      placeholder="0" className={cssClass(
                        { width: 100, padding: "7px 8px", border: "none", fontSize: 12, textAlign: "right", outline: "none" })} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <AmtRow
              section={item.section}
              label={item.label}
              maxLimit={item.max}
              value={values[item.key] || 0}
              onChange={(v) => setValues((prev) => ({ ...prev, [item.key]: v }))}
            />
          )}
          {item.hasParentAge && (
            <div className={cssClass({ padding: "6px 10px 10px 22px", borderBottom: "1px solid #f1f5f9" })}>
              <div className={cssClass({ fontSize: 11, color: "#64748b", marginBottom: 6, fontWeight: 600 })}>Parent's Age Group</div>
              <div className={cssClass({ display: "flex", gap: 8, flexWrap: "wrap" })}>
                {["< 60", "60 to 79", ">= 80"].map((opt) => (
                  <label key={opt} className={cssClass({
                    display: "flex", alignItems: "center", gap: 5, cursor: "pointer", fontSize: 12,
                    padding: "5px 14px", borderRadius: 6,
                    border: `1.5px solid ${values.parentAge === opt ? "#f18200" : "#e2e8f0"}`,
                    background: values.parentAge === opt ? "#fff7ed" : "#fff",
                    color: values.parentAge === opt ? "#c2410c" : "#64748b",
                    fontWeight: values.parentAge === opt ? 700 : 400
                  })}>
                    <input type="radio" name="parentAge" value={opt}
                      checked={values.parentAge === opt}
                      onChange={() => setValues((prev) => ({ ...prev, parentAge: opt }))}
                      className={cssClass({ accentColor: "#f18200" })} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </Modal>
  );
}

export default React.memo(ModalMedical);
