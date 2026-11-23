import React, { useEffect, useState, useMemo } from "react";
import { listEmployees } from "../../../api/employee.api";
import { getDepartmentName } from "../../../utils/employeeDisplay";
import { TeamCard } from "./TeamCard";
function EmployeeProfile() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  useEffect(() => {
    listEmployees({
      limit: 500
    }).then(({
      data
    }) => setEmployees(data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(e => [e.first_name, e.last_name, e.email, getDepartmentName(e), e.emp_job_title].some(v => (v || "").toLowerCase().includes(q)));
  }, [employees, search]);
  const groups = useMemo(() => {
    const map = {};
    filtered.forEach(emp => {
      const dept = getDepartmentName(emp) || "General";
      if (!map[dept]) map[dept] = [];
      map[dept].push(emp);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);
  return <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-semibold text-gray-800">Team Directory</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {loading ? "Loading…" : `${employees.length} employees across ${groups.length} team${groups.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <input className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-64 focus:outline-none focus:border-brand" placeholder="Search employees…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {loading ? <div className="py-12 text-center text-sm text-gray-400">Loading employees…</div> : groups.length === 0 ? <div className="py-12 text-center text-sm text-gray-400">No employees found.</div> : groups.map(([team, members]) => <TeamCard key={team} team={team} members={members} />)}
    </div>;
}
export { EmployeeProfile };
