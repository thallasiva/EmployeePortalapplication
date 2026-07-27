import React, { useState, useEffect } from "react";
import { Plus, Play, Square, Users, User, CheckCircle2, Search } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { rolloutCycle } from "../../../../api/appraisal.api";
import { listEmployees } from "../../../../api/employee.api";
import { BRAND } from "../constants";
import { fmtDate } from "../utils/dateUtils";
import { CycleTypeBadge, StatusBadge } from "./Badges";

const RolloutSettingsTab = React.memo(function RolloutSettingsTab({ cycles, onCycleUpdated, onDisable, onNew }) {
  const [selectedCycleId, setSelectedCycleId] = useState(() => {
    const active = cycles.find((c) => c.status === "active");
    return (active || cycles[0])?.cycle_id || null;
  });
  const selectedCycle = cycles.find((c) => c.cycle_id === selectedCycleId) || null;
  const [rolloutType, setRolloutType] = useState("all");
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState([]);
  const [empSearch, setEmpSearch] = useState("");
  const [loadingEmps, setLoadingEmps] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setRolloutType(selectedCycle?.rollout_type || "all");
    setSelected([]);
    setEmpSearch("");
    setErr("");
  }, [selectedCycleId]);

  useEffect(() => {
    if (rolloutType !== "selected" || selectedCycle?.status === "active") return;
    setLoadingEmps(true);
    listEmployees({ status: "Active", limit: 500 })
      .then((r) => setEmployees(r.data || r || []))
      .catch(() => {})
      .finally(() => setLoadingEmps(false));
  }, [rolloutType, selectedCycleId, selectedCycle?.status]);

  const filteredEmps = employees.filter((e) =>
    `${e.first_name} ${e.last_name} ${e.emp_code || ""}`.toLowerCase().includes(empSearch.toLowerCase())
  );
  const toggleEmp = (id) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const toggleAll = () => setSelected(selected.length === filteredEmps.length ? [] : filteredEmps.map((e) => e.employee_id));

  const handleRollout = async () => {
    if (rolloutType === "selected" && selected.length === 0) { setErr("Select at least one employee."); return; }
    setSaving(true); setErr("");
    try {
      const u = await rolloutCycle(selectedCycle.cycle_id, {
        rollout_type: rolloutType,
        employee_ids: rolloutType === "selected" ? selected : []
      });
      onCycleUpdated(u);
    } catch (e) { setErr(e?.response?.data?.message || "Rollout failed."); }
    finally { setSaving(false); }
  };

  const isActive = selectedCycle?.status === "active";

  return (
    <div className={cssClass({ display: "flex", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", minHeight: 480 })}>
      {/* Cycle list sidebar */}
      <div className={cssClass({ width: 240, flexShrink: 0, borderRight: "1px solid #e2e8f0" })}>
        <div className={cssClass({ padding: "12px 14px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc" })}>
          <span className={cssClass({ fontWeight: 700, fontSize: 12, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 })}>Cycles</span>
          <button onClick={onNew} className={cssClass({ background: "none", border: "none", cursor: "pointer", color: BRAND, display: "flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 700 })}>
            <Plus size={13} /> New
          </button>
        </div>
        {cycles.length === 0
          ? <div className={cssClass({ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 12 })}>No cycles yet</div>
          : cycles.map((c) => (
            <button key={c.cycle_id} onClick={() => setSelectedCycleId(c.cycle_id)}
              className={cssClass({ width: "100%", textAlign: "left", padding: "12px 14px", background: selectedCycleId === c.cycle_id ? "#fff7ed" : "transparent", border: "none", borderLeft: `3px solid ${selectedCycleId === c.cycle_id ? BRAND : "transparent"}`, borderBottom: "1px solid #f1f5f9", cursor: "pointer" })}>
              <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 })}>
                <span className={cssClass({ fontWeight: 700, fontSize: 13, color: selectedCycleId === c.cycle_id ? BRAND : "#1e293b" })}>{c.fy_label}</span>
                <StatusBadge status={c.status} />
              </div>
              {c.deadline && <div className={cssClass({ fontSize: 11, color: "#64748b" })}>Deadline: {fmtDate(c.deadline)}</div>}
            </button>
          ))
        }
      </div>

      {/* Cycle detail panel */}
      {!selectedCycle
        ? <div className={cssClass({ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" })}>Select a cycle</div>
        : (
          <div className={cssClass({ flex: 1, minWidth: 0, overflowY: "auto" })}>
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
              {isActive && (
                <div className={cssClass({ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 })}>
                  <CheckCircle2 size={16} className={cssClass({ color: "#16a34a", flexShrink: 0 })} />
                  <div className={cssClass({ flex: 1 })}>
                    <span className={cssClass({ fontWeight: 700, color: "#166534", fontSize: 13 })}>Cycle is Active</span>
                    <span className={cssClass({ color: "#166534", fontSize: 12, marginLeft: 8 })}>
                      · Rolled out {fmtDate(selectedCycle.rolled_out_at)} · {selectedCycle.rollout_type === "selected" ? "Selected Employees" : "All Employees"}
                    </span>
                  </div>
                  <button onClick={() => onDisable(selectedCycle)}
                    className={cssClass({ padding: "6px 14px", border: "none", borderRadius: 8, background: "#dc2626", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 })}>
                    <Square size={12} /> Stop Rollout
                  </button>
                </div>
              )}

              {!isActive && (
                <>
                  <div className={cssClass({ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 })}>
                    Who should participate?
                  </div>
                  <div className={cssClass({ display: "flex", gap: 12, marginBottom: 22 })}>
                    {[
                      { val: "all", icon: <Users size={18} />, label: "All Active Employees", desc: "Every active employee is enrolled automatically" },
                      { val: "selected", icon: <User size={18} />, label: "Selected Employees", desc: "Pick specific employees from the list below" }
                    ].map((opt) => (
                      <button key={opt.val} onClick={() => setRolloutType(opt.val)}
                        className={cssClass({ flex: 1, padding: "14px 14px", border: `2px solid ${rolloutType === opt.val ? BRAND : "#e2e8f0"}`, borderRadius: 10, background: rolloutType === opt.val ? "#fff7ed" : "#f8fafc", cursor: "pointer", textAlign: "left" })}>
                        <div className={cssClass({ color: rolloutType === opt.val ? BRAND : "#94a3b8", marginBottom: 4 })}>{opt.icon}</div>
                        <div className={cssClass({ fontWeight: 700, fontSize: 13, color: rolloutType === opt.val ? BRAND : "#1e293b" })}>{opt.label}</div>
                        <div className={cssClass({ fontSize: 11, color: "#64748b", marginTop: 3, lineHeight: 1.4 })}>{opt.desc}</div>
                      </button>
                    ))}
                  </div>

                  {rolloutType === "selected" && (
                    <div className={cssClass({ marginBottom: 20 })}>
                      <div className={cssClass({ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 })}>
                        Select Employees
                        {selected.length > 0 && <span className={cssClass({ color: BRAND, fontWeight: 800 })}> ({selected.length} selected)</span>}
                      </div>
                      <div className={cssClass({ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" })}>
                        <div className={cssClass({ padding: "10px 14px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", alignItems: "center", gap: 8 })}>
                          <Search size={14} className={cssClass({ color: "#94a3b8", flexShrink: 0 })} />
                          <input value={empSearch} onChange={(e) => setEmpSearch(e.target.value)}
                            placeholder="Search by name or employee code…"
                            className={cssClass({ border: "none", outline: "none", fontSize: 13, background: "transparent", flex: 1 })} />
                          {selected.length > 0 && (
                            <button onClick={() => setSelected([])}
                              className={cssClass({ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 11 })}>Clear all</button>
                          )}
                        </div>
                        {loadingEmps
                          ? <div className={cssClass({ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 })}>Loading employees…</div>
                          : (
                            <div className={cssClass({ maxHeight: 300, overflowY: "auto" })}>
                              <label className={cssClass({ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid #e2e8f0", cursor: "pointer", background: "#f8fafc" })}>
                                <input type="checkbox" checked={filteredEmps.length > 0 && selected.length === filteredEmps.length}
                                  onChange={toggleAll} className={cssClass({ accentColor: BRAND, width: 15, height: 15 })} />
                                <span className={cssClass({ fontSize: 12, fontWeight: 700, color: "#475569" })}>Select all ({filteredEmps.length})</span>
                              </label>
                              {filteredEmps.length === 0
                                ? <div className={cssClass({ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 })}>No employees found.</div>
                                : filteredEmps.map((emp) => (
                                  <label key={emp.employee_id}
                                    className={cssClass({ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid #f8fafc", cursor: "pointer", background: selected.includes(emp.employee_id) ? "#fff7ed" : "#fff" })}>
                                    <input type="checkbox" checked={selected.includes(emp.employee_id)}
                                      onChange={() => toggleEmp(emp.employee_id)} className={cssClass({ accentColor: BRAND, width: 15, height: 15, flexShrink: 0 })} />
                                    <div className={cssClass({ flex: 1, minWidth: 0 })}>
                                      <div className={cssClass({ fontSize: 13, fontWeight: 600, color: "#1e293b" })}>{emp.first_name} {emp.last_name}</div>
                                      <div className={cssClass({ fontSize: 11, color: "#64748b", marginTop: 1 })}>{emp.emp_code} · {emp.emp_job_title || "—"} · {emp.department_name || "—"}</div>
                                    </div>
                                    {selected.includes(emp.employee_id) && <CheckCircle2 size={14} className={cssClass({ color: BRAND, flexShrink: 0 })} />}
                                  </label>
                                ))
                              }
                            </div>
                          )
                        }
                      </div>
                    </div>
                  )}

                  {err && <p className={cssClass({ color: "#dc2626", fontSize: 13, margin: "0 0 12px" })}>{err}</p>}
                  <button onClick={handleRollout} disabled={saving}
                    className={cssClass({ padding: "11px 26px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 7 })}>
                    <Play size={15} />
                    {saving ? "Rolling out…" : rolloutType === "selected" && selected.length > 0
                      ? `Roll Out to ${selected.length} Employee${selected.length > 1 ? "s" : ""}`
                      : "Roll Out to All Employees"}
                  </button>
                  {selectedCycle.disabled_at && (
                    <p className={cssClass({ fontSize: 12, color: "#94a3b8", margin: "12px 0 0" })}>
                      Previously disabled on {fmtDate(selectedCycle.disabled_at)}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )
      }
    </div>
  );
});

export default RolloutSettingsTab;
