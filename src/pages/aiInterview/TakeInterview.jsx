import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  AlertCircle, AlertTriangle, CheckCircle2, Clock,
  ArrowRight, Building2, Bot, Code2, ListChecks, MessageCircle,
  Loader2, Mic, MicOff, Phone, VideoOff, Eye, EyeOff, WifiOff, Save, SkipForward, Timer,
} from "lucide-react";
import {
  answerAIInterview, completeAIInterview,
  getAIInterviewSession, sendAIInterviewOtp, verifyAIInterviewOtp, startAIInterview,
  logAIInterviewProctoring, saveAIInterviewDraft,
} from "../../api/recruitment.api";
/* ─── Theme ──────────────────────────────────────────────────────────────── */
const C = {
  bg:"#0d0f1a", card:"#161929", panel:"#111422", border:"#252840",
  accent:"#6c63ff", teal:"#0E7C86", danger:"#ef4444",
  warn:"#f59e0b", success:"#22c55e", text:"#f1f5f9", muted:"#8892a4",
};
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const formatTime  = s => `${String(Math.floor(Math.max(s,0)/60)).padStart(2,"0")}:${String(Math.max(s,0)%60).padStart(2,"0")}`;
// Default time limits per question type (seconds). Backend question.timeLimit overrides.
const TYPE_TIME = { MCQ: 120, TEXT: 120, SCENARIO: 300, SYSTEM_DESIGN: 900, CODING: 600, CODE: 600, DEFAULT: 120 };
function speak(text, onEnd) {
  if (!window.speechSynthesis || !text) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-IN"; u.rate = 0.92;
  u.onend = onEnd; u.onerror = onEnd;
  window.speechSynthesis.speak(u);
}
/* ─── Global CSS ─────────────────────────────────────────────────────────── */
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap');
*{box-sizing:border-box;}
@keyframes spin     { to{transform:rotate(360deg);} }
@keyframes ripple   { 0%{transform:scale(.8);opacity:.7;} 100%{transform:scale(2.4);opacity:0;} }
@keyframes pulse    { 0%,100%{transform:scale(1);opacity:.8;} 50%{transform:scale(1.12);opacity:1;} }
@keyframes recBlink { 0%,100%{opacity:1;} 50%{opacity:0;} }
@keyframes fadeIn   { from{opacity:0;transform:translateY(10px);} to{opacity:1;transform:none;} }
@keyframes slideDown{ from{opacity:0;transform:translateY(-12px);} to{opacity:1;transform:none;} }
@keyframes shake    { 0%,100%{transform:translateX(0);} 20%,60%{transform:translateX(-6px);} 40%,80%{transform:translateX(6px);} }
@keyframes timePulse{ 0%,100%{opacity:1;} 50%{opacity:.5;} }
.ai-ring-1{animation:ripple 2.4s ease-out infinite;}
.ai-ring-2{animation:ripple 2.4s ease-out .7s infinite;}
.ai-ring-3{animation:ripple 2.4s ease-out 1.4s infinite;}
.ai-pulse {animation:pulse 2s ease-in-out infinite;}
.rec-dot  {animation:recBlink 1.2s ease-in-out infinite;}
.fade-in  {animation:fadeIn .35s ease;}
.slide-down{animation:slideDown .25s ease;}
.shake    {animation:shake .4s ease;}
.time-urgent{animation:timePulse .7s ease-in-out infinite;}
.btn-primary{background:linear-gradient(135deg,#6c63ff,#5b52d4);color:#fff;border:none;border-radius:30px;padding:13px 28px;font-size:15px;font-weight:700;cursor:pointer;transition:transform .15s,opacity .15s;}
.btn-primary:hover{transform:scale(1.03);}
.btn-primary:disabled{opacity:.45;cursor:not-allowed;transform:none;}
.btn-ghost{background:none;border:1px solid #252840;border-radius:10px;color:#8892a4;cursor:pointer;padding:8px 14px;font-size:13px;display:flex;align-items:center;gap:6px;transition:border-color .2s,color .2s;}
.btn-ghost:hover{border-color:#6c63ff;color:#6c63ff;}
`;
/* ─── AI Avatar ──────────────────────────────────────────────────────────── */
function AiAvatar({ size=80, speaking=false }) {
  const r = size/2;
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      {speaking && <>
        <div className="ai-ring-1" style={{position:"absolute",inset:-r*.6,borderRadius:"50%",border:`2px solid ${C.accent}44`}}/>
        <div className="ai-ring-2" style={{position:"absolute",inset:-r*.35,borderRadius:"50%",border:`2px solid ${C.accent}33`}}/>
        <div className="ai-ring-3" style={{position:"absolute",inset:-r*.1,borderRadius:"50%",border:`2px solid ${C.accent}22`}}/>
      </>}
      <div className={speaking?"ai-pulse":""} style={{width:size,height:size,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent}cc,${C.teal}cc)`,border:`3px solid ${speaking?C.accent:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",zIndex:1,overflow:"hidden",boxShadow:speaking?`0 0 40px ${C.accent}55`:"none",transition:"box-shadow .4s"}}>
        <svg width={size*.62} height={size*.62} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="22" r="14" fill="white" fillOpacity=".28"/>
          <ellipse cx="32" cy="55" rx="20" ry="12" fill="white" fillOpacity=".18"/>
          <circle cx="26" cy="20" r="2.8" fill="white"/>
          <circle cx="38" cy="20" r="2.8" fill="white"/>
          <path d="M26 30 Q32 36 38 30" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
        </svg>
      </div>
    </div>
  );
}
/* ─── Question timer bar (for coding questions) ──────────────────────────── */
function QuestionTimerBar({ seconds, total, label = "Question time limit" }) {
  const pct     = Math.max(0, (seconds / total) * 100);
  const isWarn  = seconds <= 60;
  const isUrgent= seconds <= 20;
  const color   = isUrgent ? C.danger : isWarn ? C.warn : C.teal;
  return (
    <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <span style={{display:"flex",alignItems:"center",gap:6,fontSize:12,fontWeight:700,color:C.muted}}>
          <Timer size={13}/> {label}
        </span>
        <span className={isUrgent?"time-urgent":""} style={{fontSize:20,fontWeight:800,color,fontVariantNumeric:"tabular-nums",fontFamily:"'Fira Code',monospace"}}>
          {formatTime(seconds)}
        </span>
      </div>
      <div style={{height:5,background:C.border,borderRadius:3,overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${color},${color}99)`,borderRadius:3,transition:"width 1s linear,background .5s"}}/>
      </div>
      {isWarn && (
        <p style={{display:"flex",alignItems:"center",gap:5,margin:"6px 0 0",fontSize:11,color,fontWeight:600}}>
          {isUrgent && <AlertTriangle size={13} aria-hidden="true" />}
          {isUrgent ? (label.toLowerCase().includes("coding") ? "Time almost up — your code will be submitted soon!" : "Time almost up — this question will be skipped soon.") : "Less than 1 minute remaining for this question."}
        </p>
      )}
    </div>
  );
}
/* ─── Skip countdown ring (for MCQ / text questions) ────────────────────── */
function SkipRing({ seconds, total, onSkip }) {
  const r = 20, circ = 2 * Math.PI * r;
  const dash  = circ * (1 - Math.max(0, seconds) / total);
  const color = seconds <= 10 ? C.danger : seconds <= 20 ? C.warn : C.muted;
  return (
    <div title={`Auto-skip in ${seconds}s`} onClick={onSkip}
      style={{position:"relative",width:52,height:52,cursor:"pointer",flexShrink:0}}>
      <svg width="52" height="52" style={{transform:"rotate(-90deg)"}}>
        <circle cx="26" cy="26" r={r} fill="none" stroke={C.border} strokeWidth="3"/>
        <circle cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"
          style={{transition:"stroke-dashoffset 1s linear,stroke .3s"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:13,fontWeight:800,color,lineHeight:1}}>{seconds}</span>
        <span style={{fontSize:7,color:C.muted,lineHeight:1}}>skip</span>
      </div>
    </div>
  );
}
/* ─── Webcam + canvas face detection ─────────────────────────────────────── */
function CandidateVideo({ stream, name, onFaceStatus }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const [faceWarn,   setFaceWarn]   = useState(false);
  const [camBlocked, setCamBlocked] = useState(false);
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);
  useEffect(() => {
    if (!stream) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const video  = videoRef.current;
    async function detectFace() {
      if (!video || video.readyState < 2) return;
      if (typeof window.FaceDetector === "function") {
        try {
          const faces = await new window.FaceDetector({ fastMode: true, maxDetectedFaces: 2 }).detect(video);
          const noFace = faces.length === 0;
          setCamBlocked(false);
          setFaceWarn(noFace);
          onFaceStatus?.({ noFace, camBlocked: false });
          return;
        } catch (_) {
          // Fall through to the compatibility detector below.
        }
      }
      ctx.drawImage(video, 0, 0, 160, 120);
      const { data } = ctx.getImageData(30, 10, 100, 100);
      let skinPx = 0;
      const totalPx = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2];
        const bright  = (r + g + b) / 3;
        const isSkin  = r > 60 && g > 40 && b > 20 && r > b && r > g &&
                        (r - Math.min(g, b)) > 15 && bright > 40;
        if (isSkin) skinPx++;
      }
      const skinRatio = skinPx / totalPx;
      const tooBlack  = skinPx < 5;
      const noFace    = skinRatio < 0.015;
      setCamBlocked(tooBlack);
      setFaceWarn(noFace && !tooBlack);
      onFaceStatus?.({ noFace, camBlocked: tooBlack });
    }
    detectFace();
    const id = setInterval(detectFace, 2500);
    return () => clearInterval(id);
  }, [stream, onFaceStatus]);
  return (
    <div style={{position:"relative",background:"#000",width:"100%",height:"100%"}}>
      <canvas ref={canvasRef} width="160" height="120" style={{display:"none"}}/>
      {stream
        ? <video ref={videoRef} autoPlay playsInline muted
            style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
        : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8,color:C.muted}}>
            <VideoOff size={36} style={{opacity:.4}}/><span style={{fontSize:13}}>Camera unavailable</span>
          </div>}
      {stream && (
        <div style={{position:"absolute",top:12,left:12,background:C.danger,color:"#fff",borderRadius:6,padding:"3px 9px",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:5,userSelect:"none"}}>
          <span className="rec-dot" style={{width:7,height:7,borderRadius:"50%",background:"#fff",display:"inline-block"}}/>REC
        </div>
      )}
      {camBlocked && (
        <div className="slide-down" style={{position:"absolute",top:44,left:12,right:12,background:"rgba(239,68,68,.88)",borderRadius:8,padding:"8px 12px",fontSize:12,fontWeight:600,color:"#fff",display:"flex",gap:6,alignItems:"center"}}>
          <VideoOff size={13}/> Camera appears blocked
        </div>
      )}
      {faceWarn && !camBlocked && (
        <div className="slide-down" style={{position:"absolute",top:44,left:12,right:12,background:"rgba(245,158,11,.9)",borderRadius:8,padding:"8px 12px",fontSize:12,fontWeight:600,color:"#000",display:"flex",gap:6,alignItems:"center"}}>
          <Eye size={13}/> Please look at the camera
        </div>
      )}
      {name && (
        <div style={{position:"absolute",bottom:12,left:12,background:"rgba(0,0,0,.65)",backdropFilter:"blur(4px)",color:"#fff",borderRadius:6,padding:"4px 10px",fontSize:13,fontWeight:600}}>{name}</div>
      )}
    </div>
  );
}
/* ─── Tab-switch modal ───────────────────────────────────────────────────── */
function TabWarningModal({ count, maxWarnings, onDismiss }) {
  const isLast = count >= maxWarnings;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.84)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div className={`fade-in ${isLast?"shake":""}`} style={{background:C.card,border:`2px solid ${C.warn}`,borderRadius:18,padding:36,maxWidth:380,textAlign:"center"}}>
        <AlertTriangle size={52} color={C.warn} style={{marginBottom:12}}/>
        <h2 style={{color:C.text,fontSize:20,margin:"0 0 10px"}}>
          {isLast?"Interview Auto-Submitting":"Tab Switch Detected"}
        </h2>
        <p style={{color:C.muted,fontSize:14,margin:"0 0 8px"}}>
          You left the interview window. This has been recorded.
        </p>
        <p style={{color:C.warn,fontSize:13,fontWeight:700,margin:"0 0 24px"}}>
          Warning {count} of {maxWarnings}{isLast?" — submitting now…":""}
        </p>
        {!isLast && <button className="btn-primary" onClick={onDismiss}>Return to Interview</button>}
      </div>
    </div>
  );
}
/* ─── Progress bar ───────────────────────────────────────────────────────── */
function ProgressBar({ current, total }) {
  if (!total) return null;
  const pct = Math.round((current / total) * 100);
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,minWidth:160}}>
      <span style={{fontSize:12,color:C.muted,fontWeight:600,whiteSpace:"nowrap"}}>Q{current}/{total}</span>
      <div style={{flex:1,height:4,background:C.border,borderRadius:2,overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${C.accent},${C.teal})`,borderRadius:2,transition:"width .5s ease"}}/>
      </div>
      <span style={{fontSize:12,color:C.muted}}>{pct}%</span>
    </div>
  );
}
/* ─── MCQ ────────────────────────────────────────────────────────────────── */
function MCQOptions({ options, selected, onChange }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:10}}>
      {options.map((opt, i) => {
        const letter = String.fromCharCode(65 + i);
        const isSel  = selected === opt;
        return (
          <button key={i} onClick={() => onChange(opt)} style={{background:isSel?`${C.accent}22`:"transparent",border:`1.5px solid ${isSel?C.accent:C.border}`,borderRadius:10,padding:"12px 16px",cursor:"pointer",color:isSel?C.accent:C.text,fontWeight:isSel?700:400,fontSize:14,textAlign:"left",display:"flex",alignItems:"center",gap:12,transition:"all .2s"}}>
            <span style={{width:26,height:26,borderRadius:"50%",background:isSel?C.accent:C.border,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0}}>{letter}</span>
            {opt}
          </button>
        );
      })}
    </div>
  );
}
/* ─── Code editor ────────────────────────────────────────────────────────── */
function CodeEditor({ value, onChange, language = "javascript" }) {
  return (
    <div style={{border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
      <div style={{background:C.panel,padding:"8px 14px",fontSize:12,color:C.muted,display:"flex",alignItems:"center",gap:6,borderBottom:`1px solid ${C.border}`}}>
        <Code2 size={13}/> {language}
      </div>
      <textarea value={value} onChange={e => onChange(e.target.value)} spellCheck={false} rows={11}
        style={{width:"100%",background:"#0a0c14",color:"#a8b4d0",fontFamily:"'Fira Code',monospace",fontSize:13,lineHeight:1.7,padding:"14px 16px",border:"none",outline:"none",resize:"none"}}/>
    </div>
  );
}
/* ─── Interview Room ─────────────────────────────────────────────────────── */
function InterviewRoom({ token, question, sessionInfo, remaining, stream,
  onAnswer, onFinish, aiSpeaking, violations, maxViolations,
  tabWarning, onDismissWarning, offline }) {
  const [textAnswer, setTextAnswer] = useState("");
  const [mcqAnswer,  setMcqAnswer]  = useState("");
  const [codeAnswer, setCodeAnswer] = useState("// Write your code here\n");
  const [listening,  setListening]  = useState(false);
  const [interim,    setInterim]    = useState("");
  const [faceStatus, setFaceStatus] = useState({});
  const [draftSaved, setDraftSaved] = useState(false);
  const [qSecs,      setQSecs]      = useState(0);   // per-question countdown
  const [quickSkipSecs, setQuickSkipSecs] = useState(0);
  const recognitionRef = useRef(null);
  const answerRef      = useRef("");
  const mcqAnswerRef   = useRef("");
  const codeAnswerRef  = useRef(codeAnswer);
  const answerPresentRef = useRef(false);
  const draftTimer     = useRef(null);
  const qTimer         = useRef(null);
  const skippedRef     = useRef(false);
  const qTimeTotalRef  = useRef(0);
  const qType  = question?.type?.toUpperCase() || "TEXT";
  const isMCQ  = qType === "MCQ" || (Array.isArray(question?.options) && question.options.length);
  const isCode = qType === "CODING" || qType === "CODE";
  const qNum   = question?.questionNumber || 1;
  const qTotal = sessionInfo?.totalQuestions || null;
  const qId    = String(question?.id || question?.questionNumber || qNum);
  const quickSkipTotal = Number(sessionInfo?.quickResponseTimeoutSeconds ?? 20);
  const hasAnswer = isMCQ
    ? Boolean(mcqAnswer)
    : isCode
      ? Boolean(codeAnswer.trim() && codeAnswer.trim() !== "// Write your code here")
      : Boolean(textAnswer.trim());
  answerPresentRef.current = hasAnswer;
  mcqAnswerRef.current = mcqAnswer;
  codeAnswerRef.current = codeAnswer;
  // Per-question time limit: use question.timeLimit if set, else type default
  const getQTime = () => {
    if (question?.timeLimit && Number(question.timeLimit) > 0) return Number(question.timeLimit);
    if (isCode) return question?.problemSize === "large" ? 1200 : TYPE_TIME.CODING;
    if (qType === "SCENARIO" || question?.stage === "scenario") return TYPE_TIME.SCENARIO;
    if (qType === "SYSTEM_DESIGN" || question?.stage === "system_design") return TYPE_TIME.SYSTEM_DESIGN;
    if (isMCQ)  return TYPE_TIME.MCQ;
    return TYPE_TIME.TEXT;
  };
  // ── Reset + start countdown on each new question ────────────────────────
  useEffect(() => {
    const savedDraft = question?.draft || "";
    setTextAnswer(isCode || isMCQ ? "" : savedDraft);
    setMcqAnswer(isMCQ ? savedDraft : "");
    setCodeAnswer(isCode ? savedDraft || "// Write your code here\n" : "// Write your code here\n");
    setInterim(""); setDraftSaved(false);
    skippedRef.current = false;
    answerRef.current  = isCode || isMCQ ? "" : savedDraft;
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
            const ans = answerPresentRef.current
              ? (isMCQ ? mcqAnswerRef.current : isCode ? codeAnswerRef.current : answerRef.current)
              : "(skipped — question time expired)";
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
  useEffect(() => { codeAnswerRef.current = codeAnswer; }, [codeAnswer]);
  useEffect(() => { answerRef.current = textAnswer; }, [textAnswer]);
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
      try { await saveAIInterviewDraft(token, qId, val); setDraftSaved(true); setTimeout(() => setDraftSaved(false), 2000); }
      catch (_) {}
    }, 2000);
  }
  function getAnswer()  { if (isMCQ) return mcqAnswer; if (isCode) return codeAnswer; return textAnswer; }
  function canSubmit()  { return hasAnswer; }
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
    rec.lang = "en-IN"; rec.continuous = true; rec.interimResults = true;
    rec.onresult = ev => {
      let fin = "", int = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) fin += ` ${t}`; else int += ` ${t}`;
      }
      if (fin.trim()) {
        answerRef.current = `${answerRef.current} ${fin}`.trim();
        setTextAnswer(answerRef.current);
        scheduleDraft(answerRef.current);
      }
      setInterim(int.trim());
    };
    rec.onerror = () => setListening(false);
    rec.onend   = () => { setListening(false); setInterim(""); };
    recognitionRef.current = rec; rec.start(); setListening(true);
  }
  function stopListening() {
    try { recognitionRef.current?.stop(); } catch (_) {}
    recognitionRef.current = null; setListening(false); setInterim("");
  }
  const timeColor = remaining < 60 ? C.danger : remaining < 180 ? C.warn : C.muted;
  return (
    <>
      {tabWarning && <TabWarningModal count={violations} maxWarnings={maxViolations} onDismiss={onDismissWarning}/>}
      <div style={{height:"100vh",display:"flex",flexDirection:"column",background:C.bg,fontFamily:"'Inter',sans-serif",color:C.text,overflow:"hidden"}}>
        {/* ── Top banner ── */}
        <div className="slide-down" style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:"14px 24px",display:"flex",alignItems:"flex-start",gap:12,minHeight:64}}>
          <div style={{background:`${C.accent}22`,border:`1px solid ${C.accent}44`,borderRadius:8,padding:"4px 10px",fontSize:12,fontWeight:800,color:C.accent,flexShrink:0,marginTop:2}}>
            {isCode ? <><Code2 size={13} aria-hidden="true" /> CODE</> : isMCQ ? <><ListChecks size={13} aria-hidden="true" /> MCQ</> : <><MessageCircle size={13} aria-hidden="true" /> Q</>}{qNum}
          </div>
          <p style={{margin:0,fontSize:15,lineHeight:1.55,color:aiSpeaking?C.muted:C.text,fontStyle:aiSpeaking?"italic":"normal",flex:1}}>
            {aiSpeaking ? "Avya is speaking…" : question?.question}
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end",flexShrink:0}}>
            <ProgressBar current={qNum} total={qTotal}/>
            {offline && <div style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:C.danger,fontWeight:700}}><WifiOff size={10}/>Offline</div>}
          </div>
        </div>
        {/* ── Main split ── */}
        <div style={{flex:1,display:"flex",overflow:"hidden"}}>
          {/* AI panel */}
          <div style={{flex:"0 0 42%",background:C.panel,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative",borderRight:`1px solid ${C.border}`}}>
            <AiAvatar size={110} speaking={aiSpeaking}/>
            {aiSpeaking && <p style={{color:C.muted,fontSize:13,marginTop:14}}>Speaking…</p>}
            <div style={{position:"absolute",bottom:16,left:16,background:"rgba(0,0,0,.55)",borderRadius:6,padding:"4px 10px",fontSize:13,fontWeight:600}}>Avya · AI Interviewer</div>
            {violations > 0 && (
              <div style={{position:"absolute",top:12,right:12,background:`${C.warn}22`,border:`1px solid ${C.warn}`,borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:700,color:C.warn}}>
                <AlertTriangle size={12} aria-hidden="true" /> {violations}/{maxViolations} tab switch{violations > 1?"es":""}
              </div>
            )}
            {(faceStatus.noFace || faceStatus.camBlocked) && !aiSpeaking && (
              <div style={{position:"absolute",top:violations>0?50:12,right:12,background:`${C.danger}22`,border:`1px solid ${C.danger}`,borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:700,color:C.danger,display:"flex",gap:4,alignItems:"center"}}>
                <EyeOff size={11}/>{faceStatus.camBlocked?"Cam blocked":"Face not detected"}
              </div>
            )}
          </div>
          {/* Candidate side */}
          <div style={{flex:"0 0 58%",display:"flex",flexDirection:"column",overflow:"hidden"}}>
            {/* Webcam */}
            <div style={{flex:"0 0 42%",position:"relative"}}>
              <CandidateVideo stream={stream} name={sessionInfo?.candidateName} onFaceStatus={setFaceStatus}/>
            </div>
            {/* Answer area */}
            <div style={{flex:1,background:C.card,borderTop:`1px solid ${C.border}`,padding:"10px 14px",overflow:"auto"}}>
              {!isCode && <QuestionTimerBar seconds={qSecs} total={qTimeTotalRef.current || TYPE_TIME.TEXT} label="Maximum time for this question"/>}
              {isCode ? (
                <>
                  <QuestionTimerBar seconds={qSecs} total={qTimeTotalRef.current||TYPE_TIME.CODING} label={question?.problemSize === "large" ? "Large coding time limit" : "Coding time limit"}/>
                  <CodeEditor value={codeAnswer} onChange={v => { setCodeAnswer(v); scheduleDraft(v); }} language={question?.language || "javascript"}/>
                </>
              ) : isMCQ ? (
                <>
                  <MCQOptions options={question.options} selected={mcqAnswer} onChange={v => { setMcqAnswer(v); scheduleDraft(v); }}/>
                </>
              ) : (
                <div>
                  <textarea
                    value={textAnswer + (interim ? ` ${interim}` : "")}
                    onChange={e => { answerRef.current = e.target.value; setTextAnswer(e.target.value); scheduleDraft(e.target.value); }}
                    placeholder="Speak or type your answer…" rows={5}
                    style={{width:"100%",background:C.panel,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.text,fontSize:14,resize:"none",outline:"none",fontFamily:"inherit",lineHeight:1.6}}/>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginTop:8}}>
                    <button onClick={listening?stopListening:startListening}
                      style={{background:listening?C.danger:C.accent,border:"none",borderRadius:"50%",width:38,height:38,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {listening?<MicOff size={16} color="#fff"/>:<Mic size={16} color="#fff"/>}
                    </button>
                    {listening && <span style={{display:"flex",alignItems:"center",gap:4,color:C.accent,fontSize:12,fontWeight:600}}><Mic size={12} aria-hidden="true" />Listening…</span>}
                    {draftSaved && <span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:C.success,fontWeight:600}}><Save size={10}/>Saved</span>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* ── Bottom bar ── */}
        <div style={{background:C.panel,borderTop:`1px solid ${C.border}`,padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
          {/* Session timer */}
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <Clock size={15} color={timeColor}/>
            <span style={{fontWeight:700,color:timeColor,fontVariantNumeric:"tabular-nums",fontSize:16}}>{formatTime(remaining)}</span>
            <span style={{color:C.border}}>|</span>
            <span style={{color:C.muted,fontSize:13}}>{sessionInfo?.jobTitle||"AI Interview"}</span>
          </div>
          {/* Skip ring (MCQ / text only) + Submit */}
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {!canSubmit() && quickSkipTotal > 0 && quickSkipSecs > 0 && (
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <SkipRing seconds={quickSkipSecs} total={quickSkipTotal} onSkip={handleManualSkip}/>
                <div style={{fontSize:11,color:quickSkipSecs<=5?C.danger:C.muted}}>
                  {quickSkipSecs<=5 ? `No answer detected. Auto-skip in ${quickSkipSecs}s.` : `Auto-skip if unanswered in ${quickSkipSecs}s.`}
                </div>
              </div>
            )}
            <button onClick={handleSubmit} disabled={!canSubmit()} className="btn-primary" style={{padding:"10px 28px",fontSize:14}}>
              {isCode ? "Submit Code" : "Save & Next"} <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
          {/* Right controls */}
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button className="btn-ghost" style={{borderColor:faceStatus.noFace?C.warn:"",color:faceStatus.noFace?C.warn:""}}>
              {faceStatus.noFace?<EyeOff size={14}/>:<Eye size={14}/>}
              {faceStatus.camBlocked?"Cam blocked":faceStatus.noFace?"Face not found":"Proctored"}
            </button>
            <button className="btn-ghost" onClick={handleManualSkip} title="Skip this question">
              <SkipForward size={14}/>Skip
            </button>
            <button onClick={onFinish} style={{background:C.danger,border:"none",borderRadius:8,padding:"8px 14px",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:600}}>
              <Phone size={14} style={{transform:"rotate(135deg)"}}/>End
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
/* ─── Join screen ────────────────────────────────────────────────────────── */
function JoinScreen({ session, error, onJoin }) {
  const mins = Math.round((session?.durationSeconds||0)/60);
  return (
    <div style={{minHeight:"100vh",background:`radial-gradient(ellipse at 30% 20%,#1a1060 0%,${C.bg} 65%)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif"}}>
      <div className="fade-in" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:22,padding:"44px 38px",width:350,textAlign:"center",boxShadow:"0 32px 80px rgba(0,0,0,.55)"}}>
        <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>AI Interview</div>
        <h1 style={{fontSize:26,fontWeight:800,color:C.text,margin:"0 0 10px"}}>{session?.jobTitle||"Interview"}</h1>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:14,color:C.muted,fontSize:13,marginBottom:30}}>
          <span style={{display:"flex",alignItems:"center",gap:4}}><Building2 size={14} aria-hidden="true" />{session?.company||"HRMS"}</span>
          <span style={{color:C.border}}>•</span>
          <span><Clock size={12} style={{verticalAlign:"middle",marginRight:3}}/>{mins} min{mins!==1?"s":""}</span>
        </div>
        <div style={{position:"relative",display:"inline-block",marginBottom:18}}>
          <AiAvatar size={100}/>
          <div style={{position:"absolute",bottom:-6,left:"50%",transform:"translateX(-50%)",background:C.accent,color:"#fff",borderRadius:20,padding:"2px 12px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>Avya</div>
        </div>
        <p style={{color:C.muted,fontSize:13,margin:"18px 0 28px"}}>Your AI interviewer is ready.<br/>Make sure your camera and microphone are on.</p>
        {error && <p style={{color:C.danger,fontSize:12,lineHeight:1.5,margin:"-14px 0 16px"}}>{error}</p>}
        <button className="btn-primary" onClick={onJoin} style={{width:"100%",padding:"14px 0",fontSize:16}}>Join Interview</button>
        <p style={{color:C.muted,fontSize:11,marginTop:14}}>Responses are recorded and reviewed by the recruitment team.</p>
      </div>
    </div>
  );
}
/* ─── OTP screen ─────────────────────────────────────────────────────────── */
function OtpScreen({ email, token, devCode, onVerify }) {
  const [otp,setOtp]      = useState("");
  const [busy,setBusy]    = useState(false);
  const [err,setErr]      = useState("");
  const [resent,setResent]= useState(false);
  const [devHint,setDevHint] = useState(devCode || "");
  // Dev-mode convenience: when SMTP is not configured the backend returns the
  // code so local testing isn't blocked. Prefill it so it can be verified in one click.
  useEffect(()=>{ if (devCode) { setDevHint(devCode); setOtp(String(devCode).slice(0,6)); } },[devCode]);
  async function verify() {
    if (otp.length !== 6) { setErr("Enter the 6-digit code"); return; }
    setBusy(true);
    try { await verifyAIInterviewOtp(token, otp); onVerify(); }
    catch (error) { setErr(error?.response?.data?.message || "Invalid verification code"); }
    finally { setBusy(false); }
  }
  return (
    <div style={{minHeight:"100vh",background:`radial-gradient(ellipse at 30% 20%,#1a1060 0%,${C.bg} 65%)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif"}}>
      <div className="fade-in" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:22,padding:"40px 36px",width:340,textAlign:"center",boxShadow:"0 32px 80px rgba(0,0,0,.55)"}}>
        <div style={{width:56,height:56,borderRadius:16,background:`linear-gradient(135deg,${C.accent},#5b52d4)`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}><Bot size={28} color="#fff" aria-hidden="true" /></div>
        <h2 style={{color:C.text,fontSize:22,fontWeight:800,margin:"0 0 8px"}}>Verify your identity</h2>
        <p style={{color:C.muted,fontSize:13,margin:"0 0 24px"}}>6-digit OTP sent to<br/><strong style={{color:C.text}}>{email||"your email"}</strong></p>
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:18}}>
          {[0,1,2,3,4,5].map(i=>(
            <input key={i} id={`otp-${i}`} maxLength={1} value={otp[i]||""}
              onChange={e=>{const v=e.target.value.replace(/\D/g,"");const a=otp.split("");a[i]=v;const n=a.join("").slice(0,6);setOtp(n);setErr("");if(v&&i<5)document.getElementById(`otp-${i+1}`)?.focus();}}
              onKeyDown={e=>{if(e.key==="Backspace"&&!otp[i]&&i>0)document.getElementById(`otp-${i-1}`)?.focus();}}
              style={{width:44,height:52,textAlign:"center",fontSize:22,fontWeight:700,background:C.panel,border:`1.5px solid ${err?C.danger:otp[i]?C.accent:C.border}`,borderRadius:10,color:C.text,outline:"none"}}/>
          ))}
        </div>
        {devHint && <p style={{color:C.warn,fontSize:12,margin:"0 0 10px",lineHeight:1.4}}>Dev mode (email not configured): code <strong style={{letterSpacing:2}}>{devHint}</strong> — set SMTP in .env for real delivery.</p>}
        {err && <p style={{color:C.danger,fontSize:12,margin:"0 0 10px"}}>{err}</p>}
        <button className="btn-primary" onClick={verify} disabled={busy} style={{width:"100%",padding:"13px 0",fontSize:15}}>{busy?"Verifying…":"Verify OTP"}</button>
        <button onClick={async()=>{ if (resent || busy) return; try { const r = await sendAIInterviewOtp(token); if (r?.devMode && r?.devCode) { setDevHint(r.devCode); setOtp(String(r.devCode).slice(0,6)); } else { setOtp(""); } setResent(true); setErr(""); setTimeout(()=>setResent(false),30000); } catch (error) { setErr(error?.response?.data?.message || "Could not resend code"); } }} style={{background:"none",border:"none",color:resent?C.muted:C.accent,cursor:"pointer",marginTop:14,fontSize:13,fontWeight:600,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:4}}>{resent?<><CheckCircle2 size={13} aria-hidden="true" />OTP resent</>:"Resend OTP"}</button>
      </div>
    </div>
  );
}
/* ─── Avya intro ─────────────────────────────────────────────────────────── */
function AiSpeakingIntro({ onSkip }) {
  useEffect(()=>{
    speak("Hi, I am Avya. I will be taking your interview today. Please feel comfortable and share your thoughts freely. You can speak or type your answers.");
    const t = setTimeout(onSkip,10000);
    return ()=>{ clearTimeout(t); window.speechSynthesis?.cancel(); };
  },[onSkip]);
  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",color:C.text,position:"relative"}}>
      <p style={{color:C.muted,fontSize:14,marginBottom:50}}>Avya is introducing herself…</p>
      <AiAvatar size={160} speaking={true}/>
      <p style={{color:C.text,fontSize:20,fontWeight:700,marginTop:40}}>Avya</p>
      <p style={{color:C.muted,fontSize:14}}>AI Interviewer · HRMS</p>
      <button onClick={onSkip} style={{position:"absolute",bottom:44,background:"none",border:`1px solid ${C.border}`,borderRadius:20,color:C.muted,cursor:"pointer",fontSize:14,fontWeight:600,padding:"8px 20px",display:"inline-flex",alignItems:"center",gap:6}}>Skip <ArrowRight size={14} aria-hidden="true" /></button>
    </div>
  );
}
/* ─── Main ───────────────────────────────────────────────────────────────── */
export default function TakeInterview() {
  const { token } = useParams();
  const [screen,    setScreen]    = useState("loading");
  const [session,   setSession]   = useState(null);
  const [question,  setQuestion]  = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [error,     setError]     = useState("");
  const [devCode,   setDevCode]   = useState("");
  const [stream,    setStream]    = useState(null);
  const [aiSpeaking,setAiSpeaking]= useState(false);
  const [tabWarning,setTabWarning]= useState(false);
  const [violations,setViolations]= useState(0);
  const [offline,   setOffline]   = useState(!navigator.onLine);
  const MAX_VIOLATIONS = 3;
  const handleFinishRef = useRef(null);
  useEffect(()=>{ const el=document.createElement("style"); el.textContent=STYLE; document.head.appendChild(el); return ()=>el.remove(); },[]);
  useEffect(()=>{
    const up=()=>setOffline(false), down=()=>setOffline(true);
    window.addEventListener("online",up); window.addEventListener("offline",down);
    return ()=>{ window.removeEventListener("online",up); window.removeEventListener("offline",down); };
  },[]);
  useEffect(()=>{
    getAIInterviewSession(token)
      .then(async data=>{ setSession(data); setRemaining(data.remainingSeconds||data.durationSeconds||0); const otpRes = await sendAIInterviewOtp(token); if (otpRes?.devMode && otpRes?.devCode) setDevCode(otpRes.devCode); setScreen("otp"); })
      .catch(err=>{ setError(err?.response?.data?.message||"This interview link is invalid or expired."); setScreen("error"); });
  },[token]);
  // Tab-switch proctoring
  useEffect(()=>{
    if(screen!=="interview") return;
    const handler=()=>{
      if(!document.hidden) return;
      setViolations(v=>{
        const next=v+1;
        setTabWarning(true);
        logAIInterviewProctoring(token,{event:"TAB_SWITCH",count:next,timestamp:new Date().toISOString()})
          .then(r=>{ if(r?.data?.data?.autoSubmitted){ endStream(); setScreen("done"); } })
          .catch(()=>{});
        if(next>=MAX_VIOLATIONS) setTimeout(()=>handleFinishRef.current?.(),2000);
        return next;
      });
    };
    document.addEventListener("visibilitychange",handler);
    return ()=>document.removeEventListener("visibilitychange",handler);
  },[screen,token]); // eslint-disable-line
  // Session countdown from expiresAt
  useEffect(()=>{
    if(!session?.expiresAt||screen!=="interview") return;
    const tick=()=>{
      const s=Math.max(0,Math.ceil((new Date(session.expiresAt).getTime()-Date.now())/1000));
      setRemaining(s);
      if(!s){ completeAIInterview(token).catch(()=>{}); endStream(); setScreen("done"); }
    };
    tick(); const id=setInterval(tick,1000); return ()=>clearInterval(id);
  },[session?.expiresAt,screen,token]); // eslint-disable-line
  function endStream(){ stream?.getTracks().forEach(t=>t.stop()); setStream(null); window.speechSynthesis?.cancel(); }
  async function requestCamera(){
    if(!navigator.mediaDevices?.getUserMedia){
      setError("Camera access is not supported in this browser.");
      return false;
    }
    try{
      const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:true});
      setStream(s);
      return true;
    }catch(err){
      setError(err?.name === "NotAllowedError" ? "Please allow camera and microphone access to continue." : "Unable to access your camera. Check that it is connected and not being used by another app.");
      return false;
    }
  }
  function setNextQuestion(data){
    setQuestion({...data.question,questionNumber:data.questionNumber,draft:data.savedDraft || ""});
    setRemaining(data.remainingSeconds);
    setSession(prev=>({...prev,expiresAt:data.expiresAt}));
    setScreen("interview");
    setAiSpeaking(true);
    speak(data.question?.question,()=>setAiSpeaking(false));
  }
  const handleJoin        = async ()=>{
    const cameraReady = await requestCamera();
    if (cameraReady) setScreen("intro");
  };
  const handleIntroDone = useCallback(()=>{
    setScreen("working");
    startAIInterview(token)
      .then(data=>{ if(data.complete){ endStream(); setScreen("done"); return; } setNextQuestion(data); })
      .catch(err=>{ setError(err?.response?.data?.message||"Unable to start interview."); setScreen("error"); });
  },[token]); // eslint-disable-line
  const handleFinish = useCallback(async()=>{
    endStream(); setScreen("working");
    try{ await completeAIInterview(token); }catch(_){}
    setScreen("done");
  },[token,stream]); // eslint-disable-line
  useEffect(()=>{ handleFinishRef.current=handleFinish; },[handleFinish]);
  async function handleAnswer(answer,questionId){
    setScreen("working");
    try{
      const data=await answerAIInterview(token,answer,questionId);
      if(data.complete){ endStream(); setScreen("done"); return; }
      setNextQuestion(data);
    }catch(err){
      if(err?.response?.status===409){
        try{ const current=await startAIInterview(token); if(current.complete){ endStream(); setScreen("done"); } else setNextQuestion(current); return; }
        catch(recoveryError){ setError(recoveryError?.response?.data?.message||"Unable to restore the current interview question."); setScreen("error"); return; }
      }
      if(!navigator.onLine){ setScreen("interview"); return; }
      setError(err?.response?.data?.message||"Answer could not be saved."); setScreen("error");
    }
  }
  if(screen==="loading"||screen==="working") return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",color:C.text}}>
      <Loader2 size={46} color={C.accent} style={{animation:"spin 1s linear infinite"}}/>
      <p style={{marginTop:20,color:C.muted,fontSize:15}}>{screen==="working"?"Avya is reviewing your answer…":"Loading interview…"}</p>
    </div>
  );
  if(screen==="error") return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",color:C.text,textAlign:"center",padding:20}}>
      <AlertCircle size={60} color={C.danger}/>
      <h2 style={{fontSize:22,marginTop:16}}>Interview unavailable</h2>
      <p style={{color:C.muted,maxWidth:340}}>{error}</p>
    </div>
  );
  if(screen==="done") return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",color:C.text,textAlign:"center",padding:20}}>
      <CheckCircle2 size={80} color={C.success}/>
      <h1 style={{fontSize:30,marginTop:20}}>Interview Complete!</h1>
      <p style={{color:C.muted,maxWidth:400,fontSize:15,lineHeight:1.6}}>Thank you for your time. Your responses have been securely recorded and will be reviewed by the recruitment team.</p>
      {violations>0 && <p style={{display:"flex",alignItems:"center",gap:5,color:C.warn,fontSize:13,marginTop:8}}><AlertTriangle size={14} aria-hidden="true" />{violations} tab-switch violation{violations>1?"s":""} were recorded.</p>}
      <p style={{color:C.muted,fontSize:13,marginTop:8}}>You may now close this window.</p>
    </div>
  );
  if(screen==="join")  return <JoinScreen session={session} error={error} onJoin={handleJoin}/>;
  if(screen==="otp")   return <OtpScreen  email={session?.candidateEmail} token={token} devCode={devCode} onVerify={()=>setScreen("join")}/>;
  if(screen==="intro") return <AiSpeakingIntro onSkip={handleIntroDone}/>;
  return (
    <InterviewRoom
      token={token} question={question} sessionInfo={session}
      remaining={remaining} stream={stream}
      aiSpeaking={aiSpeaking} violations={violations} maxViolations={MAX_VIOLATIONS}
      tabWarning={tabWarning} onDismissWarning={()=>setTabWarning(false)}
      offline={offline} onAnswer={handleAnswer} onFinish={handleFinish}
    />
  );
}
