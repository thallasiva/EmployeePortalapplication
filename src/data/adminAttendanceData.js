export const ADMIN_ATTENDANCE_SUMMARY = {
  checkedInToday: 18,
  totalEmployees: 24,
  presentToday: 16,
  absentToday: 2,
  onLeaveToday: 2,
  lateToday: 4,
  metNineHourRule: 16,
  earlyLogout: 4,
  avgHoursPerDay: 8.6,
  lateThisMonth: 47,
  attendanceRate: 94,
};

export const ADMIN_WEEKLY_ATTENDANCE = [
  { day: "Mon", present: 17, absent: 1, late: 2, leave: 1 },
  { day: "Tue", present: 19, absent: 1, late: 1, leave: 0 },
  { day: "Wed", present: 18, absent: 1, late: 3, leave: 1 },
  { day: "Thu", present: 20, absent: 0, late: 1, leave: 0 },
  { day: "Fri", present: 16, absent: 1, late: 2, leave: 2 },
];

/** Full employee list with today's attendance status */
export const ADMIN_ALL_EMPLOYEES = [
  { id: 1, name: "Priya Sharma", department: "Engineering", empId: "EMP001", status: "present", checkIn: "09:02", checkOut: "18:15", hours: "9.2h", nineHrMet: true },
  { id: 2, name: "Sean Black", department: "Engineering", empId: "EMP002", status: "present", checkIn: "08:55", checkOut: "18:05", hours: "9.1h", nineHrMet: true },
  { id: 3, name: "David Park", department: "Engineering", empId: "EMP003", status: "present", checkIn: "09:00", checkOut: "18:10", hours: "9.1h", nineHrMet: true },
  { id: 4, name: "Rahul Mehta", department: "Sales", empId: "EMP004", status: "late", checkIn: "09:35", checkOut: "17:30", hours: "8.2h", lateBy: "35 min", nineHrMet: false },
  { id: 5, name: "Neha Kapoor", department: "Finance", empId: "EMP005", status: "late", checkIn: "09:28", checkOut: "17:45", hours: "8.6h", lateBy: "28 min", nineHrMet: false },
  { id: 6, name: "Vikram Singh", department: "Operations", empId: "EMP006", status: "late", checkIn: "09:42", checkOut: "17:50", hours: "8.5h", lateBy: "42 min", nineHrMet: false },
  { id: 7, name: "Ananya Iyer", department: "HR", empId: "EMP007", status: "late", checkIn: "09:25", checkOut: "17:55", hours: "8.7h", lateBy: "25 min", nineHrMet: false },
  { id: 8, name: "John Gibbs", department: "Sales", empId: "EMP008", status: "present", checkIn: "09:05", checkOut: "18:20", hours: "9.3h", nineHrMet: true },
  { id: 9, name: "Jenni Sims", department: "Marketing", empId: "EMP009", status: "present", checkIn: "09:10", checkOut: "18:00", hours: "9.0h", nineHrMet: true },
  { id: 10, name: "Sarah Chen", department: "HR", empId: "EMP010", status: "present", checkIn: "08:58", checkOut: "18:12", hours: "9.2h", nineHrMet: true },
  { id: 11, name: "Michael Torres", department: "Engineering", empId: "EMP011", status: "present", checkIn: "09:03", checkOut: "18:08", hours: "9.1h", nineHrMet: true },
  { id: 12, name: "Emily Watson", department: "Finance", empId: "EMP012", status: "present", checkIn: "09:07", checkOut: "18:18", hours: "9.2h", nineHrMet: true },
  { id: 13, name: "James Wilson", department: "Operations", empId: "EMP013", status: "present", checkIn: "09:01", checkOut: "18:05", hours: "9.1h", nineHrMet: true },
  { id: 14, name: "Lisa Anderson", department: "Marketing", empId: "EMP014", status: "present", checkIn: "09:04", checkOut: "18:22", hours: "9.3h", nineHrMet: true },
  { id: 15, name: "Robert Kim", department: "Engineering", empId: "EMP015", status: "present", checkIn: "08:50", checkOut: "18:00", hours: "9.2h", nineHrMet: true },
  { id: 16, name: "Maria Garcia", department: "Sales", empId: "EMP016", status: "present", checkIn: "09:06", checkOut: "18:15", hours: "9.2h", nineHrMet: true },
  { id: 17, name: "Kevin Lee", department: "Engineering", empId: "EMP017", status: "absent", checkIn: "--:--", checkOut: "--:--", hours: "0h", nineHrMet: false },
  { id: 18, name: "Sophie Martin", department: "Finance", empId: "EMP018", status: "absent", checkIn: "--:--", checkOut: "--:--", hours: "0h", nineHrMet: false },
  { id: 19, name: "Alex Turner", department: "Operations", empId: "EMP019", status: "leave", checkIn: "--:--", checkOut: "--:--", hours: "0h", nineHrMet: false },
  { id: 20, name: "Nina Patel", department: "HR", empId: "EMP020", status: "leave", checkIn: "--:--", checkOut: "--:--", hours: "0h", nineHrMet: false },
  { id: 21, name: "Chris Brown", department: "Marketing", empId: "EMP021", status: "present", checkIn: "09:08", checkOut: "18:10", hours: "9.0h", nineHrMet: true },
  { id: 22, name: "Diana Ross", department: "Sales", empId: "EMP022", status: "present", checkIn: "09:02", checkOut: "18:05", hours: "9.1h", nineHrMet: true },
  { id: 23, name: "Tom Harris", department: "Operations", empId: "EMP023", status: "present", checkIn: "09:00", checkOut: "18:00", hours: "9.0h", nineHrMet: true },
  { id: 24, name: "Olivia White", department: "Finance", empId: "EMP024", status: "present", checkIn: "09:05", checkOut: "18:08", hours: "9.1h", nineHrMet: true },
];

export const ADMIN_EARLY_LOGOUTS = ADMIN_ALL_EMPLOYEES.filter(
  (e) => e.status === "late" && !e.nineHrMet
);

export const ADMIN_NINE_HR_COMPLIANT = ADMIN_ALL_EMPLOYEES.filter(
  (e) => e.status === "present" && e.nineHrMet
);

export const ADMIN_ATTENDANCE_CALENDAR = {
  year: 2026,
  month: 4,
  monthLabel: "May 2026",
  days: {
    1: "present",
    2: "present",
    3: "weekend",
    4: "weekend",
    5: "present",
    6: "late",
    7: "present",
    8: "present",
    9: "late",
    10: "present",
    11: "present",
    12: "late",
    13: "late",
    14: "weekend",
    15: "weekend",
    16: "present",
    17: "late",
    18: "late",
    19: "late",
    20: "present",
    21: "weekend",
    22: "weekend",
    23: "present",
    24: "leave",
    25: "present",
    26: "present",
    27: "late",
    28: "present",
    29: "weekend",
    30: "weekend",
    31: "present",
  },
};

export const ATTENDANCE_LEGEND = [
  { key: "present", label: "Present", color: "#22c55e" },
  { key: "late", label: "Late", color: "#f97316" },
  { key: "absent", label: "Absent", color: "#f472b6" },
  { key: "leave", label: "Leave", color: "#3b82f6" },
  { key: "weekend", label: "Weekend", color: "#e5e7eb" },
];

export const STATUS_LABEL = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  leave: "On Leave",
};

export const STATUS_BADGE_CLASS = {
  present: "approved",
  absent: "rejected",
  late: "pending",
  leave: "leave",
};

export const ADMIN_ATTENDANCE_WEEKLY_CHART = [
  { label: "Mon", present: 17, absent: 1, late: 2 },
  { label: "Tue", present: 19, absent: 1, late: 1 },
  { label: "Wed", present: 18, absent: 1, late: 3 },
  { label: "Thu", present: 20, absent: 0, late: 1 },
  { label: "Fri", present: 16, absent: 1, late: 2 },
];

export const ADMIN_ATTENDANCE_WEEKLY_SERIES = [
  { key: "present", name: "Present", color: "#22c55e" },
  { key: "absent", name: "Absent", color: "#f472b6" },
];

export const ADMIN_ATTENDANCE_STATUS_CHART = [
  { label: "Present", value: 16, color: "#22c55e" },
  { label: "Absent", value: 2, color: "#f472b6" },
  { label: "Late", value: 4, color: "#f97316" },
  { label: "On Leave", value: 2, color: "#3b82f6" },
];

export const ADMIN_NINE_HR_DEPT_CHART = [
  { label: "Engineering", value: 7, color: "#22c55e" },
  { label: "Sales", value: 2, color: "#22c55e" },
  { label: "Finance", value: 2, color: "#f97316" },
  { label: "HR", value: 2, color: "#22c55e" },
  { label: "Operations", value: 2, color: "#f97316" },
  { label: "Marketing", value: 1, color: "#22c55e" },
];

export const ADMIN_EARLY_LOGOUT_DEPT_CHART = [
  { label: "Sales", value: 1, color: "#f97316" },
  { label: "Finance", value: 1, color: "#f97316" },
  { label: "Operations", value: 1, color: "#f97316" },
  { label: "HR", value: 1, color: "#f97316" },
];
