const svc = require('../services/resignation.service');
const asyncHandler = require('../utils/asyncHandler');
exports.getMyResignations = asyncHandler(async (req, res) => res.json(await svc.getMyResignations(req.user.employeeId, req.user.companyId)));
exports.submitResignation = asyncHandler(async (req, res) => res.status(201).json(await svc.submitResignation(req.user.employeeId, req.body, req.file, req.user.companyId)));
exports.withdrawResignation = asyncHandler(async (req, res) => res.json(await svc.withdrawResignation(req.user.employeeId, req.params.id, req.user.companyId)));
exports.downloadAttachment = asyncHandler(async (req, res) => {
  const { filePath, fileName } = await svc.getAttachmentFile(req.params.id, req.user.employeeId, false, req.user.companyId);
  res.download(filePath, fileName);
});
exports.getTeamResignations = asyncHandler(async (req, res) => res.json(await svc.getTeamResignations(req.user.employeeId, { ...req.query, companyId: req.user.companyId })));
exports.reviewByManager = asyncHandler(async (req, res) => res.json(await svc.reviewByManager(req.user.employeeId, req.params.id, req.body, req.user.companyId)));
exports.getAllResignations = asyncHandler(async (req, res) => res.json(await svc.getAllResignations({ ...req.query, companyId: req.user.companyId })));
exports.reviewResignation = asyncHandler(async (req, res) => res.json(await svc.reviewResignation(req.user.employeeId, req.params.id, req.body, req.user.companyId)));
exports.adminDownload = asyncHandler(async (req, res) => {
  const { filePath, fileName } = await svc.getAttachmentFile(req.params.id, null, true, req.user.companyId);
  res.download(filePath, fileName);
});
