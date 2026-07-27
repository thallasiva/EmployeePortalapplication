



export const SHIFT_LABEL = {
  general: "General Shift",
  mid: "Mid Shift",
  night: "Night Shift"
};

export const RM_TEAM_MEMBERS = [
{
  id: 101,
  name: "A V Sowmya",
  department: "Engineering",
  designation: "Software Engineer",
  shift: "general",
  status: "present",
  checkIn: "09:02",
  checkOut: "18:15",
  hours: "9.2h",
  late: false
},
{
  id: 102,
  name: "Alex Kumar",
  department: "Engineering",
  designation: "Software Engineer",
  shift: "mid",
  status: "late",
  checkIn: "13:35",
  checkOut: "22:10",
  hours: "8.6h",
  late: true,
  lateBy: "35 min"
},
{
  id: 103,
  name: "Priya Sharma",
  department: "Human Resources",
  designation: "HR Executive",
  shift: "night",
  status: "present",
  checkIn: "22:05",
  checkOut: "07:00",
  hours: "8.9h",
  late: false
},
{
  id: 104,
  name: "Rahul Mehta",
  department: "Engineering",
  designation: "Senior Developer",
  shift: "general",
  status: "absent",
  checkIn: "--:--",
  checkOut: "--:--",
  hours: "0h",
  late: false
}];



export const RM_LEAVE_REQUESTS = [
{
  id: 1,
  employee: "A V Sowmya",
  type: "Sick Leave",
  from: "12 Jun 2026",
  to: "13 Jun 2026",
  days: 2,
  reason: "Fever",
  appliedOn: "10 Jun 2026",
  status: "Pending"
},
{
  id: 2,
  employee: "Alex Kumar",
  type: "Casual Leave",
  from: "15 Jun 2026",
  to: "15 Jun 2026",
  days: 1,
  reason: "Personal work",
  appliedOn: "09 Jun 2026",
  status: "Pending"
},
{
  id: 3,
  employee: "Rahul Mehta",
  type: "Earned Leave",
  from: "20 Jun 2026",
  to: "24 Jun 2026",
  days: 5,
  reason: "Family vacation",
  appliedOn: "08 Jun 2026",
  status: "Approved"
}];



export const RM_REGULARIZATION_REQUESTS = [
{
  id: 1,
  employee: "Alex Kumar",
  date: "08 Jun 2026",
  reason: "Forgot to punch out",
  requestedCheckIn: "13:30",
  requestedCheckOut: "22:00",
  appliedOn: "09 Jun 2026",
  status: "Pending"
},
{
  id: 2,
  employee: "Priya Sharma",
  date: "05 Jun 2026",
  reason: "System issue at login",
  requestedCheckIn: "22:00",
  requestedCheckOut: "07:00",
  appliedOn: "06 Jun 2026",
  status: "Pending"
},
{
  id: 3,
  employee: "A V Sowmya",
  date: "01 Jun 2026",
  reason: "Late login due to traffic",
  requestedCheckIn: "09:00",
  requestedCheckOut: "18:00",
  appliedOn: "02 Jun 2026",
  status: "Approved"
}];


export function getRmTeamSummary() {
  const total = RM_TEAM_MEMBERS.length;
  const present = RM_TEAM_MEMBERS.filter((m) => m.status === "present").length;
  const absent = RM_TEAM_MEMBERS.filter((m) => m.status === "absent").length;
  const late = RM_TEAM_MEMBERS.filter((m) => m.late).length;
  const pendingLeave = RM_LEAVE_REQUESTS.filter((r) => r.status === "Pending").length;
  const pendingRegularizations = RM_REGULARIZATION_REQUESTS.filter(
    (r) => r.status === "Pending"
  ).length;

  return {
    total,
    present,
    absent,
    late,
    pendingLeave,
    pendingRegularizations,
    attendanceRate: total ? Math.round(present / total * 100) : 0
  };
}
