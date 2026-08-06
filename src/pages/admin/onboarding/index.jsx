import React from "react";
import "../Onboarding.css";
import { RefreshCw, UserRoundPlus, FileCheck } from "lucide-react";
import { useOnboardingData } from "./hooks/useOnboardingData";
import { useJoiningVerification } from "../joiningVerification/hooks/useJoiningVerification";
import OverviewStats from "./components/OverviewStats";
import OverdueTasks from "./components/OverdueTasks";
import ActiveOnboardingsList from "./components/ActiveOnboardingsList";
import ChecklistPanel from "./components/ChecklistPanel";
import CompletedOnboardings from "./components/CompletedOnboardings";
import UploadDocumentModal from "./components/UploadDocumentModal";
import CandidatesTable from "../joiningVerification/components/CandidatesTable";
import DetailModal from "../joiningVerification/components/DetailModal";
import { FILTERS } from "../joiningVerification/constants";

const BRAND = "#f18200";

export default function Onboarding() {
  /* ── Onboarding ── */
  const {
    loading,
    selectedEmployee,
    uploadTarget,
    docsLoading,
    activeOnboardings,
    completedOnboardings,
    overdueTasks,
    avgDays,
    selectedDays,
    selectedChecklist,
    selectedProgress,
    selectedDocs,
    setUploadTarget,
    handleSelectEmployee,
    handleAfterUpload,
  } = useOnboardingData();

  /* ── Joining Formalities ── */
  const {
    rows,
    loading: jfLoading,
    filter,
    setFilter,
    detail,
    detailId,
    selectedRow,
    remarks,
    setRemarks,
    decision,
    setDecision,
    reviewing,
    load: jfLoad,
    openDetail,
    submitReview,
    resend,
    closeDetail,
  } = useJoiningVerification();

  const pendingFormalities = rows.filter((r) => {
    const s = r.formality_status || r.invitation_status || "";
    return s === "pending_verification" || s === "submitted";
  }).length;

  return (
    <div className="space-y-6 pb-20 px-1">

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: BRAND }}
          >
            <UserRoundPlus size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Onboarding</h1>
            <p className="text-[13px] text-gray-500">
              Manage new hire onboarding and joining formalities
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <OverviewStats
        loading={loading || jfLoading}
        activeCount={activeOnboardings.length}
        avgDays={avgDays}
        pendingFormalities={pendingFormalities}
      />

      {/* ── Joining Formalities ─────────────────────────────────── */}
      <section className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {/* Section header */}
        <div
          className="flex items-center justify-between flex-wrap gap-3 px-6 py-4 border-b border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: "#fff7ed" }}
            >
              <FileCheck size={16} style={{ color: BRAND }} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-gray-900 flex items-center gap-2">
                Joining Formalities
                {pendingFormalities > 0 && (
                  <span
                    className="text-[11px] font-bold text-white rounded-full px-2 py-0.5"
                    style={{ backgroundColor: "#dc2626" }}
                  >
                    {pendingFormalities} pending
                  </span>
                )}
              </h2>
              <p className="text-[12px] text-gray-400">
                Review and approve formalities submitted by new hires
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors"
                style={
                  filter === key
                    ? { backgroundColor: BRAND, color: "#fff", borderColor: BRAND }
                    : { backgroundColor: "#f9fafb", color: "#374151", borderColor: "#e5e7eb" }
                }
              >
                {label}
              </button>
            ))}
            <button
              onClick={jfLoad}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        {/* Candidates table */}
        <div className="p-4">
          <CandidatesTable
            rows={rows}
            loading={jfLoading}
            onOpenDetail={openDetail}
            onResend={resend}
          />
        </div>
      </section>

      {/* ── Overdue Tasks ───────────────────────────────────────── */}
      <OverdueTasks overdueTasks={overdueTasks} />

      {/* ── Active Onboardings ──────────────────────────────────── */}
      {/* <ActiveOnboardingsList
        loading={loading}
        activeOnboardings={activeOnboardings}
        onUpload={setUploadTarget}
        onViewChecklist={handleSelectEmployee}
      /> */}

      {/* ── Checklist Panel ─────────────────────────────────────── */}
      <ChecklistPanel
        selectedEmployee={selectedEmployee}
        selectedDays={selectedDays}
        selectedChecklist={selectedChecklist}
        selectedProgress={selectedProgress}
        selectedDocs={selectedDocs}
        docsLoading={docsLoading}
        onUpload={setUploadTarget}
      />

      {/* ── Completed Onboardings ───────────────────────────────── */}
      {/* <CompletedOnboardings
        loading={loading}
        completedOnboardings={completedOnboardings}
      /> */}

      {/* Modals */}
      {uploadTarget && (
        <UploadDocumentModal
          employee={uploadTarget}
          onClose={() => setUploadTarget(null)}
          onUploaded={handleAfterUpload}
        />
      )}

      <DetailModal
        detailId={detailId}
        detail={detail}
        selectedRow={selectedRow}
        remarks={remarks}
        decision={decision}
        reviewing={reviewing}
        onClose={closeDetail}
        onSetDecision={setDecision}
        onSetRemarks={setRemarks}
        onSubmitReview={submitReview}
      />
    </div>
  );
}
