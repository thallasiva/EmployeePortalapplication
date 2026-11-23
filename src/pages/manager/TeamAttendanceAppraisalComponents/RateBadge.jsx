import React from "react";
function RateBadge({
  rate
}) {
  const color = rate >= 95 ? "text-emerald-700 bg-emerald-50 border-emerald-200" : rate >= 85 ? "text-amber-700 bg-amber-50 border-amber-200" : "text-red-700 bg-red-50 border-red-200";
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      {rate}%
    </span>;
}
export { RateBadge };
