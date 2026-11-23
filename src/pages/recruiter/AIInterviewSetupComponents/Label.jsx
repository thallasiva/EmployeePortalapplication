import React from "react";
// ── small helpers ─────────────────────────────────────────────────────────────
function Label({
  children
}) {
  return <label style={{
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    display: "block",
    marginBottom: 4
  }}>{children}</label>;
}
export { Label };
