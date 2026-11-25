const SCOPE_TYPES = Object.freeze([
  'GLOBAL',
  'COMPANY',
  'REGION',
  'BRANCH',
  'DEPARTMENT',
  'TEAM',
  'ASSIGNED_RESOURCE',
  'SELF',
]);

function isGlobalAccess(user) {
  return Boolean(user?.scopeAssignments?.some((assignment) => assignment.scope_type === 'GLOBAL'));
}

function hasScopeAccess(user, target) {
  if (!user || !target) return false;
  if (isGlobalAccess(user)) return true;

  return (user.scopeAssignments || []).some((scope) => {
    switch (scope.scope_type) {
      case 'COMPANY':
        return scope.company_id != null && Number(scope.company_id) === Number(target.company_id);
      case 'REGION':
        return scope.region_id != null && Number(scope.region_id) === Number(target.region_id);
      case 'BRANCH':
        return scope.branch_id != null && Number(scope.branch_id) === Number(target.branch_id);
      case 'DEPARTMENT':
        return scope.department_id != null && Number(scope.department_id) === Number(target.department_id);
      case 'TEAM':
        if (scope.team_id != null && Number(scope.team_id) === Number(target.team_id)) return true;
        return scope.team_id == null && target.is_direct_report === true;
      case 'ASSIGNED_RESOURCE':
        return scope.resource_type === target.resource_type
          && String(scope.resource_id) === String(target.resource_id);
      case 'SELF':
        return target.employee_id != null
          && Number(target.employee_id) === Number(user.employeeId);
      default:
        return false;
    }
  });
}

module.exports = { SCOPE_TYPES, isGlobalAccess, hasScopeAccess };
