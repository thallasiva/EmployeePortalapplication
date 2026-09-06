/**
 * HRMS Centralized Toast Messages
 * All user-facing messages in one place — consistent, specific, human.
 */

// ─── Smart API error parser ────────────────────────────────────────────────
/**
 * Convert a raw API/network error into a user-friendly string.
 * @param {any}    e        — the caught error
 * @param {string} context  — what the user was trying to do e.g. "save employee"
 */
export function getApiError(e, context = "complete this action") {
  const raw = (e?.response?.data?.message || e?.message || "").toLowerCase();

  if (!raw && e?.response?.status) {
    const s = e.response.status;
    if (s === 401) return "Your session has expired. Please log in again.";
    if (s === 403) return "You don't have permission to do that.";
    if (s === 404) return "The requested record was not found.";
    if (s === 409) return "A conflict occurred — this record may already exist.";
    if (s === 422) return "Some fields have invalid values. Please review and try again.";
    if (s === 429) return "Too many requests. Please wait a moment and try again.";
    if (s >= 500)  return "Server error — please try again in a moment.";
  }

  // Attendance
  if (raw.includes("already checked in"))      return "You're already checked in for today.";
  if (raw.includes("already checked out"))     return "You've already checked out for today.";
  if (raw.includes("not checked in"))          return "You need to check in before you can do that.";
  if (raw.includes("already on break"))        return "You're already on a break. End your current break first.";
  if (raw.includes("not on break"))            return "You're not currently on a break.";
  if (raw.includes("check_in_time"))           return "Please check in before performing this action.";

  // Auth
  if (raw.includes("invalid credentials") || raw.includes("wrong password"))
                                               return "Incorrect email or password. Please try again.";
  if (raw.includes("account locked"))         return "Your account has been locked. Contact HR.";
  if (raw.includes("token expired") || raw.includes("jwt expired"))
                                               return "Your session has expired. Please log in again.";
  if (raw.includes("user not found"))         return "No account found with this email address.";
  if (raw.includes("email already"))          return "This email address is already registered.";

  // Payroll
  if (raw.includes("is locked"))             return "This payroll run is locked. Ask an admin to unlock it.";
  if (raw.includes("ifsc"))                  return "One or more employees have an invalid IFSC code. Update bank details first.";
  if (raw.includes("account_number") || raw.includes("bank account"))
                                              return "One or more employees are missing bank account details.";
  if (raw.includes("approved payroll"))       return "A payroll run must be approved before exporting.";
  if (raw.includes("generated payslips"))     return "Generate payslips for employees before exporting.";
  if (raw.includes("no salary"))              return "No salary structure assigned to this employee.";

  // Leave
  if (raw.includes("insufficient leave") || raw.includes("not enough leave"))
                                              return "Insufficient leave balance for the requested period.";
  if (raw.includes("overlapping") || raw.includes("overlap"))
                                              return "You already have a leave request for these dates.";
  if (raw.includes("pending request"))        return "A leave request is already pending for these dates.";

  // File / Upload
  if (raw.includes("file too large") || raw.includes("maxfilesize"))
                                              return "File is too large. Maximum size is 10 MB.";
  if (raw.includes("invalid file type") || raw.includes("mime"))
                                              return "This file type is not supported. Please upload a PDF or image.";

  // DB / Duplicate
  if (raw.includes("duplicate entry") || raw.includes("already exists"))
                                              return "A record with this information already exists.";
  if (raw.includes("foreign key") || raw.includes("referenced"))
                                              return "This record is in use elsewhere and cannot be deleted.";

  // Network
  if (raw.includes("network") || raw.includes("econnrefused") || raw.includes("timeout") || raw.includes("etimedout"))
                                              return "Network error — check your connection and try again.";

  // ─── Hardened fallback: never surface raw technical / DB / stack text ─────
  const status = e?.response?.status;
  const rawMsg = (e?.response?.data?.message || e?.message || "").trim();

  // Programming / DB / server errors → generic, never leaked to the user
  const technical = /(sql|collation|deadlock|syntax error|prototype|is not a function|cannot read|referenceerror|typeerror|\bstack\b|at object|econn|etimed|err_|xhr|status code|unexpected token|\bnull\b|\bundefined\b)/i;
  if ((status && status >= 500) || technical.test(rawMsg)) {
    return "Something went wrong on our side. Please try again in a moment.";
  }

  // Known HTTP statuses that arrived without a specific business message
  if (status === 401) return "Your session has expired. Please log in again.";
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return "The requested record was not found.";
  if (status === 409) return "A conflict occurred — this record may already exist.";
  if (status === 422) return "Some fields have invalid values. Please review and try again.";
  if (status === 429) return "Too many requests. Please wait a moment and try again.";

  // A clean, human backend message → show it as-is
  if (rawMsg.length > 5 && rawMsg.length < 160) {
    return rawMsg.charAt(0).toUpperCase() + rawMsg.slice(1).replace(/\.$/, "") + ".";
  }

  return `Unable to ${context}. Please try again.`;
}

// ─── Success messages ──────────────────────────────────────────────────────
export const MSG = {
  // Auth
  LOGIN_SUCCESS:           "Welcome back! You're logged in.",
  LOGOUT_SUCCESS:          "You've been logged out successfully.",
  PASSWORD_RESET_SENT:     "Password reset link sent. Check your email.",
  PASSWORD_CHANGED:        "Password updated successfully.",
  MFA_ENABLED:             "Two-factor authentication enabled.",
  MFA_DISABLED:            "Two-factor authentication disabled.",

  // Employee
  EMPLOYEE_CREATED:        "Employee profile created successfully.",
  EMPLOYEE_UPDATED:        "Employee details updated.",
  EMPLOYEE_DELETED:        "Employee removed from the system.",
  EMPLOYEE_INVITED:        "Invitation email sent to the employee.",
  EMPLOYEE_TRANSFERRED:    "Employee transferred to the new department.",
  ROLE_ASSIGNED:           "Role assigned successfully.",
  ROLE_UPDATED:            "Role updated successfully.",
  DESIGNATION_UPDATED:     "Designation updated successfully.",

  // Attendance
  CHECK_IN_SUCCESS:        (time) => `Checked in at ${time}. Have a productive day!`,
  CHECK_OUT_SUCCESS:       (time) => `Checked out at ${time}. Great work today!`,
  BREAK_START_SUCCESS:     "Break started. Enjoy your rest!",
  BREAK_END_SUCCESS:       "Break ended. Welcome back!",
  REGULARIZATION_SUBMITTED:"Attendance regularization request submitted.",
  REGULARIZATION_APPROVED: "Regularization approved successfully.",
  REGULARIZATION_REJECTED: "Regularization request rejected.",

  // Leave
  LEAVE_APPLIED:           "Leave request submitted successfully.",
  LEAVE_CANCELLED:         "Leave request cancelled.",
  LEAVE_APPROVED:          (name) => name ? `Leave approved for ${name}.` : "Leave request approved.",
  LEAVE_REJECTED:          (name) => name ? `Leave rejected for ${name}.` : "Leave request rejected.",
  LEAVE_TYPE_CREATED:      "Leave type created successfully.",
  LEAVE_TYPE_UPDATED:      "Leave type updated.",
  LEAVE_TYPE_DELETED:      "Leave type removed.",
  HOLIDAY_IMPORTED:        (n) => `${n} holiday(s) imported successfully.`,
  HOLIDAY_CREATED:         "Holiday added to the calendar.",
  HOLIDAY_UPDATED:         "Holiday updated.",
  HOLIDAY_DELETED:         "Holiday removed from the calendar.",

  // Payroll
  PAYROLL_PROCESSED:       (month, year) => `Payroll processed for ${month} ${year}.`,
  PAYSLIP_GENERATED:       "Payslip generated successfully.",
  PAYSLIPS_GENERATED:      (n) => `${n} payslip(s) generated successfully.`,
  PAYSLIP_PAID:            "Payslip marked as paid.",
  PAYSLIP_DOWNLOADED:      "Payslip downloaded.",
  PAYROLL_SUBMITTED:       "Payroll submitted for review.",
  PAYROLL_APPROVED:        "Payroll run approved and locked.",
  PAYROLL_REJECTED:        "Payroll run sent back for corrections.",
  PAYROLL_LOCKED:          "Payroll run locked — no further changes allowed.",
  PAYROLL_UNLOCKED:        "Payroll run unlocked — edits are now allowed.",
  BANK_EXPORTED:           "NEFT export file downloaded successfully.",
  SALARY_SAVED:            "Salary structure saved.",
  SALARY_ASSIGNED:         "Salary structure assigned to employee.",
  SALARY_TEMPLATE_SAVED:   "Salary template saved.",
  SALARY_COMPONENT_SAVED:  "Salary component saved.",
  SALARY_COMPONENT_DELETED:"Salary component deleted.",

  // IT Declaration
  IT_DECLARATION_SAVED:    "IT declaration saved successfully.",
  IT_PROOF_UPLOADED:       "Proof document uploaded.",
  IT_PROOF_APPROVED:       "Proof approved.",
  IT_PROOF_REJECTED:       "Proof rejected. Employee will be notified.",

  // Documents
  DOCUMENT_UPLOADED:       "Document uploaded successfully.",
  DOCUMENT_DELETED:        "Document deleted.",
  DOCUMENT_SHARED:         "Document shared successfully.",

  // Recruitment
  JOB_CREATED:             "Job requisition created.",
  JOB_UPDATED:             "Job posting updated.",
  JOB_CLOSED:              "Job posting closed.",
  CANDIDATE_ADDED:         "Candidate profile created.",
  CANDIDATE_UPDATED:       "Candidate details updated.",
  INTERVIEW_SCHEDULED:     "Interview scheduled successfully.",
  OFFER_SENT:              "Offer letter sent to candidate.",
  OFFER_ACCEPTED:          "Offer marked as accepted.",
  OFFER_DECLINED:          "Offer marked as declined.",
  ONBOARDING_COMPLETED:    "Onboarding completed successfully.",
  RESUME_MATCHED:          "Resume matched against job requirements.",
  AI_INTERVIEW_STARTED:    "AI interview session started.",
  INVITATION_SENT:         "Invitation sent to candidate.",

  // Helpdesk
  TICKET_CREATED:          "Support ticket created. We'll get back to you soon.",
  TICKET_UPDATED:          "Ticket updated.",
  TICKET_RESOLVED:         "Ticket marked as resolved.",

  // Calendar / Events
  EVENT_CREATED:           "Event added to the calendar.",
  EVENT_UPDATED:           "Event updated.",
  EVENT_DELETED:           "Event removed from the calendar.",

  // Settings / Admin
  SETTINGS_SAVED:          "Settings saved successfully.",
  SMTP_SAVED:              "Email (SMTP) settings saved.",
  SMTP_TESTED:             "Test email sent — check your inbox.",
  TEMPLATE_SAVED:          "Email template saved.",
  WORKFLOW_DELEGATED:      "Workflow delegation created.",
  DELEGATION_CANCELLED:    "Delegation cancelled.",
  ROLE_CREATED:            "Role created.",
  ROLE_DELETED:            "Role deleted.",
  PERMISSION_UPDATED:      "Permissions updated.",
  COMPANY_UPDATED:         "Company details updated.",

  // Timesheet
  TIMESHEET_SAVED:         "Timesheet entry saved.",
  TIMESHEET_SUBMITTED:     "Timesheet submitted for approval.",
  TIMESHEET_APPROVED:      "Timesheet approved.",
  TIMESHEET_REJECTED:      "Timesheet rejected.",

  // Generic
  SAVED:                   "Changes saved successfully.",
  DELETED:                 "Record deleted successfully.",
  COPIED:                  "Copied to clipboard.",
  EXPORTED:                "File exported successfully.",
  IMPORTED:                (n) => `${n} record(s) imported successfully.`,
  ACTION_COMPLETE:         "Action completed successfully.",
};

// ─── Error message constants ───────────────────────────────────────────────
export const ERR = {
  // Validation
  REQUIRED_FIELDS:         "Please fill in all required fields.",
  INVALID_EMAIL:           "Please enter a valid email address.",
  PASSWORD_TOO_SHORT:      "Password must be at least 8 characters.",
  PASSWORDS_MISMATCH:      "Passwords do not match.",
  INVALID_DATE:            "Please enter a valid date.",
  INVALID_AMOUNT:          "Please enter a valid amount (must be greater than 0).",
  SELECT_FILE:             "Please select a file to upload.",
  PDF_OR_DOCX_ONLY:        "Only PDF or Word (.docx) files are supported.",
  PDF_ONLY:                "Only PDF files are supported.",
  IMAGE_ONLY:              "Only image files (JPG, PNG) are supported.",
  FILE_TOO_LARGE:          "File is too large. Maximum allowed size is 10 MB.",
  INVALID_IFSC:            "Invalid IFSC code. Format should be: ABCD0123456.",

  // Selection
  SELECT_EMPLOYEE:         "Please select an employee first.",
  SELECT_DATE:             "Please select a date.",
  SELECT_DATES:            "Please select both start and end dates.",
  SELECT_LEAVE_TYPE:       "Please select a leave type.",
  SELECT_DEPARTMENT:       "Please select a department.",
  SELECT_CANDIDATE_JOB:    "Please select both a candidate and a job.",

  // No data
  NO_EMPLOYEES_TO_EXPORT:  "No employees found to export.",
  NO_DATA:                 "No data available.",

  // Network
  NETWORK_ERROR:           "Network error — check your internet connection.",
  SERVER_ERROR:            "Something went wrong on the server. Please try again.",
  TIMEOUT:                 "Request timed out. Please try again.",

  // Generic
  LOAD_FAILED:             (what) => `Unable to load ${what}. Please refresh the page.`,
  SAVE_FAILED:             (what) => `Unable to save ${what}. Please try again.`,
  DELETE_FAILED:           (what) => `Unable to delete ${what}. Please try again.`,
  ACTION_FAILED:           "Something went wrong. Please try again.",
};
