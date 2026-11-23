import React from "react";
import { C } from "./shared";
/* ─── Skip countdown ring (for MCQ / text questions) ────────────────────── */
function SkipRing({
  seconds,
  total,
  onSkip
}) {
  const r = 20,
    circ = 2 * Math.PI * r;
  const dash = circ * (1 - Math.max(0, seconds) / total);
  const color = seconds <= 10 ? C.danger : seconds <= 20 ? C.warn : C.muted;
  return <div title={`Auto-skip in ${seconds}s`} onClick={onSkip} style={{
    position: "relative",
    width: 52,
    height: 52,
    cursor: "pointer",
    flexShrink: 0
  }}>
      <svg width="52" height="52" style={{
      transform: "rotate(-90deg)"
    }}>
        <circle cx="26" cy="26" r={r} fill="none" stroke={C.border} strokeWidth="3" />
        <circle cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="3" strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round" style={{
        transition: "stroke-dashoffset 1s linear,stroke .3s"
      }} />
      </svg>
      <div style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }}>
        <span style={{
        fontSize: 13,
        fontWeight: 800,
        color,
        lineHeight: 1
      }}>{seconds}</span>
        <span style={{
        fontSize: 7,
        color: C.muted,
        lineHeight: 1
      }}>skip</span>
      </div>
    </div>;
}
/* ─── Webcam + canvas face detection ─────────────────────────────────────── */
export { SkipRing };
