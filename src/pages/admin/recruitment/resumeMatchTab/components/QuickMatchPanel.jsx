import React, { useState, useCallback, useRef } from "react";
import {
  Loader2, Zap, MapPin, Briefcase, Building2, Link2, GitBranch,
  Clock, DollarSign, BookOpen, Award, Globe, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, User, Star
} from "lucide-react";
import { Btn, Select, Field } from "../../shared";
import { uploadResumeMatch, getErrorMessage } from "../../../../../api/recruitment.api";
import { errorToast } from "../../../../../utils/ToastControllers";
import ScoreCircle from "./ScoreCircle";
import RecBadge from "./RecBadge";
import SkillBar from "./SkillBar";
import SkillPills from "./SkillPills";

/* ── Helpers ── */
const fmt = (n) => n ? `₹${Number(n).toLocaleString("en-IN")}` : null;
const fmtDays = (d) => d === 0 ? "Immediate" : d ? `${d} days` : null;

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <span className="text-[#f18200] mt-0.5 shrink-0">{icon}</span>
      <div>
        <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wide block">{label}</span>
        <span className="text-[12px] font-semibold text-[#1e293b]">{value}</span>
      </div>
    </div>
  );
}

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#e2e8f0] rounded-xl overflow-hidden mb-3">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#f8fafc] hover:bg-[#f0f4f8] transition-colors">
        <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">{title}</span>
        {open ? <ChevronUp size={13} className="text-[#94a3b8]"/> : <ChevronDown size={13} className="text-[#94a3b8]"/>}
      </button>
      {open && <div className="px-3.5 pb-3 pt-1">{children}</div>}
    </div>
  );
}

/* ── Parsed resume detail panel ── */
function ParsedDetail({ parsed, result }) {
  const matched = result?.matched ?? [];
  const missing = result?.missing ?? [];
  const rec     = result?.recommendation;

  return (
    <div className="px-5 py-[18px] bg-gray-50 overflow-y-auto max-h-[80vh]">
      <div className="text-[12px] font-bold text-gray-500 uppercase tracking-[0.04em] mb-3">
        Result — {result?.jobTitle}
      </div>

      {/* Score + recommendation */}
      <div className="flex items-center gap-3.5 mb-3 px-3.5 py-3 bg-white rounded-xl border border-gray-200">
        <ScoreCircle score={result?.matchScore} size={68}/>
        <div className="flex-1">
          <RecBadge label={rec}/>
          <div className="text-[11px] text-gray-500 mt-1">
            Required: <strong>{result?.jobExperienceLevel || "Not specified"}</strong>
          </div>
          {parsed?.resume_score != null && (
            <div className="text-[11px] text-[#f18200] mt-0.5 flex items-center gap-1">
              <Star size={10}/> Resume Score: <strong>{parsed.resume_score}/100</strong>
            </div>
          )}
        </div>
        {parsed?.parsedBy && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
            parsed.parsedBy==="openai"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
            {parsed.parsedBy === "openai" ? "✓ AI Parsed" : "⚡ Regex Parsed"}
          </span>
        )}
      </div>

      {/* Skill bars */}
      <div className="mb-3">
        <SkillBar label="Skills (60%)"      score={result?.skillScore} color="#7c3aed"/>
        <SkillBar label="Experience (40%)"  score={result?.expScore}   color="#0369a1"/>
      </div>

      {/* Matched / missing skills */}
      {(matched.length > 0 || missing.length > 0) && (
        <Section title={`Skills Match (${matched.length}✔ / ${missing.length}✖)`}>
          {matched.length > 0 && (
            <div className="mb-2">
              <div className="text-[11px] font-bold text-emerald-600 mb-1">Matched ({matched.length})</div>
              <SkillPills skills={matched} matched={true}/>
            </div>
          )}
          {missing.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-red-500 mb-1">Missing ({missing.length})</div>
              <SkillPills skills={missing} matched={false}/>
            </div>
          )}
        </Section>
      )}

      {/* Candidate identity */}
      {parsed && (parsed.name || parsed.email || parsed.phone) && (
        <Section title="Candidate Identity">
          <InfoRow icon={<User size={13}/>}     label="Name"    value={parsed.name}/>
          <InfoRow icon={<Zap size={13}/>}      label="Email"   value={parsed.email}/>
          <InfoRow icon={<Zap size={13}/>}      label="Phone"   value={parsed.phone}/>
          <InfoRow icon={<MapPin size={13}/>}   label="Location" value={parsed.location}/>
          {parsed.linkedin_url && (
            <div className="flex items-center gap-2 py-1.5">
              <Link2 size={13} className="text-[#f18200] shrink-0"/>
              <a href={parsed.linkedin_url} target="_blank" rel="noreferrer"
                className="text-[12px] text-blue-600 hover:underline truncate">{parsed.linkedin_url}</a>
            </div>
          )}
          {parsed.github_url && (
            <div className="flex items-center gap-2 py-1.5">
              <GitBranch size={13} className="text-[#f18200] shrink-0"/>
              <a href={parsed.github_url} target="_blank" rel="noreferrer"
                className="text-[12px] text-blue-600 hover:underline truncate">{parsed.github_url}</a>
            </div>
          )}
        </Section>
      )}

      {/* Current position */}
      {parsed && (parsed.current_role || parsed.current_company || parsed.experience) && (
        <Section title="Current Position">
          <InfoRow icon={<Briefcase size={13}/>} label="Role"       value={parsed.current_role}/>
          <InfoRow icon={<Building2 size={13}/>} label="Company"    value={parsed.current_company}/>
          <InfoRow icon={<Clock size={13}/>}     label="Experience"  value={parsed.experience ? `${parsed.experience} years` : null}/>
        </Section>
      )}

      {/* Compensation */}
      {parsed && (parsed.current_ctc_annual || parsed.expected_ctc_annual || parsed.notice_period_days != null) && (
        <Section title="Compensation & Availability">
          <InfoRow icon={<DollarSign size={13}/>} label="Current CTC"  value={fmt(parsed.current_ctc_annual)}/>
          <InfoRow icon={<DollarSign size={13}/>} label="Expected CTC" value={fmt(parsed.expected_ctc_annual)}/>
          <InfoRow icon={<Clock size={13}/>}      label="Notice Period" value={fmtDays(parsed.notice_period_days)}/>
        </Section>
      )}

      {/* All skills */}
      {parsed?.skills?.length > 0 && (
        <Section title={`Skills (${parsed.skills.length})`} defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {parsed.skills.map(s => (
              <span key={s} className="text-[11px] px-2.5 py-1 rounded-full bg-[#fff8f0] border border-[#fed7aa] text-[#f18200] font-medium">{s}</span>
            ))}
          </div>
        </Section>
      )}

      {/* Work experience */}
      {parsed?.work_experience?.length > 0 && (
        <Section title={`Work Experience (${parsed.work_experience.length})`} defaultOpen={false}>
          <div className="space-y-3 pt-1">
            {parsed.work_experience.map((w, i) => (
              <div key={i} className="border-l-2 border-[#f18200] pl-3">
                <p className="text-[12px] font-bold text-[#1e293b]">{w.designation || "Role"}</p>
                <p className="text-[11px] text-[#64748b]">{w.company_name}</p>
                <p className="text-[10px] text-[#94a3b8]">
                  {[w.start_month && w.start_year ? `${w.start_month}/${w.start_year}` : w.start_year, "–",
                    w.is_current ? "Present" : (w.end_month && w.end_year ? `${w.end_month}/${w.end_year}` : w.end_year)
                  ].filter(Boolean).join(" ")}
                </p>
                {w.description && <p className="text-[11px] text-[#64748b] mt-1 line-clamp-2">{w.description}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Education */}
      {parsed?.education?.length > 0 && (
        <Section title={`Education (${parsed.education.length})`} defaultOpen={false}>
          <div className="space-y-2 pt-1">
            {parsed.education.map((e, i) => (
              <div key={i} className="flex items-start gap-2">
                <BookOpen size={12} className="text-[#f18200] mt-0.5 shrink-0"/>
                <div>
                  <p className="text-[12px] font-semibold text-[#1e293b]">{e.degree}</p>
                  <p className="text-[11px] text-[#64748b]">{[e.institution, e.year].filter(Boolean).join(" · ")}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Certifications */}
      {parsed?.certifications?.length > 0 && (
        <Section title={`Certifications (${parsed.certifications.length})`} defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {parsed.certifications.map(c => (
              <span key={c} className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-medium flex items-center gap-1">
                <Award size={9}/>{c}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Languages */}
      {parsed?.languages?.length > 0 && (
        <Section title="Languages" defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {parsed.languages.map(l => (
              <span key={l} className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium flex items-center gap-1">
                <Globe size={9}/>{l}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Summary */}
      {parsed?.summary && (
        <Section title="Summary" defaultOpen={false}>
          <p className="text-[12px] text-[#374151] leading-relaxed pt-1">{parsed.summary}</p>
        </Section>
      )}

      {/* Companies history */}
      {parsed?.companies?.length > 0 && (
        <Section title="Companies History" defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {parsed.companies.map(c => (
              <span key={c} className="text-[11px] px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 font-medium">{c}</span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

/* ── Main panel ── */
const QuickMatchPanel = React.memo(function QuickMatchPanel({ jobs }) {
  const [jobId, setJobId]     = useState("");
  const [file, setFile]       = useState(null);
  const [dragging, setDragging] = useState(false);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const jobOpts = [
    { value: "", label: "— Select Job Requirement —" },
    ...jobs.map(j => ({ value: String(j.job_req_id), label: `${j.job_req_code || ""} — ${j.title}` })),
  ];

  const handleFile = useCallback((f) => {
    if (!f) return;
    if (!/\.(pdf|doc|docx)$/i.test(f.name)) { errorToast("Only PDF or DOCX files are supported"); return; }
    setFile(f); setResult(null);
  }, []);

  const handleCheck = useCallback(async () => {
    if (!jobId || !file) return;
    setLoading(true); setResult(null);
    try { setResult(await uploadResumeMatch(Number(jobId), file)); }
    catch (err) { errorToast(getErrorMessage(err, "Failed to parse resume")); }
    finally { setLoading(false); }
  }, [jobId, file]);

  const handleReset = useCallback(() => {
    setJobId(""); setFile(null); setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const parsed = result?.parsed;

  return (
    <div className="mb-5 rounded-xl overflow-hidden border-2 border-[#f18200] bg-white">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-[18px] py-3 bg-gradient-to-r from-[#fff7ed] to-white border-b border-[#fed7aa]">
        <Zap size={18} color="#f18200"/>
        <div>
          <div className="text-[14px] font-bold text-gray-900">Resume Match Checker</div>
          <div className="text-[12px] text-gray-500">
            Upload PDF or DOCX → AI extracts all fields dynamically → instant match score
          </div>
        </div>
      </div>

      <div className={result ? "grid" : ""} style={result ? { gridTemplateColumns: "1fr 1.4fr" } : {}}>
        {/* Upload form */}
        <div className={`px-5 py-[18px] ${result ? "border-r border-gray-200" : ""}`}>
          <Field label="Job Requirement" required>
            <Select value={jobId} onChange={e => { setJobId(e.target.value); setResult(null); }} options={jobOpts}/>
          </Field>
          <Field label="Upload Resume (PDF / DOC / DOCX)" required>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-[10px] py-6 px-4 text-center cursor-pointer transition-all ${
                dragging || file ? "border-[#f18200] bg-[#fff7ed]" : "border-gray-300 bg-gray-50"}`}>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
                onChange={e => handleFile(e.target.files[0])}/>
              {file ? (
                <>
                  <div className="text-[28px] mb-1.5">📄</div>
                  <div className="text-[13px] font-bold text-[#f18200]">{file.name}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{(file.size/1024).toFixed(0)} KB · Click to change</div>
                </>
              ) : (
                <>
                  <div className="text-[28px] mb-1.5">📂</div>
                  <div className="text-[13px] font-semibold text-gray-700">Drop resume here or click to browse</div>
                  <div className="text-[11px] text-gray-400 mt-1">PDF or DOCX · Max 5 MB</div>
                </>
              )}
            </div>
          </Field>
          <div className="flex gap-2.5 mt-1">
            <Btn onClick={handleCheck} disabled={!jobId || !file || loading}
              icon={loading ? <Loader2 size={15}/> : <Zap size={15}/>}>
              {loading ? "Analysing…" : "Analyse & Match"}
            </Btn>
            {(file || result) && <Btn variant="secondary" onClick={handleReset}>Reset</Btn>}
          </div>
        </div>

        {/* Dynamic parsed result */}
        {result && <ParsedDetail parsed={parsed} result={result}/>}
      </div>
    </div>
  );
});

export default QuickMatchPanel;
