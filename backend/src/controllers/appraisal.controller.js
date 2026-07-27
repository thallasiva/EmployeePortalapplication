const svc = require('../services/appraisal.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');


const getCycle = asyncHandler(async (req, res) => {
  const cycle = await svc.getActiveCycle();
  new ApiResponse(200, cycle, 'Cycle fetched').send(res);
});

const getAllCycles = asyncHandler(async (req, res) => {
  const cycles = await svc.getAllCycles();
  new ApiResponse(200, cycles, 'Cycles fetched').send(res);
});

const createCycle = asyncHandler(async (req, res) => {
  const cycle = await svc.createCycle(req.user.employeeId, req.body);
  new ApiResponse(201, cycle, 'Cycle created').send(res);
});

const updateSettings = asyncHandler(async (req, res) => {
  const cycleId = Number(req.params.id);
  const cycle = await svc.updateCycleSettings(req.user.employeeId, cycleId, req.body);
  new ApiResponse(200, cycle, 'Settings updated').send(res);
});

const rolloutCycle = asyncHandler(async (req, res) => {
  const cycleId = Number(req.params.id);
  const cycle = await svc.rolloutCycle(req.user.employeeId, cycleId, req.body);
  new ApiResponse(200, cycle, 'Cycle rolled out').send(res);
});

const disableCycle = asyncHandler(async (req, res) => {
  const cycleId = Number(req.params.id);
  const cycle = await svc.disableCycle(req.user.employeeId, cycleId);
  new ApiResponse(200, cycle, 'Cycle disabled').send(res);
});


const toggleCycle = asyncHandler(async (req, res) => {
  const cycle = await svc.toggleCycle(req.user.employeeId);
  new ApiResponse(200, cycle, 'Cycle updated').send(res);
});


const getMyAppraisal = asyncHandler(async (req, res) => {
  const data = await svc.getMyAppraisal(req.user.employeeId);
  new ApiResponse(200, data, 'Appraisal fetched').send(res);
});
const saveMyAppraisal = asyncHandler(async (req, res) => {
  const data = await svc.saveMyAppraisal(req.user.employeeId, req.body);
  new ApiResponse(200, data, 'Appraisal saved').send(res);
});


const getTeamAppraisals = asyncHandler(async (req, res) => {
  const data = await svc.getTeamAppraisals(req.user.employeeId);
  new ApiResponse(200, data, 'Team appraisals fetched').send(res);
});
const saveManagerRating = asyncHandler(async (req, res) => {
  const data = await svc.saveManagerRating(req.user.employeeId, Number(req.params.id), req.body);
  new ApiResponse(200, data, 'Manager ratings saved').send(res);
});


const getAllAppraisals = asyncHandler(async (req, res) => {

  const cycleId = req.query.cycle_id ? Number(req.query.cycle_id) : null;
  const data = cycleId ?
  await svc.getAllAppraisals(cycleId, req.query) :
  await svc.getAllAppraisals(req.query);
  new ApiResponse(200, data, 'All appraisals fetched').send(res);
});
const updateStatus = asyncHandler(async (req, res) => {
  const data = await svc.updateAppraisalStatus(req.params.id, req.body.status);
  new ApiResponse(200, data, 'Status updated').send(res);
});


const getEnrollments = asyncHandler(async (req, res) => {

  let cycleId = req.query.cycle_id ? Number(req.query.cycle_id) : null;
  if (!cycleId) {
    const cycle = await svc.getActiveCycle();
    cycleId = cycle?.cycle_id;
  }
  if (!cycleId) return new ApiResponse(200, [], 'No cycle').send(res);
  const data = await svc.getEnrollments(cycleId);
  new ApiResponse(200, data, 'Enrollments fetched').send(res);
});
const enrollEmployees = asyncHandler(async (req, res) => {
  let cycleId = req.body.cycle_id ? Number(req.body.cycle_id) : null;
  if (!cycleId) {
    const cycle = await svc.getActiveCycle();
    cycleId = cycle?.cycle_id;
  }
  if (!cycleId) throw new Error('No cycle');
  const { employee_ids } = req.body;
  const data = await svc.enrollEmployees(cycleId, req.user.employeeId, employee_ids);
  new ApiResponse(200, data, 'Employees enrolled').send(res);
});
const unenrollEmployee = asyncHandler(async (req, res) => {
  let cycleId = req.query.cycle_id ? Number(req.query.cycle_id) : null;
  if (!cycleId) {
    const cycle = await svc.getActiveCycle();
    cycleId = cycle?.cycle_id;
  }
  if (!cycleId) throw new Error('No cycle');
  await svc.unenrollEmployee(cycleId, Number(req.params.employeeId));
  new ApiResponse(200, {}, 'Employee unenrolled').send(res);
});

module.exports = {
  getCycle, getAllCycles, createCycle, updateSettings, rolloutCycle, disableCycle, toggleCycle,
  getMyAppraisal, saveMyAppraisal,
  getTeamAppraisals, saveManagerRating,
  getAllAppraisals, updateStatus,
  getEnrollments, enrollEmployees, unenrollEmployee
};
