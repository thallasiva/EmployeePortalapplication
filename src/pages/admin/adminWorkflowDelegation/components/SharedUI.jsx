import React from "react";
import { cssClass } from "../../../../utils/classStyles";
import { BRAND } from "../constants/tabs";

export const Dot = React.memo(function Dot({ color, label }) {
  return (
    <div className={cssClass({ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b7280" })}>
      <div className={cssClass({ width: 10, height: 10, borderRadius: "50%", background: color })} />
      {label}
    </div>
  );
});

export const SectionHead = React.memo(function SectionHead({ children }) {
  return (
    <div className={cssClass({ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 16 })}>
      {children}
    </div>
  );
});

export const Input = React.memo(function Input({ style, ...props }) {
  return (
    <input
      {...props}
      className={cssClass({
        border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 12px",
        fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", ...style,
      })}
    />
  );
});

export const Btn = React.memo(function Btn({ children, onClick, disabled, variant = "primary", style: s = {} }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cssClass({
        background: variant === "primary" ? BRAND : variant === "danger" ? "#ef4444" : "#fff",
        color: variant === "ghost" ? "#374151" : "#fff",
        border: variant === "ghost" ? "1px solid #d1d5db" : "none",
        borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1,
        display: "flex", alignItems: "center", gap: 6, ...s,
      })}
    >
      {children}
    </button>
  );
});
