const test = require('node:test');
const assert = require('node:assert/strict');
const { hasScopeAccess, isGlobalAccess } = require('./accessScope');

test('scope checks authorize matching company, branch, department, and resource assignments', () => {
  const user = {
    employeeId: 21,
    scopeAssignments: [
      { scope_type: 'BRANCH', company_id: 8, branch_id: 4 },
      { scope_type: 'DEPARTMENT', company_id: 8, department_id: 6 },
      { scope_type: 'ASSIGNED_RESOURCE', resource_type: 'JOB_REQUISITION', resource_id: '98' },
    ],
  };
  assert.equal(hasScopeAccess(user, { company_id: 8, branch_id: 4 }), true);
  assert.equal(hasScopeAccess(user, { company_id: 8, branch_id: 5 }), false);
  assert.equal(hasScopeAccess(user, { company_id: 8, department_id: 6 }), true);
  assert.equal(hasScopeAccess(user, { resource_type: 'JOB_REQUISITION', resource_id: 98 }), true);
  assert.equal(hasScopeAccess(user, { resource_type: 'JOB_REQUISITION', resource_id: 99 }), false);
});

test('GLOBAL and SELF scopes are explicit and fail closed', () => {
  const global = { scopeAssignments: [{ scope_type: 'GLOBAL' }] };
  const self = { employeeId: 21, scopeAssignments: [{ scope_type: 'SELF' }] };
  assert.equal(isGlobalAccess(global), true);
  assert.equal(hasScopeAccess(global, { company_id: 100 }), true);
  assert.equal(hasScopeAccess(self, { employee_id: 21 }), true);
  assert.equal(hasScopeAccess(self, { employee_id: 22 }), false);
  assert.equal(hasScopeAccess({ scopeAssignments: [] }, { company_id: 100 }), false);
});

test('TEAM scope follows its explicit team id or direct-report relationship', () => {
  const user = {
    employeeId: 21,
    scopeAssignments: [{ scope_type: 'TEAM', team_id: null }],
  };
  assert.equal(hasScopeAccess(user, { is_direct_report: true }), true);
  assert.equal(hasScopeAccess(user, { is_direct_report: false }), false);
});
