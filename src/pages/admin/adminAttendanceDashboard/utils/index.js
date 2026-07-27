export function mapAttendanceRow(row) {
  const workHours = row.work_hours != null ? Number(row.work_hours) : 0;
  return {
    id: row.attendance_id ?? row.employee_id,
    name: (row.employee_name || "").trim() || "—",
    department: row.department_name || "—",
    status: row.status || "absent",
    checkIn: row.check_in ? String(row.check_in).slice(0, 5) : "--:--",
    checkOut: row.check_out ? String(row.check_out).slice(0, 5) : "--:--",
    hours: `${workHours.toFixed(1)}h`,
    nineHrMet: workHours >= 9,
    lateBy: row.late_by_minutes ? `${row.late_by_minutes} min` : null,
  };
}

export function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
