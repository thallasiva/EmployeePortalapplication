import React from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
const STATUS_CFG = {
  verified: {
    bg: "#dcfce7",
    color: "#15803d",
    icon: <CheckCircle2 size={12} />,
    label: "Verified"
  },
  pending: {
    bg: "#fef9c3",
    color: "#a16207",
    icon: <Clock size={12} />,
    label: "Pending"
  },
  rejected: {
    bg: "#fee2e2",
    color: "#dc2626",
    icon: <XCircle size={12} />,
    label: "Rejected"
  }
};
export { STATUS_CFG };
