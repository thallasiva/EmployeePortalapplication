import React, { useState } from "react";
import { Plus, Eye, MessageSquare } from "lucide-react";
import {
  PageHeader, Card, Btn, Field, Input, Select, Textarea,
  Table, Modal, SlideOver, SearchBar, StatusBadge,
  TwoColGrid, DetailRow, EmptyState,
} from "./shared";
import {
  MOCK_INTERVIEWS, MOCK_CANDIDATES, MOCK_JOBS,
  INTERVIEW_LEVELS, INTERVIEW_TYPES, FEEDBACK_STATUSES,
  getCandidateName, getJobTitle,
} from "./mockData";

const BLANK_INT = {
  candidateId: "", jobId: "", level: "Level 1", type: "OnCall",
  date: "", time: "", interviewer: "",
  teamsSubject: "", teamsParticipants: "", teamsStart: "", teamsEnd: "",
};
const BLANK_FB = { feedbackStatus: "", feedbackComments: "", shortlisted: false };

export default function InterviewsPage({ role, interviews = MOCK_INTERVIEWS, setInterviews }) {
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [schedOpen, setSchedOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [fbOpen, setFbOpen] = useState(null);
  const [form, setForm] = useState(BLANK_INT);
  const [fb, setFb] = useState(BLANK_FB);

  const isAdmin = role === 1;
  const isTL = role === 4;
  const canSchedule = isAdmin || isTL;

  const filtered = interviews.filter(iv => {
    const q = search.toLowerCase();
    const cn = getCandidateName(iv.candidateId).toLowerCase();
    const jt = getJobTitle(iv.jobId).toLowerCase();
    const matchQ = !q || cn.includes(q) || jt.includes(q) || (iv.id || "").toLowerCase().includes(q);
    const matchL = !filterLevel || iv.level === filterLevel;
    const matchS = !filterStatus || iv.status === filterStatus;
    return matchQ && matchL && matchS;
  });

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }
  function handleFbChange(e) {
    const { name, value, type, checked } = e.target;
    setFb(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  function handleSchedule(e) {
    e.preventDefault();
    const newIv = {
      ...form,
      id: `INT${String(interviews.length + 1).padStart(3, "0")}`,
      status: "Scheduled",
      feedbackStatus: null, feedbackComments: "", shortlisted: false,
    };
    if (setInterviews) setInterviews(iv => [newIv, ...iv]);
    setSchedOpen(false);
    setForm(BLANK_INT);
  }

  function handleFeedback(e) {
    e.preventDefault();
    if (setInterviews) {
      setInterviews(ivs => ivs.map(iv =>
        iv.id === fbOpen.id
          ? { ...iv, feedbackStatus: fb.feedbackStatus, feedbackComments: fb.feedbackComments, shortlisted: fb.shortlisted, status: "Completed" }
          : iv
      ));
    }
    setFbOpen(null);
    setFb(BLANK_FB);
  }

  function openFeedback(row) {
    setFbOpen(row);
    setFb({ feedbackStatus: row.feedbackStatus || "", feedbackComments: row.feedbackComments || "", shortlisted: !!row.shortlisted });
  }

  const IVStatusColor = {
    Scheduled: { color: "#1d4ed8", bg: "#dbeafe" },
    Completed: { color: "#059669", bg: "#d1fae5" },
    Cancelled: { color: "#dc2626", bg: "#fee2e2" },
  };

  const columns = [
    { header: "Interview ID", key: "id", width: 100 },
    { header: "Candidate", key: "candidateId", render: (v, row) => (
      <div>
        <div style={{ fontWeight: 600, color: "#111827" }}>{getCandidateName(v)}</div>
        <div style={{ fontSize: 11, color: "#6b7280" }}>{getJobTitle(row.jobId)}</div>
      </div>
    )},
    { header: "Level", key: "level" },
    { header: "Type", key: "type" },
    { header: "Date & Time", key: "date", render: (v, row) => (
      <div>
        <div style={{ fontWeight: 500 }}>{v}</div>
        <div style={{ fontSize: 11, color: "#6b7280" }}>{row.time}</div>
      </div>
    )},
    { header: "Interviewer", key: "interviewer" },
    { header: "Status", key: "status", render: v => {
      const s = IVStatusColor[v] || { color: "#6b7280", bg: "#f3f4f6" };
      return <span style={{ background: s.bg, color: s.color, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{v}</span>;
    }},
    { header: "Feedback", key: "feedbackStatus", render: (v, row) => {
      if (!v) return <span style={{ color: "#9ca3af", fontSize: 12 }}>Pending</span>;
      const colors = { Selected: "#059669", "Not Selected": "#dc2626", Hold: "#d97706" };
      return (
        <div>
          <span style={{ color: colors[v] || "#6b7280", fontWeight: 600, fontSize: 12 }}>{v}</span>
          {row.shortlisted && <span style={{ fontSize: 10, background: "#d1fae5", color: "#059669", marginLeft: 4, padding: "1px 6px", borderRadius: 10, fontWeight: 600 }}>Shortlisted</span>}
        </div>
      );
    }},
    { header: "", key: "id", width: 130, render: (_, row) => (
      <div style={{ display: "flex", gap: 6 }}>
        <Btn size="sm" variant="ghost" icon={<Eye size={13} />} onClick={e => { e.stopPropagation(); setDetail(row); }}>View</Btn>
        {row.status === "Scheduled" && canSchedule && (
          <Btn size="sm" variant="secondary" icon={<MessageSquare size={13} />} onClick={e => { e.stopPropagation(); openFeedback(row); }}>Feedback</Btn>
        )}
      </div>
    )},
  ];

  const levelOpts = [{ value: "", label: "All Levels" }, ...INTERVIEW_LEVELS.map(l => ({ value: l, label: l }))];
  const statusOpts = [
    { value: "", label: "All Statuses" },
    { value: "Scheduled",  label: "Scheduled" },
    { value: "Completed",  label: "Completed" },
    { value: "Cancelled",  label: "Cancelled" },
  ];
  const candidateOpts = MOCK_CANDIDATES.map(c => ({ value: c.id, label: `${c.id} — ${c.name}` }));
  const jobOpts = MOCK_JOBS.map(j => ({ value: j.id, label: `${j.id} — ${j.title}` }));

  return (
    <div>
      <PageHeader
        breadcrumbs={["Dashboard", "Interviews"]}
        title="Interview Schedule"
        subtitle="Schedule and track candidate interview rounds"
        action={canSchedule && (
          <Btn icon={<Plus size={16} />} onClick={() => setSchedOpen(true)}>
            Schedule Interview
          </Btn>
        )}
      />

      {/* Stats strip */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Total", count: interviews.length, color: "#6b7280", bg: "#f3f4f6" },
          { label: "Scheduled", count: interviews.filter(iv => iv.status === "Scheduled").length, color: "#1d4ed8", bg: "#dbeafe" },
          { label: "Completed", count: interviews.filter(iv => iv.status === "Completed").length, color: "#059669", bg: "#d1fae5" },
          { label: "Shortlisted", count: interviews.filter(iv => iv.shortlisted).length, color: "#0369a1", bg: "#e0f2fe" },
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
          <Select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} options={levelOpts} />
          <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} options={statusOpts} />
          <div style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280" }}>{filtered.length} interviews</div>
        </div>
        <Table columns={columns} data={filtered} onRowClick={r => setDetail(r)} />
      </Card>

      {/* ── Schedule SlideOver ── */}
      <SlideOver
        open={schedOpen}
        onClose={() => { setSchedOpen(false); setForm(BLANK_INT); }}
        title="Schedule Interview"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setSchedOpen(false)}>Cancel</Btn>
            <Btn onClick={handleSchedule}>Confirm Schedule</Btn>
          </>
        }
      >
        <form onSubmit={handleSchedule}>
          <Field label="Candidate" required>
            <Select name="candidateId" value={form.candidateId} onChange={handleChange} options={candidateOpts} placeholder="Select candidate" />
          </Field>
          <Field label="Job / Position" required>
            <Select name="jobId" value={form.jobId} onChange={handleChange} options={jobOpts} placeholder="Select job" />
          </Field>
          <TwoColGrid>
            <Field label="Interview Level" required>
              <Select name="level" value={form.level} onChange={handleChange} options={INTERVIEW_LEVELS} />
            </Field>
            <Field label="Interview Type" required>
              <Select name="type" value={form.type} onChange={handleChange} options={INTERVIEW_TYPES} />
            </Field>
            <Field label="Date" required>
              <Input name="date" type="date" value={form.date} onChange={handleChange} />
            </Field>
            <Field label="Time" required>
              <Input name="time" type="time" value={form.time} onChange={handleChange} />
            </Field>
          </TwoColGrid>
          <Field label="Interviewer Name" required>
            <Input name="interviewer" value={form.interviewer} onChange={handleChange} placeholder="Full name" />
          </Field>

          {form.type === "Microsoft Teams" && (
            <div style={{ padding: "12px 14px", background: "#eff6ff", borderRadius: 8, marginTop: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", marginBottom: 10 }}>Teams Meeting Details</div>
              <Field label="Meeting Subject">
                <Input name="teamsSubject" value={form.teamsSubject} onChange={handleChange} placeholder="e.g. L2 Interview — John Doe" />
              </Field>
              <TwoColGrid>
                <Field label="Start Time"><Input name="teamsStart" type="datetime-local" value={form.teamsStart} onChange={handleChange} /></Field>
                <Field label="End Time"><Input name="teamsEnd" type="datetime-local" value={form.teamsEnd} onChange={handleChange} /></Field>
              </TwoColGrid>
              <Field label="Participants (comma-separated emails)">
                <Input name="teamsParticipants" value={form.teamsParticipants} onChange={handleChange} placeholder="email1@natit.com, email2@natit.com" />
              </Field>
            </div>
          )}
        </form>
      </SlideOver>

      {/* ── Feedback Modal ── */}
      <Modal
        open={!!fbOpen}
        onClose={() => setFbOpen(null)}
        title={`Interview Feedback — ${fbOpen?.id || ""}`}
        width={480}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setFbOpen(null)}>Cancel</Btn>
            <Btn onClick={handleFeedback}>Submit Feedback</Btn>
          </>
        }
      >
        {fbOpen && (
          <form onSubmit={handleFeedback}>
            <div style={{ padding: "10px 14px", background: "#f9fafb", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              <strong>{getCandidateName(fbOpen.candidateId)}</strong> — {fbOpen.level} ({fbOpen.type}) on {fbOpen.date} at {fbOpen.time}
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
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Interview Details"
        width={580}
        footer={<Btn variant="secondary" onClick={() => setDetail(null)}>Close</Btn>}
      >
        {detail && (() => {
          const s = IVStatusColor[detail.status] || { color: "#6b7280", bg: "#f3f4f6" };
          return (
            <div>
              <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ background: s.bg, color: s.color, padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{detail.status}</span>
                <span style={{ background: "#f3f4f6", color: "#374151", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{detail.level}</span>
                <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{detail.type}</span>
                {detail.shortlisted && <span style={{ background: "#d1fae5", color: "#059669", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>Shortlisted</span>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
                <DetailRow label="Interview ID" value={detail.id} />
                <DetailRow label="Candidate" value={getCandidateName(detail.candidateId)} />
                <DetailRow label="Job Position" value={getJobTitle(detail.jobId)} />
                <DetailRow label="Interviewer" value={detail.interviewer} />
                <DetailRow label="Date" value={detail.date} />
                <DetailRow label="Time" value={detail.time} />
              </div>
              {detail.type === "Microsoft Teams" && detail.teamsSubject && (
                <div style={{ marginTop: 12, padding: "12px 14px", background: "#eff6ff", borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", marginBottom: 8 }}>Teams Meeting</div>
                  <DetailRow label="Subject" value={detail.teamsSubject} />
                  {detail.teamsParticipants && <DetailRow label="Participants" value={detail.teamsParticipants} />}
                  {detail.teamsStart && <DetailRow label="Start" value={detail.teamsStart} />}
                  {detail.teamsEnd && <DetailRow label="End" value={detail.teamsEnd} />}
                </div>
              )}
              {detail.feedbackStatus && (
                <div style={{ marginTop: 12, padding: "12px 14px", background: "#f9fafb", borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 8 }}>FEEDBACK</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: detail.feedbackStatus === "Selected" ? "#059669" : detail.feedbackStatus === "Not Selected" ? "#dc2626" : "#d97706" }}>{detail.feedbackStatus}</div>
                  {detail.feedbackComments && <p style={{ fontSize: 13, color: "#374151", marginTop: 6, lineHeight: 1.5 }}>{detail.feedbackComments}</p>}
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
