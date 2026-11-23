import React from "react";
import { BORDER } from "./shared";
function Select({
  children,
  ...props
}) {
  return <select {...props} style={{
    width: "100%",
    boxSizing: "border-box",
    padding: "9px 12px",
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    fontSize: 14,
    background: "#fff",
    outline: "none",
    appearance: "none",
    ...(props.style || {})
  }}>
      {children}
    </select>;
}
export { Select };
