const AVATAR_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6", "#3b82f6"];

export function getInitials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export const PRIORITY_STYLES = {
  Low: "report-priority--low",
  Medium: "report-priority--medium",
  High: "report-priority--high",
};

export const STATUS_STYLES = {
  Active: "report-status--active",
  Completed: "report-status--completed",
  Pending: "report-status--pending",
  Inprogress: "report-status--inprogress",
  "On Hold": "report-status--hold",
  Present: "report-status--present",
  Approved: "report-status--approved",
  Rejected: "report-status--rejected",
  Paid: "report-status--approved",
  Sent: "report-status--inprogress",
  "Partially Paid": "report-status--hold",
  Generated: "report-status--approved",
  Processing: "report-status--pending",
};
