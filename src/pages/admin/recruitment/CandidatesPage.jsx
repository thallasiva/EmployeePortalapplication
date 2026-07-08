import React, { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Eye, Calendar, Loader2, RefreshCw, Upload, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";
import {
  PageHeader, Card, Btn, Field, Input, Select, Textarea,
  Table, Modal, SlideOver, SearchBar, StatusBadge,
  TwoColGrid, DetailRow,
} from "./shared";
import { GENDERS, INTERVIEW_LEVELS, INTERVIEW_TYPES } from "./mockData";
import {
  listCandidates, createCandidate, updateCandidateStatus as apiUpdateStatus,
  scheduleInterview, listJobs, listRecruiters, listInterviews,
  submitFeedback, getResumeMatch, computeResumeMatch, parseResume, quickResumeMatch, uploadResumeMatch,
  getErrorMessage,
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

// ── Resume Upload 3-Step Wizard ────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Upload Resume" },
  { id: 2, label: "Review & Edit" },
  { id: 3, label: "Submit" },
];

function StepBar({ step }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, gap: 0 }}>
      {STEPS.map((s, i) => {
        const done   = step > s.id;
        const active = step === s.id;
        const dotColor  = done || active ? "#f18200" : "#d1d5db";
        const textColor = active || done ? "#111827" : "#9ca3af";
        return (
          <React.Fragment key={s.id}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: dotColor, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                {done ? "✓" : s.id}
              </div>
              <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: textColor, whiteSpace: "nowrap" }}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ height: 2, width: 60, background: step > s.id ? "#f18200" : "#e5e7eb", margin: "0 4px", marginTop: -14, flexShrink: 0 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

const REQUIRED_FIELDS = ["jobReqId", "name", "email", "totalExperience", "relevantExperience", "currentCtc", "expectedCtc"];
function missingFields(form) {
  return REQUIRED_FIELDS.filter(f => !form[f] && form[f] !== 0);
}

// Utility: safely parse a skills array from various server shapes
function safeArr(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch {}
  return String(v).split(",").map(s => s.trim()).filter(Boolean);
}

// ── Add Candidate Wizard ───────────────────────────────────────────────
function AddCandidateWizard({ open, onClose, jobs, recruiters, isRecruiter, onSuccess }) {
  const [step, setStep]             = useState(1);
  const [file, setFile]             = useState(null);
  const [parsing, setParsing]       = useState(false);
  const [parseErr, setParseErr]     = useState("");
  const [parsed, setParsed]         = useState(null);
  const [matchScore, setMatchScore] = useState(null);
  const [autoFilled, setAutoFilled] = useState([]);
  const [form, setForm]             = useState(BLANK);
  const [saving, setSaving]         = useState(false);
  // Pre-scoring: auto-computed as soon as file + job are both set
  const [preScoring, setPreScoring] = useState(false);
  const [preScore, setPreScore]     = useState(null);   // score + parsed from uploadResumeMatch
  const [scoreErr, setScoreErr]     = useState("");
  const fileRef = useRef(null);

  function reset() {
    setStep(1); setFile(null); setParsing(false); setParseErr("");
    setParsed(null); setMatchScore(null); setAutoFilled([]); setForm(BLANK); setSaving(false);
    setPreScoring(false); setPreScore(null); setScoreErr("");
  }
  function handleClose() { reset(); onClose(); }

  // Auto-compute score + parse as soon as both file & job are selected
  async function triggerScoring(fileToUse, jobId) {
    if (!fileToUse || !jobId) {
      setPreScore(null);
      setScoreErr("");
      return;
    }
    setPreScoring(true);
    setPreScore(null);
    setScoreErr("");
    try {
      const result = await uploadResumeMatch(Number(jobId), fileToUse);
      setPreScore(result);                // { matchScore, skillScore, expScore, recommendation, matched, missing, parsed }
    } catch (err) {
      setScoreErr(getErrorMessage(err, "Could not compute match score"));
    } finally {
      setPreScoring(false);
    }
  }

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setParseErr("");
    setPreScore(null);
    setScoreErr("");
    // Auto-trigger scoring if job is already selected
    triggerScoring(f, form.jobReqId);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    const newVal = type === "checkbox" ? checked : value;
    setForm(f => ({ ...f, [name]: newVal }));
    // Auto-trigger scoring when job changes and file is already uploaded
    if (name === "jobReqId") {
      setPreScore(null);
      setScoreErr("");
      triggerScoring(file, newVal);
    }
  }

  async function handleParse() {
    if (!file) return;
    setParsing(true);
    setParseErr("");
    setAutoFilled([]);
    try {
      // Use pre-parsed data from uploadResumeMatch if available; otherwise call parseResume
      const data = (preScore && preScore.parsed) ? preScore.parsed : await parseResume(file);
      setParsed(data);
      const filled = [];
      const updates = {};
      if (data.name)  { updates.name  = data.name;  filled.push("name"); }
      if (data.email) { updates.email = data.email;  filled.push("email"); }
      if (data.phone) { updates.mobile = data.phone; filled.push("mobile"); }
      if (data.experience != null && data.experience !== "") {
        updates.totalExperience    = String(data.experience);
        updates.relevantExperience = String(data.experience);
        filled.push("totalExperience", "relevantExperience");
      }
      const skills = (data.skills || []).join(", ");
      if (skills) { updates.skillSet = skills; filled.push("skillSet"); }
      setForm(prev => ({ ...prev, ...updates }));
      setAutoFilled(filled);
      // Carry pre-computed score into Step 2, or compute fresh if not available
      if (preScore) {
        setMatchScore(preScore);
      } else if (form.jobReqId) {
        try {
          const score = await quickResumeMatch(Number(form.jobReqId), skills || "", Number(data.experience) || 0);
          setMatchScore(score);
        } catch { /* optional */ }
      }
      setStep(2);
    } catch (err) {
      setParseErr(getErrorMessage(err, "Could not parse resume. Please fill in details manually."));
      setStep(2);
    } finally {
      setParsing(false);
    }
  }

  async function handleSubmit() {
    const missing = missingFields(form);
    if (missing.length) {
      errorToast("Please fill in all required fields: " + missing.join(", "));
      return;
    }
    setSaving(true);
    try {
      await createCandidate({
        jobReqId:            Number(form.jobReqId),
        name:                form.name,
        email:               form.email,
        mobile:              form.mobile || null,
        gender:              form.gender || null,
        totalExperience:     Number(form.totalExperience)    || 0,
        relevantExperience:  Number(form.relevantExperience) || 0,
        currentCtc:          Number(form.currentCtc)         || 0,
        expectedCtc:         Number(form.expectedCtc)        || 0,
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
      reset();
      onSuccess();
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to add candidate"));
    } finally {
      setSaving(false);
    }
  }

  const missing   = missingFields(form);
  const canSubmit = missing.length === 0;

  // Helper: show "extracted from resume" hint below auto-filled inputs
  function AutoHint({ field }) {
    if (!autoFilled.includes(field)) return null;
    return <div style={{ fontSize: 10, color: "#f18200", marginTop: 2, fontWeight: 600 }}>✓ extracted from resume</div>;
  }

  // Helper: highlight border on auto-filled input wrapper
  function afWrap(field, children) {
    return autoFilled.includes(field)
      ? <div style={{ borderRadius: 8, outline: "2px solid #f18200", outlineOffset: 1 }}>{children}</div>
      : <>{children}</>;
  }

  return (
    <SlideOver open={open} onClose={handleClose} title="Add Candidate" width={600}
      footer={
        step === 1 ? (
          <>
            <Btn variant="secondary" onClick={handleClose}>Cancel</Btn>
            <Btn variant="secondary" onClick={() => setStep(2)}>Enter Manually</Btn>
            <Btn onClick={handleParse} disabled={!file || parsing || preScoring}>
              {preScoring
                ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Analysing…</>
                : parsing
                ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Parsing…</>
                : <>Parse Resume <ChevronRight size={14} /></>}
            </Btn>
          </>
        ) : (
          <>
            <Btn variant="secondary" onClick={() => setStep(1)}>← Back</Btn>
            <Btn variant="secondary" onClick={handleClose}>Cancel</Btn>
            <Btn onClick={handleSubmit} disabled={saving || !canSubmit}>
              {saving ? "Submitting…" : "Submit Candidate"}
            </Btn>
          </>
        )
      }>
      <StepBar step={step} />

      {/* Step 1 — Select Job + Upload */}
      {step === 1 && (
        <div>
          <div style={{ marginBottom: 16, padding: "10px 14px", background: "#fff7ed", borderRadius: 8, borderLeft: "3px solid #f18200", fontSize: 13, color: "#92400e" }}>
            Select the job position, then upload a resume to auto-extract candidate details. Or click <strong>Enter Manually</strong> to skip.
          </div>

          {/* Job / Position selector */}
          <Field label="Job / Position" required>
            <select
              name="jobReqId"
              value={form.jobReqId}
              onChange={handleChange}
              style={{ width: "100%", fontSize: 13, padding: "9px 10px", border: "1px solid #e5e7eb", borderRadius: 8, color: form.jobReqId ? "#111827" : "#9ca3af", background: "#fff", outline: "none" }}>
              <option value="">Select job requirement</option>
              {jobs.map(j => (
                <option key={j.job_req_id} value={String(j.job_req_id)}>
                  {j.job_req_code} — {j.title} ({j.client})
                </option>
              ))}
            </select>
          </Field>

          <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Upload Resume</div>

          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: "2px dashed " + (file ? "#f18200" : "#d1d5db"),
              borderRadius: 10, padding: "28px 24px", textAlign: "center",
              cursor: "pointer", background: file ? "#fff7ed" : "#f9fafb", transition: "all 0.15s",
            }}>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} style={{ display: "none" }} />
            {file ? (
              <>
                <CheckCircle size={28} color="#f18200" style={{ margin: "0 auto 8px" }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 2 }}>{file.name}</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>{(file.size / 1024).toFixed(1)} KB — click to change</div>
              </>
            ) : (
              <>
                <Upload size={28} color="#9ca3af" style={{ margin: "0 auto 10px" }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Click to upload resume</div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>Supported: PDF, DOC, DOCX — Max 5 MB</div>
              </>
            )}
          </div>

          {/* Score panel — auto-computed once file + job are both selected */}
          {file && form.jobReqId && (
            <div style={{ marginTop: 14 }}>
              {preScoring && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
                  <Loader2 size={18} color="#f18200" style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Analysing resume…</div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>Computing match score against the selected job</div>
                  </div>
                </div>
              )}

              {!preScoring && scoreErr && (
                <div style={{ padding: "10px 14px", background: "#fee2e2", borderRadius: 8, borderLeft: "3px solid #ef4444", fontSize: 13, color: "#991b1b", display: "flex", gap: 8 }}>
                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>{scoreErr} — you can still proceed to parse manually.</div>
                </div>
              )}

              {!preScoring && preScore && (() => {
                const ovr     = Number(preScore.matchScore)  || 0;
                const skl     = Number(preScore.skillScore)  || 0;
                const exp     = Number(preScore.expScore)    || 0;
                const rec     = preScore.recommendation || "Not Suitable";
                const rs      = REC_STYLE[rec] || { bg: "#f3f4f6", color: "#374151" };
                const clr     = ovr >= 80 ? "#16a34a" : ovr >= 65 ? "#0369a1" : ovr >= 45 ? "#d97706" : "#dc2626";
                const matched = safeArr(preScore.matched);
                const miss2   = safeArr(preScore.missing);
                return (
                  <div style={{ border: "1.5px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>

                    {/* ── Header ── */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "#fafafa", borderBottom: "1px solid #e5e7eb" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Resume Match Score</span>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: rs.bg, color: rs.color }}>{rec}</span>
                    </div>

                    {/* ── 3 Score Cards ── */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: "#e5e7eb" }}>
                      {[
                        { label: "Overall Match", value: ovr, icon: "🎯" },
                        { label: "Skill Match",   value: skl, icon: "🛠" },
                        { label: "Experience",    value: exp, icon: "📅" },
                      ].map(({ label, value, icon }) => (
                        <div key={label} style={{ background: "#fff", padding: "16px 12px", textAlign: "center" }}>
                          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>{icon} {label}</div>
                          <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1, color: value >= 80 ? "#16a34a" : value >= 65 ? "#0369a1" : value >= 45 ? "#d97706" : "#dc2626" }}>
                            {value}<span style={{ fontSize: 16, fontWeight: 700 }}>%</span>
                          </div>
                          {/* mini bar */}
                          <div style={{ marginTop: 8, height: 4, background: "#f3f4f6", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ width: value + "%", height: "100%", borderRadius: 2, background: value >= 80 ? "#16a34a" : value >= 65 ? "#0369a1" : value >= 45 ? "#d97706" : "#dc2626", transition: "width 0.6s ease" }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ── Skills breakdown ── */}
                    <div style={{ padding: "14px 16px" }}>
                      {matched.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                            ✓ Matched Skills ({matched.length})
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                            {matched.map(s => (
                              <span key={s} style={{ fontSize: 12, fontWeight: 500, padding: "3px 10px", borderRadius: 20, background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {miss2.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                            ✕ Missing Skills ({miss2.length})
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                            {miss2.map(s => (
                              <span key={s} style={{ fontSize: 12, fontWeight: 500, padding: "3px 10px", borderRadius: 20, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {matched.length === 0 && miss2.length === 0 && (
                        <div style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>No skill breakdown available — score is based on experience only.</div>
                      )}
                      <div style={{ marginTop: 8, paddingTop: 10, borderTop: "1px dashed #e5e7eb", fontSize: 12, color: "#6b7280" }}>
                        Click <strong style={{ color: "#f18200" }}>Parse Resume</strong> to auto-fill candidate details →
                      </div>
                    </div>

                  </div>
                );
              })()}
            </div>
          )}

          {/* Hint when file is uploaded but no job selected */}
          {file && !form.jobReqId && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "#f9fafb", borderRadius: 8, border: "1px dashed #d1d5db", fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
              Select a job above to see the resume match score
            </div>
          )}

          {parseErr && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "#fee2e2", borderRadius: 8, borderLeft: "3px solid #ef4444", fontSize: 13, color: "#991b1b", display: "flex", gap: 8 }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {parseErr}
            </div>
          )}
        </div>
      )}

      {/* Step 2 — Review & Edit */}
      {step === 2 && (
        <div>
          {/* Parse error banner (parse failed but we still landed in Step 2) */}
          {parseErr && (
            <div style={{ marginBottom: 14, padding: "10px 14px", background: "#fee2e2", borderRadius: 8, borderLeft: "3px solid #ef4444", fontSize: 13, color: "#991b1b", display: "flex", gap: 8 }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <div><strong>Parse error:</strong> {parseErr} — please fill in the fields manually.</div>
            </div>
          )}

          {/* Parse success/info banner */}
          {!parseErr && parsed ? (
            <div style={{ marginBottom: 14, padding: "10px 14px", background: "#f0fdf4", borderRadius: 8, borderLeft: "3px solid #16a34a", fontSize: 13, color: "#166534" }}>
              Resume parsed ({parsed.parsedBy === "openai" ? "AI-powered" : "keyword match"}) — fields highlighted in orange were auto-extracted. Review and fill any missing fields.
            </div>
          ) : !parseErr ? (
            <div style={{ marginBottom: 14, padding: "10px 14px", background: "#fff7ed", borderRadius: 8, borderLeft: "3px solid #f18200", fontSize: 13, color: "#92400e" }}>
              Fields marked <strong>*</strong> are mandatory.
            </div>
          ) : null}

          {/* Missing fields banner */}
          {missing.length > 0 && (
            <div style={{ marginBottom: 14, padding: "8px 14px", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, fontSize: 12, color: "#92400e", display: "flex", gap: 8, alignItems: "flex-start" }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <div><strong>Missing required fields:</strong> {missing.join(", ")}</div>
            </div>
          )}

          {/* Resume match score panel (carried from Step 1) */}
          {matchScore && (() => {
            const ovr     = Number(matchScore.matchScore)  || 0;
            const skl     = Number(matchScore.skillScore)  || 0;
            const exp2    = Number(matchScore.expScore)    || 0;
            const rec     = matchScore.recommendation || "Not Suitable";
            const rs      = REC_STYLE[rec] || { bg: "#f3f4f6", color: "#374151" };
            const matched = safeArr(matchScore.matched);
            const miss2   = safeArr(matchScore.missing);
            return (
              <div style={{ marginBottom: 16, border: "1.5px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "#fafafa", borderBottom: "1px solid #e5e7eb" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Resume Match Score</span>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: rs.bg, color: rs.color }}>{rec}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: "#e5e7eb" }}>
                  {[
                    { label: "Overall Match", value: ovr,  icon: "🎯" },
                    { label: "Skill Match",   value: skl,  icon: "🛠" },
                    { label: "Experience",    value: exp2, icon: "📅" },
                  ].map(({ label, value, icon }) => (
                    <div key={label} style={{ background: "#fff", padding: "14px 10px", textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 4 }}>{icon} {label}</div>
                      <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, color: value >= 80 ? "#16a34a" : value >= 65 ? "#0369a1" : value >= 45 ? "#d97706" : "#dc2626" }}>
                        {value}<span style={{ fontSize: 14, fontWeight: 700 }}>%</span>
                      </div>
                      <div style={{ marginTop: 6, height: 3, background: "#f3f4f6", borderRadius: 2 }}>
                        <div style={{ width: value + "%", height: "100%", borderRadius: 2, background: value >= 80 ? "#16a34a" : value >= 65 ? "#0369a1" : value >= 45 ? "#d97706" : "#dc2626" }} />
                      </div>
                    </div>
                  ))}
                </div>
                {(matched.length > 0 || miss2.length > 0) && (
                  <div style={{ padding: "12px 16px" }}>
                    {matched.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>✓ Matched ({matched.length})</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {matched.map(s => <span key={s} style={{ fontSize: 12, padding: "2px 9px", borderRadius: 20, background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>{s}</span>)}
                        </div>
                      </div>
                    )}
                    {miss2.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>✕ Missing ({miss2.length})</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {miss2.map(s => <span key={s} style={{ fontSize: 12, padding: "2px 9px", borderRadius: 20, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>{s}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Job / Position */}
          <Field label="Job / Position" required>
            <Select name="jobReqId" value={form.jobReqId} onChange={handleChange}
              options={jobs.map(j => ({ value: String(j.job_req_id), label: j.job_req_code + " — " + j.title + " (" + j.client + ")" }))}
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
            <Field label="Full Name" required>
              {afWrap("name", <Input name="name" value={form.name} onChange={handleChange} placeholder="Candidate full name" />)}
              <AutoHint field="name" />
            </Field>
            <Field label="Email" required>
              {afWrap("email", <Input name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@example.com" />)}
              <AutoHint field="email" />
            </Field>
            <Field label="Mobile">
              {afWrap("mobile", <Input name="mobile" value={form.mobile} onChange={handleChange} placeholder="10-digit mobile" />)}
              <AutoHint field="mobile" />
            </Field>
            <Field label="Gender"><Select name="gender" value={form.gender} onChange={handleChange} options={GENDERS} placeholder="Select gender" /></Field>
          </TwoColGrid>

          <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Experience & CTC</div>
          <TwoColGrid>
            <Field label="Total Experience (Yrs)" required>
              {afWrap("totalExperience", <Input name="totalExperience" type="number" value={form.totalExperience} onChange={handleChange} placeholder="e.g. 5" />)}
              <AutoHint field="totalExperience" />
            </Field>
            <Field label="Relevant Experience (Yrs)" required>
              {afWrap("relevantExperience", <Input name="relevantExperience" type="number" value={form.relevantExperience} onChange={handleChange} placeholder="e.g. 4" />)}
              <AutoHint field="relevantExperience" />
            </Field>
            <Field label="Current CTC (Rs)" required><Input name="currentCtc" type="number" value={form.currentCtc} onChange={handleChange} placeholder="Annual CTC in rupees" /></Field>
            <Field label="Expected CTC (Rs)" required><Input name="expectedCtc" type="number" value={form.expectedCtc} onChange={handleChange} placeholder="Annual CTC in rupees" /></Field>
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
            {afWrap("skillSet", <Input name="skillSet" value={form.skillSet} onChange={handleChange} placeholder="e.g. Java, Spring Boot, MySQL" />)}
            <AutoHint field="skillSet" />
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
        </div>
      )}
    </SlideOver>
  );
}

// ── Match score widget (for candidate detail view) ──────────────────────────────────────────────────
const REC_STYLE = {
  "Highly Suitable":    { bg: "#fff7ed", color: "#f18200" },
  "Suitable":           { bg: "#dbeafe", color: "#1e40af" },
  "Partially Suitable": { bg: "#fef3c7", color: "#92400e" },
  "Not Suitable":       { bg: "#fee2e2", color: "#991b1b" },
};

function MatchScoreWidget({ candidateId, jobReqId }) {
  const [match, setMatch]         = useState(null);
  const [loading, setLoading]     = useState(false);
  const [computing, setComputing] = useState(false);

  useEffect(() => {
    if (!candidateId || !jobReqId) return;
    setLoading(true);
    getResumeMatch(candidateId, jobReqId).then(d => setMatch(d)).catch(() => {}).finally(() => setLoading(false));
  }, [candidateId, jobReqId]);

  async function recompute() {
    setComputing(true);
    try { const d = await computeResumeMatch(candidateId, jobReqId); setMatch(d); } catch {} finally { setComputing(false); }
  }

  if (!jobReqId) return null;
  if (loading)   return <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 12 }}>Loading match score...</div>;

  const rec      = match?.recommendation;
  const rs       = REC_STYLE[rec] || { bg: "#f3f4f6", color: "#374151" };
  const matched  = safeArr(match?.matched_skills);
  const missing2 = safeArr(match?.missing_skills);

  return (
    <div style={{ marginTop: 16, border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#fafafa", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>Resume Match</div>
        <button onClick={recompute} disabled={computing} style={{ fontSize: 11, color: "#7c3aed", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>{computing ? "Computing..." : "Recompute"}</button>
      </div>
      {!match ? (
        <div style={{ padding: "14px 16px", fontSize: 13, color: "#9ca3af" }}>No score yet. <button onClick={recompute} style={{ color: "#7c3aed", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Compute now</button></div>
      ) : (
        <div style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: match.match_score >= 80 ? "#f18200" : match.match_score >= 65 ? "#0369a1" : match.match_score >= 45 ? "#d97706" : "#dc2626" }}>{match.match_score}%</div>
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>Overall</div>
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: rs.bg, color: rs.color }}>{rec}</span>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <div style={{ fontSize: 11, color: "#6b7280" }}>Skills <strong style={{ color: "#111827" }}>{match.skill_score}%</strong></div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>Experience <strong style={{ color: "#111827" }}>{match.exp_score}%</strong></div>
              </div>
            </div>
          </div>
          {matched.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>{matched.map(s => <span key={s} style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 20, background: "#fff7ed", color: "#f18200" }}>ok {s}</span>)}</div>}
          {missing2.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{missing2.map(s => <span key={s} style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 20, background: "#fee2e2", color: "#991b1b" }}>x {s}</span>)}</div>}
        </div>
      )}
    </div>
  );
}

// ── Interview history ──────────────────────────────────────────────────
function InterviewHistory({ candidateId, role, onMoveToNextRound }) {
  const [ivs, setIvs]         = useState([]);
  const [loading, setLoading] = useState(false);
  const [cs, setCs]           = useState({});
  const canComment = role === 4;

  useEffect(() => {
    if (!candidateId) return;
    setLoading(true);
    listInterviews({ candidateId, limit: 20 }).then(r => setIvs(r.data ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, [candidateId]);

  function startEdit(iv)  { setCs(s => ({ ...s, [iv.interview_id]: { text: iv.feedback_comments || "", editing: true, saving: false } })); }
  function cancelEdit(id) { setCs(s => { const n = { ...s }; delete n[id]; return n; }); }
  async function saveComment(iv) {
    const c = cs[iv.interview_id];
    if (!c) return;
    setCs(s => ({ ...s, [iv.interview_id]: { ...c, saving: true } }));
    try {
      await submitFeedback(iv.interview_id, { feedbackStatus: iv.feedback_status || "Hold", feedbackComments: c.text, shortlisted: iv.shortlisted || false });
      setIvs(prev => prev.map(r => r.interview_id === iv.interview_id ? { ...r, feedback_comments: c.text } : r));
      successToast("Comment saved");
      cancelEdit(iv.interview_id);
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to save comment"));
      setCs(s => ({ ...s, [iv.interview_id]: { ...c, saving: false } }));
    }
  }

  if (loading) return <div style={{ marginTop: 16, fontSize: 13, color: "#9ca3af" }}>Loading interview history...</div>;
  if (!ivs.length) return null;

  const TYPE_ICON = { "Video Call": "Video", "Phone": "Phone", "In-Person": "Office", "Teams": "Teams" };
  const dotColor  = (iv) => iv.status === "Scheduled" ? "#f18200" : iv.feedback_status === "Selected" ? "#16a34a" : iv.feedback_status === "Not Selected" ? "#dc2626" : iv.feedback_status === "Hold" ? "#d97706" : "#9ca3af";
  const cardTheme = (iv) => iv.status === "Scheduled" ? { bg: "#fff7ed", color: "#f18200", border: "#fed7aa" } : iv.feedback_status === "Selected" ? { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" } : iv.feedback_status === "Not Selected" ? { bg: "#fee2e2", color: "#dc2626", border: "#fecaca" } : { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" };

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ width: 3, height: 16, background: "#f18200", borderRadius: 2 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em" }}>Interview History</span>
        <span style={{ fontSize: 11, fontWeight: 600, background: "#fff7ed", color: "#f18200", border: "1px solid #fed7aa", borderRadius: 20, padding: "1px 8px" }}>{ivs.length} round{ivs.length !== 1 ? "s" : ""}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {ivs.map((iv, i) => {
          const dc  = dotColor(iv);
          const sc  = cardTheme(iv);
          const num = LEVEL_ORDER.indexOf(iv.level) + 1 || i + 1;
          const isScheduled    = iv.status === "Scheduled";
          const hasComment     = !!(iv.feedback_comments && iv.feedback_comments.trim());
          const isLastSelected = canComment && iv.status === "Completed" && iv.feedback_status === "Selected" && i === ivs.length - 1;
          const cState         = cs[iv.interview_id];
          return (
            <div key={iv.interview_id} style={{ borderRadius: 10, border: "1px solid " + sc.border, background: sc.bg, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: dc, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{num}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{iv.level} {iv.interview_type && <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 400 }}>{TYPE_ICON[iv.interview_type] || ""} {iv.interview_type}</span>}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {iv.interview_date && <span>Date: {iv.interview_date.slice(0, 10)}</span>}
                    {iv.interview_time && <span>Time: {iv.interview_time.slice(0, 5)}</span>}
                    {iv.interviewer    && <span>Interviewer: {iv.interviewer}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#fff", border: "1px solid " + sc.border, color: sc.color }}>{isScheduled ? "Scheduled" : iv.status}</span>
                  {iv.feedback_status && !isScheduled && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#fff", border: "1px solid " + sc.border, color: sc.color }}>{iv.feedback_status}</span>
                  )}
                </div>
              </div>
              {cState?.editing ? (
                <div style={{ margin: "0 14px 12px 14px" }}>
                  <textarea value={cState.text} onChange={e => setCs(s => ({ ...s, [iv.interview_id]: { ...cState, text: e.target.value } }))} rows={3} placeholder="Enter feedback..." autoFocus
                    style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", fontSize: 12, lineHeight: 1.5, border: "1px solid #fed7aa", borderRadius: 6, background: "#fffbf5", color: "#374151", resize: "vertical", outline: "none", fontFamily: "inherit" }} />
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <button onClick={() => saveComment(iv)} disabled={cState.saving} style={{ fontSize: 11, fontWeight: 700, padding: "4px 14px", background: "#f18200", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>{cState.saving ? "Saving..." : "Save"}</button>
                    <button onClick={() => cancelEdit(iv.interview_id)} style={{ fontSize: 11, padding: "4px 12px", background: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              ) : hasComment ? (
                <div style={{ margin: "0 14px 12px 14px", padding: "10px 12px", background: "#fffbf5", border: "1px solid #fed7aa", borderLeft: "3px solid #f18200", borderRadius: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#f18200", textTransform: "uppercase" }}>Interviewer Comments</span>
                    {canComment && <button onClick={() => startEdit(iv)} style={{ fontSize: 10, color: "#f18200", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Edit</button>}
                  </div>
                  <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{iv.feedback_comments}</div>
                </div>
              ) : canComment && !isScheduled ? (
                <div style={{ margin: "0 14px 10px 14px" }}>
                  <button onClick={() => startEdit(iv)} style={{ fontSize: 11, fontWeight: 600, color: "#f18200", background: "#fff7ed", border: "1px dashed #fed7aa", borderRadius: 6, padding: "5px 12px", cursor: "pointer" }}>+ Add Comments</button>
                </div>
              ) : isScheduled ? (
                <div style={{ margin: "0 14px 10px 14px", fontSize: 11, color: "#9ca3af", fontStyle: "italic" }}>Feedback pending after interview</div>
              ) : null}
              {isLastSelected && (
                <div style={{ margin: "0 14px 12px 14px", paddingTop: 10, borderTop: "1px dashed #fed7aa" }}>
                  <button onClick={() => onMoveToNextRound && onMoveToNextRound()}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#fff", background: "#f18200", border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer" }}>
                    Move to Next Round
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────
export default function CandidatesPage({ role }) {
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs]             = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterJob, setFilterJob]   = useState("");
  const [addOpen, setAddOpen]       = useState(false);
  const [detail, setDetail]         = useState(null);
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

  async function updateStatus(candidateId, status) {
    try {
      await apiUpdateStatus(candidateId, status);
      setCandidates(cs2 => cs2.map(c => c.candidate_id === candidateId ? { ...c, status } : c));
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
      const completedLevels = (ivs || []).filter(iv => iv.status === "Completed" && iv.feedback_status === "Selected").map(iv => iv.level);
      const maxIdx = completedLevels.reduce((max, lvl) => { const idx = LEVEL_ORDER.indexOf(lvl); return idx > max ? idx : max; }, -1);
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
        teamsSubject:     intForm.teamsSubject      || null,
        teamsParticipants: intForm.teamsParticipants || null,
        teamsStart:       intForm.teamsStart         || null,
        teamsEnd:         intForm.teamsEnd           || null,
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

  function handleIntChange(e) { const { name, value } = e.target; setIntForm(f => ({ ...f, [name]: value })); }

  const filtered = candidates.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q || (c.name||"").toLowerCase().includes(q) || (c.email||"").toLowerCase().includes(q) || (c.candidate_code||"").toLowerCase().includes(q);
    return matchQ && (!filterStatus || c.status === filterStatus) && (!filterJob || String(c.job_req_id) === String(filterJob));
  });

  const columns = [
    { header: "ID",          key: "candidate_code", width: 90 },
    { header: "Name",        key: "name", render: (v, row) => (<div><div style={{ fontWeight: 600, color: "#111827" }}>{v}</div><div style={{ fontSize: 11, color: "#6b7280" }}>{row.email}</div></div>) },
    { header: "Applied For", key: "job_title", render: (v, row) => (<div><div style={{ fontWeight: 500 }}>{v}</div><div style={{ fontSize: 11, color: "#6b7280" }}>{row.job_client}</div></div>) },
    { header: "Experience",   key: "total_experience",      render: v => (v || 0) + " Yrs" },
    { header: "Current CTC",  key: "current_ctc",   render: v => v ? ((v/100000).toFixed(1) + " LPA") : "N/A" },
    { header: "Expected CTC", key: "expected_ctc",  render: v => v ? ((v/100000).toFixed(1) + " LPA") : "N/A" },
    { header: "Notice",       key: "notice_period_serving", render: v => v ? "Serving" : "Immediate" },
    { header: "Status",       key: "status",        render: v => <StatusBadge status={v} /> },
    { header: "Source",       key: "source" },
    { header: "",             key: "candidate_id",  width: 120, render: (_, row) => (
      <div style={{ display: "flex", gap: 4 }}>
        {row.status === "Schedule Interview" && isRecruiter && (
          <button onClick={e => { e.stopPropagation(); setDetail(row); openSchedule(row); }}
            style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", background: "#f18200", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap" }}>
            Schedule
          </button>
        )}
        <Btn size="sm" variant="ghost" icon={<Eye size={14} />} onClick={e => { e.stopPropagation(); setDetail(row); }}>View</Btn>
      </div>
    )},
  ];

  const jobOpts    = [{ value: "", label: "All Jobs" },     ...jobs.map(j => ({ value: String(j.job_req_id), label: j.title }))];
  const statusOpts = [{ value: "", label: "All Statuses" }, ...STATUS_OPTS.map(s => ({ value: s, label: s }))];
  const allCount   = candidates.length;

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

      {/* Status strip */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Total",          count: allCount,                                                               color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb", val: "" },
          { label: "Shortlisted",    count: candidates.filter(c => c.status === "Shortlisted").length,             color: "#0369a1", bg: "#e0f2fe", border: "#bae6fd", val: "Shortlisted" },
          { label: "In Interview",   count: candidates.filter(c => c.status === "Schedule Interview").length,      color: "#7c3aed", bg: "#ede9fe", border: "#c4b5fd", val: "Schedule Interview" },
          { label: "Offer Accepted", count: candidates.filter(c => c.status === "Offer Accepted").length,          color: "#f18200", bg: "#fff7ed", border: "#fed7aa", val: "Offer Accepted" },
          { label: "Onboarded",      count: candidates.filter(c => c.status === "Onboarded").length,               color: "#166534", bg: "#dcfce7", border: "#86efac", val: "Onboarded" },
        ].map(s => (
          <div key={s.label} onClick={() => { setFilterStatus(s.val); setTimeout(() => tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100); }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 20, background: s.bg, cursor: "pointer", border: "1.5px solid " + (filterStatus === s.val ? s.color : s.border), transition: "all 0.15s" }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.count}</span>
            <span style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div ref={tableRef} style={{ scrollMarginTop: 16 }}>
        <Card style={{ padding: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid #f0f0f0", flexWrap: "wrap" }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, ID..." />
            <Select value={filterJob}    onChange={e => setFilterJob(e.target.value)}    options={jobOpts} />
            <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} options={statusOpts} />
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              {filterStatus && <span onClick={() => setFilterStatus("")} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "#fff7ed", color: "#f18200", border: "1px solid #fed7aa", cursor: "pointer" }}>{filterStatus} x</span>}
              <span style={{ fontSize: 12, color: "#6b7280" }}>{loading ? "Loading..." : (filtered.length + " candidate" + (filtered.length !== 1 ? "s" : ""))}</span>
            </div>
          </div>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 48, color: "#6b7280" }}><Loader2 size={20} /> Loading candidates...</div>
          ) : (
            <Table columns={columns} data={filtered} onRowClick={r => setDetail(r)} />
          )}
        </Card>
      </div>

      {/* Add Candidate Wizard */}
      <AddCandidateWizard
        open={addOpen}
        onClose={() => setAddOpen(false)}
        jobs={jobs}
        recruiters={recruiters}
        isRecruiter={isRecruiter}
        onSuccess={() => { setAddOpen(false); loadCandidates(); }}
      />

      {/* Candidate Detail Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Candidate Profile" width={680}
        footer={
          <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
            {!isRecruiter && (
              <div style={{ flex: 1 }}>
                <Select value={detail?.status || ""} onChange={e => updateStatus(detail.candidate_id, e.target.value)} options={STATUS_OPTS.map(s => ({ value: s, label: s }))} />
              </div>
            )}
            {isRecruiter && detail?.status === "Schedule Interview" && (
              <Btn icon={<Calendar size={15} />} onClick={() => openSchedule(detail)} style={{ background: "#f18200", color: "#fff", border: "none" }}>Schedule Interview</Btn>
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
                <div style={{ fontSize: 13, color: "#6b7280" }}>{detail.email} {detail.mobile ? "· " + detail.mobile : ""}</div>
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
              <DetailRow label="Total Experience"    value={(detail.total_experience || 0) + " Years"} />
              <DetailRow label="Relevant Experience" value={(detail.relevant_experience || 0) + " Years"} />
              <DetailRow label="Current CTC"         value={detail.current_ctc ? (detail.current_ctc/100000).toFixed(1) + " LPA" : "N/A"} />
              <DetailRow label="Expected CTC"        value={detail.expected_ctc ? (detail.expected_ctc/100000).toFixed(1) + " LPA" : "N/A"} />
              <DetailRow label="Notice Period"       value={detail.notice_period_serving ? "Serving (LWD: " + (detail.last_working_day || "?") + ")" : "Immediate Joiner"} />
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
            <MatchScoreWidget candidateId={detail.candidate_id} jobReqId={detail.job_req_id} />
            {detail.status === "Schedule Interview" && isRecruiter && (
              <div style={{ marginTop: 16, padding: "14px 16px", background: "#fff7ed", border: "1px solid #fed7aa", borderLeft: "4px solid #f18200", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>Ready for Next Interview Round</div>
                  <div style={{ fontSize: 11, color: "#b45309", marginTop: 2 }}>HR has approved this candidate - schedule the next interview</div>
                </div>
                <button onClick={() => openSchedule(detail)} style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: "#f18200", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", flexShrink: 0 }}>Schedule Interview</button>
              </div>
            )}
            <InterviewHistory candidateId={detail.candidate_id} role={role} onMoveToNextRound={() => updateStatus(detail.candidate_id, "Schedule Interview")} />
          </div>
        )}
      </Modal>

      {/* Schedule Interview Modal */}
      <Modal open={schedOpen} onClose={() => { setSchedOpen(false); setIntForm(BLANK_INT); }}
        title="Schedule Interview" width={540}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setSchedOpen(false)}>Cancel</Btn>
            <Btn onClick={handleScheduleInterview} disabled={scheduling} style={{ background: "#f18200", color: "#fff", border: "none" }}>
              {scheduling ? "Scheduling..." : "Confirm & Schedule"}
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
              <Field label="Time" required>
                <Input name="interviewTime" type="time" value={intForm.interviewTime} onChange={handleIntChange} />
              </Field>
            </TwoColGrid>
            <Field label="Interviewer Name" required>
              <Input name="interviewer" value={intForm.interviewer} onChange={handleIntChange} placeholder="Full name of interviewer" />
            </Field>
            {intForm.interviewType === "Teams" && (
              <div style={{ padding: "12px 14px", background: "#fff7ed", borderRadius: 8, marginTop: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 10 }}>Microsoft Teams Meeting</div>
                <Field label="Meeting Subject">
                  <Input name="teamsSubject" value={intForm.teamsSubject} onChange={handleIntChange} placeholder="e.g. L1 Interview - Candidate Name" />
                </Field>
                <TwoColGrid>
                  <Field label="Start"><Input name="teamsStart" type="datetime-local" value={intForm.teamsStart} onChange={handleIntChange} /></Field>
                  <Field label="End"><Input name="teamsEnd" type="datetime-local" value={intForm.teamsEnd} onChange={handleIntChange} /></Field>
                </TwoColGrid>
                <Field label="To (separate emails with semicolons)">
                  <Input name="teamsParticipants" value={intForm.teamsParticipants} onChange={handleIntChange} placeholder="user1@company.com; user2@company.com" />
                </Field>
              </div>
            )}
          </form>
        )}
      </Modal>
    </div>
  );
}
