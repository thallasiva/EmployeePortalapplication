const asyncHandler = require("express-async-handler");
const offerSvc     = require("../../services/recruitment/offer.service");
const { getPagination, buildMeta } = require("../../utils/pagination");
const ApiResponse  = require("../../utils/ApiResponse");
const { generateOfferLetterDocx } = require("../../utils/offerLetterDocx");

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
  const data = await offerSvc.create(req.body, req.user.userId, req.ip);
  new ApiResponse(201, data, "Offer created").send(res);
});

const release = asyncHandler(async (req, res) => {
  const data = await offerSvc.release(Number(req.params.id), req.user.userId, req.ip);
  new ApiResponse(200, data, "Offer released").send(res);
});

const respond = asyncHandler(async (req, res) => {
  const data = await offerSvc.respond(Number(req.params.id), req.body.response, req.user.userId, req.ip);
  new ApiResponse(200, data, "Offer response recorded").send(res);
});

const downloadDocx = asyncHandler(async (req, res) => {
  const row = await offerSvc.getById(Number(req.params.id));
  const buf = generateOfferLetterDocx({
    offerCode:           row.offer_code           || '',
    offerDate:           row.created_at           || new Date(),
    candidateName:       row.candidate_name        || row.name || '',
    designation:         row.designation           || row.job_title || '',
    dateOfJoining:       row.date_of_joining       || '',
    ctc:                 row.ctc                   || 0,
    ctcInWords:          row.ctc_in_words          || '',
    companyName:         process.env.COMPANY_NAME  || 'NAT IT Services Pvt Ltd',
    companyEmail:        process.env.COMPANY_EMAIL || 'hr@natit.in',
    reportTo:            process.env.COMPANY_NAME  || 'NAT IT Services Pvt Ltd',
    basic:               row.basic                 || 0,
    hra:                 row.hra                   || 0,
    telephoneAllowance:  row.telephone_allowance   || 0,
    leaveTravel:         row.leave_travel          || 0,
    specialAllowance:    row.special_allowance     || 0,
    grossSalary:         row.gross_salary          || 0,
    pfContribution:      row.pf_contribution       || 0,
    statutoryBonus:      row.statutory_bonus       || 0,
    gratuity:            row.gratuity              || 0,
    esi:                 row.esi                   || 0,
  });

  const filename = `Offer_Letter_${row.offer_code || req.params.id}.docx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buf);
});

module.exports = { list, getOne, create, release, respond, downloadDocx };
