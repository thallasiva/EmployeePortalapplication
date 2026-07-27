import React from "react";
import { REC_CLS } from "../constants/recClasses";

const RecBadge = React.memo(function RecBadge({ label }) {
  const s = REC_CLS[label] || { bg: "bg-gray-100", text: "text-gray-700", icon: "⚪" };
  return (
    <span className={`text-[12px] font-bold px-3 py-1 rounded-full ${s.bg} ${s.text}`}>
      {s.icon} {label}
    </span>
  );
});

export default RecBadge;
