import React, { useState, useEffect, useCallback } from "react";
import { Plus, Loader2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
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
  candidateType: "External",
  toAddresses: "",
  teamsSubject: "", teamsParticipants: "", teamsStart: "", teamsEnd: "",
};
const BLANK_FB = { feedbackStatus: "", feedbackComments: "", shortlisted: false };

const LEVEL_ORDER = ["Round 1", "Round 2", "Round 3", "HR", "Final"];

const STATUS_CLS = {
  Scheduled: "bg-blue-100 text-blue-700",
  Completed:  "bg-[#fff7ed] text-[#f18200]",
  Cancelled:  "bg-red-100 text-red-600",
};
const FB_CLS = {
  Selected:       "bg-[#fff7ed] text-[#f18200]",
  "Not Selected": "bg-red-100 text-red-600",
  Hold:           "bg-amber-100 text-amber-600",
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
    <div className="flex items-center gap-1.5">
      <span className="w-6 h-6 rounded-full text-white flex items-center justify-center text-[11px] font-bold shrink-0"
        style={{ background: c }}>{num}</span>
      <span className="text-[12px] font-semibold px-2 py-[2px] rounded-full"
        style={{ background: b, color: c }}>{level}</span>
    </div>
  );
}

// ── Single row in accordion ────────────────────────────────────────────
function RoundRow({ iv, canFeedback, onFeedback, onView }) {
  const ss = STATUS_CLS[iv.status] ?? "bg-gray-100 text-gray-500";
  const fc = FB_CLS[iv.feedback_status];
  return (
    <div
      className={`grid items-center gap-3 px-4 py-3 border-b border-gray-100 ${iv.status === "Scheduled" ? "bg-[#fafffe]" : "bg-white"}`}
      style={{ gridTemplateColumns: "160px 1fr 120px 130px 160px auto" }}
    >
      <RoundBadge level={iv.level} />
      <div>
        <div className="text-[13px] font-semibold text-gray-900">
          {iv.interview_date?.slice(0,10)} {iv.interview_time ? "· " + iv.interview_time.slice(0,5) : ""}
        </div>
        <div className="text-[11px] text-gray-500">
          {iv.interviewer || "—"} · {iv.interview_type}
          {iv.duration_minutes ? " · " + (iv.duration_minutes < 60 ? iv.duration_minutes + "min" : iv.duration_minutes/60 + "hr") : ""}
        </div>
        {iv.to_addresses && (
          <div className="text-[10px] text-gray-500 mt-0.5">To: {iv.to_addresses}</div>
        )}
      </div>
      <span className={`text-[11px] font-bold px-2.5 py-[3px] rounded-full whitespace-nowrap ${ss}`}>{iv.status}</span>
      <div>
        {iv.feedback_status && fc ? (
          <span className={`text-[11px] font-bold px-2.5 py-[3px] rounded-full ${fc}`}>{iv.feedback_status}</span>
        ) : iv.status === "Completed" ? (
          <span className="text-[11px] text-gray-400">No feedback</span>
        ) : (
          <span className="text-[11px] text-gray-400">Pending</span>
        )}
        {iv.shortlisted === 1 && (
          <span className="text-[10px] font-bold ml-1 bg-[#fff7ed] text-[#f18200] px-1.5 py-px rounded-[10px]">Shortlisted</span>
        )}
      </div>
      <div className="text-[11px] text-gray-400">{iv.interview_code}</div>
      <div className="flex gap-1.5 shrink-0">
        <button onClick={() => onView(iv)} className="text-[11px] font-semibold text-gray-500 bg-transparent border border-gray-200 rounded-md px-2.5 py-[4px] cursor-pointer">View</button>
        {iv.status === "Scheduled" && canFeedback && (
          <button onClick={() => onFeedback(iv)} className="text-[11px] font-semibold text-white bg-[#f18200] border-0 rounded-md px-2.5 py-[4px] cursor-pointer">Feedback</button>
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
    <div className="border border-gray-200 rounded-[12px] overflow-hidden mb-2.5">
      <div
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-3.5 px-[18px] py-[14px] cursor-pointer transition-colors ${open ? "bg-gray-50 border-b border-gray-200" : "bg-white"}`}
      >
        <div className="w-10 h-10 rounded-full bg-[#1a2535] text-white flex items-center justify-center text-[15px] font-bold shrink-0">
          {(candidateName||"?").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-gray-900">{candidateName}</span>
            {rounds[0]?.candidate_type && (
              <span className={`text-[10px] font-bold px-1.5 py-px rounded-full ${
                rounds[0].candidate_type === "Internal"
                  ? "bg-violet-100 text-violet-700"
                  : "bg-sky-100 text-sky-700"
              }`}>{rounds[0].candidate_type}</span>
            )}
          </div>
          <div className="text-[12px] text-gray-500">{jobTitle}</div>
        </div>
        <div className="flex gap-1 items-center">
          {LEVEL_ORDER.map(lvl => {
            const round = rounds.find(r => r.level === lvl);
            if (!round) return <div key={lvl} title={lvl} className="w-2.5 h-2.5 rounded-full bg-gray-200" />;
            const dc = round.status === "Scheduled" ? "#1d4ed8" : round.feedback_status === "Selected" ? "#f18200" : round.feedback_status === "Not Selected" ? "#dc2626" : round.feedback_status === "Hold" ? "#d97706" : "#6b7280";
            return <div key={lvl} title={lvl + ": " + round.status} className="w-2.5 h-2.5 rounded-full border-2 border-white" style={{ background: dc, boxShadow: "0 0 0 1px " + dc }} />;
          })}
        </div>
        <span className="text-[11px] font-bold px-2.5 py-[3px] rounded-full whitespace-nowrap shrink-0"
          style={{ background: pipelineBg, color: pipelineColor }}>{pipelineLabel}</span>
        <span className="text-[11px] text-gray-400 whitespace-nowrap">{completedRounds.length}/{rounds.length} done</span>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </div>
      {open && (
        <div>
          <div
            className="grid gap-3 px-4 py-1.5 bg-gray-50 border-b border-gray-100"
            style={{ gridTemplateColumns: "160px 1fr 120px 130px 160px auto" }}
          >
            {["Round","Date & Interviewer","Status","Feedback","ID",""].map(h => (
              <div key={h} className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.05em]">{h}</div>
            ))}
          </div>
          {[...rounds].sort((a,b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level)).map(iv => (
            <RoundRow key={iv.interview_id} iv={iv} canFeedback={canFeedback} onFeedback={onFeedback} onView={onView} />
          ))}
          {lastIsSelected && scheduledRounds.length === 0 && !rejectedRound && canRaiseOffer && (
            <div className="flex items-center gap-3 px-[18px] py-3 bg-[#fff7ed] border-t border-dashed border-[#fed7aa]">
              <div className="flex-1">
                <div className="text-[12px] font-bold text-[#f18200]">{lastCompleted?.level} — Selected</div>
                <div className="text-[11px] text-[#92400e]">All interview levels are optional. You can raise an offer now or schedule another round.</div>
              </div>
              <button onClick={e => { e.stopPropagation(); onScheduleNext && onScheduleNext(rounds[0]); }}
                className="text-[12px] font-semibold text-blue-700 bg-blue-100 border-0 rounded-lg px-3.5 py-1.5 cursor-pointer whitespace-nowrap">
                + Schedule Next Round
              </button>
              <button onClick={e => { e.stopPropagation(); window.location.href = window.location.pathname.replace(/\?.*$/, "") + "?page=offers"; }}
                className="text-[12px] font-semibold text-white bg-[#f18200] border-0 rounded-lg px-3.5 py-1.5 cursor-pointer whitespace-nowrap">
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
  const [fbOpen, setFbOpen]       = useState(null);
  const [viewIv, setViewIv]       = useState(null);
  const [form, setForm] = useState(BLANK_INT);
  const [fb, setFb]     = useState(BLANK_FB);
  const [saving, setSaving] = useState(false);

  const isAdmin     = role === 1;
  const isTL        = role === 3 || role === 4;   // Reporting Manager + Recruiter Team Lead
  const isRecruiter = role === 5;
  const isExternal  = isRecruiter;
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
        candidateType:    form.candidateType || "External",
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
          <div className="flex gap-2">
            <Btn variant="secondary" icon={<RefreshCw size={14} />} onClick={loadInterviews} />
            <Btn icon={<Plus size={16} />} onClick={() => setSchedOpen(true)}>Schedule Interview</Btn>
          </div>
        )}
      />

      {/* Stats */}
      <div className="flex gap-2.5 mb-5 flex-wrap">
        {[
          { label:"Candidates", count: groups.length,                                                    color:"#6b7280", bg:"#f3f4f6" },
          { label:"Scheduled",  count: interviews.filter(iv=>iv.status==="Scheduled").length,            color:"#1d4ed8", bg:"#dbeafe" },
          { label:"Completed",  count: interviews.filter(iv=>iv.status==="Completed").length,            color:"#059669", bg:"#dcfce7" },
          { label:"Selected",   count: interviews.filter(iv=>iv.feedback_status==="Selected").length,    color:"#7c3aed", bg:"#ede9fe" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 px-3.5 py-1.5 rounded-full" style={{ background: s.bg }}>
            <span className="text-base font-bold" style={{ color: s.color }}>{s.count}</span>
            <span className="text-[12px] font-medium" style={{ color: s.color }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card className="!p-0 mb-4">
        <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search candidate, job, interview ID..." />
          <Select value={filterLevel}  onChange={e => setFilterLevel(e.target.value)}  options={levelOpts} />
          <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} options={statusOpts} />
          <div className="ml-auto text-[12px] text-gray-500">
            {loading ? "Loading..." : (groups.length + " candidate" + (groups.length !== 1 ? "s" : ""))}
          </div>
        </div>
      </Card>

      {/* Accordion list */}
      {loading ? (
        <div className="flex items-center justify-center gap-2.5 py-12 text-gray-500">
          <Loader2 size={20} /> Loading interviews...
        </div>
      ) : groups.length === 0 ? (
        <Card className="text-center text-gray-400 text-sm">No interviews found.</Card>
      ) : (
        <div className="flex flex-col gap-3">
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
          {isExternal ? (
            <div className="mb-4 px-3.5 py-2 bg-blue-100 border-l-[3px] border-blue-700 rounded-lg text-[13px] text-blue-800">
              External recruiters can update interview schedule details only.
            </div>
          ) : (
            <div className="mb-4 px-3.5 py-2 bg-[#fff7ed] border-l-[3px] border-[#f18200] rounded-lg text-[13px] text-[#92400e]">
              Schedule a new interview round. Teams invite will be generated automatically when type is "Teams".
            </div>
          )}

          <TwoColGrid>
            <Field label="Candidate" required>
              <select name="candidateId" value={form.candidateId} onChange={handleChange}
                className="w-full text-[13px] px-2.5 py-2 border border-gray-200 rounded-lg text-gray-700 outline-none bg-white"
                style={{ fontFamily: "inherit" }}>
                <option value="">Select candidate</option>
                {candidateOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Job Position">
              <select name="jobReqId" value={form.jobReqId} onChange={handleChange}
                className="w-full text-[13px] px-2.5 py-2 border border-gray-200 rounded-lg text-gray-700 outline-none bg-white"
                style={{ fontFamily: "inherit" }}>
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

          <Field label={isExternal ? "Interviewer Name (if known)" : "Interviewer Name"} required={!isExternal}>
            <Input name="interviewer" value={form.interviewer} onChange={handleChange} placeholder="Full name of the interviewer" />
          </Field>

          <Field label="Candidate Type" required>
            <Select
              name="candidateType"
              value={form.candidateType}
              onChange={handleChange}
              options={[
                { value: "External", label: "External — Outside Hire" },
                { value: "Internal", label: "Internal — Existing Employee" },
              ]}
            />
          </Field>

          <Field label="To (participants — separate emails with semicolons)">
            <textarea
              name="toAddresses"
              value={form.toAddresses}
              onChange={handleChange}
              placeholder="interviewer@company.com; candidate@email.com; hr@company.com"
              rows={2}
              className="w-full box-border text-[13px] px-2.5 py-2 border border-gray-200 rounded-lg text-gray-700 resize-y outline-none leading-relaxed bg-white"
              style={{ fontFamily: "inherit" }}
            />
            <div className="text-[11px] text-gray-400 mt-1">Separate multiple email addresses with semicolons ( ; )</div>
          </Field>

          {isTeams && !isExternal && (
            <div className="px-3.5 py-3 bg-[#eff6ff] border border-blue-200 rounded-lg mt-2">
              <div className="text-[12px] font-bold text-blue-800 mb-2.5">Microsoft Teams Meeting</div>
              <div className="text-[11px] text-blue-500 mb-2.5 px-2.5 py-1.5 bg-blue-100 rounded-md">
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

          {isTeams && isExternal && (
            <div className="mt-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-[12px] text-gray-500">
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
            <div className="mb-4 px-3.5 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-[12px] font-bold text-gray-500 mb-1">INTERVIEW DETAILS</div>
              <div className="text-[13px] text-gray-900 font-semibold">{fbOpen.candidate_name}</div>
              <div className="text-[12px] text-gray-500">
                {fbOpen.level} — {fbOpen.interview_type}
                {fbOpen.interview_date ? " · " + fbOpen.interview_date.slice(0,10) : ""}
                {fbOpen.interview_time ? " at " + fbOpen.interview_time.slice(0,5) : ""}
              </div>
              {fbOpen.interviewer && (
                <div className="text-[12px] text-gray-500 mt-0.5">Interviewer: {fbOpen.interviewer}</div>
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
            <label className="flex items-center gap-2 text-[13px] text-gray-700 cursor-pointer mt-2">
              <input type="checkbox" name="shortlisted" checked={fb.shortlisted} onChange={handleFbChange} className="accent-[#f18200]" />
              Mark as Shortlisted
            </label>
          </div>
        )}
      </Modal>

      {/* ── View Interview Modal ── */}
      <Modal open={!!viewIv} onClose={() => setViewIv(null)}
        title={"Interview - " + (viewIv?.candidate_name || "")} width={480}
        footer={
          <div className="flex gap-2.5 w-full justify-end">
            {viewIv?.status === "Scheduled" && canFeedback && (
              <Btn onClick={() => { openFeedback(viewIv); setViewIv(null); }}>Submit Feedback</Btn>
            )}
            <Btn variant="secondary" onClick={() => setViewIv(null)}>Close</Btn>
          </div>
        }>
        {viewIv && (
          <div>
            <div className="grid grid-cols-2 gap-x-5">
              <DetailRow label="Level"          value={viewIv.level} />
              <DetailRow label="Type"           value={viewIv.interview_type} />
              <DetailRow label="Date"           value={viewIv.interview_date?.slice(0,10)} />
              <DetailRow label="Time"           value={viewIv.interview_time?.slice(0,5)} />
              <DetailRow label="Interviewer"    value={viewIv.interviewer || "N/A"} />
              <DetailRow label="Duration"       value={viewIv.duration_minutes ? (viewIv.duration_minutes + " min") : "N/A"} />
              <DetailRow label="Candidate Type" value={
                <span className={`text-[11px] font-bold px-2 py-px rounded-full ${
                  viewIv.candidate_type === "Internal" ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700"
                }`}>{viewIv.candidate_type || "External"}</span>
              } />
              <DetailRow label="Status"         value={viewIv.status} />
              <DetailRow label="Outcome"        value={viewIv.feedback_status || "Pending"} />
            </div>
            {viewIv.to_addresses && (
              <div className="mt-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-[11px] font-bold text-gray-500 mb-1">PARTICIPANTS (TO)</div>
                <p className="text-[12px] text-gray-700 m-0">{viewIv.to_addresses}</p>
              </div>
            )}
            {viewIv.feedback_comments && (
              <div className="mt-3 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-[11px] font-bold text-gray-500 mb-1.5">FEEDBACK</div>
                <p className="text-[13px] text-gray-700 m-0 leading-relaxed">{viewIv.feedback_comments}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
