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
    roleId:      user.role_id,
    recEmpId:    user.employee_id,
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
  const data = await candidateSvc.create(req.body, req.user.user_id, req.ip);
  new ApiResponse(201, data, "Candidate created").send(res);
});

const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const data = await candidateSvc.updateStatus(Number(req.params.id), status, req.user.user_id, req.ip);
  new ApiResponse(200, data, "Candidate status updated").send(res);
});

module.exports = { list, getOne, create, updateStatus };
