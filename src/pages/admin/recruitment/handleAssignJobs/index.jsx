import React from "react";
import { useJobAssignments } from "./hooks/useJobAssignments";
import MyTasksView from "./components/MyTasksView";
import JobSearchFilters from "./components/JobSearchFilters";
import NewJobRequestForm from "./components/NewJobRequestForm";
import AssignJobsTable from "./components/AssignJobsTable";

const RequirementsTab = React.memo(function RequirementsTab({ role, recruiterKey }) {
  const {
    selectedJobs,
    selectedRecruiters,
    assignMessage,
    jobAssignments,
    openRecruiterDropdown,
    toggleJobSelection,
    toggleRecruiter,
    handleAssignJobs,
    selectAllJobs,
    toggleDropdown,
    closeDropdown,
  } = useJobAssignments();

  if (role.id === 5) {
    return <MyTasksView recruiterKey={recruiterKey} />;
  }

  return (
    <>
      <JobSearchFilters />
      <NewJobRequestForm />
      <AssignJobsTable
        selectedJobs={selectedJobs}
        selectedRecruiters={selectedRecruiters}
        assignMessage={assignMessage}
        jobAssignments={jobAssignments}
        openRecruiterDropdown={openRecruiterDropdown}
        onSelectAll={selectAllJobs}
        onToggleJob={toggleJobSelection}
        onToggleDropdown={toggleDropdown}
        onToggleRecruiter={toggleRecruiter}
        onCloseDropdown={closeDropdown}
        onAssignJobs={handleAssignJobs}
      />
    </>
  );
});

export default RequirementsTab;
