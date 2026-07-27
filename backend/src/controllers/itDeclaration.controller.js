const svc = require('../services/itDeclaration.service');
const asyncHandler = require('../utils/asyncHandler');


exports.getLatestCycle = asyncHandler(async (req, res) => res.json(await svc.getLatestCycle()));
exports.getAllCycles = asyncHandler(async (req, res) => res.json(await svc.getAllCycles()));
exports.createCycle = asyncHandler(async (req, res) => res.status(201).json(await svc.createCycle(req.user.employeeId, req.body)));
exports.updateCycle = asyncHandler(async (req, res) => res.json(await svc.updateCycle(req.params.id, req.body)));
exports.toggleCycle = asyncHandler(async (req, res) => res.json(await svc.toggleCycleStatus(req.params.id, req.user.employeeId)));


exports.getMyDeclaration = asyncHandler(async (req, res) => res.json(await svc.getMyDeclaration(req.user.employeeId)));
exports.saveMyDeclaration = asyncHandler(async (req, res) => res.json(await svc.saveMyDeclaration(req.user.employeeId, req.body)));


exports.getMyProofs = asyncHandler(async (req, res) => res.json(await svc.getMyProofs(req.user.employeeId)));
exports.uploadProof = asyncHandler(async (req, res) => res.status(201).json(await svc.uploadProof(req.user.employeeId, req.body, req.file)));
exports.deleteMyProof = asyncHandler(async (req, res) => res.json(await svc.deleteMyProof(req.user.employeeId, req.params.id)));
exports.downloadProof = asyncHandler(async (req, res) => {
  const isAdmin = req.user.roleName === 'Admin';
  const { filePath, fileName } = await svc.getProofFile(req.params.id, req.user.employeeId, isAdmin);
  res.download(filePath, fileName);
});


exports.getAllDeclarations = asyncHandler(async (req, res) => res.json(await svc.getAllDeclarations(req.query)));
exports.reviewDeclaration = asyncHandler(async (req, res) => res.json(await svc.reviewDeclaration(req.user.employeeId, req.params.id, req.body)));
exports.reviewProof = asyncHandler(async (req, res) => res.json(await svc.reviewProof(req.user.employeeId, req.params.id, req.body)));
