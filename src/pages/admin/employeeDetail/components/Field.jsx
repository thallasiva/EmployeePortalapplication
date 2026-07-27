import React from "react";
import { cssClass } from "../../../../utils/classStyles";

const Field = React.memo(function Field({ label, required, error, touched, children }) {
  const showErr = touched && error;
  return (
    <div className={cssClass({ marginBottom: 14 })}>
      <label
        className={cssClass({
          display: "block", fontSize: 11, fontWeight: 600,
          color: showErr ? "#dc2626" : "#6b7280",
          textTransform: "uppercase", marginBottom: 4, letterSpacing: "0.04em",
        })}
      >
        {label}
        {required && (
          <span className={cssClass({ color: "#dc2626", marginLeft: 2 })}>*</span>
        )}
      </label>
      {children}
      {showErr && (
        <div
          className={cssClass({
            fontSize: 11, color: "#dc2626", marginTop: 3,
            display: "flex", alignItems: "center", gap: 3,
          })}
        >
          <span>⚠</span> {error}
        </div>
      )}
    </div>
  );
});

export default Field;
