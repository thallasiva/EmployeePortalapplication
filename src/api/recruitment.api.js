import apiClient, { unwrap, unwrapList, getErrorMessage } from "./client";

// ─────────────────────────────────────────────────────────────────────
// RECRUITERS (dropdown helper — avoids employee-view permission)
// ─────────────────────────────────────────────────────────────────────
export const listRecruiters = () =>
  apiClient.get("/recruitment/recruiters").then(r => r.data?.data ?? []);

// ─────────────────────────────────────────────────────────────────────
// JOB REQUESTS
// ─────────────────────────────────────────────────────────────────────
export const listJobs = (params) =>
  apiClient.get("/recruitment/jobs", { params }).then(unwrapList);

export const getJob = (id) =>
  apiClient.get(`/recruitment/jobs/${id}`).then(unwrap);

export const createJob = (payload) =>
  apiClient.post("/recruitment/jobs", payload).then(unwrap);

export const updateJob = (id, payload) =>
  apiClient.put(`/recruitment/jobs/${id}`, payload).then(unwrap);

export const deleteJob = (id) =>
  apiClient.delete(`/recruitment/jobs/${id}`).then(unwrap);

export const assignRecruiters = (jobId, recruiterIds) =>
  apiClient.put(`/recruitment/jobs/${jobId}/assign-recruiters`, { recruiterIds }).then(unwrap);

// ─────────────────────────────────────────────────────────────────────
// CANDIDATES
// ─────────────────────────────────────────────────────────────────────
export const listCandidates = (params) =>
  apiClient.get("/recruitment/candidates", { params }).then(unwrapList);

export const getCandidate = (id) =>
  apiClient.get(`/recruitment/candidates/${id}`).then(unwrap);

export const createCandidate = (payload) =>
  apiClient.post("/recruitment/candidates", payload).then(unwrap);

export const updateCandidateStatus = (id, status) =>
  apiClient.put(`/recruitment/candidates/${id}/status`, { status }).then(unwrap);

// ─────────────────────────────────────────────────────────────────────
// INTERVIEWS
// ─────────────────────────────────────────────────────────────────────
export const listInterviews = (params) =>
  apiClient.get("/recruitment/interviews", { params }).then(unwrapList);

export const getInterview = (id) =>
  apiClient.get(`/recruitment/interviews/${id}`).then(unwrap);

export const scheduleInterview = (payload) =>
  apiClient.post("/recruitment/interviews", payload).then(unwrap);

export const submitFeedback = (id, payload) =>
  apiClient.put(`/recruitment/interviews/${id}/feedback`, payload).then(unwrap);

export const cancelInterview = (id) =>
  apiClient.put(`/recruitment/interviews/${id}/cancel`, {}).then(unwrap);

// ─────────────────────────────────────────────────────────────────────
// OFFERS
// ─────────────────────────────────────────────────────────────────────
export const listOffers = (params) =>
  apiClient.get("/recruitment/offers", { params }).then(unwrapList);

export const getOffer = (id) =>
  apiClient.get(`/recruitment/offers/${id}`).then(unwrap);

export const createOffer = (payload) =>
  apiClient.post("/recruitment/offers", payload).then(unwrap);

export const releaseOffer = (id) =>
  apiClient.put(`/recruitment/offers/${id}/release`, {}).then(unwrap);

export const respondOffer = (id, response) =>
  apiClient.put(`/recruitment/offers/${id}/respond`, { response }).then(unwrap);

// ─────────────────────────────────────────────────────────────────────
// ONBOARDING
// ─────────────────────────────────────────────────────────────────────
export const listOnboarding = (params) =>
  apiClient.get("/recruitment/onboarding", { params }).then(unwrapList);

export const getOnboarding = (id) =>
  apiClient.get(`/recruitment/onboarding/${id}`).then(unwrap);

export const createOnboarding = (payload) =>
  apiClient.post("/recruitment/onboarding", payload).then(unwrap);

export const updateOnboardingTask = (id, taskName, taskValue) =>
  apiClient.put(`/recruitment/onboarding/${id}/task`, { taskName, taskValue }).then(unwrap);

export const finalizeOnboarding = (id) =>
  apiClient.put(`/recruitment/onboarding/${id}/finalize`, {}).then(unwrap);

// ─────────────────────────────────────────────────────────────────────
// DASHBOARD & REPORTS
// ─────────────────────────────────────────────────────────────────────
export const getDashboard = () =>
  apiClient.get("/recruitment/dashboard").then(unwrap);

export const getPipelineReport = (params) =>
  apiClient.get("/recruitment/dashboard/report", { params }).then(unwrap);

// ─────────────────────────────────────────────────────────────────────
// RESUME MATCH
// ─────────────────────────────────────────────────────────────────────
export const quickResumeMatch = (jobReqId, candidateSkills, candidateExperience) =>
  apiClient.post("/recruitment/resume-match/quick", { jobReqId, candidateSkills, candidateExperience }).then(unwrap);

export const uploadResumeMatch = (jobReqId, file) => {
  const form = new FormData();
  form.append("jobReqId", String(jobReqId));
  form.append("resume", file);
  return apiClient.post("/recruitment/resume-match/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then(unwrap);
};

export const getResumeMatch = (candidateId, jobReqId) =>
  apiClient.get(`/recruitment/resume-match/candidate/${candidateId}/job/${jobReqId}`).then(unwrap);

export const computeResumeMatch = (candidateId, jobReqId) =>
  apiClient.post(`/recruitment/resume-match/candidate/${candidateId}/job/${jobReqId}`).then(unwrap);

export const listMatchesByJob = (jobReqId) =>
  apiClient.get(`/recruitment/resume-match/job/${jobReqId}`).then(r => r.data?.data ?? []);

// Re-export helper so pages can surface friendly messages
export { getErrorMessage };
