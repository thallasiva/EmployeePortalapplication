'use strict';

const ApiError = require('../../utils/ApiError');

const STATUS_TRANSITIONS = Object.freeze({
  Applied: ['Work in Progress', 'Rejected'],
  'Work in Progress': ['Rejected'],
  Screening: ['Rejected'],
  'Interview Scheduled': ['Schedule Interview', 'Shortlisted', 'Rejected'],
  'Schedule Interview': ['Shortlisted', 'Rejected'],
  Shortlisted: ['Offer Released', 'Rejected'],
  Selected: ['Offer Released', 'Rejected'],
  'Offer Released': ['Offer Accepted', 'Offer Rejected'],
  'Offer Accepted': ['Joining Formalities'],
  'Joining Formalities': ['Onboarded'],
});

function candidateLockName(candidateId) {
  return `rec_candidate_${Number(candidateId)}`;
}

function assertAllowedStatusTransition(currentStatus, nextStatus) {
  const current = String(currentStatus || '').trim();
  const next = String(nextStatus || '').trim();
  if (current === next) return;

  if (['Rejected', 'Not Selected', 'Offer Rejected', 'Onboarded'].includes(current)) {
    throw new ApiError(409, `Candidate status ${current} is terminal and cannot be changed.`);
  }
  const allowed = STATUS_TRANSITIONS[current];
  if (!allowed || !allowed.includes(next)) {
    throw new ApiError(409, `Candidate cannot move from ${current || 'an unknown status'} to ${next}. Follow the recruitment pipeline.`);
  }
}

module.exports = { STATUS_TRANSITIONS, candidateLockName, assertAllowedStatusTransition };
