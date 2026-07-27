import React from "react";
import { REC_CLASS } from "../constants";
import { scoreTextCls, scoreBgCls, safeArr } from "../utils";

const ScorePanel = React.memo(function ScorePanel({ score, showHint = false }) {
  const ovr = Number(score.matchScore) || 0;
  const skl = Number(score.skillScore) || 0;
  const exp = Number(score.expScore) || 0;
  const rec = score.recommendation || "Not Suitable";
  const recCls = REC_CLASS[rec] || "bg-gray-100 text-gray-700";
  const matched = safeArr(score.matched);
  const miss2 = safeArr(score.missing);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Resume Match Score</span>
        <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full ${recCls}`}>{rec}</span>
      </div>

      <div className="grid grid-cols-3 gap-px bg-gray-200">
        {[
          { label: "Overall Match", value: ovr, icon: "🎯" },
          { label: "Skill Match", value: skl, icon: "🛠" },
          { label: "Experience", value: exp, icon: "📅" }
        ].map(({ label, value, icon }) =>
          <div key={label} className="bg-white px-3 py-4 text-center">
            <div className="text-[11px] text-gray-400 mb-1.5">{icon} {label}</div>
            <div className={`text-[32px] font-black leading-none ${scoreTextCls(value)}`}>
              {value}<span className="text-base font-bold">%</span>
            </div>
            <div className="mt-2 h-1 bg-gray-100 rounded-sm overflow-hidden">
              <div className={`h-full rounded-sm transition-[width] duration-500 ease-out ${scoreBgCls(value)}`} style={{ width: value + "%" }} />
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        {matched.length > 0 &&
          <div className="mb-2.5">
            <div className="text-[11px] font-bold text-green-600 uppercase tracking-wide mb-1.5">✓ Matched Skills ({matched.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {matched.map((s) =>
                <span key={s} className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">{s}</span>
              )}
            </div>
          </div>
        }
        {miss2.length > 0 &&
          <div className="mb-2.5">
            <div className="text-[11px] font-bold text-red-600 uppercase tracking-wide mb-1.5">✕ Missing Skills ({miss2.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {miss2.map((s) =>
                <span key={s} className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">{s}</span>
              )}
            </div>
          </div>
        }
        {matched.length === 0 && miss2.length === 0 &&
          <p className="text-xs text-gray-400 italic">No skill breakdown available — score is based on experience only.</p>
        }
        {showHint &&
          <div className="mt-2 pt-2.5 border-t border-dashed border-gray-200 text-xs text-gray-500">
            Click <strong className="text-[#f18200]">Parse Resume</strong> to auto-fill candidate details →
          </div>
        }
      </div>
    </div>
  );
});

export default ScorePanel;
