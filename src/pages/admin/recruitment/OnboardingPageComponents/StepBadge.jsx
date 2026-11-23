import React from "react";
import { Check } from "lucide-react";
import { STEP_STATUS_CLS } from "./shared";
function StepBadge({
  value,
  boolean: isBool
}) {
  if (isBool) {
    return value ? <span className="bg-emerald-100 text-emerald-600 px-2.5 py-[2px] rounded-full text-[11px] font-bold inline-flex items-center gap-1"><Check size={11} /> Done</span> : <span className="bg-red-100 text-red-600 px-2.5 py-[2px] rounded-full text-[11px] font-bold">Pending</span>;
  }
  const cls = STEP_STATUS_CLS[value] ?? "bg-gray-100 text-gray-500";
  return <span className={`px-2.5 py-[2px] rounded-full text-[11px] font-bold ${cls}`}>{value || "Pending"}</span>;
}
export { StepBadge };
