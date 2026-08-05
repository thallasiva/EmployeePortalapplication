// ─── Brand palette (matches tailwind.config.js brand token) ───
export const BRAND = "#f18200";
export const BRAND_SOFT = "#fff8f0";
export const BRAND_HOVER = "#e07000";

// ─── Dynamic variable tokens ───
export const TEMPLATE_VARS = [
  "{{EmployeeName}}", "{{EmployeeId}}", "{{Department}}", "{{Designation}}",
  "{{ManagerName}}", "{{LeaveType}}", "{{FromDate}}", "{{ToDate}}",
  "{{CompanyName}}", "{{InterviewDate}}", "{{InterviewTime}}",
  "{{JobTitle}}", "{{OfferDate}}", "{{JoiningDate}}", "{{Month}}",
  "{{Amount}}", "{{PolicyName}}", "{{DocumentName}}", "{{ExpiryDate}}",
];

// ─── Template categories ───
export const TEMPLATE_CATEGORIES = [
  "Recruitment","Leave","Attendance","Payroll","Expenses",
  "Travel","Exit Management","Learning","Performance",
  "Notifications","Security","General",
];

// ─── Roles ───
export const ROLES = [
  "Super Admin","HR Manager","Recruiter","Reporting Manager","Finance","Employee",
];

// ─── Permission modules ───
export const PERM_MODULES = [
  { name:"Recruitment",         desc:"Job postings, interviews, offers" },
  { name:"Leave",               desc:"Leave requests and approvals" },
  { name:"Attendance",          desc:"Attendance alerts and regularization" },
  { name:"Payroll",             desc:"Payslip, salary and payroll alerts" },
  { name:"Expenses",            desc:"Expense requests and approvals" },
  { name:"Travel",              desc:"Travel requests and approvals" },
  { name:"Exit Management",     desc:"Resignation and exit workflows" },
  { name:"Performance",         desc:"Appraisal and review notifications" },
  { name:"Learning",            desc:"Training and course reminders" },
  { name:"Company Announcements",desc:"Company-wide announcements" },
  { name:"Security",            desc:"Password reset, alerts, notifications" },
  { name:"Helpdesk",            desc:"Support tickets and responses" },
];

// ─── Default permission matrix [module][role] ───
export const DEFAULT_PERMS = [
  [true ,true ,true ,false,false,false],
  [true ,true ,false,true ,false,true ],
  [true ,true ,false,true ,false,true ],
  [true ,true ,false,false,true ,false],
  [true ,true ,false,false,true ,true ],
  [true ,true ,false,false,true ,false],
  [true ,true ,false,false,false,false],
  [true ,true ,false,true ,false,false],
  [true ,true ,false,false,false,false],
  [true ,true ,false,false,false,false],
  [true ,true ,true ,true ,true ,true ],
  [true ,true ,false,false,false,true ],
];

// ─── Seed templates ───
export const SEED_TEMPLATES = [
  { id:1, name:"Welcome Email",         category:"General",     subject:"Welcome to {{CompanyName}}, {{EmployeeName}}!",                status:"Active",   updated:"03 Aug 2026", body:"Dear {{EmployeeName}},\n\nWelcome to {{CompanyName}}! We are thrilled to have you on board as {{Designation}} in the {{Department}} department.\n\nYour reporting manager is {{ManagerName}}. Your joining date is {{JoiningDate}}.\n\nBest regards,\nHR Team" },
  { id:2, name:"Interview Invitation",  category:"Recruitment", subject:"Interview Invitation for {{JobTitle}} at {{CompanyName}}",     status:"Active",   updated:"02 Aug 2026", body:"Dear {{EmployeeName}},\n\nYou have been shortlisted for the {{JobTitle}} position at {{CompanyName}}.\n\nInterview Date: {{InterviewDate}}\nInterview Time: {{InterviewTime}}\n\nPlease confirm your availability.\n\nRegards,\n{{ManagerName}}" },
  { id:3, name:"Offer Letter",          category:"Recruitment", subject:"Offer Letter from {{CompanyName}}",                           status:"Active",   updated:"01 Aug 2026", body:"Dear {{EmployeeName}},\n\nWe are pleased to offer you the position of {{Designation}} at {{CompanyName}}.\n\nOffer Date: {{OfferDate}}\nJoining Date: {{JoiningDate}}\nDesignation: {{Designation}}\nDepartment: {{Department}}\n\nKindly revert with your acceptance.\n\nHR Team, {{CompanyName}}" },
  { id:4, name:"Leave Approved",        category:"Leave",       subject:"Your {{LeaveType}} Leave Request has been Approved",          status:"Active",   updated:"31 Jul 2026", body:"Dear {{EmployeeName}},\n\nYour {{LeaveType}} leave request from {{FromDate}} to {{ToDate}} has been approved by {{ManagerName}}.\n\nHave a good break!\n\nHR Team" },
  { id:5, name:"Leave Rejected",        category:"Leave",       subject:"Your {{LeaveType}} Leave Request has been Rejected",          status:"Active",   updated:"31 Jul 2026", body:"Dear {{EmployeeName}},\n\nYour {{LeaveType}} leave request from {{FromDate}} to {{ToDate}} has been rejected by {{ManagerName}}.\n\nPlease contact your manager for more details.\n\nHR Team" },
  { id:6, name:"Payslip Available",     category:"Payroll",     subject:"Your Payslip for {{Month}} is now available",                 status:"Active",   updated:"30 Jul 2026", body:"Dear {{EmployeeName}},\n\nYour payslip for {{Month}} is now available in the HRMS portal.\n\nNet Pay: {{Amount}}\n\nPlease log in to view and download.\n\nFinance Team, {{CompanyName}}" },
  { id:7, name:"Expense Approved",      category:"Expenses",    subject:"Your Expense Request has been Approved",                      status:"Active",   updated:"29 Jul 2026", body:"Dear {{EmployeeName}},\n\nYour expense claim of {{Amount}} has been approved.\n\nThe reimbursement will be processed in the next payroll cycle.\n\nFinance Team" },
  { id:8, name:"Password Reset",        category:"Security",    subject:"Reset Your Password – {{CompanyName}} HRMS",                  status:"Active",   updated:"28 Jul 2026", body:"Dear {{EmployeeName}},\n\nA password reset request was received for your account.\n\nIf you did not request this, please ignore this email.\n\nClick the link below to reset your password.\n\nSecurity Team, {{CompanyName}}" },
  { id:9, name:"Company Announcement",  category:"Notifications",subject:"Important Announcement from {{CompanyName}}",               status:"Active",   updated:"27 Jul 2026", body:"Dear Team,\n\n{{CompanyName}} has an important announcement to share.\n\nPlease log in to the HRMS portal for full details.\n\nManagement Team" },
  { id:10,name:"Work Anniversary",      category:"General",     subject:"Happy Work Anniversary, {{EmployeeName}}!",                   status:"Active",   updated:"26 Jul 2026", body:"Dear {{EmployeeName}},\n\nCongratulations on completing another wonderful year with {{CompanyName}}!\n\nThank you for your valuable contributions.\n\nHR Team" },
  { id:11,name:"Probation Reminder",    category:"Notifications",subject:"Probation Period Ending Soon – {{EmployeeName}}",            status:"Active",   updated:"25 Jul 2026", body:"Dear {{ManagerName}},\n\n{{EmployeeName}}'s probation period is ending on {{ExpiryDate}}.\n\nPlease complete the probation review and submit your recommendation.\n\nHR Team, {{CompanyName}}" },
  { id:12,name:"Document Expiry Alert", category:"Notifications",subject:"Document Expiry Alert – {{DocumentName}}",                   status:"Inactive", updated:"24 Jul 2026", body:"Dear {{EmployeeName}},\n\nYour document {{DocumentName}} is expiring on {{ExpiryDate}}.\n\nPlease upload the updated document at the earliest.\n\nHR Team" },
];

// ─── Seed logs ───
export const SEED_LOGS = [
  { id:1,  dt:"05 Aug 2026, 09:45 AM", to:"john.doe@natit.com",     subject:"Welcome to NAT IT, John Doe!",           module:"General",     status:"Sent",    error:"",                   retry:0 },
  { id:2,  dt:"05 Aug 2026, 09:30 AM", to:"raju.kumar@natit.com",   subject:"Interview Invitation for SR Engineer",   module:"Recruitment", status:"Sent",    error:"",                   retry:0 },
  { id:3,  dt:"05 Aug 2026, 08:50 AM", to:"kiranreddy@natit.com",   subject:"Your Casual Leave has been Approved",    module:"Leave",       status:"Sent",    error:"",                   retry:0 },
  { id:4,  dt:"05 Aug 2026, 08:45 AM", to:"meera.shah@natit.com",   subject:"Your Payslip for July 2026",             module:"Payroll",     status:"Failed",  error:"SMTP timeout",       retry:2 },
  { id:5,  dt:"05 Aug 2026, 08:30 AM", to:"arif.sani@natit.com",    subject:"Expense Approved – ₹4,500",              module:"Expenses",    status:"Sent",    error:"",                   retry:0 },
  { id:6,  dt:"05 Aug 2026, 07:55 AM", to:"priya.singh@natit.com",  subject:"Reset Your Password – NAT IT HRMS",      module:"Security",    status:"Sent",    error:"",                   retry:0 },
  { id:7,  dt:"05 Aug 2026, 07:25 AM", to:"vikas.m@natit.com",      subject:"Important Announcement from NAT IT",     module:"Notifications",status:"Sent",   error:"",                   retry:0 },
  { id:8,  dt:"04 Aug 2026, 06:15 PM", to:"suresh.p@natit.com",     subject:"Attendance Regularization Approved",     module:"Attendance",  status:"Pending", error:"",                   retry:0 },
  { id:9,  dt:"04 Aug 2026, 05:45 PM", to:"neha.gupta@natit.com",   subject:"Your Sick Leave has been Rejected",      module:"Leave",       status:"Sent",    error:"",                   retry:0 },
  { id:10, dt:"04 Aug 2026, 04:30 PM", to:"robert.m@natit.com",     subject:"Interview Invitation for UI Developer",  module:"Recruitment", status:"Failed",  error:"Invalid recipient",  retry:1 },
  { id:11, dt:"04 Aug 2026, 03:00 PM", to:"anita.k@natit.com",      subject:"Work Anniversary – Happy 3rd Year!",     module:"General",     status:"Sent",    error:"",                   retry:0 },
  { id:12, dt:"04 Aug 2026, 02:00 PM", to:"deepak.r@natit.com",     subject:"Offer Letter from NAT IT",               module:"Recruitment", status:"Queued",  error:"",                   retry:0 },
];

// ─── Seed schedules ───
export const SEED_SCHEDULES = [
  { id:1, name:"Birthday Wishes",           desc:"Send birthday wishes to employees",    freq:"Daily at 09:00 AM",    cron:"0 9 * * *",  next:"06 Aug 2026, 09:00 AM", lastRun:"05 Aug 2026, 09:00 AM", active:true  },
  { id:2, name:"Work Anniversary Wishes",   desc:"Send work anniversary wishes",         freq:"Daily at 09:15 AM",    cron:"15 9 * * *", next:"06 Aug 2026, 09:15 AM", lastRun:"05 Aug 2026, 09:15 AM", active:true  },
  { id:3, name:"Probation Reminder",        desc:"Remind before probation ends",         freq:"Daily at 10:00 AM",    cron:"0 10 * * *", next:"06 Aug 2026, 10:00 AM", lastRun:"05 Aug 2026, 10:00 AM", active:true  },
  { id:4, name:"Document Expiry Reminder",  desc:"Remind before document expiry",        freq:"Daily at 11:00 AM",    cron:"0 11 * * *", next:"06 Aug 2026, 11:00 AM", lastRun:"05 Aug 2026, 11:00 AM", active:true  },
  { id:5, name:"Holiday Reminder",          desc:"Remind employees about upcoming holiday",freq:"Daily at 08:00 AM",  cron:"0 8 * * *",  next:"06 Aug 2026, 08:00 AM", lastRun:"05 Aug 2026, 08:00 AM", active:true  },
  { id:6, name:"Weekly Newsletter",         desc:"Send weekly company updates",          freq:"Every Monday, 09:00 AM",cron:"0 9 * * 1", next:"11 Aug 2026, 09:00 AM", lastRun:"04 Aug 2026, 09:00 AM", active:false },
  { id:7, name:"Training Reminder",         desc:"Remind about upcoming trainings",      freq:"Daily at 12:00 PM",    cron:"0 12 * * *", next:"06 Aug 2026, 12:00 PM", lastRun:"05 Aug 2026, 12:00 PM", active:true  },
  { id:8, name:"Contract Expiry Alert",     desc:"Alert before employee contract expiry",freq:"1st of every month",   cron:"0 9 1 * *",  next:"01 Sep 2026, 09:00 AM", lastRun:"01 Aug 2026, 09:00 AM", active:true  },
];

export const FREQ_OPTIONS = ["Daily","Weekly","Monthly","Yearly","Custom Cron"];

export const CAT_COLOR = {
  Recruitment:"purple", Leave:"green", Attendance:"blue", Payroll:"amber",
  Expenses:"amber", Travel:"blue", "Exit Management":"red", Learning:"purple",
  Performance:"indigo", Notifications:"blue", Security:"red", General:"gray",
};
