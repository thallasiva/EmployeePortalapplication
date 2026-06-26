const express    = require('express');
const controller = require('../controllers/helpdesk.controller');
const validate   = require('../middleware/validate');
const {
  createTicketSchema, updateStatusSchema, reopenTicketSchema,
  managerActionSchema, assignTicketSchema, addCommentSchema,
} = require('../validators/helpdesk.validator');
const { authenticate }      = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();
router.use(authenticate);

/* ── Employee ───────────────────────────────────────────── */
router.get( '/me',               controller.myTickets);
router.post('/',                 validate(createTicketSchema), controller.create);
router.post('/:id/comments',     validate(addCommentSchema),   controller.addComment);
router.put( '/:id/close',        controller.closeTicket);
router.put( '/:id/reopen',       validate(reopenTicketSchema), controller.reopenTicket);

/* ── Manager ────────────────────────────────────────────── */
router.get('/team',              controller.teamTickets);
router.put('/:id/manager-action', validate(managerActionSchema), controller.managerAction);

/* ── Admin (RBAC-gated) ─────────────────────────────────── */
router.get('/',       requirePermission('helpdesk', 'view'), controller.list);
router.get('/:id',   controller.getOne);
router.put('/:id/status', requirePermission('helpdesk', 'edit'), validate(updateStatusSchema), controller.updateStatus);
router.put('/:id/assign', requirePermission('helpdesk', 'edit'), validate(assignTicketSchema), controller.assign);

module.exports = router;
