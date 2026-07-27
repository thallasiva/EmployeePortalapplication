export const STATUS_STYLE = {
  draft: "bg-gray-100 text-gray-600 border-gray-300",
  pending: "bg-amber-50 text-amber-700 border-amber-300",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-300",
  rejected: "bg-red-50 text-red-600 border-red-300",
};

export const FILTER_OPTIONS = ["all", "pending", "approved", "rejected", "draft"];

export const PANEL_OPTIONS = [
  { key: "timesheets", label: "Weekly Timesheets" },
  { key: "extrawork", label: "Extra Work Requests" },
];

export const SUMMARY_STATS = [
  { key: "pendingApprovals", label: "Pending Approvals", color: "text-amber-600" },
  { key: "approvedTimesheets", label: "Approved", color: "text-emerald-600" },
  { key: "rejectedTimesheets", label: "Rejected", color: "text-red-500" },
];
