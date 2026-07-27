import React from "react";
import "../Onboarding.css";
import { useOnboardingData } from "./hooks/useOnboardingData";
import OverviewStats from "./components/OverviewStats";
import OverdueTasks from "./components/OverdueTasks";
import ActiveOnboardingsList from "./components/ActiveOnboardingsList";
import ChecklistPanel from "./components/ChecklistPanel";
import CompletedOnboardings from "./components/CompletedOnboardings";
import UploadDocumentModal from "./components/UploadDocumentModal";

export default function Onboarding() {
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

  return (
    <div className="admin-onboarding space-y-8 pb-20">
      <OverviewStats
        loading={loading}
        activeCount={activeOnboardings.length}
        avgDays={avgDays}
      />

      <OverdueTasks overdueTasks={overdueTasks} />

      <ActiveOnboardingsList
        loading={loading}
        activeOnboardings={activeOnboardings}
        onUpload={setUploadTarget}
        onViewChecklist={handleSelectEmployee}
      />

      <ChecklistPanel
        selectedEmployee={selectedEmployee}
        selectedDays={selectedDays}
        selectedChecklist={selectedChecklist}
        selectedProgress={selectedProgress}
        selectedDocs={selectedDocs}
        docsLoading={docsLoading}
        onUpload={setUploadTarget}
      />

      <CompletedOnboardings
        loading={loading}
        completedOnboardings={completedOnboardings}
      />

      {uploadTarget && (
        <UploadDocumentModal
          employee={uploadTarget}
          onClose={() => setUploadTarget(null)}
          onUploaded={handleAfterUpload}
        />
      )}
    </div>
  );
}
