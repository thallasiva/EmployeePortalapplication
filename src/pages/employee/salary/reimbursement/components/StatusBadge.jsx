import React from "react";
import { STATUS_CONFIG } from "../constants";

const StatusBadge = React.memo(function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
      {s.icon}{status}
    </span>
  );
});

export default StatusBadge;
