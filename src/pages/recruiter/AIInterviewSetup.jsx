import React, { useState, useEffect } from "react";
import {
  Bot, Send, Loader2, CheckCircle2, AlertCircle,
  ChevronDown, User, Briefcase, Star
} from "lucide-react";
import { createAIInterview, listAIInterviews, getAIInterviewReport, listCandidates, listJobs } from "../../api/recruitment.api";
import { apiErrorToast, successToast, errorToast } from "../../utils/ToastControllers";

const PRIMARY = "#0E7C86";
const LIGHT   = "#f0fbfc";
const BORDER  = "#d1e8ea";

// ── small helpers ─────────────────────────────────────────────────────────────
function Label({ children }) {
  return <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>{children}</label>;
}
function Field({ label, children }) {
  return <div style={{ marginBottom: 16 }}><Label>{label}</Label>{children}</div>;
}
function Input({ ...props }) {
  return (
    <input
      {...props}
      style={{
        width: "100%", boxSizing: "border-box", padding: "9px 12px",
        border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 14,
        outline: "none", background: "#fff",
        ...(props.style || {})
      }}
    />
  );
}
function Select({ children, ...props }) {
  return (
    <select
      {...props}
      style={{
        width: "100%", boxSizing: "border-box", padding: "9px 12px",
        border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 14,
        background: "#fff", outline: "none", appearance: "none",
        ...(props.style || {})
      }}
    >
      {children}
    </select>
  );
}
function Btn({ children, loading, variant = "primary", ...props }) {
  const base = {
    padding: "9px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600,
    cursor: loading ? "not-allowed" : "pointer", border: "none",
    display: "inline-flex", alignItems: "center", gap: 6, opacity: loading ? 0.7 : 1,
  };
  const styles = {
    primary: { background: PRIMARY, color: "#fff" },
    ghost:   { background: "#f3f4f6", color: "#374151" },
  };
  return <button style={{ ...base, ...styles[variant] }} disabled={loading} {...props}>{children}</button>;
}

// ── Report Modal ──────────────────────────────────────────────────────────────
function ReportModal({ sessionId, onClose }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAIInterviewReport(sessionId)
      .then(setReport)
      .catch(err => apiErrorToast(err, "load interview report"))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const REC_COLOR = {
    "Strong Hire": "#059669", Hire: "#2563eb",
    Maybe: "#d97706", "No Hire": "#dc2626",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "min(680px, 95vw)",
        maxHeight: "85vh", overflowY: "auto", padding: 32, position: "relative"
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16, background: "none",
          border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280"
        }}>✕</button>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: PRIMARY }} />
            <p style={{ marginTop: 12, color: "#6b7280" }}>Loading report…</p>
          </div>
        ) : !report ? (
          <p style={{ color: "#6b7280" }}>Report not available.</p>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ background: LIGHT, borderRadius: 10, padding: 10 }}>
                <Bot size={22} color={PRIMARY} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>AI Interview Report</h2>
                <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>{report.candidate_name} · {report.job_title}</p>
              </div>
            </div>

            {/* Score + recommendation */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20
            }}>
              <div style={{ background: LIGHT, borderRadius: 10, padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 40, fontWeight: 800, color: PRIMARY }}>{report.overall_score}</div>
                <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>OVERALL SCORE / 100</div>
              </div>
              <div style={{ background: "#f9fafb", borderRadius: 10, padding: 16, textAlign: "center" }}>
                <div style={{
                  fontSize: 20, fontWeight: 700,
                  color: REC_COLOR[report.recommendation] || "#374151"
                }}>{report.recommendation}</div>
                <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, marginTop: 4 }}>RECOMMENDATION</div>
              </div>
            </div>

            {report.summary && (
              <div style={{ background: "#f9fafb", borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 14, color: "#374151" }}>
                {report.summary}
              </div>
            )}

            {/* Recommendation reason */}
            {report.recommendationReason && (
              <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:10, padding:14, marginBottom:16, fontSize:13, color:"#1e40af" }}>
                <strong>Why this recommendation:</strong> {report.recommendationReason}
              </div>
            )}

            {/* Dimension scores */}
            {(report.technicalSkills != null) && (
              <div style={{ marginBottom:20 }}>
                <h3 style={{ fontSize:14, fontWeight:700, margin:"0 0 10px" }}>Dimension Scores</h3>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {[
                    ["Technical Skills", report.technicalSkills],
                    ["Practical Experience", report.practicalExperience],
                    ["Problem Solving", report.problemSolving],
                    ["Domain Knowledge", report.domainKnowledge],
                    ["Communication", report.communication],
                    ["Role Fit", report.roleFit],
                  ].map(([label, val]) => val != null && (
                    <div key={label} style={{ background:"#f9fafb", borderRadius:8, padding:"10px 12px" }}>
                      <div style={{ fontSize:11, color:"#6b7280", fontWeight:600, marginBottom:4 }}>{label.toUpperCase()}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ flex:1, height:6, background:"#e5e7eb", borderRadius:3, overflow:"hidden" }}>
                          <div style={{ width:`${val}%`, height:"100%", background: val>=70?"#059669":val>=45?"#d97706":"#dc2626", borderRadius:3 }} />
                        </div>
                        <span style={{ fontSize:12, fontWeight:700, color:"#374151", minWidth:28 }}>{val}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Q&A breakdown */}
            {report.questions && report.questions.length > 0 && (
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Interview Transcript</h3>
                {report.questions.map((q, i) => (
                  <div key={i} style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14, marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems:"flex-start", marginBottom: 6, gap:8 }}>
                      <div>
                        <span style={{ fontSize:11, fontWeight:700, color:PRIMARY }}>{q.skill ? `${q.skill} · ` : ""}Q{i+1}</span>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin:"4px 0 0" }}>{q.question}</p>
                      </div>
                      {q.score != null && (
                        <span style={{
                          background: q.score >= 7 ? "#dcfce7" : q.score >= 4 ? "#fef9c3" : "#fee2e2",
                          color: q.score >= 7 ? "#166534" : q.score >= 4 ? "#854d0e" : "#991b1b",
                          fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 20, flexShrink:0
                        }}>{q.score}/10</span>
                      )}
                    </div>
                    {q.answer && (
                      <div style={{ background:"#f9fafb", borderRadius:8, padding:"10px 12px", fontSize:13, color:"#374151", lineHeight:1.6, marginBottom: q.feedback ? 8 : 0 }}>
                        {q.answer}
                      </div>
                    )}
                    {q.feedback && <p style={{ fontSize: 12, color: "#6b7280", margin: "6px 0 0", fontStyle:"italic" }}>💬 {q.feedback}</p>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AIInterviewSetup() {
  const [tab, setTab] = useState("create"); // "create" | "list"

  // Form state
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs]             = useState([]);
  const [form, setForm] = useState({
    candidateId: "", jobReqId: "", durationMinutes: 30,
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);

  // List state
  const [sessions, setSessions]         = useState([]);
  const [loadingList, setLoadingList]   = useState(false);
  const [reportSessionId, setReportSessionId] = useState(null);

  useEffect(() => {
    listCandidates({ limit: 500 }).then(r => setCandidates(r?.data ?? [])).catch(() => {});
    listJobs({ limit: 200 }).then(r => setJobs(r?.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === "list") loadSessions();
  }, [tab]);

  function loadSessions() {
    setLoadingList(true);
    listAIInterviews({ limit: 50 })
      .then(r => setSessions(r?.data ?? []))
      .catch(err => apiErrorToast(err, "load interview sessions"))
      .finally(() => setLoadingList(false));
  }

  async function handleSend() {
    if (!form.candidateId || !form.jobReqId) {
      errorToast("Please select a candidate and a job"); return;
    }
    setSending(true);
    try {
      await createAIInterview({
        candidateId:     Number(form.candidateId),
        jobReqId:        Number(form.jobReqId),
        durationMinutes: Number(form.durationMinutes),
      });
      successToast("AI interview invitation sent to candidate!");
      setSent(true);
      setTimeout(() => { setSent(false); setForm({ candidateId: "", jobReqId: "", durationMinutes: 30 }); }, 3000);
    } catch (e) {
      errorToast(e?.message || "Failed to send invitation");
    } finally {
      setSending(false);
    }
  }

  const STATUS_COLOR = { pending: "#d97706", completed: "#059669", expired: "#dc2626" };
  const REC_COLOR    = { "Strong Hire": "#059669", Hire: "#2563eb", Maybe: "#d97706", "No Hire": "#dc2626" };

  return (
    <div style={{ padding: "24px 28px", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div style={{ background: LIGHT, borderRadius: 12, padding: 10 }}>
          <Bot size={26} color={PRIMARY} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" }}>AI Interview</h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>
            Send AI-powered first-round screening to candidates — they answer at their own pace
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `2px solid ${BORDER}` }}>
        {[{ key: "create", label: "Send Invitation" }, { key: "list", label: "Session History" }].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "9px 18px", border: "none", background: "none", fontSize: 14,
              fontWeight: 600, cursor: "pointer",
              color: tab === t.key ? PRIMARY : "#6b7280",
              borderBottom: tab === t.key ? `2px solid ${PRIMARY}` : "2px solid transparent",
              marginBottom: -2
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── CREATE TAB ──────────────────────────────────────────────────────── */}
      {tab === "create" && (
        <div style={{ maxWidth: 560 }}>
          {sent ? (
            <div style={{
              background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12,
              padding: 28, textAlign: "center"
            }}>
              <CheckCircle2 size={40} color="#059669" style={{ marginBottom: 10 }} />
              <h3 style={{ margin: "0 0 6px", color: "#166534" }}>Invitation Sent!</h3>
              <p style={{ color: "#166534", fontSize: 14, margin: 0 }}>
                The candidate has received an email with their unique interview link (valid for 48 hours).
              </p>
            </div>
          ) : (
            <div style={{
              background: "#fff", border: `1px solid ${BORDER}`,
              borderRadius: 14, padding: 28
            }}>
              <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#111827" }}>
                Configure AI Interview
              </h2>

              <Field label="Candidate *">
                <Select
                  value={form.candidateId}
                  onChange={e => setForm(f => ({ ...f, candidateId: e.target.value }))}
                >
                  <option value="">— Select candidate —</option>
                  {candidates.map(c => (
                    <option key={c.candidate_id} value={c.candidate_id}>
                      {c.candidate_name} · {c.email || ""}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Job Requisition *">
                <Select
                  value={form.jobReqId}
                  onChange={e => setForm(f => ({ ...f, jobReqId: e.target.value }))}
                >
                  <option value="">— Select job —</option>
                  {jobs.map(j => (
                    <option key={j.job_req_id} value={j.job_req_id}>
                      {j.job_title} · {j.department_name || ""}
                    </option>
                  ))}
                </Select>
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                <Field label="Interview duration (hard limit)">
                  <Select
                    value={form.durationMinutes}
                    onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))}
                  >
                    {[15, 30, 45, 60].map(n => (
                      <option key={n} value={n}>{n} minutes</option>
                    ))}
                  </Select>
                </Field>
              </div>

              {/* Info box */}
              <div style={{
                background: LIGHT, border: `1px solid ${BORDER}`,
                borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 13, color: "#374151"
              }}>
                <strong>How it works:</strong> the AI selects one role-specific question at a time,
                evaluates each answer, and chooses the next follow-up, skill, and difficulty dynamically.
                The server enforces the selected duration and the recruiter receives a full evidence-based report.
              </div>

              <Btn loading={sending} onClick={handleSend}>
                {sending ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={15} />}
                {sending ? "Sending…" : "Send AI Interview Invitation"}
              </Btn>
            </div>
          )}
        </div>
      )}

      {/* ── LIST TAB ────────────────────────────────────────────────────────── */}
      {tab === "list" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <Btn variant="ghost" onClick={loadSessions} loading={loadingList}>
              {loadingList ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : "↺ Refresh"}
            </Btn>
          </div>

          {loadingList && sessions.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
              <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: PRIMARY }} />
            </div>
          ) : sessions.length === 0 ? (
            <div style={{
              textAlign: "center", padding: 48, color: "#9ca3af",
              border: `1px dashed ${BORDER}`, borderRadius: 12
            }}>
              No AI interview sessions yet. Send your first invitation above.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sessions.map(s => (
                <div key={s.session_id} style={{
                  background: "#fff", border: `1px solid ${BORDER}`,
                  borderRadius: 12, padding: "16px 20px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  flexWrap: "wrap", gap: 10
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>{s.candidate_name}</div>
                    <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                      {s.job_title} · Sent {new Date(s.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {s.overall_score != null && (
                      <div style={{
                        background: LIGHT, borderRadius: 8, padding: "4px 12px",
                        fontSize: 14, fontWeight: 700, color: PRIMARY
                      }}>{s.overall_score}/100</div>
                    )}
                    {s.recommendation && (
                      <span style={{
                        background: "#f9fafb", borderRadius: 20, padding: "3px 10px",
                        fontSize: 12, fontWeight: 700,
                        color: REC_COLOR[s.recommendation] || "#374151"
                      }}>{s.recommendation}</span>
                    )}
                    <span style={{
                      background: s.status === "completed" ? "#dcfce7" : s.status === "expired" ? "#fee2e2" : "#fef9c3",
                      color: STATUS_COLOR[s.status] || "#374151",
                      borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600
                    }}>{s.status}</span>
                    {s.status === "completed" && (
                      <Btn variant="ghost" onClick={() => setReportSessionId(s.session_id)}
                        style={{ padding: "5px 12px", fontSize: 13 }}>
                        View Report
                      </Btn>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Report modal */}
      {reportSessionId && (
        <ReportModal sessionId={reportSessionId} onClose={() => setReportSessionId(null)} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
