import React, { useState, useEffect, useCallback } from "react";
import { Plus, Eye, MessageSquare, Loader2, RefreshCw } from "lucide-react";
import {
  PageHeader, Card, Btn, Field, Input, Select, Textarea,
  Table, Modal, SlideOver, SearchBar, StatusBadge,
  TwoColGrid, DetailRow,
} from "./shared";
import { INTERVIEW_LEVELS, INTERVIEW_TYPES, FEEDBACK_STATUSES } from "./mockData";
import {
  listInterviews, scheduleInterview, submitFeedback as apiSubmitFeedback,
  cancelInterview as apiCancelInterview, listCandidates, listJobs, getErrorMessage,
} from "../../../api/recruitment.api";
import { successToast, errorToast } from "../../../utils/ToastControllers";

const BLANK_INT = {
  candidateId: "", jobReqId: "", level: "Round 1", interviewType: "Video Call",
  interviewDate: "", interviewTime: "", durationMinutes: 60, interviewer: "",
  teamsSubject: "", teamsParticipants: "", teamsStart: "", teamsEnd: "",
};
const BLANK_FB = { feedbackStatus: "", feedbackComments: "", shortlisted: false };

const IV_COLOR = {
  Scheduled: { color: "#1d4ed8", bg: "#dbeafe" },
  Completed: { color: "#059669", bg: "#d1fae5" },
  Cancelled: { color: "#dc2626", bg: "#fee2e2" },
};

export default function InterviewsPage({ role }) {
  const [interviews, setInterviews] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [schedOpen, setSchedOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [fbOpen, setFbOpen] = useState(null);
  const [form, setForm] = useState(BLANK_INT);
  const [fb, setFb] = useState(BLANK_FB);
  const [saving, setSaving] = useState(false);

  const isAdmin     = role === 1;
  const isTL        = role === 4;   // HR Manager / Recruiter Team Lead
  const isRecruiter = role === 5;
  const canSchedule = isAdmin || isTL || isRecruiter;  // All recruitment roles can schedule
  const canFeedback = isAdmin || isTL;                  // Only HR Manager / TL gives feedback

  // ── Load dropdown data ──────────────────────────────────────────
  useEffect(() => {
    listCandidates({ limit: 500 }).then(r => setCandidates(r?.data ?? [])).catch(() => {});
    listJobs({ limit: 200 }).then(r => setJobs(r?.data ?? [])).catch(() => {});
  }, []);

  // ── Load interviews ─────────────────────────────────────────────
  const loadInterviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 200 };
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

  // ── Schedule interview ──────────────────────────────────────────
  async function handleSchedule(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await scheduleInterview({
        candidateId:   Number(form.candidateId),
        jobReqId:      Number(form.jobReqId),
        level:         form.level,
        interviewType: form.interviewType,
        interviewDate:   form.interviewDate,
        interviewTime:   form.interviewTime || null,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null,
        interviewer:     form.interviewer || null,
        teamsSubject:  form.teamsSubject || null,
        teamsParticipants: form.teamsParticipants || null,
        teamsStart:    form.teamsStart || null,
        teamsEnd:      form.teamsEnd || null,
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

  // ── Submit feedback ─────────────────────────────────────────────
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

  // Local filter
  const filtered = interviews.filter(iv => {
    const q = search.toLowerCase();
    const matchQ = !q || (iv.candidate_name||"").toLowerCase().includes(q)
      || (iv.interview_code||"").toLowerCase().includes(q)
      || (iv.job_title||"").toLowerCase().includes(q);
    const matchL = !filterLevel  || iv.level  === filterLevel;
    const matchS = !filterStatus || iv.status === filterStatus;
    return matchQ && matchL && matchS;
  });

  const columns = [
    { header: "ID",        key: "interview_code", width: 100 },
    { header: "Candidate", key: "candidate_name", render: (v, row) => (
      <div>
        <div style={{ fontWeight: 600, color: "#111827" }}>{v}</div>
        <div style={{ fontSize: 11, color: "#6b7280" }}>{row.job_title}</div>
      </div>
    )},
    { header: "Level",     key: "level" },
    { header: "Type",      key: "interview_type" },
    { header: "Date & Time", key: "interview_date", render: (v, row) => (
      <div>
        <div style={{ fontWeight: 500 }}>{v}</div>
        <div style={{ fontSize: 11, color: "#6b7280" }}>{row.interview_time}</div>
      </div>
    )},
    { header: "Interviewer", key: "interviewer" },
    { header: "Status",    key: "status", render: v => {
      const s = IV_COLOR[v] || { color: "#6b7280", bg: "#f3f4f6" };
      return <span style={{ background: s.bg, color: s.color, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{v}</span>;
    }},
    { header: "Feedback",  key: "feedback_status", render: (v, row) => {
      if (!v) return <span style={{ color: "#9ca3af", fontSize: 12 }}>Pending</span>;
      const colors = { Selected: "#059669", "Not Selected": "#dc2626", Hold: "#d97706" };
      return (
        <div>
          <span style={{ color: colors[v] || "#6b7280", fontWeight: 600, fontSize: 12 }}>{v}</span>
          {row.shortlisted === 1 && <span style={{ fontSize: 10, background: "#d1fae5", color: "#059669", marginLeft: 4, padding: "1px 6px", borderRadius: 10, fontWeight: 600 }}>Shortlisted</span>}
        </div>
      );
    }},
    { header: "", key: "interview_id", width: 130, render: (_, row) => (
      <div style={{ display: "flex", gap: 6 }}>
        <Btn size="sm" variant="ghost" icon={<Eye size={13} />} onClick={e => { e.stopPropagation(); setDetail(row); }}>View</Btn>
        {row.status === "Scheduled" && canFeedback && (
          <Btn size="sm" variant="secondary" icon={<MessageSquare size={13} />} onClick={e => { e.stopPropagation(); openFeedback(row); }}>Feedback</Btn>
        )}
      </div>
    )},
  ];

  const levelOpts  = [{ value: "", label: "All Levels" },   ...INTERVIEW_LEVELS.map(l => ({ value: l, label: l }))];
  const statusOpts = [{ value: "", label: "All Statuses" }, { value: "Scheduled", label: "Scheduled" }, { value: "Completed", label: "Completed" }, { value: "Cancelled", label: "Cancelled" }];
  const candidateOpts = candidates.map(c => ({ value: String(c.candidate_id), label: `${c.candidate_code} — ${c.name}` }));
  const jobOpts       = jobs.map(j => ({ value: String(j.job_req_id), label: `${j.job_req_code} — ${j.title}` }));

  return (
    <div>
      <PageHeader
        breadcrumbs={["Dashboard", "Interviews"]}
        title="Interview Schedule"
        subtitle="Schedule and track candidate interview rounds"
        action={canSchedule && (
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="secondary" icon={<RefreshCw size={14} />} onClick={loadInterviews} />
            <Btn icon={<Plus size={16} />} onClick={() => setSchedOpen(true)}>Schedule Interview</Btn>
          </div>
        )}
      />

      {/* Stats strip */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Total",       count: interviews.length,                                     color: "#6b7280", bg: "#f3f4f6" },
          { label: "Scheduled",   count: interviews.filter(iv => iv.status === "Scheduled").length,  color: "#1d4ed8", bg: "#dbeafe" },
          { label: "Completed",   count: interviews.filter(iv => iv.status === "Completed").length,  color: "#059669", bg: "#d1fae5" },
          { label: "Shortlisted", count: interviews.filter(iv => iv.shortlisted === 1).length,  color: "#0369a1", bg: "#e0f2fe" },
        ].map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 20, background: s.bg }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.count}</span>
            <span style={{ fontSize: 12, color: s.color, fontWeight: 500 }}>{s.label}</span>
          </div>
        ))}
      </div>

      <Card style={{ padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid #f0f0f0", flexWrap: "wrap" }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by candidate, job, ID..." />
          <Select value={filterLevel}  onChange={e => setFilterLevel(e.target.value)}  options={levelOpts} />
          <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} options={statusOpts} />
          <div style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280" }}>
            {loading ? "Loading…" : `${filtered.length} interviews`}
          </div>
        </div>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 48, color: "#6b7280" }}>
            <Loader2 size={20} /> Loading interviews…
          </div>
        ) : (
          <Table columns={columns} data={filtered} onRowClick={r => setDetail(r)} />
        )}
      </Card>

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
                  <option key={m} value={m}>{m < 60 ? `${m} min` : `${m/60} hr${m > 60 ? "s" : ""}`}</option>
                ))}
              </select>
            </Field>
            <Field label="To Time (estimated)">
              <input type="time" readOnly
                value={(() => {
                  if (!form.interviewTime || !form.durationMinutes) return "";
                  const [h, min] = form.interviewTime.split(":").map(Number);
                  const total = h * 60 + min + Number(form.durationMinutes);
                  return `${String(Math.floor(total/60) % 24).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`;
                })()}
                style={{ width:"100%", fontSize:13, padding:"8px 10px", border:"1px solid #e5e7eb", borderRadius:8, color:"#6b7280", background:"#f9fafb" }}
              />
            </Field>
          </TwoColGrid>
          <Field label="Interviewer Name">
            <Input name="interviewer" value={form.interviewer} onChange={handleChange} placeholder="Full name" />
          </Field>
          {form.interviewType === "Teams" && (
            <div style={{ padding: "12px 14px", background: "#eff6ff", borderRadius: 8, marginTop: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", marginBottom: 10 }}>Teams Meeting Details</div>
              <Field label="Meeting Subject"><Input name="teamsSubject" value={form.teamsSubject} onChange={handleChange} placeholder="e.g. L2 Interview — Candidate Name" /></Field>
              <TwoColGrid>
                <Field label="Start Time"><Input name="teamsStart" type="datetime-local" value={form.teamsStart} onChange={handleChange} /></Field>
                <Field label="End Time"><Input name="teamsEnd" type="datetime-local" value={form.teamsEnd} onChange={handleChange} /></Field>
              </TwoColGrid>
              <Field label="Participants (comma-separated)">
                <Input name="teamsParticipants" value={form.teamsParticipants} onChange={handleChange} placeholder="email1@natit.com, email2@natit.com" />
              </Field>
            </div>
          )}
        </form>
      </SlideOver>

      {/* ── Feedback Modal ── */}
      <Modal open={!!fbOpen} onClose={() => setFbOpen(null)}
        title={`Interview Feedback — ${fbOpen?.interview_code || ""}`} width={480}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setFbOpen(null)}>Cancel</Btn>
            <Btn onClick={handleFeedback} disabled={saving}>{saving ? "Submitting…" : "Submit Feedback"}</Btn>
          </>
        }>
        {fbOpen && (
          <form onSubmit={handleFeedback}>
            <div style={{ padding: "10px 14px", background: "#f9fafb", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              <strong>{fbOpen.candidate_name}</strong> — {fbOpen.level} ({fbOpen.interview_type}) on {fbOpen.interview_date}
            </div>
            <Field label="Interview Result" required>
              <Select name="feedbackStatus" value={fb.feedbackStatus} onChange={handleFbChange}
                options={FEEDBACK_STATUSES} placeholder="Select result" />
            </Field>
            <Field label="Feedback Comments">
              <Textarea name="feedbackComments" value={fb.feedbackComments} onChange={handleFbChange}
                placeholder="Detailed feedback, strengths, areas to improve..." rows={4} />
            </Field>
            <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", cursor: "pointer" }}>
              <input type="checkbox" name="shortlisted" checked={fb.shortlisted} onChange={handleFbChange} style={{ accentColor: "#f18200", width: 16, height: 16 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Shortlist Candidate</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>Mark candidate as shortlisted for offer release</div>
              </div>
            </label>
          </form>
        )}
      </Modal>

      {/* ── Detail Modal ── */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Interview Details" width={580}
        footer={<Btn variant="secondary" onClick={() => setDetail(null)}>Close</Btn>}>
        {detail && (() => {
          const s = IV_COLOR[detail.status] || { color: "#6b7280", bg: "#f3f4f6" };
          return (
            <div>
              <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ background: s.bg, color: s.color, padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{detail.status}</span>
                <span style={{ background: "#f3f4f6", color: "#374151", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{detail.level}</span>
                <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{detail.interview_type}</span>
                {detail.shortlisted === 1 && <span style={{ background: "#d1fae5", color: "#059669", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>Shortlisted</span>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
                <DetailRow label="Interview ID"  value={detail.interview_code} />
                <DetailRow label="Candidate"     value={detail.candidate_name} />
                <DetailRow label="Job Position"  value={detail.job_title} />
                <DetailRow label="Interviewer"   value={detail.interviewer} />
                <DetailRow label="Date"          value={detail.interview_date} />
                <DetailRow label="From"          value={detail.interview_time} />
                <DetailRow label="Duration"      value={detail.duration_minutes ? (detail.duration_minutes < 60 ? `${detail.duration_minutes} min` : `${detail.duration_minutes/60} hr${detail.duration_minutes > 60 ? "s" : ""}`) : "—"} />
                <DetailRow label="To (est.)"     value={(() => {
                  if (!detail.interview_time || !detail.duration_minutes) return "—";
                  const [h, m] = detail.interview_time.split(":").map(Number);
                  const total = h * 60 + m + Number(detail.duration_minutes);
                  return `${String(Math.floor(total/60)%24).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`;
                })()} />
              </div>
              {(detail.teams_subject || detail.teams_join_url) && (
                <div style={{ marginTop: 12, padding: "14px 16px", background: "#eff6ff", borderRadius: 8, border: "1px solid #bfdbfe" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", marginBottom: 10 }}>Teams Meeting</div>
                  {detail.teams_subject && <DetailRow label="Subject" value={detail.teams_subject} />}
                  {detail.teams_participants && <DetailRow label="Participants" value={detail.teams_participants} />}
                  {detail.teams_join_url && (
                    <div style={{ marginTop: 10 }}>
                      <a href={detail.teams_join_url} target="_blank" rel="noopener noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#1d4ed8", color: "#fff", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                        🔗 Join Teams Meeting
                      </a>
                      <div style={{ marginTop: 6, fontSize: 11, color: "#6b7280", wordBreak: "break-all" }}>
                        {detail.teams_join_url}
                      </div>
                    </div>
                  )}
                  {!detail.teams_join_url && (
                    <div style={{ marginTop: 6, fontSize: 12, color: "#93c5fd" }}>Meeting link being generated…</div>
                  )}
                </div>
              )}
              {detail.feedback_status && (
                <div style={{ marginTop: 12, padding: "12px 14px", background: "#f9fafb", borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 8 }}>FEEDBACK</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: detail.feedback_status === "Selected" ? "#059669" : detail.feedback_status === "Not Selected" ? "#dc2626" : "#d97706" }}>{detail.feedback_status}</div>
                  {detail.feedback_comments && <p style={{ fontSize: 13, color: "#374151", marginTop: 6, lineHeight: 1.5 }}>{detail.feedback_comments}</p>}
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
