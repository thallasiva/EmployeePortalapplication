'use strict';

const crypto = require('crypto');
const { callProcedure } = require('../config/db');
const ApiError = require('../utils/ApiError');

const TOKEN_TTL_DAYS = 30;


function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}
function expiresAt(days = TOKEN_TTL_DAYS) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
function js(arr) {
  if (!arr) return null;
  try {return JSON.stringify(arr);} catch {return null;}
}
function orNull(v) {return v === undefined || v === '' || v === null ? null : v;}


async function createInvitation({ candidateId, offerId, candidateName, candidateEmail, jobTitle }) {
  if (!candidateEmail) throw ApiError.badRequest('Candidate email is required to send joining invitation');
  const token = generateToken();
  const expires = expiresAt();
  const results = await callProcedure(
    'sp_joining_create_invitation(?, ?, ?, ?, ?, ?, ?)',
    [candidateId, offerId, token, candidateName || null, candidateEmail, jobTitle || null, expires]
  );
  return (results[0] ?? [])[0] ?? null;
}


async function verifyToken(token) {
  if (!token) throw ApiError.badRequest('Token is required');
  const results = await callProcedure('sp_joining_verify_token(?)', [token]);
  const row = (results[0] ?? [])[0];
  if (!row) throw ApiError.badRequest('This link is invalid or has expired. Please contact HR.');
  return row;
}


async function saveFormalities(token, data, submit = false) {
  const inv = await verifyToken(token);
  if (['approved', 'rejected'].includes(inv.status)) {
    throw ApiError.badRequest(`This invitation is already ${inv.status}.`);
  }

  const status = submit ? 'submitted' : 'draft';

  const params = [
  inv.id,
  inv.candidate_id,
  status,
  data.handbookAcknowledged ? 1 : 0,
  data.hrPolicyAcknowledged ? 1 : 0,

  orNull(data.fullName),
  orNull(data.dob),
  orNull(data.actualDob),
  orNull(data.panNo),
  orNull(data.fatherName),
  orNull(data.maritalStatus),
  orNull(data.spouseName),
  orNull(data.presentAddress),
  orNull(data.permanentAddress),
  orNull(data.photo_url || data.photoPreview),
  orNull(data.signature_url || data.signaturePreview),
  js(data.education),
  js(data.references),
  orNull(data.joiningDateText),
  orNull(data.designationText),

  orNull(data.bankName),
  orNull(data.accountHolderName),
  orNull(data.accountNumber),
  orNull(data.ifscCode),
  orNull(data.branchDetails),

  orNull(data.tlEmployeeName),
  orNull(data.tlFatherOrHusbandName),
  orNull(data.tlDateOfBirth),
  orNull(data.tlSex),
  orNull(data.tlEmployeeId),
  orNull(data.tlAddress),
  js(data.termLifeNominees),
  orNull(data.tlDeclarationEmployeeName),
  orNull(data.tlDeclarationDate),
  orNull(data.tlPlace),
  orNull(data.tlSignature),

  orNull(data.gratuityEmployeeIntroName),
  orNull(data.gratuitySex),
  orNull(data.gratuityReligion),
  orNull(data.gratuityMaritalStatus),
  orNull(data.gratuityDepartmentBranchSection),
  orNull(data.gratuityEmployeeId),
  orNull(data.gratuityDateOfJoining),
  orNull(data.gratuityPermanentAddress),
  js(data.gratuityNominees),
  js(data.gratuityWitnesses),
  orNull(data.gratuityPlace),
  orNull(data.gratuityDate),
  orNull(data.gratuityEmployeeSignature),
  orNull(data.gratuityEmployeeStatementNameAndAddress),

  orNull(data.insEmployeeName),
  orNull(data.insFatherOrHusbandName),
  orNull(data.insDateOfBirth),
  orNull(data.insSex),
  orNull(data.insEmployeeId),
  orNull(data.insAddress),
  js(data.insNominees),
  orNull(data.insDeclarationEmployeeName),
  orNull(data.insDeclarationDate),
  orNull(data.insSignature),

  orNull(data.pfEmployeeName),
  orNull(data.pfDateOfBirth),
  orNull(data.pfFatherOrSpouseName),
  orNull(data.pfRelationType),
  orNull(data.pfGender),
  orNull(data.pfMaritalStatus),
  orNull(data.pfEmail),
  orNull(data.pfMobileNo),
  orNull(data.pfEpf1952),
  orNull(data.pfEps1995),
  orNull(data.pfUan),
  orNull(data.pfPreviousPf),
  orNull(data.pfInternationalWorker),
  orNull(data.pfEducationalQualification),
  orNull(data.pfSpeciallyAbled),
  orNull(data.pfDisabilityCategory),
  orNull(data.pfBankAccNo),
  orNull(data.pfIfscCode),
  orNull(data.pfAadharNo),
  orNull(data.pfDoHavePan),
  orNull(data.pfPan),
  orNull(data.pfPlace),
  data.pfDeclarationAccepted ? 1 : 0,
  orNull(data.pfEmployeeSignature)];


  const placeholders = params.map(() => '?').join(', ');
  const results = await callProcedure(`sp_joining_save_formalities(${placeholders})`, params);
  const row = (results[0] ?? [])[0] ?? null;


  if (row && (data.aadharDocUrl || data.panDocUrl)) {
    const { pool } = require('../config/db');
    const sets = [];
    const vals = [];
    if (data.aadharDocUrl) {sets.push('aadhar_doc_url = ?');vals.push(data.aadharDocUrl);}
    if (data.panDocUrl) {sets.push('pan_doc_url = ?');vals.push(data.panDocUrl);}
    vals.push(inv.id);
    await pool.execute(
      `UPDATE joining_formalities SET ${sets.join(', ')} WHERE invitation_id = ?`, vals
    );
    if (data.aadharDocUrl) row.aadhar_doc_url = data.aadharDocUrl;
    if (data.panDocUrl) row.pan_doc_url = data.panDocUrl;
  }

  return row;
}






async function getFormByToken(token) {
  if (!token) throw ApiError.badRequest('Token is required');
  const results = await callProcedure('sp_joining_get_form_by_token(?)', [token]);
  return (results[0] ?? [])[0] ?? null;
}


async function list({ status, search, limit = 100, offset = 0 } = {}) {
  const results = await callProcedure(
    'sp_joining_list_pending(?, ?, ?, ?)',
    [status || null, search || null, Number(limit), Number(offset)]
  );
  return { rows: results[0] ?? [], total: (results[1] ?? [])[0]?.total ?? 0 };
}


async function getDetail(invitationId) {
  const results = await callProcedure('sp_joining_get_formality(?)', [invitationId]);
  const row = (results[0] ?? [])[0];
  if (!row) throw ApiError.notFound('Joining formality record not found');
  return row;
}


async function review(invitationId, { decision, remarks, changesFields, reviewedBy, employeeId, designation, reportingTo, department }) {
  const allowed = ['approve', 'request_changes', 'reject'];
  if (!allowed.includes(decision)) throw ApiError.badRequest(`Decision must be one of: ${allowed.join(', ')}`);


  let formData = null;
  try {
    const fRows = await callProcedure('sp_joining_get_formality(?)', [invitationId]);
    formData = (fRows[0] ?? [])[0] ?? null;
  } catch {}

  const results = await callProcedure(
    'sp_joining_review(?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
    invitationId,
    decision,
    reviewedBy,
    remarks || null,
    changesFields || null,
    employeeId || null,
    designation || null,
    reportingTo || null,
    department || null]

  );
  const row = (results[0] ?? [])[0] ?? null;


  if (decision === 'approve' && formData) {
    const { pool } = require('../config/db');
    const conn = await pool.getConnection();



    let empId = row?.employee_id || formData.employee_id || null;
    if (!empId && employeeId) {

      const [empRows] = await conn.execute(
        'SELECT employee_id FROM employees WHERE emp_code = ? LIMIT 1',
        [employeeId]
      );
      empId = empRows[0]?.employee_id || null;
    }

    if (empId) {

      let [catRows] = await conn.execute(
        "SELECT category_id FROM document_categories WHERE category_name = 'Identity Documents' LIMIT 1"
      );
      let categoryId = catRows[0]?.category_id || null;
      if (!categoryId) {
        const [ins] = await conn.execute(
          "INSERT INTO document_categories (category_name) VALUES ('Identity Documents')"
        );
        categoryId = ins.insertId;
      }

      const docsToCreate = [
      { title: 'Aadhaar Card', url: formData.aadhar_doc_url },
      { title: 'PAN Card', url: formData.pan_doc_url }].
      filter((d) => d.url);

      for (const doc of docsToCreate) {
        const ext = (doc.url.split('.').pop() || 'pdf').toUpperCase();
        await conn.execute(
          `INSERT INTO documents (title, category_id, file_type, file_size, file_url, visibility, employee_id, uploaded_by)
           VALUES (?, ?, ?, ?, ?, 'employee', ?, ?)
           ON DUPLICATE KEY UPDATE file_url = VALUES(file_url)`,
          [doc.title, categoryId, ext, '', doc.url, empId, reviewedBy || null]
        ).catch(() => {});
      }


      if (formData.bank_name || formData.account_number) {
        await conn.execute(
          'CALL sp_upsert_bank_details(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
          empId,
          formData.bank_name || null,
          formData.account_number || null,
          formData.ifsc_code || null,
          formData.pan_no || null,
          formData.pf_uan || null,
          null,
          formData.branch_details || null,
          null,
          formData.account_holder_name || null,
          null]

        ).catch((e) => console.error('[joining.review] sp_upsert_bank_details failed:', e.message));
      }
    }
  }

  return row;
}






async function getMyJoiningDocs(employeeId) {
  const { pool } = require('../config/db');
  const [rows] = await pool.execute(
    `SELECT jf.aadhar_doc_url, jf.pan_doc_url,
            jf.handbook_acknowledged, jf.privacy_policy_accepted,
            jf.status, jf.reviewed_at, jf.candidate_name
     FROM joining_formalities jf
     JOIN joining_invitations ji ON ji.id = jf.invitation_id
     JOIN employees e ON e.emp_code = jf.admin_employee_id
     WHERE e.employee_id = ?
     ORDER BY jf.updated_at DESC LIMIT 1`,
    [employeeId]
  );
  return rows[0] || null;
}


async function getByOffer(offerId) {
  const results = await callProcedure('sp_joining_get_by_offer(?)', [offerId]);
  return (results[0] ?? [])[0] ?? null;
}


async function getInvitation(invitationId) {
  const results = await callProcedure('sp_joining_get_invitation(?)', [invitationId]);
  const row = (results[0] ?? [])[0];
  if (!row) throw ApiError.notFound('Joining invitation not found');
  return row;
}

module.exports = {
  createInvitation,
  verifyToken,
  getFormByToken,
  saveFormalities,
  list,
  getDetail,
  review,
  getMyJoiningDocs,
  getByOffer,
  getInvitation
};
