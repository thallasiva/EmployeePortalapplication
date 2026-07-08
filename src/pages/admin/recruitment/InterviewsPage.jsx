import React, { useState, useEffect, useCallback } from "react";
import { Plus, MessageSquare, Loader2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import {
  PageHeader, Card, Btn, Field, Input, Select, Textarea,
  Modal, SlideOver, SearchBar, TwoColGrid, DetailRow,
} from "./shared";
import { INTERVIEW_LEVELS, INTERVIEW_TYPES, FEEDBACK_STATUSES } from "./mockData";
import {
  listInterviews, scheduleInterview, submitFeedback as apiSubmitFeedback,
  listCandidates, listJobs, getErrorMessage,
} from "../../../api/recruitment.api";
import { successToast, errorToast } from "../../../utils/ToastControllers";

const BLANK_INT = {
  candidateId: "", jobReqId: "", level: "Round 1", interviewType: "Video Call",
  interviewDate: "", interviewTime: "", durationMinutes: 60, interviewer: "",
  toAddresses: "",       // semicolon-separated email list
  teamsSubject: "", teamsParticipants: "", teamsStart: "", teamsEnd: "",
};
const BLANK_FB = { feedbackStatus: "", feedbackComments: "", shortlisted: false };

const LEVEL_ORDER = ["Round 1", "Round 2", "Round 3", "HR", "Final"];

const STATUS_STYLE = {
  Scheduled: { color: "#1d4ed8", bg: "#dbeafe" },
  Completed:  { color: "#f18200", bg: "#fff7ed" },
  Cancelled:  { color: "#dc2626", bg: "#fee2e2" },
};
const FB_STYLE = {
  Selected:       { color: "#f18200", bg: "#fff7ed" },
  "Not Selected": { color: "#dc2626", bg: "#fee2e2" },
  Hold:           { color: "#d97706", bg: "#fef3c7" },
};

// ── Round pill ─────────────────────────────────────────────────────────
function RoundBadge({ level }) {
  const idx    = LEVEL_ORDER.indexOf(level);
  const num    = idx >= 0 ? idx + 1 : "?";
  const colors = ["#6d28d9","#0369a1","#f18200","#d97706","#dc2626"];
  const bgs    = ["#ede9fe","#e0f2fe","#fff7ed","#fef3c7","#fee2e2"];
  const c = colors[idx] || "#6b7280";
  const b = bgs[idx]    || "#f3f4f6";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <span style={{ width:24, height:24, borderRadius:"50%", background:c, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0 }}>{num}</span>
      <span style={{ fontSize:12, fontWeight:600, background:b, color:c, padding:"2px 8px", borderRadius:20 }}>{level}</span>
    </div>
  );
}

// ── Single row in accordion ────────────────────────────────────────────
function RoundRow({ iv, canFeedback, onFeedback, onView }) {
  const ss = STATUS_STYLE[iv.status] || { color:"#6b7280", bg:"#f3f4f6" };
  const fs = FB_STYLE[iv.feedback_status];
  return (
    <div style={{
      display:"grid", gridTemplateColumns:"160px 1fr 120px 130px 160px auto",
      alignItems:"center", gap:12, padding:"12px 16px",
      borderBottom:"1px solid #f3f4f6",
      background: iv.status === "Scheduled" ? "#fafffe" : "#fff",
    }}>
      <RoundBadge level={iv.level} />
      <div>
        <div style={{ fontSize:13, fontWeight:600, color:"#111827" }}>
          {iv.interview_date?.slice(0,10)} {iv.interview_time ? "· " + iv.interview_time.slice(0,5) : ""}
        </div>
        <div style={{ fontSize:11, color:"#6b7280" }}>
          {iv.interviewer || "—"} · {iv.interview_type}
          {iv.duration_minutes ? " · " + (iv.duration_minutes < 60 ? iv.duration_minutes + "min" : iv.duration_minutes/60 + "hr") : ""}
        </div>
        {iv.to_addresses && (
          <div style={{ fontSize:10, color:"#6b7280", marginTop:2 }}>To: {iv.to_addresses}</div>
        )}
      </div>
      <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:ss.bg, color:ss.color, whiteSpace:"nowrap" }}>{iv.status}</span>
      <div>
        {iv.feedback_status && fs ? (
          <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:fs.bg, color:fs.color }}>{iv.feedback_status}</span>
        ) : iv.status === "Completed" ? (
          <span style={{ fontSize:11, color:"#9ca3af" }}>No feedback</span>
        ) : (
          <span style={{ fontSize:11, color:"#9ca3af" }}>Pending</span>
        )}
        {iv.shortlisted === 1 && (
          <span style={{ fontSize:10, fontWeight:700, marginLeft:4, background:"#fff7ed", color:"#f18200", padding:"1px 6px", borderRadius:10 }}>Shortlisted</span>
        )}
      </div>
      <div style={{ fontSize:11, color:"#9ca3af" }}>{iv.interview_code}</div>
      <div style={{ display:"flex", gap:6, flexShrink:0 }}>
        <button onClick={() => onView(iv)} style={{ fontSize:11, fontWeight:600, color:"#6b7280", background:"none", border:"1px solid #e5e7eb", borderRadius:6, padding:"4px 10px", cursor:"pointer" }}>View</button>
        {iv.status === "Scheduled" && canFeedback && (
          <button onClick={() => onFeedback(iv)} style={{ fontSize:11, fontWeight:600, color:"#fff", background:"#f18200", border:"none", borderRadius:6, padding:"4px 10px", cursor:"pointer" }}>Feedback</button>
        )}
      </div>
    </div>
  );
}

// ── Candidate accordion ────────────────────────────────────────────────
function CandidateAccordion({ candidateName, jobTitle, rounds, canFeedback, canRaiseOffer, onFeedback, onView, onScheduleNext, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false);

  const scheduledRounds = rounds.filter(r => r.status === "Scheduled");
  const completedRounds = rounds.filter(r => r.status === "Completed");
  const selectedRounds  = completedRounds.filter(r => r.feedback_status === "Selected");
  const rejectedRound   = completedRounds.find(r => r.feedback_status === "Not Selected");
  const sortedCompleted = [...completedRounds].sort((a,b) => LEVEL_ORDER.indexOf(b.level) - LEVEL_ORDER.indexOf(a.level));
  const lastCompleted   = sortedCompleted[0];
  const lastIsSelected  = lastCompleted?.feedback_status === "Selected";
  const offerReady      = selectedRounds.length > 0 && scheduledRounds.length === 0 && !rejectedRound;

  let pipelineLabel, pipelineColor, pipelineBg;
  if (rejectedRound) {
    pipelineLabel = "Rejected"; pipelineColor = "#dc2626"; pipelineBg = "#fee2e2";
  } else if (scheduledRounds.length > 0) {
    const nextLvl = scheduledRounds.sort((a,b) => LEVEL_ORDER.indexOf(a.level)-LEVEL_ORDER.indexOf(b.level))[0].level;
    pipelineLabel = nextLvl + " Scheduled"; pipelineColor = "#1d4ed8"; pipelineBg = "#dbeafe";
  } else if (offerReady) {
    pipelineLabel = "Offer Ready"; pipelineColor = "#f18200"; pipelineBg = "#fff7ed";
  } else if (completedRounds.length > 0) {
    pipelineLabel = "In Progress"; pipelineColor = "#d97706"; pipelineBg = "#fef3c7";
  } else {
    pipelineLabel = rounds.length + " Round" + (rounds.length !== 1 ? "s" : "");
    pipelineColor = "#6b7280"; pipelineBg = "#f3f4f6";
  }

  return (
    <div style={{ border:"1px solid #e5e7eb", borderRadius:12, overflow:"hidden", marginBottom:10 }}>
      <div onClick={() => setOpen(o => !o)}
        style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px", cursor:"pointer", background: open ? "#f9fafb" : "#fff", borderBottom: open ? "1px solid #e5e7eb" : "none", transition:"background 0.15s" }}>
        <div style={{ width:40, height:40, borderRadius:"50%", background:"#1a2535", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:700, flexShrink:0 }}>
          {(candidateName||"?").charAt(0).toUpperCase()}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#111827" }}>{candidateName}</div>
          <div style={{ fontSize:12, color:"#6b7280" }}>{jobTitle}</div>
        </div>
        <div style={{ display:"flex", gap:4, alignItems:"center" }}>
          {LEVEL_ORDER.map(lvl => {
            const round = rounds.find(r => r.level === lvl);
            if (!round) return <div key={lvl} title={lvl} style={{ width:10, height:10, borderRadius:"50%", background:"#e5e7eb" }} />;
            const dc = round.status === "Scheduled" ? "#1d4ed8" : round.feedback_status === "Selected" ? "#f18200" : round.feedback_status === "Not Selected" ? "#dc2626" : round.feedback_status === "Hold" ? "#d97706" : "#6b7280";
            return <div key={lvl} title={lvl + ": " + round.status} style={{ width:10, height:10, borderRadius:"50%", background:dc, border:"2px solid white", boxShadow:"0 0 0 1px " + dc }} />;
          })}
        </div>
        <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:pipelineBg, color:pipelineColor, whiteSpace:"nowrap", flexShrink:0 }}>{pipelineLabel}</span>
        <span style={{ fontSize:11, color:"#9ca3af", whiteSpace:"nowrap" }}>{completedRounds.length}/{rounds.length} done</span>
        {open ? <ChevronUp size={16} color="#9ca3af" /> : <ChevronDown size={16} color="#9ca3af" />}
      </div>
      {open && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"160px 1fr 120px 130px 160px auto", gap:12, padding:"6px 16px", background:"#f9fafb", borderBottom:"1px solid #f0f0f0" }}>
            {["Round","Date & Interviewer","Status","Feedback","ID",""].map(h => (
              <div key={h} style={{ fontSize:10, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</div>
            ))}
          </div>
          {[...rounds].sort((a,b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level)).map(iv => (
            <RoundRow key={iv.interview_id} iv={iv} canFeedback={canFeedback} onFeedback={onFeedback} onView={onView} />
          ))}
          {lastIsSelected && scheduledRounds.length === 0 && !rejectedRound && canRaiseOffer && (
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 18px", background:"#fff7ed", borderTop:"1px dashed #fed7aa" }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#f18200" }}>{lastCompleted?.level} — Selected</div>
                <div style={{ fontSize:11, color:"#92400e" }}>All interview levels are optional. You can raise an offer now or schedule another round.</div>
              </div>
              <button onClick={e => { e.stopPropagation(); onScheduleNext && onScheduleNext(rounds[0]); }}
                style={{ fontSize:12, fontWeight:600, color:"#1d4ed8", background:"#dbeafe", border:"none", borderRadius:8, padding:"6px 14px", cursor:"pointer", whiteSpace:"nowrap" }}>
                + Schedule Next Round
              </button>
              <button onClick={e => { e.stopPropagation(); window.location.href = window.location.pathname.replace(/\?.*$/, "") + "?page=offers"; }}
                style={{ fontSize:12, fontWeight:600, color:"#fff", background:"#f18200", border:"none", borderRadius:8, padding:"6px 14px", cursor:"pointer", whiteSpace:"nowrap" }}>
                Raise Offer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function InterviewsPage({ role }) {
  const [interviews, setInterviews] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterLevel, setFilterLevel]   = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [schedOpen, setSchedOpen] = useState(false);
  const [detail, setDetail]       = useState(null);
  const [fbOpen, setFbOpen]       = useState(null);
  const [viewIv, setViewIv]       = useState(null);
  const [form, setForm] = useState(BLANK_INT);
  const [fb, setFb]     = useState(BLANK_FB);
  const [saving, setSaving] = useState(false);

  const isAdmin     = role === 1;
  const isTL        = role === 4;
  const isRecruiter = role === 5;
  // External recruiter = role 5. Internal = admin (1) or TL/HR manager (4).
  const isExternal  = isRecruiter;
  const canSchedule = isAdmin || isTL || isRecruiter;
  const canFeedback = isAdmin || isTL;  // Internal interviewers

  useEffect(() => {
    listCandidates({ limit: 500 }).then(r => setCandidates(r?.data ?? [])).catch(() => {});
    listJobs({ limit: 200 }).then(r => setJobs(r?.data ?? [])).catch(() => {});
  }, []);

  const loadInterviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 500 };
      if (filterLevel)  params.level  = filterLevel;
      if (filterStatus) params.status = filterStatus;
      if (search)       params.search = search;
      const { data } = await listInterviews(params);
      setInterviews(data ?? []);
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to load interviews"));
    } finally {
      setLoading(false);
    }
  }, [filterLevel, filterStatus, search]);

  useEffect(() => { loadInterviews(); }, [loadInterviews]);

  async function handleSchedule(e) {
    e.preventDefault();
    setSaving(true);
    try {
      // Build Teams participants from the toAddresses field (semicolon-separated)
      const participants = form.toAddresses
        ? form.toAddresses.split(";").map(s => s.trim()).filter(Boolean).join(", ")
        : form.teamsParticipants || null;

      await scheduleInterview({
        candidateId:      Number(form.candidateId),
        jobReqId:         Number(form.jobReqId) || null,
        level:            form.level,
        interviewType:    form.interviewType,
        interviewDate:    form.interviewDate,
        interviewTime:    form.interviewTime || null,
        durationMinutes:  form.durationMinutes ? Number(form.durationMinutes) : null,
        interviewer:      form.interviewer || null,
        teamsSubject:     form.teamsSubject      || null,
        teamsParticipants: participants,
        teamsStart:       form.teamsStart        || null,
        teamsEnd:         form.teamsEnd          || null,
      });
      successToast("Interview scheduled");
      setSchedOpen(false);
      setForm(BLANK_INT);
      loadInterviews();
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to schedule interview"));
    } finally {
      setSaving(false);
    }
  }

  async function handleFeedback(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiSubmitFeedback(fbOpen.interview_id, {
        feedbackStatus:   fb.feedbackStatus,
        feedbackComments: fb.feedbackComments || null,
        shortlisted:      fb.shortlisted,
      });
      successToast("Feedback submitted");
      setFbOpen(null);
      setFb(BLANK_FB);
      loadInterviews();
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to submit feedback"));
    } finally {
      setSaving(false);
    }
  }

  function handleChange(e)   { const { name, value } = e.target; setForm(f => ({ ...f, [name]: value })); }
  function handleFbChange(e) {
    const { name, value, type, checked } = e.target;
    setFb(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }
  function openFeedback(row) {
    setFbOpen(row);
    setFb({ feedbackStatus: row.feedback_status || "", feedbackComments: row.feedback_comments || "", shortlisted: !!row.shortlisted });
  }

  const filtered = interviews.filter(iv => {
    const q = search.toLowerCase();
    const matchQ = !q || (iv.candidate_name||"").toLowerCase().includes(q) || (iv.interview_code||"").toLowerCase().includes(q) || (iv.job_title||"").toLowerCase().includes(q);
    return matchQ && (!filterLevel || iv.level === filterLevel) && (!filterStatus || iv.status === filterStatus);
  });

  const grouped = {};
  for (const iv of filtered) {
    const key = iv.candidate_id;
    if (!grouped[key]) grouped[key] = { candidateId: iv.candidate_id, candidateName: iv.candidate_name, jobTitle: iv.job_title, rounds: [] };
    grouped[key].rounds.push(iv);
  }
  const groups = Object.values(grouped);

  const candidateOpts = candidates.map(c => ({ value: String(c.candidate_id), label: c.candidate_code + " — " + c.name }));
  const jobOpts       = jobs.map(j => ({ value: String(j.job_req_id), label: j.job_req_code + " — " + j.title }));
  const levelOpts     = [{ value: "", label: "All Levels" },   ...INTERVIEW_LEVELS.map(l => ({ value: l, label: l }))];
  const statusOpts    = [{ value: "", label: "All Statuses" }, { value: "Scheduled", label: "Scheduled" }, { value: "Completed", label: "Completed" }, { value: "Cancelled", label: "Cancelled" }];

  const isTeams = form.interviewType === "Teams";

  return (
    <div>
      <PageHeader
        breadcrumbs={["Dashboard", "Interviews"]}
        title="Interview Schedule"
        subtitle="One accordion per candidate — track all rounds at a glance"
        action={canSchedule && (
          <div style={{ display:"flex", gap:8 }}>
            <Btn variant="secondary" icon={<RefreshCw size={14} />} onClick={loadInterviews} />
            <Btn icon={<Plus size={16} />} onClick={() => setSchedOpen(true)}>Schedule Interview</Btn>
          </div>
        )}
      />

      {/* Stats */}
      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        {[
          { label:"Candidates", count: groups.length,                                                    color:"#6b7280", bg:"#f3f4f6" },
          { label:"Scheduled",  count: interviews.filter(iv=>iv.status==="Scheduled").length,            color:"#1d4ed8", bg:"#dbeafe" },
          { label:"Completed",  count: interviews.filter(iv=>iv.status==="Completed").length,            color:"#059669", bg:"#dcfce7" },
          { label:"Selected",   count: interviews.filter(iv=>iv.feedback_status==="Selected").length,    color:"#7c3aed", bg:"#ede9fe" },
        ].map(s => (
          <div key={s.label} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:20, background:s.bg }}>
            <span style={{ fontSize:16, fontWeight:700, color:s.color }}>{s.count}</span>
            <span style={{ fontSize:12, color:s.color, fontWeight:500 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card style={{ padding:0, marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", flexWrap:"wrap" }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search candidate, job, interview ID..." />
          <Select value={filterLevel}  onChange={e => setFilterLevel(e.target.value)}  options={levelOpts} />
          <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} options={statusOpts} />
          <div style={{ marginLeft:"auto", fontSize:12, color:"#6b7280" }}>
            {loading ? "Loading..." : (groups.length + " candidate" + (groups.length !== 1 ? "s" : ""))}
          </div>
        </div>
      </Card>

      {/* Accordion list */}
      {loading ? (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, padding:48, color:"#6b7280" }}>
          <Loader2 size={20} /> Loading interviews...
        </div>
      ) : groups.length === 0 ? (
        <Card style={{ padding:48, textAlign:"center", color:"#9ca3af", fontSize:14 }}>No interviews found.</Card>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {groups.map((g, idx) => (
            <CandidateAccordion
              key={g.candidateId}
              candidateName={g.candidateName}
              jobTitle={g.jobTitle}
              rounds={g.rounds}
              canFeedback={canFeedback}
              canRaiseOffer={isAdmin}
              defaultOpen={idx === 0}
              onFeedback={openFeedback}
              onView={row => setViewIv(row)}
              onScheduleNext={() => { setForm(f => ({ ...f, candidateId: String(g.candidateId) })); setSchedOpen(true); }}
            />
          ))}
        </div>
      )}

      {/* ── Schedule Interview SlideOver ── */}
      <SlideOver open={schedOpen} onClose={() => { setSchedOpen(false); setForm(BLANK_INT); }}
        title={isExternal ? "Update Interview Schedule" : "Schedule Interview"} width={540}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setSchedOpen(false)}>Cancel</Btn>
            <Btn onClick={handleSchedule} disabled={saving}>{saving ? "Scheduling..." : "Confirm & Schedule"}</Btn>
          </>
        }>
        <form onSubmit={handleSchedule}>

          {/* Role hint banner */}
          {isExternal ? (
            <div style={{ marginBottom: 16, padding: "8px 14px", background: "#dbeafe", borderLeft: "3px solid #1d4ed8", borderRadius: 8, fontSize: 13, color: "#1e40af" }}>
              External recruiters can update interview schedule details only.
            </div>
          ) : (
            <div style={{ marginBottom: 16, padding: "8px 14px", background: "#fff7ed", borderLeft: "3px solid #f18200", borderRadius: 8, fontSize: 13, color: "#92400e" }}>
              Schedule a new interview round. Teams invite will be generated automatically when type is "Teams".
            </div>
          )}

          <TwoColGrid>
            <Field label="Candidate" required>
              <select name="candidateId" value={form.candidateId} onChange={handleChange}
                style={{ width:"100%", fontSize:13, padding:"8px 10px", border:"1px solid #e5e7eb", borderRadius:8, color:"#374151" }}>
                <option value="">Select candidate</option>
                {candidateOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Job Position">
              <select name="jobReqId" value={form.jobReqId} onChange={handleChange}
                style={{ width:"100%", fontSize:13, padding:"8px 10px", border:"1px solid #e5e7eb", borderRadius:8, color:"#374151" }}>
                <option value="">Select job (optional)</option>
                {jobOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Interview Level" required>
              <Select name="level" value={form.level} onChange={handleChange} options={[{value:"",label:"Select level"},...INTERVIEW_LEVELS.map(l=>({value:l,label:l}))]} />
            </Field>
            <Field label="Interview Type" required>
              <Select name="interviewType" value={form.interviewType} onChange={handleChange} options={[{value:"",label:"Select type"},...INTERVIEW_TYPES.map(t=>({value:t,label:t}))]} />
            </Field>
            <Field label="Date" required>
              <Input name="interviewDate" type="date" value={form.interviewDate} onChange={handleChange} />
            </Field>
            <Field label="Time" required>
              <Input name="interviewTime" type="time" value={form.interviewTime} onChange={handleChange} />
            </Field>
          </TwoColGrid>

          {/* Interviewer — shown for internal users; external can leave blank */}
          <Field label={isExternal ? "Interviewer Name (if known)" : "Interviewer Name"} required={!isExternal}>
            <Input name="interviewer" value={form.interviewer} onChange={handleChange} placeholder="Full name of the interviewer" />
          </Field>

          {/* To field — multiple emails separated by semicolons */}
          <Field label="To (participants — separate emails with semicolons)">
            <textarea
              name="toAddresses"
              value={form.toAddresses}
              onChange={handleChange}
              placeholder="interviewer@company.com; candidate@email.com; hr@company.com"
              rows={2}
              style={{ width: "100%", boxSizing: "border-box", fontSize: 13, padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, color: "#374151", resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: 1.5 }}
            />
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Separate multiple email addresses with semicolons ( ; )</div>
          </Field>

          {/* Teams details — shown when type = Teams for internal users */}
          {isTeams && !isExternal && (
            <div style={{ padding: "12px 14px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, marginTop: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e40af", marginBottom: 10 }}>Microsoft Teams Meeting</div>
              <div style={{ fontSize: 11, color: "#3b82f6", marginBottom: 10, padding: "6px 10px", background: "#dbeafe", borderRadius: 6 }}>
                A Teams meeting invite will be automatically sent to all participants listed in the "To" field above.
              </div>
              <Field label="Meeting Subject">
                <Input name="teamsSubject" value={form.teamsSubject} onChange={handleChange} placeholder="e.g. Interview - Candidate Name - Round 1" />
              </Field>
              <TwoColGrid>
                <Field label="Start"><Input name="teamsStart" type="datetime-local" value={form.teamsStart} onChange={handleChange} /></Field>
                <Field label="End"><Input name="teamsEnd" type="datetime-local" value={form.teamsEnd} onChange={handleChange} /></Field>
              </TwoColGrid>
            </div>
          )}

          {/* External recruiters see only basic fields — schedule info + no Teams config */}
          {isTeams && isExternal && (
            <div style={{ marginTop: 8, padding: "8px 12px", background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, color: "#6b7280" }}>
              Teams meeting details will be configured by internal HR after schedule confirmation.
            </div>
          )}

          <Field label="Notes">
            <Textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Any pre-interview notes or instructions..." rows={2} />
          </Field>
        </form>
      </SlideOver>

      {/* ── Feedback Modal ── */}
      <Modal open={!!fbOpen} onClose={() => setFbOpen(null)}
        title={"Feedback - " + (fbOpen?.candidate_name || "") + " (" + (fbOpen?.level || "") + ")"} width={500}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setFbOpen(null)}>Cancel</Btn>
            <Btn onClick={handleFeedback} disabled={saving}>{saving ? "Saving..." : "Save Feedback"}</Btn>
          </>
        }>
        {fbOpen && (
          <div>
            {/* Interview details recap */}
            <div style={{ marginBottom: 16, padding: "10px 14px", background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 4 }}>INTERVIEW DETAILS</div>
              <div style={{ fontSize: 13, color: "#111827", fontWeight: 600 }}>{fbOpen.candidate_name}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {fbOpen.level} — {fbOpen.interview_type}
                {fbOpen.interview_date ? " · " + fbOpen.interview_date.slice(0,10) : ""}
                {fbOpen.interview_time ? " at " + fbOpen.interview_time.slice(0,5) : ""}
              </div>
              {fbOpen.interviewer && (
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Interviewer: {fbOpen.interviewer}</div>
              )}
            </div>

            <Field label="Interviewer Name">
              <Input value={fbOpen.interviewer || "—"} readOnly style={{ background: "#f9fafb" }} />
            </Field>
            <Field label="Outcome" required>
              <Select name="feedbackStatus" value={fb.feedbackStatus} onChange={handleFbChange}
                options={[{value:"",label:"Select outcome"},...FEEDBACK_STATUSES.map(s=>({value:s,label:s}))]} />
            </Field>
            <Field label="Feedback Comments">
              <Textarea name="feedbackComments" value={fb.feedbackComments} onChange={handleFbChange} rows={4} placeholder="Enter detailed interviewer feedback..." />
            </Field>
            <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"#374151", cursor:"pointer", marginTop:8 }}>
              <input type="checkbox" name="shortlisted" checked={fb.shortlisted} onChange={handleFbChange} style={{ accentColor:"#f18200" }} />
              Mark as Shortlisted
            </label>
          </div>
        )}
      </Modal>

      {/* ── View Interview Modal ── */}
      <Modal open={!!viewIv} onClose={() => setViewIv(null)}
        title={"Interview - " + (viewIv?.candidate_name || "")} width={480}
        footer={
          <div style={{ display: "flex", gap: 10, width: "100%", justifyContent: "flex-end" }}>
            {viewIv?.status === "Scheduled" && canFeedback && (
              <Btn onClick={() => { openFeedback(viewIv); setViewIv(null); }}>Submit Feedback</Btn>
            )}
            <Btn variant="secondary" onClick={() => setViewIv(null)}>Close</Btn>
          </div>
        }>
        {viewIv && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 20px" }}>
              <DetailRow label="Level"       value={viewIv.level} />
              <DetailRow label="Type"        value={viewIv.interview_type} />
              <DetailRow label="Date"        value={viewIv.interview_date?.slice(0,10)} />
              <DetailRow label="Time"        value={viewIv.interview_time?.slice(0,5)} />
              <DetailRow label="Interviewer" value={viewIv.interviewer || "N/A"} />
              <DetailRow label="Duration"    value={viewIv.duration_minutes ? (viewIv.duration_minutes + " min") : "N/A"} />
              <DetailRow label="Status"      value={viewIv.status} />
              <DetailRow label="Outcome"     value={viewIv.feedback_status || "Pending"} />
            </div>
            {viewIv.to_addresses && (
              <div style={{ marginTop: 12, padding: "8px 12px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 4 }}>PARTICIPANTS (TO)</div>
                <p style={{ fontSize: 12, color: "#374151", margin: 0 }}>{viewIv.to_addresses}</p>
              </div>
            )}
            {viewIv.feedback_comments && (
              <div style={{ marginTop: 12, padding:"10px 14px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#6b7280", marginBottom:6 }}>FEEDBACK</div>
                <p style={{ fontSize:13, color:"#374151", margin:0, lineHeight:1.6 }}>{viewIv.feedback_comments}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
