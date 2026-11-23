import React, { useState } from "react";
import { Users, ChevronDown, ChevronRight, Mail, Phone, Briefcase } from "lucide-react";
import { EmployeeStatusBadge } from "../../../utils/employeeStatus";
import { cssClass, joinClasses } from "../../../utils/classStyles";
import { initials, avatarColor } from "./shared";
function TeamCard({
  team,
  members
}) {
  const [open, setOpen] = useState(true);
  return <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
            <Users size={18} />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-800">{team}</p>
            <p className="text-xs text-gray-400">{members.length} member{members.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {open ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
      </button>
      {open && <div className="border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {members.map(emp => {
          const name = [emp.first_name, emp.last_name].filter(Boolean).join(" ") || emp.email;
          return <div key={emp.employee_id} className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors">
                  <span className={joinClasses("w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0", cssClass({
              background: avatarColor(name)
            }))}>
                    {initials(name)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                      <EmployeeStatusBadge employee={emp} className={cssClass({
                  fontSize: 10,
                  padding: "2px 7px"
                })} />
                    </div>
                    <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                      <Briefcase size={10} className="shrink-0" /> {emp.emp_job_title || "—"}
                    </p>
                    <p className="text-xs text-brand truncate flex items-center gap-1 mt-0.5">
                      <Mail size={10} className="shrink-0" /> {emp.email}
                    </p>
                    {emp.mobile && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Phone size={10} className="shrink-0" /> {emp.mobile}
                      </p>}
                  </div>
                </div>;
        })}
          </div>
        </div>}
    </div>;
}
export { TeamCard };
