export const BRAND = "#f18200";

export const STATUS_CFG = {
  pending:     { color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "Awaiting Manager" },
  rm_approved: { color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", label: "Manager Approved" },
  rm_rejected: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "Manager Rejected" },
  accepted:    { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: "Accepted" },
  rejected:    { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "Rejected" },
  withdrawn:   { color: "#64748b", bg: "#f8fafc", border: "#e2e8f0", label: "Withdrawn" },
};

export const FILTERS = [
  { key: "all",         label: "All" },
  { key: "pending",     label: "Awaiting Manager" },
  { key: "rm_approved", label: "Manager Approved" },
  { key: "rm_rejected", label: "Manager Rejected" },
  { key: "accepted",    label: "Accepted" },
  { key: "rejected",    label: "Rejected" },
  { key: "withdrawn",   label: "Withdrawn" },
];

export const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export const fmtDT = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};
