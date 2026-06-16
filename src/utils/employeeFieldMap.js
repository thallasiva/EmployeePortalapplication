/**
 * Master field map for the HR employee data template.
 *
 * Each entry describes one CSV column from the template and where it lives
 * in the API payload:
 *  - group "employee"  -> top-level field on the employees table
 *  - group "contact"   -> nested under `contactInfo` (employee_contact_info table)
 *  - group "bank"      -> nested under `bankDetails` (employee_bank_details table)
 *  - group "derived"   -> computed (e.g. Employee Name -> first/last name)
 *
 * `key` is the normalized CSV header (lowercase, spaces -> underscores,
 * punctuation stripped) as produced by parseEmployeeCsv/normalizeHeader.
 * `column` is the corresponding API/DB field name.
 */
export const EMPLOYEE_FIELD_MAP = [
  { header: "Employee Number", key: "employee_number", group: "employee", column: "emp_code" },
  { header: "Employee Name", key: "employee_name", group: "derived" },
  { header: "Date Of Joining", key: "date_of_joining", group: "employee", column: "emp_joining_date" },
  { header: "Aadhaar Number", key: "aadhaar_number", group: "employee", column: "aadhaar_number" },
  { header: "Name As Per Aadhaar", key: "name_as_per_aadhaar", group: "employee", column: "aadhaar_name" },
  { header: "Aadhaar Enrolment Number", key: "aadhaar_enrolment_number", group: "employee", column: "aadhaar_enrolment_number" },
  { header: "Access Card Number", key: "access_card_number", group: "employee", column: "access_card_number" },
  { header: "From Date", key: "from_date", group: "employee", column: "access_card_from_date" },
  { header: "To Date", key: "to_date", group: "employee", column: "access_card_to_date" },
  { header: "Bank Name", key: "bank_name", group: "bank", column: "bank_name" },
  { header: "Bank Account Number", key: "bank_account_number", group: "bank", column: "account_number" },
  { header: "Bank Account Type", key: "bank_account_type", group: "bank", column: "account_type" },
  { header: "Bank Branch", key: "bank_branch", group: "bank", column: "bank_branch" },
  { header: "DD Payable At", key: "dd_payable_at", group: "bank", column: "dd_payable_at" },
  { header: "IFSC Code", key: "ifsc_code", group: "bank", column: "ifsc_code" },
  { header: "Name As Per Bank", key: "name_as_per_bank", group: "bank", column: "account_holder_name" },
  { header: "Payment Type", key: "payment_type", group: "bank", column: "payment_type" },
  { header: "Birthday", key: "birthday", group: "employee", column: "dob" },
  { header: "Date Of Birth", key: "date_of_birth", group: "employee", column: "dob" },
  { header: "Email", key: "email", group: "employee", column: "email" },
  { header: "Emergency Contact Name", key: "emergency_contact_name", group: "contact", column: "emergency_contact_name" },
  { header: "Emergency Contact Mobile", key: "emergency_contact_mobile", group: "contact", column: "emergency_contact_phone" },
  { header: "ESI Number", key: "esi_number", group: "employee", column: "esi_number" },
  { header: "Father's Name", key: "fathers_name", group: "employee", column: "father_name" },
  { header: "Gender", key: "gender", group: "employee", column: "gender" },
  { header: "Manager Employee Number", key: "manager_employee_number", group: "manager" },
  { header: "Marital Status", key: "marital_status", group: "employee", column: "marital_status" },
  { header: "PAN Number", key: "pan_number", group: "bank", column: "pan_number" },
  { header: "PF Join Date", key: "pf_join_date", group: "employee", column: "pf_join_date" },
  { header: "PF Number", key: "pf_number", group: "employee", column: "pf_number" },
  { header: "UAN Number", key: "uan_number", group: "bank", column: "uan_number" },
  { header: "Spouse Name", key: "spouse_name", group: "employee", column: "spouse_name" },
  { header: "Contact City", key: "contact_city", group: "contact", column: "contact_city" },
  { header: "Contact Country", key: "contact_country", group: "contact", column: "contact_country" },
  { header: "Contact Email", key: "contact_email", group: "contact", column: "personal_email" },
  { header: "Contact Mobile", key: "contact_mobile", group: "contact", column: "alternate_mobile" },
  { header: "Contact Name", key: "contact_name", group: "contact", column: "contact_name" },
  { header: "Permanent Address Line 1", key: "permanent_address_line_1", group: "contact", column: "permanent_address_line1" },
  { header: "Permanent Address Line 2", key: "permanent_address_line_2", group: "contact", column: "permanent_address_line2" },
  { header: "Permanent Address Line 3", key: "permanent_address_line_3", group: "contact", column: "permanent_address_line3" },
  { header: "Has Left The Organization", key: "has_left_the_organization", group: "employee", column: "has_left_organization" },
  { header: "Leaving Date", key: "leaving_date", group: "employee", column: "emp_exit_date" },
];

/** Extra columns (beyond the template) included in the "export all" CSV. */
export const EXPORT_EXTRA_COLUMNS = [
  { header: "Mobile", get: (e) => e.mobile },
  { header: "Department", get: (e) => e.department_name },
  { header: "Designation", get: (e) => e.designation_name },
  { header: "Job Title", get: (e) => e.emp_job_title },
  { header: "Employee Status", get: (e) => e.employee_status },
  { header: "Employee Type", get: (e) => e.employee_type },
  { header: "CTC", get: (e) => e.ctc },
  { header: "Reporting Manager", get: (e) => e.reporting_to_name?.trim() },
];

const TRUE_VALUES = new Set(["yes", "y", "true", "1"]);

export function parseBooleanFlag(value) {
  if (value === undefined || value === null) return false;
  return TRUE_VALUES.has(String(value).trim().toLowerCase());
}
