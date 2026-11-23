import React from "react";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
const StatusBadge = ({
  s
}) => {
  const cfg = {
    Sent: {
      bg: "#dcfce7",
      text: "#16a34a",
      icon: <CheckCircle2 size={12} />
    },
    Failed: {
      bg: "#fee2e2",
      text: "#dc2626",
      icon: <AlertCircle size={12} />
    },
    Pending: {
      bg: "#fef9c3",
      text: "#ca8a04",
      icon: <Clock size={12} />
    },
    Queued: {
      bg: "#ffedd5",
      text: "#e87500",
      icon: <Clock size={12} />
    }
  }[s] || {
    bg: "#f1f5f9",
    text: "#64748b",
    icon: null
  };
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{
    background: cfg.bg,
    color: cfg.text
  }}>
      {cfg.icon}{s}
    </span>;
};
export { StatusBadge };
