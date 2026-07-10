import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw, Loader2, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { PageHeader, Card, Btn, Select, Field, Input, SearchBar } from "./shared";
import {
  listJobs, listMatchesByJob, computeResumeMatch,
  uploadResumeMatch, getErrorMessage,
} from "../../../api/recruitment.api";
import { errorToast } from "../../../utils/ToastControllers";

const REC_CLS = {
  "Highly Suitable":    { bg:"bg-[#fff7ed]",  text:"text-[#f18200]",  icon:"⭐" },
  "Suitable":           { bg:"bg-blue-100",   text:"text-blue-800",   icon:"🔵" },
  "Partially Suitable": { bg:"bg-amber-100",  text:"text-amber-900",  icon:"🟡" },
  "Not Suitable":       { bg:"bg-red-100",    text:"text-red-900",    icon:"🔴" },
};

function ScoreCircle({ score, size = 64 }) {
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 80 ? "#f18200" : score >= 65 ? "#0369a1" : score >= 45 ? "#d97706" : "#dc2626";
  const fs = size < 60 ? 11 : 14;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x={size/2} y={size/2 + fs*0.4} textAnchor="middle" fontSize={fs} fontWeight={800} fill={color}>
        {score}%
      </text>
    </svg>
  );
}

function RecBadge({ label }) {
  const s = REC_CLS[label] || { bg:"bg-gray-100", text:"text-gray-700", icon:"⚪" };
  return (
    <span className={`text-[12px] font-bold px-3 py-1 rounded-full ${s.bg} ${s.text}`}>
      {s.icon} {label}
    </span>
  );
}

function SkillBar({ label, score, color }) {
  return (
    <div className="mb-2.5">
      <div className="flex justify-between mb-1">
        <span className="text-[12px] text-gray-700 font-medium">{label}</span>
        <span className="text-[12px] font-bold" style={{ color }}>{score}%</span>
      </div>
      <div className="h-[7px] rounded bg-gray-100">
        <div className="h-[7px] rounded transition-all duration-500" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
}

function SkillPills({ skills, matched }) {
  if (!skills?.length) return <span className="text-[12px] text-gray-400">None</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {skills.map(s => (
        <span key={s} className={`text-[11px] font-semibold px-2 py-[3px] rounded-full ${
          matched ? "bg-[#fff7ed] text-[#f18200]" : "bg-red-100 text-red-800"
        }`}>
          {matched ? "✔" : "✖"} {s}
        </span>
      ))}
    </div>
  );
}

// ── QUICK MATCH PANEL ─────────────────────────────────────────────────────────
function QuickMatchPanel({ jobs }) {
  const [jobId, setJobId]       = useState("");
  const [file, setFile]         = useState(null);
  const [dragging, setDragging] = useState(false);
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const fileRef = React.useRef();

  const jobOpts = [
    { value: "", label: "— Select Job Requirement —" },
    ...jobs.map(j => ({ value: String(j.job_req_id), label: `${j.job_req_code || ""} — ${j.title}` })),
  ];

  function handleFile(f) {
    if (!f) return;
    if (!/\.(pdf|doc|docx)$/i.test(f.name)) { errorToast("Only PDF or DOCX files are supported"); return; }
    setFile(f); setResult(null);
  }

  async function handleCheck() {
    if (!jobId || !file) return;
    setLoading(true); setResult(null);
    try { setResult(await uploadResumeMatch(Number(jobId), file)); }
    catch (err) { errorToast(getErrorMessage(err, "Failed to parse resume")); }
    finally { setLoading(false); }
  }

  function handleReset() {
    setJobId(""); setFile(null); setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const matched = result?.matched ?? [];
  const missing = result?.missing ?? [];
  const rec     = result?.recommendation;
  const parsed  = result?.parsed;

  return (
    <div className="mb-5 rounded-xl overflow-hidden border-2 border-[#f18200] bg-white">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-[18px] py-3 bg-gradient-to-r from-[#fff7ed] to-white border-b border-[#fed7aa]">
        <Zap size={18} color="#f18200" />
        <div>
          <div className="text-[14px] font-bold text-gray-900">Resume Match Checker</div>
          <div className="text-[12px] text-gray-500">Upload a PDF or DOCX resume → system reads skills automatically → instant match score</div>
        </div>
      </div>

      <div className={`${result ? "grid" : ""}`} style={result ? { gridTemplateColumns: "1fr 1.2fr" } : {}}>
        {/* Left: inputs */}
        <div className={`px-5 py-[18px] ${result ? "border-r border-gray-200" : ""}`}>
          <Field label="Job Requirement" required>
            <Select value={jobId} onChange={e => { setJobId(e.target.value); setResult(null); }} options={jobOpts} />
          </Field>

          <Field label="Upload Resume (PDF or DOCX)" required>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-[10px] py-6 px-4 text-center cursor-pointer transition-all ${
                dragging || file ? "border-[#f18200] bg-[#fff7ed]" : "border-gray-300 bg-gray-50"
              }`}
            >
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
                onChange={e => handleFile(e.target.files[0])} />
              {file ? (
                <>
                  <div className="text-[28px] mb-1.5">📄</div>
                  <div className="text-[13px] font-bold text-[#f18200]">{file.name}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{(file.size / 1024).toFixed(0)} KB · Click to change</div>
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
              icon={loading ? <Loader2 size={15} /> : <Zap size={15} />}>
              {loading ? "Analysing Resume…" : "Analyse & Match"}
            </Btn>
            {(file || result) && <Btn variant="secondary" onClick={handleReset}>Reset</Btn>}
          </div>
        </div>

        {/* Right: result */}
        {result && (
          <div className="px-5 py-[18px] bg-gray-50 overflow-y-auto">
            <div className="text-[12px] font-bold text-gray-500 uppercase tracking-[0.04em] mb-3">
              Result — {result.jobTitle}
            </div>

            {parsed && (parsed.name || parsed.email || parsed.phone) && (
              <div className="bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 mb-3.5">
                <div className="text-[11px] font-bold text-gray-500 mb-1.5 uppercase">Extracted from Resume</div>
                {parsed.name  && <div className="text-[13px] font-bold text-gray-900">👤 {parsed.name}</div>}
                {parsed.email && <div className="text-[12px] text-gray-500">✉ {parsed.email}</div>}
                {parsed.phone && <div className="text-[12px] text-gray-500">📞 {parsed.phone}</div>}
                <div className="text-[12px] text-gray-500 mt-1">
                  🗓 Experience detected: <strong>{result.parsed?.experience || 0} years</strong>
                </div>
                {parsed.skills?.length > 0 && (
                  <div className="mt-2">
                    <div className="text-[11px] text-gray-400 mb-1">Skills found in resume:</div>
                    <div className="flex flex-wrap gap-1">
                      {parsed.skills.map(s => (
                        <span key={s} className="text-[11px] px-2 py-[2px] rounded-full bg-gray-100 text-gray-700 font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3.5 mb-3.5 px-3.5 py-3 bg-white rounded-[10px] border border-gray-200">
              <ScoreCircle score={result.matchScore} size={68} />
              <div>
                <RecBadge label={rec} />
                <div className="text-[11px] text-gray-500 mt-1.5">
                  Required: <strong>{result.jobExperienceLevel || "Not specified"}</strong>
                </div>
              </div>
            </div>

            <div className="mb-3.5">
              <SkillBar label="Skills (60%)"     score={result.skillScore} color="#7c3aed" />
              <SkillBar label="Experience (40%)" score={result.expScore}   color="#0369a1" />
            </div>

            {matched.length > 0 && (
              <div className="mb-2">
                <div className="text-[11px] font-bold text-[#f18200] mb-1.5">✔ Matched ({matched.length})</div>
                <SkillPills skills={matched} matched={true} />
              </div>
            )}
            {missing.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-red-600 mb-1.5">✖ Missing ({missing.length})</div>
                <SkillPills skills={missing} matched={false} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── RANKED LIST ROW ───────────────────────────────────────────────────────────
function MatchRow({ row, onRecompute, rank }) {
  const [expanded, setExpanded]       = useState(false);
  const [recomputing, setRecomputing] = useState(false);
  const matched = JSON.parse(row.matched_skills || "[]");
  const missing = JSON.parse(row.missing_skills || "[]");

  async function handleRecompute(e) {
    e.stopPropagation();
    setRecomputing(true);
    try { await onRecompute(row.candidate_id, row.job_req_id); }
    catch (err) { errorToast(getErrorMessage(err, "Failed")); }
    finally { setRecomputing(false); }
  }

  return (
    <>
      <tr onClick={() => setExpanded(v => !v)}
        className={`cursor-pointer border-b border-gray-100 ${expanded ? "bg-gray-50" : "bg-white"}`}>
        <td className="px-3.5 py-3 text-[13px] font-bold text-gray-400 w-9">#{rank}</td>
        <td className="px-3.5 py-3">
          <div className="font-semibold text-gray-900">{row.candidate_name}</div>
          <div className="text-[11px] text-gray-400">{row.candidate_code} · {row.candidate_email}</div>
        </td>
        <td className="px-3.5 py-3 text-center"><ScoreCircle score={row.match_score} size={52} /></td>
        <td className="px-3.5 py-3"><RecBadge label={row.recommendation} /></td>
        <td className="px-3.5 py-3">
          <span className="text-[12px] text-[#f18200] font-semibold">✔ {matched.length}</span>
          <span className="text-[12px] text-gray-400 mx-1">·</span>
          <span className="text-[12px] text-red-600 font-semibold">✖ {missing.length}</span>
        </td>
        <td className="px-3.5 py-3 text-[12px] text-gray-700">{row.relevant_experience} yrs</td>
        <td className="px-3.5 py-3">
          <div className="flex gap-1.5 items-center">
            <button onClick={handleRecompute} disabled={recomputing} title="Recompute score"
              className="border-0 bg-transparent cursor-pointer text-violet-600 font-bold text-base">
              {recomputing ? "…" : "↻"}
            </button>
            {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50">
          <td colSpan={7} className="px-3.5 pb-4 pl-12">
            <div className="grid grid-cols-2 gap-3.5 pt-3">
              <div className="bg-white rounded-[10px] border border-gray-200 p-3.5">
                <div className="text-[11px] font-bold text-gray-500 mb-2.5 uppercase">Score Breakdown</div>
                <SkillBar label="Skills (60%)"     score={row.skill_score} color="#7c3aed" />
                <SkillBar label="Experience (40%)" score={row.exp_score}   color="#0369a1" />
                <SkillBar label="Overall"          score={row.match_score} color="#f18200" />
              </div>
              <div className="bg-white rounded-[10px] border border-gray-200 p-3.5">
                <div className="text-[11px] font-bold text-gray-500 mb-2 uppercase">Skills</div>
                {matched.length > 0 && (
                  <div className="mb-2">
                    <div className="text-[11px] text-[#f18200] font-semibold mb-1">Matched</div>
                    <SkillPills skills={matched} matched />
                  </div>
                )}
                {missing.length > 0 && (
                  <div>
                    <div className="text-[11px] text-red-600 font-semibold mb-1">Missing</div>
                    <SkillPills skills={missing} matched={false} />
                  </div>
                )}
              </div>
            </div>
            <div className="text-[10px] text-gray-400 mt-2">
              Last computed: {row.computed_at ? new Date(row.computed_at).toLocaleString() : "—"}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── MAIN TAB ─────────────────────────────────────────────────────────────────
export default function ResumeMatchTab({ role }) {
  const [jobs, setJobs]               = useState([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [matches, setMatches]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [search, setSearch]           = useState("");

  useEffect(() => {
    listJobs({ limit: 200 }).then(r => setJobs(r?.data ?? [])).catch(() => {});
  }, []);

  const loadMatches = useCallback(async (jobId) => {
    if (!jobId) return;
    setLoading(true);
    try { setMatches(await listMatchesByJob(jobId) ?? []); }
    catch (err) { errorToast(getErrorMessage(err, "Failed to load matches")); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (selectedJob) loadMatches(selectedJob); else setMatches([]);
  }, [selectedJob, loadMatches]);

  async function handleRecompute(candidateId, jobReqId) {
    await computeResumeMatch(candidateId, jobReqId);
    loadMatches(selectedJob);
  }

  const filtered = matches.filter(m => {
    const q = search.toLowerCase();
    return !q || m.candidate_name?.toLowerCase().includes(q) || m.candidate_email?.toLowerCase().includes(q);
  });

  const jobOpts = [
    { value: "", label: "— Select a Job to Rank Candidates —" },
    ...jobs.map(j => ({ value: String(j.job_req_id), label: `${j.job_req_code || ""} — ${j.title}` })),
  ];

  const REC_STAT = [
    { label:"Highly Suitable", count:filtered.filter(m=>m.recommendation==="Highly Suitable").length, ...REC_CLS["Highly Suitable"] },
    { label:"Suitable",        count:filtered.filter(m=>m.recommendation==="Suitable").length,        ...REC_CLS["Suitable"] },
    { label:"Partial",         count:filtered.filter(m=>m.recommendation==="Partially Suitable").length, ...REC_CLS["Partially Suitable"] },
    { label:"Not Suitable",    count:filtered.filter(m=>m.recommendation==="Not Suitable").length,    ...REC_CLS["Not Suitable"] },
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={["Dashboard", "Resume Match"]}
        title="Resume Match"
        subtitle="Instantly check how well a candidate matches a job requirement"
      />

      <QuickMatchPanel jobs={jobs} />

      <div className="mb-3">
        <div className="text-[13px] font-bold text-gray-700 mb-2">📋 All Candidates Ranked by Job</div>
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex-1 max-w-[420px]">
            <Select value={selectedJob} onChange={e => setSelectedJob(e.target.value)} options={jobOpts} />
          </div>
          {selectedJob && (
            <>
              <SearchBar value={search} onChange={setSearch} placeholder="Search candidate…" />
              <Btn variant="secondary" icon={<RefreshCw size={13} />} onClick={() => loadMatches(selectedJob)} />
            </>
          )}
        </div>
      </div>

      {selectedJob && loading && (
        <div className="flex items-center gap-2.5 py-8 px-5 text-gray-500">
          <Loader2 size={18} /> Loading ranked candidates…
        </div>
      )}

      {selectedJob && !loading && (
        <>
          {filtered.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {REC_STAT.map(s => (
                <div key={s.label} className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${s.bg}`}>
                  <span className={`text-[14px] font-extrabold ${s.text}`}>{s.count}</span>
                  <span className={`text-[11px] font-semibold ${s.text}`}>{s.label}</span>
                </div>
              ))}
            </div>
          )}
          <Card className="!p-0">
            {filtered.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <div className="text-[14px] font-semibold text-gray-500">No scored candidates yet</div>
                <div className="text-[12px] mt-1">Scores auto-compute when candidates are added to this job</div>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    {["Rank","Candidate","Score","Result","Skills","Exp",""].map((h, i) => (
                      <th key={h} className={`px-3.5 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-[0.04em] ${i === 2 ? "text-center" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <MatchRow key={row.match_id} row={row} rank={i + 1} onRecompute={handleRecompute} />
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}

      {!selectedJob && matches.length === 0 && (
        <div className="text-center py-5 text-gray-400 text-[13px]">
          Select a job above to see all candidates ranked by match score.
        </div>
      )}
    </div>
  );
}
