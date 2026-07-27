export const BRAND = "#f18200";

export const STATUS_CFG = {
  pending:     { color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "Pending Review" },
  rm_approved: { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: "You Approved" },
  rm_rejected: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "You Rejected" },
  accepted:    { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: "HR Accepted" },
  rejected:    { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "HR Rejected" },
  withdrawn:   { color: "#64748b", bg: "#f8fafc", border: "#e2e8f0", label: "Withdrawn" },
};

export const FILTERS = [
  { key: "all",         label: "All" },
  { key: "pending",     label: "Pending" },
  { key: "rm_approved", label: "Approved by Me" },
  { key: "rm_rejected", label: "Rejected by Me" },
  { key: "accepted",    label: "HR Accepted" },
];
