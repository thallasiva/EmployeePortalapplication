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

/* ── helpers ──────────────────────────────────────────────────────────── */
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
function avgRating(ratings) {
  const vals = ratings.filter(r => r.manager_rating).map(r => r.manager_rating);
  if (!vals.length) return null;
  return (vals.reduce((a,b) => a+b, 0) / vals.length).toFixed(1);
}
function StatusBadge({ status }) {
  const cfg = {
    submitted: { bg:"#dcfce7", color:"#15803d", label:"Submitted" },
    draft:     { bg:"#fef9c3", color:"#ca8a04", label:"Draft"     },
    approved:  { bg:"#dbeafe", color:"#1d4ed8", label:"Approved"  },
    rejected:  { bg:"#fee2e2", color:"#dc2626", label:"Rejected"  },
  }[status] || { bg:"#f1f5f9", color:"#64748b", label: status || "Pending" };
  return (
    <span style={{ fontSize:11, fontWeight:600, padding:"2px 10px",
      borderRadius:999, background:cfg.bg, color:cfg.color }}>
      {cfg.label}
    </span>
  );
}

/* ── AppraisalRow ─────────────────────────────────────────────────────── */
function AppraisalRow({ item, onStatusChange }) {
  const [open, setOpen] = useState(false);
  const avg = item.ratings?.length ? avgRating(item.ratings) : null;

  return (
    <>
      <tr style={{ borderBottom:"1px solid #f1f5f9", cursor:"pointer" }}
        onClick={() => setOpen(o => !o)}>
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
          {avg ? <Stars value={Math.round(Number(avg))} /> : <span style={{ fontSize:12, color:"#cbd5e1" }}>—</span>}
          {avg && <div style={{ fontSize:10, color:"#94a3b8", marginTop:1 }}>Avg {avg}/5</div>}
        </td>
        <td style={{ padding:"12px 16px", fontSize:12, color:"#94a3b8" }}>{fmtDate(item.submitted_at)}</td>
        <td style={{ padding:"12px 16px" }}>
          {item.appraisal_status === "submitted" && (
            <div style={{ display:"flex", gap:6 }} onClick={e => e.stopPropagation()}>
              <button onClick={() => onStatusChange(item.appraisal_id, "approved")}
                style={{ fontSize:11, padding:"3px 10px", borderRadius:6, border:"1px solid #22c55e",
                  background:"#f0fdf4", color:"#15803d", cursor:"pointer" }}>Approve</button>
              <button onClick={() => onStatusChange(item.appraisal_id, "rejected")}
                style={{ fontSize:11, padding:"3px 10px", borderRadius:6, border:"1px solid #ef4444",
                  background:"#fef2f2", color:"#dc2626", cursor:"pointer" }}>Reject</button>
            </div>
          )}
          {(item.appraisal_status === "approved" || item.appraisal_status === "rejected") && (
            <button onClick={e => { e.stopPropagation(); onStatusChange(item.appraisal_id, "submitted"); }}
              style={{ fontSize:11, padding:"3px 10px", borderRadius:6, border:"1px solid #e2e8f0",
                background:"#f8fafc", color:"#64748b", cursor:"pointer" }}>Undo</button>
          )}
        </td>
        <td style={{ padding:"12px 16px", textAlign:"center" }}>
          {open ? <ChevronUp size={14} style={{ color:"#94a3b8" }} /> : <ChevronDown size={14} style={{ color:"#94a3b8" }} />}
        </td>
      </tr>
      {open && item.ratings?.length > 0 && (
        <tr style={{ background:"#f8fafc" }}>
          <td colSpan={8} style={{ padding:"0 16px 16px 32px" }}>
            <div style={{ paddingTop:12, borderTop:"1px solid #e2e8f0" }}>
              <p style={{ fontSize:12, fontWeight:700, color:"#64748b", marginBottom:10,
                textTransform:"uppercase", letterSpacing:"0.06em" }}>Parameter Ratings</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:10 }}>
                {item.ratings.map(r => (
                  <div key={r.parameter_key}
                    style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:8, padding:"10px 12px" }}>
                    <p style={{ fontSize:12, fontWeight:600, color:"#1e293b", marginBottom:4 }}>{r.parameter_label}</p>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                      <span style={{ fontSize:11, color:"#94a3b8", width:90 }}>Self Rating</span>
                      <Stars value={r.self_rating || 0} />
                    </div>
                    {r.manager_rating && (
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:11, color:"#94a3b8", width:90 }}>Mgr Rating</span>
                        <Stars value={r.manager_rating || 0} />
                      </div>
                    )}
                    {r.self_comments && (
                      <p style={{ fontSize:11, color:"#64748b", marginTop:6, fontStyle:"italic" }}>
                        "{r.self_comments}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
              {item.overall_comments && (
                <p style={{ fontSize:12, color:"#64748b", marginTop:10, fontStyle:"italic" }}>
                  <strong>Overall comments: </strong>{item.overall_comments}
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────── */
export default function AdminPerformanceRollout() {
  const [cycle,    setCycle]   = useState(null);
  const [data,     setData]    = useState(null);
  const [loading,  setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [saved,    setSaved]   = useState(false);
  const [tab,      setTab]     = useState("rollout"); // rollout | submissions
  const [filter,   setFilter]  = useState("all");
  const [search,   setSearch]  = useState("");
  const [settings, setSettings] = useState({ fy_label:"", deadline:"" });
  const [editSettings, setEditSettings] = useState(false);

  // Enrollment state
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

    // Load employee list independently so a failing enrollments API doesn't block it
    try {
      const emps = await listEmployees({ limit: 500 });
      const rows = emps?.data || [];
      setAllEmployees(rows);
    } catch (e) {
      console.error("Failed to load employee list:", e);
    }

    try {
      const enr = await getEnrollments();
      setEnrollments(Array.isArray(enr) ? enr : []);
    } catch (e) {
      console.error("Failed to load enrollments:", e);
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

  /* Filter + search */
  const allRows = useMemo(() => {
    const submitted  = data?.appraisals  || [];
    const notStarted = (data?.notSubmitted || []).map(e => ({
      ...e, appraisal_status: "not_started", ratings: [], submitted_at: null
    }));
    return [...submitted, ...notStarted];
  }, [data]);

  const visible = useMemo(() => {
    let list = allRows;
    if (filter === "submitted")    list = list.filter(r => r.appraisal_status === "submitted");
    if (filter === "draft")        list = list.filter(r => r.appraisal_status === "draft");
    if (filter === "approved")     list = list.filter(r => r.appraisal_status === "approved");
    if (filter === "not_started")  list = list.filter(r => r.appraisal_status === "not_started");
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(r =>
      r.employee_name?.toLowerCase().includes(q) ||
      r.department_name?.toLowerCase().includes(q) ||
      r.manager_name?.toLowerCase().includes(q)
    );
    return list;
  }, [allRows, filter, search]);

  const stats = useMemo(() => {
    const total      = allRows.length;
    const submitted  = allRows.filter(r => r.appraisal_status === "submitted").length;
    const approved   = allRows.filter(r => r.appraisal_status === "approved").length;
    const notStarted = allRows.filter(r => r.appraisal_status === "not_started").length;
    return { total, submitted, approved, notStarted };
  }, [allRows]);

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
                <span style={{ fontSize:14, fontWeight:700, padding:"3px 14px",
                  borderRadius:999,
                  background: isActive ? "#dcfce7" : "#f1f5f9",
                  color:      isActive ? "#15803d" : "#64748b" }}>
                  {isActive ? "Appraisal Live" : "Not Rolled Out"}
                </span>
              </div>
              {saved && <p style={{ fontSize:12, color:"#22c55e", fontWeight:600 }}>✓ Saved</p>}
              <div style={{ display:"flex", gap:8, width:"100%" }}>
                <button onClick={handleToggle} disabled={toggling || isActive}
                  style={{ flex:1, padding:"8px 0", borderRadius:8, border:`1px solid #22c55e`,
                    background: isActive ? "#dcfce7" : "#fff",
                    color: "#15803d", fontWeight:600, fontSize:13, cursor: isActive ? "default" : "pointer",
                    opacity: isActive ? 0.6 : 1 }}>
                  {toggling && !isActive ? "Enabling…" : "Enable"}
                </button>
                <button onClick={handleToggle} disabled={toggling || !isActive}
                  style={{ flex:1, padding:"8px 0", borderRadius:8, border:"1px solid #ef4444",
                    background: !isActive ? "#f1f5f9" : "#fff",
                    color: "#dc2626", fontWeight:600, fontSize:13, cursor: !isActive ? "default" : "pointer",
                    opacity: !isActive ? 0.4 : 1 }}>
                  {toggling && isActive ? "Disabling…" : "Disable"}
                </button>
              </div>
            </div>

            {/* Settings */}
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
                  { label:"FY Period",  key:"fy_label",  type:"text",  disabled:!editSettings },
                  { label:"Deadline",   key:"deadline",  type:"date",  disabled:!editSettings },
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
          <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:20 }}>
            <h2 style={{ fontSize:15, fontWeight:700, color:"#1e293b", margin:"0 0 16px" }}>Appraisal Workflow</h2>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
              {[
                { step:"1", title:"Admin Rollout",        desc:"Admin enables cycle — employees & managers get access", done:true },
                { step:"2", title:"Employee Self-Appraisal", desc:"Employee fills ratings per parameter & submits",     done:isActive },
                { step:"3", title:"Manager Review",       desc:"Manager views team submissions & adds ratings",         done:false },
                { step:"4", title:"Admin Approval",       desc:"Admin reviews all & approves/rejects submissions",      done:false },
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
            {/* Header */}
            <div style={{ padding:"14px 20px", borderBottom:"1px solid #f1f5f9",
              display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
              <div>
                <h2 style={{ fontSize:15, fontWeight:700, color:"#1e293b", margin:0, display:"flex", alignItems:"center", gap:8 }}>
                  <UserPlus size={16} style={{ color:BRAND }} />
                  Employee Enrollment
                </h2>
                <p style={{ fontSize:12, color:"#94a3b8", margin:"3px 0 0" }}>
                  {enrollments.length} enrolled · {unenrolledEmployees.length + enrollments.length} total employees
                </p>
              </div>
              {selectedEmps.size > 0 && (
                <button onClick={handleEnroll} disabled={enrolling}
                  style={{ padding:"8px 20px", borderRadius:8, border:"none", cursor:"pointer",
                    background:BRAND, color:"#fff", fontWeight:700, fontSize:13,
                    display:"flex", alignItems:"center", gap:6 }}>
                  <UserPlus size={13} />
                  {enrolling ? "Rolling out…" : `Roll Out to ${selectedEmps.size} Employee${selectedEmps.size > 1 ? "s" : ""}`}
                </button>
              )}
            </div>

            {enrollLoading ? (
              <div style={{ padding:32, textAlign:"center", color:"#94a3b8", fontSize:13 }}>Loading employees…</div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", minHeight:280 }}>

                {/* ── LEFT: Employee custom dropdown ── */}
                <div style={{ borderRight:"1px solid #f1f5f9", padding:"16px" }}>
                  <p style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.05em", margin:"0 0 8px" }}>Select Employees</p>

                  {/* Trigger */}
                  <div style={{ position:"relative" }}>
                    <button type="button" onClick={() => setEmpDropOpen(o => !o)}
                      style={{ width:"100%", height:40, display:"flex", alignItems:"center", justifyContent:"space-between",
                        padding:"0 12px", border:"1px solid #e2e8f0", borderRadius:9, background:"#fff",
                        fontSize:13, color: selectedEmps.size > 0 ? "#1e293b" : "#94a3b8", cursor:"pointer" }}>
                      <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <Users size={13} style={{ color:"#94a3b8", flexShrink:0 }} />
                        {selectedEmps.size === 0
                          ? "Choose employees..."
                          : selectedEmps.size === unenrolledEmployees.length
                            ? "All employees selected"
                            : `${selectedEmps.size} employee${selectedEmps.size > 1 ? "s" : ""} selected`}
                      </span>
                      <ChevronDown size={13} style={{ color:"#94a3b8", transform: empDropOpen ? "rotate(180deg)" : "none", transition:"0.15s", flexShrink:0 }} />
                    </button>

                    {/* Dropdown panel */}
                    {empDropOpen && (
                      <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:300,
                        background:"#fff", border:"1px solid #e2e8f0", borderRadius:10,
                        boxShadow:"0 8px 24px rgba(0,0,0,0.10)", overflow:"hidden" }}>

                        {/* Search */}
                        <div style={{ padding:"8px 10px", borderBottom:"1px solid #f1f5f9" }}>
                          <div style={{ position:"relative" }}>
                            <Search size={12} style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", color:"#94a3b8", pointerEvents:"none" }} />
                            <input type="text" value={enrollSearch} onChange={e => setEnrollSearch(e.target.value)}
                              autoFocus placeholder="Search..."
                              style={{ width:"100%", height:32, paddingLeft:26, border:"1px solid #e2e8f0",
                                borderRadius:7, fontSize:13, outline:"none", boxSizing:"border-box" }} />
                          </div>
                        </div>

                        {/* Select all row */}
                        <div onClick={() => {
                            if (selectedEmps.size === unenrolledEmployees.length && unenrolledEmployees.length > 0) {
                              setSelectedEmps(new Set());
                            } else {
                              setSelectedEmps(new Set(unenrolledEmployees.map(e => e.employee_id)));
                            }
                          }}
                          style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                            padding:"10px 14px", cursor:"pointer", background:"#f8fafc",
                            borderBottom:"1px solid #f1f5f9" }}>
                          <span style={{ fontSize:13, fontWeight:600, color:"#1e293b" }}>
                            Select all ({unenrolledEmployees.length})
                          </span>
                          <div style={{
                            width:16, height:16, borderRadius:4, flexShrink:0,
                            border:`1.5px solid ${selectedEmps.size === unenrolledEmployees.length && unenrolledEmployees.length > 0 ? BRAND : "#d1d5db"}`,
                            background: selectedEmps.size === unenrolledEmployees.length && unenrolledEmployees.length > 0 ? BRAND : "#fff",
                            display:"flex", alignItems:"center", justifyContent:"center",
                          }}>
                            {selectedEmps.size === unenrolledEmployees.length && unenrolledEmployees.length > 0 && <Check size={10} color="#fff" />}
                          </div>
                        </div>

                        {/* Employee rows */}
                        <div style={{ maxHeight:260, overflowY:"auto" }}>
                          {unenrolledEmployees.length === 0 ? (
                            <p style={{ fontSize:13, color:"#94a3b8", padding:"16px 14px", textAlign:"center", margin:0 }}>
                              {allEmployees.length === 0 ? "No employees found" : "All employees are enrolled"}
                            </p>
                          ) : unenrolledEmployees.map(emp => {
                            const sel = selectedEmps.has(emp.employee_id);
                            return (
                              <div key={emp.employee_id}
                                onClick={() => setSelectedEmps(s => {
                                  const n = new Set(s);
                                  if (n.has(emp.employee_id)) n.delete(emp.employee_id); else n.add(emp.employee_id);
                                  return n;
                                })}
                                style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                                  padding:"10px 14px", cursor:"pointer", borderBottom:"1px solid #f8fafc",
                                  background: sel ? "#fff7ed" : "#fff" }}>
                                <div style={{ minWidth:0 }}>
                                  <div style={{ fontSize:13, fontWeight:600, color:"#1e293b" }}>{emp._name}</div>
                                  <div style={{ fontSize:11, color:"#94a3b8", marginTop:1 }}>{emp.department_name || "—"}</div>
                                </div>
                                <div style={{
                                  width:16, height:16, borderRadius:4, flexShrink:0,
                                  border:`1.5px solid ${sel ? BRAND : "#d1d5db"}`,
                                  background: sel ? BRAND : "#fff",
                                  display:"flex", alignItems:"center", justifyContent:"center", marginLeft:10,
                                }}>
                                  {sel && <Check size={10} color="#fff" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Done footer */}
                        <div style={{ padding:"8px 14px", borderTop:"1px solid #f1f5f9",
                          display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span style={{ fontSize:12, color:"#94a3b8" }}>{selectedEmps.size} selected</span>
                          <button onClick={() => setEmpDropOpen(false)}
                            style={{ fontSize:12, fontWeight:700, color:BRAND, background:"none", border:"none", cursor:"pointer" }}>
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected chips */}
                  {selectedEmps.size > 0 && (
                    <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:10 }}>
                      {[...selectedEmps].slice(0,6).map(id => {
                        const emp = unenrolledEmployees.find(e => e.employee_id === id);
                        return emp ? (
                          <span key={id} style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:11,
                            fontWeight:600, padding:"3px 8px", borderRadius:999,
                            background:"#fff7ed", color:"#c2410c", border:"1px solid #fed7aa" }}>
                            {emp._name.split(" ")[0]}
                            <X size={10} style={{ cursor:"pointer" }} onClick={() => setSelectedEmps(s => { const n=new Set(s); n.delete(id); return n; })} />
                          </span>
                        ) : null;
                      })}
                      {selectedEmps.size > 6 && <span style={{ fontSize:11, color:"#94a3b8", alignSelf:"center" }}>+{selectedEmps.size - 6} more</span>}
                      <button onClick={() => setSelectedEmps(new Set())}
                        style={{ fontSize:11, color:"#94a3b8", background:"none", border:"none", cursor:"pointer", alignSelf:"center" }}>
                        Clear all
                      </button>
                    </div>
                  )}
                </div>

                {/* ── RIGHT: Enrolled employees ── */}
                <div>
                  <div style={{ padding:"10px 14px", borderBottom:"1px solid #f1f5f9", background:"#f8fafc" }}>
                    <span style={{ fontSize:12, fontWeight:600, color:"#64748b" }}>
                      Enrolled &amp; Rolled Out ({enrollments.length})
                    </span>
                  </div>
                  <div style={{ maxHeight:340, overflowY:"auto" }}>
                    {enrollments.length === 0 ? (
                      <div style={{ padding:28, textAlign:"center" }}>
                        <Users size={28} style={{ color:"#e2e8f0", marginBottom:8 }} />
                        <p style={{ fontSize:12, color:"#94a3b8", margin:0 }}>
                          Select employees on the left and click Roll Out
                        </p>
                      </div>
                    ) : enrollments.map(enr => {
                      const statusCfg = {
                        submitted: { bg:"#dcfce7", color:"#15803d", label:"Submitted" },
                        approved:  { bg:"#dbeafe", color:"#1d4ed8", label:"Approved" },
                        draft:     { bg:"#fef9c3", color:"#ca8a04", label:"Draft" },
                      }[enr.appraisal_status] || { bg:"#f1f5f9", color:"#64748b", label:"Not Started" };
                      return (
                        <div key={enr.employee_id}
                          style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 14px",
                            borderBottom:"1px solid #f8fafc" }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:13, fontWeight:600, color:"#1e293b" }}>{enr.employee_name}</div>
                            <div style={{ fontSize:11, color:"#94a3b8" }}>
                              {enr.department_name || "—"}{enr.manager_name ? ` · Mgr: ${enr.manager_name}` : ""}
                            </div>
                          </div>
                          <span style={{ fontSize:11, fontWeight:600, padding:"2px 9px", borderRadius:999,
                            background:statusCfg.bg, color:statusCfg.color, flexShrink:0 }}>{statusCfg.label}</span>
                          <button onClick={() => handleUnenroll(enr.employee_id)}
                            style={{ width:22, height:22, borderRadius:5, border:"1px solid #e2e8f0",
                              background:"#fff", cursor:"pointer", display:"flex", alignItems:"center",
                              justifyContent:"center", color:"#94a3b8", flexShrink:0 }}
                            title="Remove from appraisal">
                            <X size={11} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}
          </div>
        </>
      )}

      {/* ── SUBMISSIONS TAB ── */}
      {tab === "submissions" && (
        <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, overflow:"hidden" }}>
          {/* Toolbar */}
          <div style={{ padding:"14px 20px", borderBottom:"1px solid #f1f5f9",
            display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search employee, dept, manager…"
              style={{ height:36, flex:1, minWidth:200, padding:"0 12px",
                border:"1px solid #e2e8f0", borderRadius:8, fontSize:13, outline:"none" }} />
            <select value={filter} onChange={e => setFilter(e.target.value)}
              style={{ height:36, padding:"0 10px", border:"1px solid #e2e8f0",
                borderRadius:8, fontSize:13, outline:"none", background:"#fff" }}>
              <option value="all">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="draft">Draft</option>
              <option value="not_started">Not Started</option>
            </select>
            <button onClick={load}
              style={{ height:36, padding:"0 14px", background:"#fff", border:"1px solid #e2e8f0",
                borderRadius:8, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6, color:"#64748b" }}>
              <RefreshCw size={13} />Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ padding:48, textAlign:"center", color:"#94a3b8" }}>Loading…</div>
          ) : visible.length === 0 ? (
            <div style={{ padding:48, textAlign:"center", color:"#94a3b8" }}>
              <AlertCircle size={40} style={{ marginBottom:12, color:"#cbd5e1" }} />
              <p>No appraisals found.</p>
            </div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"#f8fafc", borderBottom:"1px solid #e2e8f0" }}>
                    {["Employee","Job Title","Manager","Status","Avg Rating","Submitted","Actions",""].map(h => (
                      <th key={h} style={{ padding:"10px 16px", textAlign:"left",
                        fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase",
                        letterSpacing:"0.06em", whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map(item => (
                    <AppraisalRow key={item.employee_id} item={item} onStatusChange={handleStatusChange} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
