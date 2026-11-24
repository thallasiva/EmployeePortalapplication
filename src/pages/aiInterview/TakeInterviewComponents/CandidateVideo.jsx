import React, { useEffect, useRef, useState } from "react";
import { VideoOff, Eye } from "lucide-react";
import { C } from "./shared";
/* ─── Webcam preview and face detection ──────────────────────────────────── */
function CandidateVideo({
  stream,
  name,
  onFaceStatus
}) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState({});
  const { noFace: faceWarn, camBlocked } = status;
  useEffect(() => {
    const video = videoRef.current;
    let active = true;
    let timer;
    let detector;
    let failures = 0;
    let detectionPending = false;
    const startedAt = Date.now();
    const publish = (result, failed = false) => {
      if (!active) return;
      failures = failed ? failures + 1 : 0;
      const next = { ...result, failures };
      setStatus(next);
      onFaceStatus?.(next);
    };

    if (video) video.srcObject = stream;
    if (!stream) {
      publish({ camBlocked: true }, true);
      return;
    }

    async function check() {
      if (!stream.active || !stream.getVideoTracks().some(track => track.readyState === "live")) {
        publish({ camBlocked: true }, true);
      } else if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight
        || !stream.getVideoTracks().some(track => track.readyState === "live" && track.enabled && !track.muted)) {
        if (Date.now() - startedAt >= 4000) publish({ camBlocked: true }, true);
      } else if (typeof window.FaceDetector !== "function" || detectionPending) {
        publish({ detectionUnavailable: true }, true);
      } else {
        let deadline;
        try {
          detector ||= new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
          detectionPending = true;
          const detection = Promise.resolve().then(() => detector.detect(video))
            .finally(() => { detectionPending = false; });
          const timeout = new Promise((_, reject) => {
            deadline = setTimeout(() => reject(new Error("Face check timed out")), 3000);
          });
          const faces = await Promise.race([detection, timeout]);
          publish({ detected: faces.length > 0, noFace: faces.length === 0 }, faces.length === 0);
        } catch {
          publish({ detectionUnavailable: true }, true);
        } finally {
          clearTimeout(deadline);
        }
      }
      if (active) timer = setTimeout(check, 1800);
    }

    check();
    return () => {
      active = false;
      clearTimeout(timer);
      if (video) video.srcObject = null;
    };
  }, [stream, onFaceStatus]);
  return <div style={{
    position: "relative",
    background: "#000",
    width: "100%",
    height: "100%"
  }}>
      {stream ? <video ref={videoRef} autoPlay playsInline muted style={{
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block"
    }} /> : <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 8,
      color: C.muted
    }}>
            <VideoOff size={36} style={{
        opacity: .4
      }} /><span style={{
        fontSize: 13
      }}>Camera unavailable</span>
          </div>}
      {stream && <div style={{
      position: "absolute",
      top: 12,
      left: 12,
      background: C.danger,
      color: "#fff",
      borderRadius: 6,
      padding: "3px 9px",
      fontSize: 12,
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      gap: 5,
      userSelect: "none"
    }}>
          <span className="rec-dot" style={{
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: "#fff",
        display: "inline-block"
      }} />LIVE
        </div>}
      {camBlocked && <div className="slide-down" style={{
      position: "absolute",
      top: 44,
      left: 12,
      right: 12,
      background: "rgba(239,68,68,.88)",
      borderRadius: 8,
      padding: "8px 12px",
      fontSize: 12,
      fontWeight: 600,
      color: "#fff",
      display: "flex",
      gap: 6,
      alignItems: "center"
    }}>
          <VideoOff size={13} /> Camera appears blocked
        </div>}
      {faceWarn && !camBlocked && <div className="slide-down" style={{
      position: "absolute",
      top: 44,
      left: 12,
      right: 12,
      background: "rgba(245,158,11,.9)",
      borderRadius: 8,
      padding: "8px 12px",
      fontSize: 12,
      fontWeight: 600,
      color: "#000",
      display: "flex",
      gap: 6,
      alignItems: "center"
    }}>
          <Eye size={13} /> Please look at the camera
        </div>}
      {name && <div style={{
      position: "absolute",
      bottom: 12,
      left: 12,
      background: "rgba(0,0,0,.65)",
      backdropFilter: "blur(4px)",
      color: "#fff",
      borderRadius: 6,
      padding: "4px 10px",
      fontSize: 13,
      fontWeight: 600
    }}>{name}</div>}
    </div>;
}
/* ─── Tab-switch modal ───────────────────────────────────────────────────── */
export { CandidateVideo };
