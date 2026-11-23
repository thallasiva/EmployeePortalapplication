import React from "react";
import { CheckCircle2, XCircle, Hourglass } from "lucide-react";
const STATUS_CONFIG = {
  approved: {
    bg: "#dcfce7",
    color: "#15803d",
    border: "#22c55e",
    icon: <CheckCircle2 size={12} />
  },
  rejected: {
    bg: "#fee2e2",
    color: "#dc2626",
    border: "#ef4444",
    icon: <XCircle size={12} />
  },
  pending: {
    bg: "#fef9c3",
    color: "#ca8a04",
    border: "#facc15",
    icon: <Hourglass size={12} />
  },
  cancelled: {
    bg: "#f1f5f9",
    color: "#64748b",
    border: "#cbd5e1",
    icon: <XCircle size={12} />
  },
  Approved: {
    bg: "#dcfce7",
    color: "#15803d",
    border: "#22c55e",
    icon: <CheckCircle2 size={12} />
  },
  Rejected: {
    bg: "#fee2e2",
    color: "#dc2626",
    border: "#ef4444",
    icon: <XCircle size={12} />
  },
  Pending: {
    bg: "#fef9c3",
    color: "#ca8a04",
    border: "#facc15",
    icon: <Hourglass size={12} />
  },
  Cancelled: {
    bg: "#f1f5f9",
    color: "#64748b",
    border: "#cbd5e1",
    icon: <XCircle size={12} />
  }
};
export { STATUS_CONFIG };
