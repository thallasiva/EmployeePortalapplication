'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { assertSlotAvailable } = require('./interviewerAvailability.service');

function createConnection({
  availabilityCount = 0,
  weeklyCount = 0,
  available = true,
  weeklyAvailable = true,
  conflict = false
} = {}) {
  const weeklyParameters = [];
  return {
    weeklyParameters,
    query: async (sql, params) => {
      if (sql.includes('COUNT(*)')) {
        return [[{ total: sql.includes('rec_interviewer_weekly_availability') ? weeklyCount : availabilityCount }]];
      }
      if (sql.includes('FROM rec_interviewer_weekly_availability')) {
        weeklyParameters.push(params);
        return [weeklyAvailable ? [{ weekly_availability_id: 1 }] : []];
      }
      if (sql.includes('FROM rec_interviewer_availability')) {
        return [available ? [{ availability_id: 1 }] : []];
      }
      if (sql.includes('FROM rec_interviews')) {
        return [conflict ? [{ interview_id: 2 }] : []];
      }
      throw new Error(`Unexpected SQL in availability test: ${sql}`);
    },
  };
}

const slot = {
  interviewer: 'Alex Interviewer',
  interviewDate: new Date('2026-06-02T00:00:00.000Z'),
  interviewTime: '09:00',
  durationMinutes: 60,
};

test('allows scheduling when an interviewer has no saved availability windows', async () => {
  await assertSlotAvailable(createConnection(), slot);
});

test('rejects a slot outside recorded interviewer availability', async () => {
  await assert.rejects(
    assertSlotAvailable(createConnection({ availabilityCount: 1, available: false }), slot),
    /outside this interviewer’s recorded availability/
  );
});

test('rejects overlapping scheduled interviews', async () => {
  await assert.rejects(
    assertSlotAvailable(createConnection({ conflict: true }), slot),
    /already has an overlapping interview/
  );
});

test('accepts a covered slot without an existing interview conflict', async () => {
  await assertSlotAvailable(createConnection({ availabilityCount: 1 }), slot);
});

test('accepts a slot covered by a recurring weekly window', async () => {
  const connection = createConnection({ weeklyCount: 1 });
  await assertSlotAvailable(connection, slot);
  assert.deepEqual(connection.weeklyParameters[0], [
    'Alex Interviewer', 2, '2026-06-02', '2026-06-02', '09:00:00', '10:00:00'
  ]);
});

test('rejects a slot not covered by any configured weekly window', async () => {
  await assert.rejects(
    assertSlotAvailable(createConnection({ weeklyCount: 1, weeklyAvailable: false }), slot),
    /outside this interviewer’s recorded availability/
  );
});
