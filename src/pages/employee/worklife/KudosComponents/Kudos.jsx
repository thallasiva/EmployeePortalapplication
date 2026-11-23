import React, { useEffect, useState } from "react";
import { Award, Heart, Send, Trophy, Users, Zap } from "lucide-react";
import { getStoredUser, resolveRoleForUser, ROLE_REPORTING_MANAGER } from "../../../../data/auth";
import { listDepartments } from "../../../../api/department.api";
import { getKfSummary, getKfTeam, listKfCategories, listTopRecognised } from "../../../../api/kudosFeedback.api";
import { Avatar, EmptyState, GiveFeedbackModal, GiveKudosModal, PrimaryButton, SecondaryButton, StatCard, Tabs } from ".././kudosFeedbackShared";
import { ROLE_HR_MANAGER } from "./shared";
import { KudosFeed } from "./KudosFeed";
import { TeamTable } from "./TeamTable";
const Kudos = () => {
  const role = resolveRoleForUser(getStoredUser());
  const isManager = role === ROLE_REPORTING_MANAGER;
  const isHr = role === ROLE_HR_MANAGER;
  const [tab, setTab] = useState("received");
  const [summary, setSummary] = useState(null);
  const [top, setTop] = useState([]);
  const [team, setTeam] = useState(null);
  const [kudosModal, setKudosModal] = useState(null); // { preset: [] }
  const [feedbackFor, setFeedbackFor] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [wallCategory, setWallCategory] = useState("");
  const [wallDepartment, setWallDepartment] = useState("");
  useEffect(() => {
    getKfSummary().then(setSummary).catch(() => {});
    listTopRecognised({
      months: 3
    }).then(setTop).catch(() => {});
    if (isManager) getKfTeam().then(setTeam).catch(() => setTeam([]));
  }, [isManager, refreshKey]);
  useEffect(() => {
    listKfCategories({
      type: "kudos"
    }).then(setCategories).catch(() => {});
    if (isHr) listDepartments().then(setDepartments).catch(() => {});
  }, [isHr]);
  const refresh = () => setRefreshKey(k => k + 1);
  const tabs = [{
    key: "received",
    label: "Received"
  }, {
    key: "sent",
    label: "Sent"
  }, {
    key: "wall",
    label: isHr ? "Organisation Kudos" : "Kudos Wall"
  }, ...(isManager ? [{
    key: "team",
    label: "My Team"
  }, {
    key: "teamKudos",
    label: "Team Kudos"
  }] : [])];
  const giveButton = <PrimaryButton onClick={() => setKudosModal({
    preset: []
  })}><Send size={15} /> Give Kudos</PrimaryButton>;
  return <div className="space-y-6">
      {kudosModal && <GiveKudosModal preset={kudosModal.preset} teamOnly={kudosModal.teamOnly} onClose={() => setKudosModal(null)} onSent={refresh} />}
      {feedbackFor && <GiveFeedbackModal presetEmployee={feedbackFor} onClose={() => setFeedbackFor(null)} onSent={refresh} />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold  text-[#e87500]">Kudos &amp; Recognition</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {isManager ? "Recognise your team and see who has not been appreciated lately." : isHr ? "Celebrate great work across the organisation." : "Appreciate and celebrate your teammates."}
          </p>
        </div>
        <div className="flex gap-2">
          {isManager && <SecondaryButton onClick={() => setKudosModal({
          preset: [],
          teamOnly: true
        })}><Users size={15} /> Kudos to team</SecondaryButton>}
          {giveButton}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Heart size={22} className="text-rose-500" />} label="Received" value={summary?.kudos_received} accent="bg-rose-50" />
        <StatCard icon={<Zap size={22} className="text-[#e87500]" />} label="Given" value={summary?.kudos_given} />
        <StatCard icon={<Award size={22} className="text-amber-500" />} label="This month" value={summary?.kudos_this_month} hint="Received" accent="bg-amber-50" />
        {isManager ? <StatCard icon={<Users size={22} className="text-blue-600" />} label="Team members" value={summary?.team_size} accent="bg-blue-50" /> : <StatCard icon={<Trophy size={22} className="text-emerald-600" />} label="Top category" value={summary?.by_category?.[0]?.category_name || "–"} accent="bg-emerald-50" />}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <section className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-5 pt-3">
            <Tabs tabs={tabs} active={tab} onChange={setTab} label="Kudos views" />
          </div>
          <div className="p-5">
            {tab === "wall" && isHr && <div className="flex flex-wrap gap-3 mb-4">
                <select aria-label="Category" value={wallCategory} onChange={e => setWallCategory(e.target.value)} className="h-10 min-w-[160px] border border-slate-200 rounded-xl px-3 text-sm bg-white">
                  <option value="">All categories</option>
                  {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                </select>
                <select aria-label="Department" value={wallDepartment} onChange={e => setWallDepartment(e.target.value)} className="h-10 min-w-[170px] border border-slate-200 rounded-xl px-3 text-sm bg-white">
                  <option value="">All departments</option>
                  {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
                </select>
              </div>}
            {tab === "received" && <KudosFeed key={`r${refreshKey}`} params={{
            scope: "received"
          }} perspective="received" empty={<EmptyState icon={<Award className="text-[#e87500]" />} title="No kudos yet" text="When teammates recognise your work, it will show up here." />} />}
            {tab === "sent" && <KudosFeed key={`s${refreshKey}`} params={{
            scope: "sent"
          }} perspective="sent" empty={<EmptyState icon={<Send className="text-[#e87500]" />} title="You haven't given kudos yet" text="A quick thank-you goes a long way." action={giveButton} />} />}
            {tab === "wall" && <KudosFeed key={`w${refreshKey}`} params={{
            scope: "wall",
            category_id: wallCategory || undefined,
            department_id: wallDepartment || undefined
          }} perspective="wall" empty={<EmptyState icon={<Trophy className="text-[#e87500]" />} title="The wall is empty" text="Public kudos from everyone appear here." action={giveButton} />} />}
            {tab === "teamKudos" && <KudosFeed key={`t${refreshKey}`} params={{
            scope: "team"
          }} perspective="wall" empty={<EmptyState icon={<Users className="text-[#e87500]" />} title="No kudos for your team yet" action={giveButton} />} />}
            {tab === "team" && <TeamTable team={team} onKudos={m => setKudosModal({
            preset: [{
              employee_id: m.employee_id,
              name: m.name
            }]
          })} onFeedback={m => setFeedbackFor({
            employee_id: m.employee_id,
            name: m.name
          })} />}
          </div>
        </section>
        <aside className="space-y-5">
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-base font-bold  text-[#e87500] mb-3">You were recognised for</h2>
            {!summary?.by_category?.length ? <p className="text-sm text-slate-500">No kudos received yet.</p> : <ul className="space-y-3">
                {summary.by_category.map(c => <li key={c.category_name}>
                    <div className="flex justify-between text-sm"><span className="font-semibold text-slate-700">{c.category_name}</span><strong>{c.total}</strong></div>
                    <div className="h-2 rounded-full bg-slate-100 mt-1">
                      <div className="h-2 rounded-full" style={{
                  width: `${c.total / summary.by_category[0].total * 100}%`,
                  background: c.color
                }} />
                    </div>
                  </li>)}
              </ul>}
          </section>
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-base font-bold  text-[#e87500] mb-3">Most recognised · 3 months</h2>
            {top.length === 0 ? <p className="text-sm text-slate-500">No kudos in the last 3 months.</p> : <ol className="space-y-3">
                {top.map((p, i) => <li key={p.employee_id} className="flex items-center gap-3">
                    <span className="w-6 text-sm font-black text-[#b45309]">#{i + 1}</span>
                    <Avatar name={p.name} size={32} tone="slate" />
                    <span className="flex-1 text-sm font-semibold text-slate-800 truncate">{p.name}</span>
                    <span className="text-sm font-black">{p.total}</span>
                  </li>)}
              </ol>}
          </section>
        </aside>
      </div>
    </div>;
};
export { Kudos };
