import { useState, useEffect, useCallback, useRef } from "react";
import {
  listCandidates, listJobs, listRecruiters,
  updateCandidateStatus as apiUpdateStatus,
  scheduleInterview, listInterviews, getErrorMessage
} from "../../../../../api/recruitment.api";
import { apiErrorToast, successToast, errorToast } from "../../../../../utils/ToastControllers";
import { BLANK_INT, LEVEL_ORDER } from "../constants";

export function useCandidatesData({ role }) {
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterJob, setFilterJob] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const tableRef = useRef(null);

  const isAdmin = role === 1;
  const isTL = role === 3;
  const isHRMgr = role === 4;
  const isRecruiter = role === 5;

  useEffect(() => {
    listJobs({ limit: 200 }).then((res) => setJobs(res?.data ?? [])).catch(() => {});
    if (!isRecruiter) listRecruiters().then((rows) => setRecruiters(rows ?? [])).catch(() => {});
  }, [isRecruiter]);

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 200 };
      if (filterStatus) params.status = filterStatus;
      if (filterJob) params.jobReqId = filterJob;
      if (search) params.search = search;
      const { data } = await listCandidates(params);
      setCandidates(data ?? []);
    } catch (err) {
      apiErrorToast(err, "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterJob, search]);

  useEffect(() => { loadCandidates(); }, [loadCandidates]);

  const updateStatus = useCallback(async (candidateId, status) => {
    const prevStatus = candidates.find((c) => c.candidate_id === candidateId)?.status;
    setCandidates((cs2) => cs2.map((c) => c.candidate_id === candidateId ? { ...c, status } : c));
    setDetail((d) => d?.candidate_id === candidateId ? { ...d, status } : d);
    try {
      await apiUpdateStatus(candidateId, status);
      successToast("Status updated to " + status);
    } catch (err) {
      setCandidates((cs2) => cs2.map((c) => c.candidate_id === candidateId ? { ...c, status: prevStatus } : c));
      setDetail((d) => d?.candidate_id === candidateId ? { ...d, status: prevStatus } : d);
      apiErrorToast(err, "Failed to update status");
    }
  }, [candidates]);




  const filtered = candidates.filter((c) => {
    const q = search.toLowerCase();
    const matchQ = !q ||
      (c.name || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.candidate_code || "").toLowerCase().includes(q);
    return matchQ &&
      (!filterStatus || c.status === filterStatus) &&
      (!filterJob || String(c.job_req_id) === String(filterJob));
  });

  return {
    candidates, jobs, recruiters, loading, filtered,
    search, filterStatus, filterJob,
    addOpen, detail, tableRef,
    isAdmin, isTL, isHRMgr, isRecruiter,
    setSearch, setFilterStatus, setFilterJob,
    setAddOpen, setDetail,
    loadCandidates, updateStatus,
  };
}
