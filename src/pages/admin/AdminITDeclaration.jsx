import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  FileText, CheckCircle2, Lock, ChevronDown, ChevronUp,
  RefreshCw, Download, Users,
} from "lucide-react";
import {
  getAllITCycles, toggleITCycle,
  getAllITDeclarations, reviewDeclaration, reviewProof, adminDownloadProofUrl,
} from "../../api/itDeclaration.api";

const BRAND = "#f18200";
const fmt     = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const fmtDate = (v) => v ? new Date(v).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "—";

const DECL_STATUS = {
  submitted:   { bg:"#dbeafe", color:"#1d4ed8", label:"Submitted"   },
  approved:    { bg:"#dcfce7", color:"#15803d", label:"Approved"    },
  rejected:    { bg:"#fee2e2", color:"#dc2626", label:"Rejected"    },
  draft:       { bg:"#fef9c3", color:"#a16207", label:"Draft"       },
  not_started: { bg:"#f1f5f9", color:"#64748b", label:"Not Started" },
};
const PROOF_STATUS = {
  verified: { bg:"#dcfce7", color:"#15803d", label:"Verified" },
  pending:  { bg:"#fef9c3", color:"#a16207", label:"Pending"  },
  rejected: { bg:"#fee2e2", color:"#dc2626", label:"Rejected" },
};

function Badge({ status, map }) {
  const c = map[status] || { bg:"#f1f5f9", color:"#64748b", label: status || "—" };
  return (
    <span style={{ fontSize:11, fontWeight:700, padding:"2px 10px", borderRadius:999, background:c.bg, color:c.color }}>
      {c.label}
    </span>
  );
}

/* ── Review modal ─────────────────────────────────────────────────────────── */
function ReviewModal({ title, onSubmit, onClose }) {
  const [status,  setStatus]  = useState("approved");
  const [remarks, setRemarks] = useState("");
  const [saving,  setSaving]  = useState(false);

  const submit = async () => {
    if (status === "rejected" && !remarks.trim()) return;
    setSaving(true);
    try { await onSubmit(status, remarks); onClose(); }
    catch (e) { alert(e?.response?.data?.message || "Error"); }
    setSaving(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1200, background:"rgba(0,0,0,0.4)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:12, width:"100%", maxWidth:420, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ padding:"16px 20px", borderBottom:"1px solid #f0f0f0" }}>
          <p style={{ margin:0, fontSize:15, fontWeight:700, color:"#1e293b" }}>{title}</p>
        </div>
        <div style={{ padding:"16px 20px" }}>
          <div style={{ display:"flex", gap:10, marginBottom:14 }}>
            {[["approved","✓ Approve","#22c55e","#f0fdf4","#15803d"],
              ["rejected","✕ Reject", "#ef4444","#fef2f2","#dc2626"]].map(([s,lbl,border,bg,color]) => (
              <button key={s} onClick={() => setStatus(s)}
                style={{ flex:1, padding:9, borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer",
                  border:`1px solid ${status===s ? border : "#e2e8f0"}`,
                  background: status===s ? bg : "#fff", color: status===s ? color : "#64748b" }}>
                {lbl}
              </button>
            ))}
          </div>
          <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3}
            placeholder={status === "rejected" ? "Reason for rejection (required)…" : "Comments (optional)…"}
            style={{ width:"100%", padding:"9px 12px", border:"1px solid #e2e8f0", borderRadius:8,
              fontSize:13, outline:"none", resize:"vertical", boxSizing:"border-box" }} />
        </div>
        <div style={{ display:"flex", gap:10, padding:"14px 20px", borderTop:"1px solid #f0f0f0" }}>
          <button onClick={submit} disabled={saving}
            style={{ flex:1, padding:10, borderRadius:8, fontWeight:600, fontSize:13,
              border:"none", cursor:"pointer", background:BRAND, color:"#fff" }}>
            {saving ? "Saving…" : "Confirm"}
          </button>
          <button onClick={onClose}
            style={{ padding:"10px 18px", borderRadius:8, fontSize:13, border:"1px solid #e2e8f0",
              background:"#fff", color:"#64748b", cursor:"pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Employee expandable row ─────────────────────────────────────────────── */
function EmpRow({ row, onRefresh }) {
  const [open,  setOpen]  = useState(false);
  const [modal, setModal] = useState(null);

  const decl   = row.declaration;
  const status = decl?.status || "not_started";
  const total  = row.items?.reduce((s, i) => s + Number(i.declared_amount || 0), 0) || 0;

  return (
    <>
      <tr style={{ borderBottom:"1px solid #f1f5f9", cursor:"pointer", background: open ? "#fafbfc" : "#fff" }}
        onClick={() => setOpen(o => !o)}>
        <td style={{ padding:"12px 16px" }}>
          <div style={{ fontWeight:600, fontSize:13, color:"#1e293b" }}>{row.employee_name}</div>
          <div style={{ fontSize:11, color:"#94a3b8" }}>{row.emp_code} · {row.department_name || "—"}</div>
        </td>
        <td style={{ padding:"12px 16px", fontSize:13, color:"#64748b" }}>{row.job_title || "—"}</td>
        <td style={{ padding:"12px 16px" }}><Badge status={status} map={DECL_STATUS} /></td>
        <td style={{ padding:"12px 16px", fontSize:13, fontWeight:600, color:"#1e293b" }}>
          {total > 0 ? fmt(total) : <span style={{ color:"#cbd5e1" }}>—</span>}
        </td>
        <td style={{ padding:"12px 16px", fontSize:12, color:"#94a3b8" }}>{fmtDate(decl?.submitted_at)}</td>
        <td style={{ padding:"12px 16px" }} onClick={e => e.stopPropagation()}>
          {status === "submitted" && (
            <button onClick={() => setModal({ type:"decl" })}
              style={{ fontSize:11, padding:"4px 12px", borderRadius:6, fontWeight:600, cursor:"pointer",
                border:`1px solid ${BRAND}`, background:"#fff8f0", color:BRAND }}>
              Review
            </button>
          )}
          {(status === "approved" || status === "rejected") && (
            <button onClick={() => setModal({ type:"decl" })}
              style={{ fontSize:11, padding:"4px 12px", borderRadius:6, cursor:"pointer",
                border:"1px solid #e2e8f0", background:"#f8fafc", color:"#64748b" }}>
              Change
            </button>
          )}
        </td>
        <td style={{ padding:"12px 16px", textAlign:"center" }}>
          {open ? <ChevronUp size={14} style={{ color:"#94a3b8" }}/> : <ChevronDown size={14} style={{ color:"#94a3b8" }}/>}
        </td>
      </tr>

      {open && (
        <tr style={{ background:"#f8fafc" }}>
          <td colSpan={7} style={{ padding:"0 16px 16px 32px" }}>
            <div style={{ paddingTop:14, borderTop:"1px solid #e2e8f0" }}>
              {decl?.admin_remarks && (
                <div style={{ marginBottom:12, padding:"8px 14px", borderRadius:8, fontSize:12,
                  background: status==="approved" ? "#f0fdf4" : "#fee2e2",
                  color: status==="approved" ? "#15803d" : "#dc2626" }}>
                  <strong>Admin remarks:</strong> {decl.admin_remarks}
                </div>
              )}

              {row.items?.length > 0 && (
                <div style={{ marginBottom:14 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 8px" }}>Declaration Items</p>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:8 }}>
                    {row.items.map((it, i) => (
                      <div key={i} style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:8, padding:"10px 12px" }}>
                        <p style={{ fontSize:10, fontWeight:700, color:"#94a3b8", margin:"0 0 2px", textTransform:"uppercase" }}>{it.section_key}</p>
                        <p style={{ fontSize:12, color:"#334155", margin:"0 0 4px" }}>{it.sub_label || it.section_label}</p>
                        <p style={{ fontSize:13, fontWeight:700, color:BRAND, margin:0 }}>{fmt(it.declared_amount)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {row.proofs?.length > 0 && (
                <div>
                  <p style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 8px" }}>Proof Documents</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {row.proofs.map(p => (
                      <div key={p.proof_id} style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:8, padding:"10px 14px",
                        display:"flex", alignItems:"center", gap:12 }}>
                        <div style={{ flex:1 }}>
                          <p style={{ fontSize:13, fontWeight:600, color:"#1e293b", margin:"0 0 3px" }}>{p.investment_type}</p>
                          <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
                            <span style={{ fontSize:11, color:"#64748b" }}>Declared: <strong>{fmt(p.declared_amount)}</strong></span>
                            {p.actual_amount > 0 && <span style={{ fontSize:11, color:"#64748b" }}>Actual: <strong>{fmt(p.actual_amount)}</strong></span>}
                          </div>
                          {p.admin_remarks && <p style={{ fontSize:11, color:"#dc2626", margin:"3px 0 0" }}>{p.admin_remarks}</p>}
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <Badge status={p.status} map={PROOF_STATUS} />
                          {p.file_path && (
                            <a href={adminDownloadProofUrl(p.proof_id)} target="_blank" rel="noreferrer"
                              style={{ fontSize:11, color:BRAND, textDecoration:"none",
                                padding:"3px 8px", border:`1px solid ${BRAND}`, borderRadius:5,
                                display:"flex", alignItems:"center", gap:4 }}>
                              <Download size={11}/> View
                            </a>
                          )}
                          {p.status === "pending" && (
                            <button onClick={() => setModal({ type:"proof", id:p.proof_id, label:p.investment_type })}
                              style={{ fontSize:11, padding:"3px 10px", borderRadius:5, fontWeight:600, cursor:"pointer",
                                border:`1px solid ${BRAND}`, background:"#fff8f0", color:BRAND }}>
                              Review
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!row.items?.length && !row.proofs?.length && (
                <p style={{ color:"#94a3b8", fontSize:13, margin:0 }}>No declaration submitted yet.</p>
              )}
            </div>
          </td>
        </tr>
      )}

      {modal?.type === "decl" && (
        <ReviewModal title={`Review: ${row.employee_name}`} onClose={() => setModal(null)}
          onSubmit={async (st, rm) => { await reviewDeclaration(decl.declaration_id, { status:st, admin_remarks:rm }); onRefresh(); }} />
      )}
      {modal?.type === "proof" && (
        <ReviewModal title={`Review Proof: ${modal.label}`} onClose={() => setModal(null)}
          onSubmit={async (st, rm) => { await reviewProof(modal.id, { status:st, admin_remarks:rm }); onRefresh(); }} />
      )}
    </>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function AdminITDeclaration() {
  const [cycle,    setCycle]    = useState(null);
  const [data,     setData]     = useState({ declarations:[] });
  const [loading,  setLoading]  = useState(true);
  const [toggling, setToggling] = useState(false);
  const [tab,      setTab]      = useState("submissions");
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cyclesRes, declRes] = await Promise.all([
        getAllITCycles().catch(() => []),
        getAllITDeclarations().catch(() => ({ cycle:null, declarations:[] })),
      ]);
      // pick the most recent cycle as the "active" one to manage
      const all = Array.isArray(cyclesRes) ? cyclesRes : [];
      setCycle(all[0] || declRes.cycle || null);
      setData(declRes);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async () => {
    if (!cycle) return;
    setToggling(true);
    try {
      const updated = await toggleITCycle(cycle.cycle_id);
      setCycle(updated);
      load();
    }
    catch (e) { alert(e?.response?.data?.message || "Error"); }
    setToggling(false);
  };

  const isActive = cycle?.status === "active";

  const visible = useMemo(() => {
    let list = data.declarations || [];
    if (filter !== "all") list = list.filter(r => (r.declaration?.status || "not_started") === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.employee_name?.toLowerCase().includes(q) ||
        r.emp_code?.toLowerCase().includes(q) ||
        r.department_name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [data.declarations, filter, search]);

  const stats = useMemo(() => {
    const list = data.declarations || [];
    return {
      total:       list.length,
      submitted:   list.filter(r => r.declaration?.status === "submitted").length,
      approved:    list.filter(r => r.declaration?.status === "approved").length,
      rejected:    list.filter(r => r.declaration?.status === "rejected").length,
      not_started: list.filter(r => !r.declaration?.status || r.declaration?.status === "not_started").length,
    };
  }, [data.declarations]);

  return (
    <div style={{ minHeight:"100vh", background:"#f5f7fb", padding:24 }}>

      {/* Header banner */}
      <div style={{ background:`linear-gradient(135deg,${BRAND},#e07000)`, borderRadius:16,
        padding:"20px 24px", color:"#fff", marginBottom:20,
        display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <FileText size={28}/>
          <div>
            <h1 style={{ fontSize:20, fontWeight:700, margin:0 }}>IT Declaration</h1>
            <p style={{ fontSize:13, opacity:0.85, margin:"2px 0 0" }}>
              {cycle?.fy_label || "FY 2025-2026"} · {isActive ? "Active" : "Inactive"}
            </p>
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          {["submissions","settings"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding:"7px 18px", borderRadius:8, border:"none", cursor:"pointer",
                fontWeight:600, fontSize:13,
                background: tab===t ? "#fff" : "rgba(255,255,255,0.15)",
                color: tab===t ? BRAND : "#fff" }}>
              {t === "submissions" ? `Submissions (${stats.submitted + stats.approved})` : "Settings"}
            </button>
          ))}
        </div>
      </div>

      {/* ── SETTINGS TAB ── */}
      {tab === "settings" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:16 }}>
          {/* Toggle card */}
          <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:24,
            display:"flex", flexDirection:"column", alignItems:"center", gap:14, textAlign:"center" }}>
            {isActive
              ? <CheckCircle2 size={52} style={{ color:"#22c55e" }}/>
              : <Lock size={52} style={{ color:"#cbd5e1" }}/>}
            <div>
              <p style={{ fontSize:12, color:"#94a3b8", margin:"0 0 6px" }}>Current Status</p>
              <span style={{ fontSize:14, fontWeight:700, padding:"4px 16px", borderRadius:999,
                background: isActive ? "#dcfce7" : "#f1f5f9",
                color:      isActive ? "#15803d" : "#64748b" }}>
                {isActive ? "Declaration Open" : "Declaration Closed"}
              </span>
            </div>
            <div style={{ display:"flex", gap:8, width:"100%" }}>
              <button onClick={handleToggle} disabled={toggling || isActive}
                style={{ flex:1, padding:"9px 0", borderRadius:8, fontWeight:600, fontSize:13, cursor: isActive ? "default" : "pointer",
                  border:"1px solid #22c55e", background: isActive ? "#dcfce7" : "#fff",
                  color:"#15803d", opacity: isActive ? 0.6 : 1 }}>
                Enable
              </button>
              <button onClick={handleToggle} disabled={toggling || !isActive}
                style={{ flex:1, padding:"9px 0", borderRadius:8, fontWeight:600, fontSize:13, cursor: !isActive ? "default" : "pointer",
                  border:"1px solid #ef4444", background: !isActive ? "#f1f5f9" : "#fff",
                  color:"#dc2626", opacity: !isActive ? 0.4 : 1 }}>
                Disable
              </button>
            </div>
          </div>

          {/* Info card */}
          <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:24 }}>
            <h2 style={{ fontSize:15, fontWeight:700, color:"#1e293b", margin:"0 0 16px" }}>How it works</h2>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12 }}>
              {[
                { step:"1", label:"Enable cycle",       desc:"Click Enable to open the declaration window for all employees" },
                { step:"2", label:"Employee submits",   desc:"Employees fill IT Declaration (80C, HRA, etc.) and submit" },
                { step:"3", label:"Employee uploads",   desc:"Employees upload proof documents (PDF/JPG) via Proof of Investment" },
                { step:"4", label:"Admin reviews",      desc:"Review each submission here — Approve or Reject with remarks" },
              ].map(w => (
                <div key={w.step} style={{ padding:14, borderRadius:10, border:"1px solid #e2e8f0", background:"#f8fafc" }}>
                  <div style={{ width:26, height:26, borderRadius:"50%", background:BRAND, color:"#fff",
                    fontWeight:800, fontSize:12, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:8 }}>
                    {w.step}
                  </div>
                  <p style={{ fontSize:13, fontWeight:700, color:"#1e293b", margin:"0 0 4px" }}>{w.label}</p>
                  <p style={{ fontSize:12, color:"#64748b", margin:0 }}>{w.desc}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop:16, padding:"10px 14px", background:"#fff8f0", borderRadius:8, fontSize:12, color:"#92400e" }}>
              <strong>Current cycle:</strong> {cycle?.fy_label || "—"} &nbsp;·&nbsp;
              Deadline: {fmtDate(cycle?.end_date)}
            </div>
          </div>
        </div>
      )}

      {/* ── SUBMISSIONS TAB ── */}
      {tab === "submissions" && (
        <div>
          {/* Stats strip */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:20 }}>
            {[
              { label:"Total",       value:stats.total,       color:BRAND     },
              { label:"Submitted",   value:stats.submitted,   color:"#1d4ed8" },
              { label:"Approved",    value:stats.approved,    color:"#15803d" },
              { label:"Rejected",    value:stats.rejected,    color:"#dc2626" },
              { label:"Not Started", value:stats.not_started, color:"#94a3b8" },
            ].map(s => (
              <div key={s.label} style={{ background:"#fff", border:"1px solid #e2e8f0",
                borderRadius:12, padding:"14px 16px", textAlign:"center" }}>
                <p style={{ fontSize:22, fontWeight:800, color:s.color, margin:0 }}>{s.value}</p>
                <p style={{ fontSize:11, color:"#94a3b8", margin:0 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, overflow:"hidden" }}>
            <div style={{ padding:"14px 20px", borderBottom:"1px solid #f1f5f9",
              display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search employee, dept…"
                style={{ flex:1, minWidth:200, height:36, padding:"0 12px",
                  border:"1px solid #e2e8f0", borderRadius:8, fontSize:13, outline:"none" }}/>
              <select value={filter} onChange={e => setFilter(e.target.value)}
                style={{ height:36, padding:"0 10px", border:"1px solid #e2e8f0",
                  borderRadius:8, fontSize:13, outline:"none", background:"#fff" }}>
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="draft">Draft</option>
                <option value="not_started">Not Started</option>
              </select>
              <button onClick={load}
                style={{ height:36, padding:"0 14px", background:"#fff", border:"1px solid #e2e8f0",
                  borderRadius:8, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6, color:"#64748b" }}>
                <RefreshCw size={13}/> Refresh
              </button>
            </div>

            {loading ? (
              <div style={{ padding:48, textAlign:"center", color:"#94a3b8" }}>Loading…</div>
            ) : visible.length === 0 ? (
              <div style={{ padding:48, textAlign:"center", color:"#94a3b8" }}>
                <Users size={40} style={{ marginBottom:12, color:"#cbd5e1" }}/>
                <p style={{ margin:0 }}>No submissions found.</p>
              </div>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:"#f8fafc", borderBottom:"1px solid #e2e8f0" }}>
                      {["Employee","Job Title","Status","Total Declared","Submitted","Actions",""].map(h => (
                        <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:11,
                          fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.06em", whiteSpace:"nowrap" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map(row => <EmpRow key={row.employee_id} row={row} onRefresh={load} />)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
