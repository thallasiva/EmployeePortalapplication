const ticketService = require('../services/helpdeskTicket.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');


const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { employee_id, status, priority, category, assigned_to, forwarded_to_team, search } = req.query;
  const { rows, total } = await ticketService.list({
    employee_id, status, priority, category, assigned_to, forwarded_to_team, search, limit, offset
  });
  new ApiResponse(200, rows, 'Tickets fetched', buildMeta({ page, limit, total })).send(res);
});


const teamTickets = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { status, priority, category, search } = req.query;
  const { rows, total } = await ticketService.listTeam(req.user.employeeId, {
    status, priority, category, search, limit, offset
  });
  new ApiResponse(200, rows, 'Team tickets fetched', buildMeta({ page, limit, total })).send(res);
});


const myTickets = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { status, priority, category } = req.query;
  const { rows, total } = await ticketService.list({
    employee_id: req.user.employeeId, status, priority, category, limit, offset
  });
  new ApiResponse(200, rows, 'My tickets fetched', buildMeta({ page, limit, total })).send(res);
});


const getOne = asyncHandler(async (req, res) => {
  const record = await ticketService.getDetails(req.params.id);
  if (!record) throw ApiError.notFound('Ticket not found');
  new ApiResponse(200, record, 'Ticket fetched').send(res);
});


const create = asyncHandler(async (req, res) => {
  const record = await ticketService.create({
    ...req.body,
    employee_id: req.user.employeeId,
    status: 'Open'
  });
  new ApiResponse(201, record, 'Ticket created').send(res);
});


const updateStatus = asyncHandler(async (req, res) => {
  const record = await ticketService.updateStatus(req.params.id, req.body.status);
  new ApiResponse(200, record, 'Status updated').send(res);
});


const assign = asyncHandler(async (req, res) => {
  const record = await ticketService.assign(req.params.id, req.body.assigned_to);
  new ApiResponse(200, record, 'Ticket assigned').send(res);
});


const addComment = asyncHandler(async (req, res) => {
  const record = await ticketService.addComment(
    req.params.id, req.user.employeeId, req.body.comment
  );
  new ApiResponse(201, record, 'Comment added').send(res);
});


const managerAction = asyncHandler(async (req, res) => {
  const { action, forwarded_to_team, comment } = req.body;
  const record = await ticketService.managerAction(
    req.user.employeeId,
    req.params.id,
    action,
    forwarded_to_team || null,
    comment || null
  );
  const msg = action === 'approve' ?
  `Ticket approved and forwarded to ${forwarded_to_team}` :
  'Ticket rejected';
  new ApiResponse(200, record, msg).send(res);
});


const closeTicket = asyncHandler(async (req, res) => {
  const record = await ticketService.closeTicket(req.user.employeeId, req.params.id);
  new ApiResponse(200, record, 'Ticket closed').send(res);
});


const reopenTicket = asyncHandler(async (req, res) => {
  const { comment } = req.body;
  const record = await ticketService.reopenTicket(req.user.employeeId, req.params.id, comment || null);
  new ApiResponse(200, record, 'Ticket reopened').send(res);
});

module.exports = {
  list, teamTickets, myTickets, getOne,
  create, updateStatus, assign, addComment,
  managerAction, closeTicket, reopenTicket
};
