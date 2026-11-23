import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ClipboardList, FilePlus2, Loader2, Plus, RefreshCw, Save, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { approveInterviewPlan, discardInterviewPlan, generateInterviewPlan, getJobInterviewPlans, reviseInterviewPlan, saveInterviewPlan } from "../../../api/recruitment.api";
import { apiErrorToast, successToast, errorToast } from "../../../utils/ToastControllers";
import { PRIMARY, BORDER, input, btn, toEditable, toPayload } from "./shared";
import { QuestionEditor } from "./QuestionEditor";
function InterviewPlansTab({
  jobs,
  initialJobId,
  canApprove,
  onApproved
}) {
  const [jobId, setJobId] = useState(initialJobId || "");
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [questions, setQuestions] = useState([]);
  const [duration, setDuration] = useState(30);
  const [count, setCount] = useState(8);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (initialJobId) setJobId(String(initialJobId));
  }, [initialJobId]);
  const load = useCallback(async () => {
    if (!jobId) {
      setPlans(null);
      return;
    }
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
  useEffect(() => {
    load();
  }, [load]);
  const draft = plans?.draft;
  const approved = plans?.approved;
  const editing = Boolean(draft);
  const run = async (key, fn) => {
    setBusy(key);
    try {
      await fn();
    } catch (err) {
      apiErrorToast(err, key);
    } finally {
      setBusy("");
    }
  };
  const generate = () => run("generate", async () => {
    if (draft && dirty && !window.confirm("Replace the current draft and your unsaved edits?")) return;
    const res = await generateInterviewPlan(jobId, {
      question_count: count,
      duration_minutes: duration
    });
    successToast(res.message || "Draft generated");
    await load();
  });
  const save = () => run("save", async () => {
    const payload = questions.map(toPayload);
    if (payload.some(q => q.question_text.length < 10)) return errorToast("Every question needs at least 10 characters");
    await saveInterviewPlan(draft.plan_id, {
      questions: payload,
      duration_minutes: duration
    });
    successToast("Draft saved");
    await load();
  });
  const approve = () => run("approve", async () => {
    if (dirty) {
      await saveInterviewPlan(draft.plan_id, {
        questions: questions.map(toPayload),
        duration_minutes: duration
      });
    }
    if (!window.confirm(`Approve these ${questions.length} questions? Candidates invited from now on will be asked exactly these.`)) return;
    await approveInterviewPlan(draft.plan_id);
    successToast("Interview plan approved");
    await load();
    onApproved?.();
  });
  const revise = () => run("revise", async () => {
    await reviseInterviewPlan(jobId);
    await load();
  });
  const discard = () => run("discard", async () => {
    if (!window.confirm("Discard this draft?")) return;
    await discardInterviewPlan(draft.plan_id);
    await load();
  });
  const update = (i, q) => {
    setQuestions(list => list.map((x, j) => j === i ? q : x));
    setDirty(true);
  };
  const move = (i, d) => {
    setQuestions(list => {
      const a = [...list];
      [a[i], a[i + d]] = [a[i + d], a[i]];
      return a;
    });
    setDirty(true);
  };
  const remove = i => {
    setQuestions(list => list.filter((_, j) => j !== i));
    setDirty(true);
  };
  const add = () => {
    setQuestions(list => [...list, {
      question_text: "",
      stage: "technical",
      question_type: "technical",
      skill: "",
      difficulty: "intermediate",
      time_limit_seconds: 180,
      points: ""
    }]);
    setDirty(true);
  };
  const job = jobs.find(j => String(j.job_req_id) === String(jobId));
  const totalSeconds = questions.reduce((s, q) => s + (Number(q.time_limit_seconds) || 0), 0);
  return <div style={{
    maxWidth: 900
  }}>
      <div style={{
      background: "#fff",
      border: `1px solid ${BORDER}`,
      borderRadius: 14,
      padding: 20,
      marginBottom: 16
    }}>
        <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "flex-end"
      }}>
          <label style={{
          flex: "1 1 260px",
          fontSize: 13,
          fontWeight: 600,
          color: "#374151"
        }}>Job
            <select value={jobId} onChange={e => setJobId(e.target.value)} style={{
            ...input,
            marginTop: 4,
            fontSize: 14
          }}>
              <option value="">— Select a job —</option>
              {jobs.map(j => <option key={j.job_req_id} value={j.job_req_id}>{j.job_title}{j.plan_state ? ` · ${j.plan_state}` : ""}</option>)}
            </select>
          </label>
          {jobId && <>
              <label style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#374151"
          }}>Questions
                <select value={count} onChange={e => setCount(Number(e.target.value))} style={{
              ...input,
              marginTop: 4,
              width: 90
            }}>
                  {[5, 6, 8, 10, 12].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <button onClick={generate} disabled={!!busy} style={btn("primary")}>
                {busy === "generate" ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {draft || approved ? "Regenerate draft" : "Generate questions"}
              </button>
            </>}
        </div>
        {job && <p style={{
        margin: "10px 0 0",
        fontSize: 12,
        color: "#6b7280"
      }}>
            Questions are written from this job's title, description and skills{job.skill_set ? ` (${String(job.skill_set).slice(0, 120)})` : ""}. Review every question and its scoring guide before approving.
          </p>}
      </div>
      {!jobId ? null : loading ? <div style={{
      textAlign: "center",
      padding: 40
    }}><Loader2 size={24} color={PRIMARY} className="animate-spin" /></div> : !draft && !approved ? <div style={{
      textAlign: "center",
      padding: 40,
      border: `1px dashed ${BORDER}`,
      borderRadius: 14,
      color: "#6b7280"
    }}>
          <ClipboardList size={30} color={PRIMARY} style={{
        marginBottom: 8
      }} />
          <p style={{
        margin: 0,
        fontWeight: 700,
        color: "#111827"
      }}>No interview plan for this job yet</p>
          <p style={{
        margin: "4px 0 0",
        fontSize: 13
      }}>Generate questions, edit them, then {canApprove ? "approve" : "ask HR to approve"} the plan. Candidates can only be invited after approval.</p>
        </div> : <>
          {/* Status bar */}
          <div style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 10,
        padding: "12px 16px",
        borderRadius: 12,
        marginBottom: 14,
        background: editing ? "#fffbeb" : "#f0fdf4",
        border: `1px solid ${editing ? "#fde68a" : "#bbf7d0"}`
      }}>
            {editing ? <span style={{
          fontSize: 13,
          color: "#92400e"
        }}>
                <strong>Draft v{draft.version}</strong> · {draft.generated_by === "ai" ? "written by AI" : draft.generated_by === "manual" ? "edited copy" : "from role question bank"} — not visible to candidates until approved.
                {approved ? ` Candidates still get approved v${approved.version}.` : ""}
              </span> : <span style={{
          fontSize: 13,
          color: "#166534",
          display: "flex",
          alignItems: "center",
          gap: 6
        }}>
                <CheckCircle2 size={15} /> <strong>Approved v{approved.version}</strong> by {approved.approved_by_name || "HR"} on {String(approved.approved_at || "").slice(0, 10)} — used for every new invitation.
              </span>}
            <span style={{
          marginLeft: "auto",
          fontSize: 12,
          color: "#6b7280"
        }}>
              {questions.length} questions · about {Math.round(totalSeconds / 60)} min of answering
            </span>
          </div>
          {editing && <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        alignItems: "center",
        marginBottom: 14
      }}>
              <label style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#374151",
          display: "flex",
          alignItems: "center",
          gap: 6
        }}>Interview time limit
                <select value={duration} onChange={e => {
            setDuration(Number(e.target.value));
            setDirty(true);
          }} style={{
            ...input,
            width: 110
          }}>
                  {[10, 15, 20, 25, 30, 45, 60].map(n => <option key={n} value={n}>{n} minutes</option>)}
                </select>
              </label>
              <span style={{
          flex: 1
        }} />
              <button onClick={discard} disabled={!!busy} style={btn("ghost")}><Trash2 size={14} /> Discard draft</button>
              <button onClick={save} disabled={!!busy || !dirty} style={btn("ghost")}>{busy === "save" ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save draft</button>
              {canApprove ? <button onClick={approve} disabled={!!busy || !questions.length} style={btn("approve")}>
                    {busy === "approve" ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Approve plan
                  </button> : <span style={{
          fontSize: 12,
          color: "#6b7280"
        }}>Save the draft — HR (Admin / HR Manager) approves it.</span>}
            </div>}
          {!editing && <div style={{
        display: "flex",
        justifyContent: "flex-end",
        marginBottom: 14
      }}>
              <button onClick={revise} disabled={!!busy} style={btn("ghost")}><FilePlus2 size={14} /> Edit as new version</button>
            </div>}
          <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 10
      }}>
            {questions.map((q, i) => <QuestionEditor key={i} q={q} index={i} total={questions.length} readOnly={!editing} onChange={nq => update(i, nq)} onMove={d => move(i, d)} onRemove={() => remove(i)} />)}
          </div>
          {editing && <div style={{
        display: "flex",
        gap: 8,
        marginTop: 12
      }}>
              <button onClick={add} style={btn("ghost")}><Plus size={14} /> Add question</button>
              <button onClick={load} disabled={!!busy} style={btn("ghost")}><RefreshCw size={14} /> Undo unsaved changes</button>
            </div>}
        </>}
    </div>;
}
export { InterviewPlansTab };
