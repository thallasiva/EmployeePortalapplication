'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, buildMeta } = require('../utils/pagination');
const joiningSvc = require('../services/joining.service');
const notify = require('../services/mailNotify.service');




const verifyToken = asyncHandler(async (req, res) => {
  const data = await joiningSvc.verifyToken(req.query.token);
  new ApiResponse(200, data, 'Token verified').send(res);
});


const getFormByToken = asyncHandler(async (req, res) => {
  const data = await joiningSvc.getFormByToken(req.query.token);
  new ApiResponse(200, data, 'Form data loaded').send(res);
});


const saveFormalities = asyncHandler(async (req, res) => {
  const { token, submit, ...formData } = req.body;


  const files = req.files || {};
  if (files.aadhar_doc?.[0]) formData.aadharDocUrl = `/uploads/${files.aadhar_doc[0].filename}`;
  if (files.pan_doc?.[0]) formData.panDocUrl = `/uploads/${files.pan_doc[0].filename}`;

  const data = await joiningSvc.saveFormalities(token, formData, !!submit);

  if (submit) {

    notify.joiningSubmitted({
      candidateName: data.candidate_name || 'Candidate',
      candidateEmail: data.candidate_email,
      jobTitle: data.job_title || ''
    });
  }

  new ApiResponse(200, data, submit ? 'Formalities submitted for review' : 'Progress saved').send(res);
});




const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { rows, total } = await joiningSvc.list({
    status: req.query.status,
    search: req.query.search,
    limit,
    offset
  });
  new ApiResponse(200, rows, 'Joining invitations fetched', buildMeta({ page, limit, total })).send(res);
});


const getDetail = asyncHandler(async (req, res) => {
  const data = await joiningSvc.getDetail(Number(req.params.id));
  new ApiResponse(200, data, 'Joining formality detail fetched').send(res);
});


const review = asyncHandler(async (req, res) => {
  const { decision, remarks, changesFields, employeeId, designation, reportingTo, department } = req.body;
  const data = await joiningSvc.review(Number(req.params.id), {
    decision,
    remarks,
    changesFields,
    reviewedBy: req.user.employeeId,
    employeeId: employeeId || null,
    designation: designation || null,
    reportingTo: reportingTo || null,
    department: department || null
  });


  const name = data.candidate_name || 'Candidate';
  const email = data.candidate_email || null;
  const jobTitle = data.job_title || '';
  const token = data.token || '';

  if (decision === 'approve') {
    notify.joiningApproved({ candidateName: name, candidateEmail: email, jobTitle });
  } else if (decision === 'request_changes') {
    notify.joiningChangesRequested({
      candidateName: name,
      candidateEmail: email,
      jobTitle,
      remarks,
      changesFields,
      joiningUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/joining/${token}`
    });
  } else if (decision === 'reject') {
    notify.joiningRejected({ candidateName: name, candidateEmail: email, jobTitle, remarks });
  }

  new ApiResponse(200, data, `Decision recorded: ${decision}`).send(res);
});


const getMyJoiningDocs = asyncHandler(async (req, res) => {
  const data = await joiningSvc.getMyJoiningDocs(req.user.employeeId);
  new ApiResponse(200, data || {}, 'Joining docs fetched').send(res);
});


const getByOffer = asyncHandler(async (req, res) => {
  const data = await joiningSvc.getByOffer(Number(req.params.offerId));
  new ApiResponse(200, data || null, data ? 'Invitation found' : 'No invitation yet').send(res);
});


const resendInvitation = asyncHandler(async (req, res) => {


  const data = await joiningSvc.getInvitation(Number(req.params.id));
  const joiningUrl = (process.env.FRONTEND_URL || 'http://localhost:3000') +
  '/joining/' + data.token;

  notify.joiningInvitation({
    candidateName: data.candidate_name || 'Candidate',
    candidateEmail: data.candidate_email || null,
    jobTitle: data.job_title || '',
    joiningUrl,
    expiresAt: data.expires_at,
    pdfBuffer: null,
    pdfFilename: null,
    offerCode: data.offer_code || null,
    dateOfJoining: data.date_of_joining || null,
    ctc: data.ctc || 0
  });

  new ApiResponse(200, { sent: true }, 'Invitation resent').send(res);
});

module.exports = {
  verifyToken,
  getFormByToken,
  saveFormalities,
  list,
  getDetail,
  review,
  getMyJoiningDocs,
  getByOffer,
  resendInvitation
};
