'use strict';

const asyncHandler   = require('../utils/asyncHandler');
const ApiResponse    = require('../utils/ApiResponse');
const { getPagination, buildMeta } = require('../utils/pagination');
const joiningSvc     = require('../services/joining.service');
const notify         = require('../services/mailNotify.service');

/* ── PUBLIC (no auth) ──────────────────────────────────────────── */

/** GET /api/joining/verify?token=xxx */
const verifyToken = asyncHandler(async (req, res) => {
  const data = await joiningSvc.verifyToken(req.query.token);
  new ApiResponse(200, data, 'Token verified').send(res);
});

/** GET /api/joining/form?token=xxx — load all saved formality fields (for reopen after changes_requested) */
const getFormByToken = asyncHandler(async (req, res) => {
  const data = await joiningSvc.getFormByToken(req.query.token);
  new ApiResponse(200, data, 'Form data loaded').send(res);
});

/** POST /api/joining/save — save draft or submit (multipart/form-data with optional file uploads) */
const saveFormalities = asyncHandler(async (req, res) => {
  const { token, submit, ...formData } = req.body;

  // Attach uploaded file paths to form data
  const files = req.files || {};
  if (files.aadhar_doc?.[0]) formData.aadharDocUrl = `/uploads/${files.aadhar_doc[0].filename}`;
  if (files.pan_doc?.[0])    formData.panDocUrl    = `/uploads/${files.pan_doc[0].filename}`;

  const data = await joiningSvc.saveFormalities(token, formData, !!submit);

  if (submit) {
    // Notify HR that formalities were submitted
    notify.joiningSubmitted({
      candidateName:  data.candidate_name || 'Candidate',
      candidateEmail: data.candidate_email,
      jobTitle:       data.job_title      || '',
    });
  }

  new ApiResponse(200, data, submit ? 'Formalities submitted for review' : 'Progress saved').send(res);
});

/* ── PROTECTED (HR/Admin only) ─────────────────────────────────── */

/** GET /api/joining/invitations?status=&search= */
const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { rows, total } = await joiningSvc.list({
    status: req.query.status,
    search: req.query.search,
    limit,
    offset,
  });
  new ApiResponse(200, rows, 'Joining invitations fetched', buildMeta({ page, limit, total })).send(res);
});

/** GET /api/joining/invitations/:id */
const getDetail = asyncHandler(async (req, res) => {
  const data = await joiningSvc.getDetail(Number(req.params.id));
  new ApiResponse(200, data, 'Joining formality detail fetched').send(res);
});

/** PUT /api/joining/invitations/:id/review */
const review = asyncHandler(async (req, res) => {
  const { decision, remarks, changesFields, employeeId, designation, reportingTo, department } = req.body;
  const data = await joiningSvc.review(Number(req.params.id), {
    decision,
    remarks,
    changesFields,
    reviewedBy:  req.user.employeeId,
    employeeId:  employeeId  || null,
    designation: designation || null,
    reportingTo: reportingTo || null,
    department:  department  || null,
  });

  // Fire notification based on decision
  const name     = data.candidate_name  || 'Candidate';
  const email    = data.candidate_email || null;
  const jobTitle = data.job_title       || '';
  const token    = data.token           || '';

  if (decision === 'approve') {
    notify.joiningApproved({ candidateName: name, candidateEmail: email, jobTitle });
  } else if (decision === 'request_changes') {
    notify.joiningChangesRequested({
      candidateName:  name,
      candidateEmail: email,
      jobTitle,
      remarks,
      changesFields,
      joiningUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/joining/${token}`,
    });
  } else if (decision === 'reject') {
    notify.joiningRejected({ candidateName: name, candidateEmail: email, jobTitle, remarks });
  }

  new ApiResponse(200, data, `Decision recorded: ${decision}`).send(res);
});

/** GET /api/joining/my-joining-docs — employee fetches their own uploaded docs + acknowledgments */
const getMyJoiningDocs = asyncHandler(async (req, res) => {
  const data = await joiningSvc.getMyJoiningDocs(req.user.employeeId);
  new ApiResponse(200, data || {}, 'Joining docs fetched').send(res);
});

/** GET /api/joining/by-offer/:offerId — get joining invitation for an offer */
const getByOffer = asyncHandler(async (req, res) => {
  const data = await joiningSvc.getByOffer(Number(req.params.offerId));
  new ApiResponse(200, data || null, data ? 'Invitation found' : 'No invitation yet').send(res);
});

/** POST /api/joining/invitations/:id/resend — resend invitation email */
const resendInvitation = asyncHandler(async (req, res) => {
  // Use getInvitation (not getDetail) so this works even before the candidate
  // has filled any formality data (getDetail requires a joining_formalities row).
  const data = await joiningSvc.getInvitation(Number(req.params.id));
  const joiningUrl = (process.env.FRONTEND_URL || 'http://localhost:3000')
    + '/joining/' + data.token;

  notify.joiningInvitation({
    candidateName:  data.candidate_name  || 'Candidate',
    candidateEmail: data.candidate_email || null,
    jobTitle:       data.job_title       || '',
    joiningUrl,
    expiresAt:      data.expires_at,
    pdfBuffer:      null,
    pdfFilename:    null,
    offerCode:      data.offer_code      || null,
    dateOfJoining:  data.date_of_joining || null,
    ctc:            data.ctc             || 0,
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
  resendInvitation,
};
