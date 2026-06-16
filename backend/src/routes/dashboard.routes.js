const express = require('express');
const controller = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/stats', controller.stats);
router.get('/attendance', controller.attendanceDashboard);
router.get('/team-leave-calendar', controller.teamLeaveCalendar);
router.get('/events', controller.events);
router.get('/recent-activities', controller.recentActivities);

module.exports = router;
