const test = require('node:test');
const assert = require('node:assert/strict');
const { authorizeRoles } = require('./auth');

function invoke(allowedRoles, user) {
  let nextError;
  authorizeRoles(...allowedRoles)({ user }, null, (error) => {
    nextError = error;
  });
  return nextError;
}

test('authorizeRoles recognizes enterprise role keys and legacy labels', () => {
  assert.equal(invoke(['Admin'], {
    roleKeys: ['COMPANY_ADMIN'],
    roles: [{ roleName: 'Company Admin', roleKey: 'COMPANY_ADMIN' }],
  }), undefined);
  assert.equal(invoke(['HR Manager'], {
    roleKeys: ['HR_MANAGER'],
    roles: [{ roleName: 'HR Manager', roleKey: 'HR_MANAGER' }],
  }), undefined);
});

test('Super Admin is accepted by legacy role-gated routes', () => {
  assert.equal(invoke(['Admin'], {
    roleKeys: ['SUPER_ADMIN'],
    roles: [{ roleName: 'Super Admin', roleKey: 'SUPER_ADMIN' }],
  }), undefined);
});
