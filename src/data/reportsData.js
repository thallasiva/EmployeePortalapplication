export const REPORT_NAV = [
  { path: "expense", label: "Expense" },
  { path: "invoice", label: "Invoice" },
  { path: "payment", label: "Payment" },
  { path: "project", label: "Project" },
  { path: "task", label: "Task" },
  { path: "user", label: "User" },
  { path: "employee", label: "Employee" },
  { path: "payslip", label: "Payslip" },
  { path: "attendance", label: "Attendance" },
  { path: "leave", label: "Leave" },
  { path: "daily", label: "Daily" },
];

export const PROJECT_STATS = [
  { label: "Total Projects", value: 300, trend: "+10.54% from last month", positive: true, barColor: "#ec4899", barWidth: 75 },
  { label: "Completed Projects", value: 250, trend: "+12.84% from last month", positive: true, barColor: "#22c55e", barWidth: 83 },
  { label: "Pending Projects", value: 50, trend: "-10.75% from last month", positive: false, barColor: "#ef4444", barWidth: 17 },
  { label: "New Projects", value: 30, trend: "+15.74% from last month", positive: true, barColor: "#8b5cf6", barWidth: 10 },
];

export const PROJECT_CHART = [
  { name: "Pending", value: 30, color: "#06b6d4" },
  { name: "Inprogress", value: 20, color: "#eab308" },
  { name: "On Hold", value: 10, color: "#8b5cf6" },
  { name: "Completed", value: 40, color: "#22c55e" },
];

export const PROJECT_LIST = [
  { id: "PRO-001", name: "Office Management App", leader: "Anthony Lewis", teamCount: 5, extraTeam: 2, deadline: "12 Sep 2024", priority: "Low", status: "Active" },
  { id: "PRO-002", name: "Hospital Administration", leader: "Maria Garcia", teamCount: 4, extraTeam: 3, deadline: "20 Oct 2024", priority: "Medium", status: "Active" },
  { id: "PRO-003", name: "Educational Platform", leader: "David Park", teamCount: 6, extraTeam: 1, deadline: "05 Nov 2024", priority: "High", status: "Active" },
  { id: "PRO-004", name: "POS Admin Software", leader: "Sarah Chen", teamCount: 3, extraTeam: 2, deadline: "18 Dec 2024", priority: "Low", status: "Active" },
  { id: "PRO-005", name: "Chat & Call Mobile App", leader: "John Gibbs", teamCount: 5, extraTeam: 4, deadline: "02 Jan 2025", priority: "Medium", status: "Active" },
];

export const TASK_STATS = [
  { label: "Total Tasks", value: 800, fraction: null },
  { label: "Completed", value: 800, fraction: "4/7" },
  { label: "Pending", value: 800, fraction: "2/7" },
  { label: "In Progress", value: 800, fraction: "1/7" },
];

export const TASK_CHART = [
  { name: "Completed", value: 40, color: "#22c55e" },
  { name: "Pending", value: 30, color: "#3b82f6" },
  { name: "Inprogress", value: 20, color: "#eab308" },
  { name: "On Hold", value: 10, color: "#8b5cf6" },
];

export const TASK_LIST = [
  { name: "Patient Appointment Booking", project: "Hospital Administration", created: "12/01/2024", due: "20/01/2024", priority: "Low", status: "Completed" },
  { name: "Payment Gateway", project: "Educational Platform", created: "15/01/2024", due: "25/01/2024", priority: "Medium", status: "Inprogress" },
  { name: "Doctor available module", project: "Hospital Administration", created: "18/01/2024", due: "28/01/2024", priority: "High", status: "Completed" },
  { name: "Video Conferencing Module", project: "Chat & Call Mobile App", created: "20/01/2024", due: "30/01/2024", priority: "Low", status: "On Hold" },
  { name: "Services List & Grid View", project: "POS Admin Software", created: "22/01/2024", due: "02/02/2024", priority: "Low", status: "Pending" },
];

export const EMPLOYEE_STATS = [
  { label: "Total Employee", value: 600, icon: "users", color: "#f97316", trend: "+20.01% from last week" },
  { label: "Active Employee", value: 600, icon: "check", color: "#22c55e", trend: "+20.01% from last week" },
  { label: "New Employee", value: 600, icon: "user-plus", color: "#3b82f6", trend: "+20.01% from last week" },
  { label: "Inactive Employee", value: 600, icon: "user-x", color: "#ef4444", trend: "+20.01% from last week" },
];

export const EMPLOYEE_CHART = [
  { label: "Feb", active: 80, inactive: 20 },
  { label: "Mar", active: 95, inactive: 25 },
  { label: "Apr", active: 110, inactive: 18 },
  { label: "May", active: 105, inactive: 22 },
  { label: "Jun", active: 120, inactive: 15 },
  { label: "Jul", active: 130, inactive: 12 },
  { label: "Aug", active: 125, inactive: 18 },
  { label: "Sep", active: 140, inactive: 10 },
  { label: "Oct", active: 135, inactive: 14 },
];

export const EMPLOYEE_LIST = [
  { id: "EMP001", name: "Anthony Lewis", role: "Finance", email: "[email protected]", department: "Finance", phone: "(123) 4567 890", joining: "14/01/2024", status: "Active" },
  { id: "EMP002", name: "Brian Villalobos", role: "Developer", email: "[email protected]", department: "Application Development", phone: "(123) 4567 891", joining: "15/01/2024", status: "Active" },
  { id: "EMP003", name: "Harvey Smith", role: "Developer", email: "[email protected]", department: "IT Management", phone: "(123) 4567 892", joining: "16/01/2024", status: "Active" },
  { id: "EMP004", name: "Stephan Peralt", role: "Executive Officer", email: "[email protected]", department: "Finance", phone: "(123) 4567 893", joining: "17/01/2024", status: "Active" },
  { id: "EMP005", name: "Doglas Martini", role: "Manager", email: "[email protected]", department: "Finance", phone: "(123) 4567 894", joining: "18/01/2024", status: "Active" },
];

export const ATTENDANCE_STATS = [
  { label: "Total Working Days", value: 25, icon: "calendar", color: "#f97316", trend: "+20.01% from last month", barWidth: 80 },
  { label: "Total Leave Taken", value: 12, icon: "leave", color: "#3b82f6", trend: "+20.01% from last month", barWidth: 48 },
  { label: "Total Holidays", value: 6, icon: "holiday", color: "#ec4899", trend: "+20.01% from last month", barWidth: 24 },
  { label: "Total Halfdays", value: 5, icon: "halfday", color: "#eab308", trend: "+20.01% from last month", barWidth: 20 },
];

export const ATTENDANCE_LINE = {
  present: [40, 55, 50, 65, 70, 85, 75, 80, 90],
  absent: [20, 25, 30, 35, 40, 45, 35, 30, 25],
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
};

export const ATTENDANCE_LIST = [
  { id: 1, name: "Anthony Lewis", role: "Finance", date: "14/01/2024", checkIn: "09:00 AM", status: "Present", checkOut: "06:45 PM", break: "30 Min", late: "32 Min", overtime: "20 Min", production: "8.55 Hrs", productionGood: true },
  { id: 2, name: "Brian Villalobos", role: "Developer", date: "15/01/2024", checkIn: "09:15 AM", status: "Present", checkOut: "06:30 PM", break: "45 Min", late: "15 Min", overtime: "10 Min", production: "7.54 Hrs", productionGood: false },
  { id: 3, name: "Harvey Smith", role: "Developer", date: "16/01/2024", checkIn: "09:00 AM", status: "Present", checkOut: "06:50 PM", break: "30 Min", late: "0 Min", overtime: "25 Min", production: "8.75 Hrs", productionGood: true },
  { id: 4, name: "Stephan Peralt", role: "Executive Officer", date: "17/01/2024", checkIn: "09:05 AM", status: "Present", checkOut: "06:40 PM", break: "35 Min", late: "5 Min", overtime: "15 Min", production: "8.20 Hrs", productionGood: true },
  { id: 5, name: "Doglas Martini", role: "Manager", date: "18/01/2024", checkIn: "09:20 AM", status: "Present", checkOut: "06:25 PM", break: "40 Min", late: "20 Min", overtime: "5 Min", production: "7.80 Hrs", productionGood: false },
];

export const LEAVE_STATS = [
  { label: "Total Leaves", value: 15, trend: "+17.02%", icon: "total", color: "#3b82f6" },
  { label: "Approved Leaves", value: 5, trend: "+17.02%", icon: "approved", color: "#22c55e" },
  { label: "Pending Requests", value: 5, trend: "+17.02%", icon: "pending", color: "#eab308" },
  { label: "Rejected Leaves", value: 5, trend: "+17.02%", icon: "rejected", color: "#ef4444" },
];

export const LEAVE_CHART = [
  { label: "Jan", annual: 12, casual: 8, medical: 5, others: 3 },
  { label: "Feb", annual: 15, casual: 10, medical: 4, others: 2 },
  { label: "Mar", annual: 18, casual: 12, medical: 6, others: 4 },
  { label: "Apr", annual: 14, casual: 9, medical: 7, others: 3 },
  { label: "May", annual: 20, casual: 11, medical: 5, others: 5 },
  { label: "Jun", annual: 16, casual: 13, medical: 8, others: 4 },
  { label: "Jul", annual: 22, casual: 14, medical: 6, others: 6 },
  { label: "Aug", annual: 19, casual: 10, medical: 9, others: 3 },
  { label: "Sep", annual: 17, casual: 12, medical: 7, others: 5 },
  { label: "Oct", annual: 21, casual: 15, medical: 6, others: 4 },
  { label: "Nov", annual: 18, casual: 11, medical: 8, others: 5 },
  { label: "Dec", annual: 24, casual: 16, medical: 7, others: 6 },
];

export const LEAVE_LIST = [
  { id: "LV-001", name: "Michael Walker", role: "CEO", company: "BrightWave Innovations", created: "12/01/2024", due: "20/01/2024", amount: "$2,500", status: "Approved" },
  { id: "LV-002", name: "Sarah Chen", role: "VP Engineering", company: "Stellar Solutions", created: "15/01/2024", due: "25/01/2024", amount: "$1,800", status: "Pending" },
  { id: "LV-003", name: "David Park", role: "Frontend Lead", company: "Quantum Nexus", created: "18/01/2024", due: "28/01/2024", amount: "$3,200", status: "Approved" },
  { id: "LV-004", name: "Maria Garcia", role: "Sales Director", company: "EcoVision Enterprises", created: "20/01/2024", due: "30/01/2024", amount: "$1,500", status: "Rejected" },
  { id: "LV-005", name: "John Gibbs", role: "Sales Director", company: "Aurora Technologies", created: "22/01/2024", due: "02/02/2024", amount: "$2,100", status: "Pending" },
];

export const DAILY_STATS = [
  { label: "Total Present", value: 300, icon: "present", color: "#f97316" },
  { label: "Completed Tasks", value: 100, icon: "completed", color: "#22c55e" },
  { label: "Total Absent", value: 15, icon: "absent", color: "#ef4444" },
  { label: "Pending Tasks", value: 125, icon: "pending", color: "#3b82f6" },
];

export const DAILY_LINE = {
  present: [60, 55, 70, 65, 70],
  absent: [20, 25, 60, 45, 80],
  labels: ["Jan", "Feb", "Mar", "Apr", "May"],
};

export const DAILY_LIST = [
  { name: "Anthony Lewis", role: "Finance", date: "14/01/2024", department: "Finance", status: "Present" },
  { name: "Brian Villalobos", role: "Developer", date: "15/01/2024", department: "Application Development", status: "Present" },
  { name: "Harvey Smith", role: "Developer", date: "16/01/2024", department: "IT Management", status: "Present" },
  { name: "Stephan Peralt", role: "Executive Officer", date: "17/01/2024", department: "Finance", status: "Present" },
  { name: "Doglas Martini", role: "Manager", date: "18/01/2024", department: "Finance", status: "Present" },
];

export const GENERIC_REPORTS = {
  expense: {
    title: "Expense Report",
    stats: [
      { label: "Total Expenses", value: "$45,200", trend: "+8.2% from last month", positive: true, barColor: "#f97316", barWidth: 72 },
      { label: "Approved", value: "$38,500", trend: "+12.1% from last month", positive: true, barColor: "#22c55e", barWidth: 85 },
      { label: "Pending", value: "$4,200", trend: "-3.5% from last month", positive: false, barColor: "#eab308", barWidth: 15 },
      { label: "Rejected", value: "$2,500", trend: "-1.2% from last month", positive: false, barColor: "#ef4444", barWidth: 8 },
    ],
    tableTitle: "Expense List",
    columns: ["Expense ID", "Employee", "Category", "Date", "Amount", "Status"],
    rows: [
      ["EXP-001", "Anthony Lewis", "Travel", "14/01/2024", "$450", "Approved"],
      ["EXP-002", "Maria Garcia", "Meals", "15/01/2024", "$120", "Pending"],
      ["EXP-003", "David Park", "Equipment", "16/01/2024", "$890", "Approved"],
    ],
  },
  invoice: {
    title: "Invoice Report",
    stats: [
      { label: "Total Invoices", value: 120, trend: "+5.4% from last month", positive: true, barColor: "#3b82f6", barWidth: 70 },
      { label: "Paid", value: 95, trend: "+8.1% from last month", positive: true, barColor: "#22c55e", barWidth: 79 },
      { label: "Unpaid", value: 18, trend: "-2.3% from last month", positive: false, barColor: "#ef4444", barWidth: 15 },
      { label: "Overdue", value: 7, trend: "-4.1% from last month", positive: false, barColor: "#eab308", barWidth: 6 },
    ],
    tableTitle: "Invoice List",
    columns: ["Invoice ID", "Client", "Created Date", "Due Date", "Amount", "Status"],
    rows: [
      ["INV-001", "BrightWave Innovations", "12/01/2024", "20/01/2024", "$5,200", "Paid"],
      ["INV-002", "Stellar Solutions", "15/01/2024", "25/01/2024", "$3,800", "Sent"],
      ["INV-003", "Quantum Nexus", "18/01/2024", "28/01/2024", "$7,100", "Partially Paid"],
    ],
  },
  payment: {
    title: "Payment Report",
    stats: [
      { label: "Total Payments", value: "$128,400", trend: "+11.2% from last month", positive: true, barColor: "#8b5cf6", barWidth: 78 },
      { label: "Completed", value: "$115,200", trend: "+9.8% from last month", positive: true, barColor: "#22c55e", barWidth: 90 },
      { label: "Processing", value: "$8,500", trend: "+2.1% from last month", positive: true, barColor: "#3b82f6", barWidth: 12 },
      { label: "Failed", value: "$4,700", trend: "-5.6% from last month", positive: false, barColor: "#ef4444", barWidth: 6 },
    ],
    tableTitle: "Payment List",
    columns: ["Payment ID", "Payee", "Method", "Date", "Amount", "Status"],
    rows: [
      ["PAY-001", "Anthony Lewis", "Bank Transfer", "14/01/2024", "$4,500", "Completed"],
      ["PAY-002", "Sarah Chen", "Credit Card", "15/01/2024", "$2,200", "Completed"],
      ["PAY-003", "John Gibbs", "PayPal", "16/01/2024", "$1,800", "Processing"],
    ],
  },
  user: {
    title: "User Report",
    stats: [
      { label: "Total Users", value: 850, trend: "+6.3% from last month", positive: true, barColor: "#3b82f6", barWidth: 75 },
      { label: "Active Users", value: 720, trend: "+4.8% from last month", positive: true, barColor: "#22c55e", barWidth: 85 },
      { label: "New Users", value: 45, trend: "+15.2% from last month", positive: true, barColor: "#8b5cf6", barWidth: 12 },
      { label: "Inactive Users", value: 85, trend: "-2.1% from last month", positive: false, barColor: "#ef4444", barWidth: 10 },
    ],
    tableTitle: "User List",
    columns: ["User ID", "Name", "Email", "Role", "Last Login", "Status"],
    rows: [
      ["USR-001", "Anthony Lewis", "[email protected]", "Admin", "27/05/2026", "Active"],
      ["USR-002", "Maria Garcia", "[email protected]", "Manager", "27/05/2026", "Active"],
      ["USR-003", "David Park", "[email protected]", "Employee", "26/05/2026", "Active"],
    ],
  },
  payslip: {
    title: "Payslip Report",
    stats: [
      { label: "Total Payslips", value: 600, trend: "+3.2% from last month", positive: true, barColor: "#f97316", barWidth: 80 },
      { label: "Generated", value: 580, trend: "+2.8% from last month", positive: true, barColor: "#22c55e", barWidth: 97 },
      { label: "Pending", value: 15, trend: "-1.5% from last month", positive: false, barColor: "#eab308", barWidth: 3 },
      { label: "Failed", value: 5, trend: "-0.8% from last month", positive: false, barColor: "#ef4444", barWidth: 1 },
    ],
    tableTitle: "Payslip List",
    columns: ["Payslip ID", "Employee", "Period", "Net Pay", "Generated Date", "Status"],
    rows: [
      ["PS-001", "Anthony Lewis", "Apr 2026", "$4,850", "01/05/2026", "Generated"],
      ["PS-002", "Maria Garcia", "Apr 2026", "$5,200", "01/05/2026", "Generated"],
      ["PS-003", "David Park", "Apr 2026", "$4,600", "01/05/2026", "Pending"],
    ],
  },
};
