import React from "react";
import { Users } from "lucide-react";
import { Avatar, EmptyState, Loading } from ".././kudosFeedbackShared";
import { lastRecognisedBadge } from "./shared";
const TeamTable = ({
  team,
  onKudos,
  onFeedback
}) => {
  if (!team) return <Loading />;
  if (team.length === 0) {
    return <EmptyState icon={<Users className="text-[#e87500]" />} title="No direct reports" text="People who report to you will appear here." />;
  }
  return <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="bg-slate-50 text-xs text-slate-500 text-left">
            <th scope="col" className="px-4 py-3 font-semibold">Member</th>
            <th scope="col" className="px-3 py-3 font-semibold">Kudos (90d)</th>
            <th scope="col" className="px-3 py-3 font-semibold">Feedback (90d)</th>
            <th scope="col" className="px-3 py-3 font-semibold">Last recognised</th>
            <th scope="col" className="px-4 py-3 font-semibold"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {team.map(m => {
          const badge = lastRecognisedBadge(m.last_kudos_at);
          return <tr key={m.employee_id} className="border-t border-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name} size={36} tone="slate" />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{m.name}</p>
                      <p className="text-xs text-slate-500 truncate">{[m.designation, m.emp_code].filter(Boolean).join(" · ")}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 font-bold">{m.kudos_90d}</td>
                <td className="px-3 py-3 font-bold">
                  {m.feedback_90d}
                  {Number(m.pending_from_me) > 0 && <span className="ml-2 text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">{m.pending_from_me} requested</span>}
                </td>
                <td className="px-3 py-3"><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.text}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-3 justify-end text-xs font-bold">
                    <button onClick={() => onKudos(m)} className="text-[#b45309] hover:underline">Kudos</button>
                    <button onClick={() => onFeedback(m)} className="text-[#b45309] hover:underline">Feedback</button>
                  </div>
                </td>
              </tr>;
        })}
        </tbody>
      </table>
    </div>;
};
export { TeamTable };
