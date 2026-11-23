import React from "react";
import { AlertTriangle, Timer } from "lucide-react";
import { C, formatTime } from "./shared";
/* ─── Question timer bar (for coding questions) ──────────────────────────── */
function QuestionTimerBar({
  seconds,
  total,
  label = "Question time limit"
}) {
  const pct = Math.max(0, seconds / total * 100);
  const isWarn = seconds <= 60;
  const isUrgent = seconds <= 20;
  const color = isUrgent ? C.danger : isWarn ? C.warn : C.teal;
  return <div style={{
    background: C.panel,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: "10px 14px",
    marginBottom: 12
  }}>
      <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6
    }}>
        <span style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        fontWeight: 700,
        color: C.muted
      }}>
          <Timer size={13} /> {label}
        </span>
        <span className={isUrgent ? "time-urgent" : ""} style={{
        fontSize: 20,
        fontWeight: 800,
        color,
        fontVariantNumeric: "tabular-nums",
        fontFamily: "'Fira Code',monospace"
      }}>
          {formatTime(seconds)}
        </span>
      </div>
      <div style={{
      height: 5,
      background: C.border,
      borderRadius: 3,
      overflow: "hidden"
    }}>
        <div style={{
        width: `${pct}%`,
        height: "100%",
        background: `linear-gradient(90deg,${color},${color}99)`,
        borderRadius: 3,
        transition: "width 1s linear,background .5s"
      }} />
      </div>
      {isWarn && <p style={{
      display: "flex",
      alignItems: "center",
      gap: 5,
      margin: "6px 0 0",
      fontSize: 11,
      color,
      fontWeight: 600
    }}>
          {isUrgent && <AlertTriangle size={13} aria-hidden="true" />}
          {isUrgent ? label.toLowerCase().includes("coding") ? "Time almost up — your code will be submitted soon!" : "Time almost up — this question will be skipped soon." : "Less than 1 minute remaining for this question."}
        </p>}
    </div>;
}
/* ─── Skip countdown ring (for MCQ / text questions) ────────────────────── */
export { QuestionTimerBar };
