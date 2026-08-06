import React, { useState, useEffect, useCallback } from "react";
import { Save, Shield, Check, X, ChevronRight, ChevronDown, Users, Loader2 } from "lucide-react";
import { menuPermissionsApi } from "../../api/settings.api";
import { bustMenuPermissionsCache } from "../../hooks/useMenuPermissions";

const BRAND = "#f18200";

const ROLES = ["Admin", "HR Manager", "Manager", "Employee", "Recruiter", "Finance"];
const ROLE_COLORS = ["#f18200", "#6366f1", "#8b5cf6", "#10b981", "#3b82f6", "#64748b"];

const MENU_TREE = [
  { id: "dashboard", label: "Dashboard", icon: "📊", children: [] },
  {
    id: "employees", label: "Employees", icon: "👥", children: [
      { id: "emp-list", label: "Employee List", icon: "📋" },
      { id: "emp-create", label: "Create Employee", icon: "➕" },
      { id: "emp-detail", label: "Employee Details", icon: "👤" },
    ]
  },
  { id: "attendance", label: "Attendance", icon: "🕐", children: [] },
  {
    id: "leave", label: "Leave Management", icon: "🏖️", children: [
      { id: "leave-req", label: "Leave Requests", icon: "📝" },
      { id: "leave-bal", label: "Leave Balances", icon: "📊" },
      { id: "leave-type", label: "Leave Types", icon: "🏷️" },
    ]
  },
  { id: "timesheets", label: "Timesheets", icon: "⏱️", children: [] },
  {
    id: "payroll", label: "Payroll", icon: "💰", children: [
      { id: "pay-overview", label: "Overview", icon: "📈" },
      { id: "pay-payslips", label: "Payslips", icon: "📄" },
      { id: "pay-ytd", label: "YTD Reports", icon: "📊" },
      { id: "pay-inputs", label: "Payroll Inputs", icon: "📥" },
      { id: "pay-comply", label: "Compliance", icon: "✅" },
    ]
  },
  {
    id: "recruitment", label: "Recruitment", icon: "🎯", children: [
      { id: "rec-jobs", label: "Job Postings", icon: "💼" },
      { id: "rec-cands", label: "Candidates", icon: "👤" },
      { id: "rec-inter", label: "Interviews", icon: "🗣️" },
    ]
  },
  { id: "performance", label: "Performance", icon: "⭐", children: [] },
  { id: "reports", label: "Reports", icon: "📑", children: [] },
  { id: "documents", label: "Documents", icon: "📂", children: [] },
  { id: "helpdesk", label: "Helpdesk", icon: "🎫", children: [] },
  { id: "onboarding", label: "Onboarding", icon: "🚀", children: [] },
  {
    id: "workflow", label: "Workflow & Hierarchy", icon: "🔗", children: [
      { id: "wf-org", label: "Org Hierarchy", icon: "🏢" },
      { id: "wf-mgrs", label: "Reporting Managers", icon: "👔" },
      { id: "wf-deleg", label: "Delegation", icon: "↗️" },
    ]
  },
  { id: "role-mgmt", label: "Role Management", icon: "🛡️", children: [] },
  {
    id: "settings", label: "Settings", icon: "⚙️", children: [
      { id: "set-gen", label: "General Settings", icon: "🔧" },
      { id: "set-email", label: "Email Configuration", icon: "📧" },
      { id: "set-notif", label: "Notification Settings", icon: "🔔" },
      { id: "set-audit", label: "Audit Logs", icon: "📋" },
    ]
  },
  { id: "form-builder", label: "Form Builder", icon: "📝", children: [] },
  { id: "report-builder", label: "Report Builder", icon: "📊", children: [] },
  { id: "dash-builder", label: "Dashboard Builder", icon: "🎨", children: [] },
  { id: "menu-perm", label: "Menu Permissions", icon: "🔒", children: [] },
  { id: "notif-center", label: "Notification Center", icon: "🔔", children: [] },
];

// Build default: Admin=all, others restricted
const buildDefault = () =>
{
  const perms = {};
  ROLES.forEach((role, ri) =>
  {
    const getAllIds = (items) => items.flatMap(m => [m.id, ...(m.children || []).map(c => c.id)]);
    const allIds = getAllIds(MENU_TREE);
    perms[role] = {};
    allIds.forEach(id =>
    {
      if (role === "Admin") { perms[role][id] = true; return; }
      if (role === "Employee")
      {
        perms[role][id] = ["dashboard", "attendance", "leave", "leave-req", "leave-bal", "timesheets", "payroll", "pay-payslips", "pay-ytd", "documents", "helpdesk"].includes(id);
        return;
      }
      if (role === "Manager")
      {
        perms[role][id] = !["set-email", "set-audit", "role-mgmt", "form-builder", "report-builder", "dash-builder", "menu-perm", "pay-comply", "pay-inputs"].includes(id);
        return;
      }
      if (role === "Recruiter")
      {
        perms[role][id] = ["dashboard", "recruitment", "rec-jobs", "rec-cands", "rec-inter", "documents", "helpdesk"].includes(id);
        return;
      }
      if (role === "Finance")
      {
        perms[role][id] = ["dashboard", "payroll", "pay-overview", "pay-payslips", "pay-ytd", "pay-inputs", "pay-comply", "reports", "documents"].includes(id);
        return;
      }
      perms[role][id] = true; // HR Manager gets all
    });
  });
  return perms;
};

export default function MenuPermissionBuilder() {
  const [perms, setPerms] = useState(buildDefault);
  const [activeRole, setActiveRole] = useState(ROLES[0]);
  const [expanded, setExpanded] = useState({});
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    menuPermissionsApi.get().then(data => {
      if (data && Object.keys(data).length > 0) setPerms(data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <Loader2 size={24} className="animate-spin" style={{color:"#f18200"}} />
    </div>
  );

  const toggle = (id) =>
  {
    setPerms(p => ({
      ...p,
      [activeRole]: { ...p[activeRole], [id]: !p[activeRole][id] }
    }));
    setDirty(true);
  };

  const toggleParent = (menu) =>
  {
    const childIds = (menu.children || []).map(c => c.id);
    const allOn = childIds.every(id => perms[activeRole]?.[id]) && perms[activeRole]?.[menu.id];
    const next = !allOn;
    const patch = { [menu.id]: next };
    childIds.forEach(id => patch[id] = next);
    setPerms(p => ({ ...p, [activeRole]: { ...p[activeRole], ...patch } }));
    setDirty(true);
  };

  const toggleAll = (val) =>
  {
    const all = {};
    MENU_TREE.forEach(m =>
    {
      all[m.id] = val;
      (m.children || []).forEach(c => all[c.id] = val);
    });
    setPerms(p => ({ ...p, [activeRole]: all }));
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      await menuPermissionsApi.save(perms);
      bustMenuPermissionsCache();
      setSaved(true); setDirty(false);
      setTimeout(() => setSaved(false), 2500);
    } catch { setSaved(false); }
  };

  const countEnabled = (role) => Object.values(perms[role] || {}).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {saved && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg text-[13px] font-semibold flex items-center gap-2">
          <Check size={15} /> Permissions saved successfully
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#fff8f0] border border-[#fed7aa] flex items-center justify-center">
            <Shield size={18} color={BRAND} />
          </div>
          <div>
            <h1 className="text-[20px] font-bold text-[#1e293b]">Menu Permission Builder</h1>
            <p className="text-[13px] text-[#94a3b8]">Control which menu items each role can access</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={!dirty}
          className={`flex items-center gap-2 h-[38px] px-5 rounded-lg text-[13px] font-bold transition-colors ${dirty ? "bg-[#f18200] hover:bg-[#e07000] text-white" : "bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed"}`}>
          <Save size={15} /> Save Changes
        </button>
      </div>

      <div className="px-6 pb-10 flex gap-5">
        {/* Role tabs column */}
        <div className="w-52 shrink-0 space-y-2">
          <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider mb-3">Select Role</p>
          {ROLES.map((role, ri) => (
            <button key={role} onClick={() => setActiveRole(role)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${activeRole === role
                ? "border-[#f18200] bg-[#fff8f0] shadow-sm"
                : "border-[#e2e8f0] bg-white hover:border-[#f18200]/30"}`}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0"
                style={{ background: ROLE_COLORS[ri] }}>
                {role[0]}
              </div>
              <div className="min-w-0">
                <p className={`text-[13px] font-bold ${activeRole === role ? "text-[#f18200]" : "text-[#1e293b]"}`}>{role}</p>
                <p className="text-[10px] text-[#94a3b8]">{countEnabled(role)} items enabled</p>
              </div>
            </button>
          ))}
        </div>

        {/* Permissions panel */}
        <div className="flex-1 bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0] bg-[#f8fafc]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold"
                style={{ background: ROLE_COLORS[ROLES.indexOf(activeRole)] }}>
                {activeRole[0]}
              </div>
              <span className="text-[15px] font-bold text-[#1e293b]">{activeRole} — Menu Access</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggleAll(true)}
                className="h-[30px] px-3 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100">
                Enable All
              </button>
              <button onClick={() => toggleAll(false)}
                className="h-[30px] px-3 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100">
                Disable All
              </button>
            </div>
          </div>

          {/* Menu tree */}
          <div className="divide-y divide-[#f8fafc]">
            {MENU_TREE.map(menu =>
            {
              const hasChildren = menu.children?.length > 0;
              const isExp = expanded[menu.id];
              const childIds = (menu.children || []).map(c => c.id);
              const allChildOn = childIds.every(id => perms[activeRole]?.[id]);
              const someChildOn = childIds.some(id => perms[activeRole]?.[id]);
              const parentOn = perms[activeRole]?.[menu.id];

              return (
                <div key={menu.id}>
                  <div className={`flex items-center gap-4 px-5 py-3.5 hover:bg-[#fafbff] transition-colors ${parentOn || allChildOn ? "" : "opacity-50"}`}>
                    {hasChildren ? (
                      <button onClick={() => setExpanded(p => ({ ...p, [menu.id]: !p[menu.id] }))}
                        className="text-[#94a3b8] hover:text-[#f18200]">
                        {isExp ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    ) : <div className="w-[14px]" />}
                    <span className="text-[16px]">{menu.icon}</span>
                    <span className="text-[13px] font-semibold text-[#1e293b] flex-1">{menu.label}</span>
                    {hasChildren && (
                      <span className="text-[11px] text-[#94a3b8] mr-2">{childIds.filter(id => perms[activeRole]?.[id]).length}/{childIds.length}</span>
                    )}
                    {/* Toggle */}
                    <button onClick={() => hasChildren ? toggleParent(menu) : toggle(menu.id)}
                      className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ${(hasChildren ? (allChildOn && parentOn) : parentOn) ? "bg-[#f18200]" : "bg-[#e2e8f0]"}`}>
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${(hasChildren ? (allChildOn && parentOn) : parentOn) ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                  {/* Children */}
                  {hasChildren && isExp && (
                    <div className="bg-[#f8fafc] border-t border-[#f1f5f9]">
                      {menu.children.map(child => (
                        <div key={child.id} className={`flex items-center gap-4 pl-14 pr-5 py-3 hover:bg-[#f0f4f8] transition-colors ${perms[activeRole]?.[child.id] ? "" : "opacity-50"}`}>
                          <span className="text-[13px]">{child.icon}</span>
                          <span className="text-[12px] font-medium text-[#374151] flex-1">{child.label}</span>
                          <button onClick={() => toggle(child.id)}
                            className={`w-9 h-5 rounded-full transition-all relative flex-shrink-0 ${perms[activeRole]?.[child.id] ? "bg-[#f18200]" : "bg-[#e2e8f0]"}`}>
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${perms[activeRole]?.[child.id] ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
