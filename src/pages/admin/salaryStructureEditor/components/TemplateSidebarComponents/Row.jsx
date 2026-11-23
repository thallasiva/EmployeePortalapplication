import React from "react";
const Row = React.memo(function Row({
  label,
  value,
  color
}) {
  return <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    padding: "5px 0"
  }}>
      <span style={{
      fontSize: 12,
      color: "var(--text-secondary)"
    }}>{label}</span>
      <span style={{
      fontSize: 12,
      fontWeight: 500,
      color: color || "var(--text-primary)",
      fontVariantNumeric: "tabular-nums"
    }}>
        {value}
      </span>
    </div>;
});
export { Row };
