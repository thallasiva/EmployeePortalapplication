'use strict';
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const svc = require('../services/training.service');

exports.listCourses = asyncHandler(async (req, res) => {
  new ApiResponse(200, await svc.listCourses(req.user.companyId), 'Training courses fetched').send(res);
});
exports.upsertCourse = asyncHandler(async (req, res) => {
  const course = await svc.upsertCourse(req.params.id || null, req.body, req.user.companyId, req.user.employeeId);
  new ApiResponse(req.params.id ? 200 : 201, course, 'Training course saved').send(res);
});
exports.assign = asyncHandler(async (req, res) => {
  const rows = await svc.assign(Number(req.params.courseId), req.body.employee_ids, req.body.due_date, req.user.companyId, req.user.employeeId);
  new ApiResponse(200, rows, 'Training assigned').send(res);
});
exports.listAssignments = asyncHandler(async (req, res) => {
  new ApiResponse(200, await svc.listAssignments({
    companyId: req.user.companyId,
    courseId: req.query.course_id ? Number(req.query.course_id) : null,
  }), 'Training assignments fetched').send(res);
});
exports.listMine = asyncHandler(async (req, res) => {
  new ApiResponse(200, await svc.listAssignments({
    companyId: req.user.companyId,
    employeeId: req.user.employeeId,
  }), 'My training fetched').send(res);
});
exports.updateMine = asyncHandler(async (req, res) => {
  const row = await svc.updateOwnStatus(Number(req.params.assignmentId), req.user.employeeId, req.user.companyId, req.body.status);
  new ApiResponse(200, row, 'Training status updated').send(res);
});
