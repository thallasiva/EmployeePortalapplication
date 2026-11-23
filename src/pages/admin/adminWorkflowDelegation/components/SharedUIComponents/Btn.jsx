import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { BRAND } from "../../constants/tabs";
const Btn = React.memo(function Btn({
  children,
  onClick,
  disabled,
  variant = "primary",
  style: s = {}
}) {
  return <button onClick={onClick} disabled={disabled} className={cssClass({
    background: variant === "primary" ? BRAND : variant === "danger" ? "#ef4444" : "#fff",
    color: variant === "ghost" ? "#374151" : "#fff",
    border: variant === "ghost" ? "1px solid #d1d5db" : "none",
    borderRadius: 8,
    padding: "9px 18px",
    fontSize: 13,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    display: "flex",
    alignItems: "center",
    gap: 6,
    ...s
  })}>
      {children}
    </button>;
});
export { Btn };
