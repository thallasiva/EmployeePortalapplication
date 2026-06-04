export const REGULARIZATION_TIMES = {
  checkIn: "10:00 AM",
  checkOut: "07:00 PM",
  production: "9 Hrs",
  hours: "9.0h",
};

export function applyAttendanceRegularization(employee) {
  return {
    ...employee,
    checkIn: REGULARIZATION_TIMES.checkIn,
    checkOut: REGULARIZATION_TIMES.checkOut,
    hours: REGULARIZATION_TIMES.hours,
    production: REGULARIZATION_TIMES.production,
    productionGood: true,
    nineHrMet: true,
    regularized: true,
    late: "0 Min",
    lateBy: null,
    status:
      employee.status === "Late"
        ? "Present"
        : employee.status === "late"
          ? "present"
          : employee.status,
  };
}

export function enrichAdminEmployee(employee) {
  const isAbsent = employee.status === "absent" || employee.status === "leave";
  return {
    ...employee,
    break: employee.break ?? "30 Min",
    late: employee.late ?? (employee.lateBy || "0 Min"),
    overtime: employee.overtime ?? "0 Min",
    production:
      employee.production ??
      (isAbsent ? "0 Hrs" : `${employee.hours.replace("h", "")} Hrs`),
    productionGood: employee.nineHrMet ?? false,
    regularized: employee.regularized ?? false,
  };
}

export function enrichReportAttendanceRow(row) {
  return {
    id: row.id ?? `${row.name}-${row.date}`,
    ...row,
    regularized: row.regularized ?? false,
  };
}
