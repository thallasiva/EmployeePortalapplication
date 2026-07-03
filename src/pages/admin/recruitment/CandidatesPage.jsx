import React, { useState, useEffect, useCallback } from "react";
import { Plus, Eye, Calendar, Loader2, RefreshCw } from "lucide-react";
import {
  PageHeader, Card, Btn, Field, Input, Select, Textarea,
  Table, Modal, SlideOver, SearchBar, StatusBadge,
  TwoColGrid, DetailRow,
} from "./shared";
import { GENDERS, INTERVIEW_LEVELS, INTERVIEW_TYPES } from "./mockData";
import {
  listCandidates, createCandidate, updateCandidateStatus as apiUpdateStatus,
  scheduleInterview, listJobs, listRecruiters, listInterviews, getErrorMessage,
} from "../../../api/recruitment.api";
import { successToast, errorToast } from "../../../utils/ToastControllers";

const BLANK = {
  jobReqId: "", name: "", email: "", mobile: "", recruiterId: "",
  totalExperience: "", relevantExperience: "", currentCtc: "", expectedCtc: "",
  noticePeriodServing: false, lastWorkingDay: "", skillSet: "", gender: "",
  pinCode: "", city: "", state: "", district: "", source: "",
};

const BLANK_INT = {
  level: "Round 1", interviewType: "Video Call", interviewDate: "", interviewTime: "",
  durationMinutes: 60, interviewer: "", teamsSubject: "", teamsParticipants: "", teamsStart: "", teamsEnd: "",
};

const STATUS_OPTS = [
  "Work in Progress","Schedule Interview","Shortlisted","Offer Released",
  "Offer Accepted","Offer Rejected","Joining Formalities","Onboarded",
];

const LEVEL_ORDER = ["Round 1","Round 2","Round 3","HR","Final"];

const FB_COLORS = {
  "Selected":     { color: "#059669", bg: "#d1fae5" },
  "Not Selected": { color: "#dc2626", bg: "#fee2e2" },
  "Hold":         { color: "#d97706", bg: "#fef3c7" },
};

// ── Interview history shown inside candidate detail modal ─────────────
function InterviewHistory({ candidateId }) {
  const [ivs, setIvs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!candidateId) return;
    setLoading(true);
    listInterviews({ candidateId, limit: 20 })
      .then(r => setIvs(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [candidateId]);

  if (loading) return <div style={{ marginTop: 16, fontSize: 13, color: "#9ca3af" }}>Loading interview history…</div>;
  if (!ivs.length) return null;

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        Interview History ({ivs.length} round{ivs.length !== 1 ? "s" : ""})
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ivs.map((iv, i) => {
          const fb = FB_COLORS[iv.feedback_status];
          const isScheduled = iv.status === "Scheduled";
          return (
            <div key={iv.interview_id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 14px", borderRadius: 8,
              background: isScheduled ? "#f0fdf4" : "#f9fafb",
              border: `1px solid ${isScheduled ? "#bbf7d0" : "#e5e7eb"}`,
            }}>
              {/* Round badge */}
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: isScheduled ? "#059669" : iv.feedback_status === "Selected" ? "#6d28d9" : iv.feedback_status === "Not Selected" ? "#dc2626" : "#e5e7eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {LEVEL_ORDER.indexOf(iv.level) + 1 || i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{iv.level}</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>
                  {iv.interview_date?.slice(0, 10)} · {iv.interview_time} · {iv.interviewer}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {isScheduled && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#059669", background: "#d1fae5", padding: "2px 8px", borderRadius: 20 }}>Scheduled</span>
                )}
                {iv.feedback_status && fb && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: fb.color, background: fb.bg, padding: "2px 8px", borderRadius: 20 }}>
                    {iv.feedback_status}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CandidatesPage({ role }) {
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterJob, setFilterJob] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [schedOpen, setSchedOpen] = useState(false);
  const [intForm, setIntForm] = useState(BLANK_INT);
  const [scheduling, setScheduling] = useState(false);

  const isAdmin = role === 1;
  const isTL = role === 4;
  const isRecruiter = role === 5;

  // ── Load jobs + recruiters for dropdowns ───────────────────────
  useEffect(() => {
    listJobs({ limit: 200 }).then(res => setJobs(res?.data ?? [])).catch(() => {});
    if (!isRecruiter) listRecruiters().then(rows => setRecruiters(rows ?? [])).catch(() => {});
  }, [isRecruiter]);

  // ── Load candidates ─────────────────────────────────────────────
  const loadCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 200 };
      if (filterStatus) params.status   = filterStatus;
      if (filterJob)    params.jobReqId = filterJob;
      if (search)       params.search   = search;
      const { data } = await listCandidates(params);
      setCandidates(data ?? []);
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to load candidates"));
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterJob, search]);

  useEffect(() => { loadCandidates(); }, [loadCandidates]);

  // ── Add candidate ───────────────────────────────────────────────
  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await createCandidate({
        jobReqId:           Number(form.jobReqId),
        name:               form.name,
        email:              form.email,
        mobile:             form.mobile || null,
        gender:             form.gender || null,
        totalExperience:    Number(form.totalExperience) || 0,
        relevantExperience: Number(form.relevantExperience) || 0,
        currentCtc:         Number(form.currentCtc) || 0,
        expectedCtc:        Number(form.expectedCtc) || 0,
        noticePeriodServing: form.noticePeriodServing,
        lastWorkingDay:     form.lastWorkingDay || null,
        skillSet:           form.skillSet || null,
        source:             form.source || null,
        pinCode:            form.pinCode || null,
        city:               form.city || null,
        state:              form.state || null,
        district:           form.district || null,
        recruiterId:        form.recruiterId ? Number(form.recruiterId) : undefined,
      });
      successToast("Candidate added successfully");
      setAddOpen(false);
      setForm(BLANK);
      loadCandidates();
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to add candidate"));
    } finally {
      setSaving(false);
    }
  }

  // ── Update status ───────────────────────────────────────────────
  async function updateStatus(candidateId, status) {
    try {
      await apiUpdateStatus(candidateId, status);
      setCandidates(cs => cs.map(c => c.candidate_id === candidateId ? { ...c, status } : c));
      setDetail(d => d?.candidate_id === candidateId ? { ...d, status } : d);
      successToast("Status updated");
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to update status"));
    }
  }

  // ── Open schedule modal — pre-select next round ─────────────────
  async function openSchedule(candidate) {
    // Default to Round 1; adjust after fetching history
    setIntForm({
      ...BLANK_INT,
      candidateId: candidate.candidate_id,
      jobReqId:    candidate.job_req_id,
      level:       "Round 1",
    });
    setSchedOpen(true);

    // Fetch completed interviews to determine next round
    try {
      const { data: ivs } = await listInterviews({ candidateId: candidate.candidate_id, limit: 20 });
      const LEVEL_ORDER = ["Round 1","Round 2","Round 3","HR","Final"];
      const completedLevels = (ivs || [])
        .filter(iv => iv.status === "Completed" && iv.feedback_status === "Selected")
        .map(iv => iv.level);
      // Find the next level after the highest completed selected round
      const maxCompletedIdx = completedLevels.reduce((max, lvl) => {
        const idx = LEVEL_ORDER.indexOf(lvl);
        return idx > max ? idx : max;
      }, -1);
      const nextLevel = maxCompletedIdx >= 0 && maxCompletedIdx + 1 < LEVEL_ORDER.length
        ? LEVEL_ORDER[maxCompletedIdx + 1]
        : "Round 1";
      setIntForm(f => ({ ...f, level: nextLevel }));
    } catch { /* keep Round 1 default */ }
  }

  // ── Schedule interview ──────────────────────────────────────────
  async function handleScheduleInterview(e) {
    e.preventDefault();
    if (!intForm.interviewDate || !intForm.interviewTime || !intForm.interviewer) return;
    setScheduling(true);
    try {
      await scheduleInterview({
        candidateId:   intForm.candidateId,
        jobReqId:      intForm.jobReqId,
        level:         intForm.level,
        interviewType: intForm.interviewType,
        interviewDate:    intForm.interviewDate,
        interviewTime:    intForm.interviewTime,
        durationMinutes:  intForm.durationMinutes ? Number(intForm.durationMinutes) : null,
        interviewer:      intForm.interviewer,
        teamsSubject:  intForm.teamsSubject || null,
        teamsParticipants: intForm.teamsParticipants || null,
        teamsStart:    intForm.teamsStart || null,
        teamsEnd:      intForm.teamsEnd || null,
      });
      successToast("Interview scheduled successfully");
      setSchedOpen(false);
      setIntForm(BLANK_INT);
      loadCandidates();
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to schedule interview"));
    } finally {
      setScheduling(false);
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }
  function handleIntChange(e) {
    const { name, value } = e.target;
    setIntForm(f => ({ ...f, [name]: value }));
  }

  // ── Local filter on top of server results ───────────────────────
  const filtered = candidates.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q || (c.name||"").toLowerCase().includes(q)
      || (c.email||"").toLowerCase().includes(q)
      || (c.candidate_code||"").toLowerCase().includes(q);
    const matchS = !filterStatus || c.status === filterStatus;
    const matchJ = !filterJob    || String(c.job_req_id) === String(filterJob);
    return matchQ && matchS && matchJ;
  });

  const columns = [
    { header: "ID",          key: "candidate_code", width: 90 },
    { header: "Name",        key: "name", render: (v, row) => (
      <div>
        <div style={{ fontWeight: 600, color: "#111827" }}>{v}</div>
        <div style={{ fontSize: 11, color: "#6b7280" }}>{row.email}</div>
      </div>
    )},
    { header: "Applied For", key: "job_title", render: (v, row) => (
      <div>
        <div style={{ fontWeight: 500 }}>{v}</div>
        <div style={{ fontSize: 11, color: "#6b7280" }}>{row.job_client}</div>
      </div>
    )},
    { header: "Experience",   key: "total_experience",    render: v => `${v || 0} Yrs` },
    { header: "Current CTC",  key: "current_ctc",  render: v => v ? `${(v/100000).toFixed(1)} LPA` : "—" },
    { header: "Expected CTC", key: "expected_ctc", render: v => v ? `${(v/100000).toFixed(1)} LPA` : "—" },
    { header: "Notice",       key: "notice_period_serving", render: v => v ? "Serving" : "Immediate" },
    { header: "Status",       key: "status",       render: v => <StatusBadge status={v} /> },
    { header: "Source",       key: "source" },
    { header: "",             key: "candidate_id", width: 60, render: (_, row) => (
      <Btn size="sm" variant="ghost" icon={<Eye size={14} />}
        onClick={e => { e.stopPropagation(); setDetail(row); }}>View</Btn>
    )},
  ];

  const jobOpts = [{ value: "", label: "All Jobs" }, ...jobs.map(j => ({ value: String(j.job_req_id), label: j.title }))];
  const statusOpts = [{ value: "", label: "All Statuses" }, ...STATUS_OPTS.map(s => ({ value: s, label: s }))];
  const intJobOpts = jobs.map(j => ({ value: String(j.job_req_id), label: `${j.job_req_code} — ${j.title}` }));

  return (
    <div>
      <PageHeader
        breadcrumbs={["Dashboard", "Candidates"]}
        title={isRecruiter ? "My Candidates" : "Candidates"}
        subtitle="Track all candidate profiles and pipeline status"
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="secondary" icon={<RefreshCw size={14} />} onClick={loadCandidates} />
            <Btn icon={<Plus size={16} />} onClick={() => setAddOpen(true)}>Add Candidate</Btn>
          </div>
        }
      />

      {/* Status summary strip */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Total",         count: candidates.length, color: "#6b7280", bg: "#f3f4f6", val: "" },
          { label: "Shortlisted",   count: candidates.filter(c => c.status === "Shortlisted").length,       color: "#0369a1", bg: "#e0f2fe", val: "Shortlisted" },
          { label: "In Interview",  count: candidates.filter(c => c.status === "Schedule Interview").length, color: "#7c3aed", bg: "#ede9fe", val: "Schedule Interview" },
          { label: "Offer Accepted",count: candidates.filter(c => c.status === "Offer Accepted").length,    color: "#059669", bg: "#d1fae5", val: "Offer Accepted" },
          { label: "Onboarded",     count: candidates.filter(c => c.status === "Onboarded").length,         color: "#166534", bg: "#dcfce7", val: "Onboarded" },
        ].map(s => (
          <div key={s.label} onClick={() => setFilterStatus(s.val)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 20, background: s.bg, cursor: "pointer" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.count}</span>
            <span style={{ fontSize: 12, color: s.color, fontWeight: 500 }}>{s.label}</span>
          </div>
        ))}
      </div>

      <Card style={{ padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid #f0f0f0", flexWrap: "wrap" }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, ID..." />
          <Select value={filterJob}    onChange={e => setFilterJob(e.target.value)}    options={jobOpts} />
          <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} options={statusOpts} />
          <div style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280" }}>
            {loading ? "Loading…" : `${filtered.length} candidates`}
          </div>
        </div>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 48, color: "#6b7280" }}>
            <Loader2 size={20} /> Loading candidates…
          </div>
        ) : (
          <Table columns={columns} data={filtered} onRowClick={r => setDetail(r)} />
        )}
      </Card>

      {/* ── Add Candidate SlideOver ── */}
      <SlideOver open={addOpen} onClose={() => { setAddOpen(false); setForm(BLANK); }}
        title="Add Candidate Details" width={580}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Btn>
            <Btn onClick={handleAdd} disabled={saving}>{saving ? "Saving…" : "Submit Candidate Info"}</Btn>
          </>
        }>
        <form onSubmit={handleAdd}>
          <div style={{ marginBottom: 16, padding: "10px 14px", background: "#fff7ed", borderRadius: 8, borderLeft: "3px solid #f18200", fontSize: 13, color: "#92400e" }}>
            Fields marked with <strong>*</strong> are mandatory.
          </div>

          <Field label="Job / Position" required>
            <Select name="jobReqId" value={form.jobReqId} onChange={handleChange}
              options={jobs.map(j => ({ value: String(j.job_req_id), label: `${j.job_req_code} — ${j.title} (${j.client})` }))}
              placeholder="Select job requirement" />
          </Field>

          {!isRecruiter && (
            <Field label="Assign Recruiter" required>
              <Select name="recruiterId" value={form.recruiterId} onChange={handleChange}
                options={recruiters.map(r => ({ value: String(r.employee_id), label: r.name }))}
                placeholder="Select recruiter" />
            </Field>
          )}

          <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10, marginTop: 4 }}>Personal Details</div>
          <TwoColGrid>
            <Field label="Full Name" required><Input name="name" value={form.name} onChange={handleChange} placeholder="Candidate full name" /></Field>
            <Field label="Email" required><Input name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@example.com" /></Field>
            <Field label="Mobile"><Input name="mobile" value={form.mobile} onChange={handleChange} placeholder="10-digit mobile" /></Field>
            <Field label="Gender"><Select name="gender" value={form.gender} onChange={handleChange} options={GENDERS} placeholder="Select gender" /></Field>
          </TwoColGrid>

          <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Experience & CTC</div>
          <TwoColGrid>
            <Field label="Total Experience (Yrs)" required><Input name="totalExperience" type="number" value={form.totalExperience} onChange={handleChange} placeholder="e.g. 5" /></Field>
            <Field label="Relevant Experience (Yrs)" required><Input name="relevantExperience" type="number" value={form.relevantExperience} onChange={handleChange} placeholder="e.g. 4" /></Field>
            <Field label="Current CTC (₹)" required><Input name="currentCtc" type="number" value={form.currentCtc} onChange={handleChange} placeholder="Annual CTC in rupees" /></Field>
            <Field label="Expected CTC (₹)" required><Input name="expectedCtc" type="number" value={form.expectedCtc} onChange={handleChange} placeholder="Annual CTC in rupees" /></Field>
          </TwoColGrid>

          <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Notice Period</div>
          <TwoColGrid>
            <Field label="Serving Notice Period?">
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 4 }}>
                <input type="checkbox" name="noticePeriodServing" checked={!!form.noticePeriodServing} onChange={handleChange} style={{ accentColor: "#f18200", width: 16, height: 16 }} />
                <span style={{ fontSize: 13, color: "#374151" }}>Yes, currently serving</span>
              </label>
            </Field>
            {form.noticePeriodServing && (
              <Field label="Last Working Day">
                <Input name="lastWorkingDay" type="date" value={form.lastWorkingDay} onChange={handleChange} />
              </Field>
            )}
          </TwoColGrid>

          <Field label="Skill Set (comma-separated)" required>
            <Input name="skillSet" value={form.skillSet} onChange={handleChange} placeholder="e.g. Java, Spring Boot, MySQL" />
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
        </form>
      </SlideOver>

      {/* ── Candidate Detail Modal ── */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Candidate Profile" width={680}
        footer={
          <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
            {/* HR Manager / Admin flags candidate status */}
            {!isRecruiter && (
              <div style={{ flex: 1 }}>
                <Select value={detail?.status || ""}
                  onChange={e => updateStatus(detail.candidate_id, e.target.value)}
                  options={STATUS_OPTS.map(s => ({ value: s, label: s }))} />
              </div>
            )}
            {/* Recruiter schedules the interview once HR Manager sets status */}
            {(isRecruiter || isAdmin) && detail?.status === "Schedule Interview" && (
              <Btn icon={<Calendar size={15} />} onClick={() => openSchedule(detail)}
                style={{ background: "#7c3aed", color: "#fff", border: "none" }}>
                Schedule Interview
              </Btn>
            )}
            <Btn variant="secondary" onClick={() => setDetail(null)}>Close</Btn>
          </div>
        }>
        {detail && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", background: "#f9fafb", borderRadius: 10, marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#1a2535", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
                {(detail.name || "?").charAt(0)}
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
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f18200" }}>{detail.candidate_code}</div>
              </div>
            </div>

            {(detail.job_title) && (
              <div style={{ padding: "10px 14px", background: "#fff7ed", borderRadius: 8, marginBottom: 16, borderLeft: "3px solid #f18200" }}>
                <div style={{ fontSize: 11, color: "#92400e", fontWeight: 600 }}>APPLIED FOR</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{detail.job_title} <span style={{ color: "#6b7280", fontWeight: 400 }}>@ {detail.job_client}</span></div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
              <DetailRow label="Total Experience"    value={`${detail.total_experience || 0} Years`} />
              <DetailRow label="Relevant Experience" value={`${detail.relevant_experience || 0} Years`} />
              <DetailRow label="Current CTC"         value={detail.current_ctc ? `${(detail.current_ctc/100000).toFixed(1)} LPA` : "—"} />
              <DetailRow label="Expected CTC"        value={detail.expected_ctc ? `${(detail.expected_ctc/100000).toFixed(1)} LPA` : "—"} />
              <DetailRow label="Notice Period"       value={detail.notice_period_serving ? `Serving (LWD: ${detail.last_working_day || "?"})` : "Immediate Joiner"} />
              <DetailRow label="Gender"              value={detail.gender} />
              <DetailRow label="City"                value={detail.city} />
              <DetailRow label="State"               value={detail.state} />
              <DetailRow label="Added"               value={detail.created_at?.slice(0, 10)} />
            </div>

            {detail.skill_set && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 8 }}>SKILL SET</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {detail.skill_set.split(",").map(s => s.trim()).filter(Boolean).map(s => (
                    <span key={s} style={{ background: "#f3f4f6", padding: "3px 10px", borderRadius: 20, fontSize: 12, color: "#374151", fontWeight: 500 }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Interview History ── */}
            <InterviewHistory candidateId={detail?.candidate_id} />
          </div>
        )}
      </Modal>

      {/* ── Schedule Interview Modal ── */}
      <Modal open={schedOpen} onClose={() => { setSchedOpen(false); setIntForm(BLANK_INT); }}
        title="Schedule Interview" width={540}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setSchedOpen(false)}>Cancel</Btn>
            <Btn onClick={handleScheduleInterview} disabled={scheduling}
              style={{ background: "#7c3aed", color: "#fff", border: "none" }}>
              {scheduling ? "Scheduling…" : "Confirm & Schedule"}
            </Btn>
          </>
        }>
        {detail && (
          <form onSubmit={handleScheduleInterview}>
            <div style={{ padding: "10px 14px", background: "#f5f3ff", borderRadius: 8, marginBottom: 16, borderLeft: "3px solid #7c3aed" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", marginBottom: 2 }}>CANDIDATE</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{detail.name}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{detail.email}</div>
              {detail.job_title && <div style={{ fontSize: 12, color: "#7c3aed", marginTop: 4 }}>Position: {detail.job_title} @ {detail.job_client}</div>}
            </div>

            <TwoColGrid>
              <Field label="Interview Level" required>
                <Select name="level" value={intForm.level} onChange={handleIntChange} options={INTERVIEW_LEVELS} />
              </Field>
              <Field label="Interview Type" required>
                <Select name="interviewType" value={intForm.interviewType} onChange={handleIntChange} options={INTERVIEW_TYPES} />
              </Field>
              <Field label="Date" required>
                <Input name="interviewDate" type="date" value={intForm.interviewDate} onChange={handleIntChange} />
              </Field>
              <Field label="From Time" required>
                <Input name="interviewTime" type="time" value={intForm.interviewTime} onChange={handleIntChange} />
              </Field>
              <Field label="Duration">
                <select name="durationMinutes" value={intForm.durationMinutes} onChange={handleIntChange}
                  style={{ width:"100%", fontSize:13, padding:"8px 10px", border:"1px solid #e5e7eb", borderRadius:8, color:"#374151" }}>
                  {[30,45,60,90,120].map(m => (
                    <option key={m} value={m}>{m < 60 ? `${m} min` : `${m/60} hr${m > 60 ? "s" : ""}`}</option>
                  ))}
                </select>
              </Field>
              <Field label="To Time (estimated)">
                <input type="time" readOnly
                  value={(() => {
                    if (!intForm.interviewTime || !intForm.durationMinutes) return "";
                    const [h, min] = intForm.interviewTime.split(":").map(Number);
                    const total = h * 60 + min + Number(intForm.durationMinutes);
                    return `${String(Math.floor(total/60) % 24).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`;
                  })()}
                  style={{ width:"100%", fontSize:13, padding:"8px 10px", border:"1px solid #e5e7eb", borderRadius:8, color:"#6b7280", background:"#f9fafb" }}
                />
              </Field>
            </TwoColGrid>

            <Field label="Interviewer Name" required>
              <Input name="interviewer" value={intForm.interviewer} onChange={handleIntChange} placeholder="Full name of interviewer" />
            </Field>

            {intForm.interviewType === "Teams" && (
              <div style={{ padding: "12px 14px", background: "#eff6ff", borderRadius: 8, marginTop: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", marginBottom: 10 }}>Teams Meeting Details</div>
                <Field label="Meeting Subject">
                  <Input name="teamsSubject" value={intForm.teamsSubject} onChange={handleIntChange} placeholder="e.g. L1 Interview — Candidate" />
                </Field>
                <TwoColGrid>
                  <Field label="Start Time"><Input name="teamsStart" type="datetime-local" value={intForm.teamsStart} onChange={handleIntChange} /></Field>
                  <Field label="End Time"><Input name="teamsEnd" type="datetime-local" value={intForm.teamsEnd} onChange={handleIntChange} /></Field>
                </TwoColGrid>
                <Field label="Participants (comma-separated)">
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
