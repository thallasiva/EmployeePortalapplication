export const DESIGNATION_LIST = [
  "Intern", "Trainee", "Associate Software Engineer", "Software Engineer", "Senior Software Engineer",
  "Lead Software Engineer", "Technical Lead", "Team Lead", "Module Lead", "Project Lead",
  "Engineering Manager", "Delivery Manager", "Project Manager", "Program Manager", "Product Manager",
  "Product Owner", "Scrum Master", "Solution Architect", "Technical Architect", "Enterprise Architect",
  "UI Developer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "Mobile App Developer",
  "Android Developer", "iOS Developer", "DevOps Engineer", "Site Reliability Engineer (SRE)",
  "Cloud Engineer", "Data Engineer", "Data Analyst", "Data Scientist", "AI/ML Engineer",
  "QA Engineer", "Automation Test Engineer", "Manual Test Engineer", "Performance Test Engineer",
  "Security Engineer", "Database Administrator (DBA)", "System Administrator", "Network Administrator",
  "Business Analyst", "HR Executive", "HR Manager", "Talent Acquisition Executive", "Recruiter",
  "Payroll Executive", "Finance Executive", "Accountant", "Accounts Manager", "Admin Executive",
  "Office Manager", "Customer Support Executive", "Customer Success Manager", "Sales Executive",
  "Business Development Executive", "Sales Manager", "Marketing Executive", "Digital Marketing Specialist",
  "Graphic Designer", "Content Writer", "Operations Executive", "Operations Manager",
  "CEO", "CTO", "COO", "CFO", "Director", "Vice President (VP)",
].map((d) => ({ value: d, label: d }));

export const DEPARTMENT_LIST = [
  "Engineering", "Information Technology (IT)", "Software Development", "Product Development",
  "Product Management", "Quality Assurance (QA)", "Testing", "DevOps", "Cloud Operations",
  "Infrastructure", "Technical Support", "Customer Support", "Customer Success",
  "Human Resources (HR)", "Talent Acquisition", "Payroll", "Finance", "Accounts", "Administration",
  "Sales", "Business Development", "Marketing", "Digital Marketing", "Operations", "Procurement",
  "Legal", "Compliance", "Security", "Data Analytics", "Artificial Intelligence (AI)",
  "Research & Development (R&D)", "Project Management Office (PMO)", "Training & Development",
  "Facilities Management", "Corporate Communications", "Executive Management",
].map((d) => ({ value: d, label: d }));

export const STATUS = {
  pending: { cls: "bg-gray-100 text-gray-600", label: "Not Submitted" },
  submitted: { cls: "bg-amber-100 text-amber-700", label: "Submitted" },
  pending_verification: { cls: "bg-orange-100 text-orange-700", label: "Pending Review" },
  approved: { cls: "bg-emerald-100 text-emerald-700", label: "Approved" },
  changes_requested: { cls: "bg-red-100 text-red-700", label: "Changes Requested" },
  rejected: { cls: "bg-red-100 text-red-700", label: "Rejected" },
};

export const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending_verification", label: "Pending Review" },
  { key: "submitted", label: "Submitted" },
  { key: "changes_requested", label: "Changes Requested" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "pending", label: "Not Submitted" },
];
