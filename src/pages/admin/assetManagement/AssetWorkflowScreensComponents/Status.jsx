import React from "react";
function Status({
  children
}) {
  const tone = {
    Available: "bg-blue-50 text-[#e87500]",
    Assigned: "bg-emerald-50 text-emerald-700",
    Maintenance: "bg-amber-50 text-amber-700",
    Retired: "bg-slate-100 text-slate-600",
    Active: "bg-emerald-50 text-emerald-700",
    Inactive: "bg-slate-100 text-slate-600",
    Pending: "bg-amber-50 text-amber-700",
    Approved: "bg-blue-50 text-[#e87500]",
    Rejected: "bg-red-50 text-red-700",
    Fulfilled: "bg-emerald-50 text-emerald-700",
    Open: "bg-amber-50 text-amber-700",
    "In Progress": "bg-blue-50 text-[#e87500]",
    Resolved: "bg-emerald-50 text-emerald-700",
    Cancelled: "bg-slate-100 text-slate-600"
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone[children] || "bg-slate-100 text-slate-600"}`}>{children || "—"}</span>;
}
export { Status };
