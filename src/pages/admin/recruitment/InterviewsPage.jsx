import React, { useState, useEffect, useCallback } from "react";
import { Plus, MessageSquare, Loader2, RefreshCw, ChevronDown, ChevronUp, Calendar } from "lucide-react";
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
  Selected:     { color: "#f18200", bg: "#fff7ed" },
  "Not Selected": { color: "#dc2626", bg: "#fee2e2" },
  Hold:         { color: "#d97706", bg: "#fef3c7" },
};

// ── Round pill ──────────────────────────────────────────────────────────────
function RoundBadge({ level }) {
  const idx  = LEVEL_ORDER.indexOf(level);
  const num  = idx >= 0 ? idx + 1 : "?";
  const colors = ["#6d28d9","#0369a1","#f18200","#d97706","#dc2626"];
  const bg     = ["#ede9fe","#e0f2fe","#fff7ed","#fef3c7","#fee2e2"];
  const c = colors[idx] || "#6b7280";
  const b = bg[idx]     || "#f3f4f6";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <span style={{ width:24, height:24, borderRadius:"50%", background:c, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0 }}>{num}</span>
      <span style={{ fontSize:12, fontWeight:600, background:b, color:c, padding:"2px 8px", borderRadius:20 }}>{level}</span>
    </div>
  );
}

// ── Single round row inside accordion ───────────────────────────────────────
function RoundRow({ iv, canFeedback, onFeedback, onView }) {
  const ss = STATUS_STYLE[iv.status] || { color:"#6b7280", bg:"#f3f4f6" };
  const fs = FB_STYLE[iv.feedback_status];

  return (
    <div style={{
      display:"grid", gridTemplateColumns:"160px 1fr 120px 130px 160px auto",
      alignItems:"center", gap:12,
      padding:"12px 16px",
      borderBottom:"1px solid #f3f4f6",
      background: iv.status === "Scheduled" ? "#fafffe" : "#fff",
    }}>
      {/* Round */}
      <RoundBadge level={iv.level} />

      {/* Date / Interviewer */}
      <div>
        <div style={{ fontSize:13, fontWeight:600, color:"#111827" }}>
          {iv.interview_date?.slice(0,10)} {iv.interview_time ? `· ${iv.interview_time.slice(0,5)}` : ""}
        </div>
        <div style={{ fontSize:11, color:"#6b7280" }}>
          {iv.interviewer || "—"} · {iv.interview_type}
          {iv.duration_minutes ? ` · ${iv.duration_minutes < 60 ? iv.duration_minutes+"min" : iv.duration_minutes/60+"hr"}` : ""}
        </div>
      </div>

      {/* Status */}
      <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:ss.bg, color:ss.color, whiteSpace:"nowrap" }}>
        {iv.status}
      </span>

      {/* Feedback */}
      <div>
        {iv.feedback_status && fs ? (
          <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:fs.bg, color:fs.color }}>
            {iv.feedback_status}
          </span>
        ) : iv.status === "Completed" ? (
          <span style={{ fontSize:11, color:"#9ca3af" }}>No feedback</span>
        ) : (
          <span style={{ fontSize:11, color:"#9ca3af" }}>Pending</span>
        )}
        {iv.shortlisted === 1 && (
          <span style={{ fontSize:10, fontWeight:700, marginLeft:4, background:"#fff7ed", color:"#f18200", padding:"1px 6px", borderRadius:10 }}>Shortlisted</span>
        )}
      </div>

      {/* Interview code */}
      <div style={{ fontSize:11, color:"#9ca3af" }}>{iv.interview_code}</div>

      {/* Actions */}
      <div style={{ display:"flex", gap:6, flexShrink:0 }}>
        <button onClick={() => onView(iv)}
          style={{ fontSize:11, fontWeight:600, color:"#6b7280", background:"none", border:"1px solid #e5e7eb", borderRadius:6, padding:"4px 10px", cursor:"pointer" }}>
          View
        </button>
        {iv.status === "Scheduled" && canFeedback && (
          <button onClick={() => onFeedback(iv)}
            style={{ fontSize:11, fontWeight:600, color:"#fff", background:"#f18200", border:"none", borderRadius:6, padding:"4px 10px", cursor:"pointer" }}>
            Feedback
          </button>
        )}
      </div>
    </div>
  );
}

// ── Candidate accordion card ─────────────────────────────────────────────────
function CandidateAccordion({ candidateName, jobTitle, rounds, canFeedback, onFeedback, onView, onScheduleNext, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false);

  const scheduledRounds = rounds.filter(r => r.status === "Scheduled");
  const completedRounds = rounds.filter(r => r.status === "Completed");
  const selectedRounds  = completedRounds.filter(r => r.feedback_status === "Selected");
  const rejectedRound   = completedRounds.find(r => r.feedback_status === "Not Selected");

  // Last completed round (by LEVEL_ORDER position)
  const sortedCompleted = [...completedRounds].sort((a,b) => LEVEL_ORDER.indexOf(b.level) - LEVEL_ORDER.indexOf(a.level));
  const lastCompleted   = sortedCompleted[0];
  const lastIsSelected  = lastCompleted?.feedback_status === "Selected";

  // "Offer Ready" = at least one Selected round AND no pending scheduled rounds AND not rejected
  const offerReady = selectedRounds.length > 0 && scheduledRounds.length === 0 && !rejectedRound;

  // Determine overall pipeline state
  // All levels optional — offer can be raised after ANY selected round
  let pipelineLabel, pipelineColor, pipelineBg;
  if (rejectedRound) {
    pipelineLabel = "Rejected";
    pipelineColor = "#dc2626"; pipelineBg = "#fee2e2";
  } else if (scheduledRounds.length > 0) {
    const nextLvl = scheduledRounds.sort((a,b) => LEVEL_ORDER.indexOf(a.level)-LEVEL_ORDER.indexOf(b.level))[0].level;
    pipelineLabel = `${nextLvl} Scheduled`;
    pipelineColor = "#1d4ed8"; pipelineBg = "#dbeafe";
  } else if (offerReady) {
    pipelineLabel = "Offer Ready";
    pipelineColor = "#f18200"; pipelineBg = "#fff7ed";
  } else if (completedRounds.length > 0) {
    pipelineLabel = "In Progress";
    pipelineColor = "#d97706"; pipelineBg = "#fef3c7";
  } else {
    pipelineLabel = `${rounds.length} Round${rounds.length!==1?"s":""}`;
    pipelineColor = "#6b7280"; pipelineBg = "#f3f4f6";
  }

  return (
    <div style={{ border:"1px solid #e5e7eb", borderRadius:12, overflow:"hidden", marginBottom:10 }}>
      {/* Header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display:"flex", alignItems:"center", gap:14, padding:"14px 18px",
          cursor:"pointer", background: open ? "#f9fafb" : "#fff",
          borderBottom: open ? "1px solid #e5e7eb" : "none",
          transition:"background 0.15s",
        }}
      >
        {/* Avatar */}
        <div style={{ width:40, height:40, borderRadius:"50%", background:"#1a2535", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:700, flexShrink:0 }}>
          {(candidateName||"?").charAt(0).toUpperCase()}
        </div>

        {/* Name + job */}
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#111827" }}>{candidateName}</div>
          <div style={{ fontSize:12, color:"#6b7280" }}>{jobTitle}</div>
        </div>

        {/* Round progress dots */}
        <div style={{ display:"flex", gap:4, alignItems:"center" }}>
          {LEVEL_ORDER.map(lvl => {
            const round = rounds.find(r => r.level === lvl);
            if (!round) return (
              <div key={lvl} title={lvl} style={{ width:10, height:10, borderRadius:"50%", background:"#e5e7eb" }} />
            );
            const dotColor = round.status === "Scheduled" ? "#1d4ed8"
              : round.feedback_status === "Selected"     ? "#f18200"
              : round.feedback_status === "Not Selected" ? "#dc2626"
              : round.feedback_status === "Hold"         ? "#d97706"
              : "#6b7280";
            return (
              <div key={lvl} title={`${lvl}: ${round.status}${round.feedback_status ? " · "+round.feedback_status : ""}`}
                style={{ width:10, height:10, borderRadius:"50%", background:dotColor, border:"2px solid white", boxShadow:"0 0 0 1px "+dotColor }} />
            );
          })}
        </div>

        {/* Pipeline state */}
        <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:pipelineBg, color:pipelineColor, whiteSpace:"nowrap", flexShrink:0 }}>
          {pipelineLabel}
        </span>

        {/* Round count */}
        <span style={{ fontSize:11, color:"#9ca3af", whiteSpace:"nowrap" }}>
          {completedRounds.length}/{rounds.length} done
        </span>

        {open ? <ChevronUp size={16} color="#9ca3af" /> : <ChevronDown size={16} color="#9ca3af" />}
      </div>

      {/* Rounds list */}
      {open && (
        <div>
          {/* Column headers */}
          <div style={{ display:"grid", gridTemplateColumns:"160px 1fr 120px 130px 160px auto", gap:12, padding:"6px 16px", background:"#f9fafb", borderBottom:"1px solid #f0f0f0" }}>
            {["Round","Date & Interviewer","Status","Feedback","ID",""].map(h => (
              <div key={h} style={{ fontSize:10, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</div>
            ))}
          </div>

          {/* Sort by LEVEL_ORDER */}
          {[...rounds].sort((a,b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level)).map(iv => (
            <RoundRow
              key={iv.interview_id}
              iv={iv}
              canFeedback={canFeedback}
              onFeedback={onFeedback}
              onView={onView}
            />
          ))}

          {/* Next-step action bar — shown when last round is Selected & no round pending */}
          {lastIsSelected && scheduledRounds.length === 0 && !rejectedRound && canFeedback && (
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 18px", background:"#fff7ed", borderTop:"1px dashed #fed7aa" }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#f18200" }}>
                  ✔ {lastCompleted?.level} — Selected
                </div>
                <div style={{ fontSize:11, color:"#92400e" }}>
                  All interview levels are optional. You can raise an offer now or schedule another round.
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); onScheduleNext && onScheduleNext(rounds[0]); }}
                style={{ fontSize:12, fontWeight:600, color:"#1d4ed8", background:"#dbeafe", border:"none", borderRadius:8, padding:"6px 14px", cursor:"pointer", whiteSpace:"nowrap" }}>
                + Schedule Next Round
              </button>
              <button
                onClick={e => { e.stopPropagation(); window.location.href = window.location.pathname.replace(/\?.*$/, "") + "?page=offers"; }}
                style={{ fontSize:12, fontWeight:600, color:"#fff", background:"#f18200", border:"none", borderRadius:8, padding:"6px 14px", cursor:"pointer", whiteSpace:"nowrap" }}>
                🎉 Raise Offer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
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
  const [form, setForm] = useState(BLANK_INT);
  const [fb, setFb]     = useState(BLANK_FB);
  const [saving, setSaving] = useState(false);

  const isAdmin     = role === 1;
  const isTL        = role === 4;
  const isRecruiter = role === 5;
  const canSchedule = isAdmin || isTL || isRecruiter;
  const canFeedback = isAdmin || isTL;

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
      await scheduleInterview({
        candidateId:     Number(form.candidateId),
        jobReqId:        Number(form.jobReqId),
        level:           form.level,
        interviewType:   form.interviewType,
        interviewDate:   form.interviewDate,
        interviewTime:   form.interviewTime || null,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null,
        interviewer:     form.interviewer || null,
        teamsSubject:    form.teamsSubject || null,
        teamsParticipants: form.teamsParticipants || null,
        teamsStart:      form.teamsStart || null,
        teamsEnd:        form.teamsEnd || null,
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

  // ── Group by candidate ─────────────────────────────────────────────
  const filtered = interviews.filter(iv => {
    const q = search.toLowerCase();
    const matchQ = !q || (iv.candidate_name||"").toLowerCase().includes(q)
      || (iv.interview_code||"").toLowerCase().includes(q)
      || (iv.job_title||"").toLowerCase().includes(q);
    const matchL = !filterLevel  || iv.level  === filterLevel;
    const matchS = !filterStatus || iv.status === filterStatus;
    return matchQ && matchL && matchS;
  });

  // Group: { candidateId -> { name, job, rounds[] } }
  const grouped = {};
  for (const iv of filtered) {
    const key = iv.candidate_id;
    if (!grouped[key]) {
      grouped[key] = {
        candidateId:   iv.candidate_id,
        candidateName: iv.candidate_name,
        jobTitle:      iv.job_title,
        rounds:        [],
      };
    }
    grouped[key].rounds.push(iv);
  }
  const groups = Object.values(grouped);

  const candidateOpts = candidates.map(c => ({ value: String(c.candidate_id), label: `${c.candidate_code} — ${c.name}` }));
  const jobOpts       = jobs.map(j => ({ value: String(j.job_req_id), label: `${j.job_req_code} — ${j.title}` }));
  const levelOpts     = [{ value: "", label: "All Levels" },   ...INTERVIEW_LEVELS.map(l => ({ value: l, label: l }))];
  const statusOpts    = [{ value: "", label: "All Statuses" }, { value: "Scheduled", label: "Scheduled" }, { value: "Completed", label: "Completed" }, { value: "Cancelled", label: "Cancelled" }];

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
          { label:"Candidates",  count: groups.length,                                                  color:"#6b7280", bg:"#f3f4f6" },
          { label:"Scheduled",   count: interviews.filter(iv => iv.status==="Scheduled").length,        color:"#1d4ed8", bg:"#dbeafe" },
          { label:"Completed",   count: interviews.filter(iv => iv.status==="Completed").length,        color:"#059669", bg:"#d1fae5" },
          { label:"Shortlisted", count: interviews.filter(iv => iv.shortlisted===1).length,             color:"#0369a1", bg:"#e0f2fe" },
        ].map(s => (
          <div key={s.label} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:20, background:s.bg }}>
            <span style={{ fontSize:16, fontWeight:700, color:s.color }}>{s.count}</span>
            <span style={{ fontSize:12, color:s.color, fontWeight:500 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card style={{ padding:"12px 16px", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search candidate, job, ID…" />
          <Select value={filterLevel}  onChange={e => setFilterLevel(e.target.value)}  options={levelOpts} />
          <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} options={statusOpts} />
          <div style={{ marginLeft:"auto", fontSize:12, color:"#6b7280" }}>
            {loading ? "Loading…" : `${groups.length} candidate${groups.length!==1?"s":""} · ${filtered.length} rounds`}
          </div>
        </div>
      </Card>

      {/* Accordion list */}
      {loading ? (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, padding:48, color:"#6b7280" }}>
          <Loader2 size={20} /> Loading interviews…
        </div>
      ) : groups.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 20px", color:"#9ca3af" }}>
          <Calendar size={40} color="#e5e7eb" style={{ marginBottom:12 }} />
          <div style={{ fontSize:14, fontWeight:600, color:"#6b7280" }}>No interviews found</div>
          <div style={{ fontSize:12, marginTop:4 }}>Schedule an interview to get started</div>
        </div>
      ) : (
        groups.map((g, i) => (
          <CandidateAccordion
            key={g.candidateId}
            candidateName={g.candidateName}
            jobTitle={g.jobTitle}
            rounds={g.rounds}
            canFeedback={canFeedback}
            onFeedback={openFeedback}
            onView={setDetail}
            defaultOpen={i === 0}
            onScheduleNext={(sampleRound) => {
              // Pre-fill schedule form with candidate + job from existing round
              setForm(f => ({
                ...BLANK_INT,
                candidateId: String(sampleRound?.candidate_id || ""),
                jobReqId:    String(sampleRound?.job_req_id   || ""),
              }));
              setSchedOpen(true);
            }}
          />
        ))
      )}

      {/* ── Schedule SlideOver ── */}
      <SlideOver open={schedOpen} onClose={() => { setSchedOpen(false); setForm(BLANK_INT); }}
        title="Schedule Interview"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setSchedOpen(false)}>Cancel</Btn>
            <Btn onClick={handleSchedule} disabled={saving}>{saving ? "Saving…" : "Confirm Schedule"}</Btn>
          </>
        }>
        <form onSubmit={handleSchedule}>
          <Field label="Candidate" required>
            <Select name="candidateId" value={form.candidateId} onChange={handleChange} options={candidateOpts} placeholder="Select candidate" />
          </Field>
          <Field label="Job / Position" required>
            <Select name="jobReqId" value={form.jobReqId} onChange={handleChange} options={jobOpts} placeholder="Select job" />
          </Field>
          <TwoColGrid>
            <Field label="Interview Level" required>
              <Select name="level" value={form.level} onChange={handleChange} options={INTERVIEW_LEVELS} />
            </Field>
            <Field label="Interview Type" required>
              <Select name="interviewType" value={form.interviewType} onChange={handleChange} options={INTERVIEW_TYPES} />
            </Field>
            <Field label="Date" required>
              <Input name="interviewDate" type="date" value={form.interviewDate} onChange={handleChange} />
            </Field>
            <Field label="From Time">
              <Input name="interviewTime" type="time" value={form.interviewTime} onChange={handleChange} />
            </Field>
            <Field label="Duration">
              <select name="durationMinutes" value={form.durationMinutes} onChange={handleChange}
                style={{ width:"100%", fontSize:13, padding:"8px 10px", border:"1px solid #e5e7eb", borderRadius:8, color:"#374151" }}>
                {[30,45,60,90,120].map(m => (
                  <option key={m} value={m}>{m < 60 ? `${m} min` : `${m/60} hr${m>60?"s":""}`}</option>
                ))}
              </select>
            </Field>
            <Field label="To Time (est.)">
              <input type="time" readOnly
                value={(() => {
                  if (!form.interviewTime || !form.durationMinutes) return "";
                  const [h, min] = form.interviewTime.split(":").map(Number);
                  const total = h * 60 + min + Number(form.durationMinutes);
                  return `${String(Math.floor(total/60)%24).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`;
                })()}
                style={{ width:"100%", fontSize:13, padding:"8px 10px", border:"1px solid #e5e7eb", borderRadius:8, color:"#6b7280", background:"#f9fafb" }}
              />
            </Field>
          </TwoColGrid>
          <Field label="Interviewer Name">
            <Input name="interviewer" value={form.interviewer} onChange={handleChange} placeholder="Full name" />
          </Field>
          {form.interviewType === "Teams" && (
            <div style={{ padding:"12px 14px", background:"#eff6ff", borderRadius:8, marginTop:4 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#1d4ed8", marginBottom:10 }}>Teams Meeting Details</div>
              <Field label="Meeting Subject"><Input name="teamsSubject" value={form.teamsSubject} onChange={handleChange} /></Field>
              <TwoColGrid>
                <Field label="Start Time"><Input name="teamsStart" type="datetime-local" value={form.teamsStart} onChange={handleChange} /></Field>
                <Field label="End Time"><Input name="teamsEnd" type="datetime-local" value={form.teamsEnd} onChange={handleChange} /></Field>
              </TwoColGrid>
              <Field label="Participants">
                <Input name="teamsParticipants" value={form.teamsParticipants} onChange={handleChange} placeholder="email1@natit.com, email2@natit.com" />
              </Field>
            </div>
          )}
        </form>
      </SlideOver>

      {/* ── Feedback Modal ── */}
      <Modal open={!!fbOpen} onClose={() => setFbOpen(null)}
        title={`Feedback — ${fbOpen?.interview_code || ""}`} width={480}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setFbOpen(null)}>Cancel</Btn>
            <Btn onClick={handleFeedback} disabled={saving || !fb.feedbackStatus}>
              {saving ? "Submitting…" : "Submit Feedback"}
            </Btn>
          </>
        }>
        {fbOpen && (
          <form onSubmit={handleFeedback}>
            <div style={{ padding:"10px 14px", background:"#f9fafb", borderRadius:8, marginBottom:16, fontSize:13 }}>
              <strong>{fbOpen.candidate_name}</strong> · <RoundBadge level={fbOpen.level} />
              <div style={{ fontSize:11, color:"#6b7280", marginTop:4 }}>
                {fbOpen.interview_date?.slice(0,10)} {fbOpen.interview_time ? `at ${fbOpen.interview_time.slice(0,5)}` : ""} · {fbOpen.interviewer}
              </div>
            </div>
            <Field label="Interview Result" required>
              <Select name="feedbackStatus" value={fb.feedbackStatus} onChange={handleFbChange}
                options={FEEDBACK_STATUSES} placeholder="Select result" />
            </Field>
            {fb.feedbackStatus && (
              <div style={{ padding:"8px 12px", borderRadius:8, marginBottom:12,
                background: fb.feedbackStatus==="Selected" ? "#d1fae5" : fb.feedbackStatus==="Not Selected" ? "#fee2e2" : "#fef3c7",
                color:      fb.feedbackStatus==="Selected" ? "#065f46" : fb.feedbackStatus==="Not Selected" ? "#991b1b" : "#92400e",
                fontSize:12, fontWeight:600 }}>
                {fb.feedbackStatus === "Selected" && fbOpen.level !== "Final" && "✔ Candidate will move to next round"}
                {fb.feedbackStatus === "Selected" && fbOpen.level === "Final" && "✔ Candidate will be Shortlisted for offer"}
                {fb.feedbackStatus === "Not Selected" && "✖ Candidate will be Rejected"}
                {fb.feedbackStatus === "Hold" && "⏸ Candidate status will not change"}
              </div>
            )}
            <Field label="Feedback Comments">
              <Textarea name="feedbackComments" value={fb.feedbackComments} onChange={handleFbChange}
                placeholder="Strengths, areas to improve, recommendation…" rows={4} />
            </Field>
            <label style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", cursor:"pointer" }}>
              <input type="checkbox" name="shortlisted" checked={fb.shortlisted} onChange={handleFbChange}
                style={{ accentColor:"#f18200", width:16, height:16 }} />
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:"#111827" }}>Mark as Shortlisted</div>
                <div style={{ fontSize:11, color:"#6b7280" }}>Flags the candidate for offer release</div>
              </div>
            </label>
          </form>
        )}
      </Modal>

      {/* ── Detail Modal ── */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Interview Details" width={560}
        footer={<Btn variant="secondary" onClick={() => setDetail(null)}>Close</Btn>}>
        {detail && (() => {
          const s = STATUS_STYLE[detail.status] || { color:"#6b7280", bg:"#f3f4f6" };
          return (
            <div>
              <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
                <span style={{ background:s.bg, color:s.color, padding:"3px 12px", borderRadius:20, fontSize:12, fontWeight:700 }}>{detail.status}</span>
                <RoundBadge level={detail.level} />
                <span style={{ background:"#eff6ff", color:"#1d4ed8", padding:"3px 12px", borderRadius:20, fontSize:12 }}>{detail.interview_type}</span>
                {detail.shortlisted===1 && <span style={{ background:"#d1fae5", color:"#059669", padding:"3px 12px", borderRadius:20, fontSize:12, fontWeight:700 }}>Shortlisted</span>}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 20px" }}>
                <DetailRow label="Interview ID"  value={detail.interview_code} />
                <DetailRow label="Candidate"     value={detail.candidate_name} />
                <DetailRow label="Job Position"  value={detail.job_title} />
                <DetailRow label="Interviewer"   value={detail.interviewer} />
                <DetailRow label="Date"          value={detail.interview_date?.slice(0,10)} />
                <DetailRow label="From"          value={detail.interview_time?.slice(0,5)} />
                <DetailRow label="Duration"      value={detail.duration_minutes ? (detail.duration_minutes<60?`${detail.duration_minutes} min`:`${detail.duration_minutes/60} hr${detail.duration_minutes>60?"s":""}`) : "—"} />
                <DetailRow label="To (est.)"     value={(() => {
                  if (!detail.interview_time || !detail.duration_minutes) return "—";
                  const [h,m] = detail.interview_time.split(":").map(Number);
                  const t = h*60+m+Number(detail.duration_minutes);
                  return `${String(Math.floor(t/60)%24).padStart(2,"0")}:${String(t%60).padStart(2,"0")}`;
                })()} />
              </div>
              {detail.teams_join_url && (
                <div style={{ marginTop:12, padding:"12px 14px", background:"#eff6ff", borderRadius:8 }}>
                  <a href={detail.teams_join_url} target="_blank" rel="noopener noreferrer"
                    style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#1d4ed8", color:"#fff", padding:"8px 16px", borderRadius:8, fontSize:13, fontWeight:600, textDecoration:"none" }}>
                    🔗 Join Teams Meeting
                  </a>
                </div>
              )}
              {detail.feedback_status && (
                <div style={{ marginTop:12, padding:"12px 14px", background:"#f9fafb", borderRadius:8 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#6b7280", marginBottom:6 }}>FEEDBACK</div>
                  <span style={{ fontSize:13, fontWeight:700, color: FB_STYLE[detail.feedback_status]?.color || "#6b7280" }}>{detail.feedback_status}</span>
                  {detail.feedback_comments && <p style={{ fontSize:13, color:"#374151", marginTop:6, lineHeight:1.5 }}>{detail.feedback_comments}</p>}
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
