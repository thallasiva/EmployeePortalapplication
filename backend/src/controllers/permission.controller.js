const permissionService = require('../services/permission.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const permissions = await permissionService.listPermissions();
  new ApiResponse(200, permissions, 'Permissions fetched').send(res);
});

const getRolePermissions = asyncHandler(async (req, res) => {
  const data = await permissionService.getRolePermissions(req.params.roleId);
  new ApiResponse(200, data, 'Role permissions fetched').send(res);
});

const updateRolePermissions = asyncHandler(async (req, res) => {
  const data = await permissionService.updateRolePermissions(req.params.roleId, req.body.permissions);
  new ApiResponse(200, data, 'Role permissions updated').send(res);
});

module.exports = { list, getRolePermissions, updateRolePermissions };
