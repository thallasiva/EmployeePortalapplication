const asyncHandler = require("express-async-handler");
const offerSvc     = require("../../services/recruitment/offer.service");
const { getPagination, buildMeta } = require("../../utils/pagination");
const ApiResponse  = require("../../utils/ApiResponse");

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { rows, total } = await offerSvc.list({ status: req.query.status, search: req.query.search, limit, offset });
  new ApiResponse(200, rows, "Offers fetched", buildMeta({ page, limit, total })).send(res);
});

const getOne = asyncHandler(async (req, res) => {
  const data = await offerSvc.getById(Number(req.params.id));
  new ApiResponse(200, data, "Offer fetched").send(res);
});

const create = asyncHandler(async (req, res) => {
  const data = await offerSvc.create(req.body, req.user.user_id, req.ip);
  new ApiResponse(201, data, "Offer created").send(res);
});

const release = asyncHandler(async (req, res) => {
  const data = await offerSvc.release(Number(req.params.id), req.user.user_id, req.ip);
  new ApiResponse(200, data, "Offer released").send(res);
});

const respond = asyncHandler(async (req, res) => {
  const data = await offerSvc.respond(Number(req.params.id), req.body.response, req.user.user_id, req.ip);
  new ApiResponse(200, data, "Offer response recorded").send(res);
});

module.exports = { list, getOne, create, release, respond };
