const asyncHandler  = require("express-async-handler");
const dashboardSvc  = require("../../services/recruitment/dashboard.service");
const ApiResponse   = require("../../utils/ApiResponse");

const adminDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardSvc.adminDashboard();
  new ApiResponse(200, data, "Dashboard data fetched").send(res);
});

const recruiterDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardSvc.recruiterDashboard(req.user.employeeId);
  new ApiResponse(200, data, "Dashboard data fetched").send(res);
});

const pipelineReport = asyncHandler(async (req, res) => {
  const data = await dashboardSvc.pipelineReport({
    fromDate:    req.query.fromDate,
    toDate:      req.query.toDate,
    recruiterId: req.query.recruiterId ? Number(req.query.recruiterId) : undefined,
  });
  new ApiResponse(200, data, "Pipeline report fetched").send(res);
});

module.exports = { adminDashboard, recruiterDashboard, pipelineReport };
