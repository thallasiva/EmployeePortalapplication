const { query } = require('../config/db');

const EMP_SELECT = `
  SELECT e.employee_id, e.emp_code, e.first_name, e.last_name, e.email, e.employee_status,
         e.reporting_to, e.emp_joining_date, e.employee_type,
         d.designation_name, dp.department_name, dp.department_id,
         CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS full_name
    FROM employees e
    LEFT JOIN designations d  ON d.designation_id  = e.designation_id
    LEFT JOIN departments  dp ON dp.department_id  = e.department_id
`;

class OrgHierarchyService {

  /* ─────────────────── Dashboard Stats ─────────────────── */
  async getDashboardStats() {
    const [total, unassigned, managers, delegations] = await Promise.all([
      query(`SELECT COUNT(*) AS cnt FROM employees WHERE employee_status = 'Active'`),
      query(`SELECT COUNT(*) AS cnt FROM employees WHERE employee_status = 'Active' AND (reporting_to IS NULL OR reporting_to = 0)`),
      // Distinct employees who have at least one active subordinate (i.e. actual managers)
      query(`SELECT COUNT(DISTINCT reporting_to) AS cnt FROM employees WHERE reporting_to IS NOT NULL AND employee_status = 'Active'`),
      query(`SELECT COUNT(*) AS cnt FROM workflow_delegates WHERE status = 'Active' AND to_date >= CURDATE()`),
    ]);

    const totalEmp   = Number(total[0]?.cnt)       || 0;
    const noMgr      = Number(unassigned[0]?.cnt)  || 0;
    const totalMgrs  = Number(managers[0]?.cnt)    || 0;
    const delegated  = Number(delegations[0]?.cnt) || 0;

    return {
      total_employees:      totalEmp,
      without_manager:      noMgr,
      total_managers:       totalMgrs,
      managers_no_team:     Math.max(0, totalEmp - totalMgrs - noMgr), // employees who aren't managers and have a manager
      delegated_workflows:  delegated,
    };
  }

  /* ─────────────────── Seniority rank helper ─────────────────── */
  _rankDesig(name = '') {
    const n = name.toLowerCase();
    if (/ceo|chief executive|president|founder|managing director/.test(n)) return 6;
    if (/cto|cfo|coo|cpo|chief/.test(n))   return 5;
    if (/vp|vice president|director/.test(n)) return 4;
    if (/head|manager|lead/.test(n))         return 3;
    if (/senior|sr\.|principal|specialist/.test(n)) return 2;
    return 1;
  }

  /* ─────────────────── Auto-seed reporting_to (always re-runs to fix cycles) ── */
  async _autoSeedHierarchyIfNeeded() {
    const emps = await query(`
      SELECT e.employee_id, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS full_name,
             e.department_id, d.designation_name
        FROM employees e
        LEFT JOIN designations d ON d.designation_id = e.designation_id
       WHERE e.employee_status = 'Active'
       ORDER BY e.employee_id
    `);
    if (emps.length < 2) return;

    emps.forEach(e => { e._rank = this._rankDesig(e.designation_name); });

    // Sort: highest rank first, then lowest employee_id (most senior = first)
    const sorted = [...emps].sort((a, b) => b._rank - a._rank || a.employee_id - b.employee_id);
    const ceo = sorted[0];

    // CEO must have NULL reporting_to — no manager
    await query(`UPDATE employees SET reporting_to = NULL WHERE employee_id = ?`, [ceo.employee_id]);

    for (const emp of sorted) {
      if (emp.employee_id === ceo.employee_id) continue;

      const higher = sorted.filter(e => e._rank > emp._rank && e.employee_id !== emp.employee_id);
      let manager;
      if (higher.length) {
        const minRank  = Math.min(...higher.map(e => e._rank));
        const direct   = higher.filter(e => e._rank === minRank);
        const sameDept = direct.filter(e => e.department_id === emp.department_id);
        manager = sameDept[0] || direct[0];
      } else {
        manager = ceo; // no one outranks this person — report to CEO
      }

      await query(`UPDATE employees SET reporting_to = ? WHERE employee_id = ?`,
        [manager.employee_id, emp.employee_id]);
    }
  }

  /* ─────────────────── Full Org Tree ─────────────────── */
  async getHierarchyTree({ department_id, status } = {}) {
    // Always re-seed to fix any circular references in the data
    await this._autoSeedHierarchyIfNeeded();

    const where = ["e.employee_status != 'Terminated'"];
    const params = [];
    if (department_id) { where.push('e.department_id = ?'); params.push(department_id); }
    if (status)        { where.push('e.employee_status = ?'); params.push(status); }

    const rows = await query(
      `${EMP_SELECT} WHERE ${where.join(' AND ')} ORDER BY e.first_name`,
      params
    );

    // Build delegations map — safe even if table doesn't exist yet
    let delegateMap = {};
    try {
      const activeDelegations = await query(
        `SELECT wd.employee_id, CONCAT(d.first_name,' ',IFNULL(d.last_name,'')) AS delegate_name
           FROM workflow_delegates wd
           JOIN employees d ON d.employee_id = wd.delegate_employee_id
          WHERE wd.status = 'Active' AND wd.to_date >= CURDATE()`
      );
      activeDelegations.forEach(d => { delegateMap[d.employee_id] = d.delegate_name; });
    } catch (_) { /* table not yet created — skip */ }

    // Count direct reports
    const countRows = await query(
      `SELECT reporting_to, COUNT(*) AS cnt FROM employees WHERE employee_status != 'Terminated' AND reporting_to IS NOT NULL GROUP BY reporting_to`
    );
    const countMap = {};
    countRows.forEach(r => { countMap[r.reporting_to] = r.cnt; });

    const nodeMap = {};
    rows.forEach(r => {
      nodeMap[r.employee_id] = {
        id:               r.employee_id,
        emp_code:         r.emp_code,
        name:             r.full_name,
        designation:      r.designation_name || '—',
        department:       r.department_name  || '—',
        department_id:    r.department_id,
        email:            r.email,
        status:           r.employee_status,
        reporting_to:     r.reporting_to,
        joining_date:     r.emp_joining_date,
        direct_count:     countMap[r.employee_id] || 0,
        delegate_name:    delegateMap[r.employee_id] || null,
        children:         [],
      };
    });

    // Cycle-safe root detection: walk up chain; if we loop back, treat as root
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
    rows.forEach(r => {
      const node = nodeMap[r.employee_id];
      const mgr  = r.reporting_to;
      if (mgr && nodeMap[mgr] && !hasCycle(mgr)) {
        nodeMap[mgr].children.push(node);
      } else {
        roots.push(node); // no manager, manager not in list, or cycle detected → root
      }
    });

    return roots;
  }

  /* ─────────────────── Unassigned Employees ─────────────────── */
  async getUnassigned() {
    return query(
      `${EMP_SELECT}
        WHERE (e.reporting_to IS NULL OR e.reporting_to = 0)
          AND e.employee_status = 'Active'
        ORDER BY e.first_name`
    );
  }

  /* ─────────────────── Managers List ─────────────────── */
  async getManagers() {
    // All active employees (any can be assigned as manager)
    // team_count = how many active employees directly report to them
    return query(
      `SELECT mgr.employee_id,
              CONCAT(mgr.first_name,' ',IFNULL(mgr.last_name,'')) AS full_name,
              d.designation_name, dp.department_name,
              (SELECT COUNT(*) FROM employees s WHERE s.reporting_to = mgr.employee_id AND s.employee_status = 'Active') AS team_count
         FROM employees mgr
         LEFT JOIN designations d  ON d.designation_id = mgr.designation_id
         LEFT JOIN departments  dp ON dp.department_id = mgr.department_id
        WHERE mgr.employee_status = 'Active'
        ORDER BY mgr.first_name`
    );
  }

  /* ─────────────────── Manager Details ─────────────────── */
  async getManagerDetails(managerId) {
    const [mgr] = await query(`${EMP_SELECT} WHERE e.employee_id = ?`, [managerId]);
    if (!mgr) return null;

    // Direct reports
    const directReports = await query(
      `${EMP_SELECT} WHERE e.reporting_to = ? AND e.employee_status != 'Terminated'`,
      [managerId]
    );

    // Indirect reports (subordinates of direct reports)
    const indirectIds = directReports.map(r => r.employee_id);
    let indirectReports = [];
    if (indirectIds.length) {
      indirectReports = await query(
        `${EMP_SELECT} WHERE e.reporting_to IN (${indirectIds.map(() => '?').join(',')}) AND e.employee_status != 'Terminated'`,
        indirectIds
      );
    }

    return {
      ...mgr,
      direct_reports:   directReports,
      indirect_reports: indirectReports,
      total_team:       directReports.length + indirectReports.length,
    };
  }

  /* ─────────────────── Employee Search ─────────────────── */
  async searchEmployee(q, { department_id, designation_id, status } = {}) {
    const like = `%${q}%`;
    const where = [
      `(e.first_name LIKE ? OR e.last_name LIKE ? OR e.emp_code LIKE ? OR e.email LIKE ?
        OR CONCAT(e.first_name,' ',e.last_name) LIKE ?)`
    ];
    const params = [like, like, like, like, like];

    if (department_id)  { where.push('e.department_id = ?');  params.push(department_id); }
    if (designation_id) { where.push('e.designation_id = ?'); params.push(designation_id); }
    if (status)         { where.push('e.employee_status = ?'); params.push(status); }

    const rows = await query(`${EMP_SELECT} WHERE ${where.join(' AND ')} LIMIT 30`, params);

    // Build hierarchy path for each result
    const all = await query(
      `SELECT e.employee_id, e.reporting_to,
              CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS full_name
         FROM employees e`
    );
    const empMap = {};
    all.forEach(r => { empMap[r.employee_id] = r; });

    return rows.map(r => ({
      ...r,
      hierarchy_path: this._buildPath(r.employee_id, empMap),
    }));
  }

  _buildPath(employeeId, empMap, depth = 0) {
    if (depth > 10) return [];
    const emp = empMap[employeeId];
    if (!emp) return [];
    const parent = emp.reporting_to ? this._buildPath(emp.reporting_to, empMap, depth + 1) : [];
    return [...parent, { id: emp.employee_id, name: emp.full_name }];
  }

  /* ─────────────────── Assign Reporting Manager ─────────────────── */
  async assignManager(employeeId, newManagerId, changedBy, reason = null) {
    const [emp] = await query(`SELECT employee_id, reporting_to FROM employees WHERE employee_id = ?`, [employeeId]);
    if (!emp) throw new Error('Employee not found');

    await query(`UPDATE employees SET reporting_to = ? WHERE employee_id = ?`, [newManagerId, employeeId]);

    await query(
      `INSERT INTO reporting_history (employee_id, old_manager_id, new_manager_id, changed_by, reason, change_type)
       VALUES (?, ?, ?, ?, ?, 'assign')`,
      [employeeId, emp.reporting_to || null, newManagerId || null, changedBy, reason]
    );

    return { updated: true };
  }

  /* ─────────────────── Bulk Assign ─────────────────── */
  async bulkAssign(employeeIds, newManagerId, changedBy, reason = null) {
    let count = 0;
    for (const empId of employeeIds) {
      const [emp] = await query(`SELECT employee_id, reporting_to FROM employees WHERE employee_id = ?`, [empId]);
      if (!emp) continue;

      await query(`UPDATE employees SET reporting_to = ? WHERE employee_id = ?`, [newManagerId, empId]);
      await query(
        `INSERT INTO reporting_history (employee_id, old_manager_id, new_manager_id, changed_by, reason, change_type)
         VALUES (?, ?, ?, ?, ?, 'bulk_transfer')`,
        [empId, emp.reporting_to || null, newManagerId || null, changedBy, reason]
      );
      count++;
    }
    return { transferred: count };
  }

  /* ─────────────────── Manager Transfer (all team) ─────────────────── */
  async transferManager(oldManagerId, newManagerId, changedBy, reason = null) {
    const team = await query(
      `SELECT employee_id, reporting_to FROM employees WHERE reporting_to = ? AND employee_status != 'Terminated'`,
      [oldManagerId]
    );

    for (const emp of team) {
      await query(`UPDATE employees SET reporting_to = ? WHERE employee_id = ?`, [newManagerId, emp.employee_id]);
      await query(
        `INSERT INTO reporting_history (employee_id, old_manager_id, new_manager_id, changed_by, reason, change_type)
         VALUES (?, ?, ?, ?, ?, 'transfer')`,
        [emp.employee_id, oldManagerId, newManagerId, changedBy, reason]
      );
    }

    return { transferred: team.length };
  }

  /* ─────────────────── Create Delegation ─────────────────── */
  async createDelegation({ employee_id, delegate_employee_id, module, from_date, to_date, reason, created_by }) {
    // Cancel any overlapping active delegations for this employee
    await query(
      `UPDATE workflow_delegates SET status = 'Cancelled'
        WHERE employee_id = ? AND status = 'Active' AND to_date >= ? AND from_date <= ?`,
      [employee_id, from_date, to_date]
    );

    const result = await query(
      `INSERT INTO workflow_delegates (employee_id, delegate_employee_id, module, from_date, to_date, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Active')`,
      [employee_id, delegate_employee_id, module || 'all', from_date, to_date, reason || null]
    );

    // Log to reporting_history as delegation type
    await query(
      `INSERT INTO reporting_history (employee_id, old_manager_id, new_manager_id, changed_by, reason, change_type)
       VALUES (?, ?, ?, ?, ?, 'delegation')`,
      [employee_id, employee_id, delegate_employee_id, created_by, reason || `Delegated to ${module || 'all'} until ${to_date}`]
    );

    return { id: result.insertId };
  }

  /* ─────────────────── List Delegations ─────────────────── */
  async listDelegations({ status, employee_id } = {}) {
    const where = [];
    const params = [];
    if (status)      { where.push('wd.status = ?');       params.push(status); }
    if (employee_id) { where.push('wd.employee_id = ?');  params.push(employee_id); }

    const sql = `
      SELECT wd.*,
             CONCAT(e.first_name,' ',IFNULL(e.last_name,''))  AS employee_name,
             CONCAT(d.first_name,' ',IFNULL(d.last_name,''))  AS delegate_name,
             de.designation_name AS employee_designation,
             dd.designation_name AS delegate_designation
        FROM workflow_delegates wd
        JOIN employees e ON e.employee_id = wd.employee_id
        JOIN employees d ON d.employee_id = wd.delegate_employee_id
        LEFT JOIN designations de ON de.designation_id = e.designation_id
        LEFT JOIN designations dd ON dd.designation_id = d.designation_id
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY wd.created_at DESC
    `;
    return query(sql, params);
  }

  /* ─────────────────── Audit / Reporting History ─────────────────── */
  async getHistory({ employee_id, manager_id, change_type, limit = 50, offset = 0 } = {}) {
    const where = [];
    const params = [];
    if (employee_id)  { where.push('rh.employee_id = ?');    params.push(employee_id); }
    if (manager_id)   { where.push('(rh.old_manager_id = ? OR rh.new_manager_id = ?)'); params.push(manager_id, manager_id); }
    if (change_type)  { where.push('rh.change_type = ?');    params.push(change_type); }

    const filterParams = [...params];  // capture filter-only params before pushing limit/offset

    const sql = `
      SELECT rh.*,
             CONCAT(emp.first_name,' ',IFNULL(emp.last_name,''))   AS employee_name,
             CONCAT(omgr.first_name,' ',IFNULL(omgr.last_name,'')) AS old_manager_name,
             CONCAT(nmgr.first_name,' ',IFNULL(nmgr.last_name,'')) AS new_manager_name,
             CONCAT(cb.first_name,' ',IFNULL(cb.last_name,''))     AS changed_by_name
        FROM reporting_history rh
        JOIN employees emp  ON emp.employee_id  = rh.employee_id
        LEFT JOIN employees omgr ON omgr.employee_id = rh.old_manager_id
        LEFT JOIN employees nmgr ON nmgr.employee_id = rh.new_manager_id
        LEFT JOIN employees cb   ON cb.employee_id   = rh.changed_by
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY rh.created_at DESC
       LIMIT ? OFFSET ?
    `;
    params.push(Number(limit), Number(offset));

    const rows = await query(sql, params);
    const countRows = await query(
      `SELECT COUNT(*) AS total FROM reporting_history rh ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`,
      filterParams
    );
    return { rows, total: countRows[0]?.total || 0 };
  }
}

module.exports = new OrgHierarchyService();
