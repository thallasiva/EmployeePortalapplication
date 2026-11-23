import React from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { PRIMARY, LIGHT, BORDER, STAGES, TYPES, LEVELS, label, input, btn } from "./shared";
function QuestionEditor({
  q,
  index,
  total,
  readOnly,
  onChange,
  onMove,
  onRemove
}) {
  const set = k => e => onChange({
    ...q,
    [k]: e.target.value
  });
  return <div style={{
    border: `1px solid ${BORDER}`,
    borderRadius: 12,
    padding: 14,
    background: "#fff"
  }}>
      <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 8
    }}>
        <span style={{
        fontSize: 12,
        fontWeight: 800,
        color: PRIMARY
      }}>Q{index + 1}</span>
        <span style={{
        fontSize: 11,
        color: "#6b7280"
      }}>{label(q.stage)} · {label(q.question_type)}{q.skill ? ` · ${q.skill}` : ""} · {Math.round(q.time_limit_seconds / 60 * 10) / 10} min</span>
        {!readOnly && <span style={{
        marginLeft: "auto",
        display: "flex",
        gap: 4
      }}>
            <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => onMove(-1)} style={{
          ...btn("ghost"),
          padding: 6
        }}><ArrowUp size={13} /></button>
            <button type="button" aria-label="Move down" disabled={index === total - 1} onClick={() => onMove(1)} style={{
          ...btn("ghost"),
          padding: 6
        }}><ArrowDown size={13} /></button>
            <button type="button" aria-label="Remove question" onClick={onRemove} style={{
          ...btn("danger"),
          padding: 6
        }}><Trash2 size={13} /></button>
          </span>}
      </div>
      {readOnly ? <p style={{
      margin: "0 0 8px",
      fontSize: 14,
      fontWeight: 600,
      color: "#111827"
    }}>{q.question_text}</p> : <textarea aria-label={`Question ${index + 1}`} value={q.question_text} onChange={set("question_text")} rows={2} style={{
      ...input,
      fontSize: 14,
      fontWeight: 600,
      resize: "vertical",
      marginBottom: 8
    }} />}
      {!readOnly && <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
      gap: 8,
      marginBottom: 8
    }}>
          <label style={{
        fontSize: 11,
        color: "#6b7280",
        fontWeight: 700
      }}>Stage<select value={q.stage} onChange={set("stage")} style={input}>{STAGES.map(s => <option key={s} value={s}>{label(s)}</option>)}</select></label>
          <label style={{
        fontSize: 11,
        color: "#6b7280",
        fontWeight: 700
      }}>Type<select value={q.question_type} onChange={set("question_type")} style={input}>{TYPES.map(s => <option key={s} value={s}>{label(s)}</option>)}</select></label>
          <label style={{
        fontSize: 11,
        color: "#6b7280",
        fontWeight: 700
      }}>Difficulty<select value={q.difficulty} onChange={set("difficulty")} style={input}>{LEVELS.map(s => <option key={s} value={s}>{label(s)}</option>)}</select></label>
          <label style={{
        fontSize: 11,
        color: "#6b7280",
        fontWeight: 700
      }}>Skill<input value={q.skill} onChange={set("skill")} style={input} /></label>
          <label style={{
        fontSize: 11,
        color: "#6b7280",
        fontWeight: 700
      }}>Time (sec)<input type="number" min={60} max={900} step={30} value={q.time_limit_seconds} onChange={set("time_limit_seconds")} style={input} /></label>
        </div>}
      <div style={{
      background: LIGHT,
      borderRadius: 8,
      padding: "8px 10px"
    }}>
        <div style={{
        fontSize: 11,
        fontWeight: 800,
        color: PRIMARY,
        marginBottom: 4
      }}>SCORING GUIDE — a strong answer covers:</div>
        {readOnly ? <ul style={{
        margin: 0,
        paddingLeft: 18,
        fontSize: 13,
        color: "#374151",
        lineHeight: 1.6
      }}>{q.points.split("\n").filter(Boolean).map((p, i) => <li key={i}>{p}</li>)}</ul> : <textarea aria-label={`Scoring guide for question ${index + 1}, one point per line`} value={q.points} onChange={set("points")} rows={3} placeholder="One expected point per line" style={{
        ...input,
        background: "#fff",
        resize: "vertical"
      }} />}
      </div>
    </div>;
}
export { QuestionEditor };
