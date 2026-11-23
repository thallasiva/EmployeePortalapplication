import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { answerAIInterview, completeAIInterview, getAIInterviewSession, sendAIInterviewOtp, startAIInterview, logAIInterviewProctoring } from "../../../api/recruitment.api";
/* ─── Theme ──────────────────────────────────────────────────────────────── */
import { C, speak, STYLE } from "./shared";
import { InterviewRoom } from "./InterviewRoom";
import { JoinScreen } from "./JoinScreen";
import { OtpScreen } from "./OtpScreen";
import { AiSpeakingIntro } from "./AiSpeakingIntro";
function TakeInterview() {
  const {
    token
  } = useParams();
  const [screen, setScreen] = useState("loading");
  const [session, setSession] = useState(null);
  const [question, setQuestion] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState("");
  const [stream, setStream] = useState(null);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [tabWarning, setTabWarning] = useState(false);
  const [violations, setViolations] = useState(0);
  const [offline, setOffline] = useState(!navigator.onLine);
  const MAX_VIOLATIONS = 3;
  const handleFinishRef = useRef(null);
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = STYLE;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);
  useEffect(() => {
    const up = () => setOffline(false),
      down = () => setOffline(true);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  useEffect(() => {
    getAIInterviewSession(token).then(async data => {
      setSession(data);
      setRemaining(data.remainingSeconds || data.durationSeconds || 0);
      const otpRes = await sendAIInterviewOtp(token);
      if (otpRes?.devMode && otpRes?.devCode) setDevCode(otpRes.devCode);
      setScreen("otp");
    }).catch(err => {
      setError(err?.response?.data?.message || "This interview link is invalid or expired.");
      setScreen("error");
    });
  }, [token]);
  // Tab-switch proctoring
  useEffect(() => {
    if (screen !== "interview") return;
    const handler = () => {
      if (!document.hidden) return;
      setViolations(v => {
        const next = v + 1;
        setTabWarning(true);
        logAIInterviewProctoring(token, {
          event: "TAB_SWITCH",
          count: next,
          timestamp: new Date().toISOString()
        }).then(r => {
          if (r?.data?.data?.autoSubmitted) {
            endStream();
            setScreen("done");
          }
        }).catch(() => {});
        if (next >= MAX_VIOLATIONS) setTimeout(() => handleFinishRef.current?.(), 2000);
        return next;
      });
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [screen, token]); // eslint-disable-line
  // Session countdown from expiresAt
  useEffect(() => {
    if (!session?.expiresAt || screen !== "interview") return;
    const tick = () => {
      const s = Math.max(0, Math.ceil((new Date(session.expiresAt).getTime() - Date.now()) / 1000));
      setRemaining(s);
      if (!s) {
        completeAIInterview(token).catch(() => {});
        endStream();
        setScreen("done");
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session?.expiresAt, screen, token]); // eslint-disable-line
  function endStream() {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    window.speechSynthesis?.cancel();
  }
  async function requestCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is not supported in this browser.");
      return false;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user"
        },
        audio: true
      });
      setStream(s);
      return true;
    } catch (err) {
      setError(err?.name === "NotAllowedError" ? "Please allow camera and microphone access to continue." : "Unable to access your camera. Check that it is connected and not being used by another app.");
      return false;
    }
  }
  function setNextQuestion(data) {
    setQuestion({
      ...data.question,
      questionNumber: data.questionNumber,
      draft: data.savedDraft || ""
    });
    setRemaining(data.remainingSeconds);
    setSession(prev => ({
      ...prev,
      expiresAt: data.expiresAt
    }));
    setScreen("interview");
    setAiSpeaking(true);
    speak(data.question?.question, () => setAiSpeaking(false));
  }
  const handleJoin = async () => {
    const cameraReady = await requestCamera();
    if (cameraReady) setScreen("intro");
  };
  const handleIntroDone = useCallback(() => {
    setScreen("working");
    startAIInterview(token).then(data => {
      if (data.complete) {
        endStream();
        setScreen("done");
        return;
      }
      setNextQuestion(data);
    }).catch(err => {
      setError(err?.response?.data?.message || "Unable to start interview.");
      setScreen("error");
    });
  }, [token]); // eslint-disable-line
  const handleFinish = useCallback(async () => {
    endStream();
    setScreen("working");
    try {
      await completeAIInterview(token);
    } catch (_) {}
    setScreen("done");
  }, [token, stream]); // eslint-disable-line
  useEffect(() => {
    handleFinishRef.current = handleFinish;
  }, [handleFinish]);
  async function handleAnswer(answer, questionId) {
    setScreen("working");
    try {
      const data = await answerAIInterview(token, answer, questionId);
      if (data.complete) {
        endStream();
        setScreen("done");
        return;
      }
      setNextQuestion(data);
    } catch (err) {
      if (err?.response?.status === 409) {
        try {
          const current = await startAIInterview(token);
          if (current.complete) {
            endStream();
            setScreen("done");
          } else setNextQuestion(current);
          return;
        } catch (recoveryError) {
          setError(recoveryError?.response?.data?.message || "Unable to restore the current interview question.");
          setScreen("error");
          return;
        }
      }
      if (!navigator.onLine) {
        setScreen("interview");
        return;
      }
      setError(err?.response?.data?.message || "Answer could not be saved.");
      setScreen("error");
    }
  }
  if (screen === "loading" || screen === "working") return <div style={{
    minHeight: "100vh",
    background: C.bg,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter',sans-serif",
    color: C.text
  }}>
      <Loader2 size={46} color={C.accent} style={{
      animation: "spin 1s linear infinite"
    }} />
      <p style={{
      marginTop: 20,
      color: C.muted,
      fontSize: 15
    }}>{screen === "working" ? "Avya is reviewing your answer…" : "Loading interview…"}</p>
    </div>;
  if (screen === "error") return <div style={{
    minHeight: "100vh",
    background: C.bg,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter',sans-serif",
    color: C.text,
    textAlign: "center",
    padding: 20
  }}>
      <AlertCircle size={60} color={C.danger} />
      <h2 style={{
      fontSize: 22,
      marginTop: 16
    }}>Interview unavailable</h2>
      <p style={{
      color: C.muted,
      maxWidth: 340
    }}>{error}</p>
    </div>;
  if (screen === "done") return <div style={{
    minHeight: "100vh",
    background: C.bg,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter',sans-serif",
    color: C.text,
    textAlign: "center",
    padding: 20
  }}>
      <CheckCircle2 size={80} color={C.success} />
      <h1 style={{
      fontSize: 30,
      marginTop: 20
    }}>Interview Complete!</h1>
      <p style={{
      color: C.muted,
      maxWidth: 400,
      fontSize: 15,
      lineHeight: 1.6
    }}>Thank you for your time. Your responses have been securely recorded and will be reviewed by the recruitment team.</p>
      {violations > 0 && <p style={{
      display: "flex",
      alignItems: "center",
      gap: 5,
      color: C.warn,
      fontSize: 13,
      marginTop: 8
    }}><AlertTriangle size={14} aria-hidden="true" />{violations} tab-switch violation{violations > 1 ? "s" : ""} were recorded.</p>}
      <p style={{
      color: C.muted,
      fontSize: 13,
      marginTop: 8
    }}>You may now close this window.</p>
    </div>;
  if (screen === "join") return <JoinScreen session={session} error={error} onJoin={handleJoin} />;
  if (screen === "otp") return <OtpScreen email={session?.candidateEmail} token={token} devCode={devCode} onVerify={() => setScreen("join")} />;
  if (screen === "intro") return <AiSpeakingIntro session={session} onSkip={handleIntroDone} onStart={handleIntroDone} />;
  return <InterviewRoom token={token} question={question} sessionInfo={session} remaining={remaining} stream={stream} aiSpeaking={aiSpeaking} violations={violations} maxViolations={MAX_VIOLATIONS} tabWarning={tabWarning} onDismissWarning={() => setTabWarning(false)} offline={offline} onAnswer={handleAnswer} onFinish={handleFinish} />;
}
export { TakeInterview };
