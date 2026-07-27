import React, { useCallback } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { Btn, Select, SearchBar } from "../../shared";
import RankStats from "./RankStats";
import CandidateTable from "./CandidateTable";

const CandidateRankSection = React.memo(function CandidateRankSection({
  jobs,
  selectedJob,
  onSelectJob,
  filtered,
  loading,
  search,
  onSearch,
  onRefresh,
  onRecompute,
}) {
  const jobOpts = [
    { value: "", label: "— Select a Job to Rank Candidates —" },
    ...jobs.map((j) => ({ value: String(j.job_req_id), label: `${j.job_req_code || ""} — ${j.title}` })),
  ];

  const handleSelectJob = useCallback(
    (e) => onSelectJob(e.target.value),
    [onSelectJob],
  );

  return (
    <div>
      <div className="mb-3">
        <div className="text-[13px] font-bold text-gray-700 mb-2">📋 All Candidates Ranked by Job</div>
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex-1 max-w-[420px]">
            <Select value={selectedJob} onChange={handleSelectJob} options={jobOpts} />
          </div>
          {selectedJob && (
            <>
              <SearchBar value={search} onChange={onSearch} placeholder="Search candidate…" />
              <Btn variant="secondary" icon={<RefreshCw size={13} />} onClick={onRefresh} />
            </>
          )}
        </div>
      </div>

      {selectedJob && loading && (
        <div className="flex items-center gap-2.5 py-8 px-5 text-gray-500">
          <Loader2 size={18} /> Loading ranked candidates…
        </div>
      )}

      {selectedJob && !loading && (
        <>
          {filtered.length > 0 && <RankStats filtered={filtered} />}
          <CandidateTable filtered={filtered} onRecompute={onRecompute} />
        </>
      )}

      {!selectedJob && (
        <div className="text-center py-5 text-gray-400 text-[13px]">
          Select a job above to see all candidates ranked by match score.
        </div>
      )}
    </div>
  );
});

export default CandidateRankSection;
