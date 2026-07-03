const asyncHandler  = require("express-async-handler");
const candidateSvc  = require("../../services/recruitment/candidate.service");
const { getPagination, buildMeta } = require("../../utils/pagination");
const ApiResponse   = require("../../utils/ApiResponse");

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
  // Recruiter (role 5) always assigned to themselves; HR Manager picks from dropdown
  if (req.user.roleId === 5) body.recruiterId = req.user.employeeId;
  const data = await candidateSvc.create(body, req.user.userId, req.ip);
  new ApiResponse(201, data, "Candidate created").send(res);
});

const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const data = await candidateSvc.updateStatus(Number(req.params.id), status, req.user.userId, req.ip);
  new ApiResponse(200, data, "Candidate status updated").send(res);
});

module.exports = { list, getOne, create, updateStatus };
