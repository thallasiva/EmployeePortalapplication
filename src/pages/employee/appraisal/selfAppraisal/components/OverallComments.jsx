import React from "react";
import { cssClass } from "../../../../../utils/classStyles";

const OverallComments = React.memo(function OverallComments({ value, onChange, disabled }) {
  return (
    <div className={cssClass({
      background: "#fff", border: "1px solid #e2e8f0",
      borderRadius: 12, padding: 18, marginBottom: 20,
    })}>
      <p className={cssClass({ fontSize: 13, fontWeight: 700, color: "#1e293b", margin: "0 0 10px" })}>
        Overall Comments
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Summarize your achievements, challenges, and goals…"
        rows={4}
        className={cssClass({
          width: "100%", border: "1px solid #e2e8f0", borderRadius: 8,
          padding: "10px 12px", fontSize: 13, color: "#374151",
          outline: "none", resize: "vertical", boxSizing: "border-box",
          background: disabled ? "#f8fafc" : "#fff",
        })}
      />
    </div>
  );
});

export default OverallComments;
