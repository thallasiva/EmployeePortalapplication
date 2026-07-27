import { memo } from "react";

const ExtraWorkList = memo(function ExtraWorkList({ myExtraWork }) {
  if (!myExtraWork.length) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-amber-600 mb-2">
        Extra Work Requests This Week
      </p>
      <div className="space-y-1">
        {myExtraWork.map((ew) => (
          <div key={ew.extra_work_id} className="flex items-center gap-3 text-xs text-gray-600">
            <span className="font-medium text-gray-800">{ew.task_name}</span>
            <span>{ew.extra_hours}h</span>
            <span className="text-gray-400">{ew.work_date?.slice(0, 10)}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
              ew.status === "approved" ? "bg-emerald-50 text-emerald-700" :
              ew.status === "rejected" ? "bg-red-50 text-red-600" :
              "bg-amber-50 text-amber-700"
            }`}>{ew.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default ExtraWorkList;
