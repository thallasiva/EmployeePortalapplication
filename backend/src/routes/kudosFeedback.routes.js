const express = require('express');
const controller = require('../controllers/kudosFeedback.controller');
const validate = require('../middleware/validate');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  giveKudosSchema,
  giveFeedbackSchema,
  requestFeedbackSchema,
  createCategorySchema,
  updateCategorySchema
} = require('../validators/kudosFeedback.validator');

const router = express.Router();

router.use(authenticate);

router.get('/categories', controller.listCategories);
router.post('/categories', authorizeRoles('Admin'), validate(createCategorySchema), controller.createCategory);
router.put('/categories/:id', authorizeRoles('Admin'), validate(updateCategorySchema), controller.updateCategory);
router.delete('/categories/:id', authorizeRoles('Admin'), controller.deleteCategory);

router.get('/employees', controller.listRecipients);
router.get('/summary', controller.getSummary);

router.get('/kudos', controller.listKudos);
router.get('/kudos/top', controller.topRecognised);
router.post('/kudos', validate(giveKudosSchema), controller.giveKudos);

router.get('/feedback', controller.listFeedback);
router.post('/feedback', validate(giveFeedbackSchema), controller.giveFeedback);

router.get('/requests', controller.listRequests);
router.post('/requests', validate(requestFeedbackSchema), controller.requestFeedback);
router.patch('/requests/:id/decline', controller.declineRequest);

router.get('/team', authorizeRoles('Reporting Manager', 'HR Manager', 'Admin'), controller.getTeam);
router.get('/reports', authorizeRoles('HR Manager', 'Admin'), controller.getReport);

module.exports = router;
