export const VIEW = {
  HOME: "home",
  DOCUMENTS: "documents",
  PAYSLIPS: "payslips",
  FORM16: "form16",
  POLICIES: "policies",
  FORMS: "forms",
  LETTERS: "letters"
};

export const POLICIES = [
  {
    id: "information-security",
    jumpLabel: "Information Security",
    title: "Information Security Policy",
    date: "17 Jun, 2021",
    file: "Information Security Policy.pdf",
    description:
      "NAT IT is committed to maintaining and improving information security within its practices and minimizing risk exposure."
  },
  {
    id: "instant-messenger",
    jumpLabel: "Instant Messenger Usage",
    title: "Instant Messenger Usage Policy",
    date: "17 Jun, 2021",
    file: "Instant Messenger Usage Policy.pdf",
    description:
      "Guidelines for appropriate use of instant messaging tools for business communication."
  },
  {
    id: "privacy",
    jumpLabel: "Privacy",
    title: "Privacy Policy",
    date: "17 Jun, 2021",
    file: "Privacy Policy.pdf",
    description:
      "How employee and customer data is collected, used, stored, and protected."
  },
  {
    id: "desktop-usage",
    jumpLabel: "Desktop Usage",
    title: "Desktop Usage Policy",
    date: "17 Jun, 2021",
    file: "Desktop Usage Policy.pdf",
    description:
      "Standards for secure and acceptable use of company desktops and workstations."
  },
  {
    id: "employee-handbook",
    jumpLabel: "Employee Handbook",
    title: "Employee Handbook",
    date: "17 Jun, 2021",
    file: "Employee Handbook.pdf",
    description:
      "Overview of company culture, policies, benefits, and workplace expectations."
  },
  {
    id: "code-of-conduct",
    jumpLabel: "Code of Business Conduct",
    title: "Code of Business Conduct, Ethics, Harassment and Abuse Policy",
    date: "17 Jun, 2021",
    file: "Code of Business Conduct.pdf",
    description:
      "Ethical standards, anti-harassment guidelines, and reporting procedures for all employees."
  }
];

export const FORM16_YEARS = ["2025-26", "2024-25", "2023-24"];

export const FORM_SECTIONS = [
  { id: "tax-forms", jumpLabel: "Tax Forms", title: "Tax Forms" },
  { id: "statutory-forms", jumpLabel: "Statutory Forms", title: "Statutory Forms" },
  { id: "declaration-forms", jumpLabel: "Declaration Forms", title: "Declaration Forms" }
];

export const LETTER_SECTIONS = [
  { id: "pending-letters", jumpLabel: "Pending", title: "Pending Requests" },
  { id: "closed-letters", jumpLabel: "Closed", title: "Closed Requests" }
];

export const PAYSLIP_ROWS = [
  { month: "Apr 2026", text: "Payroll for the month of Apr 2026", date: "01 May, 2026", file: null },
  { month: "Mar 2026", text: "Payroll for the month of Mar 2026", date: "06 Apr, 2026", file: "Mar 2026.pdf" },
  { month: "Feb 2026", text: "Payroll for the month of Feb 2026", date: "03 Mar, 2026", file: null },
  { month: "Jan 2026", text: "Payroll for the month of Jan 2026", date: "02 Feb, 2026", file: null },
  { month: "Dec 2025", text: "Payroll for the month of Dec 2025", date: "06 Jan, 2026", file: null },
  { month: "Nov 2025", text: "Payroll for the month of Nov 2025", date: "08 Dec, 2025", file: null }
];
