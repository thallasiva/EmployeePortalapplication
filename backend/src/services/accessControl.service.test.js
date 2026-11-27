const test = require('node:test');
const assert = require('node:assert/strict');
const accessControlService = require('./accessControl.service');

test('Recruiter role has baseline view access to recruitment', async () => {
  const allowed = await accessControlService.canPermission(
    { roleKeys: ['RECRUITER'], roleIds: [12], enterpriseRbac: true },
    'recruitment',
    'view'
  );

  assert.equal(allowed, true);
});

test('HR Manager role has baseline view access to recruitment', async () => {
  const allowedByKey = await accessControlService.canPermission(
    { roleKeys: ['HR_MANAGER'], roleIds: [6], enterpriseRbac: true },
    'recruitment',
    'view'
  );
  const allowedByLegacyName = await accessControlService.canPermission(
    { roleName: 'HR Manager', roleIds: [], enterpriseRbac: true },
    'recruitment',
    'view'
  );

  assert.equal(allowedByKey, true);
  assert.equal(allowedByLegacyName, true);
});

test('Company Admin role has view access to employees and attendance', async () => {
  const user = { roleKeys: ['COMPANY_ADMIN'], roleIds: [], enterpriseRbac: true };

  assert.equal(await accessControlService.canPermission(user, 'employees', 'view'), true);
  assert.equal(await accessControlService.canPermission(user, 'attendance', 'view'), true);
  assert.equal(await accessControlService.canPermission(user, 'attendance', 'edit'), false);
});

test('Recruitment roles allowed by the route can create interview sessions', async () => {
  const user = { roleKeys: ['COMPANY_ADMIN'], roleIds: [], enterpriseRbac: true };

  assert.equal(await accessControlService.canPermission(user, 'recruitment', 'edit'), true);
});

test('Users without enterprise role assignments retain legacy company-scoped access', () => {
  const user = accessControlService.mapUserAccess(
    { user_id: 7, employee_id: 1, role_id: 1, role_name: 'Admin', company_id: 1 },
    [],
    []
  );

  assert.equal(user.enterpriseRbac, false);
  assert.deepEqual(user.roleIds, []);
  assert.equal(user.companyId, 1);
});

test('Inactive enterprise role assignments do not fall back to legacy access', () => {
  const user = accessControlService.mapUserAccess(
    { user_id: 7, employee_id: 1, role_id: 1, role_name: 'Admin', company_id: 1 },
    [{ user_role_id: 4, role_id: 2, role_key: 'EMPLOYEE', is_active: 0 }],
    []
  );

  assert.equal(user.enterpriseRbac, true);
  assert.deepEqual(user.roleIds, []);
});
