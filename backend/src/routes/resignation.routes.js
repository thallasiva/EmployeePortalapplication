const router = require('express').Router();
const ctrl = require('../controllers/resignation.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticate);


router.get('/my', ctrl.getMyResignations);
router.post('/my', upload.single('file'), ctrl.submitResignation);
router.put('/my/:id/withdraw', ctrl.withdrawResignation);
router.get('/my/:id/attachment', ctrl.downloadAttachment);


const managerOnly = authorizeRoles('Reporting Manager');
router.get('/manager/team', managerOnly, ctrl.getTeamResignations);
router.put('/manager/:id/review', managerOnly, ctrl.reviewByManager);


const adminOnly = authorizeRoles('Admin');
router.get('/admin/all', adminOnly, ctrl.getAllResignations);
router.put('/admin/:id/review', adminOnly, ctrl.reviewResignation);
router.get('/admin/:id/attachment', adminOnly, ctrl.adminDownload);

module.exports = router;
