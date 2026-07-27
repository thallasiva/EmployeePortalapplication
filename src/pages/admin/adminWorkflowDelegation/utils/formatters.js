export const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const statusColor = (s) => {
  if (!s) return { bg: "#f3f4f6", color: "#6b7280" };
  const m = {
    Active: { bg: "#fff7ed", color: "#f18200" },
    Inactive: { bg: "#fee2e2", color: "#dc2626" },
    Resigned: { bg: "#fef3c7", color: "#d97706" },
    Terminated: { bg: "#fee2e2", color: "#dc2626" },
  };
  return m[s] || { bg: "#f3f4f6", color: "#6b7280" };
};

export const nodeColor = (node) => {
  if (node.status === "Inactive" || node.status === "Resigned") return "#6b7280";
  if (node.delegate_name) return "#d97706";
  if (node.direct_count > 0) return "#f18200";
  return "#3b82f6";
};
