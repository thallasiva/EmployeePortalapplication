const CATEGORY_COLORS = ["#e87500", "#10b981", "#f59e0b", "#a855f7", "#e87500", "#f43f5e"];
const STATUS_COLORS = {
  Assigned: "#10b981",
  Available: "#e87500",
  Maintenance: "#f59e0b",
  Retired: "#94a3b8"
};
function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}
export { CATEGORY_COLORS, STATUS_COLORS, formatDate };
