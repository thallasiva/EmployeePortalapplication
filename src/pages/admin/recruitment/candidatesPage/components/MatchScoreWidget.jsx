import React, { useState, useEffect } from "react";
import { getResumeMatch, computeResumeMatch } from "../../../../../api/recruitment.api";
import { REC_CLASS } from "../constants";
import { scoreTextCls, safeArr } from "../utils";

const MatchScoreWidget = React.memo(function MatchScoreWidget({ candidateId, jobReqId }) {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [computing, setComputing] = useState(false);

  useEffect(() => {
    if (!candidateId || !jobReqId) return;
    setLoading(true);
    getResumeMatch(candidateId, jobReqId)
      .then((d) => setMatch(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [candidateId, jobReqId]);

  async function recompute() {
    setComputing(true);
    try { const d = await computeResumeMatch(candidateId, jobReqId); setMatch(d); } catch {}
    finally { setComputing(false); }
  }

  if (!jobReqId) return null;
  if (loading) return <div className="text-xs text-gray-400 mt-3">Loading match score...</div>;

  const rec = match?.recommendation;
  const recCls = REC_CLASS[rec] || "bg-gray-100 text-gray-700";
  const matched = safeArr(match?.matched_skills);
  const missing2 = safeArr(match?.missing_skills);

  return (
    <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-gray-50 border-b border-gray-200">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Resume Match</div>
        <button onClick={recompute} disabled={computing} className="text-[11px] text-purple-600 bg-transparent border-0 cursor-pointer font-semibold">
          {computing ? "Computing..." : "Recompute"}
        </button>
      </div>
      {!match ? (
        <div className="px-4 py-3.5 text-sm text-gray-400">
          No score yet.{" "}
          <button onClick={recompute} className="text-purple-600 bg-transparent border-0 cursor-pointer text-sm font-semibold">Compute now</button>
        </div>
      ) : (
        <div className="px-4 py-3.5">
          <div className="flex items-center gap-3.5 mb-3">
            <div className="text-center">
              <div className={`text-[28px] font-extrabold leading-none ${scoreTextCls(match.match_score)}`}>{match.match_score}%</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Overall</div>
            </div>
            <div className="flex-1">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${recCls}`}>{rec}</span>
              <div className="flex gap-3 mt-2">
                <div className="text-[11px] text-gray-500">Skills <strong className="text-gray-900">{match.skill_score}%</strong></div>
                <div className="text-[11px] text-gray-500">Experience <strong className="text-gray-900">{match.exp_score}%</strong></div>
              </div>
            </div>
          </div>
          {matched.length > 0 &&
            <div className="flex flex-wrap gap-1 mb-1.5">
              {matched.map((s) => <span key={s} className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-[#f18200]">ok {s}</span>)}
            </div>
          }
          {missing2.length > 0 &&
            <div className="flex flex-wrap gap-1">
              {missing2.map((s) => <span key={s} className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-800">x {s}</span>)}
            </div>
          }
        </div>
      )}
    </div>
  );
});

export default MatchScoreWidget;
