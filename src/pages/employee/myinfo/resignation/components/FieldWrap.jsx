import React from "react";
import { AlertTriangle } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";

const Req = () => <span className={cssClass({ color: "#ef4444", marginLeft: 2 })}>*</span>;

const FieldWrap = React.memo(function FieldWrap({ label, required, error, children, hint }) {
  return (
    <div>
      <label className={cssClass({ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 })}>
        {label}{required && <Req />}
      </label>
      {children}
      {hint && !error && (
        <p className={cssClass({ margin: "4px 0 0", fontSize: 11, color: "#94a3b8" })}>{hint}</p>
      )}
      {error && (
        <p className={cssClass({ margin: "4px 0 0", fontSize: 11, color: "#ef4444", display: "flex", alignItems: "center", gap: 3 })}>
          <AlertTriangle size={11} /> {error}
        </p>
      )}
    </div>
  );
});

export default FieldWrap;

export const fieldStyle = (hasErr) => ({
  width: "100%", boxSizing: "border-box", height: 40, padding: "0 12px",
  border: `1.5px solid ${hasErr ? "#fca5a5" : "#e2e8f0"}`,
  borderRadius: 8, fontSize: 13, outline: "none",
  background: hasErr ? "#fff5f5" : "#fff",
  color: "#1e293b", fontFamily: "inherit",
  transition: "border-color 0.15s",
});

export const textareaStyle = (hasErr) => ({
  ...fieldStyle(hasErr), height: "auto", paddingTop: 10, paddingBottom: 10, resize: "vertical",
});
