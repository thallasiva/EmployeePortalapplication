import React, { useState, useEffect } from "react";
import { Bot, Loader2, MessageCircle, X } from "lucide-react";
import { getAIInterviewReport } from "../../../api/recruitment.api";
import { apiErrorToast } from "../../../utils/ToastControllers";
import { PRIMARY, LIGHT, BORDER } from "./shared";
// ── Report Modal ──────────────────────────────────────────────────────────────
function ReportModal({
  sessionId,
  onClose
}) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getAIInterviewReport(sessionId).then(setReport).catch(err => apiErrorToast(err, "load interview report")).finally(() => setLoading(false));
  }, [sessionId]);
  const REC_COLOR = {
    "Strong Hire": "#059669",
    Hire: "#e87500",
    Maybe: "#d97706",
    "No Hire": "#dc2626"
  };
  return <div style={{
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
  }}>
      <div style={{
      background: "#fff",
      borderRadius: 16,
      width: "min(680px, 95vw)",
      maxHeight: "85vh",
      overflowY: "auto",
      padding: 32,
      position: "relative"
    }}>
        <button onClick={onClose} style={{
        position: "absolute",
        top: 16,
        right: 16,
        background: "none",
        border: "none",
        fontSize: 20,
        cursor: "pointer",
        color: "#6b7280"
      }} aria-label="Close"><X size={18} /></button>
        {loading ? <div style={{
        textAlign: "center",
        padding: 40
      }}>
            <Loader2 size={28} style={{
          animation: "spin 1s linear infinite",
          color: PRIMARY
        }} />
            <p style={{
          marginTop: 12,
          color: "#6b7280"
        }}>Loading report…</p>
          </div> : !report ? <p style={{
        color: "#6b7280"
      }}>Report not available.</p> : <>
            <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 24
        }}>
              <div style={{
            background: LIGHT,
            borderRadius: 10,
            padding: 10
          }}>
                <Bot size={22} color={PRIMARY} />
              </div>
              <div>
                <h2 style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700
            }}>AI Interview Report</h2>
                <p style={{
              margin: 0,
              color: "#6b7280",
              fontSize: 13
            }}>{report.candidate_name} · {report.job_title}</p>
              </div>
            </div>
            {/* Score + recommendation */}
            <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 20
        }}>
              <div style={{
            background: LIGHT,
            borderRadius: 10,
            padding: 16,
            textAlign: "center"
          }}>
                <div style={{
              fontSize: report.overall_score == null ? 16 : 40,
              fontWeight: 800,
              color: PRIMARY
            }}>{report.overall_score == null ? "Not scored" : report.overall_score}</div>
                <div style={{
              fontSize: 12,
              color: "#6b7280",
              fontWeight: 600
            }}>{report.overall_score == null ? "RECRUITER REVIEW REQUIRED" : "OVERALL SCORE / 100"}</div>
              </div>
              <div style={{
            background: "#f9fafb",
            borderRadius: 10,
            padding: 16,
            textAlign: "center"
          }}>
                <div style={{
              fontSize: 20,
              fontWeight: 700,
              color: REC_COLOR[report.recommendation] || "#374151"
            }}>{report.recommendation}</div>
                <div style={{
              fontSize: 12,
              color: "#6b7280",
              fontWeight: 600,
              marginTop: 4
            }}>RECOMMENDATION</div>
              </div>
            </div>
            {(report.evaluationMethod === "unavailable" || report.evaluationMethod === "response_length_fallback") && <div role="alert" style={{
          background: "#fffbeb",
          border: "1px solid #fcd34d",
          color: "#92400e",
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
          fontSize: 13
        }}>
                {report.evaluationNote || "AI evaluation was unavailable. Please review the interview answers manually; no reliable automated competence score is available."}
              </div>}
            {report.summary && <div style={{
          background: "#f9fafb",
          borderRadius: 10,
          padding: 14,
          marginBottom: 16,
          fontSize: 14,
          color: "#374151"
        }}>
                {report.summary}
              </div>}
            {/* Recommendation reason */}
            {report.recommendationReason && <div style={{
          background: "#fff7ed",
          border: "1px solid #fed7aa",
          borderRadius: 10,
          padding: 14,
          marginBottom: 16,
          fontSize: 13,
          color: "#9b4c00"
        }}>
                <strong>Why this recommendation:</strong> {report.recommendationReason}
              </div>}
            {/* Dimension scores */}
            {report.technicalSkills != null && <div style={{
          marginBottom: 20
        }}>
                <h3 style={{
            fontSize: 14,
            fontWeight: 700,
            margin: "0 0 10px"
          }}>Dimension Scores</h3>
                <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8
          }}>
                  {[["Technical Skills", report.technicalSkills], ["Practical Experience", report.practicalExperience], ["Problem Solving", report.problemSolving], ["Domain Knowledge", report.domainKnowledge], ["Communication", report.communication], ["Role Fit", report.roleFit]].map(([label, val]) => val != null && <div key={label} style={{
              background: "#f9fafb",
              borderRadius: 8,
              padding: "10px 12px"
            }}>
                      <div style={{
                fontSize: 11,
                color: "#6b7280",
                fontWeight: 600,
                marginBottom: 4
              }}>{label.toUpperCase()}</div>
                      <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8
              }}>
                        <div style={{
                  flex: 1,
                  height: 6,
                  background: "#e5e7eb",
                  borderRadius: 3,
                  overflow: "hidden"
                }}>
                          <div style={{
                    width: `${val}%`,
                    height: "100%",
                    background: val >= 70 ? "#059669" : val >= 45 ? "#d97706" : "#dc2626",
                    borderRadius: 3
                  }} />
                        </div>
                        <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#374151",
                  minWidth: 28
                }}>{val}</span>
                      </div>
                    </div>)}
                </div>
              </div>}
            {report.experienceAlignment != null && <div style={{
          background: LIGHT,
          borderRadius: 8,
          padding: "10px 12px",
          marginBottom: 16,
          fontSize: 13,
          color: "#374151"
        }}>
                <strong>Experience alignment:</strong> {report.experienceAlignment}/100
              </div>}
            {/* Q&A breakdown */}
            {report.questions && report.questions.length > 0 && <div>
                <h3 style={{
            fontSize: 15,
            fontWeight: 700,
            margin: "0 0 12px"
          }}>Interview Transcript</h3>
                {report.questions.map((q, i) => <div key={i} style={{
            border: `1px solid ${BORDER}`,
            borderRadius: 10,
            padding: 14,
            marginBottom: 10
          }}>
                    <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 6,
              gap: 8
            }}>
                      <div>
                        <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: PRIMARY
                }}>{q.skill ? `${q.skill} · ` : ""}Q{i + 1}</span>
                        <p style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#111827",
                  margin: "4px 0 0"
                }}>{q.question}</p>
                      </div>
                      {q.score != null && <span style={{
                background: q.score >= 7 ? "#dcfce7" : q.score >= 4 ? "#fef9c3" : "#fee2e2",
                color: q.score >= 7 ? "#166534" : q.score >= 4 ? "#854d0e" : "#991b1b",
                fontSize: 12,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 20,
                flexShrink: 0
              }}>{q.score}/10</span>}
                    </div>
                    {q.answer && <div style={{
              background: "#f9fafb",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 13,
              color: "#374151",
              lineHeight: 1.6,
              marginBottom: q.feedback ? 8 : 0
            }}>
                        {q.answer}
                      </div>}
                    {q.feedback && <p style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 6,
              fontSize: 12,
              color: "#6b7280",
              margin: "6px 0 0",
              fontStyle: "italic"
            }}><MessageCircle size={13} aria-hidden="true" />{q.feedback}</p>}
                  </div>)}
              </div>}
          </>}
      </div>
    </div>;
}
// ── Main Component ────────────────────────────────────────────────────────────
export { ReportModal };
