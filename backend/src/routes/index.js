const express = require('express');

const router = express.Router();

// Health check — used by Railway to confirm the service is up
router.get('/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));

router.use('/auth', require('./auth.routes'));
router.use('/auth/mfa', require('./mfa.routes'));

router.use('/employees', require('./employee.routes'));
router.use('/departments', require('./department.routes'));
router.use('/designations', require('./designation.routes'));
router.use('/offices', require('./office.routes'));
router.use('/leadership-roles', require('./leadershipRole.routes'));
router.use('/roles', require('./role.routes'));
router.use('/permissions', require('./permission.routes'));
router.use('/teams', require('./team.routes'));

router.use('/attendance', require('./attendance.routes'));
router.use('/leave-types', require('./leaveType.routes'));
router.use('/holidays', require('./holiday.routes'));
router.use('/leave-requests', require('./leaveRequest.routes'));

router.use('/payroll', require('./payroll.routes'));

router.use('/hiring', require('./hiring.routes'));
router.use('/reviews', require('./review.routes'));
router.use('/appraisal', require('./appraisal.routes'));
router.use('/it-declaration', require('./itDeclaration.routes'));
router.use('/resignations',   require('./resignation.routes'));

router.use('/helpdesk', require('./helpdesk.routes'));
router.use('/documents', require('./document.routes'));

router.use('/companies', require('./company.routes'));
router.use('/calendar-events', require('./calendar.routes'));
router.use('/workflow-delegates', require('./workflowDelegate.routes'));
router.use('/org-hierarchy',     require('./orgHierarchy.routes'));
router.use('/request-hub', require('./requestHub.routes'));

router.use('/timesheets', require('./timesheet.routes'));
router.use('/work-schedules', require('./workSchedule.routes'));

router.use('/reports', require('./report.routes'));
router.use('/dashboard', require('./dashboard.routes'));

module.exports = router;
