const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/jwt');

/**
 * Verifies the Bearer JWT and attaches the decoded payload to `req.user`.
 * Expected payload shape: { userId, employeeId, email, roleId, roleName }
 */
const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized('Missing or invalid Authorization header');
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired token');
  }
});

/**
 * Restricts a route to one or more role names, e.g. authorizeRoles('Admin')
 */
function authorizeRoles(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!roles.includes(req.user.roleName)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
}

module.exports = { authenticate, authorizeRoles };
