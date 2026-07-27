const svc = require('../services/salaryComponent.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// ── Component Master ─────────────────────────────────────────

const listComponents = asyncHandler(async (req, res) => {
  const activeOnly = req.query.active === 'true' ? true : req.query.active === 'false' ? false : null;
  new ApiResponse(200, await svc.listComponents(activeOnly), 'Components fetched').send(res);
});

const getComponent = asyncHandler(async (req, res) => {
  new ApiResponse(200, await svc.getComponent(req.params.id), 'Component fetched').send(res);
});

const createComponent = asyncHandler(async (req, res) => {
  new ApiResponse(201, await svc.upsertComponent(null, req.body), 'Component created').send(res);
});

const updateComponent = asyncHandler(async (req, res) => {
  new ApiResponse(200, await svc.upsertComponent(req.params.id, req.body), 'Component updated').send(res);
});

const toggleComponent = asyncHandler(async (req, res) => {
  const { active } = req.body;
  new ApiResponse(200, await svc.toggleComponent(req.params.id, active), 'Component updated').send(res);
});

// ── Structures ───────────────────────────────────────────────

const listStructures = asyncHandler(async (req, res) => {
  new ApiResponse(200, await svc.listStructures(), 'Structures fetched').send(res);
});

const getStructure = asyncHandler(async (req, res) => {
  new ApiResponse(200, await svc.getStructure(req.params.id), 'Structure fetched').send(res);
});

const upsertStructure = asyncHandler(async (req, res) => {
  const id = req.params.id || null;
  const status = id ? 200 : 201;
  new ApiResponse(status, await svc.upsertStructure(id, req.body), id ? 'Structure updated' : 'Structure created').send(res);
});

const removeStructureLine = asyncHandler(async (req, res) => {
  await svc.removeStructureLine(req.params.id, req.params.componentId);
  new ApiResponse(200, null, 'Component removed from structure').send(res);
});

// ── CTC Compute ──────────────────────────────────────────────

const computeCTC = asyncHandler(async (req, res) => {
  const { structure_id, ctc_annual, overrides } = req.body;
  const result = await svc.computeCTC(structure_id, Number(ctc_annual), overrides || {});
  new ApiResponse(200, result, 'CTC computed').send(res);
});

module.exports = {
  listComponents, getComponent, createComponent, updateComponent, toggleComponent,
  listStructures, getStructure, upsertStructure, removeStructureLine,
  computeCTC,
};
