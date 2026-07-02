import React, { useEffect, useState, useCallback } from "react";
import {
  Plus, ChevronDown, ChevronRight, Play, Square, Users, User,
  CheckCircle2, Clock, AlertCircle, RotateCcw, Search, X, Trash2, Settings } from
"lucide-react";
import {
  getAllAppraisalCycles, createAppraisalCycle, updateCycleSettings,
  rolloutCycle, disableCycle,
  getAllAppraisals, getEnrollments, enrollEmployees, unenrollEmployee } from
"../../api/appraisal.api";
import { listEmployees } from "../../api/employee.api";import { cssClass, joinClasses } from "../../utils/classStyles";

const BRAND = "#f18200";

const CYCLE_TYPES = [
{ val: "monthly", label: "Monthly", desc: "Every month", color: "#7c3aed", bg: "#f3e8ff" },
{ val: "quarterly", label: "Quarterly", desc: "Every 3 months", color: "#0369a1", bg: "#e0f2fe" },
{ val: "half_yearly", label: "Half-Yearly", desc: "Every 6 months", color: "#b45309", bg: "#fef3c7" },
{ val: "yearly", label: "Yearly", desc: "Once a year", color: "#166534", bg: "#dcfce7" }];


function CycleTypeBadge({ type }) {
  const t = CYCLE_TYPES.find((x) => x.val === type) || { label: type || "Yearly", color: "#166534", bg: "#dcfce7" };
  return (
    <span className={cssClass({ background: t.bg, color: t.color, borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 700, letterSpacing: 0.2 })}>
      {t.label}
    </span>);

}

function CycleTypePicker({ value, onChange }) {
  return (
    <div className={cssClass({ display: "flex", gap: 10, flexWrap: "wrap" })}>
      {CYCLE_TYPES.map((t) =>
      <button key={t.val} type="button" onClick={() => onChange(t.val)} className={cssClass({
        flex: "1 1 calc(50% - 5px)", padding: "11px 12px", border: `2px solid ${value === t.val ? t.color : "#e2e8f0"}`,
        borderRadius: 10, background: value === t.val ? t.bg : "#f8fafc", cursor: "pointer", textAlign: "left"
      })}>
          <div className={cssClass({ fontWeight: 700, fontSize: 13, color: value === t.val ? t.color : "#1e293b" })}>{t.label}</div>
          <div className={cssClass({ fontSize: 11, color: "#64748b", marginTop: 2 })}>{t.desc}</div>
        </button>
      )}
    </div>);

}

function fmtDate(v) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusBadge({ status }) {
  const map = {
    active: { bg: "#dcfce7", color: "#166534", label: "Active" },
    inactive: { bg: "#f1f5f9", color: "#64748b", label: "Inactive" }
  };
  const s = map[status] || map.inactive;
  return <span className={cssClass({ background: s.bg, color: s.color, borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 700 })}>{s.label}</span>;
}

function AppraisalBadge({ status }) {
  const map = {
    draft: { bg: "#fef9c3", color: "#92400e", label: "Draft" },
    submitted: { bg: "#dcfce7", color: "#166534", label: "Submitted" },
    reviewed: { bg: "#dbeafe", color: "#1e40af", label: "Reviewed" }
  };
  const s = map[status] || { bg: "#f1f5f9", color: "#64748b", label: "New" };
  return <span className={cssClass({ background: s.bg, color: s.color, borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 700 })}>{s.label}</span>;
}

function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div className={cssClass({ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" })}>
      <div className={cssClass({ background: "#fff", borderRadius: 12, width, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.2)" })}>
        <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #e2e8f0" })}>
          <span className={cssClass({ fontWeight: 700, fontSize: 16 })}>{title}</span>
          <button onClick={onClose} className={cssClass({ background: "none", border: "none", cursor: "pointer", color: "#64748b" })}><X size={18} /></button>
        </div>
        <div className={cssClass({ padding: 22 })}>{children}</div>
      </div>
    </div>);

}

/* ── Create Cycle Modal ─────────────────────────────────────────────────── */
function CreateCycleModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ fy_label: "", deadline: "", cycle_type: "yearly" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const submit = async () => {
    if (!form.fy_label.trim()) {setErr("Cycle name is required.");return;}
    setSaving(true);setErr("");
    try {const c = await createAppraisalCycle(form);onCreated(c);onClose();}
    catch (e) {setErr(e?.response?.data?.message || "Failed to create cycle.");} finally
    {setSaving(false);}
  };
  return (
    <Modal title="Create New Appraisal Cycle" onClose={onClose}>
      <div className={cssClass({ display: "flex", flexDirection: "column", gap: 14 })}>
        <div>
          <label className={cssClass({ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 })}>Cycle Name *</label>
          <input value={form.fy_label} onChange={(e) => setForm((p) => ({ ...p, fy_label: e.target.value }))} placeholder="e.g. 2026 Performance Appraisal" className={cssClass(
            { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, boxSizing: "border-box" })} />
        </div>
        <div>
          <label className={cssClass({ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 })}>Submission Deadline</label>
          <input type="date" value={form.deadline} onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))} className={cssClass(
            { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, boxSizing: "border-box" })} />
        </div>
        <div>
          <label className={cssClass({ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 10 })}>Appraisal Frequency *</label>
          <CycleTypePicker value={form.cycle_type} onChange={(v) => setForm((p) => ({ ...p, cycle_type: v }))} />
        </div>
        {err && <p className={cssClass({ color: "#dc2626", fontSize: 13, margin: 0 })}>{err}</p>}
        <div className={cssClass({ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 })}>
          <button onClick={onClose} className={cssClass({ padding: "9px 20px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer" })}>Cancel</button>
          <button onClick={submit} disabled={saving} className={cssClass({ padding: "9px 22px", background: BRAND, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 })}>
            {saving ? "Creating…" : "Create Cycle"}
          </button>
        </div>
      </div>
    </Modal>);

}

/* ── Edit Settings Modal ─────────────────────────────────────────────────── */
function EditSettingsModal({ cycle, onClose, onSaved }) {
  const [form, setForm] = useState({ fy_label: cycle.fy_label || "", deadline: cycle.deadline ? cycle.deadline.slice(0, 10) : "", cycle_type: cycle.cycle_type || "yearly" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const submit = async () => {
    if (!form.fy_label.trim()) {setErr("Name required.");return;}
    setSaving(true);setErr("");
    try {const u = await updateCycleSettings(cycle.cycle_id, form);onSaved(u);onClose();}
    catch (e) {setErr(e?.response?.data?.message || "Save failed.");} finally
    {setSaving(false);}
  };
  return (
    <Modal title="Edit Cycle Settings" onClose={onClose}>
      <div className={cssClass({ display: "flex", flexDirection: "column", gap: 14 })}>
        <div>
          <label className={cssClass({ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 })}>Cycle Name</label>
          <input value={form.fy_label} onChange={(e) => setForm((p) => ({ ...p, fy_label: e.target.value }))} className={cssClass(
            { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, boxSizing: "border-box" })} />
        </div>
        <div>
          <label className={cssClass({ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 })}>Deadline</label>
          <input type="date" value={form.deadline} onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))} className={cssClass(
            { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, boxSizing: "border-box" })} />
        </div>
        <div>
          <label className={cssClass({ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 10 })}>Appraisal Frequency</label>
          <CycleTypePicker value={form.cycle_type} onChange={(v) => setForm((p) => ({ ...p, cycle_type: v }))} />
        </div>
        {err && <p className={cssClass({ color: "#dc2626", fontSize: 13, margin: 0 })}>{err}</p>}
        <div className={cssClass({ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 })}>
          <button onClick={onClose} className={cssClass({ padding: "9px 20px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer" })}>Cancel</button>
          <button onClick={submit} disabled={saving} className={cssClass({ padding: "9px 22px", background: BRAND, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 })}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Modal>);

}

/* ── Disable Confirm Modal ──────────────────────────────────────────────── */
function DisableConfirmModal({ cycle, onClose, onDisabled }) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const confirm = async () => {
    setSaving(true);setErr("");
    try {const u = await disableCycle(cycle.cycle_id);onDisabled(u);onClose();}
    catch (e) {setErr(e?.response?.data?.message || "Failed to disable.");} finally
    {setSaving(false);}
  };
  return (
    <Modal title="Stop Rollout?" onClose={onClose} width={440}>
      <div className={cssClass({ display: "flex", flexDirection: "column", gap: 16 })}>
        <div className={cssClass({ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "14px 16px" })}>
          <div className={cssClass({ fontWeight: 700, color: "#991b1b", marginBottom: 6 })}>⚠ Warning</div>
          <p className={cssClass({ margin: 0, fontSize: 13, color: "#7f1d1d", lineHeight: 1.6 })}>Disabling <strong>{cycle.fy_label}</strong> will:</p>
          <ul className={cssClass({ margin: "8px 0 0", paddingLeft: 20, fontSize: 13, color: "#7f1d1d", lineHeight: 1.8 })}>
            <li>Reset all employee submissions back to <strong>Draft</strong></li>
            <li>Mark the cycle as <strong>Inactive</strong></li>
            <li>Hide it from employees and managers</li>
          </ul>
          <p className={cssClass({ margin: "8px 0 0", fontSize: 13, color: "#7f1d1d" })}>Historical data is preserved. You can re-enable or create a new cycle.</p>
        </div>
        {err && <p className={cssClass({ color: "#dc2626", fontSize: 13, margin: 0 })}>{err}</p>}
        <div className={cssClass({ display: "flex", justifyContent: "flex-end", gap: 10 })}>
          <button onClick={onClose} className={cssClass({ padding: "9px 20px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer" })}>Cancel</button>
          <button onClick={confirm} disabled={saving} className={cssClass({ padding: "9px 22px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 })}>
            <Square size={14} /> {saving ? "Stopping…" : "Stop Rollout"}
          </button>
        </div>
      </div>
    </Modal>);

}

/* ══════════════════════════════════════════════════════════════════════════
   TAB 1 — Appraisal Cycles (accordion list of all cycles)
══════════════════════════════════════════════════════════════════════════ */
function CyclesTab({ cycles, onEdit, onRollout, onDisable, onReEnable, onNew }) {
  const [expandedId, setExpandedId] = useState(() => {
    const active = cycles.find((c) => c.status === "active");
    return active?.cycle_id || null;
  });

  if (cycles.length === 0) {
    return (
      <div className={cssClass({ textAlign: "center", padding: 60, background: "#f8fafc", border: "2px dashed #e2e8f0", borderRadius: 14 })}>
        <AlertCircle size={40} className={cssClass({ color: "#cbd5e1", marginBottom: 12 })} />
        <p className={cssClass({ margin: 0, fontWeight: 700, color: "#64748b", fontSize: 15 })}>No appraisal cycles yet</p>
        <p className={cssClass({ margin: "6px 0 0", color: "#94a3b8", fontSize: 13 })}>Create a cycle to get started.</p>
        <button onClick={onNew} className={cssClass({ marginTop: 16, padding: "10px 22px", background: BRAND, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14 })}>
          Create First Cycle
        </button>
      </div>);

  }

  return (
    <div>
      {cycles.map((cycle) => {
        const isActive = cycle.status === "active";
        const expanded = expandedId === cycle.cycle_id;
        return (
          <div key={cycle.cycle_id} className={cssClass({ border: `1.5px solid ${isActive ? BRAND : "#e2e8f0"}`, borderRadius: 12, overflow: "hidden", boxShadow: isActive ? `0 0 0 3px ${BRAND}22` : "none", marginBottom: 14 })}>
            {/* Header row */}
            <div onClick={() => setExpandedId((p) => p === cycle.cycle_id ? null : cycle.cycle_id)} className={cssClass(
              { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", cursor: "pointer", background: isActive ? "#fff7ed" : "#f8fafc" })}>
              <div className={cssClass({ display: "flex", alignItems: "center", gap: 12 })}>
                {expanded ? <ChevronDown size={16} className={cssClass({ color: "#94a3b8" })} /> : <ChevronRight size={16} className={cssClass({ color: "#94a3b8" })} />}
                <div>
                  <div className={cssClass({ fontWeight: 700, fontSize: 15, color: "#1e293b" })}>{cycle.fy_label}</div>
                  <div className={cssClass({ fontSize: 11, color: "#64748b", marginTop: 2 })}>
                    {cycle.deadline ? `Deadline: ${fmtDate(cycle.deadline)}` : "No deadline"}
                    {cycle.rolled_out_at && ` · Rolled out ${fmtDate(cycle.rolled_out_at)}`}
                    {cycle.rollout_type && ` · ${cycle.rollout_type === "selected" ? "Selected Employees" : "All Employees"}`}
                  </div>
                </div>
              </div>
              <div className={cssClass({ display: "flex", alignItems: "center", gap: 8 })}>
                {cycle.cycle_type && <CycleTypeBadge type={cycle.cycle_type} />}
                <StatusBadge status={cycle.status} />
              </div>
            </div>

            {/* Expanded actions */}
            {expanded &&
            <div className={cssClass({ padding: "16px 18px", borderTop: "1px solid #e2e8f0", background: "#fff" })}>
                <div className={cssClass({ display: "flex", gap: 10, flexWrap: "wrap" })}>
                  <button onClick={() => onEdit(cycle)} className={cssClass({ padding: "7px 16px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#475569", display: "flex", alignItems: "center", gap: 5 })}>
                    <Settings size={13} /> Edit Settings
                  </button>
                  {!isActive &&
                <button onClick={() => onRollout(cycle)} className={cssClass({ padding: "7px 16px", border: "none", borderRadius: 8, background: "#16a34a", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 })}>
                      <Play size={13} /> Roll Out
                    </button>
                }
                  {isActive &&
                <button onClick={() => onDisable(cycle)} className={cssClass({ padding: "7px 16px", border: "none", borderRadius: 8, background: "#dc2626", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 })}>
                      <Square size={13} /> Stop Rollout
                    </button>
                }
                  {!isActive && cycle.disabled_at &&
                <button onClick={() => onReEnable(cycle)} className={cssClass({ padding: "7px 16px", border: `1px solid ${BRAND}`, borderRadius: 8, background: "#fff7ed", color: BRAND, cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 })}>
                      <RotateCcw size={13} /> Re-Enable
                    </button>
                }
                </div>
                <div className={cssClass({ display: "flex", gap: 24, marginTop: 14, flexWrap: "wrap" })}>
                  {[
                { label: "Rollout Type", value: cycle.rollout_type === "selected" ? "Selected Employees" : cycle.rollout_type === "all" ? "All Employees" : null },
                { label: "Rolled Out", value: fmtDate(cycle.rolled_out_at) },
                { label: "Disabled On", value: fmtDate(cycle.disabled_at) }].
                filter((m) => m.value && m.value !== "—").map((m) =>
                <div key={m.label}>
                      <div className={cssClass({ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 })}>{m.label}</div>
                      <div className={cssClass({ fontSize: 13, fontWeight: 600, color: "#1e293b", marginTop: 2 })}>{m.value}</div>
                    </div>
                )}
                </div>
              </div>
            }
          </div>);

      })}
    </div>);

}

/* ══════════════════════════════════════════════════════════════════════════
   TAB 2 — Rollout Settings (split panel: cycle list + inline employee picker)
══════════════════════════════════════════════════════════════════════════ */
function RolloutSettingsTab({ cycles, onCycleUpdated, onDisable, onNew }) {
  const [selectedCycleId, setSelectedCycleId] = useState(() => {
    const active = cycles.find((c) => c.status === "active");
    return (active || cycles[0])?.cycle_id || null;
  });

  const selectedCycle = cycles.find((c) => c.cycle_id === selectedCycleId) || null;

  // Rollout form state
  const [rolloutType, setRolloutType] = useState("all");
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState([]);
  const [empSearch, setEmpSearch] = useState("");
  const [loadingEmps, setLoadingEmps] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // Reset form when cycle changes
  useEffect(() => {
    setRolloutType(selectedCycle?.rollout_type || "all");
    setSelected([]);
    setEmpSearch("");
    setErr("");
  }, [selectedCycleId]);

  // Load employees list when "selected" mode and cycle is not active
  useEffect(() => {
    if (rolloutType !== "selected" || selectedCycle?.status === "active") return;
    setLoadingEmps(true);
    listEmployees({ status: "Active", limit: 500 }).
    then((r) => setEmployees(r.data || r || [])).
    catch(() => {}).
    finally(() => setLoadingEmps(false));
  }, [rolloutType, selectedCycleId, selectedCycle?.status]);

  const filteredEmps = employees.filter((e) =>
  `${e.first_name} ${e.last_name} ${e.emp_code || ""}`.toLowerCase().includes(empSearch.toLowerCase())
  );
  const toggleEmp = (id) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const toggleAll = () => setSelected(selected.length === filteredEmps.length ? [] : filteredEmps.map((e) => e.employee_id));

  const handleRollout = async () => {
    if (rolloutType === "selected" && selected.length === 0) {setErr("Select at least one employee.");return;}
    setSaving(true);setErr("");
    try {
      const u = await rolloutCycle(selectedCycle.cycle_id, {
        rollout_type: rolloutType,
        employee_ids: rolloutType === "selected" ? selected : []
      });
      onCycleUpdated(u);
    } catch (e) {setErr(e?.response?.data?.message || "Rollout failed.");} finally
    {setSaving(false);}
  };

  const isActive = selectedCycle?.status === "active";

  return (
    <div className={cssClass({ display: "flex", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", minHeight: 480 })}>
      {/* Left rail — cycle list */}
      <div className={cssClass({ width: 240, flexShrink: 0, borderRight: "1px solid #e2e8f0" })}>
        <div className={cssClass({ padding: "12px 14px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc" })}>
          <span className={cssClass({ fontWeight: 700, fontSize: 12, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 })}>Cycles</span>
          <button onClick={onNew} className={cssClass({ background: "none", border: "none", cursor: "pointer", color: BRAND, display: "flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 700 })}>
            <Plus size={13} /> New
          </button>
        </div>
        {cycles.length === 0 ?
        <div className={cssClass({ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 12 })}>No cycles yet</div> :
        cycles.map((c) =>
        <button key={c.cycle_id} onClick={() => setSelectedCycleId(c.cycle_id)} className={cssClass({
          width: "100%", textAlign: "left", padding: "12px 14px",
          background: selectedCycleId === c.cycle_id ? "#fff7ed" : "transparent",
          border: "none", borderLeft: `3px solid ${selectedCycleId === c.cycle_id ? BRAND : "transparent"}`,
          borderBottom: "1px solid #f1f5f9", cursor: "pointer"
        })}>
            <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 })}>
              <span className={cssClass({ fontWeight: 700, fontSize: 13, color: selectedCycleId === c.cycle_id ? BRAND : "#1e293b" })}>{c.fy_label}</span>
              <StatusBadge status={c.status} />
            </div>
            {c.deadline && <div className={cssClass({ fontSize: 11, color: "#64748b" })}>Deadline: {fmtDate(c.deadline)}</div>}
          </button>
        )}
      </div>

      {/* Right panel */}
      {!selectedCycle ?
      <div className={cssClass({ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" })}>Select a cycle</div> :

      <div className={cssClass({ flex: 1, minWidth: 0, overflowY: "auto" })}>
          {/* Cycle header */}
          <div className={cssClass({ padding: "16px 22px", borderBottom: "1px solid #e2e8f0", background: "#fafafa", display: "flex", alignItems: "center", gap: 12 })}>
            <div className={cssClass({ flex: 1 })}>
              <div className={cssClass({ fontWeight: 800, fontSize: 16, color: "#1e293b" })}>{selectedCycle.fy_label}</div>
              {selectedCycle.deadline && <div className={cssClass({ fontSize: 12, color: "#64748b", marginTop: 2 })}>Deadline: {fmtDate(selectedCycle.deadline)}</div>}
            </div>
            <div className={cssClass({ display: "flex", alignItems: "center", gap: 8 })}>
              {selectedCycle.cycle_type && <CycleTypeBadge type={selectedCycle.cycle_type} />}
              <StatusBadge status={selectedCycle.status} />
            </div>
          </div>

          <div className={cssClass({ padding: "22px 24px" })}>
            {/* Active cycle banner */}
            {isActive &&
          <div className={cssClass({ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 })}>
                <CheckCircle2 size={16} className={cssClass({ color: "#16a34a", flexShrink: 0 })} />
                <div className={cssClass({ flex: 1 })}>
                  <span className={cssClass({ fontWeight: 700, color: "#166534", fontSize: 13 })}>Cycle is Active</span>
                  <span className={cssClass({ color: "#166534", fontSize: 12, marginLeft: 8 })}>
                    · Rolled out {fmtDate(selectedCycle.rolled_out_at)} · {selectedCycle.rollout_type === "selected" ? "Selected Employees" : "All Employees"}
                  </span>
                </div>
                <button onClick={() => onDisable(selectedCycle)} className={cssClass({ padding: "6px 14px", border: "none", borderRadius: 8, background: "#dc2626", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 })}>
                  <Square size={12} /> Stop Rollout
                </button>
              </div>
          }

            {/* Rollout type selector — only for inactive cycles */}
            {!isActive &&
          <>
                <div className={cssClass({ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 })}>
                  Who should participate?
                </div>
                <div className={cssClass({ display: "flex", gap: 12, marginBottom: 22 })}>
                  {[
              { val: "all", icon: <Users size={18} />, label: "All Active Employees", desc: "Every active employee is enrolled automatically" },
              { val: "selected", icon: <User size={18} />, label: "Selected Employees", desc: "Pick specific employees from the list below" }].
              map((opt) =>
              <button key={opt.val} onClick={() => setRolloutType(opt.val)} className={cssClass({
                flex: 1, padding: "14px 14px", border: `2px solid ${rolloutType === opt.val ? BRAND : "#e2e8f0"}`,
                borderRadius: 10, background: rolloutType === opt.val ? "#fff7ed" : "#f8fafc", cursor: "pointer", textAlign: "left"
              })}>
                      <div className={cssClass({ color: rolloutType === opt.val ? BRAND : "#94a3b8", marginBottom: 4 })}>{opt.icon}</div>
                      <div className={cssClass({ fontWeight: 700, fontSize: 13, color: rolloutType === opt.val ? BRAND : "#1e293b" })}>{opt.label}</div>
                      <div className={cssClass({ fontSize: 11, color: "#64748b", marginTop: 3, lineHeight: 1.4 })}>{opt.desc}</div>
                    </button>
              )}
                </div>

                {/* Employee checkbox list — shown for "selected" mode */}
                {rolloutType === "selected" &&
            <div className={cssClass({ marginBottom: 20 })}>
                    <div className={cssClass({ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 })}>
                      Select Employees
                      {selected.length > 0 && <span className={cssClass({ color: BRAND, fontWeight: 800 })}> ({selected.length} selected)</span>}
                    </div>
                    <div className={cssClass({ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" })}>
                      {/* Search */}
                      <div className={cssClass({ padding: "10px 14px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", alignItems: "center", gap: 8 })}>
                        <Search size={14} className={cssClass({ color: "#94a3b8", flexShrink: 0 })} />
                        <input value={empSearch} onChange={(e) => setEmpSearch(e.target.value)} placeholder="Search by name or employee code…" className={cssClass(
                    { border: "none", outline: "none", fontSize: 13, background: "transparent", flex: 1 })} />
                        {selected.length > 0 &&
                  <button onClick={() => setSelected([])} className={cssClass({ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 11 })}>Clear all</button>
                  }
                      </div>

                      {loadingEmps ?
                <div className={cssClass({ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 })}>Loading employees…</div> :

                <div className={cssClass({ maxHeight: 300, overflowY: "auto" })}>
                          {/* Select all */}
                          <label className={cssClass({ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid #e2e8f0", cursor: "pointer", background: "#f8fafc" })}>
                            <input type="checkbox"
                    checked={filteredEmps.length > 0 && selected.length === filteredEmps.length}
                    onChange={toggleAll} className={cssClass(
                      { accentColor: BRAND, width: 15, height: 15 })} />
                            <span className={cssClass({ fontSize: 12, fontWeight: 700, color: "#475569" })}>Select all ({filteredEmps.length})</span>
                          </label>
                          {filteredEmps.length === 0 ?
                  <div className={cssClass({ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 })}>No employees found.</div> :
                  filteredEmps.map((emp) =>
                  <label key={emp.employee_id} className={cssClass({
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
                    borderBottom: "1px solid #f8fafc", cursor: "pointer",
                    background: selected.includes(emp.employee_id) ? "#fff7ed" : "#fff"
                  })}>
                              <input type="checkbox"
                    checked={selected.includes(emp.employee_id)}
                    onChange={() => toggleEmp(emp.employee_id)} className={cssClass(
                      { accentColor: BRAND, width: 15, height: 15, flexShrink: 0 })} />
                              <div className={cssClass({ flex: 1, minWidth: 0 })}>
                                <div className={cssClass({ fontSize: 13, fontWeight: 600, color: "#1e293b" })}>{emp.first_name} {emp.last_name}</div>
                                <div className={cssClass({ fontSize: 11, color: "#64748b", marginTop: 1 })}>{emp.emp_code} · {emp.emp_job_title || "—"} · {emp.department_name || "—"}</div>
                              </div>
                              {selected.includes(emp.employee_id) && <CheckCircle2 size={14} className={cssClass({ color: BRAND, flexShrink: 0 })} />}
                            </label>
                  )}
                        </div>
                }
                    </div>
                  </div>
            }

                {err && <p className={cssClass({ color: "#dc2626", fontSize: 13, margin: "0 0 12px" })}>{err}</p>}

                <button onClick={handleRollout} disabled={saving} className={cssClass({
              padding: "11px 26px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 9,
              cursor: "pointer", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 7
            })}>
                  <Play size={15} />
                  {saving ? "Rolling out…" : rolloutType === "selected" && selected.length > 0 ?
              `Roll Out to ${selected.length} Employee${selected.length > 1 ? "s" : ""}` :
              "Roll Out to All Employees"}
                </button>

                {selectedCycle.disabled_at &&
            <p className={cssClass({ fontSize: 12, color: "#94a3b8", margin: "12px 0 0" })}>
                    Previously disabled on {fmtDate(selectedCycle.disabled_at)}
                  </p>
            }
              </>
          }
          </div>
        </div>
      }
    </div>);

}

/* ══════════════════════════════════════════════════════════════════════════
   TAB 3 — All Submissions
══════════════════════════════════════════════════════════════════════════ */
function SubmissionsTab({ cycles }) {
  const [cycleId, setCycleId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!cycles.length) return;
    const active = cycles.find((c) => c.status === "active");
    setCycleId((active || cycles[0]).cycle_id);
  }, [cycles]);

  useEffect(() => {
    if (!cycleId) return;
    setLoading(true);
    getAllAppraisals({ cycle_id: cycleId }).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [cycleId]);

  const appraisals = data?.appraisals || [];
  const notSub = data?.notSubmitted || [];
  const all = [...appraisals, ...notSub.map((e) => ({ ...e, appraisal_status: "draft" }))];
  const filtered = all.filter((r) => {
    const nm = (r.employee_name || "").toLowerCase().includes(search.toLowerCase());
    const sm = statusFilter === "all" || (r.appraisal_status || "draft") === statusFilter;
    return nm && sm;
  });
  const counts = {
    all: all.length,
    draft: all.filter((r) => !r.appraisal_status || r.appraisal_status === "draft").length,
    submitted: all.filter((r) => r.appraisal_status === "submitted").length,
    reviewed: all.filter((r) => r.appraisal_status === "reviewed").length
  };

  return (
    <div>
      <div className={cssClass({ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" })}>
        <span className={cssClass({ fontSize: 13, fontWeight: 600, color: "#475569" })}>Cycle:</span>
        {cycles.map((c) =>
        <button key={c.cycle_id} onClick={() => setCycleId(c.cycle_id)} className={cssClass({
          padding: "5px 14px", border: `1.5px solid ${cycleId === c.cycle_id ? BRAND : "#e2e8f0"}`,
          borderRadius: 999, background: cycleId === c.cycle_id ? "#fff7ed" : "#fff",
          color: cycleId === c.cycle_id ? BRAND : "#475569", cursor: "pointer", fontSize: 13, fontWeight: 600
        })}>
            {c.fy_label}
            {c.status === "active" && <span className={cssClass({ marginLeft: 5, fontSize: 10, background: "#16a34a", color: "#fff", borderRadius: 999, padding: "1px 5px" })}>Active</span>}
          </button>
        )}
      </div>

      <div className={cssClass({ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" })}>
        {[
        { key: "all", label: "Total", icon: <Users size={13} /> },
        { key: "draft", label: "Draft / New", icon: <Clock size={13} /> },
        { key: "submitted", label: "Submitted", icon: <CheckCircle2 size={13} /> },
        { key: "reviewed", label: "Reviewed", icon: <CheckCircle2 size={13} className={cssClass({ color: BRAND })} /> }].
        map((s) =>
        <button key={s.key} onClick={() => setStatusFilter(s.key)} className={cssClass({
          display: "flex", alignItems: "center", gap: 5, padding: "6px 14px",
          border: `1.5px solid ${statusFilter === s.key ? BRAND : "#e2e8f0"}`,
          borderRadius: 999, background: statusFilter === s.key ? "#fff7ed" : "#fff",
          color: statusFilter === s.key ? BRAND : "#475569", cursor: "pointer", fontSize: 13, fontWeight: 600
        })}>
            {s.icon} {s.label} <span className={cssClass({ fontWeight: 800 })}>{counts[s.key]}</span>
          </button>
        )}
      </div>

      <div className={cssClass({ position: "relative", marginBottom: 14 })}>
        <Search size={14} className={cssClass({ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" })} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name…" className={cssClass(
          { width: "100%", padding: "9px 12px 9px 34px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, boxSizing: "border-box" })} />
      </div>

      {loading ? <div className={cssClass({ textAlign: "center", padding: 40, color: "#94a3b8" })}>Loading…</div> :
      filtered.length === 0 ? <div className={cssClass({ textAlign: "center", padding: 40, color: "#94a3b8" })}>No appraisals found.</div> :

      <div className={cssClass({ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" })}>
          <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 13 })}>
            <thead>
              <tr className={cssClass({ background: "#f8fafc" })}>
                {["Employee", "Designation", "Department", "Status", "Submitted", "Manager", "Mgr Rated"].map((h) =>
              <th key={h} className={cssClass({ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#475569", fontSize: 11, textTransform: "uppercase", borderBottom: "1px solid #e2e8f0" })}>{h}</th>
              )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) =>
            <tr key={i} className={cssClass({ borderBottom: "1px solid #f1f5f9" })}>
                  <td className={cssClass({ padding: "9px 12px", fontWeight: 600, color: "#1e293b" })}>
                    {row.employee_name || `${row.first_name || ""} ${row.last_name || ""}`.trim()}
                    <div className={cssClass({ fontSize: 11, color: "#64748b", fontWeight: 400 })}>{row.emp_code || ""}</div>
                  </td>
                  <td className={cssClass({ padding: "9px 12px", color: "#475569" })}>{row.emp_job_title || "—"}</td>
                  <td className={cssClass({ padding: "9px 12px", color: "#475569" })}>{row.department_name || "—"}</td>
                  <td className={cssClass({ padding: "9px 12px" })}><AppraisalBadge status={row.appraisal_status || "draft"} /></td>
                  <td className={cssClass({ padding: "9px 12px", color: "#475569" })}>{fmtDate(row.submitted_at)}</td>
                  <td className={cssClass({ padding: "9px 12px", color: "#475569" })}>{row.manager_name || "—"}</td>
                  <td className={cssClass({ padding: "9px 12px" })}>
                    {row.manager_rated_at ?
                <span className={cssClass({ color: "#16a34a", fontWeight: 600 })}>✓ {fmtDate(row.manager_rated_at)}</span> :
                <span className={cssClass({ color: "#94a3b8" })}>—</span>}
                  </td>
                </tr>
            )}
            </tbody>
          </table>
        </div>
      }
    </div>);

}

/* ══════════════════════════════════════════════════════════════════════════
   TAB 4 — Enrollment
══════════════════════════════════════════════════════════════════════════ */
function EnrollmentTab({ cycles }) {
  const [cycleId, setCycleId] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [allEmps, setAllEmps] = useState([]);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerSel, setPickerSel] = useState([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!cycles.length) return;
    const active = cycles.find((c) => c.status === "active");
    setCycleId((active || cycles[0]).cycle_id);
  }, [cycles]);

  const fetchEnr = useCallback(async (id) => {
    setLoading(true);
    try {setEnrollments((await getEnrollments(id)) || []);}
    catch {setEnrollments([]);} finally
    {setLoading(false);}
  }, []);

  useEffect(() => {if (cycleId) fetchEnr(cycleId);}, [cycleId, fetchEnr]);

  const filteredEnr = enrollments.filter((e) =>
  `${e.employee_name} ${e.emp_code || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const openPicker = async () => {
    setShowPicker(true);
    const r = await listEmployees({ status: "Active", limit: 500 }).catch(() => ({ data: [] }));
    const ids = new Set(enrollments.map((e) => e.employee_id));
    setAllEmps((r.data || r || []).filter((e) => !ids.has(e.employee_id)));
  };

  const filteredPicker = allEmps.filter((e) =>
  `${e.first_name} ${e.last_name} ${e.emp_code || ""}`.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  const handleAdd = async () => {
    if (!pickerSel.length) return;
    setAdding(true);
    try {await enrollEmployees(cycleId, pickerSel);setShowPicker(false);setPickerSel([]);fetchEnr(cycleId);}
    catch {} finally {setAdding(false);}
  };

  const handleRemove = async (empId) => {
    if (!window.confirm("Remove this employee from the cycle?")) return;
    await unenrollEmployee(empId, cycleId);
    fetchEnr(cycleId);
  };

  return (
    <div>
      <div className={cssClass({ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" })}>
        <span className={cssClass({ fontSize: 13, fontWeight: 600, color: "#475569" })}>Cycle:</span>
        {cycles.map((c) =>
        <button key={c.cycle_id} onClick={() => setCycleId(c.cycle_id)} className={cssClass({
          padding: "5px 14px", border: `1.5px solid ${cycleId === c.cycle_id ? BRAND : "#e2e8f0"}`,
          borderRadius: 999, background: cycleId === c.cycle_id ? "#fff7ed" : "#fff",
          color: cycleId === c.cycle_id ? BRAND : "#475569", cursor: "pointer", fontSize: 13, fontWeight: 600
        })}>
            {c.fy_label}
            {c.status === "active" && <span className={cssClass({ marginLeft: 5, fontSize: 10, background: "#16a34a", color: "#fff", borderRadius: 999, padding: "1px 5px" })}>Active</span>}
          </button>
        )}
      </div>

      <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12 })}>
        <div className={cssClass({ position: "relative", flex: 1, maxWidth: 340 })}>
          <Search size={14} className={cssClass({ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" })} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search enrolled employees…" className={cssClass(
            { width: "100%", padding: "9px 12px 9px 34px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, boxSizing: "border-box" })} />
        </div>
        <button onClick={openPicker} className={cssClass({ padding: "9px 16px", background: BRAND, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 })}>
          <Plus size={13} /> Add Employee
        </button>
      </div>

      {loading ? <div className={cssClass({ textAlign: "center", padding: 30, color: "#94a3b8" })}>Loading…</div> :
      <div className={cssClass({ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" })}>
          <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 13 })}>
            <thead>
              <tr className={cssClass({ background: "#f8fafc" })}>
                {["Employee", "Designation", "Department", "Manager", "Status", "Enrolled On", ""].map((h) =>
              <th key={h} className={cssClass({ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#475569", fontSize: 11, textTransform: "uppercase", borderBottom: "1px solid #e2e8f0" })}>{h}</th>
              )}
              </tr>
            </thead>
            <tbody>
              {filteredEnr.map((row, i) =>
            <tr key={i} className={cssClass({ borderBottom: "1px solid #f1f5f9" })}>
                  <td className={cssClass({ padding: "9px 12px", fontWeight: 600, color: "#1e293b" })}>
                    {row.employee_name}
                    <div className={cssClass({ fontSize: 11, color: "#64748b", fontWeight: 400 })}>{row.emp_code}</div>
                  </td>
                  <td className={cssClass({ padding: "9px 12px", color: "#475569" })}>{row.emp_job_title || "—"}</td>
                  <td className={cssClass({ padding: "9px 12px", color: "#475569" })}>{row.department_name || "—"}</td>
                  <td className={cssClass({ padding: "9px 12px", color: "#475569" })}>{row.manager_name || "—"}</td>
                  <td className={cssClass({ padding: "9px 12px" })}><AppraisalBadge status={row.appraisal_status || "draft"} /></td>
                  <td className={cssClass({ padding: "9px 12px", color: "#475569" })}>{fmtDate(row.enrolled_at)}</td>
                  <td className={cssClass({ padding: "9px 12px" })}>
                    <button onClick={() => handleRemove(row.employee_id)} className={cssClass({ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: 4 })}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
            )}
              {filteredEnr.length === 0 &&
            <tr><td colSpan={7} className={cssClass({ padding: 28, textAlign: "center", color: "#94a3b8" })}>No enrollments found.</td></tr>
            }
            </tbody>
          </table>
        </div>
      }

      {showPicker &&
      <Modal title="Add Employees to Cycle" onClose={() => setShowPicker(false)} width={480}>
          <div className={cssClass({ display: "flex", flexDirection: "column", gap: 12 })}>
            <div className={cssClass({ position: "relative" })}>
              <Search size={14} className={cssClass({ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" })} />
              <input value={pickerSearch} onChange={(e) => setPickerSearch(e.target.value)} placeholder="Search…" className={cssClass(
              { width: "100%", padding: "9px 12px 9px 34px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, boxSizing: "border-box" })} />
            </div>
            <div className={cssClass({ border: "1px solid #e2e8f0", borderRadius: 8, maxHeight: 260, overflowY: "auto" })}>
              {filteredPicker.map((emp) =>
            <label key={emp.employee_id} className={cssClass({ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderBottom: "1px solid #f8fafc", cursor: "pointer", background: pickerSel.includes(emp.employee_id) ? "#fff7ed" : "#fff" })}>
                  <input type="checkbox" checked={pickerSel.includes(emp.employee_id)}
              onChange={() => setPickerSel((p) => p.includes(emp.employee_id) ? p.filter((x) => x !== emp.employee_id) : [...p, emp.employee_id])} className={cssClass(
                { accentColor: BRAND })} />
                  <div>
                    <div className={cssClass({ fontSize: 13, fontWeight: 600, color: "#1e293b" })}>{emp.first_name} {emp.last_name}</div>
                    <div className={cssClass({ fontSize: 11, color: "#64748b" })}>{emp.emp_code} · {emp.emp_job_title || "—"}</div>
                  </div>
                </label>
            )}
              {filteredPicker.length === 0 && <div className={cssClass({ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 13 })}>No employees to add.</div>}
            </div>
            <div className={cssClass({ display: "flex", justifyContent: "flex-end", gap: 10 })}>
              <button onClick={() => setShowPicker(false)} className={cssClass({ padding: "8px 18px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13 })}>Cancel</button>
              <button onClick={handleAdd} disabled={!pickerSel.length || adding} className={cssClass({ padding: "8px 18px", background: BRAND, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 })}>
                {adding ? "Adding…" : `Add ${pickerSel.length || ""}`}
              </button>
            </div>
          </div>
        </Modal>
      }
    </div>);

}

/* ══════════════════════════════════════════════════════════════════════════
   Main component
══════════════════════════════════════════════════════════════════════════ */
export default function AdminPerformanceRollout() {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("cycles");
  const [showCreate, setShowCreate] = useState(false);
  const [editCycle, setEditCycle] = useState(null);
  const [disableData, setDisableData] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {setCycles((await getAllAppraisalCycles()) || []);}
    catch {} finally
    {setLoading(false);}
  }, []);

  useEffect(() => {load();}, [load]);

  const updateInList = (u) => setCycles((p) => p.map((c) => c.cycle_id === u.cycle_id ? u : c));
  const handleCreated = (c) => {setCycles((p) => [c, ...p]);setTab("cycles");};
  const activeCycle = cycles.find((c) => c.status === "active");

  const TABS = [
  { id: "cycles", label: "Appraisal Cycles" },
  { id: "rollout", label: "Rollout Settings" },
  { id: "submissions", label: "All Submissions" },
  { id: "enrollment", label: "Enrollment" }];


  return (
    <div className={cssClass({ padding: "28px 32px", maxWidth: 1080, margin: "0 auto" })}>
      {/* Page header */}
      <div className={cssClass({ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 })}>
        <div>
          <h1 className={cssClass({ margin: 0, fontSize: 22, fontWeight: 800, color: "#1e293b" })}>Performance Appraisal</h1>
          <p className={cssClass({ margin: "4px 0 0", color: "#64748b", fontSize: 14 })}>Manage appraisal cycles, configure rollout, and view submissions.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className={cssClass({ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", background: BRAND, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14 })}>
          <Plus size={15} /> New Cycle
        </button>
      </div>

      {/* Rollout status banner — always visible */}
      {activeCycle ?
      <div className={cssClass({ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12, padding: "14px 18px", marginBottom: 22, display: "flex", alignItems: "center", gap: 12 })}>
          <CheckCircle2 size={18} className={cssClass({ color: "#16a34a", flexShrink: 0 })} />
          <div className={cssClass({ flex: 1 })}>
            <div className={cssClass({ fontWeight: 700, color: "#166534", fontSize: 14, marginBottom: 2 })}>
              🟢 Rollout Active — {activeCycle.fy_label}
            </div>
            <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" })}>
              {activeCycle.cycle_type && <CycleTypeBadge type={activeCycle.cycle_type} />}
              {activeCycle.deadline && <span className={cssClass({ color: "#166534", fontSize: 12 })}>Deadline: {fmtDate(activeCycle.deadline)}</span>}
              <span className={cssClass({ color: "#166534", fontSize: 12 })}>· {activeCycle.rollout_type === "selected" ? "Selected Employees" : "All Employees"}</span>
              {activeCycle.rolled_out_at && <span className={cssClass({ color: "#166534", fontSize: 12 })}>· Rolled out {fmtDate(activeCycle.rolled_out_at)}</span>}
            </div>
          </div>
          <button onClick={() => setDisableData(activeCycle)} className={cssClass({ padding: "8px 16px", border: "none", borderRadius: 8, background: "#dc2626", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 })}>
            <Square size={13} /> Stop Rollout
          </button>
        </div> :

      <div className={cssClass({ background: "#fafafa", border: "1.5px dashed #e2e8f0", borderRadius: 12, padding: "12px 18px", marginBottom: 22, display: "flex", alignItems: "center", gap: 12 })}>
          <AlertCircle size={18} className={cssClass({ color: "#94a3b8", flexShrink: 0 })} />
          <div className={cssClass({ flex: 1 })}>
            <span className={cssClass({ fontWeight: 600, color: "#64748b", fontSize: 13 })}>No Active Rollout</span>
            <span className={cssClass({ color: "#94a3b8", fontSize: 12, marginLeft: 8 })}>· Appraisal tab is hidden from all employees and managers</span>
          </div>
          <button onClick={() => setTab("rollout")} className={cssClass({ padding: "6px 14px", border: `1px solid ${BRAND}`, borderRadius: 8, background: "#fff7ed", color: BRAND, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 })}>
            <Play size={12} /> Start Rollout
          </button>
        </div>
      }

      {/* Tabs */}
      <div className={cssClass({ display: "flex", gap: 2, borderBottom: "2px solid #e2e8f0", marginBottom: 24 })}>
        {TABS.map((t) =>
        <button key={t.id} onClick={() => setTab(t.id)} className={cssClass({
          padding: "10px 18px", border: "none", background: "none", cursor: "pointer",
          fontWeight: 700, fontSize: 14, color: tab === t.id ? BRAND : "#64748b",
          borderBottom: tab === t.id ? `2.5px solid ${BRAND}` : "2.5px solid transparent", marginBottom: -2
        })}>{t.label}</button>
        )}
      </div>

      {/* Tab content */}
      {loading && (tab === "cycles" || tab === "rollout") ?
      <div className={cssClass({ textAlign: "center", padding: 60, color: "#94a3b8" })}>Loading…</div> :

      <>
          {tab === "cycles" &&
        <CyclesTab
          cycles={cycles}
          onEdit={setEditCycle}
          onRollout={(c) => {setTab("rollout");}}
          onDisable={setDisableData}
          onReEnable={(c) => {setTab("rollout");}}
          onNew={() => setShowCreate(true)} />

        }
          {tab === "rollout" &&
        <RolloutSettingsTab
          cycles={cycles}
          onCycleUpdated={updateInList}
          onDisable={setDisableData}
          onNew={() => setShowCreate(true)} />

        }
          {tab === "submissions" && <SubmissionsTab cycles={cycles} />}
          {tab === "enrollment" && <EnrollmentTab cycles={cycles} />}
        </>
      }

      {/* Modals */}
      {showCreate && <CreateCycleModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
      {editCycle && <EditSettingsModal cycle={editCycle} onClose={() => setEditCycle(null)} onSaved={(u) => {updateInList(u);setEditCycle(null);}} />}
      {disableData && <DisableConfirmModal cycle={disableData} onClose={() => setDisableData(null)} onDisabled={(u) => {updateInList(u);setDisableData(null);}} />}
    </div>);

}
