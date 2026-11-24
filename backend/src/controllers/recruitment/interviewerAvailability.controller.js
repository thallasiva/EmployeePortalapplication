'use strict';

const asyncHandler = require('express-async-handler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const availabilitySvc = require('../../services/recruitment/interviewerAvailability.service');

const list = asyncHandler(async (req, res) => {
  const rows = await availabilitySvc.list({
    interviewerName: req.query.interviewerName,
    from: req.query.from,
    to: req.query.to,
  });
  new ApiResponse(200, rows, 'Interviewer availability fetched').send(res);
});

const create = asyncHandler(async (req, res) => {
  const availableFrom = `${req.body.availableFrom.replace('T', ' ')}:00`;
  const availableTo = `${req.body.availableTo.replace('T', ' ')}:00`;
  const row = await availabilitySvc.create({
    interviewerName: req.body.interviewerName,
    availableFrom,
    availableTo,
    createdBy: req.user.userId,
  });
  new ApiResponse(201, row, 'Interviewer availability saved').send(res);
});

const createWeekly = asyncHandler(async (req, res) => {
  const row = await availabilitySvc.createWeekly({
    interviewerName: req.body.interviewerName,
    weekday: req.body.weekday,
    availableFrom: `${req.body.availableFrom}:00`,
    availableTo: `${req.body.availableTo}:00`,
    effectiveFrom: req.body.effectiveFrom,
    effectiveTo: req.body.effectiveTo || null,
    createdBy: req.user.userId,
  });
  new ApiResponse(201, row, 'Weekly interviewer availability saved').send(res);
});

const remove = asyncHandler(async (req, res) => {
  const removed = await availabilitySvc.remove(Number(req.params.id), req.user.userId);
  if (!removed) throw new ApiError(404, 'Availability block not found');
  new ApiResponse(200, { availabilityId: Number(req.params.id) }, 'Availability removed').send(res);
});

const removeWeekly = asyncHandler(async (req, res) => {
  const removed = await availabilitySvc.removeWeekly(Number(req.params.id), req.user.userId);
  if (!removed) throw new ApiError(404, 'Weekly availability block not found');
  new ApiResponse(200, { availabilityId: Number(req.params.id) }, 'Weekly availability removed').send(res);
});

module.exports = { list, create, createWeekly, remove, removeWeekly };
