import React, { useEffect, useState } from "react";
import { Star, CheckCircle2, Lock, Send, Save, AlertCircle, ChevronDown, ChevronUp, UserCheck } from "lucide-react";
import { getMyAppraisal, saveMyAppraisal } from "../../../api/appraisal.api";

const BRAND = "#f18200";

function fmtDate(v) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
}

function StarPicker({ value, onChange, disabled }) {
  const [hover, setHover] = useState(0);
  const labels = ["","Poor","Fair","Good","Very Good","Excellent"];
  return (
    <span style={{ display:"flex", alignItems:"center", gap:4 }}>
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={22}
          onClick={() => !disabled && onChange(n)}
          onMouseEnter={() => !disabled && setHover(n)}
          onMouseLeave={() => setHover(0)}
          style={{ cursor:disabled?"default":"pointer",
            color:(hover||value)>=n?BRAND:"#e2e8f0",
            fill:(hover||value)>=n?BRAND:"#e2e8f0",
            transition:"color 0.1s" }} />
      ))}
      {value > 0 && (
        <span style={{ fontSize:12, fontWeight:600, color:BRAND, marginLeft:6 }}>{labels[value]}</span>
      )}
    </span>
  );
}

function StarDisplay({ value, color = BRAND, size = 16 }) {
  return (
    <span style={{ display:"flex", alignItems:"center", gap:3 }}>
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={size}
          style={{ color: n <= value ? color : "#e2e8f0", fill: n <= value ? color : "#e2e8f0" }} />
      ))}
      <span style={{ fontSize:12, color:"#64748b", marginLeft:4 }}>{value}/5</span>
    </span>
  );
}

function ParamCard({ param, idx, rating, onChange, disabled }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, overflow:"hidden", marginBottom:10 }}>
      <button type="button" onClick={() => setOpen(o=>!o)}
        style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"13px 18px", background:"none", border:"none", cursor:"pointer", textAlign:"left" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:`${BRAND}18`, color:BRAND,
            display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13 }}>{idx}</div>
          <span style={{ fontSize:14, fontWeight:600, color:"#1e293b" }}>{param.label}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {(rating.self_rating||0) > 0 && (
            <span style={{ fontSize:11, fontWeight:700, color:BRAND, background:`${BRAND}12`,
              padding:"2px 8px", borderRadius:999 }}>★ {rating.self_rating}/5</span>
          )}
          {open ? <ChevronUp size={15} style={{ color:"#94a3b8" }}/> : <ChevronDown size={15} style={{ color:"#94a3b8" }}/>}
        </div>
      </button>
      {open && (
        <div style={{ padding:"0 18px 16px" }}>
          <p style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase",
            letterSpacing:"0.06em", margin:"0 0 8px" }}>Your Rating</p>
          <StarPicker value={rating.self_rating||0} onChange={v=>onChange({...rating,self_rating:v})} disabled={disabled} />
          <p style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase",
            letterSpacing:"0.06em", margin:"12px 0 6px" }}>Comments (Optional)</p>
          <textarea value={rating.self_comments||""} disabled={disabled}
            onChange={e=>onChange({...rating,self_comments:e.target.value})}
            placeholder="Describe your performance with examples…" rows={2}
            style={{ width:"100%", border:"1px solid #e2e8f0", borderRadius:8, padding:"8px 12px",
              fontSize:13, outline:"none", resize:"vertical", boxSizing:"border-box",
              background:disabled?"#f8fafc":"#fff", color:"#374151" }} />
        </div>
      )}
    </div>
  );
}

/* ── Manager Feedback Section ───────────────────────────────────────────── */
function ManagerFeedback({ ratings, params }) {
  const reviewed = ratings.filter(r => r.manager_rating);
  if (!reviewed.length) return null;

  const avgMgr = (reviewed.reduce((s,r) => s + r.manager_rating, 0) / reviewed.length).toFixed(1);

  return (
    <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12,
      overflow:"hidden", marginBottom:20 }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#6366f1,#4f46e5)", padding:"14px 18px",
        display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <UserCheck size={20} style={{ color:"#fff" }} />
          <div>
            <p style={{ fontSize:14, fontWeight:700, color:"#fff", margin:0 }}>Manager's Review</p>
            <p style={{ fontSize:11, opacity:0.8, color:"#fff", margin:0 }}>
              Your reporting manager has submitted feedback
            </p>
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <p style={{ fontSize:22, fontWeight:800, color:"#fff", margin:0 }}>{avgMgr}</p>
          <p style={{ fontSize:10, color:"rgba(255,255,255,0.7)", margin:0 }}>Overall Avg / 5</p>
        </div>
      </div>

      {/* Per-parameter manager ratings */}
      <div style={{ padding:"16px 18px" }}>
        <div style={{ display:"grid", gap:10 }}>
          {params.map(p => {
            const r = ratings.find(x => x.parameter_key === p.key);
            if (!r || !r.manager_rating) return null;
            return (
              <div key={p.key} style={{ background:"#f8fafc", border:"1px solid #e2e8f0",
                borderRadius:10, padding:"12px 14px" }}>
                <p style={{ fontSize:13, fontWeight:600, color:"#1e293b", margin:"0 0 8px" }}>
                  {p.label}
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  {/* Self */}
                  <div>
                    <p style={{ fontSize:11, fontWeight:700, color:"#94a3b8",
                      textTransform:"uppercase", letterSpacing:"0.05em", margin:"0 0 5px" }}>Your Rating</p>
                    <StarDisplay value={r.self_rating || 0} color={BRAND} />
                    {r.self_comments && (
                      <p style={{ fontSize:11, color:"#64748b", margin:"5px 0 0", fontStyle:"italic" }}>
                        "{r.self_comments}"
                      </p>
                    )}
                  </div>
                  {/* Manager */}
                  <div>
                    <p style={{ fontSize:11, fontWeight:700, color:"#6366f1",
                      textTransform:"uppercase", letterSpacing:"0.05em", margin:"0 0 5px" }}>Manager's Rating</p>
                    <StarDisplay value={r.manager_rating} color="#6366f1" />
                    {r.manager_comments && (
                      <p style={{ fontSize:11, color:"#4338ca", margin:"5px 0 0", fontStyle:"italic",
                        background:"#eef2ff", padding:"6px 10px", borderRadius:6 }}>
                        "{r.manager_comments}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function SelfAppraisal() {
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [cycle,     setCycle]     = useState(null);
  const [appraisal, setAppraisal] = useState(null);
  const [params,    setParams]    = useState([]);
  const [ratings,   setRatings]   = useState({});
  const [rawRatings, setRawRatings] = useState([]);
  const [overall,   setOverall]   = useState("");
  const [toast,     setToast]     = useState(null);
  const [enrolled,  setEnrolled]  = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const d = await getMyAppraisal();
      setCycle(d.cycle);
      setAppraisal(d.appraisal);
      setEnrolled(d.enrolled !== false);
      setParams(d.parameters || []);
      setRawRatings(d.ratings || []);
      const map = {};
      (d.parameters||[]).forEach(p => { map[p.key]={self_rating:0,self_comments:""}; });
      (d.ratings||[]).forEach(r => { map[r.parameter_key]={self_rating:r.self_rating||0,self_comments:r.self_comments||""}; });
      setRatings(map);
      setOverall(d.appraisal?.overall_comments||"");
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const isSubmitted = appraisal?.status === "submitted";
  const isActive    = cycle?.status === "active";
  const rated       = params.filter(p=>(ratings[p.key]?.self_rating||0)>0).length;
  const allRated    = rated === params.length && params.length > 0;
  const avgRating   = params.length > 0
    ? (params.reduce((s,p)=>s+(ratings[p.key]?.self_rating||0),0)/params.length).toFixed(1)
    : 0;

  const notify = (msg, type="success") => {
    setToast({msg,type}); setTimeout(()=>setToast(null),3000);
  };

  const handleSave = async (submit=false) => {
    setSaving(true);
    try {
      const ratingsArr = params.map(p=>({
        parameter_key:p.key, parameter_label:p.label, ...ratings[p.key]
      }));
      const d = await saveMyAppraisal({ ratings:ratingsArr, overall_comments:overall, submit });
      setAppraisal(d.appraisal);
      setRawRatings(d.ratings || []);
      notify(submit ? "Appraisal submitted!" : "Draft saved.");
    } catch(e) {
      notify(e?.response?.data?.message||"Failed to save.","error");
    }
    setSaving(false);
  };

  if (loading) return (
    <div style={{ padding:60, textAlign:"center", color:"#94a3b8", fontSize:14 }}>Loading…</div>
  );

  if (!cycle || !isActive) return (
    <div style={{ minHeight:"60vh", display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", gap:16, padding:40, textAlign:"center" }}>
      <div style={{ width:72, height:72, borderRadius:"50%", background:"#f1f5f9",
        display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Lock size={32} style={{ color:"#cbd5e1" }} />
      </div>
      <h2 style={{ fontSize:18, fontWeight:700, color:"#1e293b", margin:0 }}>No Active Appraisal</h2>
      <p style={{ fontSize:14, color:"#64748b", margin:0 }}>
        Your HR team hasn't rolled out a performance appraisal yet.<br/>
        You'll see your form here once it's live.
      </p>
    </div>
  );

  if (!enrolled) return (
    <div style={{ minHeight:"60vh", display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", gap:16, padding:40, textAlign:"center" }}>
      <div style={{ width:72, height:72, borderRadius:"50%", background:"#fff7ed",
        display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Lock size={32} style={{ color:BRAND }} />
      </div>
      <h2 style={{ fontSize:18, fontWeight:700, color:"#1e293b", margin:0 }}>Appraisal Not Yet Assigned</h2>
      <p style={{ fontSize:14, color:"#64748b", margin:0, maxWidth:380 }}>
        Your HR admin hasn't enrolled you in the {cycle.fy_label} appraisal cycle yet.<br/>
        Please check back later or contact your HR team.
      </p>
    </div>
  );

  return (
    <div style={{  margin:"0 auto", padding:"24px 16px" }}>
      {toast && (
        <div style={{ position:"fixed", top:20, right:20, zIndex:999,
          background:toast.type==="error"?"#fef2f2":"#f0fdf4",
          border:`1px solid ${toast.type==="error"?"#fca5a5":"#86efac"}`,
          borderRadius:10, padding:"10px 18px", fontSize:13, fontWeight:600,
          color:toast.type==="error"?"#dc2626":"#15803d",
          boxShadow:"0 4px 12px rgba(0,0,0,0.1)" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,${BRAND},#e07000)`,
        borderRadius:14, padding:"18px 22px", color:"#fff", marginBottom:20 }}>
        <h1 style={{ fontSize:18, fontWeight:700, margin:"0 0 4px" }}>Self Performance Appraisal</h1>
        <p style={{ fontSize:13, opacity:0.85, margin:0 }}>
          {cycle.fy_label} · Deadline: {fmtDate(cycle.deadline)}
        </p>
      </div>

      {/* Status */}
      {isSubmitted && (
        <div style={{ background:"#f0fdf4", border:"1px solid #86efac", borderRadius:10,
          padding:"12px 16px", display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          <CheckCircle2 size={20} style={{ color:"#22c55e" }} />
          <div>
            <p style={{ fontWeight:700, color:"#15803d", margin:0, fontSize:14 }}>Submitted</p>
            <p style={{ fontSize:12, color:"#16a34a", margin:0 }}>
              Submitted {fmtDate(appraisal.submitted_at)} · Your manager will review shortly.
            </p>
          </div>
        </div>
      )}
      {!isSubmitted && appraisal?.status==="draft" && (
        <div style={{ background:"#fefce8", border:"1px solid #fde68a", borderRadius:10,
          padding:"12px 16px", display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          <AlertCircle size={16} style={{ color:"#d97706" }} />
          <p style={{ fontSize:13, color:"#92400e", margin:0 }}>
            Draft saved — complete all {params.length} ratings and submit before {fmtDate(cycle.deadline)}.
          </p>
        </div>
      )}

      {/* Progress bar */}
      <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12,
        padding:"14px 18px", marginBottom:18, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:11, color:"#94a3b8", margin:"0 0 6px" }}>Progress: {rated}/{params.length} parameters rated</p>
          <div style={{ height:6, background:"#f1f5f9", borderRadius:999 }}>
            <div style={{ width:`${(rated/Math.max(params.length,1))*100}%`,
              height:"100%", background:BRAND, borderRadius:999, transition:"width 0.3s" }} />
          </div>
        </div>
        {avgRating > 0 && (
          <div style={{ textAlign:"center", minWidth:60 }}>
            <p style={{ fontSize:24, fontWeight:800, color:BRAND, margin:0 }}>{avgRating}</p>
            <p style={{ fontSize:10, color:"#94a3b8", margin:0 }}>Avg / 5</p>
          </div>
        )}
      </div>

      {/* Parameter cards */}
      {params.map((p,i) => (
        <ParamCard key={p.key} param={p} idx={i+1}
          rating={ratings[p.key]||{self_rating:0,self_comments:""}}
          onChange={r => setRatings(prev=>({...prev,[p.key]:r}))}
          disabled={isSubmitted} />
      ))}

      {/* Overall comments */}
      <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:18, marginBottom:20 }}>
        <p style={{ fontSize:13, fontWeight:700, color:"#1e293b", margin:"0 0 10px" }}>Overall Comments</p>
        <textarea value={overall} onChange={e=>setOverall(e.target.value)} disabled={isSubmitted}
          placeholder="Summarize your achievements, challenges, and goals…" rows={4}
          style={{ width:"100%", border:"1px solid #e2e8f0", borderRadius:8, padding:"10px 12px",
            fontSize:13, color:"#374151", outline:"none", resize:"vertical", boxSizing:"border-box",
            background:isSubmitted?"#f8fafc":"#fff" }} />
      </div>

      {/* Manager Feedback — shown after manager reviews */}
      {isSubmitted && rawRatings.some(r => r.manager_rating) && (
        <ManagerFeedback ratings={rawRatings} params={params} />
      )}

      {/* Actions */}
      {!isSubmitted && (
        <div style={{ display:"flex", gap:12, justifyContent:"flex-end" }}>
          <button onClick={()=>handleSave(false)} disabled={saving}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 20px",
              borderRadius:8, border:"1px solid #e2e8f0", background:"#fff",
              color:"#374151", fontWeight:600, fontSize:13, cursor:"pointer" }}>
            <Save size={14}/>{saving?"Saving…":"Save Draft"}
          </button>
          <button onClick={()=>handleSave(true)} disabled={saving||!allRated}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 20px",
              borderRadius:8, border:"none",
              background:allRated?BRAND:"#e2e8f0",
              color:allRated?"#fff":"#94a3b8",
              fontWeight:600, fontSize:13,
              cursor:allRated?"pointer":"not-allowed" }}>
            <Send size={14}/>{saving?"Submitting…":"Submit Appraisal"}
          </button>
        </div>
      )}
    </div>
  );
}
