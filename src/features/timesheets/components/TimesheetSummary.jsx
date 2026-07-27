import TimesheetStatusBadge from "./TimesheetStatusBadge";

const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-GB") : "—";

export default function TimesheetSummary({ detail })
{
  const items = [["Employee", detail.employee_name], ["Week", `${detail.week_start} → ${detail.week_end}`], ["Total Hours", `${Number(detail.total_hours || 0).toFixed(1)}h`], ["Status", <TimesheetStatusBadge key="status" status={detail.status} />], ["Submitted", formatDate(detail.submitted_at)], ["Reviewed By", detail.reviewer_name || "—"], ["Reviewed At", formatDate(detail.reviewed_at)], ["Comments", detail.comments || "—"]];
  return <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">{items.map(([label, value]) => <div key={label} className="rounded-xl bg-gray-50 p-3"><p className="mb-0.5 text-xs text-gray-400">{label}</p><div className="text-sm font-semibold text-gray-800">{value}</div></div>)}</div>;
}
