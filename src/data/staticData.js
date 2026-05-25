/** Central static data — no API / backend */

export const STATIC_USERS = {
  "admin@yopmail.com": {
    password: "Test@123",
    role: 1,
    name: "Admin User",
    email: "admin@yopmail.com",
  },
  "employee@yopmail.com": {
    password: "Test@1234",
    role: 2,
    name: "Employee User",
    email: "employee@yopmail.com",
  },
};

export const STATIC_ROLES = [
  { role_id: 1, role_name: "Admin" },
  { role_id: 2, role_name: "Employee" },
];

export const STATIC_COMPANIES = [
  { company_id: 1, company_name: "NAT IT Services" },
  { company_id: 2, company_name: "NAT IT Solutions Pvt Ltd" },
];

export const STATIC_DEPARTMENTS = [
  { department_id: 1, department_name: "Engineering" },
  { department_id: 2, department_name: "Human Resources" },
  { department_id: 3, department_name: "Finance" },
  { department_id: 4, department_name: "Design" },
];

export const STATIC_DESIGNATIONS = [
  { designation_id: 1, designation_name: "Software Engineer", department_id: 1 },
  { designation_id: 2, designation_name: "Senior Developer", department_id: 1 },
  { designation_id: 3, designation_name: "HR Executive", department_id: 2 },
  { designation_id: 4, designation_name: "UI/UX Designer", department_id: 4 },
  { designation_id: 5, designation_name: "Accountant", department_id: 3 },
];

export const STATIC_DASHBOARD_STATS = {
  employees_count: 24,
  companies_count: 3,
  leaves_count: 8,
  salaries_count: 24,
};

export const DASHBOARD_TEAM_MEMBERS = [
  { name: "Linda Craver", team: "iOS" },
  { name: "Jenni Sims", team: "Android" },
  { name: "Alex Kumar", team: "Engineering" },
  { name: "Priya Sharma", team: "HR" },
];

export const DASHBOARD_RECENT_ACTIVITY = [
  { text: "New employee added", time: "2 hours ago" },
  { text: "Company profile updated", time: "Yesterday" },
  { text: "Leave request approved", time: "2 days ago" },
];

export const DASHBOARD_UPCOMING_EVENTS = [
  { text: "Board meeting", date: "Dec 25" },
  { text: "Public holiday", date: "Jan 1" },
  { text: "Appraisal cycle starts", date: "Feb 1" },
];

export const STATIC_EMPLOYEES = [
  {
    employee_id: 101,
    first_name: "Alex",
    lasst_name: "Kumar",
    email: "alex.kumar@natit.com",
    mobile: "9876543210",
    reporting_to: "Richard Wilson",
    emp_job_title: "Software Engineer",
    role: 2,
    employee_status: "Active",
    department_id: 1,
    designation_id: 1,
  },
  {
    employee_id: 102,
    first_name: "Priya",
    lasst_name: "Sharma",
    email: "priya.sharma@natit.com",
    mobile: "9876543211",
    reporting_to: "Richard Wilson",
    emp_job_title: "HR Executive",
    role: 2,
    employee_status: "Active",
    department_id: 2,
    designation_id: 3,
  },
  {
    employee_id: 103,
    first_name: "Rahul",
    lasst_name: "Mehta",
    email: "rahul.mehta@natit.com",
    mobile: "9876543212",
    reporting_to: "Richard Wilson",
    emp_job_title: "Senior Developer",
    role: 2,
    employee_status: "Active",
    department_id: 1,
    designation_id: 2,
  },
  {
    employee_id: 104,
    first_name: "Neha",
    lasst_name: "Reddy",
    email: "neha.reddy@natit.com",
    mobile: "9876543213",
    reporting_to: "Admin User",
    emp_job_title: "UI/UX Designer",
    role: 2,
    employee_status: "Active",
    department_id: 4,
    designation_id: 4,
  },
  {
    employee_id: 105,
    first_name: "Richard",
    lasst_name: "Wilson",
    email: "richard.wilson@natit.com",
    mobile: "9876543214",
    reporting_to: "No",
    emp_job_title: "Super Admin",
    role: 1,
    employee_status: "Active",
    department_id: 1,
    designation_id: 2,
  },
];
