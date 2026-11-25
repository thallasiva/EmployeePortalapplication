const ApiError = require('./ApiError');

function isPlatformAdmin(user) {
  if (Array.isArray(user?.roleKeys)) return user.roleKeys.includes('SUPER_ADMIN');
  if (Array.isArray(user?.roles)) return user.roles.some((role) => role.roleKey === 'SUPER_ADMIN');
  return Number(user?.roleId) === 1;
}

function resolveCompanyScope(user, requestedCompanyId) {
  const requested = requestedCompanyId === undefined || requestedCompanyId === null || requestedCompanyId === ''
    ? null
    : Number(requestedCompanyId);

  if (requested !== null && (!Number.isInteger(requested) || requested < 1)) {
    throw ApiError.badRequest('A valid company_id is required');
  }
  if (isPlatformAdmin(user)) return requested;
  if (user?.scopeAssignments?.some((scope) => scope.scope_type === 'GLOBAL')) return requested;

  const authorizedCompanyIds = new Set((user?.scopeAssignments || [])
    .map((scope) => Number(scope.company_id))
    .filter((id) => Number.isInteger(id) && id > 0));
  if (!user?.enterpriseRbac && !user?.roleIds?.length) {
    const legacyCompanyId = Number(user?.companyId);
    if (Number.isInteger(legacyCompanyId) && legacyCompanyId > 0) authorizedCompanyIds.add(legacyCompanyId);
  }
  if (requested !== null) {
    if (!authorizedCompanyIds.has(requested)) {
      throw ApiError.forbidden('You do not have access to this company');
    }
    return requested;
  }
  if (authorizedCompanyIds.size === 1) return [...authorizedCompanyIds][0];
  if (authorizedCompanyIds.size > 1) {
    throw ApiError.badRequest('Select a company you are authorized to access');
  }
  if (
    user?.companyId &&
    user?.scopeAssignments?.some((scope) => scope.scope_type === 'SELF' || scope.scope_type === 'TEAM')
  ) return Number(user.companyId);
  throw ApiError.forbidden('Company scope is required');
}

function requirePlatformAdmin(req, _res, next) {
  if (!isPlatformAdmin(req.user)) {
    return next(ApiError.forbidden('Platform administrator access is required'));
  }
  next();
}

module.exports = { isPlatformAdmin, resolveCompanyScope, requirePlatformAdmin };
