import React, { useEffect, useState, useMemo } from "react";
import { Users, ChevronDown, ChevronRight, Mail, Phone, Briefcase } from "lucide-react";
import { listEmployees } from "../../api/employee.api";
import { getDepartmentName } from "../../utils/employeeDisplay";
import { avatarDataUri } from "../../lib/placeholders";
import { EmployeeStatusBadge } from "../../utils/employeeStatus";import { cssClass, joinClasses } from "../../utils/classStyles";

const AVATAR_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6", "#3b82f6", "#22c55e"];
function initials(name = "") {return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "?";}
function avatarColor(name = "") {let h = 0;for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];}

function TeamCard({ team, members }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button type="button" onClick={() => setOpen((o) => !o)}
      className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
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

      {open &&
      <div className="border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {members.map((emp) => {
            const name = [emp.first_name, emp.last_name].filter(Boolean).join(" ") || emp.email;
            return (
              <div key={emp.employee_id} className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors">
                  <span className={joinClasses("w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0", cssClass(
                  { background: avatarColor(name) }))}>
                    {initials(name)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                      <EmployeeStatusBadge employee={emp} className={cssClass({ fontSize: 10, padding: "2px 7px" })} />
                    </div>
                    <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                      <Briefcase size={10} className="shrink-0" /> {emp.emp_job_title || "—"}
                    </p>
                    <p className="text-xs text-brand truncate flex items-center gap-1 mt-0.5">
                      <Mail size={10} className="shrink-0" /> {emp.email}
                    </p>
                    {emp.mobile &&
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Phone size={10} className="shrink-0" /> {emp.mobile}
                      </p>
                  }
                  </div>
                </div>);

          })}
          </div>
        </div>
      }
    </div>);

}

export default function EmployeeProfile() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    listEmployees({ limit: 500 }).
    then(({ data }) => setEmployees(data || [])).
    catch(() => {}).
    finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
    [e.first_name, e.last_name, e.email, getDepartmentName(e), e.emp_job_title].
    some((v) => (v || "").toLowerCase().includes(q))
    );
  }, [employees, search]);

  const groups = useMemo(() => {
    const map = {};
    filtered.forEach((emp) => {
      const dept = getDepartmentName(emp) || "General";
      if (!map[dept]) map[dept] = [];
      map[dept].push(emp);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-semibold text-gray-800">Team Directory</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {loading ? "Loading…" : `${employees.length} employees across ${groups.length} team${groups.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <input
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-64 focus:outline-none focus:border-brand"
          placeholder="Search employees…"
          value={search}
          onChange={(e) => setSearch(e.target.value)} />
        
      </div>

      {loading ?
      <div className="py-12 text-center text-sm text-gray-400">Loading employees…</div> :
      groups.length === 0 ?
      <div className="py-12 text-center text-sm text-gray-400">No employees found.</div> :

      groups.map(([team, members]) =>
      <TeamCard key={team} team={team} members={members} />
      )
      }
    </div>);

}
