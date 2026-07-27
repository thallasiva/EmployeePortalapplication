const path = require('path');
const documentService = require('../services/document.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { category_id, visibility, search, employee_id } = req.query;
  const { rows, total } = await documentService.list({ category_id, visibility, search, employee_id, limit, offset });
  new ApiResponse(200, rows, 'Documents fetched', buildMeta({ page, limit, total })).send(res);
});

const myDocuments = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { category_id, search } = req.query;
  const { rows, total } = await documentService.list({ employee_id: req.user.employeeId, category_id, search, limit, offset });
  new ApiResponse(200, rows, 'Documents fetched', buildMeta({ page, limit, total })).send(res);
});

const getOne = asyncHandler(async (req, res) => {
  const record = await documentService.getDetails(req.params.id);
  if (!record) throw ApiError.notFound('Document not found');
  new ApiResponse(200, record, 'Document fetched').send(res);
});





const upload = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('A file is required');

  const fileSizeLabel = `${(req.file.size / 1024).toFixed(1)} KB`;
  const record = await documentService.create({
    title: req.body.title || req.file.originalname,
    description: req.body.description || null,
    category_id: req.body.category_id || null,
    file_type: path.extname(req.file.originalname).replace('.', '').toUpperCase(),
    file_size: fileSizeLabel,
    file_url: `/uploads/${req.file.filename}`,
    visibility: req.body.visibility || 'all',
    employee_id: req.body.employee_id || null,
    uploaded_by: req.user.employeeId
  });

  new ApiResponse(201, record, 'Document uploaded').send(res);
});

const update = asyncHandler(async (req, res) => {
  const exists = await documentService.existsById(req.params.id);
  if (!exists) throw ApiError.notFound('Document not found');
  const record = await documentService.update(req.params.id, req.body);
  new ApiResponse(200, record, 'Document updated').send(res);
});

const remove = asyncHandler(async (req, res) => {
  const exists = await documentService.existsById(req.params.id);
  if (!exists) throw ApiError.notFound('Document not found');
  await documentService.remove(req.params.id);
  new ApiResponse(200, null, 'Document deleted').send(res);
});

module.exports = { list, myDocuments, getOne, upload, update, remove };
