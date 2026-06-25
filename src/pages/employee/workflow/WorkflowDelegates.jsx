import React, { useState, useEffect, useCallback } from "react";
import {
  GitBranch, Calendar, Clock, ClipboardList, Award,
  FileOutput, UserCheck, Plus, Trash2, CheckCircle2,
  AlertCircle, Timer, ChevronDown, Users, Info,
} from "lucide-react";
import { listEmployees } from "../../../api/employee.api";
import { getStoredUser } from "../../../data/auth";
import { successToast } from "../../../utils/ToastControllers";

// ─── Workflow types relevant to this HRMS ────────────────────────────────────
const WORKFLOWS = [
  {
    id: "leave",
    label: "Leave Requests",
    desc: "Approve / reject employee leave applications",
    icon: <FileOutput size={18} />,
    color: "#f18200",
    bg: "#fff7ed",
  },
  {
    id: "attendance",
    label: "Attendance Regularization",
    desc: "Review and approve attendance correction requests",
    icon: <Clock size={18} />,
    color: "#6366f1",
    bg: "#eef2ff",
  },
  {
    id: "timesheet",
    label: "Timesheet Approvals",
    desc: "Approve weekly timesheets and extra-work requests",
    icon: <ClipboardList size={18} />,
    color: "#10b981",
    bg: "#f0fdf4",
  },
  {
    id: "appraisal",
    label: "Appraisal Reviews",
    desc: "Review and submit appraisal feedback for direct reports",
    icon: <Award size={18} />,
    color: "#a855f7",
    bg: "#faf5ff",
  },
  {
    id: "resignation",
    label: "Resignation Approvals",
    desc: "Acknowledge and process resignation requests",
    icon: <UserCheck size={18} />,
    color: "#ef4444",
    bg: "#fef2f2",
  },
];

// ─── Status helpers ───────────────────────────────────────────────────────────
function delegateStatus(from, to) {
  if (!from || !to) return null;
  const today = new Date().toISOString().slice(0, 10);
  if (to < today) return "expired";
  if (from > today) return "upcoming";
  return "active";
}

const STATUS_STYLE = {
  active:   { bg: "#f0fdf4", color: "#16a34a", label: "Active",   icon: <CheckCircle2 size={11} /> },
  upcoming: { bg: "#fff7ed", color: "#c2410c", label: "Upcoming", icon: <Timer size={11} /> },
  expired:  { bg: "#f8fafc", color: "#94a3b8", label: "Expired",  icon: <AlertCircle size={11} /> },
};

// ─── Employee dropdown ────────────────────────────────────────────────────────
function EmpSelect({ value, onChange, employees, placeholder = "Select delegate…", excludeId }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%", height: 36, paddingLeft: 10, paddingRight: 28,
          border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13,
          color: value ? "#1e293b" : "#94a3b8", background: "#fff",
          outline: "none", appearance: "none", cursor: "pointer",
        }}
      >
        <option value="">{placeholder}</option>
        {employees
          .filter(e => e.employee_id !== excludeId)
          .map(e => (
            <option key={e.employee_id} value={e.employee_id}>
              {[e.first_name, e.last_name].filter(Boolean).join(" ")} {e.emp_job_title ? `· ${e.emp_job_title}` : ""}
            </option>
          ))}
      </select>
      <ChevronDown size={14} style={{ position: "absolute", right: 8, top: "50%",
        transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
    </div>
  );
}

// ─── Single workflow delegate row ─────────────────────────────────────────────
function WorkflowRow({ wf, entry, employees, myId, onChange, onRemove }) {
  const status = delegateStatus(entry?.from, entry?.to);
  const st = status ? STATUS_STYLE[status] : null;
  const delegateName = entry?.delegateId
    ? (() => {
        const emp = employees.find(e => String(e.employee_id) === String(entry.delegateId));
        return emp ? [emp.first_name, emp.last_name].filter(Boolean).join(" ") : "—";
      })()
    : null;

  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
      padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: wf.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: wf.color, flexShrink: 0,
          }}>
            {wf.icon}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: 0 }}>{wf.label}</p>
            <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{wf.desc}</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {st && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 11, fontWeight: 600, padding: "3px 8px",
              borderRadius: 999, background: st.bg, color: st.color,
            }}>
              {st.icon} {st.label}
            </span>
          )}
          {entry?.delegateId && (
            <button type="button" onClick={() => onRemove(wf.id)}
              style={{ background: "none", border: "none", cursor: "pointer",
                color: "#ef4444", padding: 4, display: "flex" }}>
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Fields */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b",
            display: "block", marginBottom: 4 }}>Delegate To</label>
          <EmpSelect
            value={entry?.delegateId || ""}
            onChange={v => onChange(wf.id, "delegateId", v)}
            employees={employees}
            excludeId={myId}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b",
            display: "block", marginBottom: 4 }}>From Date</label>
          <input type="date" value={entry?.from || ""}
            disabled={!entry?.delegateId}
            onChange={e => onChange(wf.id, "from", e.target.value)}
            style={{
              width: "100%", height: 36, padding: "0 10px", border: "1px solid #e2e8f0",
              borderRadius: 8, fontSize: 13, outline: "none",
              background: !entry?.delegateId ? "#f8fafc" : "#fff",
              color: !entry?.delegateId ? "#cbd5e1" : "#1e293b",
            }} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b",
            display: "block", marginBottom: 4 }}>To Date</label>
          <input type="date" value={entry?.to || ""}
            disabled={!entry?.delegateId}
            min={entry?.from || undefined}
            onChange={e => onChange(wf.id, "to", e.target.value)}
            style={{
              width: "100%", height: 36, padding: "0 10px", border: "1px solid #e2e8f0",
              borderRadius: 8, fontSize: 13, outline: "none",
              background: !entry?.delegateId ? "#f8fafc" : "#fff",
              color: !entry?.delegateId ? "#cbd5e1" : "#1e293b",
            }} />
        </div>
      </div>

      {/* Summary line */}
      {entry?.delegateId && (
        <div style={{
          background: "#f8fafc", borderRadius: 8, padding: "8px 12px",
          fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 6,
        }}>
          <Info size={13} style={{ color: wf.color, flexShrink: 0 }} />
          <span>
            <strong style={{ color: "#1e293b" }}>{delegateName}</strong> will handle{" "}
            <em>{wf.label}</em> approvals on your behalf
            {entry.from && entry.to
              ? ` from ${entry.from} to ${entry.to}.`
              : " (dates not set — set a date range to activate)."}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── "Delegated to Me" tab ────────────────────────────────────────────────────
function DelegatedToMe({ myId, employees, delegates }) {
  // Collect entries where someone delegated to this user
  // (In a real app this would come from the API; here we simulate from saved state)
  const items = [];
  // placeholder: show a helpful empty state
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{
        background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10,
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
      }}>
        <Info size={16} style={{ color: "#f18200", flexShrink: 0 }} />
        <p style={{ fontSize: 13, color: "#92400e", margin: 0 }}>
          When a colleague sets you as their delegate, their pending approval requests will appear here.
          You'll also receive a notification.
        </p>
      </div>

      {items.length === 0 ? (
        <div style={{
          background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
          padding: "48px 24px", textAlign: "center",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%", background: "#f8fafc",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 12px",
          }}>
            <Users size={24} style={{ color: "#cbd5e1" }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", margin: "0 0 4px" }}>
            No active delegations
          </p>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
            No one has delegated their workflow approvals to you yet.
          </p>
        </div>
      ) : (
        items.map((item, i) => (
          <div key={i} style={{
            background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16,
          }}>
            {/* Would render real delegated items */}
          </div>
        ))
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function WorkflowDelegates() {
  const [tab, setTab] = useState("mine");        // "mine" | "delegated"
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [delegates, setDelegates] = useState({}); // { [wfId]: { delegateId, from, to } }
  const [saving, setSaving] = useState(false);
  const [oooFrom, setOooFrom] = useState("");
  const [oooTo, setOooTo] = useState("");
  const [oooEnabled, setOooEnabled] = useState(false);

  const user = getStoredUser();
  const myId = user?.employeeId;

  useEffect(() => {
    listEmployees({ limit: 500 })
      .then(res => setEmployees(res?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // When OOO is toggled on with dates, auto-fill all workflow date ranges
  const applyOoo = useCallback(() => {
    if (!oooFrom || !oooTo) return;
    setDelegates(prev => {
      const next = { ...prev };
      WORKFLOWS.forEach(wf => {
        if (next[wf.id]?.delegateId) {
          next[wf.id] = { ...next[wf.id], from: oooFrom, to: oooTo };
        }
      });
      return next;
    });
    successToast("OOO dates applied to all configured delegates.");
  }, [oooFrom, oooTo]);

  const handleChange = (wfId, field, value) => {
    setDelegates(prev => ({
      ...prev,
      [wfId]: {
        delegateId: prev[wfId]?.delegateId ?? "",
        from: prev[wfId]?.from ?? "",
        to: prev[wfId]?.to ?? "",
        [field]: value,
      },
    }));
  };

  const handleRemove = (wfId) => {
    setDelegates(prev => {
      const next = { ...prev };
      delete next[wfId];
      return next;
    });
  };

  const handleSaveAll = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600)); // simulate API
    setSaving(false);
    const count = Object.values(delegates).filter(d => d.delegateId).length;
    successToast(count > 0
      ? `${count} workflow delegate${count > 1 ? "s" : ""} saved successfully.`
      : "Delegate settings cleared.");
  };

  const activeDelegates = Object.values(delegates).filter(d => {
    const s = delegateStatus(d?.from, d?.to);
    return d?.delegateId && s === "active";
  }).length;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fb", padding: 24 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: "#fff7ed", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <GitBranch size={22} style={{ color: "#f18200" }} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", margin: 0 }}>
              Workflow Delegates
            </h1>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
              Assign who handles approvals on your behalf when you're away
            </p>
          </div>
        </div>

        {/* Summary chips */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {activeDelegates > 0 && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0",
              borderRadius: 999, fontSize: 12, fontWeight: 600, padding: "4px 10px",
            }}>
              <CheckCircle2 size={12} /> {activeDelegates} Active
            </span>
          )}
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "#f1f5f9", color: "#475569",
            borderRadius: 999, fontSize: 12, padding: "4px 10px",
          }}>
            <GitBranch size={12} /> {WORKFLOWS.length} Workflows
          </span>
        </div>
      </div>

      {/* ── OOO Banner ── */}
      <div style={{
        background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
        padding: "16px 20px", marginBottom: 20,
        display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 200 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 8, background: "#eff6ff",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Calendar size={18} style={{ color: "#3b82f6" }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", margin: 0 }}>
              Out-of-Office Quick Set
            </p>
            <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
              Set a date range and apply it to all delegates at once
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <input type="date" value={oooFrom} onChange={e => setOooFrom(e.target.value)}
            style={{ height: 34, padding: "0 10px", border: "1px solid #e2e8f0",
              borderRadius: 8, fontSize: 13, outline: "none" }} />
          <span style={{ fontSize: 12, color: "#94a3b8" }}>to</span>
          <input type="date" value={oooTo} min={oooFrom || undefined}
            onChange={e => setOooTo(e.target.value)}
            style={{ height: 34, padding: "0 10px", border: "1px solid #e2e8f0",
              borderRadius: 8, fontSize: 13, outline: "none" }} />
          <button type="button" onClick={applyOoo}
            disabled={!oooFrom || !oooTo}
            style={{
              height: 34, padding: "0 14px", borderRadius: 8, fontSize: 12,
              fontWeight: 600, border: "none", cursor: (!oooFrom || !oooTo) ? "not-allowed" : "pointer",
              background: (!oooFrom || !oooTo) ? "#f1f5f9" : "#f18200",
              color: (!oooFrom || !oooTo) ? "#94a3b8" : "#fff",
              transition: "background 0.15s",
            }}>
            Apply to All
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {[
          { key: "mine",      label: "My Delegates",       icon: <GitBranch size={14} /> },
          { key: "delegated", label: "Delegated to Me",    icon: <Users size={14} /> },
        ].map(t => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: "none", cursor: "pointer", transition: "all 0.15s",
              background: tab === t.key ? "#f18200" : "#fff",
              color: tab === t.key ? "#fff" : "#64748b",
              boxShadow: tab === t.key ? "0 2px 6px rgba(241,130,0,0.3)" : "0 1px 2px rgba(0,0,0,0.06)",
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8", fontSize: 14 }}>
          Loading employees…
        </div>
      ) : tab === "mine" ? (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {WORKFLOWS.map(wf => (
              <WorkflowRow
                key={wf.id}
                wf={wf}
                entry={delegates[wf.id]}
                employees={employees}
                myId={myId}
                onChange={handleChange}
                onRemove={handleRemove}
              />
            ))}
          </div>

          {/* Save bar */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginTop: 20, background: "#fff", border: "1px solid #e2e8f0",
            borderRadius: 12, padding: "14px 20px",
          }}>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
              {Object.values(delegates).filter(d => d?.delegateId).length > 0
                ? `${Object.values(delegates).filter(d => d?.delegateId).length} workflow(s) configured`
                : "No delegates configured — approvals will go to your default manager."}
            </p>
            <button type="button" onClick={handleSaveAll} disabled={saving}
              style={{
                height: 38, padding: "0 24px", borderRadius: 8, border: "none",
                background: saving ? "#fed7aa" : "#f18200", color: "#fff",
                fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
                transition: "background 0.15s",
              }}>
              {saving ? "Saving…" : "Save All Delegates"}
            </button>
          </div>
        </>
      ) : (
        <DelegatedToMe myId={myId} employees={employees} delegates={delegates} />
      )}
    </div>
  );
}
