const CURRENT_YEAR = new Date().getFullYear();

export const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

export const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
