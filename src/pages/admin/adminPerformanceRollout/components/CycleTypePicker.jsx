import React from "react";
import { cssClass } from "../../../../utils/classStyles";
import { CYCLE_TYPES } from "../constants";

const CycleTypePicker = React.memo(function CycleTypePicker({ value, onChange }) {
  return (
    <div className={cssClass({ display: "flex", gap: 10, flexWrap: "wrap" })}>
      {CYCLE_TYPES.map((t) => (
        <button key={t.val} type="button" onClick={() => onChange(t.val)}
          className={cssClass({
            flex: "1 1 calc(50% - 5px)", padding: "11px 12px",
            border: `2px solid ${value === t.val ? t.color : "#e2e8f0"}`,
            borderRadius: 10, background: value === t.val ? t.bg : "#f8fafc",
            cursor: "pointer", textAlign: "left"
          })}>
          <div className={cssClass({ fontWeight: 700, fontSize: 13, color: value === t.val ? t.color : "#1e293b" })}>{t.label}</div>
          <div className={cssClass({ fontSize: 11, color: "#64748b", marginTop: 2 })}>{t.desc}</div>
        </button>
      ))}
    </div>
  );
});

export default CycleTypePicker;
