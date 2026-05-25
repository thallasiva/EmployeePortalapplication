import { STATIC_DEPARTMENTS, STATIC_EMPLOYEES } from "./staticData";

const BLOOD_GROUPS = ["A +ve", "B +ve", "O +ve", "AB +ve", "A -ve"];
const LOCATIONS = ["Hyderabad", "Bangalore", "Chennai", "Mumbai"];
const HOLIDAY_CALENDARS = ["India - Default", "Telangana", "Karnataka"];

export const PEOPLE_FILTER_DEFAULTS = {
  location: "all",
  department: "all",
  holidayCalendar: "all",
};

export function getPeopleFilterOptions() {
  return {
    locations: [
      { value: "all", label: "All" },
      ...LOCATIONS.map((loc) => ({ value: loc, label: loc })),
    ],
    departments: [
      { value: "all", label: "All" },
      ...STATIC_DEPARTMENTS.map((d) => ({
        value: String(d.department_id),
        label: d.department_name,
      })),
    ],
    holidayCalendars: [
      { value: "all", label: "All" },
      ...HOLIDAY_CALENDARS.map((c) => ({ value: c, label: c })),
    ],
  };
}

export function formatEmployeeCode(employeeId) {
  return `#2022040${String(employeeId).padStart(3, "0")}`;
}

export function getPeopleDirectory() {
  return STATIC_EMPLOYEES.filter((e) => e.role !== 1).map((emp, index) => {
    const lastName = emp.lasst_name || emp.last_name || "";
    const name = `${emp.first_name} ${lastName}`.trim();
    const dept = STATIC_DEPARTMENTS.find(
      (d) => d.department_id === emp.department_id
    );
    return {
      id: emp.employee_id,
      empCode: formatEmployeeCode(emp.employee_id),
      name,
      email: emp.email,
      mobile: emp.mobile,
      jobTitle: emp.emp_job_title,
      reportingTo: emp.reporting_to,
      departmentId: emp.department_id,
      departmentName: dept?.department_name ?? "—",
      location: LOCATIONS[index % LOCATIONS.length],
      holidayCalendar: HOLIDAY_CALENDARS[index % HOLIDAY_CALENDARS.length],
      bloodGroup: BLOOD_GROUPS[index % BLOOD_GROUPS.length],
      status: emp.employee_status,
    };
  });
}

export function filterPeopleByCriteria(people, filters) {
  return people.filter((p) => {
    if (filters.location !== "all" && p.location !== filters.location) {
      return false;
    }
    if (
      filters.department !== "all" &&
      String(p.departmentId) !== filters.department
    ) {
      return false;
    }
    if (
      filters.holidayCalendar !== "all" &&
      p.holidayCalendar !== filters.holidayCalendar
    ) {
      return false;
    }
    return true;
  });
}
