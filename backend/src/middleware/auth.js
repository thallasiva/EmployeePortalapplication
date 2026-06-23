const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/jwt');

/**
 * Verifies the JWT and attaches the decoded payload to `req.user`.
 *
 * Token resolution order (most-secure first):
 *   1. httpOnly cookie `accessToken`  ← preferred (not readable by JS)
 *   2. Authorization: Bearer <token>  ← fallback for mobile / API clients
 */
const authenticate = asyncHandler(async (req, _res, next) => {
  // 1. Cookie (set by login/refresh with httpOnly flag)
  let token = req.cookies?.accessToken;

  // 2. Bearer header fallback
  if (!token) {
    const header = req.headers.authorization || '';
    const [scheme, headerToken] = header.split(' ');
    if (scheme === 'Bearer' && headerToken) token = headerToken;
  }

  if (!token) {
    throw ApiError.unauthorized('Authentication required');
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch {
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
