import React from "react";
import { ChevronRight, Upload } from "lucide-react";
import { joinClasses } from "../../../../utils/classStyles";
import { cssClass } from "../../../../utils/classStyles";
import { daysSince, progressFromDays, formatDate, initials } from "../utils";

const ActiveOnboardingCard = React.memo(function ActiveOnboardingCard({
  emp,
  onUpload,
  onViewChecklist,
}) {
  const days = daysSince(emp.date_of_joining);
  const progress = progressFromDays(days);

  return (
    <div className="onboarding-card">
      <div className="onboarding-card__top">
        <div>
          <div className="onboarding-avatar">{initials(emp.first_name, emp.last_name)}</div>
          <div className="mt-3">
            <p className="text-lg font-semibold text-slate-900">
              {emp.first_name} {emp.last_name || ""}
            </p>
            <p className="text-sm text-slate-500">
              {emp.designation_name || "—"}
              {emp.department_name ? ` · ${emp.department_name}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="onboarding-active-badge">Active</span>
          <button
            type="button"
            onClick={() => onUpload(emp)}
            className="flex items-center gap-1 text-xs text-brand border border-brand rounded-lg px-3 py-1.5 hover:bg-brand-50"
          >
            <Upload size={12} /> Upload Doc
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-5 text-sm text-slate-500">
        <div>
          <p className="font-medium text-slate-900">Start Date</p>
          <p className="mt-1">{formatDate(emp.date_of_joining)}</p>
        </div>
        <div>
          <p className="font-medium text-slate-900">Department</p>
          <p className="mt-1">{emp.department_name || "—"}</p>
        </div>
        <div>
          <p className="font-medium text-slate-900">Days Onboarding</p>
          <p className="mt-1">{days} days</p>
        </div>
        <div>
          <p className="font-medium text-slate-900">Progress</p>
          <p className="mt-1">{progress}%</p>
        </div>
      </div>

      <div className="onboarding-progress-bar">
        <div
          className={joinClasses(
            "onboarding-progress-bar__fill",
            cssClass({ width: `${progress}%` })
          )}
        />
      </div>

      <button
        type="button"
        className="onboarding-view-checklist"
        onClick={() => onViewChecklist(emp)}
      >
        View Checklist &amp; Documents <ChevronRight size={14} />
      </button>
    </div>
  );
});

export default ActiveOnboardingCard;
