import React from "react";
import { Clock, Building2 } from "lucide-react";
import { C } from "./shared";
import { AiAvatar } from "./AiAvatar";
import { CandidateVideo } from "./CandidateVideo";
/* ─── Join screen ────────────────────────────────────────────────────────── */
function JoinScreen({
  session,
  error,
  stream,
  cameraStatus,
  cameraBusy,
  onFaceStatus,
  onCameraRetry,
  onManualReview,
  onJoin
}) {
  const mins = Math.round((session?.durationSeconds || 0) / 60);
  const { detected, noFace, camBlocked, detectionUnavailable, failures } = cameraStatus;
  const canReview = failures >= 3;
  const cameraMessage = detected ? "Face detected. You can start the interview."
    : camBlocked ? "The camera stream is inactive. Check the camera and retry."
    : detectionUnavailable ? "Automatic face detection is unavailable in this browser."
    : noFace ? "No face detected. Center your face and improve the lighting if needed."
    : "Checking your camera and face position…";
  return <div style={{
    minHeight: "100vh",
    background: `radial-gradient(ellipse at 30% 20%,#7c3d00 0%,${C.bg} 65%)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter',sans-serif"
  }}>
      <div className="fade-in" style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 22,
      padding: "44px 38px",
      width: 350,
      textAlign: "center",
      boxShadow: "0 32px 80px rgba(0,0,0,.55)"
    }}>
        <div style={{
        fontSize: 11,
        color: C.muted,
        fontWeight: 700,
        letterSpacing: 2,
        textTransform: "uppercase",
        marginBottom: 6
      }}>AI Interview</div>
        <h1 style={{
        fontSize: 26,
        fontWeight: 800,
        color: C.text,
        margin: "0 0 10px"
      }}>{session?.jobTitle || "Interview"}</h1>
        <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        color: C.muted,
        fontSize: 13,
        marginBottom: 30
      }}>
          <span style={{
          display: "flex",
          alignItems: "center",
          gap: 4
        }}><Building2 size={14} aria-hidden="true" />{session?.company || "HRMS"}</span>
          <span style={{
          color: C.border
        }}>•</span>
          <span><Clock size={12} style={{
            verticalAlign: "middle",
            marginRight: 3
          }} />{mins} min{mins !== 1 ? "s" : ""}</span>
        </div>
        <div style={{
        position: "relative",
        display: "inline-block",
        marginBottom: 18
      }}>
          <AiAvatar size={100} />
          <div style={{
          position: "absolute",
          bottom: -6,
          left: "50%",
          transform: "translateX(-50%)",
          background: C.accent,
          color: "#fff",
          borderRadius: 20,
          padding: "2px 12px",
          fontSize: 11,
          fontWeight: 700,
          whiteSpace: "nowrap"
        }}>Avya</div>
        </div>
        <p style={{
        color: C.muted,
        fontSize: 13,
        margin: "18px 0 28px"
      }}>Your AI interviewer is ready.<br />Make sure your camera and microphone are on.</p>
        {stream && <div style={{ height: 180, overflow: "hidden", borderRadius: 12 }}>
          <CandidateVideo stream={stream} onFaceStatus={onFaceStatus} />
        </div>}
        {stream && <p role="status" style={{ color: detected ? C.success : C.warn, fontSize: 13 }}>
          {cameraMessage}
        </p>}
        {error && <p role="alert" style={{
        color: C.danger,
        fontSize: 12,
        lineHeight: 1.5,
        margin: "-14px 0 16px"
      }}>{error}</p>}
        <button className="btn-primary" disabled={cameraBusy || Boolean(stream && !detected && !canReview)}
          onClick={detected ? onJoin : onCameraRetry} style={{
        width: "100%",
        padding: "14px 0",
        fontSize: 16
      }}>{detected ? "Join Interview" : stream || canReview ? "Retry camera" : "Enable camera"}</button>
        {canReview && !detected && <button type="button" className="btn-primary" disabled={cameraBusy}
          onClick={onManualReview} style={{ width: "100%", marginTop: 8, padding: "12px 0" }}>
          Continue with recruiter review
        </button>}
        <p style={{
        color: C.muted,
        fontSize: 11,
        marginTop: 14
      }}>Responses are recorded and reviewed by the recruitment team.</p>
      </div>
    </div>;
}
/* ─── OTP screen ─────────────────────────────────────────────────────────── */
export { JoinScreen };
