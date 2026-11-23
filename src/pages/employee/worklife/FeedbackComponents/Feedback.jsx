import React, { useEffect, useState } from "react";
import { BarChart3, Inbox, MessageSquare, Send, Star, Users } from "lucide-react";
import { getStoredUser, resolveRoleForUser, ROLE_REPORTING_MANAGER } from "../../../../data/auth";
import { getKfSummary } from "../../../../api/kudosFeedback.api";
import { FeedbackReport, GiveFeedbackModal, GiveKudosModal, PrimaryButton, RequestFeedbackModal, SecondaryButton, StatCard, Tabs } from ".././kudosFeedbackShared";
// role 4 is "HR Manager" in the roles table (the web constant predates the rename)
import { ROLE_HR_MANAGER } from "./shared";
import { FeedbackList } from "./FeedbackList";
import { RequestsPanel } from "./RequestsPanel";
const Feedback = () => {
  const role = resolveRoleForUser(getStoredUser());
  const isManager = role === ROLE_REPORTING_MANAGER;
  const isHr = role === ROLE_HR_MANAGER;
  const [tab, setTab] = useState("received");
  const [summary, setSummary] = useState(null);
  const [modal, setModal] = useState(null); // 'give' | 'request' | { request } | { kudos }
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    getKfSummary().then(setSummary).catch(() => {});
  }, [refreshKey]);
  const refresh = () => setRefreshKey(k => k + 1);
  const pendingCount = Number(summary?.pending_requests || 0);
  const tabs = [{
    key: "received",
    label: "Received"
  }, {
    key: "sent",
    label: "Given"
  }, {
    key: "requests",
    label: "Requests",
    count: pendingCount
  }, ...(isManager ? [{
    key: "team",
    label: "Team Feedback"
  }] : []), ...(isHr ? [{
    key: "report",
    label: "Feedback Report"
  }] : [])];
  const requestButton = <SecondaryButton onClick={() => setModal("request")}><Inbox size={15} /> Request Feedback</SecondaryButton>;
  return <div className="space-y-6">
      {modal === "give" && <GiveFeedbackModal onClose={() => setModal(null)} onSent={refresh} teamOnly={false} />}
      {modal === "request" && <RequestFeedbackModal onClose={() => setModal(null)} onSent={refresh} />}
      {modal?.request && <GiveFeedbackModal request={modal.request} onClose={() => setModal(null)} onSent={refresh} />}
      {modal?.kudos && <GiveKudosModal preset={[modal.kudos]} onClose={() => setModal(null)} onSent={refresh} />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold  text-[#e87500]">Feedback</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {isHr ? "Give feedback and track engagement across teams." : isManager ? "Guide your team with timely, specific feedback." : "Feedback you have received and given."}
          </p>
        </div>
        <div className="flex gap-2">
          {requestButton}
          <PrimaryButton onClick={() => setModal("give")}><Send size={15} /> Give Feedback</PrimaryButton>
        </div>
      </div>
      {tab !== "report" && <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={<Star size={22} className="text-amber-500" />} label="Received" value={summary?.feedback_received} accent="bg-amber-50" />
          <StatCard icon={<MessageSquare size={22} className="text-[#e87500]" />} label="Given" value={summary?.feedback_given} />
          <StatCard icon={<Inbox size={22} className="text-blue-600" />} label="Pending requests" value={summary?.pending_requests} hint={pendingCount ? "People are waiting on you" : "All caught up"} accent="bg-blue-50" />
        </div>}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-5 pt-3">
          <Tabs tabs={tabs} active={tab} onChange={setTab} label="Feedback views" />
        </div>
        <div className="p-5">
          {tab === "received" && <FeedbackList key={`r${refreshKey}`} scope="received" perspective="received" emptyAction={requestButton} />}
          {tab === "sent" && <FeedbackList key={`s${refreshKey}`} scope="sent" perspective="sent" />}
          {tab === "requests" && <RequestsPanel refreshKey={refreshKey} onRespond={r => setModal({
          request: r
        })} onChanged={refresh} />}
          {tab === "team" && <>
              <p className="text-sm text-slate-500 mb-2 flex items-center gap-2"><Users size={15} /> Feedback your direct reports have received</p>
              <FeedbackList key={`t${refreshKey}`} scope="team" perspective="team" />
            </>}
          {tab === "report" && <>
              <p className="text-sm text-slate-500 mb-4 flex items-center gap-2"><BarChart3 size={15} /> Organisation-wide kudos and feedback</p>
              <FeedbackReport onGiveKudos={p => setModal({
            kudos: p
          })} />
            </>}
        </div>
      </section>
    </div>;
};
export { Feedback };
