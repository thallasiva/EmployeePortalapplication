'use strict';
const { query, withTransaction } = require('../config/db');
const ApiError = require('../utils/ApiError');

function requireCompany(companyId) {
  const company = Number(companyId);
  if (!Number.isInteger(company) || company <= 0) throw ApiError.forbidden('Company context is required');
  return company;
}

class TrainingService {
  async listCourses(companyId) {
    const company = requireCompany(companyId);
    return query(
      `SELECT c.*, COUNT(a.assignment_id) AS assigned_count,
              SUM(a.status = 'Completed') AS completed_count
         FROM training_courses c
         LEFT JOIN employee_trainings a ON a.course_id = c.course_id AND a.company_id = c.company_id
        WHERE c.company_id = ?
        GROUP BY c.course_id
        ORDER BY c.is_active DESC, c.title`,
      [company]
    );
  }

  async upsertCourse(id, data, companyId, actorId) {
    const company = requireCompany(companyId);
    if (!data.title?.trim()) throw ApiError.badRequest('Course title is required');
    if (id) {
      const result = await query(
        `UPDATE training_courses SET title = ?, description = ?, category = ?, duration_hours = ?, is_active = COALESCE(?, is_active)
          WHERE course_id = ? AND company_id = ?`,
        [data.title.trim(), data.description || null, data.category || null,
          data.duration_hours ?? null, data.is_active == null ? null : (data.is_active ? 1 : 0), id, company]
      );
      if (!result.affectedRows) throw ApiError.notFound('Training course not found');
      return (await query('SELECT * FROM training_courses WHERE course_id = ? AND company_id = ?', [id, company]))[0];
    }
    const result = await query(
      `INSERT INTO training_courses (company_id, title, description, category, duration_hours, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [company, data.title.trim(), data.description || null, data.category || null, data.duration_hours ?? null, actorId || null]
    );
    return (await query('SELECT * FROM training_courses WHERE course_id = ? AND company_id = ?', [result.insertId, company]))[0];
  }

  async assign(courseId, employeeIds, dueDate, companyId, actorId) {
    const company = requireCompany(companyId);
    if (!Array.isArray(employeeIds) || !employeeIds.length) throw ApiError.badRequest('Select at least one employee');
    const course = await query(
      'SELECT course_id FROM training_courses WHERE course_id = ? AND company_id = ? AND is_active = 1',
      [courseId, company]
    );
    if (!course.length) throw ApiError.notFound('Training course not found');
    const ids = [...new Set(employeeIds.map(Number))];
    await withTransaction(async (connection) => {
      const [employees] = await connection.execute(
        'SELECT employee_id FROM employees WHERE company_id = ? AND employee_status = ? AND employee_id IN (?)',
        [company, 'Active', ids]
      );
      if (employees.length !== ids.length) throw ApiError.badRequest('One or more selected employees are not active members of this company');
      for (const employeeId of ids) {
        await connection.execute(
          `INSERT INTO employee_trainings (company_id, course_id, employee_id, assigned_by, due_date)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE assigned_by = VALUES(assigned_by), due_date = VALUES(due_date),
             status = IF(status = 'Completed', status, 'Assigned')`,
          [company, courseId, employeeId, actorId || null, dueDate || null]
        );
      }
    });
    return this.listAssignments({ courseId, companyId: company });
  }

  async listAssignments({ companyId, courseId = null, employeeId = null }) {
    const company = requireCompany(companyId);
    return query(
      `SELECT a.assignment_id, a.course_id, a.employee_id, a.due_date, a.status, a.completed_at, a.notes,
              c.title, c.category, e.emp_code,
              CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name
         FROM employee_trainings a
         JOIN training_courses c ON c.course_id = a.course_id AND c.company_id = a.company_id
         JOIN employees e ON e.employee_id = a.employee_id AND e.company_id = a.company_id
        WHERE a.company_id = ? AND (? IS NULL OR a.course_id = ?) AND (? IS NULL OR a.employee_id = ?)
        ORDER BY (a.status = 'Completed'), a.due_date, e.first_name`,
      [company, courseId, courseId, employeeId, employeeId]
    );
  }

  async updateOwnStatus(assignmentId, employeeId, companyId, status) {
    const company = requireCompany(companyId);
    if (!['In Progress', 'Completed'].includes(status)) throw ApiError.badRequest('Invalid training status');
    const result = await query(
      `UPDATE employee_trainings SET status = ?, completed_at = IF(? = 'Completed', NOW(), NULL)
        WHERE assignment_id = ? AND employee_id = ? AND company_id = ?`,
      [status, status, assignmentId, employeeId, company]
    );
    if (!result.affectedRows) throw ApiError.notFound('Training assignment not found');
    return (await this.listAssignments({ companyId: company, employeeId })).find((row) => Number(row.assignment_id) === Number(assignmentId));
  }
}
module.exports = new TrainingService();
