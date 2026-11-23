import { WIDGET_CATALOG } from "./WIDGET_CATALOG";
const BRAND = "#e87500";
const SOURCES = ["Employees", "Attendance", "Leave", "Payroll", "Recruitment", "Performance", "Helpdesk"];
const DASHBOARD_ROLES = ["Admin", "Employee", "HR Manager", "Recruiter", "Reporting Manager", "Recruiter Team Lead"];
const isPublished = value => value === true || Number(value) === 1;
let _wid = 100;
const mkWidget = type => {
  const cat = WIDGET_CATALOG.find(w => w.type === type) || WIDGET_CATALOG[0];
  return {
    id: _wid++,
    type,
    label: cat.label,
    source: SOURCES[0],
    color: BRAND,
    span: cat.w === 2 ? "col-span-2" : "col-span-1",
    rows: cat.h === 2 ? "row-span-2" : "row-span-1"
  };
};
/* ── Widget visual preview ── */
export { BRAND, SOURCES, DASHBOARD_ROLES, isPublished, _wid, mkWidget };
