import React, { useEffect, useRef, useState, useMemo } from "react";
import { Download, LayoutGrid, List, Upload, ChevronDown, ChevronRight, Users, Search, X } from "lucide-react";
import Teams from "./Teams";
import Offices from "./Offices";
import { useNavigate } from "react-router-dom";
import { listEmployees, createEmployee } from "../../api/employee.api";
import { getErrorMessage } from "../../api/client";
import { parseEmployeeCsv, mapCsvRowToEmployee } from "../../utils/employeeCsvImport";
import { downloadEmployeeCsv } from "../../utils/employeeCsvExport";
import EmployeeGridCard, { EmployeeListTable } from "../../component/employee/EmployeeViews";
import { successToast, errorToast } from "../../utils/ToastControllers";
import { getDepartmentName } from "../../utils/employeeDisplay";
import "../../component/employee/employee.css";

// ── Team-grouped view ────────────────────────────────────────────────────────
const AVATAR_COLORS = ["#6366f1","#8b5cf6","#ec4899","#f97316","#14b8a6","#3b82f6","#22c55e","#ef4444"];
function getInitials(name = "") {
  return name.split(" ").map(p => p[0]).join("").slice(0,2).toUpperCase() || "?";
}
function avatarColor(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function TeamGroupCard({ department, employees }) {
  const [expanded, setExpanded] = useState(true);
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
            <Users size={16} />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-800 text-sm">{department}</p>
            <p className="text-xs text-gray-400">{employees.length} employee{employees.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {expanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {employees.map(emp => {
            const name = [emp.first_name, emp.last_name].filter(Boolean).join(" ") || emp.email;
            const isActive = emp.employee_status === "Active";
            const servingNotice = !!emp.serving_notice;
            return (
              <div
                key={emp.employee_id}
                onClick={() => navigate(`/dashboard/employee/${emp.employee_id}`)}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <span className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: avatarColor(name) }}>
                  {getInitials(name)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                  <p className="text-xs text-gray-400 truncate">{emp.emp_job_title || "—"}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-xs text-gray-400 hidden sm:block truncate max-w-[140px]">{emp.email}</span>
                  {servingNotice ? (
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-orange-50 text-orange-600 border border-orange-200">
                      Serving Notice
                    </span>
                  ) : (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {emp.employee_status || "Active"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TeamGroupedView({ employees }) {
  const groups = useMemo(() => {
    const map = {};
    employees.forEach(emp => {
      const dept = getDepartmentName(emp) || "General";
      if (!map[dept]) map[dept] = [];
      map[dept].push(emp);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [employees]);

  if (!groups.length) return <p className="text-sm text-gray-400 py-8 text-center">No employees found.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">{employees.length} employees across {groups.length} team{groups.length !== 1 ? "s" : ""}</span>
      </div>
      {groups.map(([dept, emps]) => (
        <TeamGroupCard key={dept} department={dept} employees={emps} />
      ))}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function Employee() {
  const navigate = useNavigate();
  const csvInputRef = useRef(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [selectedTab, setSelectedTab] = useState("All");
  const [search, setSearch] = useState("");

  const refreshEmployees = async () => {
    setLoading(true);
    try {
      const { data } = await listEmployees({ limit: 200 });
      setEmployees(data);
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to load employees"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshEmployees(); }, []);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(emp => {
      const name = [emp.first_name, emp.last_name].filter(Boolean).join(" ").toLowerCase();
      return (
        name.includes(q) ||
        emp.email?.toLowerCase().includes(q) ||
        emp.emp_code?.toLowerCase().includes(q) ||
        emp.department_name?.toLowerCase().includes(q) ||
        emp.emp_job_title?.toLowerCase().includes(q) ||
        emp.mobile?.includes(q)
      );
    });
  }, [employees, search]);

  const tabsMenu = [
    { id: 1, tabName: "All" },
    { id: 2, tabName: "Teams" }
  ];

  const handleCsvImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      let rows = [];
      try { rows = parseEmployeeCsv(event.target.result); }
      catch { errorToast("Failed to parse CSV. Check file format."); e.target.value = ""; return; }

      const codeToId = new Map();
      employees.forEach(emp => { if (emp.emp_code) codeToId.set(String(emp.emp_code), emp.employee_id); });

      let created = 0, failed = 0;
      for (const row of rows) {
        const { employee, contactInfo, bankDetails, managerEmployeeNumber } = mapCsvRowToEmployee(row);
        if (!employee.first_name && !employee.email) continue;
        const reportingTo = managerEmployeeNumber && codeToId.has(managerEmployeeNumber) ? codeToId.get(managerEmployeeNumber) : null;
        try {
          await createEmployee({ ...employee, role_id: Number(employee.role) || 2, reporting_to: reportingTo, contactInfo, bankDetails });
          created++;
        } catch { failed++; }
      }
      await refreshEmployees();
      if (created) successToast(`${created} employee(s) imported from CSV`);
      if (failed) errorToast(`${failed} row(s) failed to import`);
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  const handleCsvExport = () => {
    if (!employees.length) { errorToast("No employees to export"); return; }
    downloadEmployeeCsv(employees, `employees-${new Date().toISOString().slice(0,10)}.csv`);
    successToast("Employee list exported");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex bg-white rounded-xl shadow overflow-hidden">
          {tabsMenu.map(item => (
            <button
              className={`${selectedTab === item.tabName ? "selected px-6 py-2" : "notSelected px-6 py-2"}`}
              key={item.id} type="button"
              onClick={() => setSelectedTab(item.tabName)}
            >{item.tabName}</button>
          ))}
        </div>
        <div className="emp-toolbar__actions">
          <input ref={csvInputRef} type="file" accept=".csv" className="emp-csv-input" onChange={handleCsvImport} />
          <button type="button" className="emp-btn emp-btn--outline" onClick={() => csvInputRef.current?.click()}>
            <Upload size={16} style={{ display:"inline", verticalAlign:"middle", marginRight:4 }} /> Import CSV
          </button>
          <button type="button" className="emp-btn emp-btn--outline" onClick={handleCsvExport}>
            <Download size={16} style={{ display:"inline", verticalAlign:"middle", marginRight:4 }} /> Export CSV
          </button>
          <button type="button" className="emp-btn emp-btn--primary" onClick={() => navigate("/dashboard/create-employee")}>
            + Add Employee
          </button>
        </div>
      </div>

      {selectedTab === "All" && (
        <div className="space-y-4">
          <div className="emp-toolbar">
            <span className="font-medium text-sm text-gray-700">
              {loading ? "Loading employees…" : (
                search
                  ? <>{filteredEmployees.length} <span className="text-gray-400 font-normal">of {employees.length} Employees</ span></>
                  : `${employees.length} Employees`
              )}
            </span>
            <div className="flex items-center gap-2">
              {/* Search box */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search name, email, dept…"
                  className="h-8 pl-8 pr-7 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 w-56 transition"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              {/* View toggle */}
              <div className="emp-view-toggle">
                <button type="button" className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")} title="Grid view">
                  <LayoutGrid size={16} />
                </button>
                <button type="button" className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")} title="List view">
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400 py-8 text-center">Loading employees…</p>
          ) : filteredEmployees.length === 0 ? (
            <div className="py-16 text-center">
              <Search size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">No employees match "<span className="font-medium">{search}</span>"</p>
              <button type="button" onClick={() => setSearch("")} className="mt-2 text-sm text-brand hover:underline">Clear search</button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="emp-grid">
              {filteredEmployees.map(emp => <EmployeeGridCard key={emp.employee_id} employee={emp} />)}
            </div>
          ) : (
            <EmployeeListTable employees={filteredEmployees} />
          )}
        </div>
      )}

      {selectedTab === "Teams" && <Teams />}
     
    </div>
  );
}
