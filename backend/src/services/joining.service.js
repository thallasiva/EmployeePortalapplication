'use strict';

const crypto     = require('crypto');
const { callProcedure } = require('../config/db');
const ApiError   = require('../utils/ApiError');

const TOKEN_TTL_DAYS = 7;   // Invitation link valid for 7 days

/* ── helpers ─────────────────────────────────────────────────────── */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function expiresAt(days = TOKEN_TTL_DAYS) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

/* ── service ─────────────────────────────────────────────────────── */

/**
 * Called by offer.service.js when an offer is released.
 * Creates/refreshes a joining invitation and returns it.
 */
async function createInvitation({ candidateId, offerId, candidateName, candidateEmail, jobTitle }) {
  if (!candidateEmail) throw ApiError.badRequest('Candidate email is required to send joining invitation');
  const token   = generateToken();
  const expires = expiresAt();
  const results = await callProcedure(
    'sp_joining_create_invitation(?, ?, ?, ?, ?, ?, ?)',
    [candidateId, offerId, token, candidateName || null, candidateEmail, jobTitle || null, expires]
  );
  return (results[0] ?? [])[0] ?? null;
}

/**
 * Public endpoint — verify token and return invitation + any existing formality draft.
 */
async function verifyToken(token) {
  if (!token) throw ApiError.badRequest('Token is required');
  const results = await callProcedure('sp_joining_verify_token(?)', [token]);
  const row = (results[0] ?? [])[0];
  if (!row) throw ApiError.badRequest('This link is invalid or has expired. Please contact HR.');
  return row;
}

/**
 * Save or submit formalities (status: 'draft' | 'submitted').
 */
async function saveFormalities(token, data, submit = false) {
  // Verify token first
  const inv = await verifyToken(token);
  if (['approved', 'rejected'].includes(inv.status)) {
    throw ApiError.badRequest(`This invitation is already ${inv.status}.`);
  }

  const status = submit ? 'submitted' : 'draft';
  const results = await callProcedure(
    'sp_joining_save_formalities(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      inv.id,
      inv.candidate_id,
      data.fullName              || null,
      data.dob                   || null,
      data.gender                || null,
      data.bloodGroup            || null,
      data.personalEmail         || null,
      data.mobile                || null,
      data.emergencyContactName  || null,
      data.emergencyContactPhone || null,
      data.permanentAddress      || null,
      data.currentAddress        || null,
      data.handbookAcknowledged  ? 1 : 0,
      data.privacyPolicyAccepted ? 1 : 0,
      // Term life
      data.termLifeNomineeName     || null,
      data.termLifeNomineeRelation || null,
      data.termLifeNomineeDob      || null,
      data.termLifeNomineeShare    ?? null,
      // Gratuity
      data.gratuityNomineeName     || null,
      data.gratuityNomineeRelation || null,
      data.gratuityNomineeDob      || null,
      data.gratuityNomineeAddress  || null,
      // Insurance
      data.insuranceNomineeName     || null,
      data.insuranceNomineeRelation || null,
      data.insuranceNomineeDob      || null,
      data.insuranceNomineeShare    ?? null,
      // PF
      data.pfAccountNumber   || null,
      data.uanNumber         || null,
      data.pfNomineeName     || null,
      data.pfNomineeRelation || null,
      data.pfNomineeDob      || null,
      data.pfNomineeShare    ?? null,
      data.pfExistingMember  ? 1 : 0,
      // Bank
      data.bankName          || null,
      data.accountNumber     || null,
      data.ifscCode          || null,
      data.accountHolderName || null,
      status,
    ]
  );
  return (results[0] ?? [])[0] ?? null;
}

/**
 * HR: list invitations with optional status filter.
 */
async function list({ status, search, limit = 20, offset = 0 } = {}) {
  const results = await callProcedure(
    'sp_joining_list_pending(?, ?, ?, ?)',
    [status || null, search || null, Number(limit), Number(offset)]
  );
  return { rows: results[0] ?? [], total: (results[1] ?? [])[0]?.total ?? 0 };
}

/**
 * HR: get full formality detail for one invitation.
 */
async function getDetail(invitationId) {
  const results = await callProcedure('sp_joining_get_formality(?)', [invitationId]);
  const row = (results[0] ?? [])[0];
  if (!row) throw ApiError.notFound('Joining formality record not found');
  return row;
}

/**
 * HR: approve | request_changes | reject
 */
async function review(invitationId, { decision, remarks, changesFields, reviewedBy }) {
  const allowed = ['approve', 'request_changes', 'reject'];
  if (!allowed.includes(decision)) throw ApiError.badRequest(`Decision must be one of: ${allowed.join(', ')}`);
  const results = await callProcedure(
    'sp_joining_review(?, ?, ?, ?, ?)',
    [invitationId, decision, reviewedBy, remarks || null, changesFields || null]
  );
  return (results[0] ?? [])[0] ?? null;
}

/**
 * Get invitation by offer_id — used to show joining link in offer detail.
 */
async function getByOffer(offerId) {
  const results = await callProcedure('sp_joining_get_by_offer(?)', [offerId]);
  return (results[0] ?? [])[0] ?? null;
}

/**
 * Get just the invitation row (no formality join required).
 * Used by resend -- works even before candidate fills any formality data.
 */
async function getInvitation(invitationId) {
  const results = await callProcedure('sp_joining_get_invitation(?)', [invitationId]);
  const row = (results[0] ?? [])[0];
  if (!row) throw ApiError.notFound('Joining invitation not found');
  return row;
}

module.exports = {
  createInvitation,
  verifyToken,
  saveFormalities,
  list,
  getDetail,
  review,
  getByOffer,
  getInvitation,
};
