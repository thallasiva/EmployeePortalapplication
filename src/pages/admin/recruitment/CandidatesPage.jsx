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

const STEPS = [
  { id: 1, label: "Upload Resume" },
  { id: 2, label: "Review & Edit" },
  { id: 3, label: "Submit" },
];

// ── Dynamic score color helpers ──────────────────────────────────────
function scoreTextCls(v) {
  return v >= 80 ? "text-green-600" : v >= 65 ? "text-blue-700" : v >= 45 ? "text-amber-600" : "text-red-600";
}
function scoreBgCls(v) {
  return v >= 80 ? "bg-green-600" : v >= 65 ? "bg-blue-700" : v >= 45 ? "bg-amber-600" : "bg-red-600";
}

// ── Recommendation badge Tailwind classes ────────────────────────────
const REC_CLASS = {
  "Highly Suitable":    "bg-amber-50 text-[#f18200]",
  "Suitable":           "bg-blue-100 text-blue-800",
  "Partially Suitable": "bg-yellow-100 text-amber-800",
  "Not Suitable":       "bg-red-100 text-red-800",
};

// ── Step progress bar ────────────────────────────────────────────────
function StepBar({ step }) {
  return (
    <div className="flex items-center justify-center mb-5">
      {STEPS.map((s, i) => {
        const done   = step > s.id;
        const active = step === s.id;
        return (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${done || active ? "bg-[#f18200]" : "bg-gray-300"}`}>
                {done ? "✓" : s.id}
              </div>
              <span className={`text-[11px] whitespace-nowrap ${active ? "font-bold text-gray-900" : "font-medium text-gray-400"}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-[60px] mx-1 flex-shrink-0 -mt-3.5 ${step > s.id ? "bg-[#f18200]" : "bg-gray-200"}`} />
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

// Utility: safely parse skills array from various server shapes
function safeArr(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch {}
  return String(v).split(",").map(s => s.trim()).filter(Boolean);
}

// ── Reusable Score Panel ─────────────────────────────────────────────
function ScorePanel({ score, showHint = false }) {
  const ovr     = Number(score.matchScore) || 0;
  const skl     = Number(score.skillScore) || 0;
  const exp     = Number(score.expScore)   || 0;
  const rec     = score.recommendation || "Not Suitable";
  const recCls  = REC_CLASS[rec] || "bg-gray-100 text-gray-700";
  const matched = safeArr(score.matched);
  const miss2   = safeArr(score.missing);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Resume Match Score</span>
        <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full ${recCls}`}>{rec}</span>
      </div>

      {/* 3-column score cards */}
      <div className="grid grid-cols-3 gap-px bg-gray-200">
        {[
          { label: "Overall Match", value: ovr, icon: "🎯" },
          { label: "Skill Match",   value: skl, icon: "🛠" },
          { label: "Experience",    value: exp, icon: "📅" },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white px-3 py-4 text-center">
            <div className="text-[11px] text-gray-400 mb-1.5">{icon} {label}</div>
            <div className={`text-[32px] font-black leading-none ${scoreTextCls(value)}`}>
              {value}<span className="text-base font-bold">%</span>
            </div>
            <div className="mt-2 h-1 bg-gray-100 rounded-sm overflow-hidden">
              {/* width must stay inline — dynamic percentage */}
              <div className={`h-full rounded-sm transition-[width] duration-500 ease-out ${scoreBgCls(value)}`} style={{ width: value + "%" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Skills breakdown */}
      <div className="p-4">
        {matched.length > 0 && (
          <div className="mb-2.5">
            <div className="text-[11px] font-bold text-green-600 uppercase tracking-wide mb-1.5">✓ Matched Skills ({matched.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {matched.map(s => (
                <span key={s} className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">{s}</span>
              ))}
            </div>
          </div>
        )}
        {miss2.length > 0 && (
          <div className="mb-2.5">
            <div className="text-[11px] font-bold text-red-600 uppercase tracking-wide mb-1.5">✕ Missing Skills ({miss2.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {miss2.map(s => (
                <span key={s} className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">{s}</span>
              ))}
            </div>
          </div>
        )}
        {matched.length === 0 && miss2.length === 0 && (
          <p className="text-xs text-gray-400 italic">No skill breakdown available — score is based on experience only.</p>
        )}
        {showHint && (
          <div className="mt-2 pt-2.5 border-t border-dashed border-gray-200 text-xs text-gray-500">
            Click <strong className="text-[#f18200]">Parse Resume</strong> to auto-fill candidate details →
          </div>
        )}
      </div>
    </div>
  );
}

// ── Add Candidate Wizard ─────────────────────────────────────────────
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
  const [preScoring, setPreScoring] = useState(false);
  const [preScore, setPreScore]     = useState(null);
  const [scoreErr, setScoreErr]     = useState("");
  const fileRef = useRef(null);

  function reset() {
    setStep(1); setFile(null); setParsing(false); setParseErr("");
    setParsed(null); setMatchScore(null); setAutoFilled([]); setForm(BLANK); setSaving(false);
    setPreScoring(false); setPreScore(null); setScoreErr("");
  }
  function handleClose() { reset(); onClose(); }

  async function triggerScoring(fileToUse, jobId) {
    if (!fileToUse || !jobId) { setPreScore(null); setScoreErr(""); return; }
    setPreScoring(true); setPreScore(null); setScoreErr("");
    try {
      const result = await uploadResumeMatch(Number(jobId), fileToUse);
      setPreScore(result);
    } catch (err) {
      setScoreErr(getErrorMessage(err, "Could not compute match score"));
    } finally {
      setPreScoring(false);
    }
  }

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f); setParseErr(""); setPreScore(null); setScoreErr("");
    triggerScoring(f, form.jobReqId);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    const newVal = type === "checkbox" ? checked : value;
    setForm(f => ({ ...f, [name]: newVal }));
    if (name === "jobReqId") { setPreScore(null); setScoreErr(""); triggerScoring(file, newVal); }
  }

  async function handleParse() {
    if (!file) return;
    setParsing(true); setParseErr(""); setAutoFilled([]);
    try {
      const data = (preScore && preScore.parsed) ? preScore.parsed : await parseResume(file);
      setParsed(data);
      const filled = []; const updates = {};
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
    if (missing.length) { errorToast("Please fill in all required fields: " + missing.join(", ")); return; }
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

  // Auto-fill hint below extracted fields
  function AutoHint({ field }) {
    if (!autoFilled.includes(field)) return null;
    return <div className="text-[10px] text-[#f18200] mt-0.5 font-semibold">✓ extracted from resume</div>;
  }

  // Orange outline wrapper for auto-filled inputs
  function afWrap(field, children) {
    return autoFilled.includes(field)
      ? <div className="rounded-lg outline outline-2 outline-[#f18200] outline-offset-1">{children}</div>
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
                ? <><Loader2 size={14} className="animate-spin" /> Analysing…</>
                : parsing
                ? <><Loader2 size={14} className="animate-spin" /> Parsing…</>
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

      {/* ── Step 1 — Select Job + Upload ── */}
      {step === 1 && (
        <div>
          <div className="mb-4 px-3.5 py-2.5 bg-amber-50 rounded-lg border-l-[3px] border-l-[#f18200] text-sm text-amber-800">
            Select the job position, then upload a resume to auto-extract candidate details. Or click <strong>Enter Manually</strong> to skip.
          </div>

          <Field label="Job / Position" required>
            <select
              name="jobReqId"
              value={form.jobReqId}
              onChange={handleChange}
              className={`w-full text-sm px-2.5 py-2 border border-gray-200 rounded-lg bg-white outline-none ${form.jobReqId ? "text-gray-900" : "text-gray-400"}`}>
              <option value="">Select job requirement</option>
              {jobs.map(j => (
                <option key={j.job_req_id} value={String(j.job_req_id)}>
                  {j.job_req_code} — {j.title} ({j.client})
                </option>
              ))}
            </select>
          </Field>

          <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-2.5">Upload Resume</div>

          <div
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl px-6 py-7 text-center cursor-pointer transition-all ${file ? "border-[#f18200] bg-amber-50" : "border-gray-300 bg-gray-50"}`}>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
            {file ? (
              <>
                <div className="flex justify-center mb-2"><CheckCircle size={28} color="#f18200" /></div>
                <div className="text-sm font-bold text-gray-900 mb-0.5">{file.name}</div>
                <div className="text-[11px] text-gray-500">{(file.size / 1024).toFixed(1)} KB — click to change</div>
              </>
            ) : (
              <>
                <div className="flex justify-center mb-2.5"><Upload size={28} color="#9ca3af" /></div>
                <div className="text-sm font-semibold text-gray-700 mb-1">Click to upload resume</div>
                <div className="text-xs text-gray-400">Supported: PDF, DOC, DOCX — Max 5 MB</div>
              </>
            )}
          </div>

          {/* Score panel — shown once file + job are both selected */}
          {file && form.jobReqId && (
            <div className="mt-3.5">
              {preScoring && (
                <div className="flex items-center gap-2.5 px-4 py-3.5 bg-gray-50 rounded-xl border border-gray-200">
                  <Loader2 size={18} color="#f18200" className="animate-spin flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-gray-700">Analysing resume…</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">Computing match score against the selected job</div>
                  </div>
                </div>
              )}
              {!preScoring && scoreErr && (
                <div className="px-3.5 py-2.5 bg-red-50 rounded-lg border-l-[3px] border-l-red-500 text-sm text-red-800 flex gap-2">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <div>{scoreErr} — you can still proceed to parse manually.</div>
                </div>
              )}
              {!preScoring && preScore && <ScorePanel score={preScore} showHint />}
            </div>
          )}

          {file && !form.jobReqId && (
            <div className="mt-3 px-3.5 py-2.5 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-xs text-gray-400 text-center">
              Select a job above to see the resume match score
            </div>
          )}

          {parseErr && (
            <div className="mt-3 px-3.5 py-2.5 bg-red-50 rounded-lg border-l-[3px] border-l-red-500 text-sm text-red-800 flex gap-2">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" /> {parseErr}
            </div>
          )}
        </div>
      )}

      {/* ── Step 2 — Review & Edit ── */}
      {step === 2 && (
        <div>
          {parseErr && (
            <div className="mb-3.5 px-3.5 py-2.5 bg-red-50 rounded-lg border-l-[3px] border-l-red-500 text-sm text-red-800 flex gap-2">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <div><strong>Parse error:</strong> {parseErr} — please fill in the fields manually.</div>
            </div>
          )}

          {!parseErr && parsed ? (
            <div className="mb-3.5 px-3.5 py-2.5 bg-green-50 rounded-lg border-l-[3px] border-l-green-600 text-sm text-green-800">
              Resume parsed ({parsed.parsedBy === "openai" ? "AI-powered" : "keyword match"}) — fields highlighted in orange were auto-extracted. Review and fill any missing fields.
            </div>
          ) : !parseErr ? (
            <div className="mb-3.5 px-3.5 py-2.5 bg-amber-50 rounded-lg border-l-[3px] border-l-[#f18200] text-sm text-amber-800">
              Fields marked <strong>*</strong> are mandatory.
            </div>
          ) : null}

          {missing.length > 0 && (
            <div className="mb-3.5 px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex gap-2 items-start">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <div><strong>Missing required fields:</strong> {missing.join(", ")}</div>
            </div>
          )}

          {matchScore && (
            <div className="mb-4">
              <ScorePanel score={matchScore} />
            </div>
          )}

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

          <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-2.5 mt-1">Personal Details</div>
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
            <Field label="Gender">
              <Select name="gender" value={form.gender} onChange={handleChange} options={GENDERS} placeholder="Select gender" />
            </Field>
          </TwoColGrid>

          <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-2.5">Experience & CTC</div>
          <TwoColGrid>
            <Field label="Total Experience (Yrs)" required>
              {afWrap("totalExperience", <Input name="totalExperience" type="number" value={form.totalExperience} onChange={handleChange} placeholder="e.g. 5" />)}
              <AutoHint field="totalExperience" />
            </Field>
            <Field label="Relevant Experience (Yrs)" required>
              {afWrap("relevantExperience", <Input name="relevantExperience" type="number" value={form.relevantExperience} onChange={handleChange} placeholder="e.g. 4" />)}
              <AutoHint field="relevantExperience" />
            </Field>
            <Field label="Current CTC (Rs)" required>
              <Input name="currentCtc" type="number" value={form.currentCtc} onChange={handleChange} placeholder="Annual CTC in rupees" />
            </Field>
            <Field label="Expected CTC (Rs)" required>
              <Input name="expectedCtc" type="number" value={form.expectedCtc} onChange={handleChange} placeholder="Annual CTC in rupees" />
            </Field>
          </TwoColGrid>

          <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-2.5">Notice Period</div>
          <TwoColGrid>
            <Field label="Serving Notice Period?">
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input type="checkbox" name="noticePeriodServing" checked={!!form.noticePeriodServing} onChange={handleChange} className="w-4 h-4 accent-[#f18200]" />
                <span className="text-sm text-gray-700">Yes, currently serving</span>
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

          <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-2.5">Address</div>
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

// ── Match score widget (candidate detail — reads from DB, snake_case) ─
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
  if (loading)   return <div className="text-xs text-gray-400 mt-3">Loading match score...</div>;

  const rec      = match?.recommendation;
  const recCls   = REC_CLASS[rec] || "bg-gray-100 text-gray-700";
  const matched  = safeArr(match?.matched_skills);
  const missing2 = safeArr(match?.missing_skills);

  return (
    <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-gray-50 border-b border-gray-200">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Resume Match</div>
        <button onClick={recompute} disabled={computing} className="text-[11px] text-purple-600 bg-transparent border-0 cursor-pointer font-semibold">
          {computing ? "Computing..." : "Recompute"}
        </button>
      </div>
      {!match ? (
        <div className="px-4 py-3.5 text-sm text-gray-400">
          No score yet.{" "}
          <button onClick={recompute} className="text-purple-600 bg-transparent border-0 cursor-pointer text-sm font-semibold">Compute now</button>
        </div>
      ) : (
        <div className="px-4 py-3.5">
          <div className="flex items-center gap-3.5 mb-3">
            <div className="text-center">
              <div className={`text-[28px] font-extrabold leading-none ${scoreTextCls(match.match_score)}`}>{match.match_score}%</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Overall</div>
            </div>
            <div className="flex-1">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${recCls}`}>{rec}</span>
              <div className="flex gap-3 mt-2">
                <div className="text-[11px] text-gray-500">Skills <strong className="text-gray-900">{match.skill_score}%</strong></div>
                <div className="text-[11px] text-gray-500">Experience <strong className="text-gray-900">{match.exp_score}%</strong></div>
              </div>
            </div>
          </div>
          {matched.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {matched.map(s => <span key={s} className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-[#f18200]">ok {s}</span>)}
            </div>
          )}
          {missing2.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {missing2.map(s => <span key={s} className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-800">x {s}</span>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Terminal statuses where "Move to Next Round" should never appear
const NO_NEXT_STATUSES = ["Shortlisted","Offer Released","Offer Accepted","Offer Rejected","Rejected","Joining Formalities","Onboarded"];

// ── Interview history ─────────────────────────────────────────────────
function InterviewHistory({ candidateId, role, candidateStatus, onMoveToNextRound }) {
  const [ivs, setIvs]         = useState([]);
  const [loading, setLoading] = useState(false);
  const [cs, setCs]           = useState({});
  const canComment  = role === 4;
  const canMoveNext = (role === 1 || role === 3 || role === 5) && !NO_NEXT_STATUSES.includes(candidateStatus);

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

  if (loading) return <div className="mt-4 text-sm text-gray-400">Loading interview history...</div>;
  if (!ivs.length) return null;

  const TYPE_ICON = { "Video Call": "Video", "Phone": "Phone", "In-Person": "Office", "Teams": "Teams" };

  function dotBgCls(iv) {
    if (iv.status === "Scheduled")              return "bg-[#f18200]";
    if (iv.feedback_status === "Selected")      return "bg-green-600";
    if (iv.feedback_status === "Not Selected")  return "bg-red-600";
    if (iv.feedback_status === "Hold")          return "bg-amber-500";
    return "bg-gray-400";
  }
  function cardCls(iv) {
    if (iv.status === "Scheduled")              return { wrap: "border-orange-200 bg-amber-50",  badge: "text-[#f18200] border-orange-200 bg-white" };
    if (iv.feedback_status === "Selected")      return { wrap: "border-green-200 bg-green-50",   badge: "text-green-600 border-green-200 bg-white" };
    if (iv.feedback_status === "Not Selected")  return { wrap: "border-red-200 bg-red-50",       badge: "text-red-600 border-red-200 bg-white" };
    return { wrap: "border-gray-200 bg-gray-50", badge: "text-gray-500 border-gray-200 bg-white" };
  }

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2 mb-3.5">
        <div className="w-[3px] h-4 bg-[#f18200] rounded-sm" />
        <span className="text-[11px] font-bold text-gray-700 uppercase tracking-[0.06em]">Interview History</span>
        <span className="text-[11px] font-semibold bg-amber-50 text-[#f18200] border border-orange-200 rounded-full px-2 py-px">
          {ivs.length} round{ivs.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {ivs.map((iv, i) => {
          const sc  = cardCls(iv);
          const num = LEVEL_ORDER.indexOf(iv.level) + 1 || i + 1;
          const isScheduled    = iv.status === "Scheduled";
          const hasComment     = !!(iv.feedback_comments && iv.feedback_comments.trim());
          const isLastSelected = canMoveNext && iv.status === "Completed" && iv.feedback_status === "Selected" && i === ivs.length - 1;
          const cState         = cs[iv.interview_id];

          return (
            <div key={iv.interview_id} className={`rounded-xl border overflow-hidden ${sc.wrap}`}>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white flex-shrink-0 ${dotBgCls(iv)}`}>{num}</div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">
                    {iv.level}{" "}
                    {iv.interview_type && <span className="text-[11px] text-gray-500 font-normal">{TYPE_ICON[iv.interview_type] || ""} {iv.interview_type}</span>}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 flex gap-2 flex-wrap">
                    {iv.interview_date && <span>Date: {iv.interview_date.slice(0, 10)}</span>}
                    {iv.interview_time && <span>Time: {iv.interview_time.slice(0, 5)}</span>}
                    {iv.interviewer    && <span>Interviewer: {iv.interviewer}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.badge}`}>{isScheduled ? "Scheduled" : iv.status}</span>
                  {iv.feedback_status && !isScheduled && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.badge}`}>{iv.feedback_status}</span>
                  )}
                </div>
              </div>

              {cState?.editing ? (
                <div className="mx-3.5 mb-3">
                  <textarea
                    value={cState.text}
                    onChange={e => setCs(s => ({ ...s, [iv.interview_id]: { ...cState, text: e.target.value } }))}
                    rows={3} placeholder="Enter feedback..." autoFocus
                    className="w-full box-border px-2.5 py-2 text-xs leading-relaxed border border-orange-200 rounded-md bg-[#fffbf5] text-gray-700 resize-y outline-none font-[inherit]"
                  />
                  <div className="flex gap-2 mt-1.5">
                    <button onClick={() => saveComment(iv)} disabled={cState.saving}
                      className="text-[11px] font-bold px-3.5 py-1 bg-[#f18200] text-white border-0 rounded-md cursor-pointer">
                      {cState.saving ? "Saving..." : "Save"}
                    </button>
                    <button onClick={() => cancelEdit(iv.interview_id)}
                      className="text-[11px] px-3 py-1 bg-gray-100 text-gray-500 border border-gray-200 rounded-md cursor-pointer">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : hasComment ? (
                <div className="mx-3.5 mb-3 px-3 py-2.5 bg-[#fffbf5] border border-l-[3px] border-orange-200 border-l-[#f18200] rounded-md">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-[#f18200] uppercase">Interviewer Comments</span>
                    {canComment && (
                      <button onClick={() => startEdit(iv)} className="text-[10px] text-[#f18200] bg-transparent border-0 cursor-pointer font-semibold">Edit</button>
                    )}
                  </div>
                  <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{iv.feedback_comments}</div>
                </div>
              ) : canComment && !isScheduled ? (
                <div className="mx-3.5 mb-2.5">
                  <button onClick={() => startEdit(iv)}
                    className="text-[11px] font-semibold text-[#f18200] bg-amber-50 border border-dashed border-orange-200 rounded-md px-3 py-1.5 cursor-pointer">
                    + Add Comments
                  </button>
                </div>
              ) : isScheduled ? (
                <div className="mx-3.5 mb-2.5 text-[11px] text-gray-400 italic">Feedback pending after interview</div>
              ) : null}

              {/* Next Round action is handled inline in the candidates list */}
            </div>
          );
        })}
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
  const isTL        = role === 3;                 // Reporting Manager only — can push to next round
  const isHRMgr     = role === 4;                 // HR Manager — shortlist only, no interviews/offers
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
    // Optimistic update — apply immediately so the row reflects the change at once
    const prevStatus = candidates.find(c => c.candidate_id === candidateId)?.status;
    setCandidates(cs2 => cs2.map(c => c.candidate_id === candidateId ? { ...c, status } : c));
    setDetail(d => d?.candidate_id === candidateId ? { ...d, status } : d);
    try {
      await apiUpdateStatus(candidateId, status);
      successToast("Status updated to " + status);
    } catch (err) {
      // Roll back on failure
      setCandidates(cs2 => cs2.map(c => c.candidate_id === candidateId ? { ...c, status: prevStatus } : c));
      setDetail(d => d?.candidate_id === candidateId ? { ...d, status: prevStatus } : d);
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
        candidateId:       intForm.candidateId,
        jobReqId:          intForm.jobReqId,
        level:             intForm.level,
        interviewType:     intForm.interviewType,
        interviewDate:     intForm.interviewDate,
        interviewTime:     intForm.interviewTime,
        durationMinutes:   intForm.durationMinutes ? Number(intForm.durationMinutes) : null,
        interviewer:       intForm.interviewer,
        teamsSubject:      intForm.teamsSubject      || null,
        teamsParticipants: intForm.teamsParticipants || null,
        teamsStart:        intForm.teamsStart         || null,
        teamsEnd:          intForm.teamsEnd           || null,
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
    { header: "Name",        key: "name", render: (v, row) => (
      <div>
        <div className="font-semibold text-gray-900">{v}</div>
        <div className="text-[11px] text-gray-500">{row.email}</div>
      </div>
    )},
    { header: "Applied For", key: "job_title", render: (v, row) => (
      <div>
        <div className="font-medium">{v}</div>
        <div className="text-[11px] text-gray-500">{row.job_client}</div>
      </div>
    )},
    { header: "Experience",   key: "total_experience",      render: v => (v || 0) + " Yrs" },
    { header: "Current CTC",  key: "current_ctc",   render: v => v ? ((v/100000).toFixed(1) + " LPA") : "N/A" },
    { header: "Expected CTC", key: "expected_ctc",  render: v => v ? ((v/100000).toFixed(1) + " LPA") : "N/A" },
    { header: "Notice",       key: "notice_period_serving", render: v => v ? "Serving" : "Immediate" },
    { header: "Status",       key: "status",        render: v => <StatusBadge status={v} /> },
    { header: "Source",       key: "source" },
    { header: "", key: "candidate_id", width: 180, render: (_, row) => (
      <div className="flex gap-1 flex-wrap">
        {/* Recruiter: schedule interview */}
        {row.status === "Schedule Interview" && isRecruiter && (
          <button onClick={e => { e.stopPropagation(); setDetail(row); openSchedule(row); }}
            className="text-[11px] font-bold px-2.5 py-1 bg-[#f18200] text-white border-0 rounded-md cursor-pointer whitespace-nowrap">
            Schedule
          </button>
        )}
        {/* Recruiter: shortlist directly from list */}
        {row.status === "Schedule Interview" && isRecruiter && (
          <button onClick={e => { e.stopPropagation(); updateStatus(row.candidate_id, "Shortlisted"); }}
            className="text-[11px] font-bold px-2.5 py-1 bg-blue-600 text-white border-0 rounded-md cursor-pointer whitespace-nowrap">
            Shortlist
          </button>
        )}
        {/* Release Offer removed from candidate list — handled via Offers tab */}
        {/* Reporting Manager: Next Round inline — only when last interview = Selected and not terminal */}
        {isTL && row.last_interview_feedback === "Selected" && !NO_NEXT_STATUSES.includes(row.status) && (
          <button onClick={e => { e.stopPropagation(); updateStatus(row.candidate_id, "Schedule Interview"); }}
            className="text-[11px] font-bold px-2.5 py-1 bg-violet-600 text-white border-0 rounded-md cursor-pointer whitespace-nowrap">
            Next Round
          </button>
        )}
        <Btn size="sm" variant="ghost" icon={<Eye size={14} />} onClick={e => { e.stopPropagation(); setDetail(row); }}>View</Btn>
      </div>
    )},
  ];

  const jobOpts    = [{ value: "", label: "All Jobs" },     ...jobs.map(j => ({ value: String(j.job_req_id), label: j.title }))];
  const statusOpts = [{ value: "", label: "All Statuses" }, ...STATUS_OPTS.map(s => ({ value: s, label: s }))];

  const STATUS_STRIPS = [
    { label: "Total",           count: candidates.length,                                                              val: "",                   cls: "text-gray-500 bg-gray-100",     activeBorder: "border-gray-500",    defaultBorder: "border-gray-200" },
    { label: "Shortlisted",     count: candidates.filter(c => c.status === "Shortlisted").length,                     val: "Shortlisted",        cls: "text-blue-700 bg-blue-50",      activeBorder: "border-blue-700",    defaultBorder: "border-blue-200" },
    { label: "In Interview",    count: candidates.filter(c => c.status === "Schedule Interview").length,               val: "Schedule Interview", cls: "text-purple-700 bg-purple-50",  activeBorder: "border-purple-700",  defaultBorder: "border-purple-200" },
    { label: "Offer Released",  count: candidates.filter(c => c.status === "Offer Released").length,                  val: "Offer Released",     cls: "text-amber-700 bg-amber-50",   activeBorder: "border-amber-700",   defaultBorder: "border-amber-200" },
    { label: "Offer Accepted",  count: candidates.filter(c => c.status === "Offer Accepted").length,                  val: "Offer Accepted",     cls: "text-[#f18200] bg-orange-50",  activeBorder: "border-[#f18200]",   defaultBorder: "border-orange-200" },
    { label: "Onboarded",       count: candidates.filter(c => c.status === "Onboarded").length,                       val: "Onboarded",          cls: "text-green-800 bg-green-100",  activeBorder: "border-green-800",   defaultBorder: "border-green-300" },
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={["Dashboard", "Candidates"]}
        title={isRecruiter ? "My Candidates" : "Candidates"}
        subtitle="Track all candidate profiles and pipeline status"
        action={
          <div className="flex gap-2">
            <Btn variant="secondary" icon={<RefreshCw size={14} />} onClick={loadCandidates} />
            <Btn icon={<Plus size={16} />} onClick={() => setAddOpen(true)}>Add Candidate</Btn>
          </div>
        }
      />

      {/* Status strip */}
      <div className="flex gap-2.5 mb-5 flex-wrap">
        {STATUS_STRIPS.map(s => (
          <div key={s.label}
            onClick={() => { setFilterStatus(s.val); setTimeout(() => tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer border-[1.5px] transition-all ${s.cls} ${filterStatus === s.val ? s.activeBorder : s.defaultBorder}`}>
            <span className="text-lg font-extrabold leading-none">{s.count}</span>
            <span className="text-xs font-semibold">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div ref={tableRef} className="scroll-mt-4">
        <Card style={{ padding: 0 }}>
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 flex-wrap">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, ID..." />
            <Select value={filterJob}    onChange={e => setFilterJob(e.target.value)}    options={jobOpts} />
            <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} options={statusOpts} />
            <div className="ml-auto flex items-center gap-2">
              {filterStatus && (
                <span onClick={() => setFilterStatus("")}
                  className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-[#f18200] border border-orange-200 cursor-pointer">
                  {filterStatus} ×
                </span>
              )}
              <span className="text-xs text-gray-500">
                {loading ? "Loading..." : filtered.length + " candidate" + (filtered.length !== 1 ? "s" : "")}
              </span>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2.5 py-12 text-gray-500">
              <Loader2 size={20} className="animate-spin" /> Loading candidates...
            </div>
          ) : (
            <Table columns={columns} data={filtered} onRowClick={r => setDetail(r)} />
          )}
        </Card>
      </div>

      {/* Add Candidate Wizard — only open/active jobs */}
      <AddCandidateWizard
        open={addOpen}
        onClose={() => setAddOpen(false)}
        jobs={jobs.filter(j => !j.assignment_status || j.assignment_status === "Open")}
        recruiters={recruiters}
        isRecruiter={isRecruiter}
        onSuccess={() => { setAddOpen(false); loadCandidates(); }}
      />

      {/* Candidate Detail Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Candidate Profile" width={680}
        footer={
          <div className="flex items-center gap-2.5 w-full">
            {/* Status dropdown: only Recruiter (5) and Reporting Manager (3) can change status via dropdown */}
            {isRecruiter && (
              <div className="flex-1">
                <Select value={detail?.status || ""} onChange={e => updateStatus(detail.candidate_id, e.target.value)}
                  options={["Work in Progress","Schedule Interview","Shortlisted"].map(s => ({ value: s, label: s }))} />
              </div>
            )}
            {isTL && (
              <div className="flex-1">
                <Select value={detail?.status || ""} onChange={e => updateStatus(detail.candidate_id, e.target.value)}
                  options={STATUS_OPTS.map(s => ({ value: s, label: s }))} />
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
            {/* Candidate header card */}
            <div className="flex items-center gap-4 px-4 py-3.5 bg-gray-50 rounded-xl mb-5">
              <div className="w-[52px] h-[52px] rounded-full bg-[#1a2535] text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
                {(detail.name || "?").charAt(0)}
              </div>
              <div className="flex-1">
                <div className="text-[17px] font-bold text-gray-900">{detail.name}</div>
                <div className="text-sm text-gray-500">{detail.email}{detail.mobile ? " · " + detail.mobile : ""}</div>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  <StatusBadge status={detail.status} />
                  {detail.source && <span className="text-[11px] bg-gray-100 px-2.5 py-0.5 rounded-xl text-gray-500">{detail.source}</span>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-gray-500">Candidate ID</div>
                <div className="text-sm font-bold text-[#f18200]">{detail.candidate_code}</div>
              </div>
            </div>

            {/* Applied for */}
            {detail.job_title && (
              <div className="px-3.5 py-2.5 bg-amber-50 rounded-lg mb-4 border-l-[3px] border-l-[#f18200]">
                <div className="text-[11px] text-amber-800 font-semibold">APPLIED FOR</div>
                <div className="text-sm font-semibold text-gray-900">
                  {detail.job_title} <span className="text-gray-500 font-normal">@ {detail.job_client}</span>
                </div>
              </div>
            )}

            {/* Detail grid */}
            <div className="grid grid-cols-2 gap-x-5">
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

            {/* Skill set chips */}
            {detail.skill_set && (
              <div className="mt-3">
                <div className="text-xs font-semibold text-gray-500 mb-2">SKILL SET</div>
                <div className="flex gap-1.5 flex-wrap">
                  {detail.skill_set.split(",").map(s => s.trim()).filter(Boolean).map(s => (
                    <span key={s} className="bg-gray-100 px-2.5 py-0.5 rounded-full text-xs text-gray-700 font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}

            <MatchScoreWidget candidateId={detail.candidate_id} jobReqId={detail.job_req_id} />

            {/* Schedule interview prompt for recruiter */}
            {detail.status === "Schedule Interview" && isRecruiter && (
              <div className="mt-4 px-4 py-3.5 bg-amber-50 border border-orange-200 border-l-4 border-l-[#f18200] rounded-xl flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-amber-800">Ready for Next Interview Round</div>
                  <div className="text-[11px] text-amber-700 mt-0.5">HR has approved this candidate - schedule the next interview</div>
                </div>
                <button onClick={() => openSchedule(detail)}
                  className="text-xs font-bold text-white bg-[#f18200] border-0 rounded-lg px-4 py-2 cursor-pointer flex-shrink-0">
                  Schedule Interview
                </button>
              </div>
            )}

            <InterviewHistory
              candidateId={detail.candidate_id}
              role={role}
              candidateStatus={detail.status}
              onMoveToNextRound={() => updateStatus(detail.candidate_id, "Schedule Interview")}
            />
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
            <div className="px-3.5 py-2.5 bg-amber-50 rounded-lg mb-4 border-l-[3px] border-l-[#f18200]">
              <div className="text-[11px] font-bold text-amber-800 mb-0.5">CANDIDATE</div>
              <div className="text-sm font-bold text-gray-900">{detail.name}</div>
              <div className="text-xs text-gray-500">{detail.email}</div>
              {detail.job_title && <div className="text-xs text-[#f18200] mt-1">Position: {detail.job_title} @ {detail.job_client}</div>}
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
              <div className="px-3.5 py-3 bg-amber-50 rounded-lg mt-1">
                <div className="text-xs font-bold text-amber-800 mb-2.5">Microsoft Teams Meeting</div>
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
