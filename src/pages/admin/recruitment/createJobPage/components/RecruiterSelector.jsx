import React from "react";
import { User } from "lucide-react";

const RecruiterSelector = React.memo(function RecruiterSelector({
  recruiters,
  assignedRecruiters,
  onToggle,
}) {
  if (!recruiters.length) return null;

  return (
    <div className="mt-2 mb-5 overflow-hidden rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2.5">
        <User size={14} color="#f18200" />
        <span className="text-[13px] font-bold text-gray-700">Assign Recruiters</span>
        {assignedRecruiters.length > 0 && (
          <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-px text-[11px] font-semibold text-orange-600">
            {assignedRecruiters.length} selected
          </span>
        )}
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-0.5 p-3">
        {recruiters.map((r) => {
          const checked = assignedRecruiters.includes(r.employee_id);
          return (
            <label
              key={r.employee_id}
              className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 transition-all duration-100 ${
                checked ? "border border-orange-200 bg-orange-50" : "border border-transparent"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(r.employee_id)}
                className="h-3.5 w-3.5 shrink-0 accent-orange-500"
              />
              <div>
                <div className={`text-[13px] ${checked ? "font-bold text-gray-900" : "font-medium text-gray-900"}`}>
                  {r.name}
                </div>
                <div className="text-[11px] text-gray-500">{r.email}</div>
              </div>
              {checked && (
                <span className="ml-auto text-[10px] text-orange-500">✔</span>
              )}
            </label>
          );
        })}
      </div>

      {assignedRecruiters.length > 0 && (
        <div className="border-t border-orange-200 bg-orange-50 px-4 py-2 text-[12px] text-orange-900">
          <strong>Assigned:</strong>{" "}
          {assignedRecruiters
            .map((id) => recruiters.find((r) => r.employee_id === id)?.name)
            .filter(Boolean)
            .join(", ")}
        </div>
      )}
    </div>
  );
});

export default RecruiterSelector;
