const asyncHandler   = require("express-async-handler");
const jobRequestSvc  = require("../../services/recruitment/jobRequest.service");
const { getPagination, buildMeta } = require("../../utils/pagination");
const ApiResponse    = require("../../utils/ApiResponse");

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const user = req.user;
  const { rows, total } = await jobRequestSvc.list({
    assignmentStatus: req.query.assignmentStatus,
    jobStatus:        req.query.jobStatus,
    search:           req.query.search,
    roleId:           user.role_id,
    recruiterEmpId:   user.employee_id,
    limit,
    offset,
  });
  new ApiResponse(200, rows, "Job requests fetched", buildMeta({ page, limit, total })).send(res);
});

const getOne = asyncHandler(async (req, res) => {
  const data = await jobRequestSvc.getById(Number(req.params.id));
  new ApiResponse(200, data, "Job request fetched").send(res);
});

const create = asyncHandler(async (req, res) => {
  const data = await jobRequestSvc.create(req.body, req.user.user_id, req.ip);
  new ApiResponse(201, data, "Job request created").send(res);
});

const update = asyncHandler(async (req, res) => {
  const data = await jobRequestSvc.update(Number(req.params.id), req.body, req.user.user_id, req.ip);
  new ApiResponse(200, data, "Job request updated").send(res);
});

const assignRecruiters = asyncHandler(async (req, res) => {
  const { recruiterIds } = req.body;
  const data = await jobRequestSvc.assignRecruiters(Number(req.params.id), recruiterIds, req.user.user_id, req.ip);
  new ApiResponse(200, data, "Recruiters assigned").send(res);
});

const remove = asyncHandler(async (req, res) => {
  const data = await jobRequestSvc.delete(Number(req.params.id), req.user.user_id, req.ip);
  new ApiResponse(200, data, "Job request deleted").send(res);
});

module.exports = { list, getOne, create, update, assignRecruiters, remove };
