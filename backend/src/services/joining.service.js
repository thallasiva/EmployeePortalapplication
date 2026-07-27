'use strict';

const crypto             = require('crypto');
const { callProcedure }  = require('../config/db');
const ApiError           = require('../utils/ApiError');

const TOKEN_TTL_DAYS = 5;

/* ── helpers ──────────────────────────────────────────────────────────────── */
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
  try { return JSON.stringify(arr); } catch { return null; }
}
function orNull(v) { return (v === undefined || v === '' || v === null) ? null : v; }

/* ── createInvitation ─────────────────────────────────────────────────────── */
async function createInvitation({ candidateId, offerId, candidateName, candidateEmail, jobTitle }) {
  if (!candidateEmail) throw ApiError.badRequest('Candidate email is required to send joining invitation');
  const token   = generateToken();
  const expires = expiresAt();
  const results = await callProcedure(
    'sp_joining_create_invitation(?, ?, ?, ?, ?, ?, ?)',
    [candidateId, offerId, token, candidateName || null, candidateEmail, jobTitle || null, expires]
  );
  return (results[0] ?? [])[0] ?? null;
}

/* ── verifyToken ──────────────────────────────────────────────────────────── */
async function verifyToken(token) {
  if (!token) throw ApiError.badRequest('Token is required');
  const results = await callProcedure('sp_joining_verify_token(?)', [token]);
  const row = (results[0] ?? [])[0];
  if (!row) throw ApiError.badRequest('This link is invalid or has expired. Please contact HR.');
  return row;
}

/* ── saveFormalities ──────────────────────────────────────────────────────── */
async function saveFormalities(token, data, submit = false) {
  const inv = await verifyToken(token);
  if (['approved', 'rejected'].includes(inv.status)) {
    throw ApiError.badRequest(`This invitation is already ${inv.status}.`);
  }

  const status = submit ? 'submitted' : 'draft';

  const params = [
    inv.id,                                                   // 1  p_invitation_id
    inv.candidate_id,                                         // 2  p_candidate_id
    status,                                                   // 3  p_status
    data.handbookAcknowledged  ? 1 : 0,                       // 4  p_handbook_ack
    data.hrPolicyAcknowledged  ? 1 : 0,                       // 5  p_hr_policy_ack
    // Personal
    orNull(data.fullName),                                    // 6  p_full_name
    orNull(data.dob),                                         // 7  p_dob
    orNull(data.actualDob),                                   // 8  p_actual_dob
    orNull(data.panNo),                                       // 9  p_pan_no
    orNull(data.fatherName),                                  // 10 p_father_name
    orNull(data.maritalStatus),                               // 11 p_marital_status
    orNull(data.spouseName),                                  // 12 p_spouse_name
    orNull(data.presentAddress),                              // 13 p_present_address
    orNull(data.permanentAddress),                            // 14 p_permanent_address
    orNull(data.photo_url      || data.photoPreview),         // 15 p_photo_url   (base64 data URL)
    orNull(data.signature_url || data.signaturePreview),     // 16 p_signature_url (base64 data URL)
    js(data.education),                                       // 17 p_education_json
    js(data.references),                                      // 18 p_references_json
    orNull(data.joiningDateText),                             // 19 p_joining_date_text
    orNull(data.designationText),                             // 20 p_designation_text
    // Bank
    orNull(data.bankName),                                    // 21 p_bank_name
    orNull(data.accountHolderName),                           // 22 p_account_holder_name
    orNull(data.accountNumber),                               // 23 p_account_number
    orNull(data.ifscCode),                                    // 24 p_ifsc_code
    orNull(data.branchDetails),                               // 25 p_branch_details
    // Term Life
    orNull(data.tlEmployeeName),                              // 26
    orNull(data.tlFatherOrHusbandName),                       // 27
    orNull(data.tlDateOfBirth),                               // 28
    orNull(data.tlSex),                                       // 29
    orNull(data.tlEmployeeId),                                // 30
    orNull(data.tlAddress),                                   // 31
    js(data.termLifeNominees),                                // 32 p_term_life_nominees_json
    orNull(data.tlDeclarationEmployeeName),                   // 33
    orNull(data.tlDeclarationDate),                           // 34
    orNull(data.tlPlace),                                     // 35
    orNull(data.tlSignature),                                 // 36
    // Gratuity
    orNull(data.gratuityEmployeeIntroName),                   // 37
    orNull(data.gratuitySex),                                 // 38
    orNull(data.gratuityReligion),                            // 39
    orNull(data.gratuityMaritalStatus),                       // 40
    orNull(data.gratuityDepartmentBranchSection),             // 41
    orNull(data.gratuityEmployeeId),                          // 42
    orNull(data.gratuityDateOfJoining),                       // 43
    orNull(data.gratuityPermanentAddress),                    // 44
    js(data.gratuityNominees),                                // 45
    js(data.gratuityWitnesses),                               // 46
    orNull(data.gratuityPlace),                               // 47
    orNull(data.gratuityDate),                                // 48
    orNull(data.gratuityEmployeeSignature),                   // 49
    orNull(data.gratuityEmployeeStatementNameAndAddress),     // 50
    // Insurance
    orNull(data.insEmployeeName),                             // 51
    orNull(data.insFatherOrHusbandName),                      // 52
    orNull(data.insDateOfBirth),                              // 53
    orNull(data.insSex),                                      // 54
    orNull(data.insEmployeeId),                               // 55
    orNull(data.insAddress),                                  // 56
    js(data.insNominees),                                     // 57
    orNull(data.insDeclarationEmployeeName),                  // 58
    orNull(data.insDeclarationDate),                          // 59
    orNull(data.insSignature),                                // 60
    // PF
    orNull(data.pfEmployeeName),                              // 61
    orNull(data.pfDateOfBirth),                               // 62
    orNull(data.pfFatherOrSpouseName),                        // 63
    orNull(data.pfRelationType),                              // 64
    orNull(data.pfGender),                                    // 65
    orNull(data.pfMaritalStatus),                             // 66
    orNull(data.pfEmail),                                     // 67
    orNull(data.pfMobileNo),                                  // 68
    orNull(data.pfEpf1952),                                   // 69
    orNull(data.pfEps1995),                                   // 70
    orNull(data.pfUan),                                       // 71
    orNull(data.pfPreviousPf),                                // 72
    orNull(data.pfInternationalWorker),                       // 73
    orNull(data.pfEducationalQualification),                  // 74
    orNull(data.pfSpeciallyAbled),                            // 75
    orNull(data.pfDisabilityCategory),                        // 76
    orNull(data.pfBankAccNo),                                 // 77
    orNull(data.pfIfscCode),                                  // 78
    orNull(data.pfAadharNo),                                  // 79
    orNull(data.pfDoHavePan),                                 // 80
    orNull(data.pfPan),                                       // 81
    orNull(data.pfPlace),                                     // 82
    data.pfDeclarationAccepted ? 1 : 0,                       // 83
    orNull(data.pfEmployeeSignature),                         // 84
  ];

  const placeholders = params.map(() => '?').join(', ');
  const results = await callProcedure(`sp_joining_save_formalities(${placeholders})`, params);
  const row = (results[0] ?? [])[0] ?? null;

  // Save uploaded document URLs (aadhar/pan) directly to the joining_formalities row
  if (row && (data.aadharDocUrl || data.panDocUrl)) {
    const { pool } = require('../config/db');
    const sets = [];
    const vals = [];
    if (data.aadharDocUrl) { sets.push('aadhar_doc_url = ?'); vals.push(data.aadharDocUrl); }
    if (data.panDocUrl)    { sets.push('pan_doc_url = ?');    vals.push(data.panDocUrl); }
    vals.push(inv.id);
    await pool.promise().execute(
      `UPDATE joining_formalities SET ${sets.join(', ')} WHERE invitation_id = ?`, vals
    );
    if (data.aadharDocUrl) row.aadhar_doc_url = data.aadharDocUrl;
    if (data.panDocUrl)    row.pan_doc_url    = data.panDocUrl;
  }

  return row;
}

/* ── getFormByToken ───────────────────────────────────────────────────────── */
/**
 * Employee-facing: load all previously saved formality data by token.
 * Called when the employee re-opens a link after "changes_requested".
 */
async function getFormByToken(token) {
  if (!token) throw ApiError.badRequest('Token is required');
  const results = await callProcedure('sp_joining_get_form_by_token(?)', [token]);
  return (results[0] ?? [])[0] ?? null;
}

/* ── list ─────────────────────────────────────────────────────────────────── */
async function list({ status, search, limit = 100, offset = 0 } = {}) {
  const results = await callProcedure(
    'sp_joining_list_pending(?, ?, ?, ?)',
    [status || null, search || null, Number(limit), Number(offset)]
  );
  return { rows: results[0] ?? [], total: (results[1] ?? [])[0]?.total ?? 0 };
}

/* ── getDetail ────────────────────────────────────────────────────────────── */
async function getDetail(invitationId) {
  const results = await callProcedure('sp_joining_get_formality(?)', [invitationId]);
  const row = (results[0] ?? [])[0];
  if (!row) throw ApiError.notFound('Joining formality record not found');
  return row;
}

/* ── review ───────────────────────────────────────────────────────────────── */
async function review(invitationId, { decision, remarks, changesFields, reviewedBy, employeeId, designation, reportingTo, department }) {
  const allowed = ['approve', 'request_changes', 'reject'];
  if (!allowed.includes(decision)) throw ApiError.badRequest(`Decision must be one of: ${allowed.join(', ')}`);

  // Fetch formality data before review (to get uploaded doc URLs)
  let formData = null;
  try {
    const fRows = await callProcedure('sp_joining_get_formality(?)', [invitationId]);
    formData = (fRows[0] ?? [])[0] ?? null;
  } catch { /* non-critical */ }

  const results = await callProcedure(
    'sp_joining_review(?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      invitationId,
      decision,
      reviewedBy,
      remarks       || null,
      changesFields || null,
      employeeId    || null,
      designation   || null,
      reportingTo   || null,
      department    || null,
    ]
  );
  const row = (results[0] ?? [])[0] ?? null;

  // On approval: create employee document records for uploaded Aadhaar & PAN
  if (decision === 'approve' && formData) {
    const { pool } = require('../config/db');
    const conn = await pool.promise();

    // Resolve the numeric employee_id — admin enters an emp_code string ("EMP001")
    // but the documents table uses the INT employee_id foreign key.
    let empId = row?.employee_id || formData.employee_id || null;
    if (!empId && employeeId) {
      // employeeId is the emp_code string entered by the admin
      const [empRows] = await conn.execute(
        'SELECT employee_id FROM employees WHERE emp_code = ? LIMIT 1',
        [employeeId]
      );
      empId = empRows[0]?.employee_id || null;
    }

    if (empId) {
      // Find or create "Identity Documents" category
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
        { title: 'PAN Card',     url: formData.pan_doc_url    },
      ].filter(d => d.url);

      for (const doc of docsToCreate) {
        const ext = (doc.url.split('.').pop() || 'pdf').toUpperCase();
        await conn.execute(
          `INSERT INTO documents (title, category_id, file_type, file_size, file_url, visibility, employee_id, uploaded_by)
           VALUES (?, ?, ?, ?, ?, 'employee', ?, ?)
           ON DUPLICATE KEY UPDATE file_url = VALUES(file_url)`,
          [doc.title, categoryId, ext, '', doc.url, empId, reviewedBy || null]
        ).catch(() => {}); // non-critical if duplicate or table diff
      }

      // Auto-save bank details to employee profile
      if (formData.bank_name || formData.account_number) {
        await conn.execute(
          'CALL sp_upsert_bank_details(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            empId,
            formData.bank_name           || null,  // bank_name
            formData.account_number      || null,  // account_number
            formData.ifsc_code           || null,  // ifsc_code
            formData.pan_no              || null,  // pan_number
            formData.pf_uan              || null,  // uan_number
            null,                                  // account_type
            formData.branch_details      || null,  // bank_branch
            null,                                  // dd_payable_at
            formData.account_holder_name || null,  // account_holder_name
            null,                                  // payment_type
          ]
        ).catch(e => console.error('[joining.review] sp_upsert_bank_details failed:', e.message));
      }
    }
  }

  return row;
}

/* ── getMyJoiningDocs ─────────────────────────────────────────────────────── */
/**
 * Employee-facing: return their own joining doc URLs + acknowledgment flags.
 * Links via employees.emp_code ↔ joining_formalities.admin_employee_id.
 */
async function getMyJoiningDocs(employeeId) {
  const { pool } = require('../config/db');
  const [rows] = await pool.promise().execute(
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

/* ── getByOffer ───────────────────────────────────────────────────────────── */
async function getByOffer(offerId) {
  const results = await callProcedure('sp_joining_get_by_offer(?)', [offerId]);
  return (results[0] ?? [])[0] ?? null;
}

/* ── getInvitation ────────────────────────────────────────────────────────── */
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
  getInvitation,
};
