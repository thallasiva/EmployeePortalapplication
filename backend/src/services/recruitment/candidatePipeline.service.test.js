'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { assertAllowedStatusTransition } = require('./candidatePipeline.service');

test('allows each forward candidate pipeline transition', () => {
  assert.doesNotThrow(() => assertAllowedStatusTransition('Applied', 'Work in Progress'));
  assert.doesNotThrow(() => assertAllowedStatusTransition('Interview Scheduled', 'Schedule Interview'));
  assert.doesNotThrow(() => assertAllowedStatusTransition('Interview Scheduled', 'Shortlisted'));
  assert.doesNotThrow(() => assertAllowedStatusTransition('Shortlisted', 'Offer Released'));
  assert.doesNotThrow(() => assertAllowedStatusTransition('Offer Released', 'Offer Accepted'));
  assert.doesNotThrow(() => assertAllowedStatusTransition('Joining Formalities', 'Onboarded'));
});

test('allows rejection from an active stage but blocks skipped or backward stages', () => {
  assert.doesNotThrow(() => assertAllowedStatusTransition('Work in Progress', 'Rejected'));
  assert.throws(() => assertAllowedStatusTransition('Work in Progress', 'Interview Scheduled'), { statusCode: 409 });
  assert.throws(() => assertAllowedStatusTransition('Work in Progress', 'Shortlisted'), { statusCode: 409 });
  assert.throws(() => assertAllowedStatusTransition('Offer Accepted', 'Offer Released'), { statusCode: 409 });
});

test('does not reopen terminal candidates', () => {
  assert.throws(() => assertAllowedStatusTransition('Rejected', 'Work in Progress'), { statusCode: 409 });
  assert.throws(() => assertAllowedStatusTransition('Onboarded', 'Rejected'), { statusCode: 409 });
});
