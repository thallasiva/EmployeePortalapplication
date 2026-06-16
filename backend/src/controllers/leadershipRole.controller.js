const leadershipRoleService = require('../services/leadershipRole.service');
const { createCrudController } = require('./base.controller');

module.exports = createCrudController(leadershipRoleService, { entityName: 'Leadership role' });
