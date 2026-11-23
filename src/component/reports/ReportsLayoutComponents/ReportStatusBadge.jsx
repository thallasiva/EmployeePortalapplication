import React from "react";
function ReportStatusBadge({
  status
}) {
  const cls = {
    Active: "report-status--active",
    Completed: "report-status--completed",
    Pending: "report-status--pending",
    Inprogress: "report-status--inprogress",
    "On Hold": "report-status--hold",
    Present: "report-status--present",
    Late: "report-status--pending",
    Absent: "report-status--rejected",
    "On Leave": "report-status--inprogress",
    Weekend: "report-status--hold",
    Approved: "report-status--approved",
    Rejected: "report-status--rejected",
    Paid: "report-status--approved",
    Sent: "report-status--inprogress",
    "Partially Paid": "report-status--hold",
    Generated: "report-status--approved",
    Processing: "report-status--pending"
  }[status] || "report-status--active";
  return <span className={`report-status ${cls}`}>{status}</span>;
}
export { ReportStatusBadge };
