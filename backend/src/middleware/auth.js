const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/jwt');
const { getUserAccess } = require('../services/accessControl.service');
const authenticate = asyncHandler(async (req, _res, next) => {
  let token = req.cookies?.accessToken;
  if (!token) {
    const header = req.headers.authorization || '';
    const [scheme, headerToken] = header.split(' ');
    if (scheme === 'Bearer' && headerToken) token = headerToken;
  }
  if (!token) {
    throw ApiError.unauthorized('Authentication required');
  }
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }
  const freshUser = await getUserAccess(decoded.userId);
  if (!freshUser) throw ApiError.unauthorized('Account is no longer active');
  req.user = { ...decoded, ...freshUser };
  next();
});
function authorizeRoles(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    const assignedRoles = [
      req.user.roleName,
      ...(req.user.roles || []).flatMap((role) => [role.roleName, role.roleKey]),
    ];
    const normalize = (role) => String(role || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const assigned = new Set(assignedRoles.map(normalize));
    const aliases = {
      admin: ['companyadmin'],
      hrmanager: ['hrmanager'],
      reportingmanager: ['teamlead', 'associatemanager', 'departmentmanager'],
    };
    const allowed = roles.flatMap((role) => [normalize(role), ...(aliases[normalize(role)] || [])]);
    if (assigned.has('superadmin')) return next();
    if (!allowed.some((role) => assigned.has(role))) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
}
module.exports = { authenticate, authorizeRoles };
