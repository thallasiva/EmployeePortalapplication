const BaseService = require('./base.service');
const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');

const LIST_SELECT = `
  SELECT t.*, d.department_name,
         CONCAT(le.first_name, ' ', IFNULL(le.last_name, '')) AS lead_name,
         (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.team_id) AS member_count
    FROM teams t
    LEFT JOIN departments d ON d.department_id = t.department_id
    LEFT JOIN employees le ON le.employee_id = t.lead_employee_id
`;

const MEMBER_SELECT = `
  SELECT tm.id, tm.team_id, tm.employee_id, tm.title, tm.is_lead, tm.created_at,
         e.emp_code, e.first_name, e.last_name, e.email, e.profile_photo,
         d.department_name, des.designation_name
    FROM team_members tm
    JOIN employees e ON e.employee_id = tm.employee_id
    LEFT JOIN departments d ON d.department_id = e.department_id
    LEFT JOIN designations des ON des.designation_id = e.designation_id
   WHERE tm.team_id = ?
   ORDER BY tm.is_lead DESC, e.first_name ASC
`;

class TeamService extends BaseService {
  constructor() {
    super('teams', 'team_id', ['team_name', 'department_id', 'description', 'lead_employee_id']);
  }

  async list({ department_id, search, limit, offset } = {}) {
    let sql = LIST_SELECT;
    const where = [];
    const params = [];

    if (department_id) {
      where.push('t.department_id = ?');
      params.push(department_id);
    }
    if (search) {
      where.push('t.team_name LIKE ?');
      params.push(`%${search}%`);
    }
    if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
    sql += ' ORDER BY t.team_name ASC';
    if (limit !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset || 0));
    }
    return query(sql, params);
  }

  async countAll({ department_id, search } = {}) {
    let sql = 'SELECT COUNT(*) AS total FROM teams t';
    const where = [];
    const params = [];
    if (department_id) {
      where.push('t.department_id = ?');
      params.push(department_id);
    }
    if (search) {
      where.push('t.team_name LIKE ?');
      params.push(`%${search}%`);
    }
    if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
    const rows = await query(sql, params);
    return rows[0].total;
  }

  async getTeamDetails(teamId) {
    const rows = await query(`${LIST_SELECT} WHERE t.team_id = ?`, [teamId]);
    if (!rows.length) return null;
    const members = await query(MEMBER_SELECT, [teamId]);
    return { ...rows[0], members };
  }

  async listMembers(teamId) {
    const exists = await this.existsById(teamId);
    if (!exists) throw ApiError.notFound('Team not found');
    return query(MEMBER_SELECT, [teamId]);
  }

  async addMember(teamId, { employee_id, title, is_lead }) {
    const team = await this.existsById(teamId);
    if (!team) throw ApiError.notFound('Team not found');

    const emp = await query('SELECT employee_id FROM employees WHERE employee_id = ?', [employee_id]);
    if (!emp.length) throw ApiError.notFound('Employee not found');

    await query(
      `INSERT INTO team_members (team_id, employee_id, title, is_lead)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title = ?, is_lead = ?`,
      [teamId, employee_id, title || null, is_lead ? 1 : 0, title || null, is_lead ? 1 : 0]
    );

    if (is_lead) {
      await query('UPDATE teams SET lead_employee_id = ? WHERE team_id = ?', [employee_id, teamId]);
    }

    return this.getTeamDetails(teamId);
  }

  async updateMember(teamId, employeeId, { title, is_lead }) {
    const rows = await query('SELECT id FROM team_members WHERE team_id = ? AND employee_id = ?', [teamId, employeeId]);
    if (!rows.length) throw ApiError.notFound('Team member not found');

    const fields = [];
    const params = [];
    if (title !== undefined) {
      fields.push('title = ?');
      params.push(title);
    }
    if (is_lead !== undefined) {
      fields.push('is_lead = ?');
      params.push(is_lead ? 1 : 0);
    }
    if (fields.length) {
      params.push(teamId, employeeId);
      await query(`UPDATE team_members SET ${fields.join(', ')} WHERE team_id = ? AND employee_id = ?`, params);
    }

    if (is_lead) {
      await query('UPDATE teams SET lead_employee_id = ? WHERE team_id = ?', [employeeId, teamId]);
    }

    return this.getTeamDetails(teamId);
  }

  async removeMember(teamId, employeeId) {
    const rows = await query('SELECT id FROM team_members WHERE team_id = ? AND employee_id = ?', [teamId, employeeId]);
    if (!rows.length) throw ApiError.notFound('Team member not found');

    await query('DELETE FROM team_members WHERE team_id = ? AND employee_id = ?', [teamId, employeeId]);
    await query('UPDATE teams SET lead_employee_id = NULL WHERE team_id = ? AND lead_employee_id = ?', [teamId, employeeId]);

    return this.getTeamDetails(teamId);
  }
}

module.exports = new TeamService();
