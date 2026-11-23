import React from "react";
import { Info, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
const TYPE_CFG = {
  info: {
    icon: <Info size={15} />,
    color: "#e87500",
    bg: "#fff7ed"
  },
  success: {
    icon: <CheckCircle2 size={15} />,
    color: "#16a34a",
    bg: "#dcfce7"
  },
  warning: {
    icon: <AlertTriangle size={15} />,
    color: "#d97706",
    bg: "#fef3c7"
  },
  error: {
    icon: <XCircle size={15} />,
    color: "#dc2626",
    bg: "#fee2e2"
  }
};
export { TYPE_CFG };
