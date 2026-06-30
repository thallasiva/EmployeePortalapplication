const BaseService = require('./base.service');
const { callProcedure } = require('../config/db');
const ApiError = require('../utils/ApiError');

class TeamService extends BaseService {
  constructor() {
    super('teams', 'team_id', ['team_name', 'department_id', 'description', 'lead_employee_id']);
  }

  async list({ department_id, search, limit, offset } = {}) {
    const results = await callProcedure(
      'sp_list_teams(?, ?, ?, ?)',
      [
        department_id ?? null,
        search        ? `%${search}%` : null,
        limit != null ? Number(limit)       : null,
        limit != null ? Number(offset || 0) : null,
      ]
    );
    return results[0] ?? [];
  }

  async countAll({ department_id, search } = {}) {
    const results = await callProcedure(
      'sp_count_teams(?, ?)',
      [department_id ?? null, search ? `%${search}%` : null]
    );
    return (results[0] ?? [])[0]?.total ?? 0;
  }

  async getTeamDetails(teamId) {
    const results = await callProcedure('sp_get_team_details(?)', [teamId]);
    if (!(results[0] ?? []).length) return null;
    return { ...results[0][0], members: results[1] ?? [] };
  }

  async listMembers(teamId) {
    const exists = await this.existsById(teamId);
    if (!exists) throw ApiError.notFound('Team not found');
    const results = await callProcedure('sp_get_team_details(?)', [teamId]);
    return results[1] ?? [];
  }

  async addMember(teamId, { employee_id, title, is_lead }) {
    const team = await this.existsById(teamId);
    if (!team) throw ApiError.notFound('Team not found');
    const empCheck = await callProcedure('sp_check_employee_exists(?)', [employee_id]);
    if (!(empCheck[0] ?? []).length) throw ApiError.notFound('Employee not found');
    await callProcedure('sp_add_team_member(?, ?, ?, ?)', [
      teamId, employee_id, title || null, is_lead ? 1 : 0,
    ]);
    return this.getTeamDetails(teamId);
  }

  async updateMember(teamId, employeeId, { title, is_lead }) {
    await callProcedure('sp_update_team_member(?, ?, ?, ?)', [
      teamId, employeeId,
      title    !== undefined ? title    : null,
      is_lead  !== undefined ? (is_lead ? 1 : 0) : null,
    ]);
    return this.getTeamDetails(teamId);
  }

  async removeMember(teamId, employeeId) {
    await callProcedure('sp_remove_team_member(?, ?)', [teamId, employeeId]);
    return this.getTeamDetails(teamId);
  }
}

module.exports = new TeamService();
