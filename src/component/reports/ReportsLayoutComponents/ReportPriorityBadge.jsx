import React from "react";
function ReportPriorityBadge({
  priority
}) {
  const cls = {
    Low: "report-priority--low",
    Medium: "report-priority--medium",
    High: "report-priority--high"
  }[priority] || "report-priority--low";
  return <span className={`report-priority ${cls}`}>
      <span className="report-priority__dot" />
      {priority}
    </span>;
}
export { ReportPriorityBadge };
