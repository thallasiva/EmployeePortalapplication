import React from "react";
import { Building2 } from "lucide-react";

const DepartmentBreakdown = React.memo(function DepartmentBreakdown({
  deptBreakdown,
  deptFilter,
  setDeptFilter,
}) {
  return (
    <div className="admin-dash-card">
      <div className="flex items-center gap-2 mb-4">
        <Building2 size={18} className="text-gray-500" />
        <h2 className="text-base font-semibold text-gray-700">Department Breakdown</h2>
      </div>
      <div className="flex flex-wrap gap-3">
        {deptBreakdown.map(([dept, count]) => (
          <button
            key={dept}
            onClick={() => setDeptFilter(deptFilter === dept ? "All" : dept)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
              deptFilter === dept
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
            }`}
          >
            <span>{dept}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                deptFilter === dept ? "bg-white/20 text-white" : "bg-white text-gray-600"
              }`}
            >
              {count}
            </span>
          </button>
        ))}
        {deptFilter !== "All" && (
          <button
            onClick={() => setDeptFilter("All")}
            className="px-3 py-2 rounded-xl border text-sm text-gray-400 border-dashed border-gray-300 hover:bg-gray-50"
          >
            Clear filter
          </button>
        )}
      </div>
    </div>
  );
});

export default DepartmentBreakdown;
