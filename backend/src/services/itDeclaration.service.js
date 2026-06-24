const path = require('path');
const fs   = require('fs');
const { query } = require('../config/db');
const ApiError  = require('../utils/ApiError');

/* ── Cycle ───────────────────────────────────────────────────────────────── */
async function getLatestCycle() {
  const [row] = await query(
    `SELECT c.*, CONCAT(e.first_name,' ',e.last_name) AS created_by_name
     FROM it_declaration_cycles c
     LEFT JOIN employees e ON e.employee_id = c.created_by
     ORDER BY c.cycle_id DESC LIMIT 1`
  );
  return row || null;
}

async function getAllCycles() {
  return query(`SELECT * FROM it_declaration_cycles ORDER BY cycle_id DESC`);
}

async function createCycle(adminEmployeeId, { fy_label, fy_start_year, start_date, end_date }) {
  if (!fy_label || !fy_start_year) throw ApiError.badRequest('fy_label and fy_start_year are required');
  const result = await query(
    `INSERT INTO it_declaration_cycles (fy_label, fy_start_year, start_date, end_date, created_by)
     VALUES (?,?,?,?,?)`,
    [fy_label, fy_start_year, start_date || null, end_date || null, adminEmployeeId]
  );
  const [row] = await query(`SELECT * FROM it_declaration_cycles WHERE cycle_id=?`, [result.insertId]);
  return row;
}

async function updateCycle(cycleId, data) {
  const fields = [];
  const vals   = [];
  ['fy_label','start_date','end_date'].forEach(k => {
    if (data[k] !== undefined) { fields.push(`${k}=?`); vals.push(data[k]); }
  });
  if (!fields.length) throw ApiError.badRequest('Nothing to update');
  vals.push(cycleId);
  await query(`UPDATE it_declaration_cycles SET ${fields.join(',')} WHERE cycle_id=?`, vals);
  const [row] = await query(`SELECT * FROM it_declaration_cycles WHERE cycle_id=?`, [cycleId]);
  return row;
}

async function toggleCycleStatus(cycleId, adminEmployeeId) {
  const [cycle] = await query(`SELECT * FROM it_declaration_cycles WHERE cycle_id=?`, [cycleId]);
  if (!cycle) throw ApiError.notFound('Cycle not found');
  // deactivate all others first
  await query(`UPDATE it_declaration_cycles SET status='inactive'`);
  const newStatus = cycle.status === 'active' ? 'inactive' : 'active';
  await query(
    `UPDATE it_declaration_cycles SET status=?, created_by=? WHERE cycle_id=?`,
    [newStatus, adminEmployeeId, cycleId]
  );
  const [row] = await query(`SELECT * FROM it_declaration_cycles WHERE cycle_id=?`, [cycleId]);
  return row;
}

/* ── Employee Declaration ─────────────────────────────────────────────────── */
async function getOrCreateDeclaration(employeeId, cycleId) {
  let [decl] = await query(
    `SELECT * FROM it_declarations WHERE employee_id=? AND cycle_id=?`,
    [employeeId, cycleId]
  );
  if (!decl) {
    const r = await query(
      `INSERT INTO it_declarations (cycle_id, employee_id) VALUES (?,?)`,
      [cycleId, employeeId]
    );
    [decl] = await query(`SELECT * FROM it_declarations WHERE declaration_id=?`, [r.insertId]);
  }
  return decl;
}

async function getMyDeclaration(employeeId) {
  const cycle = await getLatestCycle();
  if (!cycle) return { cycle: null, declaration: null, items: [] };

  let [decl] = await query(
    `SELECT * FROM it_declarations WHERE employee_id=? AND cycle_id=?`,
    [employeeId, cycle.cycle_id]
  );
  const items = decl
    ? await query(`SELECT * FROM it_declaration_items WHERE declaration_id=?`, [decl.declaration_id])
    : [];

  return { cycle, declaration: decl || null, items };
}

async function saveMyDeclaration(employeeId, { items, submit }) {
  const cycle = await getLatestCycle();
  if (!cycle) throw ApiError.notFound('No IT declaration cycle found');
  if (cycle.status !== 'active') throw ApiError.badRequest('IT Declaration cycle is not active');

  const decl = await getOrCreateDeclaration(employeeId, cycle.cycle_id);
  if (decl.status === 'submitted' || decl.status === 'approved') {
    throw ApiError.badRequest('Declaration already submitted');
  }

  // Replace items
  await query(`DELETE FROM it_declaration_items WHERE declaration_id=?`, [decl.declaration_id]);
  let total = 0;
  if (Array.isArray(items) && items.length) {
    for (const it of items) {
      const amt = Number(it.declared_amount) || 0;
      if (amt > 0) {
        await query(
          `INSERT INTO it_declaration_items (declaration_id, section_key, section_label, sub_label, declared_amount)
           VALUES (?,?,?,?,?)`,
          [decl.declaration_id, it.section_key, it.section_label, it.sub_label || null, amt]
        );
        total += amt;
      }
    }
  }

  const newStatus  = submit ? 'submitted' : 'draft';
  const submittedAt = submit ? new Date() : null;
  await query(
    `UPDATE it_declarations SET status=?, total_declared=?, submitted_at=?, admin_remarks=NULL WHERE declaration_id=?`,
    [newStatus, total, submittedAt, decl.declaration_id]
  );

  return getMyDeclaration(employeeId);
}

/* ── Proof of Investment ──────────────────────────────────────────────────── */
async function getMyProofs(employeeId) {
  const cycle = await getLatestCycle();
  if (!cycle) return [];
  const [decl] = await query(
    `SELECT * FROM it_declarations WHERE employee_id=? AND cycle_id=?`,
    [employeeId, cycle.cycle_id]
  );
  if (!decl) return [];
  return query(
    `SELECT p.*, CONCAT(e.first_name,' ',e.last_name) AS reviewed_by_name
     FROM it_proof_documents p
     LEFT JOIN employees e ON e.employee_id = p.reviewed_by
     WHERE p.declaration_id=? ORDER BY p.uploaded_at DESC`,
    [decl.declaration_id]
  );
}

async function uploadProof(employeeId, { investment_type, section_key, declared_amount, actual_amount }, file) {
  const cycle = await getLatestCycle();
  if (!cycle) throw ApiError.notFound('No IT declaration cycle');
  if (cycle.status !== 'active') throw ApiError.badRequest('IT Declaration cycle is not active');

  const decl = await getOrCreateDeclaration(employeeId, cycle.cycle_id);

  const result = await query(
    `INSERT INTO it_proof_documents
       (declaration_id, employee_id, investment_type, section_key, declared_amount, actual_amount, file_name, file_path)
     VALUES (?,?,?,?,?,?,?,?)`,
    [
      decl.declaration_id, employeeId, investment_type,
      section_key || null,
      Number(declared_amount) || 0,
      Number(actual_amount) || 0,
      file ? file.originalname : null,
      file ? file.filename     : null,
    ]
  );
  const [row] = await query(`SELECT * FROM it_proof_documents WHERE proof_id=?`, [result.insertId]);
  return row;
}

async function deleteMyProof(employeeId, proofId) {
  const [proof] = await query(
    `SELECT p.* FROM it_proof_documents p WHERE p.proof_id=? AND p.employee_id=?`,
    [proofId, employeeId]
  );
  if (!proof) throw ApiError.notFound('Proof not found');
  if (proof.status !== 'pending') throw ApiError.badRequest('Only pending proofs can be deleted');

  if (proof.file_path) {
    const { upload: uploadConfig } = require('../config/env');
    const filePath = path.resolve(process.cwd(), uploadConfig.dir, proof.file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  await query(`DELETE FROM it_proof_documents WHERE proof_id=?`, [proofId]);
  return { deleted: true };
}

/* ── Admin ────────────────────────────────────────────────────────────────── */
async function getAllDeclarations({ cycleId, status, search } = {}) {
  const cycle = cycleId
    ? (await query(`SELECT * FROM it_declaration_cycles WHERE cycle_id=?`, [cycleId]))[0]
    : await getLatestCycle();

  // All employees
  const employees = await query(
    `SELECT e.employee_id, e.emp_code,
            CONCAT(e.first_name,' ',e.last_name) AS employee_name,
            e.email, e.emp_job_title AS job_title, d.department_name
     FROM employees e
     LEFT JOIN departments d ON d.department_id = e.department_id
     ORDER BY e.first_name, e.last_name`
  );

  if (!cycle) return { cycle: null, declarations: employees.map(e => ({ ...e, declaration: null, items: [], proofs: [] })) };

  const decls = await query(
    `SELECT d.*,
            CONCAT(rev.first_name,' ',rev.last_name) AS reviewed_by_name
     FROM it_declarations d
     LEFT JOIN employees rev ON rev.employee_id = d.reviewed_by
     WHERE d.cycle_id=?`,
    [cycle.cycle_id]
  );
  const declMap = {};
  decls.forEach(d => { declMap[d.employee_id] = d; });

  // Items + proofs per declaration
  const declIds = decls.map(d => d.declaration_id).filter(Boolean);
  let itemMap = {}, proofMap = {};
  if (declIds.length) {
    const items = await query(
      `SELECT * FROM it_declaration_items WHERE declaration_id IN (${declIds.map(()=>'?').join(',')})`,
      declIds
    );
    items.forEach(i => { if (!itemMap[i.declaration_id]) itemMap[i.declaration_id] = []; itemMap[i.declaration_id].push(i); });

    const proofs = await query(
      `SELECT * FROM it_proof_documents WHERE declaration_id IN (${declIds.map(()=>'?').join(',')})`,
      declIds
    );
    proofs.forEach(p => { if (!proofMap[p.declaration_id]) proofMap[p.declaration_id] = []; proofMap[p.declaration_id].push(p); });
  }

  let list = employees.map(emp => {
    const decl = declMap[emp.employee_id] || null;
    return {
      ...emp,
      declaration: decl,
      items:  decl ? (itemMap[decl.declaration_id]  || []) : [],
      proofs: decl ? (proofMap[decl.declaration_id] || []) : [],
    };
  });

  if (status && status !== 'all') {
    list = list.filter(r => (r.declaration?.status || 'not_started') === status);
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(r =>
      r.employee_name?.toLowerCase().includes(q) ||
      r.emp_code?.toLowerCase().includes(q) ||
      r.department_name?.toLowerCase().includes(q)
    );
  }

  return { cycle, declarations: list };
}

async function reviewDeclaration(adminEmployeeId, declarationId, { status, admin_remarks }) {
  if (!['approved','rejected'].includes(status)) throw ApiError.badRequest('Invalid status');
  await query(
    `UPDATE it_declarations SET status=?, admin_remarks=?, reviewed_by=?, reviewed_at=NOW() WHERE declaration_id=?`,
    [status, admin_remarks || null, adminEmployeeId, declarationId]
  );
  const [row] = await query(`SELECT * FROM it_declarations WHERE declaration_id=?`, [declarationId]);
  return row;
}

async function reviewProof(adminEmployeeId, proofId, { status, admin_remarks }) {
  if (!['verified','rejected'].includes(status)) throw ApiError.badRequest('Invalid status');
  await query(
    `UPDATE it_proof_documents SET status=?, admin_remarks=?, reviewed_by=?, reviewed_at=NOW() WHERE proof_id=?`,
    [status, admin_remarks || null, adminEmployeeId, proofId]
  );
  const [row] = await query(`SELECT * FROM it_proof_documents WHERE proof_id=?`, [proofId]);
  return row;
}

async function getProofFile(proofId, employeeId, isAdmin) {
  const where = isAdmin ? `proof_id=?` : `proof_id=? AND employee_id=?`;
  const params = isAdmin ? [proofId] : [proofId, employeeId];
  const [proof] = await query(`SELECT * FROM it_proof_documents WHERE ${where}`, params);
  if (!proof || !proof.file_path) throw ApiError.notFound('File not found');
  const { upload: uploadConfig } = require('../config/env');
  const filePath = path.resolve(process.cwd(), uploadConfig.dir, proof.file_path);
  if (!fs.existsSync(filePath)) throw ApiError.notFound('File not found on disk');
  return { filePath, fileName: proof.file_name || proof.file_path };
}

module.exports = {
  getLatestCycle, getAllCycles, createCycle, updateCycle, toggleCycleStatus,
  getMyDeclaration, saveMyDeclaration,
  getMyProofs, uploadProof, deleteMyProof,
  getAllDeclarations, reviewDeclaration, reviewProof, getProofFile,
};
