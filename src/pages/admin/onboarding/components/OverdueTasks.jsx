import React from "react";

const OverdueTasks = React.memo(function OverdueTasks({ overdueTasks }) {
  if (!overdueTasks.length) return null;
  return (
    <section className="onboarding-overdue-panel">
      <div className="onboarding-overdue-header">
        <p className="text-sm font-semibold text-amber-800">
          Overdue Tasks ({overdueTasks.length})
        </p>
        <span className="onboarding-overdue-tag">Review now</span>
      </div>
      <div className="onboarding-overdue-list">
        {overdueTasks.map((task, i) => (
          <div key={i} className="onboarding-overdue-item">
            <div>
              <p className="font-semibold text-slate-900">{task.title}</p>
              <p className="text-sm text-slate-500">
                {task.owner} · Due Day {task.dueDays}
              </p>
            </div>
            <span className="onboarding-overdue-status">Overdue</span>
          </div>
        ))}
      </div>
    </section>
  );
});

export default OverdueTasks;
