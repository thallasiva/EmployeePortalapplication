import { useState, useEffect, useCallback, useMemo } from "react";
import {
  listJobs, listMatchesByJob, computeResumeMatch, getErrorMessage,
} from "../../../../../api/recruitment.api";
import { errorToast } from "../../../../../utils/ToastControllers";

export function useResumeMatch() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    listJobs({ limit: 200 }).then((r) => setJobs(r?.data ?? [])).catch(() => {});
  }, []);

  const loadMatches = useCallback(async (jobId) => {
    if (!jobId) return;
    setLoading(true);
    try { setMatches((await listMatchesByJob(jobId)) ?? []); }
    catch (err) { errorToast(getErrorMessage(err, "Failed to load matches")); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (selectedJob) loadMatches(selectedJob);
    else setMatches([]);
  }, [selectedJob, loadMatches]);

  const handleRecompute = useCallback(async (candidateId, jobReqId) => {
    await computeResumeMatch(candidateId, jobReqId);
    loadMatches(selectedJob);
  }, [selectedJob, loadMatches]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return matches;
    return matches.filter(
      (m) =>
        m.candidate_name?.toLowerCase().includes(q) ||
        m.candidate_email?.toLowerCase().includes(q),
    );
  }, [matches, search]);

  return {
    jobs,
    selectedJob,
    setSelectedJob,
    matches,
    filtered,
    loading,
    search,
    setSearch,
    loadMatches,
    handleRecompute,
  };
}
