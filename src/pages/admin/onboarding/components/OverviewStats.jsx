import React from "react";
import { Users, Clock3, FileCheck } from "lucide-react";

const OverviewStats = React.memo(function OverviewStats({
  loading,
  activeCount,
  avgDays,
  pendingFormalities,
}) {
  const stats = [
    {
      value: loading ? "…" : activeCount,
      label: "Active Onboardings",
      sub: "Within first 90 days",
      icon: Users,
      color: "#f18200",
      bg: "#fff7ed",
    },
    {
      value: loading ? "…" : (avgDays === "—" ? "0d" : avgDays),
      label: "Avg Days Onboarding",
      sub: activeCount > 0 ? `Avg across ${activeCount} active hire${activeCount !== 1 ? "s" : ""}` : "No active onboardings",
      icon: Clock3,
      color: "#0ea5e9",
      bg: "#f0f9ff",
    },
    {
      value: loading ? "…" : pendingFormalities,
      label: "Pending Formalities",
      sub: "Awaiting HR review",
      icon: FileCheck,
      color: pendingFormalities > 0 ? "#dc2626" : "#16a34a",
      bg: pendingFormalities > 0 ? "#fef2f2" : "#f0fdf4",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map(({ value, label, sub, icon: Icon, color, bg }) => (
        <div
          key={label}
          className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: bg }}
          >
            <Icon size={22} style={{ color }} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-[13px] font-medium text-slate-700">{label}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
});

export default OverviewStats;
