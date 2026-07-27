import React from "react";
import { Clock3, Star, User2 } from "lucide-react";

const OverviewStats = React.memo(function OverviewStats({ loading, activeCount, avgDays }) {
  const stats = [
    { value: loading ? "…" : activeCount, label: "Active Onboardings", icon: <User2 size={18} /> },
    { value: loading ? "…" : avgDays, label: "Avg Days in Onboarding", icon: <Clock3 size={18} /> },
    { value: "4.6/5", label: "Satisfaction Score", icon: <Star size={18} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Onboarding</h1>
          <p className="text-sm text-slate-500">Track and manage new hire onboarding progress</p>
        </div>
        <div className="rounded-3xl bg-slate-100 px-4 py-2 text-sm text-slate-600">
          Updated today
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="onboarding-stat-card">
            <div className="onboarding-stat-card__icon">{stat.icon}</div>
            <div>
              <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default OverviewStats;
