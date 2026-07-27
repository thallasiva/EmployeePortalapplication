const svc = require('../services/resignation.service');
const asyncHandler = require('../utils/asyncHandler');


exports.getMyResignations = asyncHandler(async (req, res) => res.json(await svc.getMyResignations(req.user.employeeId)));
exports.submitResignation = asyncHandler(async (req, res) => res.status(201).json(await svc.submitResignation(req.user.employeeId, req.body, req.file)));
exports.withdrawResignation = asyncHandler(async (req, res) => res.json(await svc.withdrawResignation(req.user.employeeId, req.params.id)));
exports.downloadAttachment = asyncHandler(async (req, res) => {
  const { filePath, fileName } = await svc.getAttachmentFile(req.params.id, req.user.employeeId, false);
  res.download(filePath, fileName);
});


exports.getTeamResignations = asyncHandler(async (req, res) => res.json(await svc.getTeamResignations(req.user.employeeId, req.query)));
exports.reviewByManager = asyncHandler(async (req, res) => res.json(await svc.reviewByManager(req.user.employeeId, req.params.id, req.body)));


exports.getAllResignations = asyncHandler(async (req, res) => res.json(await svc.getAllResignations(req.query)));
exports.reviewResignation = asyncHandler(async (req, res) => res.json(await svc.reviewResignation(req.user.employeeId, req.params.id, req.body)));
exports.adminDownload = asyncHandler(async (req, res) => {
  const { filePath, fileName } = await svc.getAttachmentFile(req.params.id, null, true);
  res.download(filePath, fileName);
});
