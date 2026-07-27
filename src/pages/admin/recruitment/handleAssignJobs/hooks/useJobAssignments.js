import { useState, useCallback } from "react";
import { JOB_REQUESTS, RECRUITERS } from "../constants";

export function useJobAssignments() {
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [selectedRecruiters, setSelectedRecruiters] = useState(["Mike W."]);
  const [assignMessage, setAssignMessage] = useState("");
  const [topJobs, setTopJobs] = useState(["JOB-001"]);
  const [jobAssignments, setJobAssignments] = useState({});
  const [openRecruiterDropdown, setOpenRecruiterDropdown] = useState(null);

  const toggleJobSelection = useCallback((jobId) => {
    setSelectedJobs((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  }, []);

  const toggleRecruiter = useCallback((jobId, recruiterKey) => {
    setJobAssignments((prev) => {
      const selected = prev[jobId] || [];
      const updated = selected.includes(recruiterKey)
        ? selected.filter((r) => r !== recruiterKey)
        : [...selected, recruiterKey];
      return { ...prev, [jobId]: updated };
    });
  }, []);

  const handleAssignJobs = useCallback(() => {
    if (selectedJobs.length === 0 || selectedRecruiters.length === 0) {
      setAssignMessage("Please select at least one job and one recruiter.");
      setTimeout(() => setAssignMessage(""), 3000);
      return;
    }
    setAssignMessage(
      `Successfully assigned ${selectedJobs.length} job(s) to ${selectedRecruiters.length} recruiter(s).`
    );
    setSelectedJobs([]);
    setSelectedRecruiters(["Mike W."]);
    setTimeout(() => setAssignMessage(""), 3000);
  }, [selectedJobs, selectedRecruiters]);

  const handleAssignRecruiter = useCallback((jobId, recruiterKey) => {
    setJobAssignments((prev) => ({ ...prev, [jobId]: recruiterKey }));
    const recruiter = RECRUITERS.find((r) => r.key === recruiterKey);
    if (recruiter) {
      setAssignMessage(`Job ${jobId} assigned successfully to ${recruiter.name}.`);
    }
  }, []);

  const selectAllJobs = useCallback((checked) => {
    setSelectedJobs(checked ? JOB_REQUESTS.map((job) => job["Job ID"]) : []);
  }, []);

  const toggleDropdown = useCallback((jobId) => {
    setOpenRecruiterDropdown((prev) => (prev === jobId ? null : jobId));
  }, []);

  const closeDropdown = useCallback(() => {
    setOpenRecruiterDropdown(null);
  }, []);

  return {
    selectedJobs,
    selectedRecruiters,
    assignMessage,
    topJobs,
    jobAssignments,
    openRecruiterDropdown,
    toggleJobSelection,
    toggleRecruiter,
    handleAssignJobs,
    handleAssignRecruiter,
    selectAllJobs,
    toggleDropdown,
    closeDropdown,
  };
}
