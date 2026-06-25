const express = require('express');
const router  = express.Router();
const c = require('../controllers/workSchedule.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth');

router.use(authenticate);
router.use(authorizeRoles('Admin'));

router.get('/',                      c.listAll);
router.get('/:employeeId',           c.getByEmployee);
router.put('/:employeeId',           c.upsert);
router.delete('/:employeeId',        c.remove);

module.exports = router;
