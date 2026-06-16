const ticketService = require('../services/helpdeskTicket.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { employee_id, status, priority, category, assigned_to, search } = req.query;
  const { rows, total } = await ticketService.list({ employee_id, status, priority, category, assigned_to, search, limit, offset });
  new ApiResponse(200, rows, 'Tickets fetched', buildMeta({ page, limit, total })).send(res);
});

const myTickets = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { status, priority, category } = req.query;
  const { rows, total } = await ticketService.list({ employee_id: req.user.employeeId, status, priority, category, limit, offset });
  new ApiResponse(200, rows, 'Tickets fetched', buildMeta({ page, limit, total })).send(res);
});

const getOne = asyncHandler(async (req, res) => {
  const record = await ticketService.getDetails(req.params.id);
  if (!record) throw ApiError.notFound('Ticket not found');
  new ApiResponse(200, record, 'Ticket fetched').send(res);
});

const create = asyncHandler(async (req, res) => {
  const record = await ticketService.create({ ...req.body, employee_id: req.user.employeeId, status: 'Open' });
  new ApiResponse(201, record, 'Ticket created').send(res);
});

const updateStatus = asyncHandler(async (req, res) => {
  const record = await ticketService.updateStatus(req.params.id, req.body.status);
  new ApiResponse(200, record, 'Ticket status updated').send(res);
});

const assign = asyncHandler(async (req, res) => {
  const record = await ticketService.assign(req.params.id, req.body.assigned_to);
  new ApiResponse(200, record, 'Ticket assigned').send(res);
});

const addComment = asyncHandler(async (req, res) => {
  const record = await ticketService.addComment(req.params.id, req.user.employeeId, req.body.comment);
  new ApiResponse(201, record, 'Comment added').send(res);
});

module.exports = { list, myTickets, getOne, create, updateStatus, assign, addComment };
