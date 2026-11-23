import React from "react";
import { PRIMARY } from "./shared";
function Btn({
  children,
  loading,
  variant = "primary",
  ...props
}) {
  const base = {
    padding: "9px 20px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: loading ? "not-allowed" : "pointer",
    border: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    opacity: loading ? 0.7 : 1
  };
  const styles = {
    primary: {
      background: PRIMARY,
      color: "#fff"
    },
    ghost: {
      background: "#f3f4f6",
      color: "#374151"
    }
  };
  return <button style={{
    ...base,
    ...styles[variant]
  }} disabled={loading} {...props}>{children}</button>;
}
// ── Report Modal ──────────────────────────────────────────────────────────────
export { Btn };
