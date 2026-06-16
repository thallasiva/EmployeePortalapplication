const express = require('express');
const controller = require('../controllers/team.controller');
const validate = require('../middleware/validate');
const {
  createTeamSchema,
  updateTeamSchema,
  addMemberSchema,
  updateMemberSchema,
} = require('../validators/team.validator');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission('teams', 'view'), controller.list);
router.get('/:id', requirePermission('teams', 'view'), controller.getOne);
router.post('/', requirePermission('teams', 'add'), validate(createTeamSchema), controller.create);
router.put('/:id', requirePermission('teams', 'edit'), validate(updateTeamSchema), controller.update);
router.delete('/:id', requirePermission('teams', 'delete'), controller.remove);

router.get('/:id/members', requirePermission('teams', 'view'), controller.listMembers);
router.post('/:id/members', requirePermission('teams', 'edit'), validate(addMemberSchema), controller.addMember);
router.put(
  '/:id/members/:employeeId',
  requirePermission('teams', 'edit'),
  validate(updateMemberSchema),
  controller.updateMember
);
router.delete('/:id/members/:employeeId', requirePermission('teams', 'edit'), controller.removeMember);

module.exports = router;
