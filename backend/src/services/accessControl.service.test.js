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
