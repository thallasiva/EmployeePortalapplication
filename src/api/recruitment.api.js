import apiClient, { unwrap, unwrapList, getErrorMessage } from "./client";




export const listRecruiters = () =>
apiClient.get("/recruitment/recruiters").then((r) => r.data?.data ?? []);




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




export const listCandidates = (params) =>
apiClient.get("/recruitment/candidates", { params }).then(unwrapList);

export const getCandidate = (id) =>
apiClient.get(`/recruitment/candidates/${id}`).then(unwrap);

export const createCandidate = (payload) =>
apiClient.post("/recruitment/candidates", payload).then(unwrap);

export const updateCandidateStatus = (id, status) =>
apiClient.put(`/recruitment/candidates/${id}/status`, { status }).then(unwrap);




export const listInterviews = (params) =>
apiClient.get("/recruitment/interviews", { params }).then(unwrapList);

export const getInterview = (id) =>
apiClient.get(`/recruitment/interviews/${id}`).then(unwrap);

export const scheduleInterview = (payload) =>
apiClient.post("/recruitment/interviews", payload).then(unwrap);

export const submitFeedback = (id, payload) =>
apiClient.put(`/recruitment/interviews/${id}/feedback`, payload).then(unwrap);

export const submitRecruiterFeedback = (id, payload) =>
apiClient.put(`/recruitment/interviews/${id}/recruiter-feedback`, payload).then(unwrap);

export const cancelInterview = (id) =>
apiClient.put(`/recruitment/interviews/${id}/cancel`, {}).then(unwrap);




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

export const downloadOfferDocx = async (id, filename) => {
  const res = await apiClient.get(`/recruitment/offers/${id}/download-docx`, { responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([res.data], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }));
  const a = document.createElement('a');
  a.href = url;a.download = filename || `Offer_Letter_${id}.docx`;a.click();
  URL.revokeObjectURL(url);
};




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




export const getDashboard = () =>
apiClient.get("/recruitment/dashboard").then(unwrap);

export const getPipelineReport = (params) =>
apiClient.get("/recruitment/dashboard/report", { params }).then(unwrap);




export const quickResumeMatch = (jobReqId, candidateSkills, candidateExperience) =>
apiClient.post("/recruitment/resume-match/quick", { jobReqId, candidateSkills, candidateExperience }).then(unwrap);


export const parseResume = (file) => {
  const form = new FormData();
  form.append("resume", file);
  return apiClient.post("/recruitment/resume-match/parse", form, {
    headers: { "Content-Type": "multipart/form-data" }
  }).then(unwrap);
};

export const uploadResumeMatch = (jobReqId, file) => {
  const form = new FormData();
  form.append("jobReqId", String(jobReqId));
  form.append("resume", file);
  return apiClient.post("/recruitment/resume-match/upload", form, {
    headers: { "Content-Type": "multipart/form-data" }
  }).then(unwrap);
};

export const getResumeMatch = (candidateId, jobReqId) =>
apiClient.get(`/recruitment/resume-match/candidate/${candidateId}/job/${jobReqId}`).then(unwrap);

export const computeResumeMatch = (candidateId, jobReqId) =>
apiClient.post(`/recruitment/resume-match/candidate/${candidateId}/job/${jobReqId}`).then(unwrap);

export const listMatchesByJob = (jobReqId) =>
apiClient.get(`/recruitment/resume-match/job/${jobReqId}`).then((r) => r.data?.data ?? []);


export { getErrorMessage };

// ── AI Interview ──────────────────────────────────────────────────────────────
export const createAIInterview = (payload) =>
  apiClient.post("/recruitment/ai-interviews", payload).then(unwrap);

export const listAIInterviews = (params = {}) =>
  apiClient.get("/recruitment/ai-interviews", { params }).then(unwrapList);

export const getAIInterviewReport = (sessionId) =>
  apiClient.get(`/recruitment/ai-interviews/report/${sessionId}`).then(unwrap);

// Public (no auth) — candidate-facing
export const getAIInterviewSession = (token) =>
  apiClient.get(`/recruitment/public/ai-interview/${token}`).then(unwrap);

export const startAIInterview = (token) =>
  apiClient.post(`/recruitment/public/ai-interview/${token}/start`).then(unwrap);

export const answerAIInterview = (token, answer) =>
  apiClient.post(`/recruitment/public/ai-interview/${token}/answer`, { answer }).then(unwrap);

export const completeAIInterview = (token) =>
  apiClient.post(`/recruitment/public/ai-interview/${token}/complete`).then(unwrap);
