const { callProcedure } = require('../config/db');

class OrgHierarchyService {


  async getDashboardStats() {
    const results = await callProcedure('sp_org_dashboard_stats()');
    const totalEmp = Number((results[0] ?? [])[0]?.cnt) || 0;
    const noMgr = Number((results[1] ?? [])[0]?.cnt) || 0;
    const totalMgrs = Number((results[2] ?? [])[0]?.cnt) || 0;
    const delegated = Number((results[3] ?? [])[0]?.cnt) || 0;
    return {
      total_employees: totalEmp,
      without_manager: noMgr,
      total_managers: totalMgrs,
      managers_no_team: Math.max(0, totalEmp - totalMgrs - noMgr),
      delegated_workflows: delegated
    };
  }


  _rankDesig(name = '') {
    const n = name.toLowerCase();
    if (/ceo|chief executive|president|founder|managing director/.test(n)) return 6;
    if (/cto|cfo|coo|cpo|chief/.test(n)) return 5;
    if (/vp|vice president|director/.test(n)) return 4;
    if (/head|manager|lead/.test(n)) return 3;
    if (/senior|sr\.|principal|specialist/.test(n)) return 2;
    return 1;
  }


  async _autoSeedHierarchyIfNeeded() {
    const results = await callProcedure('sp_get_auto_seed_employees()');
    const emps = results[0] ?? [];
    if (emps.length < 2) return;

    emps.forEach((e) => {e._rank = this._rankDesig(e.designation_name);});
    const sorted = [...emps].sort((a, b) => b._rank - a._rank || a.employee_id - b.employee_id);
    const ceo = sorted[0];

    await callProcedure('sp_update_employee_reporting_to(?, ?)', [ceo.employee_id, null]);

    for (const emp of sorted) {
      if (emp.employee_id === ceo.employee_id) continue;
      const higher = sorted.filter((e) => e._rank > emp._rank && e.employee_id !== emp.employee_id);
      let manager;
      if (higher.length) {
        const minRank = Math.min(...higher.map((e) => e._rank));
        const direct = higher.filter((e) => e._rank === minRank);
        const sameDept = direct.filter((e) => e.department_id === emp.department_id);
        manager = sameDept[0] || direct[0];
      } else {
        manager = ceo;
      }
      await callProcedure('sp_update_employee_reporting_to(?, ?)', [emp.employee_id, manager.employee_id]);
    }
  }


  async getHierarchyTree({ department_id, status } = {}) {
    const results = await callProcedure('sp_get_org_tree_data(?, ?)', [department_id ?? null, status ?? null]);
    const rows = results[0] ?? [];
    const delegRows = results[1] ?? [];
    const countRows = results[2] ?? [];

    const delegateMap = {};
    delegRows.forEach((d) => {delegateMap[d.employee_id] = d.delegate_name;});
    const countMap = {};
    countRows.forEach((r) => {countMap[r.reporting_to] = r.cnt;});

    const nodeMap = {};
    rows.forEach((r) => {
      nodeMap[r.employee_id] = {
        id: r.employee_id,
        emp_code: r.emp_code,
        name: r.full_name,
        designation: r.designation_name || '—',
        department: r.department_name || '—',
        department_id: r.department_id,
        email: r.email,
        status: r.employee_status,
        reporting_to: r.reporting_to,
        joining_date: r.emp_joining_date,
        direct_count: countMap[r.employee_id] || 0,
        delegate_name: delegateMap[r.employee_id] || null,
        children: []
      };
    });

    const hasCycle = (startId) => {
      const visited = new Set();
      let cur = startId;
      while (cur) {
        if (visited.has(cur)) return true;
        visited.add(cur);
        cur = nodeMap[cur]?.reporting_to || null;
      }
      return false;
    };

    const roots = [];
    rows.forEach((r) => {
      const node = nodeMap[r.employee_id];
      const mgr = r.reporting_to;
      if (mgr && nodeMap[mgr] && !hasCycle(mgr)) {
        nodeMap[mgr].children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }


  async getUnassigned() {
    const results = await callProcedure('sp_get_unassigned_employees()');
    return results[0] ?? [];
  }


  async getManagers() {
    const results = await callProcedure('sp_get_managers_list()');
    return results[0] ?? [];
  }


  async getManagerDetails(managerId) {
    const results = await callProcedure('sp_get_manager_details(?)', [managerId]);
    const mgr = (results[0] ?? [])[0] ?? null;
    if (!mgr) return null;
    const directReports = results[1] ?? [];
    const indirectReports = results[2] ?? [];
    return {
      ...mgr,
      direct_reports: directReports,
      indirect_reports: indirectReports,
      total_team: directReports.length + indirectReports.length
    };
  }


  async searchEmployee(q, { department_id, designation_id, status } = {}) {
    const like = `%${q}%`;
    const results = await callProcedure('sp_search_employees_org(?, ?, ?, ?)', [
    like, department_id ?? null, designation_id ?? null, status ?? null]
    );
    const rows = results[0] ?? [];
    const allEmp = results[1] ?? [];
    const empMap = {};
    allEmp.forEach((r) => {empMap[r.employee_id] = r;});
    return rows.map((r) => ({ ...r, hierarchy_path: this._buildPath(r.employee_id, empMap) }));
  }

  _buildPath(employeeId, empMap, depth = 0) {
    if (depth > 10) return [];
    const emp = empMap[employeeId];
    if (!emp) return [];
    const parent = emp.reporting_to ? this._buildPath(emp.reporting_to, empMap, depth + 1) : [];
    return [...parent, { id: emp.employee_id, name: emp.full_name }];
  }


  async assignManager(employeeId, newManagerId, changedBy, reason = null) {
    await callProcedure('sp_assign_manager(?, ?, ?, ?)', [employeeId, newManagerId, changedBy, reason]);
    return { updated: true };
  }


  async bulkAssign(employeeIds, newManagerId, changedBy, reason = null) {
    let count = 0;
    for (const empId of employeeIds) {
      try {
        await callProcedure('sp_bulk_assign_manager(?, ?, ?, ?)', [empId, newManagerId, changedBy, reason]);
        count++;
      } catch (_) {}
    }
    return { transferred: count };
  }


  async transferManager(oldManagerId, newManagerId, changedBy, reason = null) {
    const results = await callProcedure('sp_transfer_manager_team(?, ?, ?, ?)', [
    oldManagerId, newManagerId, changedBy, reason]
    );
    const transferred = (results[0] ?? [])[0]?.transferred ?? 0;
    return { transferred };
  }


  async createDelegation({ employee_id, delegate_employee_id, module, from_date, to_date, reason, created_by }) {

    const results = await callProcedure('sp_create_org_delegation(?, ?, ?, ?, ?, ?, ?, @id)', [
    employee_id, delegate_employee_id, module || 'all', from_date, to_date, reason || null, created_by]
    );

    await callProcedure('sp_log_reporting_history(?, ?, ?, ?, ?, ?)', [
    employee_id, employee_id, delegate_employee_id, created_by,
    reason || `Delegated to ${module || 'all'} until ${to_date}`, 'delegation']
    );
    const row = (results[0] ?? [])[0] ?? null;
    return { id: row?.id };
  }


  async listDelegations({ status, employee_id } = {}) {
    const results = await callProcedure('sp_list_org_delegations(?, ?)', [status ?? null, employee_id ?? null]);
    return results[0] ?? [];
  }


  async getHistory({ employee_id, manager_id, change_type, limit = 50, offset = 0 } = {}) {
    const results = await callProcedure('sp_get_org_history(?, ?, ?, ?, ?)', [
    employee_id ?? null,
    manager_id ?? null,
    change_type ?? null,
    Number(limit),
    Number(offset)]
    );
    return { rows: results[0] ?? [], total: (results[1] ?? [])[0]?.total ?? 0 };
  }
}

module.exports = new OrgHierarchyService();
