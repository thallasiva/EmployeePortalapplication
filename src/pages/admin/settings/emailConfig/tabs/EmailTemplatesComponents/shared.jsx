const PER = 8;
const CATEGORIES = ["Onboarding", "Leave", "Attendance", "Payroll", "Recruitment", "Performance", "Helpdesk", "Announcements", "System"];
const CAT_COLORS = {
  Onboarding: "#e87500",
  Leave: "#10b981",
  Attendance: "#f59e0b",
  Payroll: "#e87500",
  Recruitment: "#8b5cf6",
  Performance: "#ec4899",
  Helpdesk: "#14b8a6",
  Announcements: "#f97316",
  System: "#64748b"
};
const SAMPLES = {
  "{{EmployeeName}}": "Rajan Kumar",
  "{{EmployeeId}}": "EMP1042",
  "{{Department}}": "Engineering",
  "{{Designation}}": "Senior Developer",
  "{{ManagerName}}": "Priya Sharma",
  "{{LeaveType}}": "Casual Leave",
  "{{FromDate}}": "10 Aug 2026",
  "{{ToDate}}": "12 Aug 2026",
  "{{CompanyName}}": "HRMS",
  "{{InterviewDate}}": "15 Aug 2026",
  "{{InterviewTime}}": "11:00 AM",
  "{{JobTitle}}": "UI Developer",
  "{{OfferDate}}": "05 Aug 2026",
  "{{JoiningDate}}": "01 Sep 2026",
  "{{Month}}": "July 2026",
  "{{Amount}}": "₹4,500",
  "{{PolicyName}}": "Health Insurance",
  "{{DocumentName}}": "Passport",
  "{{ExpiryDate}}": "31 Dec 2026",
  "{{SupportLink}}": "https://support.company.com",
  "{{Year}}": "2026",
  "{{Status}}": "Approved",
  "{{Remarks}}": "Approved as requested",
  "{{ActionBy}}": "HR Admin"
};
// Action button HTML snippets rendered in preview
// Action button HTML snippets rendered in preview
const ACTION_VARS = {
  "{{ApproveButton}}": `<a href="#" style="display:inline-block;padding:10px 24px;background:#16a34a;color:#fff;font-weight:700;font-size:14px;border-radius:8px;text-decoration:none;margin-right:8px;">Approve</a>`,
  "{{RejectButton}}": `<a href="#" style="display:inline-block;padding:10px 24px;background:#dc2626;color:#fff;font-weight:700;font-size:14px;border-radius:8px;text-decoration:none;">Reject</a>`,
  "{{ActionButtons}}": `<div style="margin:20px 0;"><a href="#" style="display:inline-block;padding:10px 24px;background:#16a34a;color:#fff;font-weight:700;font-size:14px;border-radius:8px;text-decoration:none;margin-right:8px;">Approve</a><a href="#" style="display:inline-block;padding:10px 24px;background:#dc2626;color:#fff;font-weight:700;font-size:14px;border-radius:8px;text-decoration:none;">Reject</a></div>`
};
const renderPreview = body => {
  let result = body || "";
  // Replace action button vars first (they produce raw HTML)
  Object.entries(ACTION_VARS).forEach(([k, v]) => {
    result = result.replaceAll(k, v);
  });
  // Replace data vars with highlighted values
  Object.entries(SAMPLES).forEach(([k, v]) => {
    result = result.replaceAll(k, `<strong style="color:#e87500">${v}</strong>`);
  });
  return result;
};
/* ── Editor Modal ── */
export { PER, CATEGORIES, CAT_COLORS, SAMPLES, ACTION_VARS, renderPreview };
