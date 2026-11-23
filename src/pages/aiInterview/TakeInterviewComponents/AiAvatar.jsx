import React from "react";
import { C } from "./shared";
/* ─── AI Avatar ──────────────────────────────────────────────────────────── */
function AiAvatar({
  size = 80,
  speaking = false
}) {
  const r = size / 2;
  return <div style={{
    position: "relative",
    width: size,
    height: size,
    flexShrink: 0
  }}>
      {speaking && <>
        <div className="ai-ring-1" style={{
        position: "absolute",
        inset: -r * .6,
        borderRadius: "50%",
        border: `2px solid ${C.accent}44`
      }} />
        <div className="ai-ring-2" style={{
        position: "absolute",
        inset: -r * .35,
        borderRadius: "50%",
        border: `2px solid ${C.accent}33`
      }} />
        <div className="ai-ring-3" style={{
        position: "absolute",
        inset: -r * .1,
        borderRadius: "50%",
        border: `2px solid ${C.accent}22`
      }} />
      </>}
      <div className={speaking ? "ai-pulse" : ""} style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: `linear-gradient(135deg,${C.accent}cc,${C.teal}cc)`,
      border: `3px solid ${speaking ? C.accent : C.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      zIndex: 1,
      overflow: "hidden",
      boxShadow: speaking ? `0 0 40px ${C.accent}55` : "none",
      transition: "box-shadow .4s"
    }}>
        <svg width={size * .62} height={size * .62} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="22" r="14" fill="white" fillOpacity=".28" />
          <ellipse cx="32" cy="55" rx="20" ry="12" fill="white" fillOpacity=".18" />
          <circle cx="26" cy="20" r="2.8" fill="white" />
          <circle cx="38" cy="20" r="2.8" fill="white" />
          <path d="M26 30 Q32 36 38 30" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    </div>;
}
/* ─── Question timer bar (for coding questions) ──────────────────────────── */
export { AiAvatar };
