const express = require('express');
const controller = require('../controllers/helpdesk.controller');
const validate = require('../middleware/validate');
const {
  createTicketSchema,
  updateStatusSchema,
  assignTicketSchema,
  addCommentSchema,
} = require('../validators/helpdesk.validator');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

// Self-service
router.get('/me', controller.myTickets);
router.post('/', validate(createTicketSchema), controller.create);
router.post('/:id/comments', validate(addCommentSchema), controller.addComment);

// Admin / support views
router.get('/', requirePermission('helpdesk', 'view'), controller.list);
router.get('/:id', controller.getOne);
router.put('/:id/status', requirePermission('helpdesk', 'edit'), validate(updateStatusSchema), controller.updateStatus);
router.put('/:id/assign', requirePermission('helpdesk', 'edit'), validate(assignTicketSchema), controller.assign);

module.exports = router;
