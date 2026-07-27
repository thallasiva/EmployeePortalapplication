export const MONTH_OPTIONS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
].map((label, idx) => ({ value: idx + 1, label }));

export function getYearOptions() {
  const current = new Date().getFullYear();
  return [current - 1, current, current + 1];
}
