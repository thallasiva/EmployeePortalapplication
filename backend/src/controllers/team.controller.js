const teamService = require('../services/team.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const filters = { department_id: req.query.department_id, search: req.query.search };

  const [rows, total] = await Promise.all([
    teamService.list({ ...filters, limit, offset }),
    teamService.countAll(filters),
  ]);

  new ApiResponse(200, rows, 'Teams fetched', buildMeta({ page, limit, total })).send(res);
});

const getOne = asyncHandler(async (req, res) => {
  const team = await teamService.getTeamDetails(req.params.id);
  if (!team) throw ApiError.notFound('Team not found');
  new ApiResponse(200, team, 'Team fetched').send(res);
});

const create = asyncHandler(async (req, res) => {
  const team = await teamService.create(req.body);
  new ApiResponse(201, team, 'Team created').send(res);
});

const update = asyncHandler(async (req, res) => {
  const exists = await teamService.existsById(req.params.id);
  if (!exists) throw ApiError.notFound('Team not found');
  const team = await teamService.update(req.params.id, req.body);
  new ApiResponse(200, team, 'Team updated').send(res);
});

const remove = asyncHandler(async (req, res) => {
  const exists = await teamService.existsById(req.params.id);
  if (!exists) throw ApiError.notFound('Team not found');
  await teamService.remove(req.params.id);
  new ApiResponse(200, null, 'Team deleted').send(res);
});

const listMembers = asyncHandler(async (req, res) => {
  const members = await teamService.listMembers(req.params.id);
  new ApiResponse(200, members, 'Team members fetched').send(res);
});

const addMember = asyncHandler(async (req, res) => {
  const team = await teamService.addMember(req.params.id, req.body);
  new ApiResponse(201, team, 'Team member added').send(res);
});

const updateMember = asyncHandler(async (req, res) => {
  const team = await teamService.updateMember(req.params.id, req.params.employeeId, req.body);
  new ApiResponse(200, team, 'Team member updated').send(res);
});

const removeMember = asyncHandler(async (req, res) => {
  const team = await teamService.removeMember(req.params.id, req.params.employeeId);
  new ApiResponse(200, team, 'Team member removed').send(res);
});

module.exports = { list, getOne, create, update, remove, listMembers, addMember, updateMember, removeMember };
