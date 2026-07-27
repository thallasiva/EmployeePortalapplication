import React from "react";
import { Search, Loader2, CheckCircle } from "lucide-react";
import { ROLE_ICONS } from "../constants";

const EmployeeList = React.memo(function EmployeeList({
  filtered,
  loading,
  selected,
  search,
  onSearch,
  onSelect,
  getRoleLabel,
  getRoleStyle
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="text-[13px] font-bold text-gray-700 mb-2.5">
          Employees <span className="text-xs font-medium text-gray-400">({filtered.length})</span>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by name, ID or email…"
            className="w-full box-border pl-8 pr-3 py-2 text-[13px] border border-gray-200 rounded-lg outline-none bg-white text-gray-700 focus:ring-1 focus:ring-orange-400"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2.5 p-12 text-gray-500">
          <Loader2 size={18} className="animate-spin" /> Loading…
        </div>
      ) : (
        <div className="overflow-y-auto" style={{ maxHeight: 540 }}>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-[13px] text-gray-400">No employees found</div>
          )}
          {filtered.map((emp) => {
            const isActive = selected?.employee_id === emp.employee_id;
            const rc = getRoleStyle(emp.role_id);
            const name = `${emp.first_name || ""} ${emp.last_name || ""}`.trim();
            const initials = ((emp.first_name || "?")[0] + (emp.last_name || "")[0]).toUpperCase();
            const desig = emp.emp_job_title || emp.designation_name || "—";
            return (
              <div
                key={emp.employee_id}
                onClick={() => onSelect(emp)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-50 transition-colors border-l-[3px] ${
                  isActive ? "bg-orange-50 border-l-orange-500" : "bg-white border-l-transparent"
                }`}
              >
                <div
                  className={`w-[38px] h-[38px] rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0 ${
                    isActive ? "bg-orange-500" : "bg-[#1a2535]"
                  }`}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-gray-900 truncate">{name}</div>
                  <div className="text-[11px] text-gray-500">{emp.emp_code} · {desig}</div>
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
                  style={{ backgroundColor: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}
                >
                  {ROLE_ICONS[emp.role_id] || ""} {getRoleLabel(emp.role_id)}
                </span>
                {isActive && <CheckCircle size={14} color="#f18200" className="shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default EmployeeList;
