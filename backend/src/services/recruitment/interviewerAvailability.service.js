'use strict';

const { query } = require('../../config/db');
const ApiError = require('../../utils/ApiError');

function toSqlDateTime(date, time, minutesToAdd = 0) {
  const dateText = date instanceof Date
    ? (!Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : '')
    : String(date).slice(0, 10);
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText);
  if (!dateMatch) throw new ApiError(400, 'Interview date must be a valid ISO date.');
  const [, year, month, day] = dateMatch.map(Number);
  const [hour, minute, second = 0] = String(time).split(':').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  if (Number.isNaN(value.getTime()) || value.getUTCFullYear() !== year ||
      value.getUTCMonth() !== month - 1 || value.getUTCDate() !== day ||
      hour > 23 || minute > 59 || second > 59) {
    throw new ApiError(400, 'Interview date or time is invalid.');
  }
  value.setUTCMinutes(value.getUTCMinutes() + minutesToAdd);
  return value.toISOString().slice(0, 19).replace('T', ' ');
}

async function assertSlotAvailable(connection, { interviewer, interviewDate, interviewTime, durationMinutes }) {
  const name = String(interviewer || '').trim();
  if (!name) return;

  const start = toSqlDateTime(interviewDate, interviewTime || '09:00');
  const end = toSqlDateTime(interviewDate, interviewTime || '09:00', durationMinutes || 60);
  const interviewDay = start.slice(0, 10);
  const [oneOffCount] = await connection.query(
    `SELECT COUNT(*) AS total
       FROM rec_interviewer_availability
      WHERE LOWER(TRIM(interviewer_name)) = LOWER(TRIM(?))
        AND DATE(available_from) <= ? AND DATE(available_to) >= ?`,
    [name, interviewDay, interviewDay]
  );
  const [weeklyCount] = await connection.query(
    `SELECT COUNT(*) AS total
       FROM rec_interviewer_weekly_availability
      WHERE LOWER(TRIM(interviewer_name)) = LOWER(TRIM(?))
        AND effective_from <= ? AND (effective_to IS NULL OR effective_to >= ?)`,
    [name, interviewDay, interviewDay]
  );
  const hasOneOffWindows = Number(oneOffCount[0]?.total) > 0;
  const hasWeeklyWindows = Number(weeklyCount[0]?.total) > 0;
  if (hasOneOffWindows || hasWeeklyWindows) {
    let oneOffAvailable = false;
    if (hasOneOffWindows) {
      const [available] = await connection.query(
      `SELECT availability_id
         FROM rec_interviewer_availability
        WHERE LOWER(TRIM(interviewer_name)) = LOWER(TRIM(?))
          AND available_from <= ? AND available_to >= ?
        LIMIT 1`,
        [name, start, end]
      );
      oneOffAvailable = available.length > 0;
    }

    let weeklyAvailable = false;
    const sameDay = start.slice(0, 10) === end.slice(0, 10);
    if (hasWeeklyWindows && sameDay) {
      const [year, month, day] = start.slice(0, 10).split('-').map(Number);
      const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
      const [available] = await connection.query(
        `SELECT weekly_availability_id
           FROM rec_interviewer_weekly_availability
          WHERE LOWER(TRIM(interviewer_name)) = LOWER(TRIM(?))
            AND weekday = ?
            AND effective_from <= ?
            AND (effective_to IS NULL OR effective_to >= ?)
            AND available_from <= ? AND available_to >= ?
          LIMIT 1`,
        [name, weekday, start.slice(0, 10), start.slice(0, 10), start.slice(11), end.slice(11)]
      );
      weeklyAvailable = available.length > 0;
    }

    if (!oneOffAvailable && !weeklyAvailable) {
      throw new ApiError(409, 'The interview is outside this interviewer’s recorded availability.');
    }
  }

  const [conflicts] = await connection.query(
    `SELECT interview_id
       FROM rec_interviews
      WHERE status = 'Scheduled'
        AND LOWER(TRIM(interviewer)) = LOWER(TRIM(?))
        AND TIMESTAMP(interview_date, interview_time) < ?
        AND TIMESTAMPADD(
              MINUTE, COALESCE(duration_minutes, 60),
              TIMESTAMP(interview_date, interview_time)
            ) > ?
      LIMIT 1`,
    [name, end, start]
  );
  if (conflicts.length) {
    throw new ApiError(409, 'This interviewer already has an overlapping interview.');
  }
}

async function list({ interviewerName, from, to } = {}) {
  const oneOffConditions = [];
  const oneOffParams = [];
  if (interviewerName) {
    oneOffConditions.push('LOWER(interviewer_name) LIKE LOWER(?)');
    oneOffParams.push(`%${interviewerName}%`);
  }
  if (from) {
    oneOffConditions.push('available_to >= ?');
    oneOffParams.push(from);
  }
  if (to) {
    oneOffConditions.push('available_from <= ?');
    oneOffParams.push(to);
  }
  const weeklyConditions = [];
  const weeklyParams = [];
  if (interviewerName) {
    weeklyConditions.push('LOWER(interviewer_name) LIKE LOWER(?)');
    weeklyParams.push(`%${interviewerName}%`);
  }
  if (from) {
    weeklyConditions.push('(effective_to IS NULL OR effective_to >= DATE(?))');
    weeklyParams.push(from);
  }
  if (to) {
    weeklyConditions.push('effective_from <= DATE(?)');
    weeklyParams.push(to);
  }
  const [oneOff, weekly] = await Promise.all([
    query(
      `SELECT availability_id, interviewer_name, available_from, available_to, created_by, created_at
       FROM rec_interviewer_availability
       ${oneOffConditions.length ? `WHERE ${oneOffConditions.join(' AND ')}` : ''}
      ORDER BY available_from ASC
      LIMIT 200`,
      oneOffParams
    ),
    query(
      `SELECT weekly_availability_id, interviewer_name, weekday, available_from, available_to,
              effective_from, effective_to, created_by, created_at
         FROM rec_interviewer_weekly_availability
        ${weeklyConditions.length ? `WHERE ${weeklyConditions.join(' AND ')}` : ''}
        ORDER BY effective_from ASC, weekday ASC, available_from ASC
        LIMIT 200`,
      weeklyParams
    ),
  ]);
  return [
    ...oneOff.map((row) => ({ ...row, availability_kind: 'one_off' })),
    ...weekly.map((row) => ({
      ...row,
      availability_id: row.weekly_availability_id,
      availability_kind: 'weekly',
    })),
  ];
}

async function create({ interviewerName, availableFrom, availableTo, createdBy }) {
  const result = await query(
    `INSERT INTO rec_interviewer_availability
       (interviewer_name, available_from, available_to, created_by)
     VALUES (?, ?, ?, ?)`,
    [interviewerName.trim(), availableFrom, availableTo, createdBy]
  );
  const rows = await query(
    `SELECT availability_id, interviewer_name, available_from, available_to, created_by, created_at
       FROM rec_interviewer_availability WHERE availability_id = ?`,
    [result.insertId]
  );
  return rows[0];
}

async function remove(availabilityId, createdBy) {
  const result = await query(
    'DELETE FROM rec_interviewer_availability WHERE availability_id = ? AND created_by = ?',
    [availabilityId, createdBy]
  );
  return result.affectedRows > 0;
}

async function createWeekly({ interviewerName, weekday, availableFrom, availableTo, effectiveFrom, effectiveTo, createdBy }) {
  const result = await query(
    `INSERT INTO rec_interviewer_weekly_availability
       (interviewer_name, weekday, available_from, available_to, effective_from, effective_to, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [interviewerName.trim(), weekday, availableFrom, availableTo, effectiveFrom, effectiveTo || null, createdBy]
  );
  const rows = await query(
    `SELECT weekly_availability_id, interviewer_name, weekday, available_from, available_to,
            effective_from, effective_to, created_by, created_at
       FROM rec_interviewer_weekly_availability WHERE weekly_availability_id = ?`,
    [result.insertId]
  );
  return { ...rows[0], availability_id: result.insertId, availability_kind: 'weekly' };
}

async function removeWeekly(availabilityId, createdBy) {
  const result = await query(
    'DELETE FROM rec_interviewer_weekly_availability WHERE weekly_availability_id = ? AND created_by = ?',
    [availabilityId, createdBy]
  );
  return result.affectedRows > 0;
}

module.exports = { assertSlotAvailable, list, create, remove, createWeekly, removeWeekly };
