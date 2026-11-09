'use strict';
const express = require('express');
const Joi = require('joi');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { requireCompanyModule } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const c = require('../controllers/training.controller');
const router = express.Router();
const staff = authorizeRoles('Admin', 'HR Manager');
const courseSchema = Joi.object({
  title: Joi.string().trim().min(2).max(160).required(),
  description: Joi.string().allow('', null).max(5000),
  category: Joi.string().allow('', null).max(80),
  duration_hours: Joi.number().min(0).max(10000).allow(null),
  is_active: Joi.boolean(),
});
router.use(authenticate, requireCompanyModule('employees'));
router.get('/me', c.listMine);
router.put('/me/assignments/:assignmentId', validate(Joi.object({ status: Joi.string().valid('In Progress', 'Completed').required() })), c.updateMine);
router.get('/courses', staff, c.listCourses);
router.post('/courses', staff, validate(courseSchema), c.upsertCourse);
router.put('/courses/:id', staff, validate(courseSchema), c.upsertCourse);
router.post('/courses/:courseId/assign', staff, validate(Joi.object({
  employee_ids: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
  due_date: Joi.date().iso().allow(null),
})), c.assign);
router.get('/assignments', staff, c.listAssignments);
module.exports = router;
