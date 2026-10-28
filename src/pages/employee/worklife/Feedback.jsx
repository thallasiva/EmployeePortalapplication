import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { BarChart3, Inbox, MessageSquare, Send, Star, Users, ArrowRight } from "lucide-react";
import { getStoredUser, resolveRoleForUser, ROLE_REPORTING_MANAGER, ROLE_RECRUITER_LEAD } from "../../../data/auth";
import { getErrorMessage } from "../../../api/client";
import { declineFeedbackRequest, getKfSummary, listFeedback, listFeedbackRequests } from "../../../api/kudosFeedback.api";
import {
  Avatar,
  EmptyState,
  FEEDBACK_TYPES,
  FeedbackReport,
  GiveFeedbackModal,
  GiveKudosModal,
  Loading,
  PrimaryButton,
  RequestFeedbackModal,
  SecondaryButton,
  StatCard,
  Tabs,
  TYPE_STYLE,
  timeAgo } from
"./kudosFeedbackShared";
// role 4 is "HR Manager" in the roles table (the web constant predates the rename)
const ROLE_HR_MANAGER = ROLE_RECRUITER_LEAD;
const FeedbackItem = ({ f, perspective }) => {
  const person = perspective === "sent" ? f.to_name : f.from_name;
  const role = perspective === "sent" ? f.to_designation : f.from_is_manager ? "Your manager" : f.from_designation;
  return (
    <article className="flex gap-4 py-4 border-b border-slate-50 last:border-0">
      <Avatar name={person} size={42} tone="slate" />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm">
            {perspective === "sent" && <span className="text-slate-500">To </span>}
            {perspective === "team" ?
            <><strong className="text-slate-900">{f.from_name}</strong><ArrowRight size={13} className="inline mx-1 text-slate-400" /><strong className="text-slate-900">{f.to_name}</strong></> :
            <strong className="text-slate-900">{person}</strong>
            }
            {perspective !== "team" && role && <span className="text-slate-500"> · {role}</span>}
          </p>
          <div className="flex items-center gap-1.5">
            {f.is_anonymous && f.from_name !== "Anonymous" ? <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Anonymous</span> : null}
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${TYPE_STYLE[f.feedback_type].badge}`}>{f.feedback_type}</span>
          </div>
        </div>
        {(f.request_topic || f.category_name) &&
        <p className="text-xs text-slate-500 mt-1">
            {f.request_topic ? `Requested: ${f.request_topic}` : ""}
            {f.request_topic && f.category_name ? " · " : ""}
            {f.category_name || ""}
          </p>
        }
        <p className="text-sm text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line break-words">{f.message}</p>
        <p className="text-xs text-slate-400 mt-2">{timeAgo(f.created_at)}</p>
      </div>
    </article>);
};
const FeedbackList = ({ scope, perspective, emptyAction }) => {
  const [type, setType] = useState("");
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await listFeedback({ scope, type: type || undefined, page, limit: 20 });
      setRows((prev) => page === 1 ? res.data : [...prev, ...res.data]);
      setMeta(res.meta);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not load feedback"));
    } finally {
      setLoading(false);
    }
  }, [scope, type]);
  useEffect(() => {load(1);}, [load]);
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2" role="group" aria-label="Filter by type">
        {["", ...FEEDBACK_TYPES].map((t) =>
        <button
          key={t || "all"}
          onClick={() => setType(t)}
          aria-pressed={type === t}
          className={`h-8 px-3 rounded-full text-xs font-bold transition-colors ${
          type === t ? "bg-slate-900 text-white" : t ? TYPE_STYLE[t].badge : "bg-slate-100 text-slate-600"}`
          }>
            {t || "All"}
          </button>
        )}
      </div>
      {loading && rows.length === 0 ? <Loading /> :
      rows.length === 0 ?
      <EmptyState
        icon={<MessageSquare className="text-[#f18200]" />}
        title={type ? `No ${type.toLowerCase()} feedback` : "Nothing here yet"}
        text={perspective === "received" ? "Ask your teammates for feedback to grow faster." : undefined}
        action={emptyAction} /> :
      <>
          {rows.map((f) => <FeedbackItem key={f.feedback_id} f={f} perspective={perspective} />)}
          {meta && meta.page < meta.totalPages &&
        <div className="flex justify-center pt-3">
              <SecondaryButton onClick={() => load(meta.page + 1)} disabled={loading}>Load more</SecondaryButton>
            </div>
        }
        </>
      }
    </div>);
};
const STATUS_STYLE = {
  pending: "bg-orange-50 text-orange-700",
  completed: "bg-emerald-50 text-emerald-700",
  declined: "bg-slate-100 text-slate-500"
};
const RequestsPanel = ({ refreshKey, onRespond, onChanged }) => {
  const [incoming, setIncoming] = useState(null);
  const [outgoing, setOutgoing] = useState(null);
  const load = useCallback(() => {
    listFeedbackRequests({ scope: "incoming" }).then(setIncoming).catch(() => setIncoming([]));
    listFeedbackRequests({ scope: "outgoing" }).then(setOutgoing).catch(() => setOutgoing([]));
  }, []);
  useEffect(() => {load();}, [load, refreshKey]);
  const decline = async (r) => {
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
  const pending = (incoming || []).filter((r) => r.status === "pending");
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-2">Waiting for your feedback</h3>
        {incoming === null ? <Loading /> :
        pending.length === 0 ?
        <p className="text-sm text-slate-500 py-3">No pending requests.</p> :
        <ul className="divide-y divide-slate-50">
            {pending.map((r) =>
          <li key={r.request_id} className="flex flex-wrap items-center gap-3 py-3">
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
              </li>
          )}
          </ul>
        }
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-2">Requests you sent</h3>
        {outgoing === null ? <Loading /> :
        outgoing.length === 0 ?
        <p className="text-sm text-slate-500 py-3">You haven't requested feedback yet.</p> :
        <ul className="divide-y divide-slate-50">
            {outgoing.map((r) =>
          <li key={r.request_id} className="flex flex-wrap items-center gap-3 py-3">
                <Avatar name={r.reviewer_name} size={34} tone="slate" />
                <div className="flex-1 min-w-[160px]">
                  <p className="text-sm font-semibold text-slate-800">{r.reviewer_name}</p>
                  <p className="text-xs text-slate-500">{r.topic} · {timeAgo(r.created_at)}</p>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[r.status]}`}>{r.status}</span>
              </li>
          )}
          </ul>
        }
      </div>
    </div>);
};
const Feedback = () => {
  const role = resolveRoleForUser(getStoredUser());
  const isManager = role === ROLE_REPORTING_MANAGER;
  const isHr = role === ROLE_HR_MANAGER;
  const [tab, setTab] = useState("received");
  const [summary, setSummary] = useState(null);
  const [modal, setModal] = useState(null); // 'give' | 'request' | { request } | { kudos }
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {getKfSummary().then(setSummary).catch(() => {});}, [refreshKey]);
  const refresh = () => setRefreshKey((k) => k + 1);
  const pendingCount = Number(summary?.pending_requests || 0);
  const tabs = [
  { key: "received", label: "Received" },
  { key: "sent", label: "Given" },
  { key: "requests", label: "Requests", count: pendingCount },
  ...(isManager ? [{ key: "team", label: "Team Feedback" }] : []),
  ...(isHr ? [{ key: "report", label: "Feedback Report" }] : [])];
  const requestButton = <SecondaryButton onClick={() => setModal("request")}><Inbox size={15} /> Request Feedback</SecondaryButton>;
  return (
    <div className="space-y-6">
      {modal === "give" && <GiveFeedbackModal onClose={() => setModal(null)} onSent={refresh} teamOnly={false} />}
      {modal === "request" && <RequestFeedbackModal onClose={() => setModal(null)} onSent={refresh} />}
      {modal?.request && <GiveFeedbackModal request={modal.request} onClose={() => setModal(null)} onSent={refresh} />}
      {modal?.kudos && <GiveKudosModal preset={[modal.kudos]} onClose={() => setModal(null)} onSent={refresh} />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Feedback</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {isHr ? "Give feedback and track engagement across teams." :
            isManager ? "Guide your team with timely, specific feedback." :
            "Feedback you have received and given."}
          </p>
        </div>
        <div className="flex gap-2">
          {requestButton}
          <PrimaryButton onClick={() => setModal("give")}><Send size={15} /> Give Feedback</PrimaryButton>
        </div>
      </div>
      {tab !== "report" &&
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={<Star size={22} className="text-amber-500" />} label="Received" value={summary?.feedback_received} accent="bg-amber-50" />
          <StatCard icon={<MessageSquare size={22} className="text-[#f18200]" />} label="Given" value={summary?.feedback_given} />
          <StatCard
          icon={<Inbox size={22} className="text-blue-600" />}
          label="Pending requests"
          value={summary?.pending_requests}
          hint={pendingCount ? "People are waiting on you" : "All caught up"}
          accent="bg-blue-50" />
        </div>
      }
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-5 pt-3">
          <Tabs tabs={tabs} active={tab} onChange={setTab} label="Feedback views" />
        </div>
        <div className="p-5">
          {tab === "received" && <FeedbackList key={`r${refreshKey}`} scope="received" perspective="received" emptyAction={requestButton} />}
          {tab === "sent" && <FeedbackList key={`s${refreshKey}`} scope="sent" perspective="sent" />}
          {tab === "requests" &&
          <RequestsPanel refreshKey={refreshKey} onRespond={(r) => setModal({ request: r })} onChanged={refresh} />
          }
          {tab === "team" &&
          <>
              <p className="text-sm text-slate-500 mb-2 flex items-center gap-2"><Users size={15} /> Feedback your direct reports have received</p>
              <FeedbackList key={`t${refreshKey}`} scope="team" perspective="team" />
            </>
          }
          {tab === "report" &&
          <>
              <p className="text-sm text-slate-500 mb-4 flex items-center gap-2"><BarChart3 size={15} /> Organisation-wide kudos and feedback</p>
              <FeedbackReport onGiveKudos={(p) => setModal({ kudos: p })} />
            </>
          }
        </div>
      </section>
    </div>);
};
export default Feedback;
