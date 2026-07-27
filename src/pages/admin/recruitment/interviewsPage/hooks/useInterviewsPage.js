import { useState, useEffect, useCallback, useMemo } from "react";
import {
  listInterviews,
  scheduleInterview,
  submitFeedback as apiSubmitFeedback,
  submitRecruiterFeedback as apiSubmitRecruiterFeedback,
  listCandidates,
  listJobs,
  getErrorMessage,
} from "../../../../../api/recruitment.api";
import { successToast, errorToast } from "../../../../../utils/ToastControllers";
import { BLANK_INT, BLANK_FB, LEVEL_ORDER } from "../constants";
import { INTERVIEW_LEVELS, INTERVIEW_TYPES } from "../mockData";

export function useInterviewsPage(role) {
  const [interviews, setInterviews] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [schedOpen, setSchedOpen] = useState(false);
  const [fbOpen, setFbOpen] = useState(null);
  const [fbRecruiterOpen, setFbRecruiterOpen] = useState(null);
  const [viewIv, setViewIv] = useState(null);
  const [form, setForm] = useState(BLANK_INT);
  const [fb, setFb] = useState(BLANK_FB);
  const [fbRecruiter, setFbRecruiter] = useState(BLANK_FB);
  const [saving, setSaving] = useState(false);

  const isAdmin = role === 1;
  const isTL = role === 3 || role === 4;
  const isRecruiter = role === 5;
  const isExternal = isRecruiter;
  const canSchedule = isAdmin || isTL || isRecruiter;
  const canFeedback = isAdmin || isTL;
  const canRecruiterFeedback = isRecruiter;

  useEffect(() => {
    listCandidates({ limit: 500 }).then((r) => setCandidates(r?.data ?? [])).catch(() => {});
    listJobs({ limit: 200 }).then((r) => setJobs(r?.data ?? [])).catch(() => {});
  }, []);

  const loadInterviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 500 };
      if (filterLevel) params.level = filterLevel;
      if (filterStatus) params.status = filterStatus;
      if (search) params.search = search;
      const { data } = await listInterviews(params);
      setInterviews(data ?? []);
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to load interviews"));
    } finally {
      setLoading(false);
    }
  }, [filterLevel, filterStatus, search]);

  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

  const handleSchedule = useCallback(async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const participants = form.toAddresses
        ? form.toAddresses.split(";").map((s) => s.trim()).filter(Boolean).join(", ")
        : form.teamsParticipants || null;

      await scheduleInterview({
        candidateId: Number(form.candidateId),
        jobReqId: Number(form.jobReqId) || null,
        level: form.level,
        interviewType: form.interviewType,
        interviewDate: form.interviewDate,
        interviewTime: form.interviewTime || null,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null,
        interviewer: form.interviewer || null,
        candidateType: form.candidateType || "External",
        teamsSubject: form.teamsSubject || null,
        teamsParticipants: participants,
        teamsStart: form.teamsStart || null,
        teamsEnd: form.teamsEnd || null,
      });
      successToast("Interview scheduled");
      setSchedOpen(false);
      setForm(BLANK_INT);
      loadInterviews();
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to schedule interview"));
    } finally {
      setSaving(false);
    }
  }, [form, loadInterviews]);

  const handleFeedback = useCallback(async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiSubmitFeedback(fbOpen.interview_id, {
        feedbackStatus: fb.feedbackStatus,
        feedbackComments: fb.feedbackComments || null,
        shortlisted: fb.shortlisted,
      });
      successToast("Feedback submitted");
      setFbOpen(null);
      setFb(BLANK_FB);
      loadInterviews();
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to submit feedback"));
    } finally {
      setSaving(false);
    }
  }, [fbOpen, fb, loadInterviews]);

  const handleRecruiterFeedback = useCallback(async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiSubmitRecruiterFeedback(fbRecruiterOpen.interview_id, {
        feedbackStatus: fbRecruiter.feedbackStatus,
        feedbackComments: fbRecruiter.feedbackComments || null,
      });
      successToast("Recruiter feedback submitted");
      setFbRecruiterOpen(null);
      setFbRecruiter(BLANK_FB);
      loadInterviews();
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to submit feedback"));
    } finally {
      setSaving(false);
    }
  }, [fbRecruiterOpen, fbRecruiter, loadInterviews]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }, []);

  const handleFbChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFb((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }, []);

  const openFeedback = useCallback((row) => {
    setFbOpen(row);
    setFb({
      feedbackStatus: row.feedback_status || "",
      feedbackComments: row.feedback_comments || "",
      shortlisted: !!row.shortlisted,
    });
  }, []);

  const openRecruiterFeedback = useCallback((row) => {
    setFbRecruiterOpen(row);
    setFbRecruiter({
      feedbackStatus: row.recruiter_feedback_status || "",
      feedbackComments: row.recruiter_feedback_comments || "",
      shortlisted: false,
    });
  }, []);

  const groups = useMemo(() => {
    const filtered = interviews.filter((iv) => {
      const q = search.toLowerCase();
      const matchQ =
        !q ||
        (iv.candidate_name || "").toLowerCase().includes(q) ||
        (iv.interview_code || "").toLowerCase().includes(q) ||
        (iv.job_title || "").toLowerCase().includes(q);
      return matchQ && (!filterLevel || iv.level === filterLevel) && (!filterStatus || iv.status === filterStatus);
    });

    const grouped = {};
    for (const iv of filtered) {
      const key = iv.candidate_id;
      if (!grouped[key]) {
        grouped[key] = {
          candidateId: iv.candidate_id,
          candidateName: iv.candidate_name,
          jobTitle: iv.job_title,
          rounds: [],
        };
      }
      grouped[key].rounds.push(iv);
    }
    return Object.values(grouped);
  }, [interviews, search, filterLevel, filterStatus]);

  const candidateOpts = useMemo(
    () => candidates.map((c) => ({ value: String(c.candidate_id), label: c.candidate_code + " — " + c.name })),
    [candidates]
  );
  const jobOpts = useMemo(
    () => jobs.map((j) => ({ value: String(j.job_req_id), label: j.job_req_code + " — " + j.title })),
    [jobs]
  );
  const levelOpts = useMemo(
    () => [{ value: "", label: "All Levels" }, ...INTERVIEW_LEVELS.map((l) => ({ value: l, label: l }))],
    []
  );
  const statusOpts = useMemo(
    () => [
      { value: "", label: "All Statuses" },
      { value: "Scheduled", label: "Scheduled" },
      { value: "Completed", label: "Completed" },
      { value: "Cancelled", label: "Cancelled" },
    ],
    []
  );

  return {
    interviews,
    loading,
    search,
    setSearch,
    filterLevel,
    setFilterLevel,
    filterStatus,
    setFilterStatus,
    schedOpen,
    setSchedOpen,
    fbOpen,
    setFbOpen,
    fbRecruiterOpen,
    setFbRecruiterOpen,
    viewIv,
    setViewIv,
    form,
    setForm,
    fb,
    setFb,
    fbRecruiter,
    setFbRecruiter,
    saving,
    isAdmin,
    isExternal,
    canSchedule,
    canFeedback,
    canRecruiterFeedback,
    groups,
    candidateOpts,
    jobOpts,
    levelOpts,
    statusOpts,
    loadInterviews,
    handleSchedule,
    handleFeedback,
    handleRecruiterFeedback,
    handleChange,
    handleFbChange,
    openFeedback,
    openRecruiterFeedback,
  };
}
