import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, Clock, ArrowRight, Code2, ListChecks, MessageCircle, Mic, MicOff, Phone, Eye, EyeOff, WifiOff, Save, SkipForward } from "lucide-react";
import { saveAIInterviewDraft } from "../../../api/recruitment.api";
/* ─── Theme ──────────────────────────────────────────────────────────────── */
import { C, Recognition, formatTime, STAGE_LABELS, TYPE_TIME } from "./shared";
import { AiAvatar } from "./AiAvatar";
import { QuestionTimerBar } from "./QuestionTimerBar";
import { SkipRing } from "./SkipRing";
import { CandidateVideo } from "./CandidateVideo";
import { TabWarningModal } from "./TabWarningModal";
import { ProgressBar } from "./ProgressBar";
import { MCQOptions } from "./MCQOptions";
import { CodeEditor } from "./CodeEditor";
/* ─── Interview Room ─────────────────────────────────────────────────────── */
function InterviewRoom({
  token,
  question,
  sessionInfo,
  remaining,
  stream,
  onAnswer,
  onFinish,
  aiSpeaking,
  violations,
  maxViolations,
  tabWarning,
  onDismissWarning,
  offline
}) {
  const [textAnswer, setTextAnswer] = useState("");
  const [mcqAnswer, setMcqAnswer] = useState("");
  const [codeAnswer, setCodeAnswer] = useState("// Write your code here\n");
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [faceStatus, setFaceStatus] = useState({});
  const [draftSaved, setDraftSaved] = useState(false);
  const [qSecs, setQSecs] = useState(0); // per-question countdown
  const [quickSkipSecs, setQuickSkipSecs] = useState(0);
  const recognitionRef = useRef(null);
  const answerRef = useRef("");
  const mcqAnswerRef = useRef("");
  const codeAnswerRef = useRef(codeAnswer);
  const answerPresentRef = useRef(false);
  const draftTimer = useRef(null);
  const qTimer = useRef(null);
  const skippedRef = useRef(false);
  const qTimeTotalRef = useRef(0);
  const qType = question?.type?.toUpperCase() || "TEXT";
  const isMCQ = qType === "MCQ" || Array.isArray(question?.options) && question.options.length;
  const isCode = qType === "CODING" || qType === "CODE";
  const qNum = question?.questionNumber || 1;
  const qTotal = sessionInfo?.totalQuestions || null;
  const qId = String(question?.id || question?.questionNumber || qNum);
  const quickSkipTotal = Number(sessionInfo?.quickResponseTimeoutSeconds ?? 20);
  const hasAnswer = isMCQ ? Boolean(mcqAnswer) : isCode ? Boolean(codeAnswer.trim() && codeAnswer.trim() !== "// Write your code here") : Boolean(textAnswer.trim());
  answerPresentRef.current = hasAnswer;
  mcqAnswerRef.current = mcqAnswer;
  codeAnswerRef.current = codeAnswer;
  // Per-question time limit: use question.timeLimit if set, else type default
  const getQTime = () => {
    if (question?.timeLimit && Number(question.timeLimit) > 0) return Number(question.timeLimit);
    if (isCode) return question?.problemSize === "large" ? 1200 : TYPE_TIME.CODING;
    if (qType === "SCENARIO" || question?.stage === "scenario") return TYPE_TIME.SCENARIO;
    if (qType === "SYSTEM_DESIGN" || question?.stage === "system_design") return TYPE_TIME.SYSTEM_DESIGN;
    if (isMCQ) return TYPE_TIME.MCQ;
    return TYPE_TIME.TEXT;
  };
  // ── Reset + start countdown on each new question ────────────────────────
  useEffect(() => {
    const savedDraft = question?.draft || "";
    setTextAnswer(isCode || isMCQ ? "" : savedDraft);
    setMcqAnswer(isMCQ ? savedDraft : "");
    setCodeAnswer(isCode ? savedDraft || "// Write your code here\n" : "// Write your code here\n");
    setInterim("");
    setDraftSaved(false);
    skippedRef.current = false;
    answerRef.current = isCode || isMCQ ? "" : savedDraft;
    setQuickSkipSecs(quickSkipTotal);
    const limit = getQTime();
    qTimeTotalRef.current = limit;
    setQSecs(limit);
    clearInterval(qTimer.current);
    qTimer.current = setInterval(() => {
      setQSecs(s => {
        if (s <= 1) {
          clearInterval(qTimer.current);
          if (!skippedRef.current) {
            skippedRef.current = true;
            // for coding: submit whatever they wrote; others: mark skipped
            const ans = answerPresentRef.current ? isMCQ ? mcqAnswerRef.current : isCode ? codeAnswerRef.current : answerRef.current : "(skipped — question time expired)";
            onAnswer(ans, qId);
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(qTimer.current);
  }, [qId, quickSkipTotal]); // eslint-disable-line
  // Keep a ref of codeAnswer for use inside the timer callback
  useEffect(() => {
    codeAnswerRef.current = codeAnswer;
  }, [codeAnswer]);
  useEffect(() => {
    answerRef.current = textAnswer;
  }, [textAnswer]);
  useEffect(() => {
    if (quickSkipTotal <= 0 || aiSpeaking || quickSkipSecs <= 0) return undefined;
    const timer = setInterval(() => {
      if (answerPresentRef.current) return;
      setQuickSkipSecs(seconds => {
        if (seconds <= 1) {
          clearInterval(timer);
          if (!skippedRef.current) {
            skippedRef.current = true;
            stopListening();
            onAnswer("(auto-skipped — no response)", qId);
          }
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [qId, quickSkipTotal, aiSpeaking, quickSkipSecs === 0]); // eslint-disable-line
  function scheduleDraft(val) {
    clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(async () => {
      try {
        await saveAIInterviewDraft(token, qId, val);
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
      } catch (_) {}
    }, 2000);
  }
  function getAnswer() {
    if (isMCQ) return mcqAnswer;
    if (isCode) return codeAnswer;
    return textAnswer;
  }
  function canSubmit() {
    return hasAnswer;
  }
  function handleSubmit() {
    if (!canSubmit()) return;
    stopListening();
    skippedRef.current = true;
    clearInterval(qTimer.current);
    onAnswer(getAnswer(), qId);
  }
  function handleManualSkip() {
    skippedRef.current = true;
    clearInterval(qTimer.current);
    stopListening();
    onAnswer("(skipped by candidate)", qId);
  }
  function startListening() {
    if (!Recognition || listening) return;
    window.speechSynthesis?.cancel();
    const rec = new Recognition();
    rec.lang = "en-IN";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = ev => {
      let fin = "",
        int = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) fin += ` ${t}`;else int += ` ${t}`;
      }
      if (fin.trim()) {
        answerRef.current = `${answerRef.current} ${fin}`.trim();
        setTextAnswer(answerRef.current);
        scheduleDraft(answerRef.current);
      }
      setInterim(int.trim());
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => {
      setListening(false);
      setInterim("");
    };
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }
  function stopListening() {
    try {
      recognitionRef.current?.stop();
    } catch (_) {}
    recognitionRef.current = null;
    setListening(false);
    setInterim("");
  }
  const timeColor = remaining < 60 ? C.danger : remaining < 180 ? C.warn : C.muted;
  return <>
      {tabWarning && <TabWarningModal count={violations} maxWarnings={maxViolations} onDismiss={onDismissWarning} />}
      <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: C.bg,
      fontFamily: "'Inter',sans-serif",
      color: C.text,
      overflow: "hidden"
    }}>
        {/* ── Top banner ── */}
        <div className="slide-down" style={{
        background: C.card,
        borderBottom: `1px solid ${C.border}`,
        padding: "14px 24px",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        minHeight: 64
      }}>
          <div style={{
          background: `${C.accent}22`,
          border: `1px solid ${C.accent}44`,
          borderRadius: 8,
          padding: "4px 10px",
          fontSize: 12,
          fontWeight: 800,
          color: C.accent,
          flexShrink: 0,
          marginTop: 2
        }}>
            {isCode ? <><Code2 size={13} aria-hidden="true" /> CODE</> : isMCQ ? <><ListChecks size={13} aria-hidden="true" /> MCQ</> : <><MessageCircle size={13} aria-hidden="true" /> Q</>}{qNum}
          </div>
          <div style={{
          flex: 1,
          minWidth: 0
        }}>
            <div style={{
            fontSize: 11,
            color: C.accent,
            fontWeight: 700,
            letterSpacing: .5,
            marginBottom: 4
          }}>
              {STAGE_LABELS[question?.stage] || "Interview question"}
            </div>
            <p style={{
            margin: 0,
            fontSize: 15,
            lineHeight: 1.55,
            color: aiSpeaking ? C.muted : C.text,
            fontStyle: aiSpeaking ? "italic" : "normal"
          }}>
              {aiSpeaking ? "Avya is speaking…" : question?.question}
            </p>
          </div>
          <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "flex-end",
          flexShrink: 0
        }}>
            <ProgressBar current={qNum} total={qTotal} />
            {offline && <div style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 10,
            color: C.danger,
            fontWeight: 700
          }}><WifiOff size={10} />Offline</div>}
          </div>
        </div>
        {/* ── Main split ── */}
        <div style={{
        flex: 1,
        display: "flex",
        overflow: "hidden"
      }}>
          {/* AI panel */}
          <div style={{
          flex: "0 0 42%",
          background: C.panel,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          borderRight: `1px solid ${C.border}`
        }}>
            <AiAvatar size={110} speaking={aiSpeaking} />
            {aiSpeaking && <p style={{
            color: C.muted,
            fontSize: 13,
            marginTop: 14
          }}>Speaking…</p>}
            <div style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            background: "rgba(0,0,0,.55)",
            borderRadius: 6,
            padding: "4px 10px",
            fontSize: 13,
            fontWeight: 600
          }}>Avya · AI Interviewer</div>
            {violations > 0 && <div style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: `${C.warn}22`,
            border: `1px solid ${C.warn}`,
            borderRadius: 8,
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 700,
            color: C.warn
          }}>
                <AlertTriangle size={12} aria-hidden="true" /> {violations}/{maxViolations} tab switch{violations > 1 ? "es" : ""}
              </div>}
            {(faceStatus.noFace || faceStatus.camBlocked) && !aiSpeaking && <div style={{
            position: "absolute",
            top: violations > 0 ? 50 : 12,
            right: 12,
            background: `${C.danger}22`,
            border: `1px solid ${C.danger}`,
            borderRadius: 8,
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 700,
            color: C.danger,
            display: "flex",
            gap: 4,
            alignItems: "center"
          }}>
                <EyeOff size={11} />{faceStatus.camBlocked ? "Cam blocked" : "Face not detected"}
              </div>}
          </div>
          {/* Candidate side */}
          <div style={{
          flex: "0 0 58%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
            {/* Webcam */}
            <div style={{
            flex: "0 0 42%",
            position: "relative"
          }}>
              <CandidateVideo stream={stream} name={sessionInfo?.candidateName} onFaceStatus={setFaceStatus} />
            </div>
            {/* Answer area */}
            <div style={{
            flex: 1,
            background: C.card,
            borderTop: `1px solid ${C.border}`,
            padding: "10px 14px",
            overflow: "auto"
          }}>
              {!isCode && <QuestionTimerBar seconds={qSecs} total={qTimeTotalRef.current || TYPE_TIME.TEXT} label="Maximum time for this question" />}
              {isCode ? <>
                  <QuestionTimerBar seconds={qSecs} total={qTimeTotalRef.current || TYPE_TIME.CODING} label={question?.problemSize === "large" ? "Large coding time limit" : "Coding time limit"} />
                  <CodeEditor value={codeAnswer} onChange={v => {
                setCodeAnswer(v);
                scheduleDraft(v);
              }} language={question?.language || "javascript"} />
                </> : isMCQ ? <>
                  <MCQOptions options={question.options} selected={mcqAnswer} onChange={v => {
                setMcqAnswer(v);
                scheduleDraft(v);
              }} />
                </> : <div>
                  <textarea value={textAnswer + (interim ? ` ${interim}` : "")} onChange={e => {
                answerRef.current = e.target.value;
                setTextAnswer(e.target.value);
                scheduleDraft(e.target.value);
              }} placeholder="Speak or type your answer…" rows={5} style={{
                width: "100%",
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: "10px 14px",
                color: C.text,
                fontSize: 14,
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
                lineHeight: 1.6
              }} />
                  <div style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 8
              }}>
                    <button onClick={listening ? stopListening : startListening} style={{
                  background: listening ? C.danger : C.accent,
                  border: "none",
                  borderRadius: "50%",
                  width: 38,
                  height: 38,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                      {listening ? <MicOff size={16} color="#fff" /> : <Mic size={16} color="#fff" />}
                    </button>
                    {listening && <span style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  color: C.accent,
                  fontSize: 12,
                  fontWeight: 600
                }}><Mic size={12} aria-hidden="true" />Listening…</span>}
                    {draftSaved && <span style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  color: C.success,
                  fontWeight: 600
                }}><Save size={10} />Saved</span>}
                  </div>
                </div>}
            </div>
          </div>
        </div>
        {/* ── Bottom bar ── */}
        <div style={{
        background: C.panel,
        borderTop: `1px solid ${C.border}`,
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap"
      }}>
          {/* Session timer */}
          <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
            <Clock size={15} color={timeColor} />
            <span style={{
            fontWeight: 700,
            color: timeColor,
            fontVariantNumeric: "tabular-nums",
            fontSize: 16
          }}>{formatTime(remaining)}</span>
            <span style={{
            color: C.border
          }}>|</span>
            <span style={{
            color: C.muted,
            fontSize: 13
          }}>{sessionInfo?.jobTitle || "AI Interview"}</span>
          </div>
          {/* Skip ring (MCQ / text only) + Submit */}
          <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12
        }}>
            {!canSubmit() && quickSkipTotal > 0 && quickSkipSecs > 0 && <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6
          }}>
                <SkipRing seconds={quickSkipSecs} total={quickSkipTotal} onSkip={handleManualSkip} />
                <div style={{
              fontSize: 11,
              color: quickSkipSecs <= 5 ? C.danger : C.muted
            }}>
                  {quickSkipSecs <= 5 ? `No answer detected. Auto-skip in ${quickSkipSecs}s.` : `Auto-skip if unanswered in ${quickSkipSecs}s.`}
                </div>
              </div>}
            <button onClick={handleSubmit} disabled={!canSubmit()} className="btn-primary" style={{
            padding: "10px 28px",
            fontSize: 14
          }}>
              {isCode ? "Submit Code" : "Save & Next"} <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
          {/* Right controls */}
          <div style={{
          display: "flex",
          gap: 8,
          alignItems: "center"
        }}>
            <button className="btn-ghost" style={{
            borderColor: faceStatus.noFace ? C.warn : "",
            color: faceStatus.noFace ? C.warn : ""
          }}>
              {faceStatus.noFace ? <EyeOff size={14} /> : <Eye size={14} />}
              {faceStatus.camBlocked ? "Cam blocked" : faceStatus.noFace ? "Face not found" : faceStatus.detected ? "Face detected" : faceStatus.detectionUnavailable ? "Face check unavailable" : "Checking camera"}
            </button>
            <button className="btn-ghost" onClick={handleManualSkip} title="Skip this question">
              <SkipForward size={14} />Skip
            </button>
            <button onClick={onFinish} style={{
            background: C.danger,
            border: "none",
            borderRadius: 8,
            padding: "8px 14px",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 600
          }}>
              <Phone size={14} style={{
              transform: "rotate(135deg)"
            }} />End
            </button>
          </div>
        </div>
      </div>
    </>;
}
/* ─── Join screen ────────────────────────────────────────────────────────── */
export { InterviewRoom };
