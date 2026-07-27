import React from "react";
import { cssClass } from "../../../../utils/classStyles";
import { getEmployeeStatus } from "../../../../utils/employeeStatus";

const StatusChip = React.memo(function StatusChip({ employee, size = "sm" }) {
  const { label, bg, color, border } = getEmployeeStatus(employee);
  const px = size === "sm" ? "6px 10px" : "3px 8px";
  const fs = size === "sm" ? 11 : 10;
  return (
    <span
      className={cssClass({
        fontSize: fs,
        fontWeight: 600,
        padding: px,
        borderRadius: 999,
        background: bg,
        color,
        border: `1px solid ${border}`,
        whiteSpace: "nowrap",
      })}
    >
      {label}
    </span>
  );
});

export default StatusChip;
