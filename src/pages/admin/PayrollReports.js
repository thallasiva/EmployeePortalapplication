import React, { useEffect, useState, useMemo } from 'react';
import { Mail, Download } from 'lucide-react';
import { listEmployees } from '../../api/employee.api';
import { listSalaryStructures } from '../../api/payroll.api';
import { getStoredUser } from '../../data/auth';
import { isSalaryVisible, formatSalary } from '../../utils/salaryMask';
import { getDepartmentName } from '../../utils/employeeDisplay';import { cssClass, joinClasses } from "../../utils/classStyles";

const AVATAR_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6", "#3b82f6", "#22c55e", "#ef4444"];
function initials(name = "") {return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "?";}
function avatarColor(name = "") {let h = 0;for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];}

const PayrollReports = () => {
  const user = getStoredUser();
  const canSeeSalary = isSalaryVisible(user);

  const [employees, setEmployees] = useState([]);
  const [salaryMap, setSalaryMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  useEffect(() => {
    Promise.all([
    listEmployees({ limit: 500 }),
    canSeeSalary ? listSalaryStructures({ limit: 500 }) : Promise.resolve({ data: [] })]
    ).then(([empRes, salRes]) => {
      const emps = empRes.data || [];
      setEmployees(emps);
      // Build employee_id → latest salary structure map
      const map = {};
      (salRes.data || []).forEach((s) => {
        if (!map[s.employee_id] || new Date(s.effective_date) > new Date(map[s.employee_id].effective_date)) {
          map[s.employee_id] = s;
        }
      });
      setSalaryMap(map);
    }).catch(() => {}).
    finally(() => setLoading(false));
  }, [canSeeSalary]);

  const departments = useMemo(() => {
    const set = new Set(employees.map((e) => getDepartmentName(e)).filter(Boolean));
    return ["", ...Array.from(set).sort()];
  }, [employees]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      const name = [e.first_name, e.last_name].filter(Boolean).join(" ");
      const matchQ = !q || [name, e.email, e.emp_job_title, getDepartmentName(e)].some((v) => (v || "").toLowerCase().includes(q));
      const matchD = !deptFilter || getDepartmentName(e) === deptFilter;
      return matchQ && matchD;
    });
  }, [employees, search, deptFilter]);

  const handleExport = () => {
    const rows = [["Name", "Email", "Department", "Job Title", "Status", "Gross Salary", "Account No"]];
    filtered.forEach((e) => {
      const name = [e.first_name, e.last_name].filter(Boolean).join(" ");
      const sal = salaryMap[e.employee_id];
      rows.push([name, e.email, getDepartmentName(e), e.emp_job_title || "", e.employee_status || "Active", sal?.gross_salary || "", sal?.bank_account_number ? `••••${String(sal.bank_account_number).slice(-4)}` : ""]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `payroll-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-semibold text-gray-800">Employee Payroll</h2>
          <p className="text-xs text-gray-400 mt-0.5">{loading ? "Loading…" : `${filtered.length} of ${employees.length} employees`}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-48 focus:outline-none focus:border-brand"
          placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand"
          value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            {departments.map((d) => <option key={d} value={d}>{d || "All Departments"}</option>)}
          </select>
          {canSeeSalary &&
          <button onClick={handleExport} className="flex items-center gap-1.5 bg-brand text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors">
              <Download size={14} /> Export
            </button>
          }
        </div>
      </div>

      {!canSeeSalary &&
      <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
          Salary and bank details are restricted to administrators only.
        </div>
      }

      {loading ?
      <div className="py-12 text-center text-sm text-gray-400">Loading…</div> :

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Employee</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Department</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Job Title</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Status</th>
                  {canSeeSalary && <>
                    <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide text-right">Gross Salary</th>
                    <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide text-center">Account No.</th>
                  </>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((emp) => {
                const name = [emp.first_name, emp.last_name].filter(Boolean).join(" ") || "—";
                const sal = salaryMap[emp.employee_id];
                const isActive = emp.employee_status === "Active";
                return (
                  <tr key={emp.employee_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className={joinClasses("w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", cssClass(
                          { background: avatarColor(name) }))}>{initials(name)}</span>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{name}</p>
                            <p className="text-[11px] text-gray-400">{emp.emp_code || `#${emp.employee_id}`}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <a href={`mailto:${emp.email}`} className="text-brand hover:underline flex items-center gap-1 text-sm">
                          <Mail size={12} /> {emp.email}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{getDepartmentName(emp)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{emp.emp_job_title || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {emp.employee_status || "Active"}
                        </span>
                      </td>
                      {canSeeSalary && <>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">
                          {sal?.gross_salary ? formatSalary(sal.gross_salary, true) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-sm text-gray-600">
                          {sal?.bank_account_number ? `••••${String(sal.bank_account_number).slice(-4)}` : <span className="text-gray-300">—</span>}
                        </td>
                      </>}
                    </tr>);

              })}
                {!filtered.length &&
              <tr><td colSpan={canSeeSalary ? 7 : 5} className="text-center text-gray-400 py-10 text-sm">No employees found.</td></tr>
              }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>);

};

export default PayrollReports;
