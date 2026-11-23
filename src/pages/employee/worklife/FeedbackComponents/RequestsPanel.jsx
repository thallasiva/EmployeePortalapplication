import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getErrorMessage } from "../../../../api/client";
import { declineFeedbackRequest, listFeedbackRequests } from "../../../../api/kudosFeedback.api";
import { Avatar, Loading, PrimaryButton, SecondaryButton, timeAgo } from ".././kudosFeedbackShared";
// role 4 is "HR Manager" in the roles table (the web constant predates the rename)
import { STATUS_STYLE } from "./shared";
const RequestsPanel = ({
  refreshKey,
  onRespond,
  onChanged
}) => {
  const [incoming, setIncoming] = useState(null);
  const [outgoing, setOutgoing] = useState(null);
  const load = useCallback(() => {
    listFeedbackRequests({
      scope: "incoming"
    }).then(setIncoming).catch(() => setIncoming([]));
    listFeedbackRequests({
      scope: "outgoing"
    }).then(setOutgoing).catch(() => setOutgoing([]));
  }, []);
  useEffect(() => {
    load();
  }, [load, refreshKey]);
  const decline = async r => {
    if (!window.confirm(`Decline ${r.requester_name}'s request for feedback on "${r.topic}"?`)) return;
    try {
      await declineFeedbackRequest(r.request_id);
      toast.success("Request declined");
      load();
      onChanged?.();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not decline request"));
    }
  };
  const pending = (incoming || []).filter(r => r.status === "pending");
  return <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold  text-[#e87500] mb-2">Waiting for your feedback</h3>
        {incoming === null ? <Loading /> : pending.length === 0 ? <p className="text-sm text-slate-500 py-3">No pending requests.</p> : <ul className="divide-y divide-slate-50">
            {pending.map(r => <li key={r.request_id} className="flex flex-wrap items-center gap-3 py-3">
                <Avatar name={r.requester_name} size={38} tone="slate" />
                <div className="flex-1 min-w-[180px]">
                  <p className="text-sm font-bold text-slate-800">{r.requester_name}</p>
                  <p className="text-xs text-slate-500">{r.topic} · {timeAgo(r.created_at)}</p>
                  {r.message && <p className="text-xs text-slate-600 mt-1">“{r.message}”</p>}
                </div>
                <div className="flex gap-2">
                  <SecondaryButton onClick={() => decline(r)} className="h-9">Decline</SecondaryButton>
                  <PrimaryButton onClick={() => onRespond(r)} className="h-9">Respond</PrimaryButton>
                </div>
              </li>)}
          </ul>}
      </div>
      <div>
        <h3 className="text-sm font-bold  text-[#e87500] mb-2">Requests you sent</h3>
        {outgoing === null ? <Loading /> : outgoing.length === 0 ? <p className="text-sm text-slate-500 py-3">You haven't requested feedback yet.</p> : <ul className="divide-y divide-slate-50">
            {outgoing.map(r => <li key={r.request_id} className="flex flex-wrap items-center gap-3 py-3">
                <Avatar name={r.reviewer_name} size={34} tone="slate" />
                <div className="flex-1 min-w-[160px]">
                  <p className="text-sm font-semibold text-slate-800">{r.reviewer_name}</p>
                  <p className="text-xs text-slate-500">{r.topic} · {timeAgo(r.created_at)}</p>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[r.status]}`}>{r.status}</span>
              </li>)}
          </ul>}
      </div>
    </div>;
};
export { RequestsPanel };
