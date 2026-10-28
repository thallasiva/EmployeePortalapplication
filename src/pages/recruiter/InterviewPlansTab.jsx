import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowDown, ArrowUp, CheckCircle2, ClipboardList, FilePlus2, Loader2, Plus, RefreshCw, Save, ShieldCheck, Sparkles, Trash2
} from "lucide-react";
import {
  approveInterviewPlan,
  discardInterviewPlan,
  generateInterviewPlan,
  getJobInterviewPlans,
  reviseInterviewPlan,
  saveInterviewPlan } from
"../../api/recruitment.api";
import { apiErrorToast, successToast, errorToast } from "../../utils/ToastControllers";
const PRIMARY = "#0E7C86";
const LIGHT = "#f0fbfc";
const BORDER = "#d1e8ea";
const STAGES = ["introduction", "resume_validation", "technical", "scenario", "domain"];
const TYPES = ["experience", "resume_probe", "technical", "practical", "scenario"];
const LEVELS = ["fundamental", "intermediate", "proficient", "advanced", "senior"];
const label = (s) => String(s).replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const input = { width: "100%", boxSizing: "border-box", padding: "8px 10px", border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 13, background: "#fff", fontFamily: "inherit" };
const btn = (variant = "primary") => ({
  padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
  border: variant === "ghost" ? `1px solid ${BORDER}` : "none",
  background: variant === "primary" ? PRIMARY : variant === "danger" ? "#fee2e2" : variant === "approve" ? "#059669" : "#fff",
  color: variant === "primary" || variant === "approve" ? "#fff" : variant === "danger" ? "#b91c1c" : "#374151"
});
const toEditable = (q) => ({
  question_text: q.question_text, stage: q.stage, question_type: q.question_type, skill: q.skill || "",
  difficulty: q.difficulty, time_limit_seconds: q.time_limit_seconds, points: (q.expected_points || []).join("\n")
});
const toPayload = (q) => ({
  question_text: q.question_text.trim(), stage: q.stage, question_type: q.question_type, skill: q.skill.trim() || null,
  difficulty: q.difficulty, time_limit_seconds: Number(q.time_limit_seconds) || 180,
  expected_points: q.points.split("\n").map((p) => p.trim()).filter(Boolean)
});
function QuestionEditor({ q, index, total, readOnly, onChange, onMove, onRemove }) {
  const set = (k) => (e) => onChange({ ...q, [k]: e.target.value });
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14, background: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: PRIMARY }}>Q{index + 1}</span>
        <span style={{ fontSize: 11, color: "#6b7280" }}>{label(q.stage)} · {label(q.question_type)}{q.skill ? ` · ${q.skill}` : ""} · {Math.round(q.time_limit_seconds / 60 * 10) / 10} min</span>
        {!readOnly &&
        <span style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => onMove(-1)} style={{ ...btn("ghost"), padding: 6 }}><ArrowUp size={13} /></button>
            <button type="button" aria-label="Move down" disabled={index === total - 1} onClick={() => onMove(1)} style={{ ...btn("ghost"), padding: 6 }}><ArrowDown size={13} /></button>
            <button type="button" aria-label="Remove question" onClick={onRemove} style={{ ...btn("danger"), padding: 6 }}><Trash2 size={13} /></button>
          </span>
        }
      </div>
      {readOnly ?
      <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: "#111827" }}>{q.question_text}</p> :
      <textarea aria-label={`Question ${index + 1}`} value={q.question_text} onChange={set("question_text")} rows={2} style={{ ...input, fontSize: 14, fontWeight: 600, resize: "vertical", marginBottom: 8 }} />
      }
      {!readOnly &&
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, marginBottom: 8 }}>
          <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 700 }}>Stage<select value={q.stage} onChange={set("stage")} style={input}>{STAGES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></label>
          <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 700 }}>Type<select value={q.question_type} onChange={set("question_type")} style={input}>{TYPES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></label>
          <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 700 }}>Difficulty<select value={q.difficulty} onChange={set("difficulty")} style={input}>{LEVELS.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></label>
          <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 700 }}>Skill<input value={q.skill} onChange={set("skill")} style={input} /></label>
          <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 700 }}>Time (sec)<input type="number" min={60} max={900} step={30} value={q.time_limit_seconds} onChange={set("time_limit_seconds")} style={input} /></label>
        </div>
      }
      <div style={{ background: LIGHT, borderRadius: 8, padding: "8px 10px" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: PRIMARY, marginBottom: 4 }}>SCORING GUIDE — a strong answer covers:</div>
        {readOnly ?
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{q.points.split("\n").filter(Boolean).map((p, i) => <li key={i}>{p}</li>)}</ul> :
        <textarea aria-label={`Scoring guide for question ${index + 1}, one point per line`} value={q.points} onChange={set("points")} rows={3}
        placeholder="One expected point per line" style={{ ...input, background: "#fff", resize: "vertical" }} />
        }
      </div>
    </div>);
}
export default function InterviewPlansTab({ jobs, initialJobId, canApprove, onApproved }) {
  const [jobId, setJobId] = useState(initialJobId || "");
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [questions, setQuestions] = useState([]);
  const [duration, setDuration] = useState(30);
  const [count, setCount] = useState(8);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {if (initialJobId) setJobId(String(initialJobId));}, [initialJobId]);
  const load = useCallback(async () => {
    if (!jobId) {setPlans(null);return;}
    setLoading(true);
    try {
      const p = await getJobInterviewPlans(jobId);
      setPlans(p);
      const current = p.draft || p.approved;
      setQuestions((current?.questions || []).map(toEditable));
      setDuration(current?.duration_minutes || 30);
      setDirty(false);
    } catch (err) {
      apiErrorToast(err, "load interview plans");
    } finally {
      setLoading(false);
    }
  }, [jobId]);
  useEffect(() => {load();}, [load]);
  const draft = plans?.draft;
  const approved = plans?.approved;
  const editing = Boolean(draft);
  const run = async (key, fn) => {
    setBusy(key);
    try {await fn();} catch (err) {apiErrorToast(err, key);} finally {setBusy("");}
  };
  const generate = () => run("generate", async () => {
    if (draft && dirty && !window.confirm("Replace the current draft and your unsaved edits?")) return;
    const res = await generateInterviewPlan(jobId, { question_count: count, duration_minutes: duration });
    successToast(res.message || "Draft generated");
    await load();
  });
  const save = () => run("save", async () => {
    const payload = questions.map(toPayload);
    if (payload.some((q) => q.question_text.length < 10)) return errorToast("Every question needs at least 10 characters");
    await saveInterviewPlan(draft.plan_id, { questions: payload, duration_minutes: duration });
    successToast("Draft saved");
    await load();
  });
  const approve = () => run("approve", async () => {
    if (dirty) {
      await saveInterviewPlan(draft.plan_id, { questions: questions.map(toPayload), duration_minutes: duration });
    }
    if (!window.confirm(`Approve these ${questions.length} questions? Candidates invited from now on will be asked exactly these.`)) return;
    await approveInterviewPlan(draft.plan_id);
    successToast("Interview plan approved");
    await load();
    onApproved?.();
  });
  const revise = () => run("revise", async () => {await reviseInterviewPlan(jobId);await load();});
  const discard = () => run("discard", async () => {
    if (!window.confirm("Discard this draft?")) return;
    await discardInterviewPlan(draft.plan_id);
    await load();
  });
  const update = (i, q) => {setQuestions((list) => list.map((x, j) => j === i ? q : x));setDirty(true);};
  const move = (i, d) => {setQuestions((list) => {const a = [...list];[a[i], a[i + d]] = [a[i + d], a[i]];return a;});setDirty(true);};
  const remove = (i) => {setQuestions((list) => list.filter((_, j) => j !== i));setDirty(true);};
  const add = () => {
    setQuestions((list) => [...list, { question_text: "", stage: "technical", question_type: "technical", skill: "", difficulty: "intermediate", time_limit_seconds: 180, points: "" }]);
    setDirty(true);
  };
  const job = jobs.find((j) => String(j.job_req_id) === String(jobId));
  const totalSeconds = questions.reduce((s, q) => s + (Number(q.time_limit_seconds) || 0), 0);
  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
          <label style={{ flex: "1 1 260px", fontSize: 13, fontWeight: 600, color: "#374151" }}>Job
            <select value={jobId} onChange={(e) => setJobId(e.target.value)} style={{ ...input, marginTop: 4, fontSize: 14 }}>
              <option value="">— Select a job —</option>
              {jobs.map((j) => <option key={j.job_req_id} value={j.job_req_id}>{j.job_title}{j.plan_state ? ` · ${j.plan_state}` : ""}</option>)}
            </select>
          </label>
          {jobId &&
          <>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Questions
                <select value={count} onChange={(e) => setCount(Number(e.target.value))} style={{ ...input, marginTop: 4, width: 90 }}>
                  {[5, 6, 8, 10, 12].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <button onClick={generate} disabled={!!busy} style={btn("primary")}>
                {busy === "generate" ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {draft || approved ? "Regenerate draft" : "Generate questions"}
              </button>
            </>
          }
        </div>
        {job &&
        <p style={{ margin: "10px 0 0", fontSize: 12, color: "#6b7280" }}>
            Questions are written from this job's title, description and skills{job.skill_set ? ` (${String(job.skill_set).slice(0, 120)})` : ""}. Review every question and its scoring guide before approving.
          </p>
        }
      </div>
      {!jobId ? null : loading ?
      <div style={{ textAlign: "center", padding: 40 }}><Loader2 size={24} color={PRIMARY} className="animate-spin" /></div> :
      !draft && !approved ?
      <div style={{ textAlign: "center", padding: 40, border: `1px dashed ${BORDER}`, borderRadius: 14, color: "#6b7280" }}>
          <ClipboardList size={30} color={PRIMARY} style={{ marginBottom: 8 }} />
          <p style={{ margin: 0, fontWeight: 700, color: "#111827" }}>No interview plan for this job yet</p>
          <p style={{ margin: "4px 0 0", fontSize: 13 }}>Generate questions, edit them, then {canApprove ? "approve" : "ask HR to approve"} the plan. Candidates can only be invited after approval.</p>
        </div> :
      <>
          {/* Status bar */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, marginBottom: 14,
          background: editing ? "#fffbeb" : "#f0fdf4", border: `1px solid ${editing ? "#fde68a" : "#bbf7d0"}` }}>
            {editing ?
          <span style={{ fontSize: 13, color: "#92400e" }}>
                <strong>Draft v{draft.version}</strong> · {draft.generated_by === "ai" ? "written by AI" : draft.generated_by === "manual" ? "edited copy" : "from role question bank"} — not visible to candidates until approved.
                {approved ? ` Candidates still get approved v${approved.version}.` : ""}
              </span> :
          <span style={{ fontSize: 13, color: "#166534", display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle2 size={15} /> <strong>Approved v{approved.version}</strong> by {approved.approved_by_name || "HR"} on {String(approved.approved_at || "").slice(0, 10)} — used for every new invitation.
              </span>
          }
            <span style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280" }}>
              {questions.length} questions · about {Math.round(totalSeconds / 60)} min of answering
            </span>
          </div>
          {editing &&
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "flex", alignItems: "center", gap: 6 }}>Interview time limit
                <select value={duration} onChange={(e) => {setDuration(Number(e.target.value));setDirty(true);}} style={{ ...input, width: 110 }}>
                  {[10, 15, 20, 25, 30, 45, 60].map((n) => <option key={n} value={n}>{n} minutes</option>)}
                </select>
              </label>
              <span style={{ flex: 1 }} />
              <button onClick={discard} disabled={!!busy} style={btn("ghost")}><Trash2 size={14} /> Discard draft</button>
              <button onClick={save} disabled={!!busy || !dirty} style={btn("ghost")}>{busy === "save" ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save draft</button>
              {canApprove ?
          <button onClick={approve} disabled={!!busy || !questions.length} style={btn("approve")}>
                    {busy === "approve" ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Approve plan
                  </button> :
          <span style={{ fontSize: 12, color: "#6b7280" }}>Save the draft — HR (Admin / HR Manager) approves it.</span>
          }
            </div>
        }
          {!editing &&
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
              <button onClick={revise} disabled={!!busy} style={btn("ghost")}><FilePlus2 size={14} /> Edit as new version</button>
            </div>
        }
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {questions.map((q, i) =>
          <QuestionEditor key={i} q={q} index={i} total={questions.length} readOnly={!editing}
          onChange={(nq) => update(i, nq)} onMove={(d) => move(i, d)} onRemove={() => remove(i)} />
          )}
          </div>
          {editing &&
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={add} style={btn("ghost")}><Plus size={14} /> Add question</button>
              <button onClick={load} disabled={!!busy} style={btn("ghost")}><RefreshCw size={14} /> Undo unsaved changes</button>
            </div>
        }
        </>
      }
    </div>);
}
