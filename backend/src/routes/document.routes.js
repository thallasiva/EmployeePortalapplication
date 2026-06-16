const express = require('express');
const categoryController = require('../controllers/documentCategory.controller');
const documentController = require('../controllers/document.controller');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const {
  createDocumentCategorySchema,
  updateDocumentCategorySchema,
  updateDocumentSchema,
} = require('../validators/document.validator');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

// Document categories (lookup)
router.get('/categories', categoryController.list);
router.get('/categories/:id', categoryController.getOne);
router.post('/categories', requirePermission('documents', 'add'), validate(createDocumentCategorySchema), categoryController.create);
router.put('/categories/:id', requirePermission('documents', 'edit'), validate(updateDocumentCategorySchema), categoryController.update);
router.delete('/categories/:id', requirePermission('documents', 'delete'), categoryController.remove);

// Documents
router.get('/me', documentController.myDocuments);
router.get('/', requirePermission('documents', 'view'), documentController.list);
router.get('/:id', documentController.getOne);
router.post('/', requirePermission('documents', 'add'), upload.single('file'), documentController.upload);
router.put('/:id', requirePermission('documents', 'edit'), validate(updateDocumentSchema), documentController.update);
router.delete('/:id', requirePermission('documents', 'delete'), documentController.remove);

module.exports = router;
