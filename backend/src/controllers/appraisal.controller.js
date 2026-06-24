const svc = require('../services/appraisal.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/* Cycle */
const getCycle   = asyncHandler(async (req, res) => {
  const cycle = await svc.getActiveCycle();
  new ApiResponse(200, cycle, 'Cycle fetched').send(res);
});
const toggleCycle = asyncHandler(async (req, res) => {
  const cycle = await svc.toggleCycle(req.user.employeeId);
  new ApiResponse(200, cycle, 'Cycle updated').send(res);
});
const updateSettings = asyncHandler(async (req, res) => {
  const cycle = await svc.updateCycleSettings(req.user.employeeId, req.body);
  new ApiResponse(200, cycle, 'Settings updated').send(res);
});

/* Employee */
const getMyAppraisal = asyncHandler(async (req, res) => {
  const data = await svc.getMyAppraisal(req.user.employeeId);
  new ApiResponse(200, data, 'Appraisal fetched').send(res);
});
const saveMyAppraisal = asyncHandler(async (req, res) => {
  const data = await svc.saveMyAppraisal(req.user.employeeId, req.body);
  new ApiResponse(200, data, 'Appraisal saved').send(res);
});

/* Manager */
const getTeamAppraisals = asyncHandler(async (req, res) => {
  const data = await svc.getTeamAppraisals(req.user.employeeId);
  new ApiResponse(200, data, 'Team appraisals fetched').send(res);
});
const saveManagerRating = asyncHandler(async (req, res) => {
  const data = await svc.saveManagerRating(req.user.employeeId, req.params.id, req.body);
  new ApiResponse(200, data, 'Manager ratings saved').send(res);
});

/* Admin */
const getAllAppraisals = asyncHandler(async (req, res) => {
  const data = await svc.getAllAppraisals(req.query);
  new ApiResponse(200, data, 'All appraisals fetched').send(res);
});
const updateStatus = asyncHandler(async (req, res) => {
  const data = await svc.updateAppraisalStatus(req.params.id, req.body.status);
  new ApiResponse(200, data, 'Status updated').send(res);
});

module.exports = { getCycle, toggleCycle, updateSettings, getMyAppraisal, saveMyAppraisal,
  getTeamAppraisals, saveManagerRating, getAllAppraisals, updateStatus };
