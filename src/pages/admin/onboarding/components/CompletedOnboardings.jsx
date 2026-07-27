import React from "react";
import { formatDate, initials } from "../utils";

const CompletedOnboardings = React.memo(function CompletedOnboardings({
  loading,
  completedOnboardings,
}) {
  return (
    <section className="onboarding-completed-panel">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Completed Onboardings ({completedOnboardings.length})
          </h2>
          <p className="text-sm text-slate-500">Employees who passed the 90-day mark.</p>
        </div>
        <span className="onboarding-completed-badge">Closed</span>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400 mt-2">Loading…</p>
      ) : completedOnboardings.length === 0 ? (
        <p className="text-sm text-slate-400 mt-2">None yet.</p>
      ) : (
        <div className="space-y-3 mt-4">
          {completedOnboardings.map((emp) => (
            <div key={emp.employee_id} className="onboarding-completed-card">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="onboarding-avatar">
                    {initials(emp.first_name, emp.last_name)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {emp.first_name} {emp.last_name || ""}
                    </p>
                    <p className="text-sm text-slate-500">
                      {emp.designation_name || "—"} · Started{" "}
                      {formatDate(emp.date_of_joining)}
                    </p>
                    {emp.department_name && (
                      <p className="text-sm text-slate-400">{emp.department_name}</p>
                    )}
                  </div>
                </div>
                <div className="onboarding-completed-progress">
                  <span className="text-sm font-semibold text-slate-900">100%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
});

export default CompletedOnboardings;
