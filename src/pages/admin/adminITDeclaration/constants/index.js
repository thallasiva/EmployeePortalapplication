export const BRAND = "#f18200";

export const fmt = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;

export const fmtDate = (v) =>
  v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const DECL_STATUS = {
  submitted: { bg: "#dbeafe", color: "#1d4ed8", label: "Submitted" },
  approved: { bg: "#dcfce7", color: "#15803d", label: "Approved" },
  rejected: { bg: "#fee2e2", color: "#dc2626", label: "Rejected" },
  draft: { bg: "#fef9c3", color: "#a16207", label: "Draft" },
  not_started: { bg: "#f1f5f9", color: "#64748b", label: "Not Started" },
};

export const PROOF_STATUS = {
  verified: { bg: "#dcfce7", color: "#15803d", label: "Verified" },
  pending: { bg: "#fef9c3", color: "#a16207", label: "Pending" },
  rejected: { bg: "#fee2e2", color: "#dc2626", label: "Rejected" },
};
