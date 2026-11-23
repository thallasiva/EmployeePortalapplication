import React, { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { C, speak } from "./shared";
import { AiAvatar } from "./AiAvatar";
/* ─── Avya intro ─────────────────────────────────────────────────────────── */
function AiSpeakingIntro({
  session,
  onSkip,
  onStart
}) {
  const jobTitle = session?.jobTitle || "the role";
  const candidateName = session?.candidateName || "there";
  useEffect(() => {
    speak(`Hello ${candidateName}. Welcome to your AI technical interview for the ${jobTitle} position. We will start with your introduction, followed by questions about your experience, technical concepts, real-time scenarios, and a coding exercise. Are you ready to begin?`);
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [candidateName, jobTitle]);
  return <div style={{
    minHeight: "100vh",
    background: C.bg,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter',sans-serif",
    color: C.text,
    position: "relative"
  }}>
      <p style={{
      color: C.muted,
      fontSize: 14,
      marginBottom: 50
    }}>AI Interview Assistant · Technical interviewer · {jobTitle}</p>
      <AiAvatar size={160} speaking={true} />
      <p style={{
      color: C.text,
      fontSize: 20,
      fontWeight: 700,
      marginTop: 40
    }}>Avya</p>
      <p style={{
      color: C.muted,
      fontSize: 14
    }}>AI Interviewer · HRMS</p>
      <div style={{
      marginTop: 24,
      textAlign: "center",
      maxWidth: 440,
      padding: "0 20px"
    }}>
        <p style={{
        color: C.text,
        fontSize: 15,
        lineHeight: 1.6,
        margin: "0 0 8px"
      }}>
          Welcome, {candidateName}. Your interview is for the <strong>{jobTitle}</strong> position.
        </p>
        <p style={{
        color: C.muted,
        fontSize: 13,
        lineHeight: 1.6,
        margin: 0
      }}>
          {session?.resumeAvailable ? "Your resume has been parsed and will inform role-specific questions." : "No parsed resume is attached; questions will focus on your answers and the role requirements."}
        </p>
      </div>
      <button className="btn-primary" onClick={onStart} style={{
      marginTop: 28
    }}>
        I’m ready — start interview <ArrowRight size={16} aria-hidden="true" />
      </button>
      <button onClick={onSkip} style={{
      marginTop: 10,
      background: "none",
      border: `1px solid ${C.border}`,
      borderRadius: 20,
      color: C.muted,
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 600,
      padding: "6px 16px",
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }}>
        Skip introduction <ArrowRight size={13} aria-hidden="true" />
      </button>
    </div>;
}
/* ─── Main ───────────────────────────────────────────────────────────────── */
export { AiSpeakingIntro };
