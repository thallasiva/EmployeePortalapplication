import React, { useEffect, useState, useCallback } from "react";
import {
  Eye, EyeOff, ChevronUp, ChevronDown, User,
  LogOut, AlertTriangle, CheckCircle2, XCircle, Clock, X
} from "lucide-react";
import apiClient, { unwrap } from "../../../api/client";

/* ── helpers ──────────────────────────────────────────────────────────── */
const dash = (v) => (v && String(v).trim() ? v : "—");
const fmtDate = (d) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }); }
  catch { return d; }
};
const calcAge = (d) => {
  if (!d) return "";
  return `${Math.floor((Date.now() - new Date(d).getTime()) / (365.25*24*3600*1000))}y`;
};
const mask = (v, show) => {
  if (!v) return "—";
  if (show) return v;
  return "X".repeat(Math.max(String(v).length - 4, 4)) + String(v).slice(-4);
};
const noticeDays = (lwd) => {
  if (!lwd) return 0;
  return Math.max(0, Math.round((new Date(lwd) - new Date()) / (1000*60*60*24)));
};
const minDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};

const RESIGN_REASONS = [
  "Better Opportunity",
  "Personal Reasons",
  "Higher Studies",
  "Health Issues",
  "Relocation",
  "Retirement",
  "Family Commitment",
  "Salary Dissatisfaction",
  "Work Environment",
  "Other",
];

const STATUS_CFG = {
  pending:   { bg:"#fff7ed", border:"#f18200", color:"#c2410c", icon:<Clock size={16}/>,        label:"Resignation Pending Review" },
  accepted:  { bg:"#f0fdf4", border:"#22c55e", color:"#15803d", icon:<CheckCircle2 size={16}/>, label:"Resignation Accepted" },
  rejected:  { bg:"#fef2f2", border:"#ef4444", color:"#dc2626", icon:<XCircle size={16}/>,      label:"Resignation Rejected" },
  withdrawn: { bg:"#f8fafc", border:"#94a3b8", color:"#64748b", icon:<XCircle size={16}/>,      label:"Resignation Withdrawn" },
};

/* ── sub-components ───────────────────────────────────────────────────── */
function Field({ label, value, masked, show, onToggle, color }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:11, color:"#f18200", fontWeight:600,
        textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:3 }}>
        {label}
      </div>
      <div style={{ fontSize:13, color:color||"#1e293b", display:"flex",
        alignItems:"center", gap:6, fontWeight:500 }}>
        {masked ? mask(value, show) : dash(value)}
        {masked && value && (
          <button onClick={onToggle} style={{ background:"none", border:"none",
            cursor:"pointer", padding:0, color:"#94a3b8", display:"flex" }}>
            {show ? <EyeOff size={13}/> : <Eye size={13}/>}
          </button>
        )}
      </div>
    </div>
  );
}

function Card({ id, title, children, defaultOpen=true, action }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div id={id} style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:8, marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"12px 20px", borderBottom:open?"1px solid #f1f5f9":"none" }}>
        <span style={{ fontSize:12, fontWeight:700, letterSpacing:"0.08em",
          color:"#475569", textTransform:"uppercase" }}>{title}</span>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {action}
          <button onClick={() => setOpen(v => !v)} style={{ background:"none",
            border:"none", cursor:"pointer", color:"#94a3b8", display:"flex" }}>
            {open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>
        </div>
      </div>
      {open && <div style={{ padding:"16px 20px" }}>{children}</div>}
    </div>
  );
}

function Grid({ children, cols=3 }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap:"4px 16px" }}>
      {children}
    </div>
  );
}
function SectionLabel({ label, color="#64748b" }) {
  return (
    <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase",
      letterSpacing:"0.07em", color, marginBottom:10, marginTop:14 }}>
      {label}
    </div>
  );
}
function Badge({ children, color="#16a34a" }) {
  return (
    <span style={{ background:color+"18", color, border:`1px solid ${color}40`,
      borderRadius:4, padding:"2px 8px", fontSize:11, fontWeight:700 }}>
      {children}
    </span>
  );
}

/* ── Resign Modal ─────────────────────────────────────────────────────── */
function ResignModal({ onClose, onSubmit, saving }) {
  const [reason,  setReason]  = useState("");
  const [lwd,     setLwd]     = useState("");
  const [comments,setComments]= useState("");
  const [step,    setStep]    = useState(1); // 1=form, 2=confirm

  const notice = noticeDays(lwd);
  const canProceed = reason && lwd;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1200, background:"rgba(0,0,0,0.45)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:500,
        boxShadow:"0 24px 80px rgba(0,0,0,0.18)", overflow:"hidden" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#dc2626,#b91c1c)", padding:"20px 24px",
          display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:"50%", background:"rgba(255,255,255,0.15)",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <LogOut size={20} color="#fff"/>
            </div>
            <div>
              <p style={{ margin:0, fontSize:16, fontWeight:700, color:"#fff" }}>Initiate Resignation</p>
              <p style={{ margin:0, fontSize:12, color:"rgba(255,255,255,0.75)" }}>
                {step === 1 ? "Fill in your resignation details" : "Confirm your resignation"}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.8)" }}>
            <X size={20}/>
          </button>
        </div>

        {/* Steps indicator */}
        <div style={{ display:"flex", borderBottom:"1px solid #f1f5f9" }}>
          {["Resignation Details","Confirmation"].map((s, i) => (
            <div key={s} style={{ flex:1, padding:"10px 0", textAlign:"center",
              fontSize:12, fontWeight:step===i+1 ? 700 : 500,
              color:step===i+1 ? "#dc2626" : "#94a3b8",
              borderBottom:step===i+1 ? "2px solid #dc2626" : "2px solid transparent" }}>
              <span style={{ width:20, height:20, borderRadius:"50%", display:"inline-flex",
                alignItems:"center", justifyContent:"center", marginRight:6, fontSize:11,
                background:step===i+1 ? "#dc2626" : "#f1f5f9",
                color:step===i+1 ? "#fff" : "#94a3b8" }}>{i+1}</span>
              {s}
            </div>
          ))}
        </div>

        {/* Step 1 — Form */}
        {step === 1 && (
          <div style={{ padding:24 }}>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>
                Reason for Resignation <span style={{ color:"#ef4444" }}>*</span>
              </label>
              <select value={reason} onChange={e => setReason(e.target.value)}
                style={{ width:"100%", height:40, padding:"0 12px",
                  border:"1px solid #e2e8f0", borderRadius:8, fontSize:13,
                  outline:"none", background:"#fff", color: reason ? "#1e293b" : "#94a3b8" }}>
                <option value="">Select reason…</option>
                {RESIGN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>
                Last Working Day <span style={{ color:"#ef4444" }}>*</span>
              </label>
              <input type="date" value={lwd} min={minDate()} onChange={e => setLwd(e.target.value)}
                style={{ width:"100%", height:40, padding:"0 12px", boxSizing:"border-box",
                  border:"1px solid #e2e8f0", borderRadius:8, fontSize:13, outline:"none" }}/>
            </div>

            {lwd && (
              <div style={{ background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:8,
                padding:"10px 14px", marginBottom:16, display:"flex", gap:10, alignItems:"flex-start" }}>
                <Clock size={15} color="#f18200" style={{ marginTop:1, flexShrink:0 }}/>
                <div>
                  <p style={{ margin:0, fontSize:12, fontWeight:700, color:"#c2410c" }}>
                    Notice Period: {notice} day{notice !== 1 ? "s" : ""}
                  </p>
                  <p style={{ margin:"2px 0 0", fontSize:11, color:"#92400e" }}>
                    Serving from today until {fmtDate(lwd)}
                  </p>
                </div>
              </div>
            )}

            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>
                Additional Comments <span style={{ fontSize:11, color:"#94a3b8", fontWeight:400 }}>(optional)</span>
              </label>
              <textarea value={comments} onChange={e => setComments(e.target.value)} rows={3}
                placeholder="Share any additional context or message for HR…"
                style={{ width:"100%", padding:"10px 12px", border:"1px solid #e2e8f0",
                  borderRadius:8, fontSize:13, outline:"none", resize:"vertical",
                  boxSizing:"border-box", fontFamily:"inherit", color:"#1e293b" }}/>
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => canProceed && setStep(2)} disabled={!canProceed}
                style={{ flex:1, padding:"11px 0", borderRadius:8, fontWeight:700, fontSize:13,
                  border:"none", cursor:canProceed ? "pointer" : "not-allowed",
                  background:canProceed ? "#dc2626" : "#f1f5f9",
                  color:canProceed ? "#fff" : "#94a3b8" }}>
                Next: Review →
              </button>
              <button onClick={onClose}
                style={{ padding:"11px 18px", borderRadius:8, fontSize:13, fontWeight:600,
                  border:"1px solid #e2e8f0", background:"#fff", color:"#64748b", cursor:"pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Confirm */}
        {step === 2 && (
          <div style={{ padding:24 }}>
            {/* Warning banner */}
            <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10,
              padding:"14px 16px", marginBottom:20, display:"flex", gap:10, alignItems:"flex-start" }}>
              <AlertTriangle size={18} color="#dc2626" style={{ marginTop:1, flexShrink:0 }}/>
              <div>
                <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#dc2626" }}>
                  This action cannot be easily undone
                </p>
                <p style={{ margin:"3px 0 0", fontSize:12, color:"#7f1d1d" }}>
                  Your resignation will be sent to HR for review. You may withdraw it while it's pending.
                </p>
              </div>
            </div>

            {/* Summary */}
            <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10,
              padding:"16px 18px", marginBottom:20 }}>
              <p style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase",
                letterSpacing:"0.07em", margin:"0 0 12px" }}>Resignation Summary</p>
              {[
                ["Reason",          reason],
                ["Last Working Day", fmtDate(lwd)],
                ["Notice Period",    `${notice} day${notice !== 1 ? "s" : ""}`],
                ...(comments ? [["Comments", comments]] : []),
              ].map(([k, v]) => (
                <div key={k} style={{ display:"flex", gap:12, marginBottom:8 }}>
                  <span style={{ fontSize:12, color:"#94a3b8", width:130, flexShrink:0 }}>{k}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:"#1e293b" }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => onSubmit({ reason, last_working_day:lwd, comments })}
                disabled={saving}
                style={{ flex:1, padding:"11px 0", borderRadius:8, fontWeight:700, fontSize:13,
                  border:"none", cursor:saving ? "not-allowed" : "pointer",
                  background:"#dc2626", color:"#fff" }}>
                {saving ? "Submitting…" : "Confirm Resignation"}
              </button>
              <button onClick={() => setStep(1)} disabled={saving}
                style={{ padding:"11px 18px", borderRadius:8, fontSize:13, fontWeight:600,
                  border:"1px solid #e2e8f0", background:"#fff", color:"#64748b", cursor:"pointer" }}>
                ← Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Resignation status card ──────────────────────────────────────────── */
function ResignationStatus({ data, onWithdraw, withdrawing }) {
  const cfg = STATUS_CFG[data.status] || STATUS_CFG.pending;
  return (
    <div style={{ border:`1px solid ${cfg.border}`, borderRadius:10, padding:"14px 18px",
      background:cfg.bg, marginTop:16 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <span style={{ color:cfg.color }}>{cfg.icon}</span>
        <span style={{ fontSize:14, fontWeight:700, color:cfg.color }}>{cfg.label}</span>
        {data.status === "pending" && (
          <button onClick={onWithdraw} disabled={withdrawing}
            style={{ marginLeft:"auto", fontSize:11, padding:"4px 12px", borderRadius:6,
              border:`1px solid ${cfg.border}`, background:"#fff", color:cfg.color,
              fontWeight:600, cursor:"pointer" }}>
            {withdrawing ? "Withdrawing…" : "Withdraw"}
          </button>
        )}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px 16px" }}>
        {[
          ["Reason",           data.reason],
          ["Last Working Day", fmtDate(data.last_working_day)],
          ["Notice Period",    `${data.notice_period} days`],
          ["Submitted",        fmtDate(data.created_at)],
          ...(data.reviewed_at ? [["Reviewed", fmtDate(data.reviewed_at)]] : []),
          ...(data.reviewed_by_name ? [["Reviewed By", data.reviewed_by_name]] : []),
        ].map(([k, v]) => (
          <div key={k}>
            <p style={{ fontSize:10, color:"#94a3b8", fontWeight:600, textTransform:"uppercase",
              letterSpacing:"0.05em", margin:"0 0 2px" }}>{k}</p>
            <p style={{ fontSize:12, fontWeight:600, color:"#1e293b", margin:0 }}>{v}</p>
          </div>
        ))}
      </div>
      {data.admin_remarks && (
        <div style={{ marginTop:12, padding:"8px 12px", borderRadius:7,
          background:"rgba(0,0,0,0.04)", fontSize:12, color:"#334155" }}>
          <strong>HR Remarks:</strong> {data.admin_remarks}
        </div>
      )}
      {data.comments && (
        <div style={{ marginTop:8, fontSize:12, color:"#64748b" }}>
          <strong>Your message:</strong> {data.comments}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════ */
const SIDEBAR = [
  { id:"personal",   label:"Personal" },
  { id:"statutory",  label:"Accounts & Statutory" },
  { id:"family",     label:"Family" },
  { id:"employment", label:"Employment & Job" },
  { id:"assets",     label:"Assets" },
];

export default function MyInfo() {
  const [profile,     setProfile]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [activeSection, setActive]    = useState("personal");
  const [revealed,    setRevealed]    = useState({});

  // Resign state
  const [resignation,  setResignation]  = useState(null);
  const [showModal,    setShowModal]    = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [withdrawing,  setWithdrawing]  = useState(false);

  const toggle = (key) => setRevealed(r => ({ ...r, [key]: !r[key] }));

  const loadResignation = useCallback(async () => {
    try {
      const res = await apiClient.get("/resignations/my");
      setResignation(res.data || null);
    } catch { setResignation(null); }
  }, []);

  useEffect(() => {
    apiClient.get("/employees/me").then(unwrap)
      .then(setProfile)
      .catch(e => setError(e?.response?.data?.message || "Failed to load profile"))
      .finally(() => setLoading(false));
    loadResignation();
  }, [loadResignation]);

  const handleResign = async (body) => {
    setSaving(true);
    try {
      const res = await apiClient.post("/resignations/my", body);
      setResignation(res.data);
      setShowModal(false);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to submit resignation");
    }
    setSaving(false);
  };

  const handleWithdraw = async () => {
    if (!window.confirm("Are you sure you want to withdraw your resignation?")) return;
    setWithdrawing(true);
    try {
      const res = await apiClient.put("/resignations/my/withdraw");
      setResignation(res.data);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to withdraw");
    }
    setWithdrawing(false);
  };

  const scrollTo = (id) => {
    setActive(id);
    document.getElementById("section-" + id)?.scrollIntoView({ behavior:"smooth", block:"start" });
  };

  const jumpLinks = {
    personal:   ["Profile","Personal","Address","Education"],
    statutory:  ["Bank Account","PF Account","Passport and Visa","Other IDs"],
    family:     [],
    employment: ["Employment","Job"],
    assets:     ["Access card details"],
  };

  // Resign button — shown in Employment card header
  const canResign = !resignation || ["rejected","withdrawn"].includes(resignation?.status);
  const resignBtn = (
    <button onClick={() => setShowModal(true)}
      style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px",
        background:"#fef2f2", border:"1px solid #fecaca", borderRadius:7,
        color:"#dc2626", fontWeight:700, fontSize:12, cursor:"pointer" }}>
      <LogOut size={13}/> Resign
    </button>
  );

  if (loading) return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:300 }}>
      <div style={{ color:"#f18200", fontSize:14 }}>Loading…</div>
    </div>
  );
  if (error) return (
    <div style={{ padding:40, color:"#ef4444", textAlign:"center" }}>{error}</div>
  );

  const e   = profile || {};
  const ci  = e.contactInfo  || {};
  const bd  = e.bankDetails  || {};
  const emp_name = [e.first_name, e.last_name].filter(Boolean).join(" ") || "—";

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f8fafc", fontFamily:"inherit" }}>

      {/* ── Sidebar ── */}
      <div style={{ width:200, flexShrink:0, background:"#fff", borderRight:"1px solid #e2e8f0",
        padding:"20px 0", position:"sticky", top:0, height:"100vh", overflowY:"auto" }}>
        {SIDEBAR.map(s => (
          <button key={s.id} onClick={() => scrollTo(s.id)}
            style={{ display:"block", width:"100%", textAlign:"left",
              padding:"9px 20px", border:"none", background:"none", cursor:"pointer",
              fontSize:13, fontWeight:activeSection===s.id ? 700 : 400,
              color:activeSection===s.id ? "#f18200" : "#475569",
              borderLeft:activeSection===s.id ? "3px solid #f18200" : "3px solid transparent" }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Main ── */}
      <div style={{ flex:1, padding:"20px 28px", overflowY:"auto", maxWidth:1100 }}>

        {/* JUMP TO bar */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16,
          fontSize:12, color:"#94a3b8" }}>
          <span style={{ fontWeight:600 }}>JUMP TO</span>
          {(jumpLinks[activeSection]||[]).map(lbl => (
            <button key={lbl} onClick={() => {
              const el = document.getElementById("card-" + lbl.toLowerCase().replace(/ /g,"-"));
              el?.scrollIntoView({ behavior:"smooth", block:"start" });
            }} style={{ background:"none", border:"none", cursor:"pointer",
              color:"#f18200", fontWeight:600, fontSize:12 }}>
              {lbl}
            </button>
          ))}
        </div>

        {/* ═══════ PERSONAL ═══════ */}
        <div id="section-personal">
          <Card id="card-profile" title="Profile">
            <div style={{ display:"flex", gap:24, alignItems:"flex-start" }}>
              <div style={{ width:70, height:70, borderRadius:"50%", overflow:"hidden",
                background:"#f1f5f9", flexShrink:0, display:"flex", alignItems:"center",
                justifyContent:"center", border:"2px solid #e2e8f0" }}>
                {e.profile_photo
                  ? <img src={e.profile_photo} alt="avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  : <User size={30} color="#94a3b8"/>}
              </div>
              <div style={{ flex:1 }}>
                <Grid cols={3}>
                  <Field label="Name" value={emp_name}/>
                  <Field label="Employee ID" value={e.emp_code}/>
                  <Field label="Company Email" value={e.email} color="#f18200"/>
                  <Field label="Location" value={e.location}/>
                  <Field label="Primary Contact No." value={e.mobile} masked show={revealed.mobile} onToggle={() => toggle("mobile")}/>
                  <Field label="Extension" value={null}/>
                </Grid>
              </div>
            </div>
          </Card>

          <Card id="card-personal" title="Personal">
            <Grid cols={3}>
              <Field label="Blood Group" value={e.blood_group} masked show={revealed.blood_group} onToggle={() => toggle("blood_group")}/>
              <Field label="Date of Birth" value={e.dob ? `${fmtDate(e.dob)} (${calcAge(e.dob)})` : null} masked show={revealed.dob} onToggle={() => toggle("dob")}/>
              <Field label="Nationality" value="Indian"/>
              <Field label="Marital Status" value={e.marital_status} masked show={revealed.marital_status} onToggle={() => toggle("marital_status")}/>
              <Field label="Marriage Date" value={null}/>
              <Field label="Spouse" value={e.spouse_name}/>
              <Field label="Place of Birth" value={null}/>
              <Field label="Residential Status" value={null}/>
              <Field label="Father Name" value={e.father_name}/>
              <Field label="Religion" value={null}/>
              <Field label="Physically Challenged" value="No"/>
              <Field label="International Employee" value="No"/>
              <Field label="Height" value={null}/>
              <Field label="Weight" value={null}/>
              <Field label="Identification Mark" value={null}/>
              <Field label="Hobby" value={null}/>
              <Field label="Caste" value={null}/>
            </Grid>
          </Card>

          <Card id="card-address" title="Address">
            <div style={{ marginBottom:12 }}>
              <span style={{ fontSize:12, background:"#f1f5f9", border:"1px solid #e2e8f0",
                borderRadius:6, padding:"5px 12px", color:"#475569", fontWeight:600 }}>
                Emergency Contact / Address ▾
              </span>
            </div>
            <Grid cols={3}>
              <Field label="Address" value={ci.current_address}/>
              <Field label="Name" value={ci.emergency_contact_name}/>
              <Field label="Email" value={ci.personal_email}/>
              <Field label="Phone 1" value={null}/>
              <Field label="Phone 2" value={null}/>
              <Field label="Mobile" value={ci.emergency_contact_phone} masked show={revealed.ec_mobile} onToggle={() => toggle("ec_mobile")}/>
              <Field label="Extension" value={null}/>
              <Field label="Fax" value={null}/>
              <Field label="Relationship" value={ci.emergency_contact_relation}/>
            </Grid>
          </Card>

          <Card id="card-education" title="Education">
            {e.educational_qualification ? (
              <Grid cols={3}>
                <Field label="Degree" value={e.educational_qualification}/>
                <Field label="Duration" value={null}/>
                <Field label="Institute" value={null}/>
                <Field label="Grade" value={null}/>
              </Grid>
            ) : (
              <p style={{ color:"#94a3b8", fontSize:13 }}>No education records found.</p>
            )}
          </Card>
        </div>

        {/* ═══════ ACCOUNTS & STATUTORY ═══════ */}
        <div id="section-statutory" style={{ marginTop:8 }}>
          <Card id="card-bank-account" title="Bank Account">
            {bd.bank_name ? (
              <Grid cols={4}>
                <Field label="Bank Name" value={bd.bank_name}/>
                <Field label="Bank Account Number" value={bd.account_number} masked show={revealed.acc_no} onToggle={() => toggle("acc_no")}/>
                <Field label="Bank Branch" value={bd.bank_branch}/>
                <Field label="IFSC Code" value={bd.ifsc_code}/>
              </Grid>
            ) : (
              <p style={{ color:"#94a3b8", fontSize:13 }}>No bank account linked.</p>
            )}
          </Card>

          <Card id="card-pf-account" title="PF Account">
            <Grid cols={3}>
              <Field label="PF Number" value={bd.pf_number || e.pf_number}/>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, color:"#f18200", fontWeight:600,
                  textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>Eligibility</div>
                <Badge color="#16a34a">ELIGIBLE</Badge>
              </div>
              <Field label="UAN" value={bd.uan_number}/>
              <Field label="PF Join Date" value={fmtDate(e.pf_join_date)}/>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, color:"#f18200", fontWeight:600,
                  textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>KYC Status</div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <input type="checkbox" readOnly checked={false} style={{ accentColor:"#f18200" }}/>
                  <span style={{ fontSize:13, color:"#64748b" }}>Not Done</span>
                </div>
              </div>
              <Field label="KYC Document" value={null}/>
            </Grid>
          </Card>

          <Card id="card-passport-and-visa" title="Passport and Visa">
            <SectionLabel label="Passport"/>
            <p style={{ color:"#f18200", fontSize:13, margin:"0 0 12px" }}>No data Found.</p>
            <SectionLabel label="Visa"/>
            <p style={{ color:"#f18200", fontSize:13, margin:0 }}>No data Found.</p>
          </Card>

          <Card id="card-other-ids" title="Other IDs">
            {[
              { label:"AADHAAR",                       value:e.aadhaar_number,              key:"aadhaar", verified:false },
              { label:"Bank Details for Identification",value:bd.account_number,            key:"bankid",  verified:true  },
              { label:"Permanent Account Number",       value:bd.pan_number||e.pan_number,  key:"pan",     verified:false },
            ].map(row => (
              <div key={row.label} style={{ display:"flex", alignItems:"center",
                padding:"12px 0", borderBottom:"1px solid #f1f5f9", gap:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:"#f18200", fontWeight:600,
                    textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:3 }}>{row.label}</div>
                  <div style={{ fontSize:13, color:"#1e293b", display:"flex", alignItems:"center", gap:6 }}>
                    {mask(row.value, revealed[row.key])}
                    {row.value && (
                      <button onClick={() => toggle(row.key)} style={{ background:"none",
                        border:"none", cursor:"pointer", color:"#94a3b8", display:"flex" }}>
                        {revealed[row.key] ? <EyeOff size={12}/> : <Eye size={12}/>}
                      </button>
                    )}
                  </div>
                </div>
                <Badge color={row.verified ? "#16a34a" : "#f18200"}>
                  {row.verified ? "Verified" : "Unverified"}
                </Badge>
                <button style={{ background:"none", border:"none", cursor:"pointer",
                  color:"#f18200", fontWeight:600, fontSize:12 }}>More</button>
              </div>
            ))}
          </Card>
        </div>

        {/* ═══════ FAMILY ═══════ */}
        <div id="section-family" style={{ marginTop:8 }}>
          <p style={{ color:"#94a3b8", fontSize:13, padding:"12px 0" }}>
            No family members added yet. Contact HR to update family details.
          </p>
        </div>

        {/* ═══════ EMPLOYMENT & JOB ═══════ */}
        <div id="section-employment" style={{ marginTop:8 }}>
          <Card id="card-employment" title="Employment"
            action={canResign ? resignBtn : null}>
            <Grid cols={3}>
              <Field label="Employee Type"   value={e.employee_type}/>
              <Field label="Employee Status" value={e.employee_status}/>
              <Field label="Joining Date"    value={fmtDate(e.emp_joining_date)}/>
              <Field label="Department"      value={e.department_name}/>
              <Field label="Designation"     value={e.designation_name || e.emp_job_title}/>
              <Field label="Reporting To"    value={e.manager_name}/>
              <Field label="Location"        value={e.location}/>
              <Field label="Shift"           value={e.shift}/>
              <Field label="Holiday Calendar" value={e.holiday_calendar}/>
            </Grid>

            {/* ── Resignation Status ── */}
            {resignation && (
              <ResignationStatus
                data={resignation}
                onWithdraw={handleWithdraw}
                withdrawing={withdrawing}
              />
            )}
          </Card>
        </div>

        {/* ═══════ ASSETS ═══════ */}
        <div id="section-assets" style={{ marginTop:8 }}>
          <Card id="card-access-card-details" title="Access Card Details">
            {e.access_card_number ? (
              <Grid cols={2}>
                <Field label="Card No" value={e.access_card_number}/>
                <Field label="Validity"
                  value={`${fmtDate(e.access_card_from_date)} – ${e.access_card_to_date ? fmtDate(e.access_card_to_date) : "ongoing"}`}/>
                <div style={{ gridColumn:"1 / -1" }}>
                  <SectionLabel label="Previous"/>
                  <p style={{ color:"#f18200", fontSize:13, margin:0 }}>No data Found.</p>
                </div>
              </Grid>
            ) : (
              <>
                <p style={{ color:"#94a3b8", fontSize:13, margin:"0 0 12px" }}>No access card assigned.</p>
                <SectionLabel label="Previous"/>
                <p style={{ color:"#f18200", fontSize:13, margin:0 }}>No data Found.</p>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* ── Resign Modal ── */}
      {showModal && (
        <ResignModal
          onClose={() => setShowModal(false)}
          onSubmit={handleResign}
          saving={saving}
        />
      )}
    </div>
  );
}
