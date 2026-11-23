const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const APPRAISAL_PERIOD = "FY 2025 – 2026";
function getInitials(name) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}
const APPRAISAL_ATTENDANCE = [{
  id: 101,
  name: "A V Sowmya",
  designation: "Software Engineer",
  department: "Engineering",
  shift: "general",
  presentDays: 22,
  absentDays: 0,
  lateDays: 1,
  halfDays: 0,
  totalHours: "201.4h",
  avgDailyHours: "9.2h",
  leaveBalance: 12,
  attendanceRate: 100,
  lastCheckIn: "09:02",
  lastCheckOut: "18:15",
  status: "present"
}, {
  id: 102,
  name: "Alex Kumar",
  designation: "Software Engineer",
  department: "Engineering",
  shift: "mid",
  presentDays: 20,
  absentDays: 1,
  lateDays: 4,
  halfDays: 1,
  totalHours: "172.0h",
  avgDailyHours: "8.6h",
  leaveBalance: 8,
  attendanceRate: 91,
  lastCheckIn: "13:35",
  lastCheckOut: "22:10",
  status: "late"
}, {
  id: 103,
  name: "Priya Sharma",
  designation: "HR Executive",
  department: "Human Resources",
  shift: "night",
  presentDays: 21,
  absentDays: 1,
  lateDays: 0,
  halfDays: 0,
  totalHours: "186.9h",
  avgDailyHours: "8.9h",
  leaveBalance: 15,
  attendanceRate: 95,
  lastCheckIn: "22:05",
  lastCheckOut: "07:00",
  status: "present"
}, {
  id: 104,
  name: "Rahul Mehta",
  designation: "Senior Developer",
  department: "Engineering",
  shift: "general",
  presentDays: 18,
  absentDays: 4,
  lateDays: 2,
  halfDays: 0,
  totalHours: "153.0h",
  avgDailyHours: "8.5h",
  leaveBalance: 5,
  attendanceRate: 82,
  lastCheckIn: "--:--",
  lastCheckOut: "--:--",
  status: "absent"
}];
const STATUS_BADGE = {
  present: "approved",
  absent: "rejected",
  late: "pending"
};
const STATUS_LABEL = {
  present: "Present",
  absent: "Absent",
  late: "Late"
};
export { MONTHS, APPRAISAL_PERIOD, getInitials, APPRAISAL_ATTENDANCE, STATUS_BADGE, STATUS_LABEL };
