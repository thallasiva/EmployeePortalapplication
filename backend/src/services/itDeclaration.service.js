const path = require('path');
const fs = require('fs');
const { query, callProcedure } = require('../config/db');
const ApiError = require('../utils/ApiError');
async function assertEmployeeCompany(employeeId, companyId) {
  const company = Number(companyId);
  if (!Number.isInteger(company) || company <= 0) {
    throw ApiError.forbidden('Company context is required');
  }
  const rows = await query(
    'SELECT 1 FROM employees WHERE employee_id = ? AND company_id = ? LIMIT 1',
    [employeeId, company]
  );
  if (!rows.length) throw ApiError.forbidden('You can only access employee records in your company');
}
async function getLatestCycle() {
  const results = await callProcedure('sp_get_latest_it_cycle()');
  return (results[0] ?? [])[0] ?? null;
}
async function getAllCycles() {
  const results = await callProcedure('sp_get_all_it_cycles()');
  return results[0] ?? [];
}
async function createCycle(adminEmployeeId, { fy_label, fy_start_year, start_date, end_date }) {
  if (!fy_label || !fy_start_year) throw ApiError.badRequest('fy_label and fy_start_year are required');
  const results = await callProcedure('sp_create_it_cycle(?, ?, ?, ?, ?, @cycle_id)', [
  fy_label, fy_start_year, start_date || null, end_date || null, adminEmployeeId]
  );
  return (results[0] ?? [])[0] ?? null;
}
async function updateCycle(cycleId, data) {
  const { fy_label = null, start_date = null, end_date = null } = data;
  if (!fy_label && !start_date && !end_date) throw ApiError.badRequest('Nothing to update');
  const results = await callProcedure('sp_update_it_cycle(?, ?, ?, ?)', [
  cycleId, fy_label ?? null, start_date ?? null, end_date ?? null]
  );
  return (results[0] ?? [])[0] ?? null;
}
async function toggleCycleStatus(cycleId, adminEmployeeId) {
  const results = await callProcedure('sp_toggle_it_cycle_status(?, ?)', [cycleId, adminEmployeeId]);
  return (results[0] ?? [])[0] ?? null;
}
async function getOrCreateDeclaration(employeeId, cycleId) {
  const results = await callProcedure('sp_get_or_create_it_declaration(?, ?, @decl_id)', [
  employeeId, cycleId]
  );
  return (results[0] ?? [])[0] ?? null;
}
async function getMyDeclaration(employeeId, companyId) {
  await assertEmployeeCompany(employeeId, companyId);
  const results = await callProcedure('sp_get_my_it_declaration(?)', [employeeId]);
  const cycle = (results[0] ?? [])[0] ?? null;
  const declaration = (results[1] ?? [])[0] ?? null;
  const items = results[2] ?? [];
  return { cycle, declaration, items };
}
async function saveMyDeclaration(employeeId, { items, submit }, companyId) {
  await assertEmployeeCompany(employeeId, companyId);
  const cycle = await getLatestCycle();
  if (!cycle) throw ApiError.notFound('No IT declaration cycle found');
  if (cycle.status !== 'active') throw ApiError.badRequest('IT Declaration cycle is not active');
  if ((items || []).some((it) => Number(it?.declared_amount) > 0 && !it.section_key)) {
    throw ApiError.badRequest('Each declared item needs a section_key');
  }
  const decl = await getOrCreateDeclaration(employeeId, cycle.cycle_id);
  if (decl.status === 'submitted' || decl.status === 'approved') {
    throw ApiError.badRequest('Declaration already submitted');
  }
  await callProcedure('sp_replace_it_declaration_items(?)', [decl.declaration_id]);
  let total = 0;
  if (Array.isArray(items) && items.length) {
    for (const it of items) {
      const amt = Number(it.declared_amount) || 0;
      if (amt > 0) {
        await callProcedure('sp_insert_it_declaration_item(?, ?, ?, ?, ?)', [
        decl.declaration_id, it.section_key, it.section_label, it.sub_label || null, amt]
        );
        total += amt;
      }
    }
  }
  const newStatus = submit ? 'submitted' : 'draft';
  const submittedAt = submit ? new Date() : null;
  await callProcedure('sp_update_it_declaration_status(?, ?, ?, ?)', [
  decl.declaration_id, newStatus, total, submittedAt]
  );
  return getMyDeclaration(employeeId, companyId);
}
async function getMyProofs(employeeId, companyId) {
  await assertEmployeeCompany(employeeId, companyId);
  const results = await callProcedure('sp_get_my_it_proofs(?)', [employeeId]);
  return results[0] ?? [];
}
async function uploadProof(employeeId, { investment_type, section_key, declared_amount, actual_amount }, file, companyId) {
  await assertEmployeeCompany(employeeId, companyId);
  if (!file) throw ApiError.badRequest('A PDF, JPG, or PNG proof document is required');
  if (!investment_type) throw ApiError.badRequest('Investment type is required');
  const cycle = await getLatestCycle();
  if (!cycle) throw ApiError.notFound('No IT declaration cycle');
  if (cycle.status !== 'active') throw ApiError.badRequest('IT Declaration cycle is not active');
  const decl = await getOrCreateDeclaration(employeeId, cycle.cycle_id);
  const results = await callProcedure('sp_upload_it_proof(?, ?, ?, ?, ?, ?, ?, ?, @proof_id)', [
  decl.declaration_id, employeeId, investment_type,
  section_key || null,
  Number(declared_amount) || 0,
  Number(actual_amount) || 0,
  file ? file.originalname : null,
  file ? file.filename : null]
  );
  return (results[0] ?? [])[0] ?? null;
}
async function deleteMyProof(employeeId, proofId, companyId) {
  await assertEmployeeCompany(employeeId, companyId);
  const proofResults = await callProcedure('sp_get_it_proof(?, ?, ?)', [proofId, employeeId, 0]);
  const proof = (proofResults[0] ?? [])[0] ?? null;
  if (!proof) throw ApiError.notFound('Proof not found');
  if (proof.status !== 'pending') throw ApiError.badRequest('Only pending proofs can be deleted');
  if (proof.file_path) {
    const { upload: uploadConfig } = require('../config/env');
    const filePath = path.resolve(process.cwd(), uploadConfig.dir, proof.file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  await callProcedure('sp_delete_it_proof(?)', [proofId]);
  return { deleted: true };
}
async function getAllDeclarations({ cycleId, status, search, companyId } = {}) {
  const company = Number(companyId);
  if (!Number.isInteger(company) || company <= 0) {
    throw ApiError.forbidden('Company context is required');
  }
  const companyEmployees = await query('SELECT employee_id FROM employees WHERE company_id = ?', [company]);
  const employeeIds = new Set(companyEmployees.map((employee) => Number(employee.employee_id)));
  let cycle;
  if (cycleId) {
    const results = await callProcedure('sp_get_it_declaration_by_id(?)', [cycleId]);
    const cyclesResult = await callProcedure('sp_get_all_it_cycles()');
    cycle = (cyclesResult[0] ?? []).find((c) => c.cycle_id == cycleId) ?? null;
  } else {
    cycle = await getLatestCycle();
  }
  if (!cycle) {
    const empResults = await callProcedure('sp_get_all_it_declarations(NULL)');
    const employees = (empResults[0] ?? []).filter((employee) => employeeIds.has(Number(employee.employee_id)));
    return { cycle: null, declarations: employees.map((e) => ({ ...e, declaration: null, items: [], proofs: [] })) };
  }
  const results = await callProcedure('sp_get_all_it_declarations(?)', [cycle.cycle_id]);
  const employees = (results[0] ?? []).filter((employee) => employeeIds.has(Number(employee.employee_id)));
  const decls = (results[1] ?? []).filter((declaration) => employeeIds.has(Number(declaration.employee_id)));
  const declarationIds = new Set(decls.map((declaration) => Number(declaration.declaration_id)));
  const allItems = (results[2] ?? []).filter((item) => declarationIds.has(Number(item.declaration_id)));
  const allProofs = (results[3] ?? []).filter((proof) => declarationIds.has(Number(proof.declaration_id)));
  const declMap = {};
  decls.forEach((d) => {declMap[d.employee_id] = d;});
  const itemMap = {};
  allItems.forEach((i) => {
    if (!itemMap[i.declaration_id]) itemMap[i.declaration_id] = [];
    itemMap[i.declaration_id].push(i);
  });
  const proofMap = {};
  allProofs.forEach((p) => {
    if (!proofMap[p.declaration_id]) proofMap[p.declaration_id] = [];
    proofMap[p.declaration_id].push(p);
  });
  let list = employees.map((emp) => {
    const decl = declMap[emp.employee_id] || null;
    return {
      ...emp,
      declaration: decl,
      items: decl ? itemMap[decl.declaration_id] || [] : [],
      proofs: decl ? proofMap[decl.declaration_id] || [] : []
    };
  });
  if (status && status !== 'all') {
    list = list.filter((r) => (r.declaration?.status || 'not_started') === status);
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((r) =>
    r.employee_name?.toLowerCase().includes(q) ||
    r.emp_code?.toLowerCase().includes(q) ||
    r.department_name?.toLowerCase().includes(q)
    );
  }
  return { cycle, declarations: list };
}
async function reviewDeclaration(adminEmployeeId, declarationId, { status, admin_remarks }, companyId) {
  if (!['approved', 'rejected'].includes(status)) throw ApiError.badRequest('Invalid status');
  await assertEmployeeCompany(adminEmployeeId, companyId);
  const rows = await query('SELECT employee_id FROM it_declarations WHERE declaration_id = ? LIMIT 1', [declarationId]);
  if (!rows.length) throw ApiError.notFound('Declaration not found');
  await assertEmployeeCompany(rows[0].employee_id, companyId);
  const results = await callProcedure('sp_review_it_declaration(?, ?, ?, ?)', [
  adminEmployeeId, declarationId, status, admin_remarks || null]
  );
  return (results[0] ?? [])[0] ?? null;
}
async function reviewProof(adminEmployeeId, proofId, { status, admin_remarks }, companyId) {
  if (!['verified', 'rejected'].includes(status)) throw ApiError.badRequest('Invalid status');
  await assertEmployeeCompany(adminEmployeeId, companyId);
  const rows = await query('SELECT employee_id FROM it_proof_documents WHERE proof_id = ? LIMIT 1', [proofId]);
  if (!rows.length) throw ApiError.notFound('Proof not found');
  await assertEmployeeCompany(rows[0].employee_id, companyId);
  const results = await callProcedure('sp_review_it_proof(?, ?, ?, ?)', [
  adminEmployeeId, proofId, status, admin_remarks || null]
  );
  return (results[0] ?? [])[0] ?? null;
}
async function getProofFile(proofId, employeeId, isAdmin, companyId) {
  const results = await callProcedure('sp_get_it_proof(?, ?, ?)', [proofId, employeeId ?? null, isAdmin ? 1 : 0]);
  const proof = (results[0] ?? [])[0] ?? null;
  if (!proof || !proof.file_path) throw ApiError.notFound('File not found');
  await assertEmployeeCompany(proof.employee_id, companyId);
  const { upload: uploadConfig } = require('../config/env');
  const filePath = path.resolve(process.cwd(), uploadConfig.dir, proof.file_path);
  if (!fs.existsSync(filePath)) throw ApiError.notFound('File not found on disk');
  return { filePath, fileName: proof.file_name || proof.file_path };
}
module.exports = {
  getLatestCycle, getAllCycles, createCycle, updateCycle, toggleCycleStatus,
  getMyDeclaration, saveMyDeclaration,
  getMyProofs, uploadProof, deleteMyProof,
  getAllDeclarations, reviewDeclaration, reviewProof, getProofFile
};
