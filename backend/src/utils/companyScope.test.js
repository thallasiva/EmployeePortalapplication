const test = require('node:test');
const assert = require('node:assert/strict');
const ApiError = require('./ApiError');
const { resolveCompanyScope } = require('./companyScope');

test('company users are restricted to their own company', () => {
  assert.equal(resolveCompanyScope({ roleId: 2, companyId: 8 }), 8);
  assert.equal(resolveCompanyScope({ roleId: 2, companyId: 8 }, '8'), 8);
  assert.throws(
    () => resolveCompanyScope({ roleId: 2, companyId: 8 }, 9),
    (error) => error instanceof ApiError && error.statusCode === 403
  );
});

test('platform administrators can choose a company or request all companies', () => {
  assert.equal(resolveCompanyScope({ roleId: 1, companyId: 8 }), null);
  assert.equal(resolveCompanyScope({ roleId: 1 }, '9'), 9);
});

test('missing company context and invalid company filters are rejected', () => {
  assert.throws(
    () => resolveCompanyScope({ roleId: 2 }),
    (error) => error instanceof ApiError && error.statusCode === 403
  );
  assert.throws(
    () => resolveCompanyScope({ roleId: 1 }, '0'),
    (error) => error instanceof ApiError && error.statusCode === 400
  );
});

test('enterprise roles use assigned company scopes instead of the legacy role id', () => {
  const companyAdmin = {
    roleId: 2,
    roleIds: [9],
    roleKeys: ['COMPANY_ADMIN'],
    scopeAssignments: [{ scope_type: 'COMPANY', company_id: 8 }],
    companyId: 8,
  };
  assert.equal(resolveCompanyScope(companyAdmin), 8);
  assert.throws(
    () => resolveCompanyScope(companyAdmin, 9),
    (error) => error instanceof ApiError && error.statusCode === 403
  );
});

test('revoked legacy administrators do not retain global access after migration', () => {
  assert.throws(
    () => resolveCompanyScope({ roleId: 1, roleIds: [], roleKeys: [], companyId: 8, enterpriseRbac: true }, 9),
    (error) => error instanceof ApiError && error.statusCode === 403
  );
});
