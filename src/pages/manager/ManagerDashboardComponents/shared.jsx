function getInitials(name) {
  return (name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}
function fmt(val) {
  if (!val) return "—";
  return String(val).slice(0, 5);
}
function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
const ATT_BADGE = {
  present: {
    cls: "approved",
    label: "Present"
  },
  absent: {
    cls: "rejected",
    label: "Absent"
  },
  late: {
    cls: "pending",
    label: "Late"
  },
  "half-day": {
    cls: "pending",
    label: "Half Day"
  }
};
export { getInitials, fmt, timeAgo, ATT_BADGE };
