import { useState, useEffect, useCallback, useMemo } from "react";
import {
  listJobs,
  getJob,
  updateJob,
  assignRecruiters as apiAssignRecruiters,
  listRecruiters,
  getErrorMessage,
} from "../../../../../api/recruitment.api";
import { errorToast, successToast } from "../../../../../utils/ToastControllers";
import { PERIODS } from "../constants";
import { periodStart, filterJobs, computePeriodCounts } from "../utils";

export function useJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [period, setPeriod] = useState("all");
  const [detailJob, setDetailJob] = useState(null);
  const [assignOpen, setAssignOpen] = useState(null);
  const [assignIds, setAssignIds] = useState([]);
  const [originalIds, setOriginalIds] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [loadingAssign, setLoadingAssign] = useState(false);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.assignmentStatus = filterStatus;
      if (search) params.search = search;
      const { data, meta } = await listJobs({ ...params, limit: 200 });
      setJobs(data ?? []);
      setTotalCount(meta?.total ?? data?.length ?? 0);
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to load jobs"));
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  useEffect(() => {
    listRecruiters().then((rows) => setRecruiters(rows ?? [])).catch(() => {});
  }, []);

  const openAssign = useCallback(async (row) => {
    setAssignOpen(row);
    setLoadingAssign(true);
    try {
      const job = await getJob(row.job_req_id);
      const ids = (job.recruiters ?? []).map((r) => r.employee_id);
      setAssignIds(ids);
      setOriginalIds(ids);
    } catch {
      setAssignIds([]);
      setOriginalIds([]);
    } finally {
      setLoadingAssign(false);
    }
  }, []);

  const closeAssign = useCallback(() => {
    setAssignOpen(null);
    setAssignIds([]);
    setOriginalIds([]);
  }, []);

  const handleAssign = useCallback(async () => {
    setAssigning(true);
    try {
      await apiAssignRecruiters(assignOpen.job_req_id, assignIds);
      successToast("Recruiters assigned successfully");
      setAssignOpen(null);
      setAssignIds([]);
      loadJobs();
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to assign recruiters"));
    } finally {
      setAssigning(false);
    }
  }, [assignOpen, assignIds, loadJobs]);

  const handleClose = useCallback(async (job) => {
    if (!window.confirm(`Close "${job.title}"? This will move it from Open to Closed.`)) return;
    try {
      await updateJob(job.job_req_id, { assignmentStatus: "Closed" });
      successToast("Job request closed");
      setDetailJob(null);
      loadJobs();
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to close job"));
    }
  }, [loadJobs]);

  const start = useMemo(() => periodStart(period), [period]);

  const visibleJobs = useMemo(
    () => filterJobs(jobs, search, filterStatus, start),
    [jobs, search, filterStatus, start]
  );

  const periodCounts = useMemo(
    () => computePeriodCounts(jobs, PERIODS),
    [jobs]
  );

  const totalOpen = useMemo(
    () => jobs.filter((j) => j.assignment_status === "Open").length,
    [jobs]
  );

  const totalCompleted = useMemo(
    () => jobs.filter((j) => j.assignment_status === "Completed").length,
    [jobs]
  );

  return {
    jobs,
    totalCount,
    recruiters,
    loading,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    period,
    setPeriod,
    detailJob,
    setDetailJob,
    assignOpen,
    assignIds,
    setAssignIds,
    originalIds,
    assigning,
    loadingAssign,
    loadJobs,
    openAssign,
    closeAssign,
    handleAssign,
    handleClose,
    visibleJobs,
    periodCounts,
    totalOpen,
    totalCompleted,
  };
}
