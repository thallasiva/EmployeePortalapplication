export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const PROJECTS = [
  "HRMS Development",
  "Client Portal",
  "Internal Tools",
  "QA & Testing",
  "Documentation",
];

export const MAX_DAILY_HOURS = 8;

export const STATUS_STYLE = {
  draft: "bg-gray-100 text-gray-600 border border-gray-300",
  pending: "bg-amber-50 text-amber-700 border border-amber-300",
  approved: "bg-emerald-50 text-emerald-700 border border-emerald-300",
  rejected: "bg-red-50 text-red-600 border border-red-300",
};

export const STATUS_LABEL = {
  draft: "Draft",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export const TABS = [
  { id: "tasks", label: "My Tasks" },
  { id: "timesheets", label: "My Timesheet" },
];

export const FILTER_STYLE = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-500 border-red-200",
};
