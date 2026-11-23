import React from "react";
import { CheckCircle2, AlertCircle, Timer } from "lucide-react";
const STATUS_STYLE = {
  active: {
    bg: "#f0fdf4",
    color: "#16a34a",
    label: "Active",
    icon: <CheckCircle2 size={11} />
  },
  upcoming: {
    bg: "#fff7ed",
    color: "#c2410c",
    label: "Upcoming",
    icon: <Timer size={11} />
  },
  expired: {
    bg: "#f8fafc",
    color: "#94a3b8",
    label: "Expired",
    icon: <AlertCircle size={11} />
  }
};
export { STATUS_STYLE };
