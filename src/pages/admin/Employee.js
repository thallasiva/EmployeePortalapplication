import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Pagination, { usePagination } from "../../components/Pagination";
import {
  Download, LayoutGrid, List, Upload, ChevronDown, ChevronRight,
  Users, Search, X, Filter, Check } from
"lucide-react";
import Teams from "./Teams";
import { useNavigate } from "react-router-dom";
import { listEmployees, createEmployee } from "../../api/employee.api";
import { getErrorMessage } from "../../api/client";
import { parseEmployeeCsv, mapCsvRowToEmployee, downloadEmployeeCsvTemplate } from "../../utils/employeeCsvImport";
import { downloadEmployeeCsv } from "../../utils/employeeCsvExport";
import EmployeeGridCard, { EmployeeListTable } from "../../component/employee/EmployeeViews";
import { successToast, errorToast } from "../../utils/ToastControllers";
import { getDepartmentName } from "../../utils/employeeDisplay";
import { getEmployeeStatus } from "../../utils/employeeStatus";
import "../../component/employee/employee.css";

// ── Status badge helper ──────────────────────────────────────────────────────
import { cssClass, joinClasses } from "../../utils/classStyles";function StatusChip({ employee, size = "sm" }) {
  const { label, bg, color, border } = getEmployeeStatus(employee);
  const px = size === "sm" ? "6px 10px" : "3px 8px";
  const fs = size === "sm" ? 11 : 10;
  return (
    <span className={cssClass({
      fontSize: fs, fontWeight: 600, padding: px, borderRadius: 999,
      background: bg, color, border: `1px solid ${border}`, whiteSpace: "nowrap"
    })}>{label}</span>);

}

// ── Team-grouped view ────────────────────────────────────────────────────────
const AVATAR_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6", "#3b82f6", "#22c55e", "#ef4444"];
function getInitials(name = "") {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "?";
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
      <button type="button" onClick={() => setExpanded((e) => !e)}
      className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
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
      {expanded &&
      <div className="border-t border-gray-100 divide-y divide-gray-50">
          {employees.map((emp) => {
          const name = [emp.first_name, emp.last_name].filter(Boolean).join(" ") || emp.email;
          return (
            <div key={emp.employee_id}
            onClick={() => navigate(`/dashboard/employee/${emp.employee_id}`)}
            className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                <span className={joinClasses("w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", cssClass(
                { background: avatarColor(name) }))}>{getInitials(name)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                  <p className="text-xs text-gray-400 truncate">{emp.emp_job_title || "—"}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-xs text-gray-400 hidden sm:block truncate max-w-[140px]">{emp.email}</span>
                  <StatusChip employee={emp} size="xs" />
                </div>
              </div>);

        })}
        </div>
      }
    </div>);

}

function TeamGroupedView({ employees }) {
  const groups = useMemo(() => {
    const map = {};
    employees.forEach((emp) => {
      const dept = getDepartmentName(emp) || "General";
      if (!map[dept]) map[dept] = [];
      map[dept].push(emp);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [employees]);
  if (!groups.length) return <p className="text-sm text-gray-400 py-8 text-center">No employees found.</p>;
  return (
    <div className="space-y-4">
      <span className="text-sm font-medium text-gray-600">
        {employees.length} employees across {groups.length} team{groups.length !== 1 ? "s" : ""}
      </span>
      {groups.map(([dept, emps]) =>
      <TeamGroupCard key={dept} department={dept} employees={emps} />
      )}
    </div>);

}

// ── Filter section (one collapsible group inside the panel) ─────────────────
function FilterSection({ sec, collapsed, onToggle }) {
  const SHOW = 6;
  const [showAll, setShowAll] = useState(false);
  const visibleOpts = showAll ? sec.options : sec.options.slice(0, SHOW);
  const activeCount = sec.selected.size;
  return (
    <div className={cssClass({ borderBottom: "1px solid #334155" })}>
      <button type="button" onClick={onToggle} className={cssClass(
        { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 20px", background: "none", border: "none", cursor: "pointer", color: "#e2e8f0" })}>
        <span className={cssClass({ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" })}>{sec.label}</span>
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 6 })}>
          {activeCount > 0 &&
          <span className={cssClass({ background: "#f43f5e", color: "#fff", borderRadius: 999, fontSize: 10, fontWeight: 700, padding: "1px 6px" })}>{activeCount}</span>
          }
          <ChevronDown size={13} className={cssClass({ color: "#64748b", transform: collapsed ? "rotate(-90deg)" : "none", transition: "0.15s" })} />
        </div>
      </button>
      {!collapsed &&
      <div className={cssClass({ paddingBottom: 8 })}>
          {visibleOpts.map((opt) => {
          const sel = sec.selected.has(opt.value);
          return (
            <button key={opt.value} type="button"
            onClick={() => {
              const next = new Set(sec.selected);
              if (next.has(opt.value)) next.delete(opt.value);else next.add(opt.value);
              sec.onChange(next);
            }} className={cssClass(
              { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 20px", background: sel ? "rgba(244,63,94,0.12)" : "none",
                border: "none", cursor: "pointer", textAlign: "left" })}>
                <span className={cssClass({ fontSize: 13, color: sel ? "#f9a8b4" : "#cbd5e1" })}>{opt.label}</span>
                <div className={cssClass({ display: "flex", alignItems: "center", gap: 8 })}>
                  {opt.count !== undefined && <span className={cssClass({ fontSize: 11, color: "#475569" })}>{opt.count}</span>}
                  <span className={cssClass({
                  width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                  border: `1.5px solid ${sel ? "#f43f5e" : "#475569"}`,
                  background: sel ? "#f43f5e" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center"
                })}>
                    {sel && <Check size={9} color="#fff" />}
                  </span>
                </div>
              </button>);

        })}
          {sec.options.length > SHOW &&
        <button onClick={() => setShowAll((s) => !s)} className={cssClass(
          { padding: "6px 20px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#64748b", fontWeight: 600 })}>
              {showAll ? "Show less" : `See all (${sec.options.length})`}
            </button>
        }
        </div>
      }
    </div>);

}

// ── Slide-out Filter Panel ───────────────────────────────────────────────────
function FilterPanel({ open, onClose, sections, activePills, activeFilterCount, resultCount, onClearAll }) {
  const [collapsed, setCollapsed] = useState({});
  const ref = useRef(null);

  useEffect(() => {
    function onKey(e) {if (e.key === "Escape") onClose();}
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const toggleSection = (id) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  if (!open) return null;
  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} className={cssClass(
        { position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.25)" })} />

      {/* Panel */}
      <div ref={ref} className={cssClass({
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 401,
        width: 300, background: "#1e293b", color: "#e2e8f0",
        display: "flex", flexDirection: "column", boxShadow: "-4px 0 24px rgba(0,0,0,0.25)"
      })}>
        {/* Header */}
        <div className={cssClass({ padding: "18px 20px 14px", borderBottom: "1px solid #334155",
          display: "flex", alignItems: "center", justifyContent: "space-between" })}>
          <div className={cssClass({ display: "flex", alignItems: "center", gap: 8 })}>
            <Filter size={14} className={cssClass({ color: "#94a3b8" })} />
            <span className={cssClass({ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", color: "#e2e8f0", textTransform: "uppercase" })}>Filter</span>
          </div>
          <button onClick={onClose} className={cssClass(
            { background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex" })}>
            <X size={16} />
          </button>
        </div>

        {/* Active filters */}
        {activePills.length > 0 &&
        <div className={cssClass({ padding: "12px 20px", borderBottom: "1px solid #334155" })}>
            <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 })}>
              <span className={cssClass({ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" })}>Active filters</span>
              <span className={cssClass({ fontSize: 12, color: "#94a3b8" })}>{resultCount} results</span>
            </div>
            <div className={cssClass({ display: "flex", flexWrap: "wrap", gap: 6 })}>
              {activePills.map((p) =>
            <span key={p.id} className={cssClass({
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "#f43f5e", color: "#fff", borderRadius: 999,
              fontSize: 12, fontWeight: 600, padding: "4px 10px"
            })}>
                  {p.label}
                  <button onClick={p.remove} className={cssClass(
                { background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex", padding: 0 })}>
                    <X size={11} />
                  </button>
                </span>
            )}
            </div>
            <button onClick={onClearAll} className={cssClass(
            { marginTop: 10, fontSize: 12, color: "#f43f5e", background: "none", border: "none",
              cursor: "pointer", fontWeight: 600, padding: 0, display: "flex", alignItems: "center", gap: 4 })}>
              ✕ Clear all filters
            </button>
          </div>
        }

        {/* Filter sections */}
        <div className={cssClass({ flex: 1, overflowY: "auto", padding: "8px 0" })}>
          {sections.map((sec) =>
          <FilterSection key={sec.id} sec={sec}
          collapsed={!!collapsed[sec.id]}
          onToggle={() => toggleSection(sec.id)} />
          )}
        </div>
      </div>
    </>);

}

// ── Active filter pill (toolbar) ─────────────────────────────────────────────
function FilterPill({ label, onRemove }) {
  return (
    <span className={cssClass({
      display: "inline-flex", alignItems: "center", gap: 5,
      background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa",
      borderRadius: 999, fontSize: 11, fontWeight: 600, padding: "3px 10px"
    })}>
      {label}
      <button type="button" onClick={onRemove} className={cssClass(
        { background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex" })}>
        <X size={11} color="#f18200" />
      </button>
    </span>);

}

// ── Main page ────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
{ value: "Active", label: "Active" },
{ value: "Notice Period", label: "Notice Period" },
{ value: "Resigned", label: "Resigned" },
{ value: "Inactive", label: "Inactive" }];

const TYPE_OPTIONS = [
{ value: "Full-Time", label: "Full-Time" },
{ value: "Part-Time", label: "Part-Time" },
{ value: "Contract", label: "Contract" },
{ value: "Intern", label: "Intern" }];


export default function Employee() {
  const navigate = useNavigate();
  const csvInputRef = useRef(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [selectedTab, setSelectedTab] = useState("All");
  const [search, setSearch] = useState("");

  // Multi-select filters
  const [filterStatus, setFilterStatus] = useState(new Set());
  const [filterDept, setFilterDept] = useState(new Set());
  const [filterType, setFilterType] = useState(new Set());
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  const refreshEmployees = async () => {
    setLoading(true);
    try {
      const { data } = await listEmployees({ limit: 500 });
      setEmployees(data);
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to load employees"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {refreshEmployees();}, []);

  // Derive unique dept options from loaded employees
  const deptOptions = useMemo(() => {
    const counts = {};
    employees.forEach((e) => {
      const d = e.department_name || "General";
      counts[d] = (counts[d] || 0) + 1;
    });
    return Object.entries(counts).
    sort(([a], [b]) => a.localeCompare(b)).
    map(([name, count]) => ({ value: name, label: name, count }));
  }, [employees]);

  // Build status options with counts
  const statusOptions = useMemo(() => {
    const counts = {};
    employees.forEach((e) => {
      const { label } = getEmployeeStatus(e);
      counts[label] = (counts[label] || 0) + 1;
    });
    return STATUS_OPTIONS.map((o) => ({ ...o, count: counts[o.value] || 0 })).filter((o) => o.count > 0);
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    let list = employees;

    // Status filter — match against canonical status label
    if (filterStatus.size > 0) {
      list = list.filter((e) => {
        const { label } = getEmployeeStatus(e);
        return filterStatus.has(label);
      });
    }
    // Department filter
    if (filterDept.size > 0) {
      list = list.filter((e) => filterDept.has(e.department_name || "General"));
    }
    // Employee type filter
    if (filterType.size > 0) {
      list = list.filter((e) => filterType.has(e.employee_type || "Full-Time"));
    }
    // Text search
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((e) => {
        const name = [e.first_name, e.last_name].filter(Boolean).join(" ").toLowerCase();
        return (
          name.includes(q) ||
          e.email?.toLowerCase().includes(q) ||
          e.emp_code?.toLowerCase().includes(q) ||
          e.department_name?.toLowerCase().includes(q) ||
          e.emp_job_title?.toLowerCase().includes(q) ||
          e.mobile?.includes(q));

      });
    }
    return list;
  }, [employees, search, filterStatus, filterDept, filterType]);

  const { paged: pagedEmployees, page: empPage, setPage: setEmpPage, totalPages: empTotalPages, from: empFrom, to: empTo, total: empTotal, pageSize: empPageSize, setPageSize: setEmpPageSize } = usePagination(filteredEmployees);

  const activeFilterCount = filterStatus.size + filterDept.size + filterType.size;

  const clearAllFilters = useCallback(() => {
    setFilterStatus(new Set());
    setFilterDept(new Set());
    setFilterType(new Set());
    setSearch("");
  }, []);

  // Build pill labels for active filters
  const activePills = useMemo(() => {
    const pills = [];
    filterStatus.forEach((v) => pills.push({
      id: `status:${v}`, label: `Status: ${v}`,
      remove: () => setFilterStatus((s) => {const n = new Set(s);n.delete(v);return n;})
    }));
    filterDept.forEach((v) => pills.push({
      id: `dept:${v}`, label: `Dept: ${v}`,
      remove: () => setFilterDept((s) => {const n = new Set(s);n.delete(v);return n;})
    }));
    filterType.forEach((v) => pills.push({
      id: `type:${v}`, label: `Type: ${v}`,
      remove: () => setFilterType((s) => {const n = new Set(s);n.delete(v);return n;})
    }));
    return pills;
  }, [filterStatus, filterDept, filterType]);

  const tabsMenu = [
  { id: 1, tabName: "All" },
  { id: 2, tabName: "Teams" }];


  const handleCsvImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      let rows = [];
      try {rows = parseEmployeeCsv(event.target.result);}
      catch {errorToast("Failed to parse CSV. Check file format.");e.target.value = "";return;}
      const codeToId = new Map();
      employees.forEach((emp) => {if (emp.emp_code) codeToId.set(String(emp.emp_code), emp.employee_id);});
      let created = 0,failed = 0;
      for (const row of rows) {
        const { employee, contactInfo, bankDetails, managerEmployeeNumber } = mapCsvRowToEmployee(row);
        if (!employee.first_name && !employee.email) continue;
        const reportingTo = managerEmployeeNumber && codeToId.has(managerEmployeeNumber) ? codeToId.get(managerEmployeeNumber) : null;
        try {
          await createEmployee({ ...employee, role_id: Number(employee.role) || 2, reporting_to: reportingTo, contactInfo, bankDetails });
          created++;
        } catch {failed++;}
      }
      await refreshEmployees();
      if (created) successToast(`${created} employee(s) imported from CSV`);
      if (failed) errorToast(`${failed} row(s) failed to import`);
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  const handleCsvExport = () => {
    if (!employees.length) {errorToast("No employees to export");return;}
    downloadEmployeeCsv(employees, `employees-${new Date().toISOString().slice(0, 10)}.csv`);
    successToast("Employee list exported");
  };

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex bg-white rounded-xl shadow overflow-hidden">
          {tabsMenu.map((item) =>
          <button className={`${selectedTab === item.tabName ? "selected px-6 py-2" : "notSelected px-6 py-2"}`}
          key={item.id} type="button" onClick={() => setSelectedTab(item.tabName)}>
              {item.tabName}
            </button>
          )}
        </div>
        <div className="emp-toolbar__actions">
          <input ref={csvInputRef} type="file" accept=".csv" className="emp-csv-input" onChange={handleCsvImport} />
          <button type="button" className="emp-btn emp-btn--outline" onClick={() => downloadEmployeeCsvTemplate()} title="Download CSV template">
            <Download size={16} className={cssClass({ display: "inline", verticalAlign: "middle", marginRight: 4 })} /> Template
          </button>
          <button type="button" className="emp-btn emp-btn--outline" onClick={() => csvInputRef.current?.click()}>
            <Upload size={16} className={cssClass({ display: "inline", verticalAlign: "middle", marginRight: 4 })} /> Import CSV
          </button>
          <button type="button" className="emp-btn emp-btn--outline" onClick={handleCsvExport}>
            <Download size={16} className={cssClass({ display: "inline", verticalAlign: "middle", marginRight: 4 })} /> Export CSV
          </button>
          <button type="button" className="emp-btn emp-btn--primary" onClick={() => navigate("/dashboard/create-employee")}>
            + Add Employee
          </button>
        </div>
      </div>

      {selectedTab === "All" &&
      <div className="space-y-3">
          {/* Toolbar: search + filters + view toggle */}
          <div className={cssClass({
          background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
          padding: "12px 16px", display: "flex", alignItems: "center",
          flexWrap: "wrap", gap: 10
        })}>
            {/* Search */}
            <div className={cssClass({ position: "relative", flex: "1 1 200px", minWidth: 160, maxWidth: 280 })}>
              <Search size={14} className={cssClass({ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" })} />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, code…" className={cssClass(
              {
                width: "100%", height: 34, paddingLeft: 32, paddingRight: search ? 28 : 12,
                border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13,
                outline: "none", boxSizing: "border-box"
              })} />
              {search &&
            <button type="button" onClick={() => setSearch("")} className={cssClass(
              { position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0 })}>
                  <X size={13} color="#94a3b8" />
                </button>
            }
            </div>

            {/* Filter button */}
            <button type="button" onClick={() => setFilterPanelOpen(true)} className={cssClass(
            {
              display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px",
              border: activeFilterCount > 0 ? "1.5px solid #f18200" : "1px solid #e2e8f0",
              borderRadius: 8, background: activeFilterCount > 0 ? "#fff7ed" : "#fff",
              fontSize: 13, fontWeight: 600,
              color: activeFilterCount > 0 ? "#c2410c" : "#64748b", cursor: "pointer"
            })}>
              <Filter size={14} />
              Filters
              {activeFilterCount > 0 &&
            <span className={cssClass({ background: "#f18200", color: "#fff", borderRadius: 999,
              fontSize: 10, fontWeight: 700, padding: "1px 6px", minWidth: 18, textAlign: "center" })}>
                  {activeFilterCount}
                </span>
            }
            </button>

            {/* Filter panel */}
            <FilterPanel
            open={filterPanelOpen}
            onClose={() => setFilterPanelOpen(false)}
            resultCount={filteredEmployees.length}
            activePills={activePills}
            activeFilterCount={activeFilterCount}
            onClearAll={clearAllFilters}
            sections={[
            { id: "status", label: "Status", options: statusOptions, selected: filterStatus, onChange: setFilterStatus },
            { id: "dept", label: "Department", options: deptOptions, selected: filterDept, onChange: setFilterDept },
            { id: "type", label: "Employee Type", options: TYPE_OPTIONS, selected: filterType, onChange: setFilterType }]
            } />
          

            {/* View toggle */}
            <div className={joinClasses("emp-view-toggle", cssClass({ marginLeft: "auto" }))}>
              <button type="button" className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")} title="Grid view">
                <LayoutGrid size={16} />
              </button>
              <button type="button" className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")} title="List view">
                <List size={16} />
              </button>
            </div>
          </div>

          {/* Active filter pills + count */}
          <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", minHeight: activePills.length > 0 ? 28 : 0 })}>
            {activePills.length > 0 &&
          <span className={cssClass({ fontSize: 12, color: "#94a3b8", fontWeight: 500 })}>
                {filteredEmployees.length} of {employees.length} employees
              </span>
          }
            {activePills.length === 0 && !loading &&
          <span className={cssClass({ fontSize: 13, color: "#64748b", fontWeight: 500 })}>
                {loading ? "Loading…" : `${filteredEmployees.length} Employees`}
              </span>
          }
            {activePills.map((p) =>
          <FilterPill key={p.id} label={p.label} onRemove={p.remove} />
          )}
          </div>

          {/* Results */}
          {loading ?
        <p className="text-sm text-gray-400 py-8 text-center">Loading employees…</p> :
        filteredEmployees.length === 0 ?
        <div className="py-16 text-center">
              <Search size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500 mb-1">No employees match the current filters</p>
              <button type="button" onClick={clearAllFilters} className="mt-2 text-sm text-brand hover:underline">
                Clear filters
              </button>
            </div> :
        viewMode === "grid" ?
        <>
        <div className="emp-grid">
              {pagedEmployees.map((emp) => <EmployeeGridCard key={emp.employee_id} employee={emp} />)}
            </div>
        <Pagination page={empPage} setPage={setEmpPage} totalPages={empTotalPages} from={empFrom} to={empTo} total={empTotal} pageSize={empPageSize} setPageSize={setEmpPageSize} />
        </> :

        <>
        <EmployeeListTable employees={pagedEmployees} />
        <Pagination page={empPage} setPage={setEmpPage} totalPages={empTotalPages} from={empFrom} to={empTo} total={empTotal} pageSize={empPageSize} setPageSize={setEmpPageSize} />
        </>
        }
        </div>
      }

      {selectedTab === "Teams" &&
      <div className="space-y-3">
          {/* Teams tab also gets search + filter */}
          <div className={cssClass({
          background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
          padding: "12px 16px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10
        })}>
            <div className={cssClass({ position: "relative", flex: "1 1 200px", minWidth: 160, maxWidth: 280 })}>
              <Search size={14} className={cssClass({ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" })} />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees…" className={cssClass(
              { width: "100%", height: 34, paddingLeft: 32, paddingRight: search ? 28 : 12, border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" })} />
              {search &&
            <button type="button" onClick={() => setSearch("")} className={cssClass(
              { position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0 })}>
                  <X size={13} color="#94a3b8" />
                </button>
            }
            </div>
            <button type="button" onClick={() => setFilterPanelOpen(true)} className={cssClass(
            {
              display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px",
              border: activeFilterCount > 0 ? "1.5px solid #f18200" : "1px solid #e2e8f0",
              borderRadius: 8, background: activeFilterCount > 0 ? "#fff7ed" : "#fff",
              fontSize: 13, fontWeight: 600,
              color: activeFilterCount > 0 ? "#c2410c" : "#64748b", cursor: "pointer"
            })}>
              <Filter size={14} />
              Filters
              {activeFilterCount > 0 &&
            <span className={cssClass({ background: "#f18200", color: "#fff", borderRadius: 999,
              fontSize: 10, fontWeight: 700, padding: "1px 6px", minWidth: 18, textAlign: "center" })}>
                  {activeFilterCount}
                </span>
            }
            </button>
          </div>
          {loading ?
        <p className="text-sm text-gray-400 py-8 text-center">Loading employees…</p> :

        <TeamGroupedView employees={filteredEmployees} />
        }
        </div>
      }
    </div>);

}
