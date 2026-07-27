const jobService = require('../services/job.service');
const jobApplicationService = require('../services/jobApplication.service');
const referralService = require('../services/referral.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');



const listJobs = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { status, department_id, search } = req.query;
  const { rows, total } = await jobService.list({ status, department_id, search, limit, offset });
  new ApiResponse(200, rows, 'Jobs fetched', buildMeta({ page, limit, total })).send(res);
});

const getJob = asyncHandler(async (req, res) => {
  const record = await jobService.getDetails(req.params.id);
  if (!record) throw ApiError.notFound('Job not found');
  new ApiResponse(200, record, 'Job fetched').send(res);
});

const createJob = asyncHandler(async (req, res) => {
  const record = await jobService.create({ ...req.body, created_by: req.user.employeeId });
  new ApiResponse(201, record, 'Job created').send(res);
});

const updateJob = asyncHandler(async (req, res) => {
  const exists = await jobService.existsById(req.params.id);
  if (!exists) throw ApiError.notFound('Job not found');
  const record = await jobService.update(req.params.id, req.body);
  new ApiResponse(200, record, 'Job updated').send(res);
});

const removeJob = asyncHandler(async (req, res) => {
  const exists = await jobService.existsById(req.params.id);
  if (!exists) throw ApiError.notFound('Job not found');
  await jobService.remove(req.params.id);
  new ApiResponse(200, null, 'Job deleted').send(res);
});



const listApplications = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { job_id, status, search } = req.query;
  const { rows, total } = await jobApplicationService.list({ job_id, status, search, limit, offset });
  new ApiResponse(200, rows, 'Applications fetched', buildMeta({ page, limit, total })).send(res);
});

const getApplication = asyncHandler(async (req, res) => {
  const record = await jobApplicationService.getDetails(req.params.id);
  if (!record) throw ApiError.notFound('Application not found');
  new ApiResponse(200, record, 'Application fetched').send(res);
});

const createApplication = asyncHandler(async (req, res) => {
  const record = await jobApplicationService.create(req.body);
  new ApiResponse(201, record, 'Application submitted').send(res);
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const record = await jobApplicationService.updateStatus(req.params.id, req.body.status);
  new ApiResponse(200, record, 'Application status updated').send(res);
});



const listReferrals = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { job_id, status, referred_by } = req.query;
  const { rows, total } = await referralService.list({ job_id, status, referred_by, limit, offset });
  new ApiResponse(200, rows, 'Referrals fetched', buildMeta({ page, limit, total })).send(res);
});

const myReferrals = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { rows, total } = await referralService.list({ referred_by: req.user.employeeId, limit, offset });
  new ApiResponse(200, rows, 'Referrals fetched', buildMeta({ page, limit, total })).send(res);
});

const getReferral = asyncHandler(async (req, res) => {
  const record = await referralService.getDetails(req.params.id);
  if (!record) throw ApiError.notFound('Referral not found');
  new ApiResponse(200, record, 'Referral fetched').send(res);
});

const createReferral = asyncHandler(async (req, res) => {
  const record = await referralService.create({ ...req.body, referred_by: req.user.employeeId });
  new ApiResponse(201, record, 'Referral submitted').send(res);
});

const updateReferralStatus = asyncHandler(async (req, res) => {
  const record = await referralService.updateStatus(req.params.id, req.body.status);
  new ApiResponse(200, record, 'Referral status updated').send(res);
});

module.exports = {
  listJobs,
  getJob,
  createJob,
  updateJob,
  removeJob,
  listApplications,
  getApplication,
  createApplication,
  updateApplicationStatus,
  listReferrals,
  myReferrals,
  getReferral,
  createReferral,
  updateReferralStatus
};
