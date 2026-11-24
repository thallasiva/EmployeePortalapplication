import React, { useCallback, useEffect, useState } from "react";
import { Check, Clock3, Plus, X } from "lucide-react";
import {
  createCandidateFollowup,
  getCandidateHistory,
  listCandidateFollowups,
  updateCandidateFollowup,
} from "../../../../../api/recruitment.api";
import { apiErrorToast, successToast } from "../../../../../utils/ToastControllers";

function getStatus(value) {
  if (!value) return "";
  const parsed = typeof value === "string" ? (() => {
    try { return JSON.parse(value); } catch { return {}; }
  })() : value;
  return parsed?.status || "";
}

function CandidateActivity({ candidate }) {
  const [history, setHistory] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [dueAt, setDueAt] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const candidateId = candidate.candidate_id;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [events, tasks] = await Promise.all([
        getCandidateHistory(candidateId),
        listCandidateFollowups(candidateId),
      ]);
      setHistory(events || []);
      setFollowups(tasks || []);
    } catch (error) {
      apiErrorToast(error, "Failed to load candidate activity");
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  useEffect(() => { load(); }, [load]);

  async function addFollowup(event) {
    event.preventDefault();
    if (!dueAt || !note.trim()) return;
    setSaving(true);
    try {
      await createCandidateFollowup(candidateId, { dueAt, note: note.trim() });
      setDueAt("");
      setNote("");
      successToast("Follow-up added");
      await load();
    } catch (error) {
      apiErrorToast(error, "Failed to add follow-up");
    } finally {
      setSaving(false);
    }
  }

  async function changeFollowupStatus(followup, status) {
    try {
      await updateCandidateFollowup(candidateId, followup.followup_id, status);
      await load();
    } catch (error) {
      apiErrorToast(error, "Failed to update follow-up");
    }
  }

  return (
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <section className="rounded-lg border border-gray-200 p-3">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-600">Candidate activity history</h3>
        {loading ? <p className="text-xs text-gray-400">Loading activity…</p> : history.length === 0
          ? <p className="text-xs text-gray-400">No recorded activity yet.</p>
          : <ul className="space-y-3">
            {history.map((event) => {
              const from = getStatus(event.old_value);
              const to = getStatus(event.new_value);
              return <li key={event.log_id} className="border-l-2 border-orange-200 pl-3">
                <div className="text-xs font-semibold text-gray-800">
                  {from && to ? `${from} → ${to}` : String(event.action || "").replace(/_/g, " ")}
                </div>
                <div className="mt-0.5 text-[10px] text-gray-500">
                  {new Date(event.performed_at).toLocaleString()} · User {event.performed_by}
                </div>
              </li>;
            })}
          </ul>}
      </section>

      <section className="rounded-lg border border-gray-200 p-3">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-600">Recruiter follow-ups</h3>
        <form onSubmit={addFollowup} className="mb-3 space-y-2">
          <input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)}
            required aria-label="Follow-up due date" className="h-9 w-full rounded-md border border-gray-200 px-2 text-xs" />
          <textarea value={note} onChange={(event) => setNote(event.target.value)} required maxLength={2000}
            placeholder="Follow-up notes" aria-label="Follow-up notes" rows={2}
            className="w-full rounded-md border border-gray-200 p-2 text-xs" />
          <button type="submit" disabled={saving} className="inline-flex items-center gap-1 rounded-md bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
            <Plus size={13} /> {saving ? "Saving…" : "Add follow-up"}
          </button>
        </form>
        {loading ? <p className="text-xs text-gray-400">Loading follow-ups…</p> : followups.length === 0
          ? <p className="text-xs text-gray-400">No follow-ups scheduled.</p>
          : <ul className="space-y-2">
            {followups.map((followup) => <li key={followup.followup_id} className="rounded-md bg-gray-50 p-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="whitespace-pre-wrap text-xs text-gray-800">{followup.note}</div>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-500">
                    <Clock3 size={11} /> {new Date(followup.due_at).toLocaleString()} · {followup.assignee_name}
                  </div>
                </div>
                {followup.status === "open" && <div className="flex gap-1">
                  <button type="button" onClick={() => changeFollowupStatus(followup, "completed")} title="Complete follow-up" aria-label="Complete follow-up"
                    className="rounded p-1 text-green-700 hover:bg-green-100"><Check size={14} /></button>
                  <button type="button" onClick={() => changeFollowupStatus(followup, "cancelled")} title="Cancel follow-up" aria-label="Cancel follow-up"
                    className="rounded p-1 text-red-600 hover:bg-red-100"><X size={14} /></button>
                </div>}
              </div>
              {followup.status !== "open" && <div className="mt-1 text-[10px] font-semibold uppercase text-gray-500">{followup.status}</div>}
            </li>)}
          </ul>}
      </section>
    </div>
  );
}

export default CandidateActivity;
