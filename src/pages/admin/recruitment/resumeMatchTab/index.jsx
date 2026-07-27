import React from "react";
import { PageHeader } from "../shared";
import { useResumeMatch } from "./hooks/useResumeMatch";
import QuickMatchPanel from "./components/QuickMatchPanel";
import CandidateRankSection from "./components/CandidateRankSection";

const ResumeMatchTab = React.memo(function ResumeMatchTab({ role }) {
  const {
    jobs,
    selectedJob,
    setSelectedJob,
    filtered,
    loading,
    search,
    setSearch,
    loadMatches,
    handleRecompute,
  } = useResumeMatch();

  return (
    <div>
      <PageHeader
        breadcrumbs={["Dashboard", "Resume Match"]}
        title="Resume Match"
        subtitle="Instantly check how well a candidate matches a job requirement"
      />

      <QuickMatchPanel jobs={jobs} />

      <CandidateRankSection
        jobs={jobs}
        selectedJob={selectedJob}
        onSelectJob={setSelectedJob}
        filtered={filtered}
        loading={loading}
        search={search}
        onSearch={setSearch}
        onRefresh={() => loadMatches(selectedJob)}
        onRecompute={handleRecompute}
      />
    </div>
  );
});

export default ResumeMatchTab;
