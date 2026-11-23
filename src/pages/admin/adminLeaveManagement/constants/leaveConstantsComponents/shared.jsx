const B = "#e87500";
const BD = "#d97000";
const BL = "#fff8f0";
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR + 1, CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LEAVE_COLORS = [{
  bg: "#fff8f0",
  border: "#e87500",
  text: "#92400e"
}, {
  bg: "#f0fdf4",
  border: "#16a34a",
  text: "#14532d"
}, {
  bg: "#fff7ed",
  border: "#e87500",
  text: "#7c3d00"
}, {
  bg: "#f5f3ff",
  border: "#7c3aed",
  text: "#3b0764"
}, {
  bg: "#fff1f2",
  border: "#e11d48",
  text: "#881337"
}, {
  bg: "#fffbeb",
  border: "#d97706",
  text: "#78350f"
}];
export { B, BD, BL, CURRENT_YEAR, YEARS, MON, DAYS, LEAVE_COLORS };
