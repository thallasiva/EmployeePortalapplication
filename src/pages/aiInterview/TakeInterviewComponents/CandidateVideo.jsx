import React, { useEffect, useRef, useState } from "react";
import { VideoOff, Eye } from "lucide-react";
import { C } from "./shared";
/* ─── Webcam + canvas face detection ─────────────────────────────────────── */
function CandidateVideo({
  stream,
  name,
  onFaceStatus
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [faceWarn, setFaceWarn] = useState(false);
  const [camBlocked, setCamBlocked] = useState(false);
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);
  useEffect(() => {
    if (!stream) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const video = videoRef.current;
    async function detectFace() {
      if (!video || video.readyState < 2) return;
      if (typeof window.FaceDetector === "function") {
        try {
          const faces = await new window.FaceDetector({
            fastMode: true,
            maxDetectedFaces: 2
          }).detect(video);
          const noFace = faces.length === 0;
          setCamBlocked(false);
          setFaceWarn(noFace);
          onFaceStatus?.({
            noFace,
            camBlocked: false
          });
          return;
        } catch (_) {
          // Fall through to the compatibility detector below.
        }
      }
      ctx.drawImage(video, 0, 0, 160, 120);
      const {
        data
      } = ctx.getImageData(30, 10, 100, 100);
      let skinPx = 0;
      const totalPx = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i],
          g = data[i + 1],
          b = data[i + 2];
        const bright = (r + g + b) / 3;
        const isSkin = r > 60 && g > 40 && b > 20 && r > b && r > g && r - Math.min(g, b) > 15 && bright > 40;
        if (isSkin) skinPx++;
      }
      const skinRatio = skinPx / totalPx;
      const tooBlack = skinPx < 5;
      const noFace = skinRatio < 0.015;
      setCamBlocked(tooBlack);
      setFaceWarn(noFace && !tooBlack);
      onFaceStatus?.({
        noFace,
        camBlocked: tooBlack
      });
    }
    detectFace();
    const id = setInterval(detectFace, 2500);
    return () => clearInterval(id);
  }, [stream, onFaceStatus]);
  return <div style={{
    position: "relative",
    background: "#000",
    width: "100%",
    height: "100%"
  }}>
      <canvas ref={canvasRef} width="160" height="120" style={{
      display: "none"
    }} />
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
      }} />REC
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
