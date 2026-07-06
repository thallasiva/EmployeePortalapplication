import React, { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Eye, Calendar, Loader2, RefreshCw } from "lucide-react";
import {
  PageHeader, Card, Btn, Field, Input, Select, Textarea,
  Table, Modal, SlideOver, SearchBar, StatusBadge,
  TwoColGrid, DetailRow,
} from "./shared";
import { GENDERS, INTERVIEW_LEVELS, INTERVIEW_TYPES } from "./mockData";
import {
  listCandidates, createCandidate, updateCandidateStatus as apiUpdateStatus,
  scheduleInterview, listJobs, listRecruiters, listInterviews,
  submitFeedback, getResumeMatch, computeResumeMatch, getErrorMessage,
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
  "Selected":     { color: "#f18200", bg: "#fff7ed" },
  "Not Selected": { color: "#dc2626", bg: "#fee2e2" },
  "Hold":         { color: "#d97706", bg: "#fef3c7" },
};

// ── Match score widget ────────────────────────────────────────────────
const REC_STYLE = {
  "Highly Suitable":    { bg: "#fff7ed", color: "#f18200" },
  "Suitable":           { bg: "#dbeafe", color: "#1e40af" },
  "Partially Suitable": { bg: "#fef3c7", color: "#92400e" },
  "Not Suitable":       { bg: "#fee2e2", color: "#991b1b" },
};

function MatchScoreWidget({ candidateId, jobReqId }) {
  const [match, setMatch]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [computing, setComputing] = useState(false);

  useEffect(() => {
    if (!candidateId || !jobReqId) return;
    setLoading(true);
    getResumeMatch(candidateId, jobReqId)
      .then(data => setMatch(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [candidateId, jobReqId]);

  async function recompute() {
    setComputing(true);
    try { const data = await computeResumeMatch(candidateId, jobReqId); setMatch(data); }
    catch {} finally { setComputing(false); }
  }

  if (!jobReqId) return null;
  if (loading) return <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 12 }}>Loading match score…</div>;

  const safeParseArr = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    if (typeof v !== "string") return [];
    try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; }
    catch { return v.split(",").map(s => s.trim()).filter(Boolean); }
  };

  const rec     = match?.recommendation;
  const recStyle = REC_STYLE[rec] || { bg: "#f3f4f6", color: "#374151" };
  const matched = safeParseArr(match?.matched_skills);
  const missing = safeParseArr(match?.missing_skills);

  return (
    <div style={{ marginTop: 16, border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#fafafa", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>⚡ Resume Match</div>
        <button onClick={recompute} disabled={computing} style={{ fontSize: 11, color: "#7c3aed", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
          {computing ? "Computing…" : "↻ Recompute"}
        </button>
      </div>
      {!match ? (
        <div style={{ padding: "14px 16px", fontSize: 13, color: "#9ca3af" }}>
          No score yet.{" "}
          <button onClick={recompute} style={{ color: "#7c3aed", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Compute now →</button>
        </div>
      ) : (
        <div style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: match.match_score >= 80 ? "#f18200" : match.match_score >= 65 ? "#0369a1" : match.match_score >= 45 ? "#d97706" : "#dc2626" }}>
                {match.match_score}%
              </div>
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>Overall</div>
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: recStyle.bg, color: recStyle.color }}>{rec}</span>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <div style={{ fontSize: 11, color: "#6b7280" }}>Skills <strong style={{ color: "#111827" }}>{match.skill_score}%</strong></div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>Experience <strong style={{ color: "#111827" }}>{match.exp_score}%</strong></div>
              </div>
            </div>
          </div>
          {matched.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
              {matched.map(s => <span key={s} style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 20, background: "#fff7ed", color: "#f18200" }}>✔ {s}</span>)}
            </div>
          )}
          {missing.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {missing.map(s => <span key={s} style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 20, background: "#fee2e2", color: "#991b1b" }}>✖ {s}</span>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Interview history ─────────────────────────────────────────────────
function InterviewHistory({ candidateId, role, onMoveToNextRound }) {
  const [ivs, setIvs]         = useState([]);
  const [loading, setLoading] = useState(false);
  const [commentState, setCommentState] = useState({});
  const canComment = role === 4;

  useEffect(() => {
    if (!candidateId) return;
    setLoading(true);
    listInterviews({ candidateId, limit: 20 })
      .then(r => setIvs(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [candidateId]);

  function startEdit(iv) {
    setCommentState(s => ({ ...s, [iv.interview_id]: { text: iv.feedback_comments || "", editing: true, saving: false } }));
  }
  function cancelEdit(id) {
    setCommentState(s => { const n = { ...s }; delete n[id]; return n; });
  }
  async function saveComment(iv) {
    const cs = commentState[iv.interview_id];
    if (!cs) return;
    setCommentState(s => ({ ...s, [iv.interview_id]: { ...cs, saving: true } }));
    try {
      await submitFeedback(iv.interview_id, {
        feedbackStatus:   iv.feedback_status || "Hold",
        feedbackComments: cs.text,
        shortlisted:      iv.shortlisted || false,
      });
      setIvs(prev => prev.map(r => r.interview_id === iv.interview_id ? { ...r, feedback_comments: cs.text } : r));
      successToast("Comment saved");
      cancelEdit(iv.interview_id);
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to save comment"));
      setCommentState(s => ({ ...s, [iv.interview_id]: { ...cs, saving: false } }));
    }
  }

  if (loading) return (
    <div style={{ marginTop: 16, fontSize: 13, color: "#9ca3af", display: "flex", alignItems: "center", gap: 6 }}>
      <Loader2 size={14} /> Loading interview history…
    </div>
  );
  if (!ivs.length) return null;

  const dotColor = (iv) => {
    if (iv.status === "Scheduled") return "#f18200";
    if (iv.feedback_status === "Selected") return "#16a34a";
    if (iv.feedback_status === "Not Selected") return "#dc2626";
    if (iv.feedback_status === "Hold") return "#d97706";
    return "#9ca3af";
  };
  const cardTheme = (iv) => {
    if (iv.status === "Scheduled") return { bg: "#fff7ed", color: "#f18200", border: "#fed7aa" };
    if (iv.feedback_status === "Selected") return { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" };
    if (iv.feedback_status === "Not Selected") return { bg: "#fee2e2", color: "#dc2626", border: "#fecaca" };
    if (iv.feedback_status === "Hold") return { bg: "#fef3c7", color: "#d97706", border: "#fde68a" };
    return { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" };
  };
  const TYPE_ICON = { "Video Call": "📹", "Phone": "📞", "In-Person": "🏢", "Teams": "💻" };

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 3, height: 16, background: "#f18200", borderRadius: 2 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em" }}>Interview History</span>
        <span style={{ fontSize: 11, fontWeight: 600, background: "#fff7ed", color: "#f18200", border: "1px solid #fed7aa", borderRadius: 20, padding: "1px 8px" }}>
          {ivs.length} round{ivs.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div style={{ position: "relative", paddingLeft: 28 }}>
        <div style={{ position: "absolute", left: 10, top: 12, bottom: 12, width: 2, background: "linear-gradient(to bottom, #fed7aa, #e5e7eb)", borderRadius: 2 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {ivs.map((iv, i) => {
            const dc  = dotColor(iv);
            const sc  = cardTheme(iv);
            const num = LEVEL_ORDER.indexOf(iv.level) + 1 || i + 1;
            const isScheduled  = iv.status === "Scheduled";
            const hasComment   = !!(iv.feedback_comments && iv.feedback_comments.trim());
            const isLastSelected = canComment && iv.status === "Completed"
              && iv.feedback_status === "Selected" && i === ivs.length - 1;
            const cs = commentState[iv.interview_id];

            return (
              <div key={iv.interview_id} style={{ position: "relative" }}>
                {/* timeline dot */}
                <div style={{ position: "absolute", left: -22, top: 14, width: 16, height: 16, borderRadius: "50%", background: dc, border: "2px solid #fff", boxShadow: `0 0 0 2px ${dc}40`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
                  <span style={{ fontSize: 8, fontWeight: 800, color: "#fff" }}>{num}</span>
                </div>

                <div style={{ borderRadius: 10, border: `1px solid ${sc.border}`, background: sc.bg, overflow: "hidden" }}>
                  {/* header row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{iv.level}</span>
                        {iv.interview_type && <span style={{ fontSize: 11, color: "#6b7280" }}>{TYPE_ICON[iv.interview_type] || ""} {iv.interview_type}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {iv.interview_date && <span>📅 {iv.interview_date.slice(0, 10)}</span>}
                        {iv.interview_time && <span>⏰ {iv.interview_time.slice(0, 5)}</span>}
                        {iv.interviewer    && <span>👤 {iv.interviewer}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      {isScheduled && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#f18200", background: "#fff7ed", border: "1px solid #fed7aa", padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>🕐 Scheduled</span>
                      )}
                      {!isScheduled && iv.status === "Completed" && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#374151", background: "#f3f4f6", border: "1px solid #e5e7eb", padding: "2px 8px", borderRadius: 20 }}>✓ Completed</span>
                      )}
                      {iv.feedback_status && !isScheduled && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: sc.color, background: "#fff", border: `1px solid ${sc.border}`, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>
                          {iv.feedback_status === "Selected" && "✅ "}
                          {iv.feedback_status === "Not Selected" && "❌ "}
                          {iv.feedback_status === "Hold" && "⏸ "}
                          {iv.feedback_status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* comments section */}
                  {cs?.editing ? (
                    <div style={{ margin: "0 14px 12px 14px" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#f18200", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>💬 Edit Comments</div>
                      <textarea
                        value={cs.text}
                        onChange={e => setCommentState(s => ({ ...s, [iv.interview_id]: { ...cs, text: e.target.value } }))}
                        rows={3}
                        placeholder="Enter interviewer feedback…"
                        autoFocus
                        style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", fontSize: 12, lineHeight: 1.5, border: "1px solid #fed7aa", borderLeft: "3px solid #f18200", borderRadius: 6, background: "#fffbf5", color: "#374151", resize: "vertical", outline: "none", fontFamily: "inherit" }}
                      />
                      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                        <button onClick={() => saveComment(iv)} disabled={cs.saving} style={{ fontSize: 11, fontWeight: 700, padding: "4px 14px", background: "#f18200", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", opacity: cs.saving ? 0.7 : 1 }}>
                          {cs.saving ? "Saving…" : "Save"}
                        </button>
                        <button onClick={() => cancelEdit(iv.interview_id)} disabled={cs.saving} style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", background: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer" }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : hasComment ? (
                    <div style={{ margin: "0 14px 12px 14px", padding: "10px 12px", background: "#fffbf5", border: "1px solid #fed7aa", borderLeft: "3px solid #f18200", borderRadius: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#f18200", textTransform: "uppercase", letterSpacing: "0.05em" }}>💬 Interviewer Comments</div>
                        {canComment && (
                          <button onClick={() => startEdit(iv)} style={{ fontSize: 10, color: "#f18200", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: 0 }}>✏️ Edit</button>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{iv.feedback_comments}</div>
                    </div>
                  ) : canComment && !isScheduled ? (
                    <div style={{ margin: "0 14px 10px 14px" }}>
                      <button onClick={() => startEdit(iv)} style={{ fontSize: 11, fontWeight: 600, color: "#f18200", background: "#fff7ed", border: "1px dashed #fed7aa", borderRadius: 6, padding: "5px 12px", cursor: "pointer" }}>
                        + Add Comments
                      </button>
                    </div>
                  ) : isScheduled ? (
                    <div style={{ margin: "0 14px 10px 14px", fontSize: 11, color: "#9ca3af", fontStyle: "italic" }}>Feedback pending after interview</div>
                  ) : null}

                  {/* Move to Next Round — HR Manager, last completed+selected round */}
                  {isLastSelected && (
                    <div style={{ margin: "0 14px 12px 14px", paddingTop: 10, borderTop: "1px dashed #fed7aa" }}>
                      <button onClick={() => onMoveToNextRound && onMoveToNextRound()} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#fff", background: "#f18200", border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer", boxShadow: "0 1px 4px #f1820040" }}>
                        ➡ Move to Next Round
                      </button>
                      <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>Notifies recruiter to schedule the next interview</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────
export default function CandidatesPage({ role }) {
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs]             = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterJob, setFilterJob]   = useState("");
  const [addOpen, setAddOpen]       = useState(false);
  const [detail, setDetail]         = useState(null);
  const [form, setForm]             = useState(BLANK);
  const [schedOpen, setSchedOpen]   = useState(false);
  const [intForm, setIntForm]       = useState(BLANK_INT);
  const [scheduling, setScheduling] = useState(false);
  const tableRef = useRef(null);

  const isAdmin     = role === 1;
  const isTL        = role === 4;
  const isRecruiter = role === 5;

  useEffect(() => {
    listJobs({ limit: 200 }).then(res => setJobs(res?.data ?? [])).catch(() => {});
    if (!isRecruiter) listRecruiters().then(rows => setRecruiters(rows ?? [])).catch(() => {});
  }, [isRecruiter]);

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

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await createCandidate({
        jobReqId:            Number(form.jobReqId),
        name:                form.name,
        email:               form.email,
        mobile:              form.mobile || null,
        gender:              form.gender || null,
        totalExperience:     Number(form.totalExperience)     || 0,
        relevantExperience:  Number(form.relevantExperience)  || 0,
        currentCtc:          Number(form.currentCtc)          || 0,
        expectedCtc:         Number(form.expectedCtc)         || 0,
        noticePeriodServing: form.noticePeriodServing,
        lastWorkingDay:      form.lastWorkingDay  || null,
        skillSet:            form.skillSet        || null,
        source:              form.source          || null,
        pinCode:             form.pinCode         || null,
        city:                form.city            || null,
        state:               form.state           || null,
        district:            form.district        || null,
        recruiterId:         form.recruiterId ? Number(form.recruiterId) : undefined,
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

  async function openSchedule(candidate) {
    setIntForm({ ...BLANK_INT, candidateId: candidate.candidate_id, jobReqId: candidate.job_req_id, level: "Round 1" });
    setSchedOpen(true);
    try {
      const { data: ivs } = await listInterviews({ candidateId: candidate.candidate_id, limit: 20 });
      const completedLevels = (ivs || [])
        .filter(iv => iv.status === "Completed" && iv.feedback_status === "Selected")
        .map(iv => iv.level);
      const maxIdx = completedLevels.reduce((max, lvl) => {
        const idx = LEVEL_ORDER.indexOf(lvl); return idx > max ? idx : max;
      }, -1);
      const nextLevel = maxIdx >= 0 && maxIdx + 1 < LEVEL_ORDER.length ? LEVEL_ORDER[maxIdx + 1] : "Round 1";
      setIntForm(f => ({ ...f, level: nextLevel }));
    } catch { /* keep Round 1 */ }
  }

  async function handleScheduleInterview(e) {
    e.preventDefault();
    if (!intForm.interviewDate || !intForm.interviewTime || !intForm.interviewer) return;
    setScheduling(true);
    try {
      await scheduleInterview({
        candidateId:      intForm.candidateId,
        jobReqId:         intForm.jobReqId,
        level:            intForm.level,
        interviewType:    intForm.interviewType,
        interviewDate:    intForm.interviewDate,
        interviewTime:    intForm.interviewTime,
        durationMinutes:  intForm.durationMinutes ? Number(intForm.durationMinutes) : null,
        interviewer:      intForm.interviewer,
        teamsSubject:     intForm.teamsSubject     || null,
        teamsParticipants: intForm.teamsParticipants || null,
        teamsStart:       intForm.teamsStart        || null,
        teamsEnd:         intForm.teamsEnd          || null,
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

  function selectFilter(val) {
    setFilterStatus(val);
    setTimeout(() => tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  const filtered = candidates.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q || (c.name||"").toLowerCase().includes(q)
      || (c.email||"").toLowerCase().includes(q)
      || (c.candidate_code||"").toLowerCase().includes(q);
    return matchQ
      && (!filterStatus || c.status === filterStatus)
      && (!filterJob    || String(c.job_req_id) === String(filterJob));
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
    { header: "Experience",   key: "total_experience",      render: v => `${v || 0} Yrs` },
    { header: "Current CTC",  key: "current_ctc",   render: v => v ? `${(v/100000).toFixed(1)} LPA` : "—" },
    { header: "Expected CTC", key: "expected_ctc",  render: v => v ? `${(v/100000).toFixed(1)} LPA` : "—" },
    { header: "Notice",       key: "notice_period_serving", render: v => v ? "Serving" : "Immediate" },
    { header: "Status",       key: "status",        render: v => <StatusBadge status={v} /> },
    { header: "Source",       key: "source" },
    { header: "",             key: "candidate_id",  width: 120, render: (_, row) => (
      <div style={{ display: "flex", gap: 4 }}>
        {row.status === "Schedule Interview" && (isRecruiter || isTL) && (
          <button
            onClick={e => { e.stopPropagation(); setDetail(row); openSchedule(row); }}
            style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", background: "#f18200", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap" }}>
            📅 Schedule
          </button>
        )}
        <Btn size="sm" variant="ghost" icon={<Eye size={14} />}
          onClick={e => { e.stopPropagation(); setDetail(row); }}>View</Btn>
      </div>
    )},
  ];

  const jobOpts    = [{ value: "", label: "All Jobs" }, ...jobs.map(j => ({ value: String(j.job_req_id), label: j.title }))];
  const statusOpts = [{ value: "", label: "All Statuses" }, ...STATUS_OPTS.map(s => ({ value: s, label: s }))];

  // count strip uses the FULL unfiltered candidate list for accurate totals
  const allCount = candidates.length;

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

      {/* Status count strip */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Total",         count: allCount,                                                                   color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb", val: "" },
          { label: "Shortlisted",   count: candidates.filter(c => c.status === "Shortlisted").length,                 color: "#0369a1", bg: "#e0f2fe", border: "#bae6fd", val: "Shortlisted" },
          { label: "In Interview",  count: candidates.filter(c => c.status === "Schedule Interview").length,          color: "#7c3aed", bg: "#ede9fe", border: "#c4b5fd", val: "Schedule Interview" },
          { label: "Offer Accepted",count: candidates.filter(c => c.status === "Offer Accepted").length,              color: "#f18200", bg: "#fff7ed", border: "#fed7aa", val: "Offer Accepted" },
          { label: "Onboarded",     count: candidates.filter(c => c.status === "Onboarded").length,                   color: "#166534", bg: "#dcfce7", border: "#86efac", val: "Onboarded" },
        ].map(s => (
          <div key={s.label} onClick={() => selectFilter(s.val)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 20, background: s.bg, cursor: "pointer", border: `1.5px solid ${filterStatus === s.val ? s.color : s.border}`, boxShadow: filterStatus === s.val ? `0 0 0 2px ${s.color}30` : "none", transition: "all 0.15s" }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.count}</span>
            <span style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Candidates table */}
      <div ref={tableRef} style={{ scrollMarginTop: 16 }}>
        <Card style={{ padding: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid #f0f0f0", flexWrap: "wrap" }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, ID..." />
            <Select value={filterJob}    onChange={e => setFilterJob(e.target.value)}    options={jobOpts} />
            <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} options={statusOpts} />
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              {filterStatus && (
                <span onClick={() => setFilterStatus("")}
                  style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "#fff7ed", color: "#f18200", border: "1px solid #fed7aa", cursor: "pointer" }}>
                  {filterStatus} ✕
                </span>
              )}
              <span style={{ fontSize: 12, color: "#6b7280" }}>
                {loading ? "Loading…" : `${filtered.length} candidate${filtered.length !== 1 ? "s" : ""}`}
              </span>
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
      </div>

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
            <Field label="Assign Recruiter">
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
            {!isRecruiter && (
              <div style={{ flex: 1 }}>
                <Select value={detail?.status || ""}
                  onChange={e => updateStatus(detail.candidate_id, e.target.value)}
                  options={STATUS_OPTS.map(s => ({ value: s, label: s }))} />
              </div>
            )}
            {(isRecruiter || isAdmin) && detail?.status === "Schedule Interview" && (
              <Btn icon={<Calendar size={15} />} onClick={() => openSchedule(detail)}
                style={{ background: "#f18200", color: "#fff", border: "none" }}>
                Schedule Interview
              </Btn>
            )}
            <Btn variant="secondary" onClick={() => setDetail(null)}>Close</Btn>
          </div>
        }>
        {detail && (
          <div>
            {/* candidate header */}
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

            {detail.job_title && (
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

            {/* Resume match */}
            <MatchScoreWidget candidateId={detail.candidate_id} jobReqId={detail.job_req_id} />

            {/* Schedule CTA for recruiter/HR when status = Schedule Interview */}
            {detail.status === "Schedule Interview" && (isRecruiter || isTL) && (
              <div style={{ marginTop: 16, padding: "14px 16px", background: "linear-gradient(135deg,#fff7ed,#fef3c7)", border: "1px solid #fed7aa", borderLeft: "4px solid #f18200", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>🔔 Ready for Next Interview Round</div>
                  <div style={{ fontSize: 11, color: "#b45309", marginTop: 2 }}>HR has approved this candidate — schedule the next interview</div>
                </div>
                <button onClick={() => openSchedule(detail)}
                  style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", color: "#fff", background: "#f18200", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", boxShadow: "0 2px 6px #f1820050", flexShrink: 0 }}>
                  📅 Schedule Interview
                </button>
              </div>
            )}

            {/* Interview history */}
            <InterviewHistory
              candidateId={detail.candidate_id}
              role={role}
              onMoveToNextRound={() => updateStatus(detail.candidate_id, "Schedule Interview")}
            />
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
              style={{ background: "#f18200", color: "#fff", border: "none" }}>
              {scheduling ? "Scheduling…" : "Confirm & Schedule"}
            </Btn>
          </>
        }>
        {detail && (
          <form onSubmit={handleScheduleInterview}>
            <div style={{ padding: "10px 14px", background: "#fff7ed", borderRadius: 8, marginBottom: 16, borderLeft: "3px solid #f18200" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e", marginBottom: 2 }}>CANDIDATE</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{detail.name}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{detail.email}</div>
              {detail.job_title && <div style={{ fontSize: 12, color: "#f18200", marginTop: 4 }}>Position: {detail.job_title} @ {detail.job_client}</div>}
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
                  style={{ width: "100%", fontSize: 13, padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, color: "#374151" }}>
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
                    return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
                  })()}
                  style={{ width: "100%", fontSize: 13, padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, color: "#6b7280", background: "#f9fafb" }}
                />
              </Field>
            </TwoColGrid>

            <Field label="Interviewer Name" required>
              <Input name="interviewer" value={intForm.interviewer} onChange={handleIntChange} placeholder="Full name of interviewer" />
            </Field>

            {intForm.interviewType === "Teams" && (
              <div style={{ padding: "12px 14px", background: "#fff7ed", borderRadius: 8, marginTop: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 10 }}>Teams Meeting Details</div>
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
