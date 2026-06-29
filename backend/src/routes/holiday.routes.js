const express = require('express');
const controller = require('../controllers/holiday.controller');
const validate = require('../middleware/validate');
const { createHolidaySchema, updateHolidaySchema, importHolidaysSchema } = require('../validators/holiday.validator');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

router.get('/',           controller.list);
router.get('/locations',  controller.listLocations);   // GET /holidays/locations
router.post('/import',    requirePermission('leave', 'add'), validate(importHolidaysSchema), controller.importHolidays);
router.get('/:id',        controller.getOne);
router.post('/',          requirePermission('leave', 'add'),    validate(createHolidaySchema), controller.create);
router.put('/:id',        requirePermission('leave', 'edit'),   validate(updateHolidaySchema), controller.update);
router.delete('/:id',     requirePermission('leave', 'delete'), controller.remove);

module.exports = router;
