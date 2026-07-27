import React from "react";
import { Card } from "../../shared";
import MatchRow from "./MatchRow";

const TABLE_HEADERS = ["Rank", "Candidate", "Score", "Result", "Skills", "Exp", ""];

const CandidateTable = React.memo(function CandidateTable({ filtered, onRecompute }) {
  if (filtered.length === 0) {
    return (
      <Card className="!p-0">
        <div className="text-center py-10 text-gray-400">
          <div className="text-[14px] font-semibold text-gray-500">No scored candidates yet</div>
          <div className="text-[12px] mt-1">Scores auto-compute when candidates are added to this job</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="!p-0">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b-2 border-gray-200">
            {TABLE_HEADERS.map((h, i) => (
              <th
                key={h}
                className={`px-3.5 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-[0.04em] ${
                  i === 2 ? "text-center" : "text-left"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((row, i) => (
            <MatchRow key={row.match_id} row={row} rank={i + 1} onRecompute={onRecompute} />
          ))}
        </tbody>
      </table>
    </Card>
  );
});

export default CandidateTable;
