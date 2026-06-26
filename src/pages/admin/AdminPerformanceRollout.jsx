import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Megaphone, CheckCircle2, Lock, CalendarDays, Users,
  ChevronDown, ChevronUp, Star, RefreshCw,
  AlertCircle, Clock, UserCheck, UserPlus, X, Search, Check,
} from "lucide-react";
import {
  getAppraisalCycle, toggleAppraisalCycle, updateCycleSettings,
  getAllAppraisals, updateAppraisalStatus,
  getEnrollments, enrollEmployees, unenrollEmployee,
} from "../../api/appraisal.api";
import { listEmployees } from "../../api/employee.api";

const BRAND = "#f18200";

function fmtDate(v) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
}

function Stars({ value, max = 5 }) {
  return (
    <span style={{ display:"flex", gap:2 }}>
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} size={12}
          style={{ color: i < value ? "#f18200" : "#e2e8f0",
            fill: i < value ? "#f18200" : "#e2e8f0" }} />
      ))}
    </span>
  );
}

function StatusBadge({ status }) {
  const cfg = {
    submitted:   { bg:"#dcfce7", color:"#15803d", label:"Submitted" },
    draft:       { bg:"#fef9c3", color:"#ca8a04", label:"Draft"     },
    approved:    { bg:"#dbeafe", color:"#1d4ed8", label:"Approved"  },
    rejected:    { bg:"#fee2e2", color:"#dc2626", label:"Rejected"  },
    not_started: { bg:"#f1f5f9", color:"#94a3b8", label:"Not Started"},
  }[status] || { bg:"#f1f5f9", color:"#64748b", label: status || "Pending" };
  return (
    <span style={{ fontSize:11, fontWeight:600, padding:"2px 10px",
      borderRadius:999, background:cfg.bg, color:cfg.color }}>
      {cfg.label}
    </span>
  );
}

/* ── AppraisalRow — shows only overall avg, no per-parameter drilldown ── */
function AppraisalRow({ item, onStatusChange }) {
  const avg = item.overall_avg || item.manager_avg || item.self_avg;

  return (
    <tr style={{ borderBottom:"1px solid #f1f5f9" }}>
      <td style={{ padding:"12px 16px" }}>
        <div style={{ fontWeight:600, fontSize:13, color:"#1e293b" }}>{item.employee_name}</div>
        <div style={{ fontSize:11, color:"#94a3b8" }}>{item.emp_code} · {item.department_name || "—"}</div>
      </td>
      <td style={{ padding:"12px 16px", fontSize:13, color:"#64748b" }}>{item.emp_job_title || "—"}</td>
      <td style={{ padding:"12px 16px", fontSize:13, color:"#64748b" }}>{item.manager_name || "—"}</td>
      <td style={{ padding:"12px 16px" }}>
        <StatusBadge status={item.appraisal_status} />
      </td>
      <td style={{ padding:"12px 16px" }}>
        {avg
          ? <>
              <Stars value={Math.round(Number(avg))} />
              <div style={{ fontSize:10, color:"#94a3b8", marginTop:1 }}>
                {item.manager_avg ? `Manager avg ${item.manager_avg}/5` : `Self avg ${item.self_avg}/5`}
              </div>
            </>
          : <span style={{ fontSize:12, color:"#cbd5e1" }}>—</span>}
      </td>
      <td style={{ padding:"12px 16px", fontSize:12, color:"#94a3b8" }}>{fmtDate(item.submitted_at)}</td>
      {/* <td style={{ padding:"12px 16px" }}>
        {item.appraisal_status === "submitted" && (
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={() => onStatusChange(item.appraisal_id, "approved")}
              style={{ fontSize:11, padding:"3px 10px", borderRadius:6, border:"1px solid #22c55e",
                background:"#f0fdf4", color:"#15803d", cursor:"pointer" }}>Approve</button>
            <button onClick={() => onStatusChange(item.appraisal_id, "rejected")}
              style={{ fontSize:11, padding:"3px 10px", borderRadius:6, border:"1px solid #ef4444",
                background:"#fef2f2", color:"#dc2626", cursor:"pointer" }}>Reject</button>
          </div>
        )}
        {(item.appraisal_status === "approved" || item.appraisal_status === "rejected") && (
          <button onClick={() => onStatusChange(item.appraisal_id, "submitted")}
            style={{ fontSize:11, padding:"3px 10px", borderRadius:6, border:"1px solid #e2e8f0",
              background:"#f8fafc", color:"#64748b", cursor:"pointer" }}>Undo</button>
        )}
      </td> */}
    </tr>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────── */
export default function AdminPerformanceRollout() {
  const [cycle,    setCycle]   = useState(null);
  const [data,     setData]    = useState(null);
  const [loading,  setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [saved,    setSaved]   = useState(false);
  const [tab,      setTab]     = useState("rollout");
  const [filter,   setFilter]  = useState("all");
  const [search,   setSearch]  = useState("");
  const [settings, setSettings] = useState({ fy_label:"", deadline:"" });
  const [editSettings, setEditSettings] = useState(false);

  const [enrollments,   setEnrollments]   = useState([]);
  const [allEmployees,  setAllEmployees]  = useState([]);
  const [enrollSearch,  setEnrollSearch]  = useState("");
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrolling,     setEnrolling]     = useState(false);
  const [selectedEmps,  setSelectedEmps]  = useState(new Set());
  const [empDropOpen,   setEmpDropOpen]   = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [c, d] = await Promise.all([getAppraisalCycle(), getAllAppraisals()]);
      setCycle(c);
      setData(d);
      setSettings({ fy_label: c?.fy_label || "", deadline: c?.deadline?.slice(0,10) || "" });
    } catch {}
    setLoading(false);
  };

  const loadEnrollments = useCallback(async () => {
    setEnrollLoading(true);
    try {
      const emps = await listEmployees({ limit: 500 });
      setAllEmployees(emps?.data || []);
    } catch {}
    try {
      const enr = await getEnrollments();
      setEnrollments(Array.isArray(enr) ? enr : []);
    } catch {
      setEnrollments([]);
    }
    setEnrollLoading(false);
  }, []);

  useEffect(() => { load(); }, []);
  useEffect(() => { if (tab === "rollout") loadEnrollments(); }, [tab, loadEnrollments]);

  const handleEnroll = async () => {
    if (!selectedEmps.size) return;
    setEnrolling(true);
    try {
      await enrollEmployees([...selectedEmps]);
      setSelectedEmps(new Set());
      await loadEnrollments();
    } catch {}
    setEnrolling(false);
  };

  const handleUnenroll = async (empId) => {
    try {
      await unenrollEmployee(empId);
      await loadEnrollments();
    } catch {}
  };

  const enrolledIds = useMemo(() => new Set(enrollments.map(e => e.employee_id)), [enrollments]);

  const unenrolledEmployees = useMemo(() => {
    const q = enrollSearch.trim().toLowerCase();
    return allEmployees
      .map(e => ({
        ...e,
        _name: (e.employee_name || `${e.first_name || ""} ${e.last_name || ""}`.trim()).trim(),
      }))
      .filter(e =>
        e.employee_id &&
        !enrolledIds.has(e.employee_id) &&
        (!q || e._name.toLowerCase().includes(q) ||
               (e.department_name||"").toLowerCase().includes(q) ||
               (e.emp_job_title||"").toLowerCase().includes(q))
      );
  }, [allEmployees, enrolledIds, enrollSearch]);

  const handleToggle = async () => {
    setToggling(true);
    try {
      const c = await toggleAppraisalCycle();
      setCycle(c);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    setToggling(false);
  };

  const handleSaveSettings = async () => {
    try {
      const c = await updateCycleSettings(settings);
      setCycle(c);
      setEditSettings(false);
    } catch {}
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateAppraisalStatus(id, status);
      await load();
    } catch {}
  };

  const allRows = useMemo(() => {
    const submitted  = data?.appraisals  || [];
    const notStarted = (data?.notSubmitted || []).map(e => ({
      ...e, appraisal_status: "not_started", submitted_at: null,
      self_avg: null, manager_avg: null, overall_avg: null,
    }));
    return [...submitted, ...notStarted];
  }, [data]);

  const visible = useMemo(() => {
    let list = allRows;
    if (filter === "submitted")   list = list.filter(r => r.appraisal_status === "submitted");
    if (filter === "draft")       list = list.filter(r => r.appraisal_status === "draft");
    if (filter === "approved")    list = list.filter(r => r.appraisal_status === "approved");
    if (filter === "not_started") list = list.filter(r => r.appraisal_status === "not_started");
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(r =>
      r.employee_name?.toLowerCase().includes(q) ||
      r.department_name?.toLowerCase().includes(q) ||
      r.manager_name?.toLowerCase().includes(q)
    );
    return list;
  }, [allRows, filter, search]);

  const stats = useMemo(() => ({
    total:      allRows.length,
    submitted:  allRows.filter(r => r.appraisal_status === "submitted").length,
    approved:   allRows.filter(r => r.appraisal_status === "approved").length,
    notStarted: allRows.filter(r => r.appraisal_status === "not_started").length,
  }), [allRows]);

  const isActive = cycle?.status === "active";

  return (
    <div style={{ minHeight:"100vh", background:"#f5f7fb", padding:24 }}>
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg, ${BRAND}, #e07000)`,
        borderRadius:16, padding:"20px 24px", color:"#fff", marginBottom:20,
        display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <Megaphone size={28} />
          <div>
            <h1 style={{ fontSize:20, fontWeight:700, margin:0 }}>Performance Appraisal Rollout</h1>
            <p style={{ fontSize:13, opacity:0.85, margin:"2px 0 0" }}>
              {cycle?.fy_label || "—"} · {isActive ? "Active" : "Inactive"}
            </p>
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          {["rollout","submissions"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding:"7px 18px", borderRadius:8, border:"none", cursor:"pointer",
                fontWeight:600, fontSize:13,
                background: tab===t ? "#fff" : "rgba(255,255,255,0.15)",
                color: tab===t ? BRAND : "#fff" }}>
              {t === "rollout" ? "Rollout Settings" : `All Submissions (${stats.submitted + stats.approved})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── ROLLOUT SETTINGS TAB ── */}
      {tab === "rollout" && (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:16, marginBottom:16 }}>
            {/* Status card */}
            <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12,
              padding:20, display:"flex", flexDirection:"column", alignItems:"center", gap:12, textAlign:"center" }}>
              {isActive
                ? <CheckCircle2 size={48} style={{ color:"#22c55e" }} />
                : <Lock size={48} style={{ color:"#cbd5e1" }} />}
              <div>
                <p style={{ fontSize:12, color:"#94a3b8", margin:"0 0 4px" }}>Current Status</p>
                <span style={{ fontSize:14, fontWeight:700, padding:"3px 14px", borderRadius:999,
                  background: isActive ? "#dcfce7" : "#f1f5f9",
                  color:      isActive ? "#15803d" : "#64748b" }}>
                  {isActive ? "Appraisal Live" : "Not Rolled Out"}
                </span>
              </div>
              {saved && <p style={{ fontSize:12, color:"#22c55e", fontWeight:600 }}>✓ Saved</p>}
              <div style={{ display:"flex", gap:8, width:"100%" }}>
                <button onClick={handleToggle} disabled={toggling || isActive}
                  style={{ flex:1, padding:"8px 0", borderRadius:8, border:"1px solid #22c55e",
                    background: isActive ? "#dcfce7" : "#fff", color:"#15803d",
                    fontWeight:600, fontSize:13, cursor: isActive ? "default" : "pointer",
                    opacity: isActive ? 0.6 : 1 }}>
                  {toggling && !isActive ? "Enabling…" : "Enable"}
                </button>
                <button onClick={handleToggle} disabled={toggling || !isActive}
                  style={{ flex:1, padding:"8px 0", borderRadius:8, border:"1px solid #ef4444",
                    background: !isActive ? "#f1f5f9" : "#fff", color:"#dc2626",
                    fontWeight:600, fontSize:13, cursor: !isActive ? "default" : "pointer",
                    opacity: !isActive ? 0.4 : 1 }}>
                  {toggling && isActive ? "Disabling…" : "Disable"}
                </button>
              </div>
            </div>

            {/* Cycle Settings */}
            <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <h2 style={{ fontSize:15, fontWeight:700, color:"#1e293b", margin:0 }}>Cycle Settings</h2>
                {!editSettings
                  ? <button onClick={() => setEditSettings(true)}
                      style={{ fontSize:12, color:BRAND, background:"none", border:"none", cursor:"pointer" }}>Edit</button>
                  : <div style={{ display:"flex", gap:8 }}>
                      <button onClick={handleSaveSettings}
                        style={{ fontSize:12, color:"#15803d", background:"#dcfce7", border:"none",
                          borderRadius:6, padding:"3px 10px", cursor:"pointer" }}>Save</button>
                      <button onClick={() => setEditSettings(false)}
                        style={{ fontSize:12, color:"#64748b", background:"#f1f5f9", border:"none",
                          borderRadius:6, padding:"3px 10px", cursor:"pointer" }}>Cancel</button>
                    </div>}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {[
                  { label:"FY Period", key:"fy_label", type:"text" },
                  { label:"Deadline",  key:"deadline",  type:"date" },
                ].map(f => (
                  <div key={f.key}>
                    <p style={{ fontSize:11, color:"#94a3b8", margin:"0 0 4px" }}>{f.label}</p>
                    {editSettings
                      ? <input type={f.type} value={settings[f.key]}
                          onChange={e => setSettings(s => ({ ...s, [f.key]: e.target.value }))}
                          style={{ width:"100%", border:"1px solid #e2e8f0", borderRadius:8,
                            padding:"7px 10px", fontSize:13, outline:"none", boxSizing:"border-box" }} />
                      : <p style={{ fontSize:14, fontWeight:600, color:"#1e293b", margin:0 }}>
                          {f.key === "deadline" ? fmtDate(settings[f.key]) : (settings[f.key] || "—")}
                        </p>}
                  </div>
                ))}
                <div>
                  <p style={{ fontSize:11, color:"#94a3b8", margin:"0 0 4px" }}>Rolled Out On</p>
                  <p style={{ fontSize:14, fontWeight:600, color:"#1e293b", margin:0 }}>
                    {cycle?.rolled_out_at ? fmtDate(cycle.rolled_out_at) : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
            {[
              { label:"Total Employees", value:stats.total,      color:BRAND,     icon:<Users size={18}/> },
              { label:"Submitted",       value:stats.submitted,  color:"#22c55e", icon:<CheckCircle2 size={18}/> },
              { label:"Approved",        value:stats.approved,   color:"#3b82f6", icon:<UserCheck size={18}/> },
              { label:"Not Started",     value:stats.notStarted, color:"#94a3b8", icon:<Clock size={18}/> },
            ].map(s => (
              <div key={s.label} style={{ background:"#fff", border:"1px solid #e2e8f0",
                borderRadius:12, padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:10,
                  background:`${s.color}18`, color:s.color,
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {s.icon}
                </div>
                <div>
                  <p style={{ fontSize:22, fontWeight:800, color:s.color, margin:0 }}>{s.value}</p>
                  <p style={{ fontSize:11, color:"#94a3b8", margin:0 }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Workflow steps */}
          <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:20, marginBottom:16 }}>
            <h2 style={{ fontSize:15, fontWeight:700, color:"#1e293b", margin:"0 0 16px" }}>Appraisal Workflow</h2>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
              {[
                { step:"1", title:"Admin Rollout",          desc:"Admin enables cycle — employees & managers get access", done:true },
                { step:"2", title:"Employee Self-Appraisal", desc:"Employee fills ratings per parameter & submits",        done:isActive },
                { step:"3", title:"Manager Review",          desc:"Manager views submissions & adds ratings/feedback",     done:false },
                { step:"4", title:"Admin Approval",          desc:"Admin reviews averages & approves/rejects submissions", done:false },
              ].map(w => (
                <div key={w.step} style={{ padding:14, borderRadius:10,
                  border:`1px solid ${w.done ? "#bbf7d0" : "#e2e8f0"}`,
                  background: w.done ? "#f0fdf4" : "#f8fafc",
                  textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                  <div style={{ width:28, height:28, borderRadius:"50%", fontWeight:800, fontSize:13,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    background: w.done ? "#22c55e" : "#e2e8f0",
                    color: w.done ? "#fff" : "#64748b" }}>{w.step}</div>
                  <p style={{ fontSize:13, fontWeight:700, color:"#1e293b", margin:0 }}>{w.title}</p>
                  <p style={{ fontSize:11, color:"#64748b", margin:0 }}>{w.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── ENROLLMENT PANEL ── */}
          <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, overflow:"hidden" }}>
            <div style={{ padding:"14px 20px", borderBottom:"1px solid #f1f5f9",
              display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
              <h2 style={{ fontSize:15, fontWeight:700, color:"#1e293b", margin:0, display:"flex", alignItems:"center", gap:8 }}>
                <UserPlus size={16} style={{ color:BRAND }} />
                Employee Enrollment
                <span style={{ fontSize:12, fontWeight:600, padding:"2px 8px", borderRadius:999,
                  background:`${BRAND}15`, color:BRAND }}>{enrollments.length} enrolled</span>
              </h2>
              <div style={{ display:"flex", gap:8, alignItems:"center", position:"relative" }}>
                <div style={{ position:"relative" }}>
                  <button onClick={() => setEmpDropOpen(o => !o)}
                    style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 12px",
                      border:"1px solid #e2e8f0", borderRadius:8, background:"#fff",
                      fontSize:13, color:"#374151", cursor:"pointer" }}>
                    <UserPlus size={14} />
                    Add Employees
                    {selectedEmps.size > 0 && (
                      <span style={{ background:BRAND, color:"#fff", borderRadius:"50%",
                        width:18, height:18, fontSize:10, fontWeight:700,
                        display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
                        {selectedEmps.size}
                      </span>
                    )}
                    <ChevronDown size={13} />
                  </button>
                  {empDropOpen && (
                    <div style={{ position:"absolute", top:"calc(100% + 4px)", right:0, zIndex:50,
                      background:"#fff", border:"1px solid #e2e8f0", borderRadius:10,
                      boxShadow:"0 8px 24px rgba(0,0,0,0.12)", width:300 }}>
                      <div style={{ padding:"8px 10px", borderBottom:"1px solid #f1f5f9" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6,
                          background:"#f8fafc", borderRadius:8, padding:"6px 10px" }}>
                          <Search size={13} style={{ color:"#94a3b8" }} />
                          <input value={enrollSearch} onChange={e => setEnrollSearch(e.target.value)}
                            placeholder="Search employees…" autoFocus
                            style={{ border:"none", background:"none", outline:"none",
                              fontSize:13, flex:1, color:"#374151" }} />
                        </div>
                      </div>
                      <div style={{ maxHeight:200, overflowY:"auto" }}>
                        {unenrolledEmployees.length === 0
                          ? <p style={{ padding:"12px 14px", fontSize:12, color:"#94a3b8", margin:0 }}>
                              {enrollSearch ? "No matches" : "All employees enrolled"}
                            </p>
                          : unenrolledEmployees.map(e => (
                            <div key={e.employee_id}
                              onClick={() => setSelectedEmps(prev => {
                                const n = new Set(prev);
                                n.has(e.employee_id) ? n.delete(e.employee_id) : n.add(e.employee_id);
                                return n;
                              })}
                              style={{ padding:"8px 14px", cursor:"pointer", display:"flex",
                                alignItems:"center", gap:8,
                                background: selectedEmps.has(e.employee_id) ? `${BRAND}08` : "transparent" }}>
                              <div style={{ width:16, height:16, borderRadius:4, flexShrink:0,
                                border:`2px solid ${selectedEmps.has(e.employee_id) ? BRAND : "#d1d5db"}`,
                                background: selectedEmps.has(e.employee_id) ? BRAND : "transparent",
                                display:"flex", alignItems:"center", justifyContent:"center" }}>
                                {selectedEmps.has(e.employee_id) && <Check size={10} style={{ color:"#fff" }} />}
                              </div>
                              <div>
                                <p style={{ fontSize:13, fontWeight:500, color:"#1e293b", margin:0 }}>{e._name}</p>
                                <p style={{ fontSize:11, color:"#94a3b8", margin:0 }}>{e.department_name || "—"}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                      {selectedEmps.size > 0 && (
                        <div style={{ padding:"8px 10px", borderTop:"1px solid #f1f5f9" }}>
                          <button onClick={() => { handleEnroll(); setEmpDropOpen(false); }}
                            disabled={enrolling}
                            style={{ width:"100%", padding:"7px", borderRadius:8, border:"none",
                              background:BRAND, color:"#fff", fontWeight:600, fontSize:13,
                              cursor:"pointer" }}>
                            {enrolling ? "Enrolling…" : `Enroll ${selectedEmps.size} Employee${selectedEmps.size > 1 ? "s" : ""}`}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {enrollLoading
              ? <p style={{ padding:20, textAlign:"center", color:"#94a3b8", fontSize:13 }}>Loading…</p>
              : enrollments.length === 0
                ? <div style={{ padding:40, textAlign:"center" }}>
                    <UserPlus size={40} style={{ color:"#cbd5e1", marginBottom:10 }} />
                    <p style={{ fontSize:13, color:"#94a3b8", margin:0 }}>
                      No employees enrolled yet. Add employees to give them access to the appraisal form.
                    </p>
                  </div>
                : <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead>
                      <tr style={{ background:"#f8fafc", borderBottom:"1px solid #e2e8f0" }}>
                        {["Employee","Department","Role","Status","Enrolled On",""].map(h => (
                          <th key={h} style={{ padding:"10px 16px", textAlign:"left",
                            fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase",
                            letterSpacing:"0.06em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map(e => (
                        <tr key={e.employee_id} style={{ borderBottom:"1px solid #f1f5f9" }}>
                          <td style={{ padding:"10px 16px" }}>
                            <span style={{ fontWeight:600, color:"#1e293b" }}>{e.employee_name}</span>
                            <span style={{ fontSize:11, color:"#94a3b8", marginLeft:6 }}>{e.emp_code}</span>
                          </td>
                          <td style={{ padding:"10px 16px", color:"#64748b" }}>{e.department_name || "—"}</td>
                          <td style={{ padding:"10px 16px", color:"#64748b" }}>{e.emp_job_title || "—"}</td>
                          <td style={{ padding:"10px 16px" }}>
                            <StatusBadge status={e.appraisal_status || "not_started"} />
                          </td>
                          <td style={{ padding:"10px 16px", color:"#94a3b8", fontSize:12 }}>
                            {fmtDate(e.enrolled_at)}
                          </td>
                          <td style={{ padding:"10px 16px" }}>
                            {(!e.appraisal_status || e.appraisal_status === "not_started") && (
                              <button onClick={() => handleUnenroll(e.employee_id)}
                                style={{ fontSize:11, padding:"3px 8px", borderRadius:6,
                                  border:"1px solid #fee2e2", background:"#fff5f5",
                                  color:"#dc2626", cursor:"pointer", display:"flex",
                                  alignItems:"center", gap:4 }}>
                                <X size={11} /> Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>}
          </div>
        </>
      )}

      {/* ── ALL SUBMISSIONS TAB ── */}
      {tab === "submissions" && (
        <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, overflow:"hidden" }}>
          {/* Toolbar */}
          <div style={{ padding:"12px 16px", borderBottom:"1px solid #f1f5f9",
            display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6,
              background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"7px 10px", flex:1, minWidth:200 }}>
              <Search size={13} style={{ color:"#94a3b8" }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search employee, department, manager…"
                style={{ border:"none", background:"none", outline:"none", fontSize:13, flex:1, color:"#374151" }} />
              {search && <X size={13} style={{ cursor:"pointer", color:"#94a3b8" }} onClick={() => setSearch("")} />}
            </div>
            <div style={{ display:"flex", gap:6 }}>
              {["all","submitted","approved","draft","not_started"].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ padding:"6px 12px", borderRadius:7, border:"1px solid",
                    fontSize:12, fontWeight:600, cursor:"pointer",
                    borderColor: filter===f ? BRAND : "#e2e8f0",
                    background:  filter===f ? `${BRAND}10` : "#fff",
                    color:       filter===f ? BRAND : "#64748b" }}>
                  {f === "all" ? "All" : f === "not_started" ? "Not Started" :
                   f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <button onClick={load} style={{ padding:"6px 12px", border:"1px solid #e2e8f0",
              borderRadius:7, background:"#fff", fontSize:12, color:"#64748b",
              cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {loading
            ? <p style={{ padding:40, textAlign:"center", color:"#94a3b8" }}>Loading…</p>
            : visible.length === 0
              ? <div style={{ padding:48, textAlign:"center" }}>
                  <Users size={40} style={{ color:"#cbd5e1", marginBottom:10 }} />
                  <p style={{ color:"#94a3b8", fontSize:13 }}>No submissions found.</p>
                </div>
              : <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead>
                    <tr style={{ background:"#f8fafc", borderBottom:"1px solid #e2e8f0" }}>
                      {["Employee","Job Title","Manager","Status","Overall Avg Rating","Submitted"].map(h => (
                        <th key={h} style={{ padding:"10px 16px", textAlign:"left",
                          fontSize:11, fontWeight:700, color:"#94a3b8",
                          textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((item, i) => (
                      <AppraisalRow key={item.appraisal_id || `ns-${i}`}
                        item={item} onStatusChange={handleStatusChange} />
                    ))}
                  </tbody>
                </table>}
        </div>
      )}
    </div>
  );
}
