import React, { useState } from "react";
import { Plus, Eye, Calendar } from "lucide-react";
import {
  PageHeader, Card, Btn, Field, Input, Select, Textarea,
  Table, Modal, SlideOver, SearchBar, StatusBadge,
  TwoColGrid, DetailRow, EmptyState,
} from "./shared";
import {
  MOCK_CANDIDATES, MOCK_JOBS, MOCK_RECRUITERS, GENDERS,
  INTERVIEW_LEVELS, INTERVIEW_TYPES,
} from "./mockData";

const BLANK = {
  jobId: "", name: "", email: "", mobile: "",
  totalExp: "", relevantExp: "", currentCTC: "", expectedCTC: "",
  noticePeriod: "No", lwd: "", skills: "", gender: "",
  pinCode: "", city: "", state: "", district: "",
  source: "", resumeFile: "",
};

const BLANK_INT = {
  level: "Level 1", type: "OnCall", date: "", time: "", interviewer: "",
  teamsSubject: "", teamsParticipants: "", teamsStart: "", teamsEnd: "",
};

const NOTICE_OPTS = ["Yes", "No"];
const STATUS_OPTS = ["Work in Progress","Schedule Interview","Shortlisted","Offer Released","Offer Accepted","Offer Rejected","Joining Formalities","Onboarded"];

export default function CandidatesPage({ role, interviews = [], setInterviews }) {
  const [candidates, setCandidates] = useState(MOCK_CANDIDATES);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterJob, setFilterJob] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(BLANK);

  // Schedule interview from candidates page
  const [schedOpen, setSchedOpen] = useState(false);
  const [intForm, setIntForm] = useState(BLANK_INT);

  const isAdmin = role === 1;
  const isTL = role === 4;
  const isRecruiter = role === 5;

  // Recruiter sees only their candidates
  const myCandidates = isRecruiter
    ? candidates.filter(c => c.recruiterId === 22 || c.recruiterId === 23)
    : candidates;

  const filtered = myCandidates.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
    const matchS = !filterStatus || c.status === filterStatus;
    const matchJ = !filterJob || c.jobId === filterJob;
    return matchQ && matchS && matchJ;
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }
  function handleIntChange(e) {
    const { name, value } = e.target;
    setIntForm(f => ({ ...f, [name]: value }));
  }

  function handleAdd(e) {
    e.preventDefault();
    const newC = {
      ...form,
      id: `CAN${String(candidates.length + 1).padStart(3, "0")}`,
      totalExp: Number(form.totalExp) || 0,
      relevantExp: Number(form.relevantExp) || 0,
      currentCTC: Number(form.currentCTC) || 0,
      expectedCTC: Number(form.expectedCTC) || 0,
      noticePeriod: form.noticePeriod === "Yes",
      skills: form.skills ? form.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
      status: "Work in Progress",
      recruiterId: 22,
      addedDate: new Date().toISOString().slice(0, 10),
    };
    setCandidates(c => [newC, ...c]);
    setAddOpen(false);
    setForm(BLANK);
  }

  function openSchedule(candidate) {
    setIntForm({ ...BLANK_INT, candidateId: candidate.id, jobId: candidate.jobId });
    setSchedOpen(true);
  }

  function handleScheduleInterview(e) {
    e.preventDefault();
    if (!intForm.date || !intForm.time || !intForm.interviewer) return;
    const newIv = {
      ...intForm,
      id: `INT${String(interviews.length + 1).padStart(3, "0")}`,
      status: "Scheduled",
      feedbackStatus: null,
      feedbackComments: "",
      shortlisted: false,
    };
    if (setInterviews) setInterviews(ivs => [newIv, ...ivs]);
    // Update candidate status to Schedule Interview
    if (detail) {
      updateStatus(detail.id, "Schedule Interview");
    }
    setSchedOpen(false);
    setIntForm(BLANK_INT);
  }

  function updateStatus(id, status) {
    setCandidates(cs => cs.map(c => c.id === id ? { ...c, status } : c));
    setDetail(d => d?.id === id ? { ...d, status } : d);
  }

  const columns = [
    { header: "Candidate ID", key: "id", width: 100 },
    { header: "Name", key: "name", render: (v, row) => (
      <div>
        <div style={{ fontWeight: 600, color: "#111827" }}>{v}</div>
        <div style={{ fontSize: 11, color: "#6b7280" }}>{row.email}</div>
      </div>
    )},
    { header: "Applied For", key: "jobId", render: v => {
      const j = MOCK_JOBS.find(j => j.id === v);
      return j ? <div><div style={{ fontWeight: 500 }}>{j.title}</div><div style={{ fontSize: 11, color: "#6b7280" }}>{j.client}</div></div> : v;
    }},
    { header: "Experience", key: "totalExp", render: v => `${v} Yrs` },
    { header: "Current CTC", key: "currentCTC", render: v => `${(v/100000).toFixed(1)} LPA` },
    { header: "Expected CTC", key: "expectedCTC", render: v => `${(v/100000).toFixed(1)} LPA` },
    { header: "Notice Period", key: "noticePeriod", render: v => v ? "Serving" : "Immediate" },
    { header: "Status", key: "status", render: v => <StatusBadge status={v} /> },
    { header: "Source", key: "source" },
    { header: "", key: "id", width: 60, render: (_, row) => (
      <Btn size="sm" variant="ghost" icon={<Eye size={14} />} onClick={e => { e.stopPropagation(); setDetail(row); }}>View</Btn>
    )},
  ];

  const jobOpts = [{ value: "", label: "All Jobs" }, ...MOCK_JOBS.map(j => ({ value: j.id, label: j.title }))];
  const statusOpts = [{ value: "", label: "All Statuses" }, ...STATUS_OPTS.map(s => ({ value: s, label: s }))];
  const intJobOpts = MOCK_JOBS.map(j => ({ value: j.id, label: `${j.id} — ${j.title}` }));

  return (
    <div>
      <PageHeader
        breadcrumbs={["Dashboard", "Candidates"]}
        title={isRecruiter ? "My Candidates" : "Candidates"}
        subtitle="Track all candidate profiles and pipeline status"
        action={
          <Btn icon={<Plus size={16} />} onClick={() => setAddOpen(true)}>
            Add Candidate
          </Btn>
        }
      />

      {/* Status summary strip */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Total", count: filtered.length, color: "#6b7280", bg: "#f3f4f6" },
          { label: "Shortlisted", count: filtered.filter(c => c.status === "Shortlisted").length, color: "#0369a1", bg: "#e0f2fe" },
          { label: "In Interview", count: filtered.filter(c => c.status === "Schedule Interview").length, color: "#7c3aed", bg: "#ede9fe" },
          { label: "Offer Accepted", count: filtered.filter(c => c.status === "Offer Accepted").length, color: "#059669", bg: "#d1fae5" },
          { label: "Onboarded", count: filtered.filter(c => c.status === "Onboarded").length, color: "#166534", bg: "#dcfce7" },
        ].map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 20, background: s.bg, cursor: "pointer" }}
            onClick={() => setFilterStatus(s.label === "Total" ? "" : s.label)}>
            <span style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.count}</span>
            <span style={{ fontSize: 12, color: s.color, fontWeight: 500 }}>{s.label}</span>
          </div>
        ))}
      </div>

      <Card style={{ padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid #f0f0f0", flexWrap: "wrap" }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, ID..." />
          <Select value={filterJob} onChange={e => setFilterJob(e.target.value)} options={jobOpts} />
          <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} options={statusOpts} />
          <div style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280" }}>{filtered.length} candidates</div>
        </div>
        <Table columns={columns} data={filtered} onRowClick={r => setDetail(r)} />
      </Card>

      {/* ── Add Candidate SlideOver ── */}
      <SlideOver
        open={addOpen}
        onClose={() => { setAddOpen(false); setForm(BLANK); }}
        title="Add Candidate Details"
        width={580}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Btn>
            <Btn onClick={handleAdd}>Submit Candidate Info</Btn>
          </>
        }
      >
        <form onSubmit={handleAdd}>
          <div style={{ marginBottom: 16, padding: "10px 14px", background: "#fff7ed", borderRadius: 8, borderLeft: "3px solid #f18200", fontSize: 13, color: "#92400e" }}>
            Fields marked with <strong>*</strong> are mandatory.
          </div>

          <Field label="Job ID / Position" required>
            <Select name="jobId" value={form.jobId} onChange={handleChange}
              options={MOCK_JOBS.map(j => ({ value: j.id, label: `${j.id} — ${j.title} (${j.client})` }))}
              placeholder="Select job requirement" />
          </Field>

          <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10, marginTop: 4 }}>Personal Details</div>
          <TwoColGrid>
            <Field label="Full Name" required><Input name="name" value={form.name} onChange={handleChange} placeholder="Candidate full name" /></Field>
            <Field label="Email" required><Input name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@example.com" /></Field>
            <Field label="Mobile" required><Input name="mobile" value={form.mobile} onChange={handleChange} placeholder="10-digit mobile" /></Field>
            <Field label="Gender"><Select name="gender" value={form.gender} onChange={handleChange} options={GENDERS} placeholder="Select gender" /></Field>
          </TwoColGrid>

          <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Experience & CTC</div>
          <TwoColGrid>
            <Field label="Total Experience (Yrs)" required><Input name="totalExp" type="number" value={form.totalExp} onChange={handleChange} placeholder="e.g. 5" /></Field>
            <Field label="Relevant Experience (Yrs)" required><Input name="relevantExp" type="number" value={form.relevantExp} onChange={handleChange} placeholder="e.g. 4" /></Field>
            <Field label="Current CTC ()" required><Input name="currentCTC" type="number" value={form.currentCTC} onChange={handleChange} placeholder="Annual CTC in rupees" /></Field>
            <Field label="Expected CTC ()" required><Input name="expectedCTC" type="number" value={form.expectedCTC} onChange={handleChange} placeholder="Annual CTC in rupees" /></Field>
          </TwoColGrid>

          <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Notice Period</div>
          <TwoColGrid>
            <Field label="Currently Serving Notice Period?">
              <Select name="noticePeriod" value={form.noticePeriod} onChange={handleChange} options={NOTICE_OPTS} />
            </Field>
            {form.noticePeriod === "Yes" && (
              <Field label="Last Working Day (LWD)">
                <Input name="lwd" type="date" value={form.lwd} onChange={handleChange} />
              </Field>
            )}
          </TwoColGrid>

          <Field label="Skill Set (comma-separated)" required>
            <Input name="skills" value={form.skills} onChange={handleChange} placeholder="e.g. Java, Spring Boot, MySQL" />
          </Field>

          <Field label="Source">
            <Select name="source" value={form.source} onChange={handleChange}
              options={["Naukri.com","LinkedIn","Referral","Indeed","Monster","Direct","Other"]}
              placeholder="Select source" />
          </Field>

          <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Address</div>
          <TwoColGrid>
            <Field label="PIN Code"><Input name="pinCode" value={form.pinCode} onChange={handleChange} placeholder="6-digit PIN" /></Field>
            <Field label="City"><Input name="city" value={form.city} onChange={handleChange} placeholder="City" /></Field>
            <Field label="State"><Input name="state" value={form.state} onChange={handleChange} placeholder="State" /></Field>
            <Field label="District"><Input name="district" value={form.district} onChange={handleChange} placeholder="District" /></Field>
          </TwoColGrid>

          <Field label="Resume / Documents">
            <div style={{ border: "1.5px dashed #d1d5db", borderRadius: 8, padding: "20px", textAlign: "center", cursor: "pointer", background: "#f9fafb" }}>
              <div style={{ fontSize: 13, color: "#6b7280" }}>Attach file (Resume, Graduation Certificate, NOC)</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>PDF, DOCX up to 10 MB</div>
            </div>
          </Field>
        </form>
      </SlideOver>

      {/* ── Candidate Detail Modal ── */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Candidate Profile"
        width={680}
        footer={
          <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
            <div style={{ flex: 1 }}>
              <Select
                value={detail?.status || ""}
                onChange={e => updateStatus(detail.id, e.target.value)}
                options={STATUS_OPTS.map(s => ({ value: s, label: s }))}
              />
            </div>
            <Btn
              icon={<Calendar size={15} />}
              onClick={() => openSchedule(detail)}
              style={{ background: "#7c3aed", color: "#fff", border: "none" }}
            >
              Schedule Interview
            </Btn>
            <Btn variant="secondary" onClick={() => setDetail(null)}>Close</Btn>
          </div>
        }
      >
        {detail && (() => {
          const job = MOCK_JOBS.find(j => j.id === detail.jobId);
          return (
            <div>
              {/* Header card */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", background: "#f9fafb", borderRadius: 10, marginBottom: 20 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#1a2535", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
                  {detail.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>{detail.name}</div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>{detail.email} · {detail.mobile}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                    <StatusBadge status={detail.status} />
                    {detail.source && <span style={{ fontSize: 11, background: "#f3f4f6", padding: "2px 9px", borderRadius: 12, color: "#6b7280" }}>{detail.source}</span>}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>Candidate ID</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f18200" }}>{detail.id}</div>
                </div>
              </div>

              {/* Applied For */}
              {job && (
                <div style={{ padding: "10px 14px", background: "#fff7ed", borderRadius: 8, marginBottom: 16, borderLeft: "3px solid #f18200" }}>
                  <div style={{ fontSize: 11, color: "#92400e", fontWeight: 600 }}>APPLIED FOR</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{job.title} <span style={{ color: "#6b7280", fontWeight: 400 }}>@ {job.client}</span></div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
                <DetailRow label="Total Experience" value={`${detail.totalExp} Years`} />
                <DetailRow label="Relevant Experience" value={`${detail.relevantExp} Years`} />
                <DetailRow label="Current CTC" value={`${(detail.currentCTC/100000).toFixed(1)} LPA`} />
                <DetailRow label="Expected CTC" value={`${(detail.expectedCTC/100000).toFixed(1)} LPA`} />
                <DetailRow label="Notice Period" value={detail.noticePeriod ? `Serving (LWD: ${detail.lwd || "?"})` : "Immediate Joiner"} />
                <DetailRow label="Gender" value={detail.gender} />
                <DetailRow label="City" value={detail.city} />
                <DetailRow label="State" value={detail.state} />
                <DetailRow label="Added Date" value={detail.addedDate} />
              </div>

              {detail.skills?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 8 }}>SKILL SET</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {detail.skills.map(s => (
                      <span key={s} style={{ background: "#f3f4f6", padding: "3px 10px", borderRadius: 20, fontSize: 12, color: "#374151", fontWeight: 500 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {detail.resumeFile && (
                <div style={{ marginTop: 14, padding: "10px 14px", background: "#f9fafb", borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>📄</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{detail.resumeFile}</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>Resume uploaded</div>
                  </div>
                  <Btn size="sm" variant="secondary" style={{ marginLeft: "auto" }}>Download</Btn>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* ── Schedule Interview Modal ── */}
      <Modal
        open={schedOpen}
        onClose={() => { setSchedOpen(false); setIntForm(BLANK_INT); }}
        title="Schedule Interview"
        width={540}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setSchedOpen(false)}>Cancel</Btn>
            <Btn
              onClick={handleScheduleInterview}
              style={{ background: "#7c3aed", color: "#fff", border: "none" }}
            >
              Confirm &amp; Schedule
            </Btn>
          </>
        }
      >
        {detail && (
          <form onSubmit={handleScheduleInterview}>
            {/* Candidate + Job summary */}
            <div style={{ padding: "10px 14px", background: "#f5f3ff", borderRadius: 8, marginBottom: 16, borderLeft: "3px solid #7c3aed" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", marginBottom: 2 }}>CANDIDATE</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{detail.name}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{detail.email}</div>
              {(() => {
                const job = MOCK_JOBS.find(j => j.id === detail.jobId);
                return job ? <div style={{ fontSize: 12, color: "#7c3aed", marginTop: 4 }}>Position: {job.title} @ {job.client}</div> : null;
              })()}
            </div>

            <Field label="Job / Position" required>
              <Select name="jobId" value={intForm.jobId} onChange={handleIntChange} options={intJobOpts} placeholder="Select job" />
            </Field>

            <TwoColGrid>
              <Field label="Interview Level" required>
                <Select name="level" value={intForm.level} onChange={handleIntChange} options={INTERVIEW_LEVELS} />
              </Field>
              <Field label="Interview Type" required>
                <Select name="type" value={intForm.type} onChange={handleIntChange} options={INTERVIEW_TYPES} />
              </Field>
              <Field label="Date" required>
                <Input name="date" type="date" value={intForm.date} onChange={handleIntChange} />
              </Field>
              <Field label="Time" required>
                <Input name="time" type="time" value={intForm.time} onChange={handleIntChange} />
              </Field>
            </TwoColGrid>

            <Field label="Interviewer Name" required>
              <Input name="interviewer" value={intForm.interviewer} onChange={handleIntChange} placeholder="Full name of interviewer" />
            </Field>

            {intForm.type === "Microsoft Teams" && (
              <div style={{ padding: "12px 14px", background: "#eff6ff", borderRadius: 8, marginTop: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", marginBottom: 10 }}>Teams Meeting Details</div>
                <Field label="Meeting Subject">
                  <Input name="teamsSubject" value={intForm.teamsSubject} onChange={handleIntChange} placeholder="e.g. L1 Interview — Candidate Name" />
                </Field>
                <TwoColGrid>
                  <Field label="Start Time"><Input name="teamsStart" type="datetime-local" value={intForm.teamsStart} onChange={handleIntChange} /></Field>
                  <Field label="End Time"><Input name="teamsEnd" type="datetime-local" value={intForm.teamsEnd} onChange={handleIntChange} /></Field>
                </TwoColGrid>
                <Field label="Participants (comma-separated emails)">
                  <Input name="teamsParticipants" value={intForm.teamsParticipants} onChange={handleIntChange} placeholder="email1@natit.com, email2@natit.com" />
                </Field>
              </div>
            )}
          </form>
        )}
      </Modal>
    </div>
  );
}
