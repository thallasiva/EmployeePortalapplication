import React from "react";
import ActiveOnboardingCard from "./ActiveOnboardingCard";

const ActiveOnboardingsList = React.memo(function ActiveOnboardingsList({
  loading,
  activeOnboardings,
  onUpload,
  onViewChecklist,
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Active Onboardings</h2>
        <p className="text-sm text-slate-500">New hires within the first 90 days.</p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading employees…</p>
      ) : activeOnboardings.length === 0 ? (
        <p className="text-sm text-slate-400">No active onboardings at the moment.</p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {activeOnboardings.map((emp) => (
            <ActiveOnboardingCard
              key={emp.employee_id}
              emp={emp}
              onUpload={onUpload}
              onViewChecklist={onViewChecklist}
            />
          ))}
        </div>
      )}
    </section>
  );
});

export default ActiveOnboardingsList;
