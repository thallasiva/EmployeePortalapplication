const asyncHandler   = require("express-async-handler");
const onboardingSvc  = require("../../services/recruitment/onboarding.service");
const { getPagination, buildMeta } = require("../../utils/pagination");
const ApiResponse    = require("../../utils/ApiResponse");

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { rows, total } = await onboardingSvc.list({ status: req.query.status, search: req.query.search, limit, offset });
  new ApiResponse(200, rows, "Onboarding records fetched", buildMeta({ page, limit, total })).send(res);
});

const getOne = asyncHandler(async (req, res) => {
  const data = await onboardingSvc.getById(Number(req.params.id));
  new ApiResponse(200, data, "Onboarding record fetched").send(res);
});

const create = asyncHandler(async (req, res) => {
  const data = await onboardingSvc.create(req.body, req.user.user_id, req.ip);
  new ApiResponse(201, data, "Onboarding started").send(res);
});

const updateTask = asyncHandler(async (req, res) => {
  const { taskName, taskValue } = req.body;
  const data = await onboardingSvc.updateTask(Number(req.params.id), taskName, taskValue, req.user.user_id, req.ip);
  new ApiResponse(200, data, "Task updated").send(res);
});

const finalize = asyncHandler(async (req, res) => {
  const data = await onboardingSvc.finalize(Number(req.params.id), req.user.user_id, req.ip);
  new ApiResponse(200, data, "Onboarding finalized").send(res);
});

module.exports = { list, getOne, create, updateTask, finalize };
