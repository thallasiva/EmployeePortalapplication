'use strict';

const { query } = require('../../config/db');

async function list(candidateId) {
  return query(
    `SELECT f.followup_id, f.candidate_id, f.assigned_to, f.due_at, f.note,
            f.status, f.created_by, f.created_at, f.completed_at,
            CONCAT_WS(' ', e.first_name, e.last_name) AS assignee_name
       FROM rec_candidate_followups f
       JOIN employees e ON e.employee_id = f.assigned_to
      WHERE f.candidate_id = ?
      ORDER BY CASE WHEN f.status = 'open' THEN 0 ELSE 1 END, f.due_at ASC`,
    [candidateId]
  );
}

async function create({ candidateId, assignedTo, dueAt, note, createdBy, ip }) {
  const result = await query(
    `INSERT INTO rec_candidate_followups
       (candidate_id, assigned_to, due_at, note, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [candidateId, assignedTo, dueAt, note.trim(), createdBy]
  );
  await query(
    `INSERT INTO rec_audit_log
       (entity_type, entity_id, action, new_value, performed_by, ip_address)
     VALUES ('candidate', ?, 'followup_created', JSON_OBJECT('followup_id', ?, 'due_at', ?), ?, ?)`,
    [candidateId, result.insertId, dueAt, createdBy, ip || null]
  );
  const rows = await list(candidateId);
  return rows.find((row) => Number(row.followup_id) === Number(result.insertId));
}

async function updateStatus({ candidateId, followupId, status, updatedBy, ip }) {
  const result = await query(
    `UPDATE rec_candidate_followups
        SET status = ?,
            completed_at = CASE WHEN ? = 'completed' THEN NOW() ELSE NULL END,
            reminder_sent_at = CASE WHEN ? = 'open' THEN NULL ELSE reminder_sent_at END
      WHERE candidate_id = ? AND followup_id = ?`,
    [status, status, status, candidateId, followupId]
  );
  if (!result.affectedRows) return null;
  await query(
    `INSERT INTO rec_audit_log
       (entity_type, entity_id, action, new_value, performed_by, ip_address)
     VALUES ('candidate', ?, 'followup_status_changed', JSON_OBJECT('followup_id', ?, 'status', ?), ?, ?)`,
    [candidateId, followupId, status, updatedBy, ip || null]
  );
  const rows = await list(candidateId);
  return rows.find((row) => Number(row.followup_id) === Number(followupId)) || null;
}

module.exports = { list, create, updateStatus };
