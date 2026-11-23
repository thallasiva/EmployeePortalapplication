const MODULE_TAGS = {
  Leave: "#10b981",
  Attendance: "#f59e0b",
  Payroll: "#e87500",
  Recruitment: "#8b5cf6",
  Performance: "#ec4899",
  Helpdesk: "#14b8a6",
  System: "#64748b",
  Onboarding: "#e87500"
};
const FILTER_OPTS = ["All", "Unread", "Leave", "Attendance", "Payroll", "Recruitment", "System"];
const PER = 15;
function timeAgo(dt) {
  if (!dt) return "";
  const diff = (Date.now() - new Date(dt).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
export { MODULE_TAGS, FILTER_OPTS, PER, timeAgo };
