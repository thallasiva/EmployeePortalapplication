import React, { useState, useEffect } from "react";
import { Bot, Send, Loader2, CheckCircle2 } from "lucide-react";
import { createAIInterview, listAIInterviews, listCandidates, listJobs, uploadResumeMatch } from "../../../api/recruitment.api";
import { apiErrorToast, successToast, errorToast } from "../../../utils/ToastControllers";
import { PRIMARY, LIGHT, BORDER } from "./shared";
import { Field } from "./Field";
import { Select } from "./Select";
import { Btn } from "./Btn";
import { ReportModal } from "./ReportModal";
function AIInterviewSetup() {
  const [tab, setTab] = useState("create"); // "create" | "list"
  // Form state
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({
    candidateId: "",
    jobReqId: "",
    durationMinutes: 20,
    questionCount: 8,
    interviewMode: "balanced",
    quickResponseTimeoutSeconds: 20
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  // List state
  const [sessions, setSessions] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [reportSessionId, setReportSessionId] = useState(null);
  useEffect(() => {
    listCandidates({
      limit: 500
    }).then(r => setCandidates(r?.data ?? [])).catch(() => {});
    listJobs({
      limit: 200
    }).then(r => setJobs(r?.data ?? [])).catch(() => {});
  }, []);
  useEffect(() => {
    if (tab === "list") loadSessions();
  }, [tab]);
  function loadSessions() {
    setLoadingList(true);
    listAIInterviews({
      limit: 50
    }).then(r => setSessions(r?.data ?? [])).catch(err => apiErrorToast(err, "load interview sessions")).finally(() => setLoadingList(false));
  }
  async function handleSend() {
    if (!form.candidateId || !form.jobReqId) {
      errorToast("Please select a candidate and a job");
      return;
    }
    setSending(true);
    try {
      await createAIInterview({
        candidateId: Number(form.candidateId),
        jobReqId: Number(form.jobReqId),
        durationMinutes: Number(form.durationMinutes),
        questionCount: Number(form.questionCount),
        interviewMode: form.interviewMode,
        quickResponseTimeoutSeconds: Number(form.quickResponseTimeoutSeconds)
      });
      successToast("AI interview invitation sent to candidate!");
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setResumeFile(null);
        setForm({
          candidateId: "",
          jobReqId: "",
          durationMinutes: 20,
          questionCount: 8,
          interviewMode: "balanced",
          quickResponseTimeoutSeconds: 20
        });
      }, 3000);
    } catch (e) {
      errorToast(e?.message || "Failed to send invitation");
    } finally {
      setSending(false);
    }
  }
  async function handleResumeUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !form.candidateId || !form.jobReqId) {
      errorToast("Select a candidate and job before uploading a resume");
      return;
    }
    setResumeUploading(true);
    try {
      await uploadResumeMatch(Number(form.jobReqId), file, Number(form.candidateId));
      setResumeFile(file);
      successToast("Resume uploaded and parsed. Interview questions will use it.");
    } catch (error) {
      errorToast(error?.message || "Resume upload failed");
    } finally {
      setResumeUploading(false);
    }
  }
  const STATUS_COLOR = {
    pending: "#d97706",
    completed: "#059669",
    expired: "#dc2626"
  };
  const REC_COLOR = {
    "Strong Hire": "#059669",
    Hire: "#e87500",
    Maybe: "#d97706",
    "No Hire": "#dc2626"
  };
  return <div style={{
    padding: "24px 28px",
    fontFamily: "var(--font-ui)"
  }}>
      {/* Header */}
      <div style={{
      display: "flex",
      alignItems: "center",
      gap: 14,
      marginBottom: 24
    }}>
        <div style={{
        background: LIGHT,
        borderRadius: 12,
        padding: 10
      }}>
          <Bot size={26} color={PRIMARY} />
        </div>
        <div>
          <h1 style={{
          margin: 0,
          fontSize: 22,
          fontWeight: 800,
          color: "#111827"
        }}>AI Interview</h1>
          <p style={{
          margin: 0,
          color: "#6b7280",
          fontSize: 13
        }}>
            Send AI-powered first-round screening to candidates — they answer at their own pace
          </p>
        </div>
      </div>
      {/* Tabs */}
      <div style={{
      display: "flex",
      gap: 4,
      marginBottom: 24,
      borderBottom: `2px solid ${BORDER}`
    }}>
        {[{
        key: "create",
        label: "Send Invitation"
      }, {
        key: "list",
        label: "Session History"
      }].map(t => <button key={t.key} onClick={() => setTab(t.key)} style={{
        padding: "9px 18px",
        border: "none",
        background: "none",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        color: tab === t.key ? PRIMARY : "#6b7280",
        borderBottom: tab === t.key ? `2px solid ${PRIMARY}` : "2px solid transparent",
        marginBottom: -2
      }}>{t.label}</button>)}
      </div>
      {/* ── CREATE TAB ──────────────────────────────────────────────────────── */}
      {tab === "create" && <div style={{
      maxWidth: 560
    }}>
          {sent ? <div style={{
        background: "#f0fdf4",
        border: "1px solid #bbf7d0",
        borderRadius: 12,
        padding: 28,
        textAlign: "center"
      }}>
              <CheckCircle2 size={40} color="#059669" style={{
          marginBottom: 10
        }} />
              <h3 style={{
          margin: "0 0 6px",
          color: "#166534"
        }}>Invitation Sent!</h3>
              <p style={{
          color: "#166534",
          fontSize: 14,
          margin: 0
        }}>
                The candidate has received an email with their unique interview link (valid for 48 hours).
              </p>
            </div> : <div style={{
        background: "#fff",
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        padding: 28
      }}>
              <h2 style={{
          margin: "0 0 20px",
          fontSize: 16,
          fontWeight: 700,
          color: "#111827"
        }}>
                Configure AI Interview
              </h2>
              <Field label="Candidate *">
                <Select value={form.candidateId} onChange={e => setForm(f => ({
            ...f,
            candidateId: e.target.value
          }))}>
                  <option value="">— Select candidate —</option>
                  {candidates.map(c => <option key={c.candidate_id} value={c.candidate_id}>
                      {c.candidate_name} · {c.email || ""}
                    </option>)}
                </Select>
              </Field>
              <Field label="Job Requisition *">
                <Select value={form.jobReqId} onChange={e => setForm(f => ({
            ...f,
            jobReqId: e.target.value
          }))}>
                  <option value="">— Select job —</option>
                  {jobs.map(j => <option key={j.job_req_id} value={j.job_req_id}>
                      {j.title}{j.company_dept ? ` · ${j.company_dept}` : ""}
                    </option>)}
                </Select>
              </Field>
              <Field label="Candidate Resume">
                <label style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "11px 12px",
            border: `1px dashed ${resumeFile ? PRIMARY : BORDER}`,
            borderRadius: 8,
            background: resumeFile ? LIGHT : "#f9fafb",
            cursor: resumeUploading ? "wait" : "pointer"
          }}>
                  <span style={{
              fontSize: 13,
              color: resumeFile ? PRIMARY : "#6b7280",
              fontWeight: 600
            }}>{resumeUploading ? "Uploading and parsing…" : resumeFile ? resumeFile.name : "Upload PDF or DOCX resume"}</span>
                  <span style={{
              fontSize: 12,
              color: PRIMARY,
              fontWeight: 700
            }}>Browse</span>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} disabled={resumeUploading || !form.candidateId || !form.jobReqId} style={{
              display: "none"
            }} />
                </label>
                <div style={{
            marginTop: 5,
            color: "#9ca3af",
            fontSize: 11
          }}>Questions will be tailored to the uploaded resume, skills, and projects.</div>
              </Field>
              {form.jobReqId && (() => {
          const selectedJob = jobs.find(job => String(job.job_req_id) === String(form.jobReqId));
          const skills = selectedJob?.skill_set || selectedJob?.required_skills || "";
          return <div style={{
            background: "#f9fafb",
            border: `1px solid ${BORDER}`,
            borderRadius: 8,
            padding: "10px 12px",
            marginBottom: 14,
            fontSize: 13
          }}>
                    <strong style={{
              color: "#374151"
            }}>Role requirements:</strong>
                    <div style={{
              color: "#6b7280",
              marginTop: 4
            }}>{skills || "No required skills listed on this requisition."}</div>
                  </div>;
        })()}
              <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12
        }}>
                <Field label="Question count">
                  <Select value={form.questionCount} onChange={e => setForm(f => ({
              ...f,
              questionCount: Number(e.target.value)
            }))}>
                    {[5, 8, 10, 12].map(n => <option key={n} value={n}>{n} questions</option>)}
                  </Select>
                </Field>
                <Field label="Interview duration (hard limit)">
                  <Select value={form.durationMinutes} onChange={e => setForm(f => ({
              ...f,
              durationMinutes: e.target.value
            }))}>
                    {[10, 20, 30, 45, 60].map(n => <option key={n} value={n}>{n} minutes</option>)}
                  </Select>
                </Field>
                <Field label="Interview style">
                  <Select value={form.interviewMode} onChange={e => setForm(f => ({
              ...f,
              interviewMode: e.target.value
            }))}>
                    <option value="screening">Screening — broad skills coverage</option>
                    <option value="balanced">Balanced — standard depth</option>
                    <option value="deep_dive">Deep dive — detailed follow-ups</option>
                  </Select>
                </Field>
                <Field label="No-answer auto-skip timeout">
                  <Select value={form.quickResponseTimeoutSeconds} onChange={e => setForm(f => ({
              ...f,
              quickResponseTimeoutSeconds: Number(e.target.value)
            }))}>
                    {[[20, "20 seconds — quick response"], [30, "30 seconds"], [45, "45 seconds"], [60, "60 seconds"], [90, "90 seconds — complex questions"], [120, "120 seconds — senior / deep dive"], [0, "Disabled — use full question timer"]].map(([seconds, label]) => <option key={seconds} value={seconds}>{label}</option>)}
                  </Select>
                  <div style={{
              marginTop: 5,
              color: "#6b7280",
              fontSize: 11
            }}>
                    Applies only while the candidate has not started an answer. The separate question timer still applies.
                  </div>
                </Field>
              </div>
              {/* Info box */}
              <div style={{
          background: LIGHT,
          border: `1px solid ${BORDER}`,
          borderRadius: 10,
          padding: 14,
          marginBottom: 20,
          fontSize: 13,
          color: "#374151"
        }}>
                <strong>How it works:</strong> the AI prepares a {form.questionCount}-question interview for the selected role.
                Questions are calibrated to the candidate&apos;s experience, and follow-ups adapt to each response.
                The candidate can speak or type answers; the recruiter receives the transcript and evaluation report.
              </div>
              <Btn loading={sending} onClick={handleSend}>
                {sending ? <Loader2 size={15} style={{
            animation: "spin 1s linear infinite"
          }} /> : <Send size={15} />}
                {sending ? "Sending…" : "Send AI Interview Invitation"}
              </Btn>
            </div>}
        </div>}
      {/* ── LIST TAB ────────────────────────────────────────────────────────── */}
      {tab === "list" && <div>
          <div style={{
        display: "flex",
        justifyContent: "flex-end",
        marginBottom: 16
      }}>
            <Btn variant="ghost" onClick={loadSessions} loading={loadingList}>
              {loadingList ? <Loader2 size={14} style={{
            animation: "spin 1s linear infinite"
          }} /> : "↺ Refresh"}
            </Btn>
          </div>
          {loadingList && sessions.length === 0 ? <div style={{
        textAlign: "center",
        padding: 40,
        color: "#6b7280"
      }}>
              <Loader2 size={28} style={{
          animation: "spin 1s linear infinite",
          color: PRIMARY
        }} />
            </div> : sessions.length === 0 ? <div style={{
        textAlign: "center",
        padding: 48,
        color: "#9ca3af",
        border: `1px dashed ${BORDER}`,
        borderRadius: 12
      }}>
              No AI interview sessions yet. Send your first invitation above.
            </div> : <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 10
      }}>
              {sessions.map(s => <div key={s.session_id} style={{
          background: "#fff",
          border: `1px solid ${BORDER}`,
          borderRadius: 12,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10
        }}>
                  <div>
                    <div style={{
              fontWeight: 700,
              fontSize: 15,
              color: "#111827"
            }}>{s.candidate_name}</div>
                    <div style={{
              fontSize: 13,
              color: "#6b7280",
              marginTop: 2
            }}>
                      {s.job_title} · Sent {new Date(s.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10
          }}>
                    {s.overall_score != null && <div style={{
              background: LIGHT,
              borderRadius: 8,
              padding: "4px 12px",
              fontSize: 14,
              fontWeight: 700,
              color: PRIMARY
            }}>{s.overall_score}/100</div>}
                    {s.recommendation && <span style={{
              background: "#f9fafb",
              borderRadius: 20,
              padding: "3px 10px",
              fontSize: 12,
              fontWeight: 700,
              color: REC_COLOR[s.recommendation] || "#374151"
            }}>{s.recommendation}</span>}
                    <span style={{
              background: s.status === "completed" ? "#dcfce7" : s.status === "expired" ? "#fee2e2" : "#fef9c3",
              color: STATUS_COLOR[s.status] || "#374151",
              borderRadius: 20,
              padding: "3px 10px",
              fontSize: 12,
              fontWeight: 600
            }}>{s.status}</span>
                    {s.status === "completed" && <Btn variant="ghost" onClick={() => setReportSessionId(s.session_id)} style={{
              padding: "5px 12px",
              fontSize: 13
            }}>
                        View Report
                      </Btn>}
                  </div>
                </div>)}
            </div>}
        </div>}
      {/* Report modal */}
      {reportSessionId && <ReportModal sessionId={reportSessionId} onClose={() => setReportSessionId(null)} />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>;
}
export { AIInterviewSetup };
