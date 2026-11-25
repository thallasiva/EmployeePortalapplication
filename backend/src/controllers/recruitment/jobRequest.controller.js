const asyncHandler = require("express-async-handler");
const jobRequestSvc = require("../../services/recruitment/jobRequest.service");
const { getPagination, buildMeta } = require("../../utils/pagination");
const ApiResponse = require("../../utils/ApiResponse");
const ApiError = require("../../utils/ApiError");
const { hasScopeAccess } = require("../../utils/accessScope");
function isRecruiter(user) {
  return Number(user?.roleId) === 5 || user?.roleKeys?.includes("RECRUITER");
}
const list = asyncHandler(async (req, res) =>
{
  const { page, limit, offset } = getPagination(req.query);
  const user = req.user;
  const { rows, total } = await jobRequestSvc.list({
    assignmentStatus: req.query.assignmentStatus,
    jobStatus: req.query.jobStatus,
    search: req.query.search,
    roleId: isRecruiter(user) ? 5 : user.roleId,
    recruiterEmpId: user.employeeId,
    limit,
    offset,
  });
  new ApiResponse(200, rows, "Job requests fetched", buildMeta({ page, limit, total })).send(res);
});
const getOne = asyncHandler(async (req, res) =>
{
  const data = await jobRequestSvc.getById(Number(req.params.id));
  if (isRecruiter(req.user)) {
    const assigned = await jobRequestSvc.list({
      roleId: 5,
      recruiterEmpId: req.user.employeeId,
      limit: 1000,
      offset: 0,
    });
    const listed = (assigned.rows || []).some((row) => Number(row.job_req_id || row.id) === Number(req.params.id));
    const explicit = ["JOB", "JOB_REQ", "JOB_REQUISITION", "RECRUITMENT_JOB"].some((resourceType) =>
      hasScopeAccess(req.user, { resource_type: resourceType, resource_id: req.params.id })
    );
    if (!listed && !explicit) throw new ApiError(404, "Job request not found");
  }
  new ApiResponse(200, data, "Job request fetched").send(res);
});
const create = asyncHandler(async (req, res) =>
{
  const data = await jobRequestSvc.create(req.body, req.user.userId, req.ip);
  new ApiResponse(201, data, "Job request created").send(res);
});
const update = asyncHandler(async (req, res) =>
{
  const data = await jobRequestSvc.update(Number(req.params.id), req.body, req.user.userId, req.ip);
  new ApiResponse(200, data, "Job request updated").send(res);
});
const assignRecruiters = asyncHandler(async (req, res) =>
{
  const { recruiterIds } = req.body;
  const data = await jobRequestSvc.assignRecruiters(Number(req.params.id), recruiterIds, req.user.userId, req.ip);
  new ApiResponse(200, data, "Recruiters assigned").send(res);
});
const remove = asyncHandler(async (req, res) =>
{
  const data = await jobRequestSvc.delete(Number(req.params.id), req.user.userId, req.ip);
  new ApiResponse(200, data, "Job request deleted").send(res);
});
module.exports = { list, getOne, create, update, assignRecruiters, remove };
