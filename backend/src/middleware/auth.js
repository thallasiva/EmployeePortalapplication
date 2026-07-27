const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/jwt');








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

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }
});




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
