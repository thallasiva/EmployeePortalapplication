const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const accessControlService = require('../services/accessControl.service');
const authService = require('../services/auth.service');
const { assertEmployeeScope } = accessControlService;
const { isGlobalAccess } = require('../utils/accessScope');

const listRoles = asyncHandler(async (_req, res) => {
  new ApiResponse(200, await accessControlService.listRoles(), 'Roles fetched').send(res);
});

const listUsers = asyncHandler(async (req, res) => {
  new ApiResponse(200, await accessControlService.listUsers(req.user), 'Users fetched').send(res);
});

const getUserRoles = asyncHandler(async (req, res) => {
  const user = await accessControlService.getUserAccess(req.params.userId);
  if (!user) throw ApiError.notFound('User not found');
  if (!isGlobalAccess(req.user)) {
    if (!user.employeeId) throw ApiError.notFound('User not found');
    await assertEmployeeScope(req.user, user.employeeId);
  }
  new ApiResponse(200, user, 'User access fetched').send(res);
});

const replaceUserRoles = asyncHandler(async (req, res) => {
  const user = await accessControlService.replaceUserRoles(req.user, req.params.userId, req.body.roles, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  authService.bustProfileCache(Number(req.params.userId));
  new ApiResponse(200, user, 'User roles and scopes updated').send(res);
});

const listPermissions = asyncHandler(async (_req, res) => {
  new ApiResponse(200, await accessControlService.listPermissions(), 'Permissions fetched').send(res);
});

const getMyPermissions = asyncHandler(async (req, res) => {
  new ApiResponse(
    200,
    {
      roles: req.user.roles || [],
      roleKeys: req.user.roleKeys || [],
      scopes: req.user.scopeAssignments || [],
      permissions: await accessControlService.getEffectivePermissions(req.user),
    },
    'Current access fetched'
  ).send(res);
});

const getRolePermissions = asyncHandler(async (req, res) => {
  new ApiResponse(
    200,
    await accessControlService.getRolePermissions(req.params.roleId),
    'Role permissions fetched'
  ).send(res);
});

const listAuditLogs = asyncHandler(async (req, res) => {
  const rows = await accessControlService.listAuditLogs({
    targetUserId: req.query.target_user_id,
    limit: req.query.limit,
    offset: req.query.offset,
  });
  new ApiResponse(200, rows, 'Access audit logs fetched').send(res);
});

const updateRolePermissions = asyncHandler(async (req, res) => {
  const result = await accessControlService.updateRolePermissions(
    req.user,
    req.params.roleId,
    req.body.permissions,
    { ip: req.ip, userAgent: req.headers['user-agent'] }
  );
  new ApiResponse(200, result, 'Role permissions updated').send(res);
});

module.exports = {
  listRoles,
  listUsers,
  getUserRoles,
  replaceUserRoles,
  getMyPermissions,
  listPermissions,
  getRolePermissions,
  listAuditLogs,
  updateRolePermissions,
};
