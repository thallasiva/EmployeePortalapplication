import React, { useEffect, useState, useCallback } from "react";
import {
  Plus, ChevronDown, ChevronRight, Play, Square, Users, User,
  CheckCircle2, Clock, AlertCircle, RotateCcw, Search, X, Trash2,
} from "lucide-react";
import {
  getAllAppraisalCycles, createAppraisalCycle, updateCycleSettings,
  rolloutCycle, disableCycle,
  getAllAppraisals, getEnrollments, enrollEmployees, unenrollEmployee,
} from "../../api/appraisal.api";
import { listEmployees } from "../../api/employee.api";

const BRAND = "#f18200";

function fmtDate(v) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
}

function StatusBadge({ status }) {
  const map = {
    active:   { bg: "#dcfce7", color: "#166534", label: "Active" },
    inactive: { bg: "#f1f5f9", color: "#64748b", label: "Inactive" },
  };
  const s = map[status] || map.inactive;
  return (
    <span style={{ background:s.bg, color:s.color, borderRadius:999, padding:"2px 10px", fontSize:11, fontWeight:700 }}>
      {s.label}
    </span>
  );
}

function AppraisalBadge({ status }) {
  const map = {
    draft:     { bg:"#fef9c3", color:"#92400e", label:"Draft" },
    submitted: { bg:"#dcfce7", color:"#166534", label:"Submitted" },
    reviewed:  { bg:"#dbeafe", color:"#1e40af", label:"Reviewed" },
  };
  const s = map[status] || { bg:"#f1f5f9", color:"#64748b", label:"New" };
  return <span style={{ background:s.bg, color:s.color, borderRadius:999, padding:"2px 10px", fontSize:11, fontWeight:700 }}>{s.label}</span>;
}

function Modal({ title, onClose, children, width=480 }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#fff", borderRadius:12, width, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 22px", borderBottom:"1px solid #e2e8f0" }}>
          <span style={{ fontWeight:700, fontSize:16 }}>{title}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"#64748b" }}><X size={18} /></button>
        </div>
        <div style={{ padding:22 }}>{children}</div>
      </div>
    </div>
  );
}

function CreateCycleModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ fy_label:"", deadline:"" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const submit = async () => {
    if (!form.fy_label.trim()) { setErr("Cycle name is required."); return; }
    setSaving(true); setErr("");
    try { const c = await createAppraisalCycle(form); onCreated(c); onClose(); }
    catch(e) { setErr(e?.response?.data?.message || "Failed to create cycle."); }
    finally { setSaving(false); }
  };
  return (
    <Modal title="Create New Appraisal Cycle" onClose={onClose}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div>
          <label style={{ fontSize:12, fontWeight:600, color:"#475569", display:"block", marginBottom:4 }}>Cycle Name *</label>
          <input value={form.fy_label} onChange={e=>setForm(p=>({...p,fy_label:e.target.value}))} placeholder="e.g. 2026 Performance Appraisal"
            style={{ width:"100%", padding:"9px 12px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:14, boxSizing:"border-box" }} />
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:600, color:"#475569", display:"block", marginBottom:4 }}>Submission Deadline</label>
          <input type="date" value={form.deadline} onChange={e=>setForm(p=>({...p,deadline:e.target.value}))}
            style={{ width:"100%", padding:"9px 12px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:14, boxSizing:"border-box" }} />
        </div>
        {err && <p style={{ color:"#dc2626", fontSize:13, margin:0 }}>{err}</p>}
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:4 }}>
          <button onClick={onClose} style={{ padding:"9px 20px", border:"1px solid #e2e8f0", borderRadius:8, background:"#fff", cursor:"pointer" }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ padding:"9px 22px", background:BRAND, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600 }}>
            {saving?"Creating…":"Create Cycle"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function EditSettingsModal({ cycle, onClose, onSaved }) {
  const [form, setForm] = useState({ fy_label:cycle.fy_label||"", deadline:cycle.deadline?cycle.deadline.slice(0,10):"" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const submit = async () => {
    if (!form.fy_label.trim()) { setErr("Name required."); return; }
    setSaving(true); setErr("");
    try { const u = await updateCycleSettings(cycle.cycle_id, form); onSaved(u); onClose(); }
    catch(e) { setErr(e?.response?.data?.message || "Save failed."); }
    finally { setSaving(false); }
  };
  return (
    <Modal title="Edit Cycle Settings" onClose={onClose}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div>
          <label style={{ fontSize:12, fontWeight:600, color:"#475569", display:"block", marginBottom:4 }}>Cycle Name</label>
          <input value={form.fy_label} onChange={e=>setForm(p=>({...p,fy_label:e.target.value}))}
            style={{ width:"100%", padding:"9px 12px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:14, boxSizing:"border-box" }} />
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:600, color:"#475569", display:"block", marginBottom:4 }}>Deadline</label>
          <input type="date" value={form.deadline} onChange={e=>setForm(p=>({...p,deadline:e.target.value}))}
            style={{ width:"100%", padding:"9px 12px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:14, boxSizing:"border-box" }} />
        </div>
        {err && <p style={{ color:"#dc2626", fontSize:13, margin:0 }}>{err}</p>}
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:4 }}>
          <button onClick={onClose} style={{ padding:"9px 20px", border:"1px solid #e2e8f0", borderRadius:8, background:"#fff", cursor:"pointer" }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ padding:"9px 22px", background:BRAND, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600 }}>
            {saving?"Saving…":"Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function RolloutModal({ cycle, onClose, onRolledOut }) {
  const [rolloutType, setRolloutType] = useState("all");
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState([]);
  const [empSearch, setEmpSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (rolloutType === "selected") {
      setLoading(true);
      listEmployees({ status:"Active", limit:500 })
        .then(r => setEmployees(r.data || r || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [rolloutType]);

  const filteredEmps = employees.filter(e =>
    `${e.first_name} ${e.last_name} ${e.emp_code||""}`.toLowerCase().includes(empSearch.toLowerCase())
  );
  const toggleEmp = id => setSelected(p => p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const toggleAll = () => setSelected(selected.length===filteredEmps.length ? [] : filteredEmps.map(e=>e.employee_id));

  const submit = async () => {
    if (rolloutType==="selected" && selected.length===0) { setErr("Select at least one employee."); return; }
    setSaving(true); setErr("");
    try {
      const u = await rolloutCycle(cycle.cycle_id, { rollout_type:rolloutType, employee_ids:rolloutType==="selected"?selected:[] });
      onRolledOut(u); onClose();
    } catch(e) { setErr(e?.response?.data?.message||"Rollout failed."); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={`Roll Out — ${cycle.fy_label}`} onClose={onClose} width={560}>
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <p style={{ margin:0, color:"#475569", fontSize:13 }}>Choose who should participate in this appraisal cycle.</p>
        <div style={{ display:"flex", gap:12 }}>
          {[
            { val:"all", icon:<Users size={18}/>, label:"All Active Employees", desc:"Enroll every current active employee" },
            { val:"selected", icon:<User size={18}/>, label:"Selected Employees", desc:"Choose specific employees manually" },
          ].map(opt => (
            <button key={opt.val} onClick={()=>setRolloutType(opt.val)} style={{
              flex:1, padding:"14px 12px", border:`2px solid ${rolloutType===opt.val?BRAND:"#e2e8f0"}`,
              borderRadius:10, background:rolloutType===opt.val?"#fff7ed":"#fff", cursor:"pointer", textAlign:"left",
            }}>
              <div style={{ color:rolloutType===opt.val?BRAND:"#475569", marginBottom:4 }}>{opt.icon}</div>
              <div style={{ fontWeight:700, fontSize:13, color:rolloutType===opt.val?BRAND:"#1e293b" }}>{opt.label}</div>
              <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>{opt.desc}</div>
            </button>
          ))}
        </div>

        {rolloutType==="selected" && (
          <div style={{ border:"1px solid #e2e8f0", borderRadius:10, overflow:"hidden" }}>
            <div style={{ padding:"10px 12px", borderBottom:"1px solid #e2e8f0", background:"#f8fafc", display:"flex", alignItems:"center", gap:8 }}>
              <Search size={14} style={{ color:"#94a3b8" }}/>
              <input value={empSearch} onChange={e=>setEmpSearch(e.target.value)} placeholder="Search…"
                style={{ border:"none", outline:"none", fontSize:13, background:"transparent", flex:1 }}/>
              {selected.length>0 && <span style={{ fontSize:11, fontWeight:600, color:BRAND }}>{selected.length} selected</span>}
            </div>
            {loading ? (
              <div style={{ padding:20, textAlign:"center", color:"#94a3b8", fontSize:13 }}>Loading…</div>
            ) : (
              <div style={{ maxHeight:220, overflowY:"auto" }}>
                <label style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 14px", borderBottom:"1px solid #f1f5f9", cursor:"pointer", background:"#f8fafc", fontSize:12, fontWeight:600, color:"#475569" }}>
                  <input type="checkbox" checked={filteredEmps.length>0&&selected.length===filteredEmps.length} onChange={toggleAll} style={{ accentColor:BRAND }}/>
                  Select all ({filteredEmps.length})
                </label>
                {filteredEmps.map(emp => (
                  <label key={emp.employee_id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 14px", borderBottom:"1px solid #f8fafc", cursor:"pointer", background:selected.includes(emp.employee_id)?"#fff7ed":"#fff" }}>
                    <input type="checkbox" checked={selected.includes(emp.employee_id)} onChange={()=>toggleEmp(emp.employee_id)} style={{ accentColor:BRAND }}/>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:"#1e293b" }}>{emp.first_name} {emp.last_name}</div>
                      <div style={{ fontSize:11, color:"#64748b" }}>{emp.emp_code} · {emp.emp_job_title||"—"}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {err && <p style={{ color:"#dc2626", fontSize:13, margin:0 }}>{err}</p>}
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:4 }}>
          <button onClick={onClose} style={{ padding:"9px 20px", border:"1px solid #e2e8f0", borderRadius:8, background:"#fff", cursor:"pointer" }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ padding:"9px 22px", background:"#16a34a", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
            <Play size={14}/> {saving?"Rolling out…":"Roll Out"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function DisableConfirmModal({ cycle, onClose, onDisabled }) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const confirm = async () => {
    setSaving(true); setErr("");
    try { const u = await disableCycle(cycle.cycle_id); onDisabled(u); onClose(); }
    catch(e) { setErr(e?.response?.data?.message||"Failed to disable."); }
    finally { setSaving(false); }
  };
  return (
    <Modal title="Disable Appraisal Cycle?" onClose={onClose} width={440}>
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"14px 16px" }}>
          <div style={{ fontWeight:700, color:"#991b1b", marginBottom:6 }}>⚠ Warning</div>
          <p style={{ margin:0, fontSize:13, color:"#7f1d1d", lineHeight:1.6 }}>
            Disabling <strong>{cycle.fy_label}</strong> will:
          </p>
          <ul style={{ margin:"8px 0 0", paddingLeft:20, fontSize:13, color:"#7f1d1d", lineHeight:1.8 }}>
            <li>Reset all employee submissions back to <strong>Draft</strong></li>
            <li>Mark the cycle as <strong>Inactive</strong></li>
            <li>Hide it from employees and managers</li>
          </ul>
          <p style={{ margin:"8px 0 0", fontSize:13, color:"#7f1d1d" }}>Historical data is preserved. You can re-enable or create a new cycle.</p>
        </div>
        {err && <p style={{ color:"#dc2626", fontSize:13, margin:0 }}>{err}</p>}
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
          <button onClick={onClose} style={{ padding:"9px 20px", border:"1px solid #e2e8f0", borderRadius:8, background:"#fff", cursor:"pointer" }}>Cancel</button>
          <button onClick={confirm} disabled={saving} style={{ padding:"9px 22px", background:"#dc2626", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
            <Square size={14}/> {saving?"Disabling…":"Disable Cycle"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function CycleCard({ cycle, expanded, onToggle, onEdit, onRollout, onDisable, onReEnable }) {
  const isActive = cycle.status === "active";
  return (
    <div style={{ border:`1.5px solid ${isActive?BRAND:"#e2e8f0"}`, borderRadius:12, overflow:"hidden", boxShadow:isActive?`0 0 0 3px ${BRAND}22`:"none", marginBottom:14 }}>
      <div onClick={onToggle} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", cursor:"pointer", background:isActive?"#fff7ed":"#f8fafc" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          {expanded ? <ChevronDown size={16} style={{ color:"#94a3b8" }}/> : <ChevronRight size={16} style={{ color:"#94a3b8" }}/>}
          <div>
            <div style={{ fontWeight:700, fontSize:15, color:"#1e293b" }}>{cycle.fy_label}</div>
            <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>
              {cycle.deadline ? `Deadline: ${fmtDate(cycle.deadline)}` : "No deadline"}
              {cycle.rolled_out_at && ` · Rolled out ${fmtDate(cycle.rolled_out_at)}`}
            </div>
          </div>
        </div>
        <StatusBadge status={cycle.status} />
      </div>
      {expanded && (
        <div style={{ padding:"16px 18px", borderTop:"1px solid #e2e8f0", background:"#fff" }}>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <button onClick={onEdit} style={{ padding:"7px 16px", border:"1px solid #e2e8f0", borderRadius:8, background:"#fff", cursor:"pointer", fontSize:13, fontWeight:600, color:"#475569" }}>
              Edit Settings
            </button>
            {!isActive && (
              <button onClick={onRollout} style={{ padding:"7px 16px", border:"none", borderRadius:8, background:"#16a34a", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
                <Play size={13}/> Roll Out
              </button>
            )}
            {isActive && (
              <button onClick={onDisable} style={{ padding:"7px 16px", border:"none", borderRadius:8, background:"#dc2626", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
                <Square size={13}/> Disable
              </button>
            )}
            {!isActive && cycle.disabled_at && (
              <button onClick={onReEnable} style={{ padding:"7px 16px", border:`1px solid ${BRAND}`, borderRadius:8, background:"#fff7ed", color:BRAND, cursor:"pointer", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
                <RotateCcw size={13}/> Re-Enable
              </button>
            )}
          </div>
          <div style={{ display:"flex", gap:24, marginTop:14, flexWrap:"wrap" }}>
            {[
              { label:"Rollout Type", value:cycle.rollout_type==="selected"?"Selected Employees":"All Employees" },
              { label:"Rolled Out", value:fmtDate(cycle.rolled_out_at) },
              { label:"Disabled On", value:fmtDate(cycle.disabled_at) },
            ].filter(m => m.value && m.value!=="—").map(m => (
              <div key={m.label}>
                <div style={{ fontSize:10, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:0.5 }}>{m.label}</div>
                <div style={{ fontSize:13, fontWeight:600, color:"#1e293b", marginTop:2 }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CyclePicker({ cycles, value, onChange }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18, flexWrap:"wrap" }}>
      <span style={{ fontSize:13, fontWeight:600, color:"#475569" }}>Cycle:</span>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {cycles.map(c => (
          <button key={c.cycle_id} onClick={()=>onChange(c.cycle_id)} style={{
            padding:"5px 14px", border:`1.5px solid ${value===c.cycle_id?BRAND:"#e2e8f0"}`,
            borderRadius:999, background:value===c.cycle_id?"#fff7ed":"#fff",
            color:value===c.cycle_id?BRAND:"#475569", cursor:"pointer", fontSize:13, fontWeight:600,
          }}>
            {c.fy_label}
            {c.status==="active" && <span style={{ marginLeft:6, fontSize:10, background:"#16a34a", color:"#fff", borderRadius:999, padding:"1px 6px" }}>Active</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function SubmissionsTab({ cycles }) {
  const [cycleId, setCycleId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!cycles.length) return;
    const active = cycles.find(c=>c.status==="active");
    setCycleId((active||cycles[0]).cycle_id);
  }, [cycles]);

  useEffect(() => {
    if (!cycleId) return;
    setLoading(true);
    getAllAppraisals({ cycle_id:cycleId }).then(setData).catch(()=>setData(null)).finally(()=>setLoading(false));
  }, [cycleId]);

  const appraisals = data?.appraisals || [];
  const notSub = data?.notSubmitted || [];
  const all = [...appraisals, ...notSub.map(e=>({...e, appraisal_status:"draft"}))];
  const filtered = all.filter(r => {
    const q = search.toLowerCase();
    const nm = (r.employee_name||"").toLowerCase().includes(q);
    const sm = statusFilter==="all" || (r.appraisal_status||"draft")===statusFilter;
    return nm && sm;
  });
  const counts = {
    all:all.length,
    draft:all.filter(r=>!r.appraisal_status||r.appraisal_status==="draft").length,
    submitted:all.filter(r=>r.appraisal_status==="submitted").length,
    reviewed:all.filter(r=>r.appraisal_status==="reviewed").length,
  };

  return (
    <div>
      <CyclePicker cycles={cycles} value={cycleId} onChange={setCycleId} />
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        {[
          { key:"all", label:"Total", icon:<Users size={14}/> },
          { key:"draft", label:"Draft / New", icon:<Clock size={14}/> },
          { key:"submitted", label:"Submitted", icon:<CheckCircle2 size={14}/> },
          { key:"reviewed", label:"Reviewed", icon:<CheckCircle2 size={14} style={{ color:BRAND }}/> },
        ].map(s => (
          <button key={s.key} onClick={()=>setStatusFilter(s.key)} style={{
            display:"flex", alignItems:"center", gap:6, padding:"6px 14px",
            border:`1.5px solid ${statusFilter===s.key?BRAND:"#e2e8f0"}`,
            borderRadius:999, background:statusFilter===s.key?"#fff7ed":"#fff",
            color:statusFilter===s.key?BRAND:"#475569", cursor:"pointer", fontSize:13, fontWeight:600,
          }}>
            {s.icon} {s.label} <span style={{ fontWeight:700 }}>{counts[s.key]}</span>
          </button>
        ))}
      </div>
      <div style={{ position:"relative", marginBottom:14 }}>
        <Search size={14} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name…"
          style={{ width:"100%", padding:"9px 12px 9px 34px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:13, boxSizing:"border-box" }}/>
      </div>
      {loading ? (
        <div style={{ textAlign:"center", padding:40, color:"#94a3b8" }}>Loading…</div>
      ) : filtered.length===0 ? (
        <div style={{ textAlign:"center", padding:40, color:"#94a3b8" }}>No appraisals found.</div>
      ) : (
        <div style={{ border:"1px solid #e2e8f0", borderRadius:10, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:"#f8fafc" }}>
                {["Employee","Designation","Department","Status","Submitted","Manager","Mgr Rated"].map(h => (
                  <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontWeight:600, color:"#475569", fontSize:11, textTransform:"uppercase", letterSpacing:0.4, borderBottom:"1px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row,i) => (
                <tr key={i} style={{ borderBottom:"1px solid #f1f5f9" }}>
                  <td style={{ padding:"10px 14px", fontWeight:600, color:"#1e293b" }}>
                    {row.employee_name||`${row.first_name||""} ${row.last_name||""}`.trim()}
                    <div style={{ fontSize:11, color:"#64748b", fontWeight:400 }}>{row.emp_code||""}</div>
                  </td>
                  <td style={{ padding:"10px 14px", color:"#475569" }}>{row.emp_job_title||"—"}</td>
                  <td style={{ padding:"10px 14px", color:"#475569" }}>{row.department_name||"—"}</td>
                  <td style={{ padding:"10px 14px" }}><AppraisalBadge status={row.appraisal_status||"draft"}/></td>
                  <td style={{ padding:"10px 14px", color:"#475569" }}>{fmtDate(row.submitted_at)}</td>
                  <td style={{ padding:"10px 14px", color:"#475569" }}>{row.manager_name||"—"}</td>
                  <td style={{ padding:"10px 14px" }}>
                    {row.manager_rated_at
                      ? <span style={{ color:"#16a34a", fontWeight:600 }}>✓ {fmtDate(row.manager_rated_at)}</span>
                      : <span style={{ color:"#94a3b8" }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EnrollmentTab({ cycles }) {
  const [cycleId, setCycleId] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [allEmps, setAllEmps] = useState([]);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerSelected, setPickerSelected] = useState([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!cycles.length) return;
    const active = cycles.find(c=>c.status==="active");
    setCycleId((active||cycles[0]).cycle_id);
  }, [cycles]);

  const fetchEnrollments = useCallback(async id => {
    setLoading(true);
    try { setEnrollments(await getEnrollments(id)||[]); }
    catch { setEnrollments([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (cycleId) fetchEnrollments(cycleId); }, [cycleId, fetchEnrollments]);

  const filtered = enrollments.filter(e =>
    `${e.employee_name} ${e.emp_code||""}`.toLowerCase().includes(search.toLowerCase())
  );

  const openPicker = async () => {
    setShowPicker(true);
    const r = await listEmployees({ status:"Active", limit:500 }).catch(()=>({ data:[] }));
    const ids = new Set(enrollments.map(e=>e.employee_id));
    setAllEmps((r.data||r||[]).filter(e=>!ids.has(e.employee_id)));
  };

  const filteredPicker = allEmps.filter(e =>
    `${e.first_name} ${e.last_name} ${e.emp_code||""}`.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  const handleAdd = async () => {
    if (!pickerSelected.length) return;
    setAdding(true);
    try { await enrollEmployees(cycleId, pickerSelected); setShowPicker(false); setPickerSelected([]); fetchEnrollments(cycleId); }
    catch { } finally { setAdding(false); }
  };

  const handleRemove = async empId => {
    if (!window.confirm("Remove this employee from the cycle?")) return;
    await unenrollEmployee(empId, cycleId);
    fetchEnrollments(cycleId);
  };

  return (
    <div>
      <CyclePicker cycles={cycles} value={cycleId} onChange={setCycleId} />
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, gap:12 }}>
        <div style={{ position:"relative", flex:1, maxWidth:320 }}>
          <Search size={14} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search enrolled employees…"
            style={{ width:"100%", padding:"9px 12px 9px 34px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:13, boxSizing:"border-box" }}/>
        </div>
        <button onClick={openPicker} style={{ padding:"9px 16px", background:BRAND, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
          <Plus size={14}/> Add Employee
        </button>
      </div>
      {loading ? <div style={{ textAlign:"center", padding:40, color:"#94a3b8" }}>Loading…</div> : (
        <div style={{ border:"1px solid #e2e8f0", borderRadius:10, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:"#f8fafc" }}>
                {["Employee","Designation","Department","Manager","Status","Enrolled",""].map(h => (
                  <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontWeight:600, color:"#475569", fontSize:11, textTransform:"uppercase", letterSpacing:0.4, borderBottom:"1px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row,i) => (
                <tr key={i} style={{ borderBottom:"1px solid #f1f5f9" }}>
                  <td style={{ padding:"10px 14px", fontWeight:600, color:"#1e293b" }}>
                    {row.employee_name}
                    <div style={{ fontSize:11, color:"#64748b", fontWeight:400 }}>{row.emp_code}</div>
                  </td>
                  <td style={{ padding:"10px 14px", color:"#475569" }}>{row.emp_job_title||"—"}</td>
                  <td style={{ padding:"10px 14px", color:"#475569" }}>{row.department_name||"—"}</td>
                  <td style={{ padding:"10px 14px", color:"#475569" }}>{row.manager_name||"—"}</td>
                  <td style={{ padding:"10px 14px" }}><AppraisalBadge status={row.appraisal_status||"draft"}/></td>
                  <td style={{ padding:"10px 14px", color:"#475569" }}>{fmtDate(row.enrolled_at)}</td>
                  <td style={{ padding:"10px 14px" }}>
                    <button onClick={()=>handleRemove(row.employee_id)} style={{ background:"none", border:"none", cursor:"pointer", color:"#dc2626", padding:4 }}>
                      <Trash2 size={14}/>
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length===0 && (
                <tr><td colSpan={7} style={{ padding:30, textAlign:"center", color:"#94a3b8" }}>No enrollments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showPicker && (
        <Modal title="Add Employees to Cycle" onClose={()=>setShowPicker(false)} width={500}>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ position:"relative" }}>
              <Search size={14} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }}/>
              <input value={pickerSearch} onChange={e=>setPickerSearch(e.target.value)} placeholder="Search…"
                style={{ width:"100%", padding:"9px 12px 9px 34px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:13, boxSizing:"border-box" }}/>
            </div>
            <div style={{ border:"1px solid #e2e8f0", borderRadius:8, maxHeight:260, overflowY:"auto" }}>
              {filteredPicker.map(emp => (
                <label key={emp.employee_id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 14px", borderBottom:"1px solid #f8fafc", cursor:"pointer", background:pickerSelected.includes(emp.employee_id)?"#fff7ed":"#fff" }}>
                  <input type="checkbox" checked={pickerSelected.includes(emp.employee_id)}
                    onChange={()=>setPickerSelected(p=>p.includes(emp.employee_id)?p.filter(x=>x!==emp.employee_id):[...p,emp.employee_id])}
                    style={{ accentColor:BRAND }}/>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:"#1e293b" }}>{emp.first_name} {emp.last_name}</div>
                    <div style={{ fontSize:11, color:"#64748b" }}>{emp.emp_code} · {emp.emp_job_title||"—"}</div>
                  </div>
                </label>
              ))}
              {filteredPicker.length===0 && <div style={{ padding:20, textAlign:"center", color:"#94a3b8", fontSize:13 }}>No employees to add.</div>}
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
              <button onClick={()=>setShowPicker(false)} style={{ padding:"8px 18px", border:"1px solid #e2e8f0", borderRadius:8, background:"#fff", cursor:"pointer", fontSize:13 }}>Cancel</button>
              <button onClick={handleAdd} disabled={!pickerSelected.length||adding} style={{ padding:"8px 18px", background:BRAND, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600, fontSize:13 }}>
                {adding?"Adding…":`Add ${pickerSelected.length||""}`}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function AdminPerformanceRollout() {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("cycles");
  const [expandedId, setExpandedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editCycle, setEditCycle] = useState(null);
  const [rolloutData, setRolloutData] = useState(null);
  const [disableData, setDisableData] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllAppraisalCycles();
      setCycles(data||[]);
      const active = (data||[]).find(c=>c.status==="active");
      if (active) setExpandedId(active.cycle_id);
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateInList = u => setCycles(p => p.map(c=>c.cycle_id===u.cycle_id?u:c));
  const handleCreated = c => { setCycles(p=>[c,...p]); setExpandedId(c.cycle_id); };
  const activeCycle = cycles.find(c=>c.status==="active");

  const TABS = [
    { id:"cycles",      label:"Appraisal Cycles" },
    { id:"submissions", label:"All Submissions" },
    { id:"enrollment",  label:"Enrollment" },
  ];

  return (
    <div style={{ padding:"28px 32px", maxWidth:1000, margin:"0 auto" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24 }}>
        <div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:"#1e293b" }}>Performance Appraisal</h1>
          <p style={{ margin:"4px 0 0", color:"#64748b", fontSize:14 }}>Manage appraisal cycles, roll out to employees, and review submissions.</p>
        </div>
        <button onClick={()=>setShowCreate(true)} style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 18px", background:BRAND, color:"#fff", border:"none", borderRadius:10, cursor:"pointer", fontWeight:700, fontSize:14 }}>
          <Plus size={16}/> New Cycle
        </button>
      </div>

      {activeCycle && (
        <div style={{ background:"#f0fdf4", border:"1px solid #86efac", borderRadius:12, padding:"12px 18px", marginBottom:22, display:"flex", alignItems:"center", gap:12 }}>
          <CheckCircle2 size={18} style={{ color:"#16a34a", flexShrink:0 }}/>
          <div style={{ flex:1 }}>
            <span style={{ fontWeight:700, color:"#166534", fontSize:14 }}>Active: {activeCycle.fy_label}</span>
            {activeCycle.deadline && <span style={{ color:"#166534", fontSize:13, marginLeft:8 }}>· Deadline {fmtDate(activeCycle.deadline)}</span>}
          </div>
          <button onClick={()=>setDisableData(activeCycle)} style={{ padding:"5px 14px", border:"1px solid #dc2626", borderRadius:8, background:"#fff", color:"#dc2626", cursor:"pointer", fontSize:12, fontWeight:600 }}>
            Disable
          </button>
        </div>
      )}

      <div style={{ display:"flex", gap:4, borderBottom:"2px solid #e2e8f0", marginBottom:24 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:"10px 18px", border:"none", background:"none", cursor:"pointer",
            fontWeight:700, fontSize:14, color:tab===t.id?BRAND:"#64748b",
            borderBottom:tab===t.id?`2.5px solid ${BRAND}`:"2.5px solid transparent", marginBottom:-2,
          }}>{t.label}</button>
        ))}
      </div>

      {tab==="cycles" && (
        <div>
          {loading ? <div style={{ textAlign:"center", padding:60, color:"#94a3b8" }}>Loading…</div>
          : cycles.length===0 ? (
            <div style={{ textAlign:"center", padding:60, background:"#f8fafc", border:"2px dashed #e2e8f0", borderRadius:14 }}>
              <AlertCircle size={40} style={{ color:"#cbd5e1", marginBottom:12 }}/>
              <p style={{ margin:0, fontWeight:700, color:"#64748b", fontSize:15 }}>No appraisal cycles yet</p>
              <p style={{ margin:"6px 0 0", color:"#94a3b8", fontSize:13 }}>Create a cycle to get started.</p>
              <button onClick={()=>setShowCreate(true)} style={{ marginTop:18, padding:"10px 22px", background:BRAND, color:"#fff", border:"none", borderRadius:10, cursor:"pointer", fontWeight:700, fontSize:14 }}>
                Create First Cycle
              </button>
            </div>
          ) : cycles.map(c => (
            <CycleCard key={c.cycle_id} cycle={c}
              expanded={expandedId===c.cycle_id}
              onToggle={()=>setExpandedId(p=>p===c.cycle_id?null:c.cycle_id)}
              onEdit={()=>setEditCycle(c)}
              onRollout={()=>setRolloutData(c)}
              onDisable={()=>setDisableData(c)}
              onReEnable={()=>setRolloutData(c)}
            />
          ))}
        </div>
      )}
      {tab==="submissions" && <SubmissionsTab cycles={cycles}/>}
      {tab==="enrollment"  && <EnrollmentTab  cycles={cycles}/>}

      {showCreate    && <CreateCycleModal  onClose={()=>setShowCreate(false)} onCreated={handleCreated}/>}
      {editCycle     && <EditSettingsModal  cycle={editCycle} onClose={()=>setEditCycle(null)} onSaved={u=>{updateInList(u);setEditCycle(null);}}/>}
      {rolloutData   && <RolloutModal       cycle={rolloutData} onClose={()=>setRolloutData(null)} onRolledOut={u=>{updateInList(u);setRolloutData(null);}}/>}
      {disableData   && <DisableConfirmModal cycle={disableData} onClose={()=>setDisableData(null)} onDisabled={u=>{updateInList(u);setDisableData(null);}}/>}
    </div>
  );
}
