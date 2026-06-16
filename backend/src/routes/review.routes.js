const express = require('express');
const reviewTypeController = require('../controllers/reviewType.controller');
const reviewController = require('../controllers/review.controller');
const validate = require('../middleware/validate');
const { namedEntitySchema } = require('../validators/common.validator');
const {
  createReviewTypeSchema,
  updateReviewTypeSchema,
  createReviewSchema,
  updateReviewSchema,
  submitReviewSchema,
} = require('../validators/review.validator');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

// Review types (lookup)
router.get('/types', reviewTypeController.list);
router.get('/types/:id', reviewTypeController.getOne);
router.post('/types', requirePermission('reviews', 'add'), validate(createReviewTypeSchema), reviewTypeController.create);
router.put('/types/:id', requirePermission('reviews', 'edit'), validate(updateReviewTypeSchema), reviewTypeController.update);
router.delete('/types/:id', requirePermission('reviews', 'delete'), reviewTypeController.remove);

// Self-service
router.get('/me', reviewController.myReviews);
router.get('/to-review', reviewController.reviewsToGive);
router.put('/:id/submit', validate(submitReviewSchema), reviewController.submit);

// Admin / manager management
router.get('/', requirePermission('reviews', 'view'), reviewController.list);
router.get('/:id', requirePermission('reviews', 'view'), reviewController.getOne);
router.post('/', requirePermission('reviews', 'add'), validate(createReviewSchema), reviewController.create);
router.put('/:id', requirePermission('reviews', 'edit'), validate(updateReviewSchema), reviewController.update);
router.put('/:id/complete', requirePermission('reviews', 'edit'), reviewController.complete);
router.delete('/:id', requirePermission('reviews', 'delete'), reviewController.remove);

module.exports = router;
