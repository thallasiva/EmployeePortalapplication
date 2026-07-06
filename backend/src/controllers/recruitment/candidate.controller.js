const asyncHandler   = require("express-async-handler");
const candidateSvc   = require("../../services/recruitment/candidate.service");
const resumeMatchSvc = require("../../services/recruitment/resumeMatch.service");
const { getPagination, buildMeta } = require("../../utils/pagination");
const ApiResponse    = require("../../utils/ApiResponse");

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const user = req.user;
  const { rows, total } = await candidateSvc.list({
    jobReqId:    req.query.jobReqId ? Number(req.query.jobReqId) : undefined,
    status:      req.query.status,
    recruiterId: req.query.recruiterId ? Number(req.query.recruiterId) : undefined,
    search:      req.query.search,
    roleId:      user.roleId,
    recEmpId:    user.employeeId,
    limit,
    offset,
  });
  new ApiResponse(200, rows, "Candidates fetched", buildMeta({ page, limit, total })).send(res);
});

const getOne = asyncHandler(async (req, res) => {
  const data = await candidateSvc.getById(Number(req.params.id));
  new ApiResponse(200, data, "Candidate fetched").send(res);
});

const create = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  // Auto-assign recruiter: if not provided in payload, default to the logged-in user's employee ID
  if (!body.recruiterId) body.recruiterId = req.user.employeeId;
  const data = await candidateSvc.create(body, req.user.userId, req.ip);

  // Auto-compute resume match score in background (non-blocking)
  if (data?.candidate_id && data?.job_req_id) {
    resumeMatchSvc.autoComputeAsync(data.candidate_id, data.job_req_id);
  }

  new ApiResponse(201, data, "Candidate created").send(res);
});

const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const data = await candidateSvc.updateStatus(Number(req.params.id), status, req.user.userId, req.ip);
  new ApiResponse(200, data, "Candidate status updated").send(res);
});

module.exports = { list, getOne, create, updateStatus };
