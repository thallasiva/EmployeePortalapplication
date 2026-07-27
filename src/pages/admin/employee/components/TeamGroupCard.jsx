import React, { useState } from "react";
import { ChevronDown, ChevronRight, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cssClass, joinClasses } from "../../../../utils/classStyles";
import { getInitials, avatarColor } from "../utils";
import StatusChip from "./StatusChip";

const TeamGroupCard = React.memo(function TeamGroupCard({ department, employees }) {
  const [expanded, setExpanded] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
            <Users size={16} />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-800 text-sm">{department}</p>
            <p className="text-xs text-gray-400">
              {employees.length} employee{employees.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronDown size={16} className="text-gray-400" />
        ) : (
          <ChevronRight size={16} className="text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {employees.map((emp) => {
            const name =
              [emp.first_name, emp.last_name].filter(Boolean).join(" ") || emp.email;
            return (
              <div
                key={emp.employee_id}
                onClick={() => navigate(`/dashboard/employee/${emp.employee_id}`)}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <span
                  className={joinClasses(
                    "w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
                    cssClass({ background: avatarColor(name) })
                  )}
                >
                  {getInitials(name)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                  <p className="text-xs text-gray-400 truncate">{emp.emp_job_title || "—"}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-xs text-gray-400 hidden sm:block truncate max-w-[140px]">
                    {emp.email}
                  </span>
                  <StatusChip employee={emp} size="xs" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default TeamGroupCard;
