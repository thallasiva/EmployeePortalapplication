/**
 * seed-hierarchy.js
 * ──────────────────
 * 1. Reads existing designations + departments from your DB
 * 2. Updates existing 20 employees with proper reporting_to chains
 * 3. If fewer than 3 levels exist, inserts extra employees to complete the tree
 *
 * Run: node seed-hierarchy.js
 */
'use strict';
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT || 3306),
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'hrms_db',
});

/* ── Seniority keywords → rank (higher = more senior) ── */
function rankDesig(name = '') {
  const n = name.toLowerCase();
  if (/ceo|chief executive|president|founder|managing director/.test(n)) return 6;
  if (/cto|cfo|coo|cpo|chief/.test(n))                                   return 5;
  if (/vp|vice president|director/.test(n))                               return 4;
  if (/head|manager|lead/.test(n))                                         return 3;
  if (/senior|sr\.|principal|specialist/.test(n))                          return 2;
  return 1; // junior / associate / engineer / analyst / default
}

async function main() {
  const conn = await pool.getConnection();
  try {
    /* ── 1. Load existing designations + departments ── */
    const [designations] = await conn.query(
      `SELECT designation_id, designation_name FROM designations ORDER BY designation_id`
    );
    const [departments] = await conn.query(
      `SELECT department_id, department_name FROM departments ORDER BY department_id`
    );

    if (!designations.length || !departments.length) {
      console.error('❌  No designations or departments found. Add them first.');
      return;
    }

    console.log(`\nDesignations (${designations.length}):`, designations.map(d => d.designation_name).join(', '));
    console.log(`Departments  (${departments.length}):`, departments.map(d => d.department_name).join(', '));

    /* Rank each designation */
    designations.forEach(d => d._rank = rankDesig(d.designation_name));
    designations.sort((a, b) => b._rank - a._rank || a.designation_id - b.designation_id);

    /* Pick top designation (CEO/Director level) */
    const topDesig  = designations[0];
    const midDesigs = designations.filter(d => d._rank >= 3 && d._rank < topDesig._rank);
    const lowDesigs = designations.filter(d => d._rank < 3);

    /* Fallbacks if keywords didn't match */
    const midPool = midDesigs.length ? midDesigs : [designations[Math.floor(designations.length / 2)] || designations[0]];
    const lowPool = lowDesigs.length ? lowDesigs : [designations[designations.length - 1] || designations[0]];

    /* ── 2. Load all active employees ── */
    const [employees] = await conn.query(`
      SELECT e.employee_id, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS name,
             e.designation_id, e.department_id, e.reporting_to,
             d.designation_name
        FROM employees e
        LEFT JOIN designations d ON d.designation_id = e.designation_id
       WHERE e.employee_status = 'Active'
       ORDER BY e.employee_id
    `);

    console.log(`\nActive employees: ${employees.length}`);
    employees.forEach(e => e._rank = rankDesig(e.designation_name));

    /* Group by rank */
    const topEmps = employees.filter(e => e._rank >= 5);
    const midEmps = employees.filter(e => e._rank >= 3 && e._rank < 5);
    const lowEmps = employees.filter(e => e._rank < 3);

    /* ── 3. Insert filler employees if hierarchy levels are thin ── */
    const hash = await bcrypt.hash('Password@123', 10);
    let nextCode = 1000 + employees.length;

    async function insertEmployee({ first_name, last_name, designation_id, department_id, email }) {
      nextCode++;
      const code = `EMP${nextCode}`;
      const [r] = await conn.query(`
        INSERT INTO employees
          (emp_code, first_name, last_name, email, phone, password, designation_id, department_id,
           employee_status, employee_type, emp_joining_date)
        VALUES (?, ?, ?, ?, '9000000000', ?, ?, ?, 'Active', 'Full-time', CURDATE())
      `, [code, first_name, last_name, email, hash, designation_id, department_id]);
      console.log(`  ➕ Inserted ${first_name} ${last_name} (${code}) as ${designation_id}`);
      return { employee_id: r.insertId, name: `${first_name} ${last_name}`, _rank: rankDesig('') };
    }

    /* Need at least 1 top-level */
    if (!topEmps.length) {
      const dept = departments[0];
      const e = await insertEmployee({
        first_name: 'Rajesh', last_name: 'Kumar',
        designation_id: topDesig.designation_id, department_id: dept.department_id,
        email: `rajesh.kumar.ceo@company.com`,
      });
      e._rank = 6;
      topEmps.push(e);
    }

    /* Need at least 3 mid-level managers (one per main dept) */
    const deptSlice = departments.slice(0, Math.min(4, departments.length));
    for (let i = midEmps.length; i < 3; i++) {
      const dept = deptSlice[i % deptSlice.length];
      const desig = midPool[i % midPool.length];
      const names = [
        { f: 'Priya',    l: 'Sharma'    },
        { f: 'Anil',     l: 'Verma'     },
        { f: 'Sneha',    l: 'Pillai'    },
        { f: 'Vikram',   l: 'Nair'      },
      ];
      const nm = names[i % names.length];
      const e = await insertEmployee({
        first_name: nm.f, last_name: nm.l,
        designation_id: desig.designation_id, department_id: dept.department_id,
        email: `${nm.f.toLowerCase()}.${nm.l.toLowerCase()}.mgr${i}@company.com`,
      });
      e._rank = 3;
      midEmps.push(e);
    }

    /* Need at least 5 junior employees */
    const juniorNames = [
      { f: 'Amit',      l: 'Joshi'     },
      { f: 'Deepa',     l: 'Menon'     },
      { f: 'Karthik',   l: 'Rao'       },
      { f: 'Pooja',     l: 'Singh'     },
      { f: 'Rahul',     l: 'Das'       },
      { f: 'Meena',     l: 'Iyer'      },
    ];
    for (let i = lowEmps.length; i < 5; i++) {
      const dept = deptSlice[i % deptSlice.length];
      const desig = lowPool[i % lowPool.length];
      const nm = juniorNames[i % juniorNames.length];
      const e = await insertEmployee({
        first_name: nm.f, last_name: nm.l,
        designation_id: desig.designation_id, department_id: dept.department_id,
        email: `${nm.f.toLowerCase()}.${nm.l.toLowerCase()}.jr${i}@company.com`,
      });
      e._rank = 1;
      lowEmps.push(e);
    }

    /* ── 4. Re-fetch all employees after inserts ── */
    const [allEmp] = await conn.query(`
      SELECT e.employee_id, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS name,
             e.designation_id, e.department_id, e.reporting_to,
             d.designation_name
        FROM employees e
        LEFT JOIN designations d ON d.designation_id = e.designation_id
       WHERE e.employee_status = 'Active'
       ORDER BY e.employee_id
    `);
    allEmp.forEach(e => e._rank = rankDesig(e.designation_name));
    allEmp.sort((a, b) => b._rank - a._rank || a.employee_id - b.employee_id);

    /* ── 5. Assign reporting_to ── */
    const ceo = allEmp[0]; // most senior
    console.log(`\nCEO/Top: ${ceo.name} (${ceo.designation_name})`);

    let updated = 0;
    for (const emp of allEmp) {
      if (emp.employee_id === ceo.employee_id) {
        // CEO reports to nobody
        if (emp.reporting_to !== null) {
          await conn.query(`UPDATE employees SET reporting_to = NULL WHERE employee_id = ?`, [emp.employee_id]);
        }
        continue;
      }

      // Find best manager: closest higher rank, prefer same department
      let manager = null;
      const higherRanked = allEmp.filter(e => e._rank > emp._rank && e.employee_id !== emp.employee_id);
      if (higherRanked.length) {
        // prefer same dept
        const sameDept = higherRanked.filter(e => e.department_id === emp.department_id);
        // pick the *lowest* rank among seniors (direct line manager, not skip-level)
        const minHigherRank = Math.min(...higherRanked.map(e => e._rank));
        const directLine = higherRanked.filter(e => e._rank === minHigherRank);
        const sameDeptDirect = directLine.filter(e => e.department_id === emp.department_id);

        manager = sameDeptDirect[0] || directLine[0] || sameDept[0] || higherRanked[0];
      }
      if (!manager) manager = ceo;

      if (emp.reporting_to !== manager.employee_id) {
        await conn.query(
          `UPDATE employees SET reporting_to = ? WHERE employee_id = ?`,
          [manager.employee_id, emp.employee_id]
        );
        // log to reporting_history
        await conn.query(
          `INSERT INTO reporting_history (employee_id, old_manager_id, new_manager_id, changed_by, reason, change_type)
           VALUES (?, ?, ?, ?, 'Hierarchy seed', 'assign')
           ON DUPLICATE KEY UPDATE new_manager_id = VALUES(new_manager_id)`,
          [emp.employee_id, emp.reporting_to || null, manager.employee_id, ceo.employee_id]
        ).catch(() => {});
        console.log(`  ✔ ${emp.name.padEnd(25)} → ${manager.name} (${manager.designation_name})`);
        updated++;
      }
    }

    console.log(`\n🎉 Done! ${updated} employees updated. Refresh Workflow Delegation page.\n`);
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
