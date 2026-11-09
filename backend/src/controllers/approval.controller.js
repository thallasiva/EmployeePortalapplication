'use strict';
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const svc = require('../services/approval.service');

exports.listPending = asyncHandler(async (req, res) => {
  const items = await svc.listPending({
    companyId: req.user.companyId,
    employeeId: req.user.employeeId,
    roleName: req.user.roleName,
  });
  new ApiResponse(200, items, 'Pending approvals fetched').send(res);
});
