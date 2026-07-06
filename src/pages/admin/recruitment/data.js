import
{
  BarChart3,
  Briefcase,
  CalendarCheck,
  FileCheck,
  LayoutDashboard,
  Plus,
  Search,
  UserPlus,
  Users,
} from "lucide-react";

export const RECRUITERS = [
  { key: "Mike W.", name: "Mike Williams", email: "recruiter@yopmail.com" },
  { key: "Emily D.", name: "Emily Davis", email: "recruiter2@yopmail.com" },
];

export const JOB_REQUESTS = [
  {
    "Job Title": "Sr. React Developer",
    "Job ID": "JOB-001",
    Client: "ABC Ltd",
    "Company/Department": "NAT IT / Engineering",
    "Bill Rate": "1200/hr",
    "Pay Rate": "950/hr",
    "Position Type": "Contract",
    "Job Status": "Active",
    "Business Unit": "Nat IT",
    "Recruiter Assignment Status": "Open",
    "Job Description": "React, Node.js, SQL",
    "Select Recruiter": "Mike W.",
    "My Tasks": "Source 5 profiles",
    Status: "Work in Progress",
  },
  {
    "Job Title": "QA Engineer",
    "Job ID": "JOB-002",
    Client: "Tech Solutions",
    "Company/Department": "NAT IT / Quality Assurance",
    "Bill Rate": "850/hr",
    "Pay Rate": "650/hr",
    "Position Type": "Contract to Hire",
    "Job Status": "Active",
    "Business Unit": "Natsoft",
    "Recruiter Assignment Status": "Completed",
    "Job Description": "Automation, API testing",
    "Select Recruiter": "Emily D.",
    "My Tasks": "Shortlist candidates",
    Status: "Closed",
  },
  {
    "Job Title": "DevOps Engineer",
    "Job ID": "JOB-003",
    Client: "CloudTech",
    "Company/Department": "NAT IT / Infrastructure",
    "Bill Rate": "1400/hr",
    "Pay Rate": "1100/hr",
    "Position Type": "Direct Hire",
    "Job Status": "In Active",
    "Business Unit": "Nat IT",
    "Recruiter Assignment Status": "Hold",
    "Job Description": "AWS, CI/CD, Docker",
    "Select Recruiter": "Mike W.",
    "My Tasks": "Await client confirmation",
    Status: "Work in Progress",
  },
];

export const CANDIDATES = [
  {
    "Job ID": "JOB-001",
    Name: "Ravi Kumar",
    Email: "ravi.kumar@email.com",
    Mobile: "9876543210",
    "Total Experience": "5 yrs",
    "Relevant Experience": "4 yrs",
    "Current CTC": "12 LPA",
    "Expected CTC": "16 LPA",
    "Last Working Day (LWD)": "30-Jul-2026",
    "Skill Set": "React, Node.js",
    Gender: "Male",
    "Attach File": "ravi_resume.pdf",
    "PIN Code": "500081",
    City: "Hyderabad",
    State: "Telangana",
    District: "Rangareddy",
    Recruiter: "Mike W.",
    Status: "Schedule Interview",
    Source: "LinkedIn",
  },
  {
    "Job ID": "JOB-002",
    Name: "Anjali Rao",
    Email: "anjali.rao@email.com",
    Mobile: "9123456780",
    "Total Experience": "6 yrs",
    "Relevant Experience": "5 yrs",
    "Current CTC": "14 LPA",
    "Expected CTC": "18 LPA",
    "Last Working Day (LWD)": "20-Aug-2026",
    "Skill Set": "Selenium, Java",
    Gender: "Female",
    "Attach File": "anjali_resume.pdf",
    "PIN Code": "560001",
    City: "Bengaluru",
    State: "Karnataka",
    District: "Bengaluru Urban",
    Recruiter: "Emily D.",
    Status: "Shortlisted",
    Source: "Naukri",
  },
];

export const INTERVIEWS = [
  {
    candidate: "Ravi Kumar",
    date: "2026-07-02",
    time: "10:00 AM",
    level: "L1",
    type: "Technical",
    status: "Scheduled",
  },
  {
    candidate: "Anjali Rao",
    date: "2026-07-03",
    time: "02:30 PM",
    level: "Manager",
    type: "Final",
    status: "Pending",
  },
];
export const OFFER_ROWS = [
  {
    Candidate: "Meera K.",
    "Date of Joining": "15-Jul-2026",
    "CTC Amount": "14 LPA",
    Basic: "5.6 LPA",
    HRA: "2.8 LPA",
    "Telephone/Internet Allowance": "0.3 LPA",
    "Special Allowance": "3.1 LPA",
    "Gross Salary": "11.8 LPA",
    "PF Contribution": "0.67 LPA",
    "Statutory Bonus": "0.25 LPA",
    Gratuity: "0.27 LPA",
    ESI: "N/A",
    "Cost to Company": "14 LPA",
    "CTC Amount in Words": "Fourteen Lakhs Only",
    Designation: "QA Engineer",
    Status: "Offer Released and Accepted",
  },
];

export const ONBOARDING_ROWS = [
  {
    Candidate: "Meera K.",
    "Current Status of Employee": "In Progress",
    "Effective Date": "15-Jul-2026",
    Onboard: "Pending HR verification",
    "Review Forms Submitted": "Yes",
  },
];

export const ONBOARDING_TASKS = [
  {
    Task: "Upload Documents",
    Description: "Upload identity, address, education proof",
    Status: "Completed",
    Action: "View",
  },
  {
    Task: "Background Verification",
    Description: "Verify candidate background",
    Status: "Pending",
    Action: "View",
  },
  {
    Task: "HR Approval",
    Description: "HR team final approval",
    Status: "Pending",
    Action: "View",
  },
  {
    Task: "Employee Creation",
    Description: "Create employee in system",
    Status: "Pending",
    Action: "View",
  },
  {
    Task: "Welcome Email",
    Description: "Send welcome email to employee",
    Status: "Pending",
    Action: "View",
  },
];

export const EMPLOYEES = [
  {
    EMPID: "EMP101",
    EMPLOYEE: "John Doe",
    DEPARTMENT: "Development",
    DESIGNATION: "Software Engineer",
    DOJ: "01 Jun 2026",
    STATUS: "Active",
  },
  {
    EMPID: "EMP102",
    EMPLOYEE: "Mike Johnson",
    DEPARTMENT: "Development",
    DESIGNATION: "Software Engineer",
    DOJ: "22 Jun 2026",
    STATUS: "Active",
  },
];

export const STATUS_REFERENCE = [
  "Work in Progress",
  "Schedule Interview",
  "Shortlisted",
  "Offer Released and Accepted",
  "In Progress",
  "Onboarded",
];

export const ADMIN_REPORTS_DONUTS = [
  {
    title: "Candidate Funnel",
    segments: [
      { name: "Applied", value: 120, color: "#2563eb" },
      { name: "Screening", value: 75, color: "#f59e0b" },
      { name: "Manager Round", value: 40, color: "#8b5cf6" },
      { name: "Offer", value: 22, color: "#22c55e" },
      { name: "Joined", value: 14, color: "#0ea5e9" },
    ],
  },
  {
    title: "Offer Status",
    segments: [
      { name: "Pending", value: 12, color: "#f97316" },
      { name: "Accepted", value: 8, color: "#22c55e" },
      { name: "Rejected", value: 4, color: "#ef4444" },
    ],
  },
  {
    title: "Recruiter Activity",
    segments: [
      { name: "Sourcing", value: 38, color: "#3b82f6" },
      { name: "Screening", value: 30, color: "#a855f7" },
      { name: "Interviews", value: 22, color: "#14b8a6" },
      { name: "Offers", value: 10, color: "#f59e0b" },
    ],
  },
];

export const ADMIN_REPORTS_HIRING_TREND = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
  present: [15, 22, 28, 34, 42, 50, 58],
  absent: [5, 7, 9, 10, 8, 7, 5],
};

export const ADMIN_REPORTS_LEAVE = [
  { label: "Jan", annual: 12, casual: 8, medical: 5, others: 3 },
  { label: "Feb", annual: 15, casual: 10, medical: 4, others: 2 },
  { label: "Mar", annual: 18, casual: 12, medical: 6, others: 4 },
  { label: "Apr", annual: 14, casual: 9, medical: 7, others: 3 },
  { label: "May", annual: 20, casual: 11, medical: 5, others: 5 },
];

export function badgeColor(value = "")
{
  const normalized = String(value).toLowerCase();

  if (
    normalized.includes("completed") ||
    normalized.includes("accepted") ||
    normalized.includes("active") ||
    normalized.includes("onboarded") ||
    normalized.includes("selected") ||
    normalized.includes("shortlisted")
  )
  {
    return "green";
  }

  if (
    normalized.includes("pending") ||
    normalized.includes("open") ||
    normalized.includes("work in progress") ||
    normalized.includes("in progress") ||
    normalized.includes("schedule interview")
  )
  {
    return "blue";
  }

  if (
    normalized.includes("hold") ||
    normalized.includes("rejected") ||
    normalized.includes("inactive") ||
    normalized.includes("not selected")
  )
  {
    return "red";
  }

  if (normalized.includes("closed"))
  {
    return "gray";
  }

  return "gray";
}

export function roleInfo(user)
{
  const roleId = user?.role ?? user?.roleId;
  switch (Number(roleId))
  {
    case 1:
      return { id: 1, label: "Admin", tabClass: "bg-slate-100 text-slate-700" };
    case 4:
      return { id: 4, label: "Recruiter Manager", tabClass: "bg-violet-100 text-violet-700" };
    case 5:
      return { id: 5, label: "Recruiter", tabClass: "bg-orange-100 text-orange-700" };
    default:
      return { id: 5, label: "Recruiter", tabClass: "bg-orange-100 text-orange-700" };
  }
}

export function getRecruiterKey(user)
{
  const email = user?.email || "";
  return email.includes("recruiter2") ? "Emily D." : "Mike W.";
}

export const TABS = {
  1: [
    { key: "dashboard",  label: "Dashboard",  icon: LayoutDashboard },
    { key: "candidates", label: "Candidates", icon: Users },
    { key: "reports",    label: "Reports",    icon: BarChart3 },
  ],
  4: [
    { key: "dashboard",  label: "Dashboard",  icon: LayoutDashboard },
    { key: "jobs",       label: "Jobs",       icon: Briefcase },
    { key: "candidates", label: "Candidates", icon: Users },
    { key: "interviews", label: "Interviews", icon: CalendarCheck },
  ],
  5: [
    { key: "dashboard",     label: "Dashboard",    icon: LayoutDashboard },
    { key: "requirements",  label: "Requirements", icon: Briefcase },
    { key: "candidates",    label: "Candidates",   icon: Users },
    { key: "interviews",    label: "Interviews",   icon: CalendarCheck },
  ],
};



export const badgeClasses = {
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  gray: "bg-gray-100 text-gray-700",
  orange: "bg-orange-50 text-orange-700",
  red: "bg-red-100 text-red-800",
  purple: "bg-violet-100 text-violet-800",
};

export const statToneClasses = {
  brand: { note: "text-brand-500", icon: "bg-brand-50 text-brand-500" },
  indigo: { note: "text-indigo-500", icon: "bg-indigo-50 text-indigo-500" },
  green: { note: "text-emerald-500", icon: "bg-emerald-50 text-emerald-500" },
  purple: { note: "text-violet-600", icon: "bg-violet-50 text-violet-600" },
  red: { note: "text-red-500", icon: "bg-red-50 text-red-500" },
};




export const inputClass = "w-full rounded border-[0.5px] border-gray-300 bg-white px-[9px] py-[7px] text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";
export const inputErrorClass = "border-red-600 focus:border-red-600 focus:ring-red-600/20";
export const labelTextClass = "mb-1 block text-xs font-bold text-gray-700";
export const gridClass = {
  3: "grid grid-cols-1 gap-2.5 p-3.5 md:grid-cols-3",
  4: "grid grid-cols-1 gap-[15px] p-[15px] md:grid-cols-2 xl:grid-cols-4",
};
export const statGridClass = "mb-3.5 grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4";
export const footerActionsClass = "flex justify-end gap-2 px-3.5 pb-3.5";
