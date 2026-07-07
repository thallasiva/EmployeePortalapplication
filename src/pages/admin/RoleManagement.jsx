import React, { useState, useEffect } from "react";
import { Search, ShieldCheck, User, Loader2, CheckCircle } from "lucide-react";
import apiClient from "../../api/client";
import { successToast, errorToast } from "../../utils/ToastControllers";

const ROLE_ICONS = {
  1: "🛡️",
  2: "👤",
  3: "📋",
  4: "🎯",
  5: "🔍",
};

const ROLE_COLORS = {
  1: { color: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
  2: { color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" },
  3: { color: "#7c3aed", bg: "#ede9fe", border: "#c4b5fd" },
  4: { color: "#f18200", bg: "#fff7ed", border: "#fed7aa" },
  5: { color: "#0369a1", bg: "#e0f2fe", border: "#7dd3fc" },
};

export default function RoleManagement() {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles]         = useState([]);
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState(null);   // selected employee
  const [pickedRole, setPickedRole] = useState(null); // role_id chosen
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.get("/employees/with-roles").then(r => setEmployees(r?.data?.data ?? [])),
      apiClient.get("/employees/roles/list").then(r => setRoles(r?.data?.data ?? [])),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function selectEmployee(emp) {
    setSelected(emp);
    setPickedRole(emp.role_id ?? null);
  }

  async function handleSave() {
    if (!selected || !pickedRole) return;
    if (pickedRole === (selected.role_id ?? null)) {
      errorToast("No change — same role is already assigned");
      return;
    }
    setSaving(true);
    try {
      await apiClient.put(`/employees/${selected.employee_id}/role`, { roleId: pickedRole });
      successToast(`Role updated for ${selected.first_name} ${selected.last_name}`);
      // refresh employee list so role badges update
      const r = await apiClient.get("/employees/with-roles");
      const updated = (r?.data?.data ?? []);
      setEmployees(updated);
      const refreshed = updated.find(e => e.employee_id === selected.employee_id);
      if (refreshed) setSelected(refreshed);
    } catch (err) {
      errorToast(err?.response?.data?.message || "Failed to update role");
    } finally {
      setSaving(false);
    }
  }

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const name = `${e.first_name || ""} ${e.last_name || ""}`.toLowerCase();
    return !q || name.includes(q) || (e.emp_code || "").toLowerCase().includes(q) || (e.email || "").toLowerCase().includes(q);
  });

  const getRoleLabel = (roleId) => roles.find(r => r.role_id === roleId)?.role_name || "—";
  const getRoleStyle = (roleId) => ROLE_COLORS[roleId] || ROLE_COLORS[2];

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto" }}>

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldCheck size={20} color="#f18200" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#111827" }}>Role Management</h1>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>Select an employee and assign their system role</p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>

        {/* ── Left: Employee list ── */}
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0", background: "#f9fafb" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 }}>
              Employees <span style={{ fontSize: 12, fontWeight: 500, color: "#9ca3af" }}>({filtered.length})</span>
            </div>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, ID or email…"
                style={{ width: "100%", boxSizing: "border-box", paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 8, outline: "none", background: "#fff", color: "#374151" }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 48, color: "#6b7280" }}>
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Loading…
            </div>
          ) : (
            <div style={{ maxHeight: 520, overflowY: "auto" }}>
              {filtered.length === 0 && (
                <div style={{ padding: 32, textAlign: "center", fontSize: 13, color: "#9ca3af" }}>No employees found</div>
              )}
              {filtered.map(emp => {
                const isActive = selected?.employee_id === emp.employee_id;
                const rc = getRoleStyle(emp.role_id);
                const name = `${emp.first_name || ""} ${emp.last_name || ""}`.trim();
                const initials = ((emp.first_name || "?")[0] + (emp.last_name || "")[0]).toUpperCase();
                return (
                  <div
                    key={emp.employee_id}
                    onClick={() => selectEmployee(emp)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 16px", cursor: "pointer",
                      borderBottom: "1px solid #f9fafb",
                      background: isActive ? "#fff7ed" : "#fff",
                      borderLeft: isActive ? "3px solid #f18200" : "3px solid transparent",
                      transition: "background 0.12s",
                    }}
                  >
                    {/* Avatar */}
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: isActive ? "#f18200" : "#1a2535", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                      {initials}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>{emp.emp_code} · {emp.designation_name || emp.emp_job_title || "—"}</div>
                    </div>
                    {/* Current role badge */}
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: rc.bg, color: rc.color, border: `1px solid ${rc.border}`, whiteSpace: "nowrap", flexShrink: 0 }}>
                      {ROLE_ICONS[emp.role_id] || ""} {getRoleLabel(emp.role_id)}
                    </span>
                    {isActive && <CheckCircle size={14} color="#f18200" style={{ flexShrink: 0 }} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right: Role picker ── */}
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0", background: "#f9fafb" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Assign Role</div>
          </div>

          {!selected ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <User size={36} color="#d1d5db" style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 13, color: "#9ca3af" }}>Select an employee from the left to assign a role</div>
            </div>
          ) : (
            <div style={{ padding: 16 }}>
              {/* Selected employee card */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, marginBottom: 20 }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#f18200", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
                  {((selected.first_name || "?")[0] + (selected.last_name || "")[0]).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{selected.first_name} {selected.last_name}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{selected.emp_code} · {selected.email}</div>
                  <div style={{ fontSize: 11, color: "#92400e", marginTop: 2 }}>
                    Current role: <strong>{getRoleLabel(selected.role_id)}</strong>
                  </div>
                </div>
              </div>

              {/* Role list with radio */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                Select New Role
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {roles.map(role => {
                  const rc = getRoleStyle(role.role_id);
                  const isChecked = pickedRole === role.role_id;
                  const isCurrent = selected.role_id === role.role_id;
                  return (
                    <label key={role.role_id}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                        border: isChecked ? `2px solid ${rc.color}` : "1px solid #e5e7eb",
                        background: isChecked ? rc.bg : "#fff",
                        boxShadow: isChecked ? `0 0 0 2px ${rc.color}20` : "none",
                        transition: "all 0.12s",
                      }}
                    >
                      <input
                        type="radio"
                        name="role"
                        checked={isChecked}
                        onChange={() => setPickedRole(role.role_id)}
                        style={{ accentColor: rc.color, width: 16, height: 16, flexShrink: 0 }}
                      />
                      <div style={{ fontSize: 18, flexShrink: 0 }}>{ROLE_ICONS[role.role_id] || "👤"}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 6 }}>
                          {role.role_name}
                          {isCurrent && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: "#059669", background: "#d1fae5", padding: "1px 7px", borderRadius: 20 }}>Current</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>{role.description || ""}</div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={saving || !pickedRole || pickedRole === selected.role_id}
                style={{
                  width: "100%", padding: "11px 0", fontSize: 14, fontWeight: 700,
                  color: "#fff", background: saving || pickedRole === selected.role_id ? "#d1d5db" : "#f18200",
                  border: "none", borderRadius: 10, cursor: saving || pickedRole === selected.role_id ? "not-allowed" : "pointer",
                  transition: "background 0.15s",
                }}
              >
                {saving ? "Saving…" : pickedRole === selected.role_id ? "No Change" : `Assign ${getRoleLabel(pickedRole)}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
