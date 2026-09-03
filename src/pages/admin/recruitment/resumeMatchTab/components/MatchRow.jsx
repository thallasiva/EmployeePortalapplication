import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { getErrorMessage } from "../../../../../api/recruitment.api";
import { apiErrorToast, errorToast } from "../../../../../utils/ToastControllers";
import ScoreCircle from "./ScoreCircle";
import RecBadge from "./RecBadge";
import SkillBar from "./SkillBar";
import SkillPills from "./SkillPills";

const MatchRow = React.memo(function MatchRow({ row, onRecompute, rank }) {
  const [expanded, setExpanded] = useState(false);
  const [recomputing, setRecomputing] = useState(false);
  const matched = JSON.parse(row.matched_skills || "[]");
  const missing = JSON.parse(row.missing_skills || "[]");

  async function handleRecompute(e) {
    e.stopPropagation();
    setRecomputing(true);
    try { await onRecompute(row.candidate_id, row.job_req_id); }
    catch (err) { apiErrorToast(err, "Failed"); }
    finally { setRecomputing(false); }
  }

  return (
    <>
      <tr
        onClick={() => setExpanded((v) => !v)}
        className={`cursor-pointer border-b border-gray-100 ${expanded ? "bg-gray-50" : "bg-white"}`}
      >
        <td className="px-3.5 py-3 text-[13px] font-bold text-gray-400 w-9">#{rank}</td>
        <td className="px-3.5 py-3">
          <div className="font-semibold text-gray-900">{row.candidate_name}</div>
          <div className="text-[11px] text-gray-400">{row.candidate_code} · {row.candidate_email}</div>
        </td>
        <td className="px-3.5 py-3 text-center"><ScoreCircle score={row.match_score} size={52} /></td>
        <td className="px-3.5 py-3"><RecBadge label={row.recommendation} /></td>
        <td className="px-3.5 py-3">
          <span className="text-[12px] text-[#f18200] font-semibold">✔ {matched.length}</span>
          <span className="text-[12px] text-gray-400 mx-1">·</span>
          <span className="text-[12px] text-red-600 font-semibold">✖ {missing.length}</span>
        </td>
        <td className="px-3.5 py-3 text-[12px] text-gray-700">{row.relevant_experience} yrs</td>
        <td className="px-3.5 py-3">
          <div className="flex gap-1.5 items-center">
            <button
              onClick={handleRecompute} disabled={recomputing} title="Recompute score"
              className="border-0 bg-transparent cursor-pointer text-violet-600 font-bold text-base"
            >
              {recomputing ? "…" : "↻"}
            </button>
            {expanded
              ? <ChevronUp size={14} className="text-gray-400" />
              : <ChevronDown size={14} className="text-gray-400" />}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50">
          <td colSpan={7} className="px-3.5 pb-4 pl-12">
            <div className="grid grid-cols-2 gap-3.5 pt-3">
              <div className="bg-white rounded-[10px] border border-gray-200 p-3.5">
                <div className="text-[11px] font-bold text-gray-500 mb-2.5 uppercase">Score Breakdown</div>
                <SkillBar label="Skills (60%)" score={row.skill_score} color="#7c3aed" />
                <SkillBar label="Experience (40%)" score={row.exp_score} color="#0369a1" />
                <SkillBar label="Overall" score={row.match_score} color="#f18200" />
              </div>
              <div className="bg-white rounded-[10px] border border-gray-200 p-3.5">
                <div className="text-[11px] font-bold text-gray-500 mb-2 uppercase">Skills</div>
                {matched.length > 0 && (
                  <div className="mb-2">
                    <div className="text-[11px] text-[#f18200] font-semibold mb-1">Matched</div>
                    <SkillPills skills={matched} matched />
                  </div>
                )}
                {missing.length > 0 && (
                  <div>
                    <div className="text-[11px] text-red-600 font-semibold mb-1">Missing</div>
                    <SkillPills skills={missing} matched={false} />
                  </div>
                )}
              </div>
            </div>
            <div className="text-[10px] text-gray-400 mt-2">
              Last computed: {row.computed_at ? new Date(row.computed_at).toLocaleString() : "—"}
            </div>
          </td>
        </tr>
      )}
    </>
  );
});

export default MatchRow;
