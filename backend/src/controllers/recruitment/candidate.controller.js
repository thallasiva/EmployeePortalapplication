const asyncHandler = require("express-async-handler");
const candidateSvc = require("../../services/recruitment/candidate.service");
const resumeMatchSvc = require("../../services/recruitment/resumeMatch.service");
const resumeParserSvc = require("../../services/recruitment/resumeParser.service");
const { callProcedure, query } = require("../../config/db");
const { getPagination, buildMeta } = require("../../utils/pagination");
const ApiResponse = require("../../utils/ApiResponse");
const ApiError = require("../../utils/ApiError");
const followupSvc = require("../../services/recruitment/candidateFollowup.service");
const jobRequestSvc = require("../../services/recruitment/jobRequest.service");
const { hasScopeAccess } = require("../../utils/accessScope");

function isRecruiter(user) {
  return Number(user?.roleId) === 5 || user?.roleKeys?.includes("RECRUITER");
}

function scopedResourceIds(user, resourceTypes) {
  return (user?.scopeAssignments || [])
    .filter((scope) => scope.scope_type === "ASSIGNED_RESOURCE"
      && resourceTypes.includes(String(scope.resource_type || "").toUpperCase()))
    .map((scope) => Number(scope.resource_id))
    .filter((id) => Number.isInteger(id) && id > 0);
}

async function getRecruiterJobIds(user) {
  const ids = scopedResourceIds(user, ["JOB", "JOB_REQ", "JOB_REQUISITION", "RECRUITMENT_JOB"]);
  if (!user?.employeeId) return [...new Set(ids)];
  const result = await jobRequestSvc.list({
    roleId: 5,
    recruiterEmpId: user.employeeId,
    limit: 1000,
    offset: 0,
  });
  return [...new Set([
    ...ids,
    ...(result.rows || []).map((row) => Number(row.job_req_id || row.id)).filter((id) => Number.isInteger(id) && id > 0),
  ])];
}

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const user = req.user;
  const parseTextFilter = (key) => {
    if (req.query[key] == null) return undefined;
    if (typeof req.query[key] !== "string") throw new ApiError(400, `${key} must be a single string`);
    return req.query[key].trim() || undefined;
  };
  const parseExperience = (key) => {
    if (req.query[key] == null || req.query[key] === "") return undefined;
    const value = Number(req.query[key]);
    if (!Number.isFinite(value) || value < 0) throw new ApiError(400, `${key} must be a non-negative number`);
    return value;
  };
  const minExperience = parseExperience("minExperience");
  const maxExperience = parseExperience("maxExperience");
  if (minExperience != null && maxExperience != null && minExperience > maxExperience) {
    throw new ApiError(400, "minExperience must not exceed maxExperience");
  }
  const recruiter = isRecruiter(user);
  const [authorizedJobReqIds, authorizedCandidateIds] = recruiter
    ? await Promise.all([
      getRecruiterJobIds(user),
      scopedResourceIds(user, ["CANDIDATE"]),
    ])
    : [[], []];
  const { rows, total } = await candidateSvc.list({
    jobReqId: req.query.jobReqId ? Number(req.query.jobReqId) : undefined,
    status: req.query.status,
    recruiterId: req.query.recruiterId ? Number(req.query.recruiterId) : undefined,
    search: req.query.search,
    skill: parseTextFilter("skill"),
    minExperience,
    maxExperience,
    role: parseTextFilter("role"),
    source: parseTextFilter("source"),
    roleId: recruiter ? 5 : user.roleId,
    recEmpId: user.employeeId,
    authorizedJobReqIds,
    authorizedCandidateIds,
    limit,
    offset
  });
  new ApiResponse(200, rows, "Candidates fetched", buildMeta({ page, limit, total })).send(res);
});
const getOne = asyncHandler(async (req, res) => {
  const data = await getAccessibleCandidate(Number(req.params.id), req);
  new ApiResponse(200, data, "Candidate fetched").send(res);
});
const create = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (isRecruiter(req.user)) {
    const allowedJobIds = await getRecruiterJobIds(req.user);
    if (!allowedJobIds.includes(Number(body.jobReqId))) {
      throw new ApiError(403, "You may only add candidates to requisitions assigned to you");
    }
    body.recruiterId = req.user.employeeId;
  } else if (!body.recruiterId) {
    body.recruiterId = req.user.employeeId;
  }
  const parsedSkills = Array.isArray(body.parsed_skills) ? body.parsed_skills : null;
  const parsedEducation = Array.isArray(body.parsed_education) ? body.parsed_education : null;
  const parsedWorkExp = Array.isArray(body.parsed_work_experience) ? body.parsed_work_experience : null;
  const resumeHash = body.resume_hash || null;
  const linkedinUrl = body.linkedin_url || null;
  const githubUrl = body.github_url || null;
  const noticePeriodDays = body.notice_period_days != null ? Number(body.notice_period_days) : null;
  const companies = Array.isArray(body.companies) ? body.companies : null;
  const currentDesignation = body.current_designation || null;
  delete body.parsed_skills;
  delete body.parsed_education;
  delete body.parsed_work_experience;
  delete body.resume_hash;
  delete body.linkedin_url;
  delete body.github_url;
  delete body.notice_period_days;
  delete body.companies;
  delete body.current_designation;
  let duplicates = [];
  if (body.email || resumeHash) {
    duplicates = await resumeParserSvc.checkDuplicate(body.email, resumeHash);
  }
  const data = await candidateSvc.create(body, req.user.userId, req.ip);
  const candidateId = data?.candidate_id;
  const jobReqId = data?.job_req_id;
  setImmediate(async () => {
    try {
      if (candidateId && jobReqId) {
        await resumeMatchSvc.computeAndStore(candidateId, jobReqId).catch((err) =>
        console.error(`[Candidate] Match score failed for ${candidateId}:`, err.message)
        );
      }
      if (candidateId && (parsedSkills || parsedEducation || parsedWorkExp)) {
        const fakeParseResult = {
          skills: parsedSkills || [],
          education: parsedEducation || [],
          work_experience: parsedWorkExp || [],
          companies: companies || [],
          resumeHash,
          linkedin_url: linkedinUrl,
          github_url: githubUrl,
          notice_period_days: noticePeriodDays,
          current_role: currentDesignation,
          parsedBy: 'openai',
          rawText: ''
        };
        await resumeParserSvc.persistParsedResume(candidateId, fakeParseResult, {
          originalname: body.resume_path ? body.resume_path.split('/').pop() : 'resume',
          size: 0,
          mimetype: ''
        });
      }
    } catch (err) {
      console.error(`[Candidate] Background tasks failed for candidate ${candidateId}:`, err.message);
    }
  });
  new ApiResponse(201, {
    ...data,
    duplicates: duplicates.length ? duplicates : undefined
  }, duplicates.length ?
  `Candidate created. Warning: ${duplicates.length} possible duplicate(s) found.` :
  "Candidate created"
  ).send(res);
});
const updateStatus = asyncHandler(async (req, res) => {
  await getAccessibleCandidate(Number(req.params.id), req);
  const { status } = req.body;
  const adminOnlyStatuses = ["Offer Released", "Offer Accepted", "Offer Rejected", "Joining Formalities", "Onboarded"];
  const hiringAdmin = Number(req.user.roleId) === 1
    || req.user.roleKeys?.some((key) => ["SUPER_ADMIN", "COMPANY_ADMIN", "HR_HEAD", "HR_MANAGER", "RECRUITMENT_HEAD"].includes(key));
  if (!hiringAdmin && adminOnlyStatuses.includes(status)) {
    throw new ApiError(403, "Only an administrator can advance candidates through offer and onboarding stages");
  }
  if (adminOnlyStatuses.includes(status)) {
    throw new ApiError(409, "Use the offer or onboarding workflow to advance candidates through these stages");
  }
  const data = await candidateSvc.updateStatus(Number(req.params.id), status, req.user.userId, req.ip);
  new ApiResponse(200, data, "Candidate status updated").send(res);
});
async function getAccessibleCandidate(candidateId, req) {
  const candidate = await candidateSvc.getById(candidateId);
  if (isRecruiter(req.user)) {
    const ownCandidate = Number(candidate.recruiter_id) === Number(req.user.employeeId);
    const assigned = hasScopeAccess(req.user, {
      resource_type: "CANDIDATE",
      resource_id: candidateId,
    }) || ["JOB", "JOB_REQ", "JOB_REQUISITION", "RECRUITMENT_JOB"].some((resourceType) =>
      hasScopeAccess(req.user, { resource_type: resourceType, resource_id: candidate.job_req_id })
    );
    if (!ownCandidate && !assigned) throw new ApiError(404, "Candidate not found");
  }
  return candidate;
}
const getHistory = asyncHandler(async (req, res) => {
  const candidateId = Number(req.params.id);
  await getAccessibleCandidate(candidateId, req);
  const history = await query(
    `SELECT log_id, entity_type, action, old_value, new_value, performed_by, performed_at
       FROM rec_audit_log
      WHERE entity_type = 'candidate' AND entity_id = ?
     UNION ALL
     SELECT l.log_id, l.entity_type, l.action, l.old_value, l.new_value, l.performed_by, l.performed_at
       FROM rec_audit_log l
       JOIN rec_interviews i ON l.entity_type = 'interview' AND l.entity_id = i.interview_id
      WHERE i.candidate_id = ?
     UNION ALL
     SELECT l.log_id, l.entity_type, l.action, l.old_value, l.new_value, l.performed_by, l.performed_at
       FROM rec_audit_log l
       JOIN rec_offers o ON l.entity_type = 'offer' AND l.entity_id = o.offer_id
      WHERE o.candidate_id = ?
     UNION ALL
     SELECT l.log_id, l.entity_type, l.action, l.old_value, l.new_value, l.performed_by, l.performed_at
       FROM rec_audit_log l
       JOIN rec_onboarding ob ON l.entity_type = 'onboarding' AND l.entity_id = ob.onboarding_id
      WHERE ob.candidate_id = ?
      ORDER BY performed_at DESC, log_id DESC
      LIMIT 100`,
    [candidateId, candidateId, candidateId, candidateId]
  );
  new ApiResponse(200, history, "Candidate history fetched").send(res);
});
const listFollowups = asyncHandler(async (req, res) => {
  const candidateId = Number(req.params.id);
  await getAccessibleCandidate(candidateId, req);
  new ApiResponse(200, await followupSvc.list(candidateId), "Candidate follow-ups fetched").send(res);
});
const createFollowup = asyncHandler(async (req, res) => {
  const candidateId = Number(req.params.id);
  const candidate = await getAccessibleCandidate(candidateId, req);
  const assignedTo = Number(req.body.assignedTo) || Number(candidate.recruiter_id);
  if (!assignedTo) throw new ApiError(400, "A recruiter must be assigned to this follow-up");
  const dueAt = `${req.body.dueAt.replace("T", " ")}:00`;
  const data = await followupSvc.create({
    candidateId,
    assignedTo,
    dueAt,
    note: req.body.note,
    createdBy: req.user.userId,
    ip: req.ip
  });
  new ApiResponse(201, data, "Candidate follow-up created").send(res);
});
const updateFollowup = asyncHandler(async (req, res) => {
  const candidateId = Number(req.params.id);
  await getAccessibleCandidate(candidateId, req);
  const data = await followupSvc.updateStatus({
    candidateId,
    followupId: Number(req.params.followupId),
    status: req.body.status,
    updatedBy: req.user.userId,
    ip: req.ip
  });
  if (!data) throw new ApiError(404, "Candidate follow-up not found");
  new ApiResponse(200, data, "Candidate follow-up updated").send(res);
});
const getSkills = asyncHandler(async (req, res) => {
  await getAccessibleCandidate(Number(req.params.id), req);
  const rows = await callProcedure('sp_rec_get_candidate_skills(?)', [Number(req.params.id)]);
  new ApiResponse(200, rows[0] ?? [], "Skills fetched").send(res);
});
const getEducation = asyncHandler(async (req, res) => {
  await getAccessibleCandidate(Number(req.params.id), req);
  const rows = await callProcedure('sp_rec_get_candidate_education(?)', [Number(req.params.id)]);
  new ApiResponse(200, rows[0] ?? [], "Education fetched").send(res);
});
const getExperience = asyncHandler(async (req, res) => {
  await getAccessibleCandidate(Number(req.params.id), req);
  const rows = await callProcedure('sp_rec_get_candidate_experience(?)', [Number(req.params.id)]);
  new ApiResponse(200, rows[0] ?? [], "Experience fetched").send(res);
});
const getParserLogs = asyncHandler(async (req, res) => {
  const candidateId = req.query.candidateId ? Number(req.query.candidateId) : null;
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const rows = await callProcedure('sp_rec_get_parser_logs(?, ?)', [candidateId, limit]);
  new ApiResponse(200, rows[0] ?? [], "Parser logs fetched").send(res);
});
module.exports = {
  list, getOne, create, updateStatus, getHistory, listFollowups, createFollowup, updateFollowup,
  getSkills, getEducation, getExperience, getParserLogs
};
