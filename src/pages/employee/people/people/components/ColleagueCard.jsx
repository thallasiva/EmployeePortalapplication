import React from "react";
import { Mail } from "lucide-react";
import { BRAND } from "../constants";
import Avatar from "./Avatar";

const ColleagueCard = React.memo(function ColleagueCard({ person, isManager, isDirectReport }) {
  return (
    <div
      className="flex items-center gap-3 px-3.5 py-3 bg-white border border-slate-200 border-l-[3px] rounded-xl"
      style={{ borderLeftColor: person.color }}
    >
      <Avatar name={person.name} color={person.color} size={40} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[13px] font-bold text-slate-800 whitespace-nowrap">
            {person.name}
          </span>
          {isManager && (
            <span
              className="text-[9px] font-bold px-1.5 py-px rounded"
              style={{ backgroundColor: "#fff8f0", color: BRAND, border: `1px solid ${BRAND}44` }}
            >
              MANAGER
            </span>
          )}
          {isDirectReport && (
            <span className="text-[9px] font-bold px-1.5 py-px rounded bg-green-50 text-green-600 border border-green-200">
              REPORTS TO YOU
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">{person.jobTitle}</div>
        <div className="text-[11px] text-slate-500 mt-px">{person.departmentName}</div>
      </div>
      <div className="flex flex-col items-end gap-1">
        {person.email !== "—" && (
          <a
            href={`mailto:${person.email}`}
            className="flex items-center gap-1 text-[11px] no-underline"
            style={{ color: BRAND }}
          >
            <Mail size={11} /> Mail
          </a>
        )}
      </div>
    </div>
  );
});

export default ColleagueCard;
