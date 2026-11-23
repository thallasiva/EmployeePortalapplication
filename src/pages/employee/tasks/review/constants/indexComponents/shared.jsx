import { STATUS_CONFIG } from "./STATUS_CONFIG";
const sc = s => STATUS_CONFIG[s || "pending"] || STATUS_CONFIG["pending"];
const RESIGN_STATUS_CONFIG = {
  pending: {
    bg: "#fef9c3",
    color: "#ca8a04",
    border: "#facc15"
  },
  rm_approved: {
    bg: "#ffedd5",
    color: "#cf6900",
    border: "#fb923c"
  },
  rm_rejected: {
    bg: "#fee2e2",
    color: "#dc2626",
    border: "#ef4444"
  },
  accepted: {
    bg: "#dcfce7",
    color: "#15803d",
    border: "#22c55e"
  },
  rejected: {
    bg: "#fee2e2",
    color: "#dc2626",
    border: "#ef4444"
  },
  withdrawn: {
    bg: "#f1f5f9",
    color: "#64748b",
    border: "#cbd5e1"
  }
};
const TICKET_STATUS_CONFIG = {
  open: {
    bg: "#ffedd5",
    color: "#cf6900",
    border: "#fb923c"
  },
  "in-progress": {
    bg: "#fef9c3",
    color: "#b45309",
    border: "#fcd34d"
  },
  pending: {
    bg: "#fef9c3",
    color: "#ca8a04",
    border: "#facc15"
  },
  Forwarded: {
    bg: "#ede9fe",
    color: "#6d28d9",
    border: "#a78bfa"
  },
  resolved: {
    bg: "#dcfce7",
    color: "#15803d",
    border: "#22c55e"
  },
  closed: {
    bg: "#f1f5f9",
    color: "#64748b",
    border: "#cbd5e1"
  },
  Approved: {
    bg: "#dcfce7",
    color: "#15803d",
    border: "#22c55e"
  },
  Rejected: {
    bg: "#fee2e2",
    color: "#dc2626",
    border: "#ef4444"
  },
  Reopened: {
    bg: "#fff7ed",
    color: "#c2410c",
    border: "#fb923c"
  }
};
const showTabs = dataType => ["leave-decisions", "regularization", "resignations", "helpdesk"].includes(dataType);
export { sc, RESIGN_STATUS_CONFIG, TICKET_STATUS_CONFIG, showTabs };
