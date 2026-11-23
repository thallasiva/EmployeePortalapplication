import React from "react";
import { Code2 } from "lucide-react";
import { C } from "./shared";
/* ─── Code editor ────────────────────────────────────────────────────────── */
function CodeEditor({
  value,
  onChange,
  language = "javascript"
}) {
  return <div style={{
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    overflow: "hidden"
  }}>
      <div style={{
      background: C.panel,
      padding: "8px 14px",
      fontSize: 12,
      color: C.muted,
      display: "flex",
      alignItems: "center",
      gap: 6,
      borderBottom: `1px solid ${C.border}`
    }}>
        <Code2 size={13} /> {language}
      </div>
      <textarea value={value} onChange={e => onChange(e.target.value)} spellCheck={false} rows={11} style={{
      width: "100%",
      background: "#0a0c14",
      color: "#a8b4d0",
      fontFamily: "'Fira Code',monospace",
      fontSize: 13,
      lineHeight: 1.7,
      padding: "14px 16px",
      border: "none",
      outline: "none",
      resize: "none"
    }} />
    </div>;
}
/* ─── Interview Room ─────────────────────────────────────────────────────── */
export { CodeEditor };
