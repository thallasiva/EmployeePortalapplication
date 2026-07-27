import { useState, useEffect, useCallback, useRef } from "react";
import {
  listCandidates, listJobs, listRecruiters,
  updateCandidateStatus as apiUpdateStatus,
  scheduleInterview, listInterviews, getErrorMessage
} from "../../../../../api/recruitment.api";
import { successToast, errorToast } from "../../../../../utils/ToastControllers";
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
  const [schedOpen, setSchedOpen] = useState(false);
  const [intForm, setIntForm] = useState(BLANK_INT);
  const [scheduling, setScheduling] = useState(false);
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
      errorToast(getErrorMessage(err, "Failed to load candidates"));
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
      errorToast(getErrorMessage(err, "Failed to update status"));
    }
  }, [candidates]);

  const openSchedule = useCallback(async (candidate) => {
    setIntForm({ ...BLANK_INT, candidateId: candidate.candidate_id, jobReqId: candidate.job_req_id, level: "Round 1" });
    setSchedOpen(true);
    try {
      const { data: ivs } = await listInterviews({ candidateId: candidate.candidate_id, limit: 20 });
      const completedLevels = (ivs || [])
        .filter((iv) => iv.status === "Completed" && iv.feedback_status === "Selected")
        .map((iv) => iv.level);
      const maxIdx = completedLevels.reduce((max, lvl) => {
        const idx = LEVEL_ORDER.indexOf(lvl);
        return idx > max ? idx : max;
      }, -1);
      const nextLevel = maxIdx >= 0 && maxIdx + 1 < LEVEL_ORDER.length ? LEVEL_ORDER[maxIdx + 1] : "Round 1";
      setIntForm((f) => ({ ...f, level: nextLevel }));
    } catch {}
  }, []);

  const handleScheduleInterview = useCallback(async (e) => {
    e.preventDefault();
    if (!intForm.interviewDate || !intForm.interviewTime || !intForm.interviewer) return;
    setScheduling(true);
    try {
      await scheduleInterview({
        candidateId: intForm.candidateId,
        jobReqId: intForm.jobReqId,
        level: intForm.level,
        interviewType: intForm.interviewType,
        interviewDate: intForm.interviewDate,
        interviewTime: intForm.interviewTime,
        durationMinutes: intForm.durationMinutes ? Number(intForm.durationMinutes) : null,
        interviewer: intForm.interviewer,
        teamsSubject: intForm.teamsSubject || null,
        teamsParticipants: intForm.teamsParticipants || null,
        teamsStart: intForm.teamsStart || null,
        teamsEnd: intForm.teamsEnd || null
      });
      successToast("Interview scheduled successfully");
      setSchedOpen(false);
      setIntForm(BLANK_INT);
      loadCandidates();
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to schedule interview"));
    } finally {
      setScheduling(false);
    }
  }, [intForm, loadCandidates]);

  const handleIntChange = useCallback((e) => {
    const { name, value } = e.target;
    setIntForm((f) => ({ ...f, [name]: value }));
  }, []);

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
    addOpen, detail, schedOpen, intForm, scheduling, tableRef,
    isAdmin, isTL, isHRMgr, isRecruiter,
    setSearch, setFilterStatus, setFilterJob,
    setAddOpen, setDetail, setSchedOpen, setIntForm,
    loadCandidates, updateStatus, openSchedule,
    handleScheduleInterview, handleIntChange
  };
}
