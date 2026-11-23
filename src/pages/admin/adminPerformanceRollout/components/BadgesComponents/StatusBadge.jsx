import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
const StatusBadge = React.memo(function StatusBadge({
  status
}) {
  const map = {
    active: {
      bg: "#dcfce7",
      color: "#166534",
      label: "Active"
    },
    inactive: {
      bg: "#f1f5f9",
      color: "#64748b",
      label: "Inactive"
    }
  };
  const s = map[status] || map.inactive;
  return <span className={cssClass({
    background: s.bg,
    color: s.color,
    borderRadius: 999,
    padding: "2px 10px",
    fontSize: 11,
    fontWeight: 700
  })}>{s.label}</span>;
});
export { StatusBadge };
