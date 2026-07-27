import React from "react";
import { Plus, Loader2, RefreshCw } from "lucide-react";
import { PageHeader, Card, Btn, Select, SearchBar } from "./shared";
import { useInterviewsPage } from "./hooks/useInterviewsPage";
import CandidateAccordion from "./components/CandidateAccordion";
import ScheduleSlideOver from "./components/ScheduleSlideOver";
import { HrFeedbackModal, RecruiterFeedbackModal } from "./components/FeedbackModal";
import ViewInterviewModal from "./components/ViewInterviewModal";
import { BLANK_INT } from "./constants";

export default function InterviewsPage({ role }) {
  const {
    interviews,
    loading,
    search, setSearch,
    filterLevel, setFilterLevel,
    filterStatus, setFilterStatus,
    schedOpen, setSchedOpen,
    fbOpen, setFbOpen,
    fbRecruiterOpen, setFbRecruiterOpen,
    viewIv, setViewIv,
    form, setForm,
    fb, setFb,
    fbRecruiter, setFbRecruiter,
    saving,
    isAdmin, isExternal,
    canSchedule, canFeedback, canRecruiterFeedback,
    groups,
    candidateOpts, jobOpts, levelOpts, statusOpts,
    loadInterviews,
    handleSchedule, handleFeedback, handleRecruiterFeedback,
    handleChange, handleFbChange,
    openFeedback, openRecruiterFeedback,
  } = useInterviewsPage(role);

  return (
    <div>
      <PageHeader
        breadcrumbs={["Dashboard", "Interviews"]}
        title="Interview Schedule"
        subtitle="One accordion per candidate — track all rounds at a glance"
        action={
          canSchedule && (
            <div className="flex gap-2">
              <Btn variant="secondary" icon={<RefreshCw size={14} />} onClick={loadInterviews} />
              <Btn icon={<Plus size={16} />} onClick={() => setSchedOpen(true)}>
                Schedule Interview
              </Btn>
            </div>
          )
        }
      />

      {/* Summary pills */}
      <div className="flex gap-2.5 mb-5 flex-wrap">
        {[
          { label: "Candidates", count: groups.length, color: "#6b7280", bg: "#f3f4f6" },
          { label: "Scheduled", count: interviews.filter((iv) => iv.status === "Scheduled").length, color: "#1d4ed8", bg: "#dbeafe" },
          { label: "Completed", count: interviews.filter((iv) => iv.status === "Completed").length, color: "#059669", bg: "#dcfce7" },
          { label: "Selected", count: interviews.filter((iv) => iv.feedback_status === "Selected").length, color: "#7c3aed", bg: "#ede9fe" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2 px-3.5 py-1.5 rounded-full" style={{ background: s.bg }}>
            <span className="text-base font-bold" style={{ color: s.color }}>{s.count}</span>
            <span className="text-[12px] font-medium" style={{ color: s.color }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card className="!p-0 mb-4">
        <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search candidate, job, interview ID..." />
          <Select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} options={levelOpts} />
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} options={statusOpts} />
          <div className="ml-auto text-[12px] text-gray-500">
            {loading ? "Loading..." : groups.length + " candidate" + (groups.length !== 1 ? "s" : "")}
          </div>
        </div>
      </Card>

      {/* Candidate accordions */}
      {loading ? (
        <div className="flex items-center justify-center gap-2.5 py-12 text-gray-500">
          <Loader2 size={20} /> Loading interviews...
        </div>
      ) : groups.length === 0 ? (
        <Card className="text-center text-gray-400 text-sm">No interviews found.</Card>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((g, idx) => (
            <CandidateAccordion
              key={g.candidateId}
              candidateName={g.candidateName}
              jobTitle={g.jobTitle}
              rounds={g.rounds}
              canFeedback={canFeedback}
              canRecruiterFeedback={canRecruiterFeedback}
              canRaiseOffer={isAdmin}
              defaultOpen={idx === 0}
              onFeedback={openFeedback}
              onRecruiterFeedback={openRecruiterFeedback}
              onView={(row) => setViewIv(row)}
              onScheduleNext={() => {
                setForm((f) => ({ ...f, candidateId: String(g.candidateId) }));
                setSchedOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <ScheduleSlideOver
        open={schedOpen}
        isExternal={isExternal}
        form={form}
        saving={saving}
        candidateOpts={candidateOpts}
        jobOpts={jobOpts}
        onClose={() => { setSchedOpen(false); setForm(BLANK_INT); }}
        onChange={handleChange}
        onSubmit={handleSchedule}
      />

      <HrFeedbackModal
        fbOpen={fbOpen}
        fb={fb}
        saving={saving}
        onClose={() => setFbOpen(null)}
        onChange={handleFbChange}
        onSubmit={handleFeedback}
      />

      <RecruiterFeedbackModal
        fbRecruiterOpen={fbRecruiterOpen}
        fbRecruiter={fbRecruiter}
        saving={saving}
        onClose={() => setFbRecruiterOpen(null)}
        onChangeFeedbackStatus={(e) => setFbRecruiter((f) => ({ ...f, feedbackStatus: e.target.value }))}
        onChangeComments={(e) => setFbRecruiter((f) => ({ ...f, feedbackComments: e.target.value }))}
        onSubmit={handleRecruiterFeedback}
      />

      <ViewInterviewModal
        viewIv={viewIv}
        canFeedback={canFeedback}
        onClose={() => setViewIv(null)}
        onOpenFeedback={openFeedback}
      />
    </div>
  );
}
