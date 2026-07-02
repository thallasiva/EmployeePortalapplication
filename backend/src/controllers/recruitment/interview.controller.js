const asyncHandler   = require("express-async-handler");
const interviewSvc   = require("../../services/recruitment/interview.service");
const { getPagination, buildMeta } = require("../../utils/pagination");
const ApiResponse    = require("../../utils/ApiResponse");

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const user = req.user;
  const { rows, total } = await interviewSvc.list({
    candidateId: req.query.candidateId ? Number(req.query.candidateId) : undefined,
    jobReqId:    req.query.jobReqId    ? Number(req.query.jobReqId)    : undefined,
    level:       req.query.level,
    status:      req.query.status,
    search:      req.query.search,
    roleId:      user.role_id,
    recEmpId:    user.employee_id,
    limit,
    offset,
  });
  new ApiResponse(200, rows, "Interviews fetched", buildMeta({ page, limit, total })).send(res);
});

const getOne = asyncHandler(async (req, res) => {
  const data = await interviewSvc.getById(Number(req.params.id));
  new ApiResponse(200, data, "Interview fetched").send(res);
});

const schedule = asyncHandler(async (req, res) => {
  const data = await interviewSvc.schedule(req.body, req.user.user_id, req.ip);
  new ApiResponse(201, data, "Interview scheduled").send(res);
});

const submitFeedback = asyncHandler(async (req, res) => {
  const data = await interviewSvc.submitFeedback(
    Number(req.params.id),
    req.body,
    req.user.user_id,
    req.ip,
  );
  new ApiResponse(200, data, "Feedback submitted").send(res);
});

const cancel = asyncHandler(async (req, res) => {
  const data = await interviewSvc.cancel(Number(req.params.id), req.user.user_id, req.ip);
  new ApiResponse(200, data, "Interview cancelled").send(res);
});

module.exports = { list, getOne, schedule, submitFeedback, cancel };
