const statusClasses = {
  draft: "border-gray-300 bg-gray-100 text-gray-600",
  pending: "border-amber-300 bg-amber-50 text-amber-700",
  approved: "border-emerald-300 bg-emerald-50 text-emerald-700",
  rejected: "border-red-300 bg-red-50 text-red-600",
};

export default function TimesheetStatusBadge({ status })
{
  return <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${statusClasses[status] ?? "border-gray-300 bg-gray-100 text-gray-600"}`}>{status}</span>;
}
