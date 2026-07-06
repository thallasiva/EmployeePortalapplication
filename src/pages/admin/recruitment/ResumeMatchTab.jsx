import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw, Loader2, ChevronDown, ChevronUp, Zap, Search as SearchIcon } from "lucide-react";
import { PageHeader, Card, Btn, Select, Field, Input, SearchBar } from "./shared";
import {
  listJobs, listMatchesByJob, computeResumeMatch,
  uploadResumeMatch, getErrorMessage,
} from "../../../api/recruitment.api";
import { errorToast } from "../../../utils/ToastControllers";

// ── Helpers ──────────────────────────────────────────────────────────────────
const REC_STYLE = {
  "Highly Suitable":    { bg: "#fff7ed", color: "#f18200", icon: "⭐" },
  "Suitable":           { bg: "#dbeafe", color: "#1e40af", icon: "🔵" },
  "Partially Suitable": { bg: "#fef3c7", color: "#92400e", icon: "🟡" },
  "Not Suitable":       { bg: "#fee2e2", color: "#991b1b", icon: "🔴" },
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
  const s = REC_STYLE[label] || { bg: "#f3f4f6", color: "#374151", icon: "⚪" };
  return (
    <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: s.bg, color: s.color }}>
      {s.icon} {label}
    </span>
  );
}

function SkillBar({ label, score, color }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{score}%</span>
      </div>
      <div style={{ height: 7, borderRadius: 4, background: "#f3f4f6" }}>
        <div style={{ width: `${score}%`, height: 7, borderRadius: 4, background: color, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

function SkillPills({ skills, matched }) {
  if (!skills?.length) return <span style={{ fontSize: 12, color: "#9ca3af" }}>None</span>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
      {skills.map(s => (
        <span key={s} style={{
          fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20,
          background: matched ? "#fff7ed" : "#fee2e2",
          color:      matched ? "#f18200" : "#991b1b",
        }}>
          {matched ? "✔" : "✖"} {s}
        </span>
      ))}
    </div>
  );
}

// ── QUICK MATCH PANEL (Upload Resume) ────────────────────────────────────────
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
    const ok = /\.(pdf|doc|docx)$/i.test(f.name);
    if (!ok) { errorToast("Only PDF or DOCX files are supported"); return; }
    setFile(f);
    setResult(null);
  }

  async function handleCheck() {
    if (!jobId || !file) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await uploadResumeMatch(Number(jobId), file);
      setResult(data);
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to parse resume"));
    } finally {
      setLoading(false);
    }
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
    <Card style={{ marginBottom: 20, padding: 0, overflow: "hidden", border: "2px solid #f18200" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", background: "linear-gradient(135deg,#fff7ed,#fff)", borderBottom: "1px solid #fed7aa" }}>
        <Zap size={18} color="#f18200" />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Resume Match Checker</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Upload a PDF or DOCX resume → system reads skills automatically → instant match score</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: result ? "1fr 1.2fr" : "1fr", gap: 0 }}>
        {/* Left: inputs */}
        <div style={{ padding: "18px 20px", borderRight: result ? "1px solid #e5e7eb" : "none" }}>
          <Field label="Job Requirement" required>
            <Select value={jobId} onChange={e => { setJobId(e.target.value); setResult(null); }} options={jobOpts} />
          </Field>

          {/* Drop zone */}
          <Field label="Upload Resume (PDF or DOCX)" required>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? "#f18200" : file ? "#f18200" : "#d1d5db"}`,
                borderRadius: 10, padding: "24px 16px", textAlign: "center",
                cursor: "pointer", background: dragging ? "#fff7ed" : file ? "#fff7ed" : "#fafafa",
                transition: "all 0.2s",
              }}
            >
              <input
                ref={fileRef} type="file" accept=".pdf,.doc,.docx"
                style={{ display: "none" }}
                onChange={e => handleFile(e.target.files[0])}
              />
              {file ? (
                <>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>📄</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f18200" }}>{file.name}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                    {(file.size / 1024).toFixed(0)} KB · Click to change
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>📂</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                    Drop resume here or click to browse
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>PDF or DOCX · Max 5 MB</div>
                </>
              )}
            </div>
          </Field>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Btn
              onClick={handleCheck}
              disabled={!jobId || !file || loading}
              icon={loading ? <Loader2 size={15} /> : <Zap size={15} />}
              style={{ flex: 1, background: "#f18200", color: "#fff", border: "none", justifyContent: "center" }}
            >
              {loading ? "Analysing Resume…" : "Analyse & Match"}
            </Btn>
            {(file || result) && (
              <Btn variant="secondary" onClick={handleReset}>Reset</Btn>
            )}
          </div>
        </div>

        {/* Right: result */}
        {result && (
          <div style={{ padding: "18px 20px", background: "#fafafa", overflowY: "auto" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 12 }}>
              Result — {result.jobTitle}
            </div>

            {/* Extracted candidate info */}
            {parsed && (parsed.name || parsed.email || parsed.phone) && (
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6, textTransform: "uppercase" }}>Extracted from Resume</div>
                {parsed.name  && <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>👤 {parsed.name}</div>}
                {parsed.email && <div style={{ fontSize: 12, color: "#6b7280" }}>✉ {parsed.email}</div>}
                {parsed.phone && <div style={{ fontSize: 12, color: "#6b7280" }}>📞 {parsed.phone}</div>}
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                  🗓 Experience detected: <strong>{result.parsed?.experience || 0} years</strong>
                </div>
                {parsed.skills?.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>Skills found in resume:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {parsed.skills.map(s => (
                        <span key={s} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#f3f4f6", color: "#374151", fontWeight: 500 }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Score */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14, padding: "12px 14px", background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb" }}>
              <ScoreCircle score={result.matchScore} size={68} />
              <div>
                <RecBadge label={rec} />
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>
                  Required: <strong>{result.jobExperienceLevel || "Not specified"}</strong>
                </div>
              </div>
            </div>

            {/* Bars */}
            <div style={{ marginBottom: 14 }}>
              <SkillBar label="Skills (60%)"      score={result.skillScore} color="#7c3aed" />
              <SkillBar label="Experience (40%)"  score={result.expScore}   color="#0369a1" />
            </div>

            {/* Skill pills */}
            {matched.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#f18200", marginBottom: 5 }}>✔ Matched ({matched.length})</div>
                <SkillPills skills={matched} matched={true} />
              </div>
            )}
            {missing.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", marginBottom: 5 }}>✖ Missing ({missing.length})</div>
                <SkillPills skills={missing} matched={false} />
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

// ── RANKED LIST ROW ───────────────────────────────────────────────────────────
function MatchRow({ row, onRecompute, rank }) {
  const [expanded, setExpanded]   = useState(false);
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
        style={{ cursor: "pointer", background: expanded ? "#f9fafb" : "#fff", borderBottom: "1px solid #f0f0f0" }}>
        <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "#9ca3af", width: 36 }}>#{rank}</td>
        <td style={{ padding: "12px 14px" }}>
          <div style={{ fontWeight: 600, color: "#111827" }}>{row.candidate_name}</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>{row.candidate_code} · {row.candidate_email}</div>
        </td>
        <td style={{ padding: "12px 14px", textAlign: "center" }}>
          <ScoreCircle score={row.match_score} size={52} />
        </td>
        <td style={{ padding: "12px 14px" }}>
          <RecBadge label={row.recommendation} />
        </td>
        <td style={{ padding: "12px 14px" }}>
          <div style={{ fontSize: 12 }}>
            <span style={{ color: "#f18200", fontWeight: 600 }}>✔ {matched.length}</span>
            <span style={{ color: "#9ca3af", margin: "0 4px" }}>·</span>
            <span style={{ color: "#dc2626", fontWeight: 600 }}>✖ {missing.length}</span>
          </div>
        </td>
        <td style={{ padding: "12px 14px", fontSize: 12, color: "#374151" }}>{row.relevant_experience} yrs</td>
        <td style={{ padding: "12px 14px" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={handleRecompute} disabled={recomputing}
              title="Recompute score"
              style={{ border: "none", background: "none", cursor: "pointer", color: "#7c3aed", fontWeight: 700, fontSize: 16 }}>
              {recomputing ? "…" : "↻"}
            </button>
            {expanded ? <ChevronUp size={14} color="#9ca3af" /> : <ChevronDown size={14} color="#9ca3af" />}
          </div>
        </td>
      </tr>

      {expanded && (
        <tr style={{ background: "#f9fafb" }}>
          <td colSpan={7} style={{ padding: "0 14px 16px 50px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, paddingTop: 12 }}>
              <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 10, textTransform: "uppercase" }}>Score Breakdown</div>
                <SkillBar label="Skills (60%)"      score={row.skill_score} color="#7c3aed" />
                <SkillBar label="Experience (40%)"  score={row.exp_score}   color="#0369a1" />
                <SkillBar label="Overall"           score={row.match_score} color="#f18200" />
              </div>
              <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 8, textTransform: "uppercase" }}>Skills</div>
                {matched.length > 0 && <div style={{ marginBottom: 8 }}><div style={{ fontSize: 11, color: "#f18200", fontWeight: 600, marginBottom: 4 }}>Matched</div><SkillPills skills={matched} matched /></div>}
                {missing.length > 0 && <div><div style={{ fontSize: 11, color: "#dc2626", fontWeight: 600, marginBottom: 4 }}>Missing</div><SkillPills skills={missing} matched={false} /></div>}
              </div>
            </div>
            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 8 }}>Last computed: {row.computed_at ? new Date(row.computed_at).toLocaleString() : "—"}</div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── MAIN TAB ──────────────────────────────────────────────────────────────────
export default function ResumeMatchTab({ role }) {
  const [jobs, setJobs]             = useState([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [matches, setMatches]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState("");

  useEffect(() => {
    listJobs({ limit: 200 }).then(r => setJobs(r?.data ?? [])).catch(() => {});
  }, []);

  const loadMatches = useCallback(async (jobId) => {
    if (!jobId) return;
    setLoading(true);
    try {
      const data = await listMatchesByJob(jobId);
      setMatches(data ?? []);
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to load matches"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedJob) loadMatches(selectedJob);
    else setMatches([]);
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

  const counts = {
    hs: filtered.filter(m => m.recommendation === "Highly Suitable").length,
    s:  filtered.filter(m => m.recommendation === "Suitable").length,
    ps: filtered.filter(m => m.recommendation === "Partially Suitable").length,
    ns: filtered.filter(m => m.recommendation === "Not Suitable").length,
  };

  return (
    <div>
      <PageHeader
        breadcrumbs={["Dashboard", "Resume Match"]}
        title="Resume Match"
        subtitle="Instantly check how well a candidate matches a job requirement"
      />

      {/* ── Quick Match Tool ── */}
      <QuickMatchPanel jobs={jobs} />

      {/* ── Ranked Candidates for a Job ── */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
          📋 All Candidates Ranked by Job
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, maxWidth: 420 }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "32px 20px", color: "#6b7280" }}>
          <Loader2 size={18} /> Loading ranked candidates…
        </div>
      )}

      {selectedJob && !loading && (
        <>
          {filtered.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              {[
                { label: "Highly Suitable", count: counts.hs, ...REC_STYLE["Highly Suitable"] },
                { label: "Suitable",        count: counts.s,  ...REC_STYLE["Suitable"] },
                { label: "Partial",         count: counts.ps, ...REC_STYLE["Partially Suitable"] },
                { label: "Not Suitable",    count: counts.ns, ...REC_STYLE["Not Suitable"] },
              ].map(s => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: s.bg }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: s.color }}>{s.count}</span>
                  <span style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</span>
                </div>
              ))}
            </div>
          )}

          <Card style={{ padding: 0 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#9ca3af" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#6b7280" }}>No scored candidates yet</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Scores auto-compute when candidates are added to this job</div>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                    {["Rank", "Candidate", "Score", "Result", "Skills", "Exp", ""].map(h => (
                      <th key={h} style={{
                        padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#6b7280",
                        textAlign: h === "Score" ? "center" : "left",
                        textTransform: "uppercase", letterSpacing: "0.04em",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <MatchRow
                      key={row.match_id}
                      row={row}
                      rank={i + 1}
                      onRecompute={handleRecompute}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}

      {!selectedJob && matches.length === 0 && (
        <div style={{ textAlign: "center", padding: "20px", color: "#9ca3af", fontSize: 13 }}>
          Select a job above to see all candidates ranked by match score.
        </div>
      )}
    </div>
  );
}
