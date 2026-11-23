import React from "react";
import { C } from "./shared";
/* ─── MCQ ────────────────────────────────────────────────────────────────── */
function MCQOptions({
  options,
  selected,
  onChange
}) {
  return <div style={{
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 10
  }}>
      {options.map((opt, i) => {
      const letter = String.fromCharCode(65 + i);
      const isSel = selected === opt;
      return <button key={i} onClick={() => onChange(opt)} style={{
        background: isSel ? `${C.accent}22` : "transparent",
        border: `1.5px solid ${isSel ? C.accent : C.border}`,
        borderRadius: 10,
        padding: "12px 16px",
        cursor: "pointer",
        color: isSel ? C.accent : C.text,
        fontWeight: isSel ? 700 : 400,
        fontSize: 14,
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: 12,
        transition: "all .2s"
      }}>
            <span style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: isSel ? C.accent : C.border,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0
        }}>{letter}</span>
            {opt}
          </button>;
    })}
    </div>;
}
/* ─── Code editor ────────────────────────────────────────────────────────── */
export { MCQOptions };
