import React, { useState, useEffect } from "react";
import { Search, ShieldCheck, User, Loader2, CheckCircle, ChevronDown, ChevronRight, Briefcase } from "lucide-react";
import apiClient from "../../api/client";
import { successToast, errorToast } from "../../utils/ToastControllers";

// ── System role config ───────────────────────────────────────────────────────
const ROLE_ICONS  = { 1:"🛡️", 2:"👤", 3:"📋", 4:"🎯", 5:"🔍" };
const ROLE_COLORS = {
  1: { color:"#dc2626", bg:"#fee2e2", border:"#fca5a5" },
  2: { color:"#6b7280", bg:"#f3f4f6", border:"#e5e7eb" },
  3: { color:"#7c3aed", bg:"#ede9fe", border:"#c4b5fd" },
  4: { color:"#f18200", bg:"#fff7ed", border:"#fed7aa" },
  5: { color:"#0369a1", bg:"#e0f2fe", border:"#7dd3fc" },
};

// ── Job roles catalogue ──────────────────────────────────────────────────────
const JOB_ROLES = [
  { cat:"Management", color:"#185fa5", bg:"#e6f1fb", roles:[
    "CEO (Chief Executive Officer)","CTO (Chief Technology Officer)","CIO (Chief Information Officer)",
    "VP of Engineering","Director of Engineering","Engineering Manager","Delivery Manager",
    "Project Manager","Program Manager","Product Manager","Product Owner","Scrum Master",
  ]},
  { cat:"Software Development", color:"#0f6e56", bg:"#e1f5ee", roles:[
    "Associate Software Engineer","Software Engineer","Senior Software Engineer","Lead Software Engineer",
    "Technical Lead","Staff Engineer","Principal Engineer","Software Architect","Solution Architect",
    "Enterprise Architect","Full Stack Developer","Frontend Developer","Backend Developer",
    "Mobile App Developer","React Developer","Angular Developer","Vue.js Developer",
    "Java Developer",".NET Developer","Python Developer","Node.js Developer","PHP Developer",
    "Golang Developer","DevOps Engineer",
  ]},
  { cat:"QA & Testing", color:"#854f0b", bg:"#faeeda", roles:[
    "QA Engineer","Software Test Engineer","Automation Test Engineer","Manual Test Engineer",
    "Performance Test Engineer","Security Test Engineer","SDET","QA Lead","QA Manager",
  ]},
  { cat:"UI/UX Design", color:"#993556", bg:"#fbeaf0", roles:[
    "UI Designer","UX Designer","Product Designer","Graphic Designer","Visual Designer","Interaction Designer",
  ]},
  { cat:"DevOps & Cloud", color:"#534ab7", bg:"#eeedfe", roles:[
    "Cloud Engineer","AWS Engineer","Azure Engineer","GCP Engineer","Kubernetes Engineer",
    "Platform Engineer","Site Reliability Engineer (SRE)","Infrastructure Engineer","Build & Release Engineer",
  ]},
  { cat:"Data & AI", color:"#3b6d11", bg:"#eaf3de", roles:[
    "Data Analyst","Business Intelligence Developer","Data Engineer","Data Scientist",
    "Machine Learning Engineer","AI Engineer","Database Administrator (DBA)",
  ]},
  { cat:"Security", color:"#a32d2d", bg:"#fcebeb", roles:[
    "Cyber Security Engineer","Information Security Analyst","Security Architect",
    "Penetration Tester","SOC Analyst","IAM Engineer",
  ]},
  { cat:"Business & Product", color:"#993c1d", bg:"#faece7", roles:[
    "Business Analyst","Functional Consultant","Technical Consultant","Product Analyst",
    "Product Manager","Product Owner",
  ]},
  { cat:"Support", color:"#0c447c", bg:"#e6f1fb", roles:[
    "Application Support Engineer","Production Support Engineer","Technical Support Engineer",
    "Customer Support Engineer","Help Desk Executive","IT Support Engineer",
  ]},
  { cat:"HR & Recruitment", color:"#085041", bg:"#e1f5ee", roles:[
    "HR Executive","HR Generalist","HR Manager","Technical Recruiter","Talent Acquisition Specialist",
    "HR Business Partner (HRBP)","L&D Executive","Payroll Executive",
  ]},
  { cat:"Finance & Admin", color:"#633806", bg:"#faeeda", roles:[
    "Finance Executive","Accountant","Payroll Specialist","Accounts Manager",
    "Procurement Executive","Admin Executive","Office Manager",
  ]},
  { cat:"Sales & Marketing", color:"#72243e", bg:"#fbeaf0", roles:[
    "Sales Executive","Business Development Executive (BDE)","Business Development Manager (BDM)",
    "Account Manager","Customer Success Manager","Marketing Executive",
    "Digital Marketing Specialist","SEO Specialist","Content Writer",
  ]},
  { cat:"Leadership", color:"#3c3489", bg:"#eeedfe", roles:[
    "Team Lead","Technical Lead","Engineering Manager","Senior Manager",
    "Associate Director","Director","Vice President (VP)","CTO","CEO",
  ]},
];

// ── Job Roles panel (interactive when employee selected) ─────────────────────
function JobRolesPanel({ selected, onDesignationSaved, onEmployeesRefresh }) {
  const [q,              setQ]              = useState("");
  const [expanded,       setExpanded]       = useState({ Management: true, "Software Development": true });
  const [pickedDesig,    setPickedDesig]    = useState(null);
  const [savingDesig,    setSavingDesig]    = useState(false);

  // Sync picked designation when selected employee changes
  useEffect(() => {
    setPickedDesig(selected?.emp_job_title || selected?.designation_name || null);
    setQ("");
  }, [selected?.employee_id]);

  const toggle = (cat) => setExpanded(p => ({ ...p, [cat]: !p[cat] }));

  const filtered = q.trim()
    ? JOB_ROLES.map(g => ({ ...g, roles: g.roles.filter(r => r.toLowerCase().includes(q.toLowerCase())) })).filter(g => g.roles.length)
    : JOB_ROLES;

  const currentDesig = selected?.emp_job_title || selected?.designation_name || null;
  const changed      = pickedDesig && pickedDesig !== currentDesig;

  async function saveDesignation() {
    if (!selected || !pickedDesig || !changed) return;
    setSavingDesig(true);
    try {
      await apiClient.put(`/employees/${selected.employee_id}`, { emp_job_title: pickedDesig });
      successToast(`Designation updated to "${pickedDesig}"`);
      onDesignationSaved?.(selected.employee_id, pickedDesig);
      onEmployeesRefresh?.();
    } catch (err) {
      errorToast(err?.response?.data?.message || "Failed to update designation");
    } finally {
      setSavingDesig(false);
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white flex flex-col" style={{ maxHeight: 640 }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Briefcase size={14} color="#f18200" />
            <span className="text-[13px] font-bold text-gray-700">Job Designation</span>
          </div>
          <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">119 roles</span>
        </div>

        {selected ? (
          <div className="text-[11px] text-gray-500 mb-2">
            Current:{" "}
            <span className="font-semibold text-gray-700">{currentDesig || "Not set"}</span>
          </div>
        ) : (
          <div className="text-[11px] text-gray-400 mb-2">Select an employee to change designation</div>
        )}

        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search roles…"
            className="w-full pl-7 pr-3 py-1.5 text-[12px] border border-gray-200 rounded-lg outline-none bg-white text-gray-700 focus:ring-1 focus:ring-orange-400"
          />
        </div>
      </div>

      {/* Scrollable list */}
      <div className="overflow-y-auto flex-1">
        {filtered.length === 0 && (
          <div className="p-6 text-center text-[12px] text-gray-400">No roles match</div>
        )}
        {filtered.map(group => {
          const open = q.trim() ? true : !!expanded[group.cat];
          return (
            <div key={group.cat} className="border-b border-gray-50 last:border-0">
              {/* Category header */}
              <button
                onClick={() => toggle(group.cat)}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
              >
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: group.bg, color: group.color }}>
                  {group.roles.length}
                </span>
                <span className="text-[12px] font-semibold text-gray-700 flex-1">{group.cat}</span>
                {q.trim() ? null : (open
                  ? <ChevronDown size={12} className="text-gray-400 shrink-0" />
                  : <ChevronRight size={12} className="text-gray-400 shrink-0" />
                )}
              </button>

              {open && (
                <div className="pb-1">
                  {group.roles.map(role => {
                    const isPicked  = pickedDesig === role;
                    const isCurrent = currentDesig === role;
                    const canClick  = !!selected;
                    return (
                      <div
                        key={role}
                        onClick={() => canClick && setPickedDesig(role)}
                        className={`flex items-center gap-2 px-4 py-2 transition-colors ${
                          canClick ? "cursor-pointer" : "cursor-default"
                        } ${
                          isPicked
                            ? "bg-orange-50 border-l-[3px] border-orange-400"
                            : "hover:bg-gray-50 border-l-[3px] border-transparent"
                        }`}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: isPicked ? "#f18200" : group.color, opacity: isPicked ? 1 : 0.5 }}
                        />
                        <span className={`text-[12px] flex-1 ${isPicked ? "font-semibold text-orange-700" : "text-gray-700"}`}>
                          {role}
                        </span>
                        {isCurrent && !isPicked && (
                          <span className="text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full font-semibold shrink-0">current</span>
                        )}
                        {isPicked && (
                          <CheckCircle size={12} color="#f18200" className="shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save designation footer */}
      {selected && (
        <div className="px-3 py-3 border-t border-gray-100 bg-gray-50 shrink-0">
          {pickedDesig && (
            <div className="text-[11px] text-gray-500 mb-2 truncate">
              → <span className="font-semibold text-gray-800">{pickedDesig}</span>
            </div>
          )}
          <button
            onClick={saveDesignation}
            disabled={savingDesig || !changed}
            className="w-full py-2 text-[12px] font-bold text-white rounded-lg transition-colors"
            style={{
              background: savingDesig || !changed ? "#d1d5db" : "#f18200",
              cursor:     savingDesig || !changed ? "not-allowed" : "pointer",
            }}
          >
            {savingDesig ? "Saving…" : !changed ? "No Change" : "Update Designation"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function RoleManagement() {
  const [employees,  setEmployees]  = useState([]);
  const [roles,      setRoles]      = useState([]);
  const [search,     setSearch]     = useState("");
  const [selected,   setSelected]   = useState(null);
  const [pickedRole, setPickedRole] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);

  async function loadEmployees() {
    const r = await apiClient.get("/employees/with-roles");
    setEmployees(r?.data?.data ?? []);
  }

  useEffect(() => {
    Promise.all([
      loadEmployees(),
      apiClient.get("/employees/roles/list").then(r => setRoles(r?.data?.data ?? [])),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function selectEmployee(emp) {
    setSelected(emp);
    setPickedRole(emp.role_id ?? null);
  }

  // Called after designation saved — update local state
  function handleDesignationSaved(employeeId, newTitle) {
    setEmployees(prev => prev.map(e =>
      e.employee_id === employeeId ? { ...e, emp_job_title: newTitle, designation_name: newTitle } : e
    ));
    setSelected(prev => prev?.employee_id === employeeId
      ? { ...prev, emp_job_title: newTitle, designation_name: newTitle }
      : prev
    );
  }

  async function handleSave() {
    if (!selected || !pickedRole) return;
    if (pickedRole === (selected.role_id ?? null)) {
      errorToast("No change — same role is already assigned"); return;
    }
    setSaving(true);
    try {
      await apiClient.put(`/employees/${selected.employee_id}/role`, { roleId: pickedRole });
      successToast(`System role updated for ${selected.first_name} ${selected.last_name}`);
      await loadEmployees();
      setSelected(prev => ({ ...prev, role_id: pickedRole }));
    } catch (err) {
      errorToast(err?.response?.data?.message || "Failed to update role");
    } finally {
      setSaving(false);
    }
  }

  const filtered = employees.filter(e => {
    const q    = search.toLowerCase();
    const name = `${e.first_name || ""} ${e.last_name || ""}`.toLowerCase();
    return !q || name.includes(q) || (e.emp_code || "").toLowerCase().includes(q) || (e.email || "").toLowerCase().includes(q);
  });

  const getRoleLabel = (roleId) => roles.find(r => r.role_id === roleId)?.role_name || "—";
  const getRoleStyle = (roleId) => ROLE_COLORS[roleId] || ROLE_COLORS[2];

  return (
    <div className="px-7 py-6" style={{ maxWidth: 1400, margin: "0 auto" }}>

      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-9 h-9 rounded-[10px] bg-[#fff7ed] flex items-center justify-center">
            <ShieldCheck size={20} color="#f18200" />
          </div>
          <div>
            <h1 className="m-0 text-[20px] font-bold text-gray-900">Role Management</h1>
            <p className="m-0 text-[12px] text-gray-400">Assign system roles and job designations to employees</p>
          </div>
        </div>
      </div>

      {/* 3-column grid */}
      <div className="grid gap-5 items-start" style={{ gridTemplateColumns: "1fr 340px 280px" }}>

        {/* ── Col 1: Employee list ── */}
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="text-[13px] font-bold text-gray-700 mb-2.5">
              Employees <span className="text-xs font-medium text-gray-400">({filtered.length})</span>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
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
              {filtered.length === 0 && <div className="p-8 text-center text-[13px] text-gray-400">No employees found</div>}
              {filtered.map(emp => {
                const isActive = selected?.employee_id === emp.employee_id;
                const rc       = getRoleStyle(emp.role_id);
                const name     = `${emp.first_name || ""} ${emp.last_name || ""}`.trim();
                const initials = ((emp.first_name || "?")[0] + (emp.last_name || "")[0]).toUpperCase();
                const desig    = emp.emp_job_title || emp.designation_name || "—";
                return (
                  <div
                    key={emp.employee_id}
                    onClick={() => selectEmployee(emp)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-50 transition-colors border-l-[3px] ${
                      isActive ? "bg-orange-50 border-l-orange-500" : "bg-white border-l-transparent"
                    }`}
                  >
                    <div className={`w-[38px] h-[38px] rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0 ${isActive ? "bg-orange-500" : "bg-[#1a2535]"}`}>
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

        {/* ── Col 2: System role assignment ── */}
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <div className="px-4 py-3.5 border-b border-gray-100 bg-gray-50">
            <div className="text-[13px] font-bold text-gray-700">Assign System Role</div>
            <div className="text-[11px] text-gray-400 mt-0.5">Controls app access &amp; permissions</div>
          </div>

          {!selected ? (
            <div className="p-10 text-center">
              <User size={36} color="#d1d5db" className="mb-2.5 mx-auto" />
              <div className="text-[13px] text-gray-400">Select an employee to assign a role</div>
            </div>
          ) : (
            <div className="p-4">
              {/* Selected employee mini-card */}
              <div className="flex items-center gap-3 px-3.5 py-3 bg-orange-50 border border-orange-200 rounded-lg mb-5">
                <div className="w-[42px] h-[42px] rounded-full bg-orange-500 text-white flex items-center justify-center text-[15px] font-bold shrink-0">
                  {((selected.first_name || "?")[0] + (selected.last_name || "")[0]).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-bold text-gray-900">{selected.first_name} {selected.last_name}</div>
                  <div className="text-[11px] text-gray-500 truncate">{selected.emp_code} · {selected.email}</div>
                  <div className="text-[11px] text-amber-800 mt-0.5">
                    Designation: <strong>{selected.emp_job_title || selected.designation_name || "Not set"}</strong>
                  </div>
                  <div className="text-[11px] text-amber-700">
                    System role: <strong>{getRoleLabel(selected.role_id)}</strong>
                  </div>
                </div>
              </div>

              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">Select New Role</div>

              <div className="flex flex-col gap-2 mb-5">
                {roles.map(role => {
                  const rc        = getRoleStyle(role.role_id);
                  const isChecked = pickedRole === role.role_id;
                  const isCurrent = selected.role_id === role.role_id;
                  return (
                    <label
                      key={role.role_id}
                      className="flex items-center gap-3 px-3.5 py-3 rounded-lg cursor-pointer transition-all"
                      style={{
                        border:     isChecked ? `2px solid ${rc.color}` : "1px solid #e5e7eb",
                        background: isChecked ? rc.bg : "#fff",
                        boxShadow:  isChecked ? `0 0 0 2px ${rc.color}20` : "none",
                      }}
                    >
                      <input type="radio" name="role" checked={isChecked} onChange={() => setPickedRole(role.role_id)}
                        className="w-4 h-4 shrink-0" style={{ accentColor: rc.color }} />
                      <div className="text-lg shrink-0">{ROLE_ICONS[role.role_id] || "👤"}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 text-[13px] font-bold text-gray-900">
                          {role.role_name}
                          {isCurrent && <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-2 py-[1px] rounded-full">Current</span>}
                        </div>
                        <div className="text-[11px] text-gray-500">{role.description || ""}</div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !pickedRole || pickedRole === selected.role_id}
                className="w-full py-[11px] text-sm font-bold text-white rounded-lg transition-colors"
                style={{
                  background: saving || pickedRole === selected.role_id ? "#d1d5db" : "#f18200",
                  cursor:     saving || pickedRole === selected.role_id ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving…" : pickedRole === selected.role_id ? "No Change" : `Assign ${getRoleLabel(pickedRole)}`}
              </button>
            </div>
          )}
        </div>

        {/* ── Col 3: Job designation picker ── */}
        <JobRolesPanel
          selected={selected}
          onDesignationSaved={handleDesignationSaved}
          onEmployeesRefresh={loadEmployees}
        />

      </div>
    </div>
  );
}
